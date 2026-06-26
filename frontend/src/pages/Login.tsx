import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import TwoFactorLogin from '../components/TwoFactorLogin';
import { gsap } from 'gsap';
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

function LoginInner() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // GSAP entrance animation
  useEffect(() => {
    const tl = gsap.timeline();
    if (panelRef.current) {
      tl.fromTo(panelRef.current,
        { opacity: 0, x: -50 },
        { opacity: 1, x: 0, duration: 1, ease: 'power3.out' }
      );
    }
  }, []);

  // Animate when switching between login/register
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(formRef.current,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
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
      if (panelRef.current) {
        gsap.fromTo(panelRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
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
    <div className="login-bg-wrapper">
      {requires2fa && (
        <TwoFactorLogin
          onVerify={handleVerify2FA}
          onCancel={() => { setRequires2fa(false); setTempUserId(null); }}
          isLoading={false}
        />
      )}

      <div ref={panelRef} className="login-glass-panel">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <img src="/LOGO.png" alt="AeroAzteca" style={{ height: '75px', objectFit: 'contain', marginBottom: '8px' }} />
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>Airline Management System</h2>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', color: '#0f172a', fontWeight: '700' }}>
            {requiresVerification ? 'Verify Email' : isRegister ? 'Create Account' : 'Welcome Back'}
          </h1>
          <p style={{ margin: 0, color: '#64748b', fontSize: '15px' }}>
            {requiresVerification ? 'Enter the code sent to your email.' : isRegister ? 'Sign up to book your next flight.' : 'Sign in to manage your operations.'}
          </p>
        </div>

        {error && (
          <div className="error-chip" style={{ animation: 'fadeIn 0.3s ease' }}>
            {error}
          </div>
        )}

        {requiresVerification ? (
          <form onSubmit={onVerifyEmail} className="form-premium">
            <p style={{ color: '#64748b', fontSize: 13, marginBottom: 12, lineHeight: 1.5 }}>
              Enter the 6-digit code sent to <strong style={{ color: '#3b82f6' }}>{verifyingEmail}</strong>
            </p>
            <label>Verification Code</label>
            <div className="input-group">
              <input
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                type="text"
                placeholder="123456"
                maxLength={6}
                required
                style={{ textAlign: 'center', fontSize: 22, letterSpacing: '0.3em', fontWeight: 'bold' }}
              />
            </div>
            <button type="submit" className="btn-primary-solid">Verify Account</button>
            <button
              type="button"
              className="btn-link"
              style={{ marginTop: 12, display: 'block', width: '100%', textAlign: 'center' }}
              onClick={async () => {
                setError(null);
                try {
                  const { data } = await api.post('/auth/resend-verification', { email: verifyingEmail });
                  alert(data.message);
                } catch (err: any) {
                  setError(err?.response?.data?.message || 'Error resending code');
                }
              }}
            >
              Resend code
            </button>
            <button
              type="button"
              className="btn-link"
              style={{ marginTop: 12, display: 'block', width: '100%', textAlign: 'center' }}
              onClick={() => { setRequiresVerification(false); setIsRegister(true); }}
            >
              ← Back to register
            </button>
          </form>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} className="form-premium">
            {isRegister && (
              <>
                <label>Full Name</label>
                <div className="input-group">
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} type="text" placeholder="Your Full Name" required />
                </div>
              </>
            )}
            <label>Email</label>
            <div className="input-group">
              <Mail className="input-icon" size={18} />
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Your Email Address" required />
            </div>

            <label>Password</label>
            <div className="input-group">
              <Lock className="input-icon" size={18} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} placeholder="Password" required />
              <button type="button" className="icon-btn-right" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-10px', marginBottom: '16px' }}>
              <Link to="/forgot-password" style={{ color: '#475569', fontSize: 13, textDecoration: 'none', fontWeight: '500' }}>Forgot Password?</Link>
            </div>

            <button type="submit" className="btn-primary-solid">
              {isRegister ? 'Sign Up' : 'Sign In'}
            </button>
            
            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#64748b' }}>
              {isRegister ? 'Already have an account? ' : "Don't have an account? "}
              <button
                type="button"
                className="btn-link-bold"
                onClick={() => { setIsRegister(!isRegister); setError(null); }}
              >
                {isRegister ? 'Sign In' : 'Contact Support'}
              </button>
            </div>
          </form>
        )}
        
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', marginTop: 'auto', paddingTop: '40px', color: '#94a3b8', fontSize: '13px' }}>
          <ShieldCheck size={16} />
          <span>Secure Login</span>
        </div>
      </div>
    </div>
  );
}

export default function Login() { return <LoginInner />; }
