import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import TwoFactorLogin from '../components/TwoFactorLogin';

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
      setError(err?.response?.data?.message || (isRegister ? 'Error al registrarse' : 'Error al iniciar sesión'));
    }
  }
  async function handleVerify2FA(token: string) {
    try {
      const { data } = await api.post('/auth/2fa/validate', { userId: tempUserId, token });
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      // Reload force para que se inicialice useAuth y el socket
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
    <div className="auth-wrapper">
      {requires2fa && (
        <TwoFactorLogin 
          onVerify={handleVerify2FA} 
          onCancel={() => { setRequires2fa(false); setTempUserId(null); }} 
          isLoading={false} 
        />
      )}
      <div className="auth-card">
        <h1>AEROAZTECA</h1>
        <p className="subtitle">Accede a tu cuenta</p>
        {error && <div className="error-chip">{error}</div>}
        {requiresVerification ? (
          <form onSubmit={onVerifyEmail} className="form">
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>
              Ingresa el código de 6 dígitos que enviamos a <strong>{verifyingEmail}</strong> para activar tu cuenta.
            </p>
            <label>Código de verificación</label>
            <input 
              value={verificationCode} 
              onChange={(e) => setVerificationCode(e.target.value)} 
              type="text" 
              placeholder="123456" 
              maxLength={6}
              required 
            />
            <button type="submit" className="btn-primary">Verificar Cuenta</button>
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={() => { setRequiresVerification(false); setIsRegister(true); }}
            >
              Regresar al registro
            </button>
          </form>
        ) : (
          <form onSubmit={onSubmit} className="form">
            {isRegister && (
              <>
                <label>Nombre completo</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} type="text" placeholder="Tu nombre completo" required />
              </>
            )}
            <label>Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="admin@airport.com" required />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ margin: 0 }}>Contraseña</label>
              <Link to="/forgot-password" style={{ color: '#94a3b8', fontSize: 12, textDecoration: 'none' }}>¿Olvidaste tu contraseña?</Link>
            </div>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="********" required />
            
            <button type="submit" className="btn-primary">{isRegister ? 'Registrarse' : 'Ingresar'}</button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => { setIsRegister(!isRegister); setError(null); }}
            >
              {isRegister ? 'Ya tengo cuenta, iniciar sesión' : 'Crear cuenta nueva (pasajero)'}
            </button>
            <div className="hint">@AEROAZTECA</div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Login() { return <LoginInner />; }


