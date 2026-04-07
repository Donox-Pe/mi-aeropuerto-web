import { useState, useRef, useEffect } from 'react';

interface Props {
  onVerify: (token: string) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  error?: string;
}

export default function TwoFactorLogin({ onVerify, onCancel, isLoading, error }: Props) {
  const [token, setToken] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.length === 6) {
      onVerify(token);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setToken(val);
    if (val.length === 6) {
      onVerify(val); // Auto submit when 6 digits are entered
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#111827', padding: '32px', borderRadius: '16px',
        border: '1px solid rgba(220,38,38,0.5)', width: '100%', maxWidth: '360px',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#fff', marginTop: 0, marginBottom: 8 }}>Verificación en 2 Pasos</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>
          Ingresa el código de 6 dígitos generado por tu aplicación autenticadora.
        </p>

        {error && <div style={{ color: '#ef4444', marginBottom: 16, fontSize: 14 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={token}
            onChange={handleChange}
            placeholder="000000"
            disabled={isLoading}
            style={{
              background: '#1e293b',
              border: '2px solid #475569',
              color: '#fff',
              padding: '16px',
              borderRadius: '12px',
              width: '100%',
              fontSize: 32,
              letterSpacing: 8,
              textAlign: 'center',
              boxSizing: 'border-box',
              marginBottom: 16,
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#dc2626'}
            onBlur={e => e.target.style.borderColor = '#475569'}
          />

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              style={{
                flex: 1, padding: '12px', background: 'transparent',
                border: '1px solid #475569', color: '#fff', borderRadius: '8px', cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || token.length !== 6}
              style={{
                flex: 1, padding: '12px', background: '#dc2626',
                border: 'none', color: '#fff', borderRadius: '8px',
                cursor: (isLoading || token.length !== 6) ? 'not-allowed' : 'pointer',
                fontWeight: 'bold'
              }}
            >
              {isLoading ? 'Verificando...' : 'Verificar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
