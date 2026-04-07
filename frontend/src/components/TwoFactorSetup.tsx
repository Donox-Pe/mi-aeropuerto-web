import { useState } from 'react';
import { api } from '../services/api';

export default function TwoFactorSetup({ onComplete }: { onComplete: () => void }) {
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/2fa/setup');
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar configuración');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/2fa/verify', { token });
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#111827', padding: 24, borderRadius: 12, border: '1px solid rgba(220, 38, 38, 0.3)' }}>
      <h3 style={{ color: '#fff', marginTop: 0 }}>Autenticación en 2 Pasos (2FA)</h3>
      
      {error && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 14 }}>{error}</div>}

      {step === 1 ? (
        <div>
          <p style={{ color: '#94a3b8', fontSize: 14 }}>
            Mejora la seguridad de tu cuenta requiniendo un código de segundo factor cada vez que inicies sesión.
          </p>
          <button
            onClick={handleSetup}
            disabled={loading}
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: '10px 16px',
              borderRadius: 8,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {loading ? 'Cargando...' : 'Configurar 2FA'}
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ background: '#fff', padding: 12, borderRadius: 8 }}>
              {qrCode ? (
                <img src={qrCode} alt="QR Code" style={{ width: 150, height: 150 }} />
              ) : (
                <div style={{ width: 150, height: 150, background: '#f1f5f9' }} />
              )}
            </div>
            <div>
              <p style={{ color: '#e2e8f0', fontSize: 14, marginTop: 0 }}>1. Escanea este código QR con tu aplicación autenticadora (Google Authenticator, Authy, etc).</p>
              <p style={{ color: '#94a3b8', fontSize: 12 }}>Si no puedes escanearlo, ingresa este secreto manualmente:<br />
                <strong style={{ color: '#fff' }}>{secret}</strong>
              </p>
              
              <div style={{ marginTop: 16 }}>
                <p style={{ color: '#e2e8f0', fontSize: 14 }}>2. Ingresa el código de 6 dígitos generado:</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    value={token}
                    onChange={e => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    style={{
                      background: '#1e293b',
                      border: '1px solid #475569',
                      color: '#fff',
                      padding: '10px 12px',
                      borderRadius: 8,
                      width: 120,
                      fontSize: 16,
                      letterSpacing: 2,
                      textAlign: 'center'
                    }}
                  />
                  <button
                    onClick={handleVerify}
                    disabled={loading || token.length !== 6}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      padding: '0 16px',
                      borderRadius: 8,
                      cursor: (loading || token.length !== 6) ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Verificar y Activar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
