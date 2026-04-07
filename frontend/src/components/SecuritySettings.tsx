import { useState, useEffect } from 'react';
import { api } from '../services/api';
import TwoFactorSetup from './TwoFactorSetup';

export default function SecuritySettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<{ enabled: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const loadStatus = async () => {
    try {
      const { data } = await api.get('/auth/2fa/status');
      setStatus(data);
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    const password = prompt('Para desactivar 2FA, ingresa tu contraseña:');
    if (!password) return;
    try {
      await api.post('/auth/2fa/disable', { password });
      alert('2FA desactivado correctamente');
      loadStatus();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al desactivar');
    }
  };

  return (
    <>
      <button 
        className="btn-secondary" 
        onClick={() => setIsOpen(true)}
        style={{ padding: '8px 12px', fontSize: 13 }}
        title="Configuración de Seguridad"
      >
        🔐
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
          padding: 20
        }}>
          <div style={{
            background: '#111827',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 600,
            position: 'relative'
          }}>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'transparent', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer'
              }}
            >✕</button>

            <h2 style={{ marginTop: 0, marginBottom: 24 }}>⚙️ Configuración de Seguridad</h2>

            {loading ? (
              <p>Cargando...</p>
            ) : status?.enabled ? (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: 20, borderRadius: 12 }}>
                <h3 style={{ color: '#10b981', marginTop: 0 }}>✓ Autenticación de Dos Pasos Activa</h3>
                <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 20 }}>
                  Tu cuenta está protegida. Se te pedirá un código de tu aplicación autenticadora cada vez que inicies sesión.
                </p>
                <button className="btn-secondary" onClick={handleDisable} style={{ color: '#ef4444', borderColor: '#ef4444' }}>
                  Desactivar 2FA
                </button>
              </div>
            ) : (
              <TwoFactorSetup onComplete={() => {
                alert('¡2FA configurado y activado exitosamente!');
                loadStatus();
              }} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
