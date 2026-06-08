import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../services/api';

export default function ProfileSettings() {
  const { user, updateUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (password && password.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden.' });
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.updateProfile({
        fullName: fullName.trim() || undefined,
        password: password || undefined,
      });

      updateUser(response.user);
      setMessage({ type: 'success', text: '¡Perfil actualizado con éxito!' });
      setPassword('');
      setConfirmPassword('');
      
      // Cerrar modal automáticamente después de 1.5 segundos
      setTimeout(() => {
        setIsOpen(false);
        setMessage(null);
      }, 1500);

    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Error al actualizar el perfil.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        className="btn-secondary" 
        onClick={() => setIsOpen(true)}
        style={{ padding: '8px 12px', fontSize: 13 }}
        title="Configuración de Perfil"
      >
        👤
      </button>

      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 10000,
          padding: 20,
          backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            background: '#111827',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 16,
            padding: 32,
            width: '100%',
            maxWidth: 500,
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
          }}>
            <button
              onClick={() => {
                setIsOpen(false);
                setMessage(null);
                setPassword('');
                setConfirmPassword('');
              }}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'transparent', border: 'none', color: '#64748b', fontSize: 24, cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#64748b'}
            >✕</button>

            <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 22, fontWeight: 800 }}>👤 Perfil del Usuario</h2>

            {user && (
              <div style={{
                background: 'rgba(255,255,255,0.03)',
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 24,
                fontSize: 13,
                color: '#94a3b8'
              }}>
                <div style={{ marginBottom: 6 }}>
                  <strong style={{ color: '#fff' }}>Correo:</strong> {user.email}
                </div>
                <div style={{ marginBottom: 6 }}>
                  <strong style={{ color: '#fff' }}>Rol de Acceso:</strong> {user.role === 'ADMIN' ? 'Administrador' : user.role === 'AGENT' ? 'Agente' : 'Pasajero'}
                </div>
                {user.role === 'PASSENGER' && (
                  <div>
                    <strong style={{ color: '#fff' }}>Nivel de Lealtad:</strong> <span style={{ color: '#60a5fa', fontWeight: 'bold' }}>{user.loyaltyTier || 'BRONZE'}</span> ({user.loyaltyPoints || 0} pts)
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="form" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#1f2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)', margin: '4px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Nueva Contraseña (opcional)</label>
                <input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#1f2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: '#1f2937',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              {message && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  background: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                  border: message.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
                  color: message.type === 'success' ? '#10b981' : '#f87171',
                  textAlign: 'center'
                }}>
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  padding: '12px',
                  borderRadius: 8,
                  fontWeight: 'bold',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  marginTop: 8,
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => { if(!loading) e.currentTarget.style.opacity = '0.9'; }}
                onMouseLeave={(e) => { if(!loading) e.currentTarget.style.opacity = '1'; }}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
