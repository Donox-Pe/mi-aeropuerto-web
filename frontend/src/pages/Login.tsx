import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import TwoFactorLogin from '../components/TwoFactorLogin';
import { gsap } from 'gsap';

function LoginInner() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const navigate = useNavigate();
  const location = useLocation() as any;
  const from = location.state?.from?.pathname as string | undefined;

  const [requires2fa, setRequires2fa] = useState(false);
  const [tempUserId, setTempUserId] = useState<number | null>(null);

  const [requiresVerification, setRequiresVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState('');

  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // GSAP entrance animation
  useEffect(() => {
    const tl = gsap.timeline();
    if (logoRef.current) {
      tl.fromTo(logoRef.current,
        { opacity: 0, y: -30, scale: 0.85 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: 'power3.out' }
      );
    }
    if (cardRef.current) {
      tl.fromTo(cardRef.current,
        { opacity: 0, y: 40, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out' },
        '-=0.5'
      );
    }
  }, []);

  // Animate when switching between login/register
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, x: isRegister ? 20 : -20 },
        { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out' }
      );
    }
  }, [isRegister]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      if (isRegister) {
        const { data } = await api.post('/auth/register', { email, password, fullName, role: 'PASSENGER' });
        if (data.requiresVerification) {
          setRequiresVerification(true);
          setVerifyingEmail(email);
          setError(null);
        } else {
          setIsRegister(false);
          alert('Cuenta creada. Ahora inicia sesión.');
        }
      } else {
        const result = await login(email, password) as any;

        if (result.requires2FA) {
          setRequires2fa(true);
          setTempUserId(result.tempUserId);
          return;
        }

        const rolePath = result.role === 'ADMIN' ? '/admin' : result.role === 'AGENT' ? '/agent' : '/passenger';
        navigate(from || rolePath, { replace: true });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || (isRegister ? 'Error al registrarse' : 'Error al iniciar sesión');
      setError(msg);
      if (cardRef.current) {
        gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
      }
      if (err?.response?.status === 403 && !isRegister) {
        setVerifyingEmail(email);
        setRequiresVerification(true);
      }
    }
  }

  async function handleVerify2FA(token: string) {
    try {
      const { data } = await api.post('/auth/2fa/validate', { userId: tempUserId, token });
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = from || (data.user.role === 'ADMIN' ? '/admin' : data.user.role === 'AGENT' ? '/agent' : '/passenger');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código 2FA inválido');
    }
  }

  async function onVerifyEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/auth/verify-email', { email: verifyingEmail, code: verificationCode });
      setRequiresVerification(false);
      setIsRegister(false);
      setVerificationCode('');
      alert('¡Cuenta verificada! Ahora puedes iniciar sesión.');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Error al verificar el correo');
    }
  }

  return (
    <div className="auth-wrapper" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Decorative orbs */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none', zIndex: 0
      }} />

      {requires2fa && (
        <TwoFactorLogin
          onVerify={handleVerify2FA}
          onCancel={() => { setRequires2fa(false); setTempUserId(null); }}
          isLoading={false}
        />
      )}

      <div ref={cardRef} className="auth-card login-premium-card">
        {/* Premium top accent line */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 3,
          background: 'linear-gradient(90deg, #3b82f6 0%, #8b5cf6 50%, #3b82f6 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
          borderRadius: '12px 12px 0 0'
        }} />

        <div ref={logoRef} style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <img src="/LOGO.png" alt="AEROAZTECA" style={{ height: '70px', maxWidth: '100%', objectFit: 'contain' }} />
        </div>
        <p className="subtitle" style={{ marginBottom: 20, fontSize: 13 }}>
          {requiresVerification ? 'Verificación de correo' : isRegister ? 'Crea tu cuenta de vuelo' : 'Accede a tu cuenta'}
        </p>

        {error && (
          <div className="error-chip" style={{ animation: 'fadeIn 0.3s ease' }}>
            {error}
          </div>
        )}

        {requiresVerification ? (
          <form onSubmit={onVerifyEmail} className="form">
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
              Ingresa el código de 6 dígitos que enviamos a <strong style={{ color: '#60a5fa' }}>{verifyingEmail}</strong>
            </p>
            <label>Código de verificación</label>
            <input
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              type="text"
              placeholder="123456"
              maxLength={6}
              required
              style={{ textAlign: 'center', fontSize: 22, letterSpacing: '0.3em', fontWeight: 'bold' }}
            />
            <button type="submit" className="btn-primary btn-premium">Verificar Cuenta</button>
            <button
              type="button"
              className="btn-secondary"
              style={{ marginTop: 4 }}
              onClick={async () => {
                setError(null);
                try {
                  const { data } = await api.post('/auth/resend-verification', { email: verifyingEmail });
                  alert(data.message);
                } catch (err: any) {
                  setError(err?.response?.data?.message || 'Error al reenviar el código');
                }
              }}
            >
              Reenviar código
            </button>
            <button
              type="button"
              className="btn-link"
              style={{ marginTop: 12, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}
              onClick={() => { setRequiresVerification(false); setIsRegister(true); }}
            >
              ← Regresar al registro
            </button>
          </form>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} className="form">
            {isRegister && (
              <>
                <label>Nombre completo</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} type="text" placeholder="Tu nombre completo" required />
              </>
            )}
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="usuario@aeroazteca.com" required />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ margin: 0 }}>Contraseña</label>
              <Link to="/forgot-password" style={{ color: '#60a5fa', fontSize: 12, textDecoration: 'none' }}>¿Olvidaste tu contraseña?</Link>
            </div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="••••••••" required />

            <button type="submit" className="btn-primary btn-premium" style={{ marginTop: 4 }}>
              {isRegister ? '✈ Registrarse' : '→ Ingresar'}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
            >
              {isRegister ? 'Ya tengo cuenta — Iniciar sesión' : 'Crear cuenta nueva (pasajero)'}
            </button>
            <div className="hint" style={{ marginTop: 4, fontSize: 11, letterSpacing: '0.15em', opacity: 0.5 }}>AEROAZTECA © 2025</div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Login() { return <LoginInner />; }
