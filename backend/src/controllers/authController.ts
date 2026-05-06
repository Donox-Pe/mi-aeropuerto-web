import { Request, Response } from 'express';
import { prisma } from '../prisma/client.js';
import { comparePassword, hashPassword } from '../utils/hash.js';
import { signToken } from '../utils/jwt.js';
import { z } from 'zod';
import { generateTOTPSecret, generateQRDataURL, verifyTOTPToken } from '../services/twoFactorService.js';
import { generateResetCode, sendPasswordResetEmail, sendVerificationEmail } from '../services/passwordResetService.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 min

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// ─── LOGIN ───────────────────────────────────────────────────
export async function login(req: Request, res: Response) {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: 'Credenciales inválidas' });

  if (user.isVerified === false) {
    return res.status(403).json({ 
      message: 'Debes verificar tu correo electrónico antes de poder iniciar sesión. Revisa tu bandeja de entrada.' 
    });
  }

  // Verificar bloqueo por brute force
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesLeft = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    return res.status(423).json({
      message: `Cuenta bloqueada. Intenta en ${minutesLeft} minutos.`,
      lockedUntil: user.lockedUntil,
    });
  }

  const ok = await comparePassword(password, user.password);
  if (!ok) {
    // Incrementar intentos fallidos
    const attempts = user.loginAttempts + 1;
    const updateData: any = { loginAttempts: attempts };
    if (attempts >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MS);
      updateData.loginAttempts = 0;
    }
    await prisma.user.update({ where: { id: user.id }, data: updateData });

    const remaining = MAX_LOGIN_ATTEMPTS - attempts;
    return res.status(401).json({
      message: remaining > 0
        ? `Credenciales inválidas. ${remaining} intentos restantes.`
        : 'Cuenta bloqueada por demasiados intentos fallidos.',
    });
  }

  // Reset intentos en login exitoso y actualizar último acceso
  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null, lastLogin: new Date() },
  });

  // Si 2FA está habilitado, no dar token aún
  if (user.twoFactorEnabled) {
    return res.json({
      requires2FA: true,
      tempUserId: user.id,
      message: 'Se requiere código 2FA',
    });
  }

  const token = signToken({ sub: user.id, role: user.role });
  return res.json({
    token,
    user: { 
      id: user.id, 
      email: user.email, 
      fullName: user.fullName, 
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
      loyaltyTier: user.loyaltyTier
    },
  });
}

import dns from 'dns/promises';

// ─── REGISTER ────────────────────────────────────────────────
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(['ADMIN', 'AGENT', 'PASSENGER']).optional(),
});

export async function register(req: Request, res: Response) {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });
  const { email, password, fullName, role } = parsed.data;

  // 1. Validar que el dominio del correo realmente exista (rechazar correos falsos)
  if (process.env.SKIP_MX_CHECK !== 'true') {
    try {
      const domain = email.split('@')[1];
      const mxRecords = await dns.resolveMx(domain);
      if (!mxRecords || mxRecords.length === 0) {
        return res.status(400).json({ message: 'El dominio del correo no puede recibir mensajes. Usa un correo real.' });
      }
    } catch (error) {
      console.warn('DNS MX check failed:', error);
      return res.status(400).json({ message: 'El correo proporcionado parece ser falso o el dominio no responde.' });
    }
  }

  // 2. Verificar si ya está registrado
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: 'El email ya está registrado' });

  // 3. Crear usuario inactivo y generar código
  const hashed = await hashPassword(password);
  const code = generateResetCode();
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min
  
  const created = await prisma.user.create({ 
    data: { 
      email, 
      password: hashed, 
      fullName, 
      role: role ?? 'PASSENGER',
      isVerified: false,
      resetToken: code,
      resetTokenExpiry: expiry
    } 
  });

  // 4. Enviar correo de verificación
  let emailSent = true;
  let emailError = '';
  try {
    await sendVerificationEmail(email, code, fullName);
  } catch (err: any) {
    console.error('Error enviando correo de verificación:', err);
    emailSent = false;
    emailError = err.message;
  }

  return res.status(201).json({ 
    id: created.id, 
    requiresVerification: true, 
    email,
    emailSent,
    message: emailSent 
      ? 'Usuario registrado. Revisa tu correo.' 
      : `Usuario registrado, pero el correo falló: ${emailError}. Intenta reenviarlo.`
  });
}

// ─── VERIFY EMAIL ──────────────────────────────────────────────
const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

export async function verifyEmail(req: Request, res: Response) {
  const parsed = verifyEmailSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });

  const { email, code } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.resetToken !== code) {
    return res.status(400).json({ message: 'Código inválido o incorrecto.' });
  }

  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return res.status(400).json({ message: 'El código ha expirado. Por favor solicita uno nuevo.' });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isVerified: true,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return res.json({ message: 'Cuenta verificada correctamente. Ahora puedes iniciar sesión.' });
}

// ─── RESEND VERIFICATION ──────────────────────────────────────
const resendSchema = z.object({ email: z.string().email() });

export async function resendVerification(req: Request, res: Response) {
  const parsed = resendSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Email inválido' });

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Por seguridad, no revelamos si el email no existe
    return res.json({ message: 'Si el correo está registrado, recibirás un nuevo código.' });
  }

  if (user.isVerified) {
    return res.status(400).json({ message: 'Esta cuenta ya ha sido verificada.' });
  }

  const code = generateResetCode();
  const expiry = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: code, resetTokenExpiry: expiry },
  });

  try {
    await sendVerificationEmail(email, code, user.fullName);
    return res.json({ message: 'Se ha enviado un nuevo código de verificación.' });
  } catch (err: any) {
    console.error('Error re-enviando correo de verificación:', err);
    return res.status(500).json({ 
      message: 'Error al enviar el correo. Por favor intenta más tarde.',
      error: err.message
    });
  }
}

// ─── 2FA SETUP ───────────────────────────────────────────────
export async function setup2FA(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  if (user.twoFactorEnabled) return res.status(400).json({ message: '2FA ya está habilitado' });

  const { secret, uri } = generateTOTPSecret(user.email);
  const qrDataURL = await generateQRDataURL(uri);

  // Guardar secreto temporalmente (sin activar aún)
  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorSecret: secret },
  });

  return res.json({
    secret,
    qrCode: qrDataURL,
    message: 'Escanea el QR con Google Authenticator y verifica con un código',
  });
}

// ─── 2FA VERIFY (activar) ────────────────────────────────────
const verify2FASchema = z.object({ token: z.string().length(6) });

export async function verify2FA(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });

  const parsed = verify2FASchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'El código debe ser de 6 dígitos' });

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user || !user.twoFactorSecret) {
    return res.status(400).json({ message: 'Primero configura 2FA con /2fa/setup' });
  }

  const isValid = verifyTOTPToken(user.twoFactorSecret, parsed.data.token);
  if (!isValid) return res.status(400).json({ message: 'Código inválido. Intenta de nuevo.' });

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: true },
  });

  return res.json({ message: '2FA activado correctamente ✅' });
}

// ─── 2FA VALIDATE (durante login) ───────────────────────────
const validate2FASchema = z.object({
  userId: z.number().int().positive(),
  token: z.string().length(6),
});

export async function validate2FA(req: Request, res: Response) {
  const parsed = validate2FASchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return res.status(400).json({ message: '2FA no está configurado' });
  }

  const isValid = verifyTOTPToken(user.twoFactorSecret, parsed.data.token);
  if (!isValid) return res.status(401).json({ message: 'Código 2FA inválido' });

  const token = signToken({ sub: user.id, role: user.role });

  // Actualizar último acceso en 2FA
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  return res.json({
    token,
    user: { 
      id: user.id, 
      email: user.email, 
      fullName: user.fullName, 
      role: user.role,
      loyaltyPoints: user.loyaltyPoints,
      loyaltyTier: user.loyaltyTier
    },
  });
}

// ─── 2FA DISABLE ─────────────────────────────────────────────
export async function disable2FA(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });

  const passwordSchema = z.object({ password: z.string().min(6) });
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Se requiere contraseña' });

  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  const ok = await comparePassword(parsed.data.password, user.password);
  if (!ok) return res.status(401).json({ message: 'Contraseña incorrecta' });

  await prisma.user.update({
    where: { id: user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return res.json({ message: '2FA desactivado' });
}

// ─── 2FA STATUS ──────────────────────────────────────────────
export async function get2FAStatus(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });
  const user = await prisma.user.findUnique({ where: { id: req.user.sub } });
  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
  return res.json({ enabled: user.twoFactorEnabled });
}

// ─── FORGOT PASSWORD ─────────────────────────────────────────
const forgotSchema = z.object({ email: z.string().email() });

export async function forgotPassword(req: Request, res: Response) {
  const parsed = forgotSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Email inválido' });

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  // Siempre responder OK para no revelar si el email existe
  if (!user) {
    return res.json({ message: 'Si el email existe, recibirás un código de recuperación.' });
  }

  const code = generateResetCode();
  const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: code, resetTokenExpiry: expiry },
  });

  try {
    await sendPasswordResetEmail(user.email, code, user.fullName);
    return res.json({ message: 'Si el email existe, recibirás un código de recuperación.' });
  } catch (err: any) {
    console.error('Error enviando email de recuperación:', err.message);
    return res.status(500).json({ 
      message: 'Error al enviar el correo electrónico', 
      error: err.message,
      details: 'Revisa la configuración de SMTP en las variables de entorno.'
    });
  }
}

// ─── RESET PASSWORD ──────────────────────────────────────────
const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(6),
});

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Datos inválidos' });

  const { email, code, newPassword } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.resetToken !== code) {
    return res.status(400).json({ message: 'Código inválido o expirado' });
  }

  if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
    return res.status(400).json({ message: 'Código expirado. Solicita uno nuevo.' });
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
      loginAttempts: 0,
      lockedUntil: null,
    },
  });

  return res.json({ message: 'Contraseña actualizada correctamente ✅' });
}

// ─── GET ME ──────────────────────────────────────────────────
export async function getMe(req: Request, res: Response) {
  if (!req.user) return res.status(401).json({ message: 'No autorizado' });

  const user = await prisma.user.findUnique({
    where: { id: req.user.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      loyaltyPoints: true,
      loyaltyTier: true,
      twoFactorEnabled: true,
      lastLogin: true,
      createdAt: true
    }
  });

  if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

  return res.json(user);
}
