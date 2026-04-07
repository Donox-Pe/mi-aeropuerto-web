import crypto from 'crypto';
import { sendTicketEmail } from './emailService.js';

/**
 * Genera un token de reset seguro (hex de 32 bytes).
 */
export function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Genera un código numérico de 6 dígitos para email.
 */
export function generateResetCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Envía email de recuperación de contraseña con código.
 */
export async function sendPasswordResetEmail(email: string, code: string, fullName: string): Promise<void> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 30px; border-radius: 12px; color: white; text-align: center;">
        <h2 style="margin: 0 0 10px; color: #dc2626;">✈️ AeroAzteca</h2>
        <p style="margin: 0; opacity: 0.8;">Recuperación de Contraseña</p>
      </div>
      <div style="padding: 24px; background: #f8f9fa; border-radius: 0 0 12px 12px;">
        <p>Hola <strong>${fullName}</strong>,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
        <div style="background: #111827; color: #dc2626; font-size: 32px; font-weight: bold; text-align: center; padding: 16px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p style="color: #666; font-size: 14px;">
          ⏰ Este código expira en <strong>15 minutos</strong>.<br>
          Si no solicitaste este cambio, ignora este correo.
        </p>
      </div>
    </div>
  `;

  await sendTicketEmail(email, '🔐 Código de Recuperación - AeroAzteca', html);
}
