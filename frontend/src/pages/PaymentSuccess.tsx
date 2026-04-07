import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import PixelBlast from '../components/PixelBlast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [amount, setAmount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const checkStatus = async () => {
      try {
        const { data } = await api.get(`/stripe/session/${sessionId}`);
        if (data.status === 'paid') {
          setStatus('success');
          setAmount(data.amountTotal);
        } else {
          // Si aún no está completado, reintentar en 2s (el webhook podría tardar)
          setTimeout(checkStatus, 2000);
        }
      } catch (err) {
        setStatus('error');
      }
    };

    checkStatus();
  }, [sessionId]);

  return (
    <div className="auth-wrapper">
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: '#000' }}>
        <PixelBlast variant="plane" color="#10b981" />
      </div>
      
      <div className="auth-card" style={{ maxWidth: 400, textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div style={{ width: 48, height: 48, border: '4px solid #1f2937', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 20px' }} />
            <h2 style={{ color: '#fff' }}>Procesando tu pago...</h2>
            <p style={{ color: '#94a3b8' }}>Por favor no cierres esta ventana</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 20 }}>✅</div>
            <h2 style={{ color: '#10b981', marginBottom: 8 }}>¡Pago Exitoso!</h2>
            <p style={{ color: '#e2e8f0', fontSize: 18, marginBottom: 24 }}>
              Pagaste MXN ${amount.toLocaleString('es-MX')}
            </p>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 32 }}>
              Tu reserva ha sido aprobada y tu asiento asegurado. Recibirás tu boleto por correo electrónico en breve.
            </p>
            <button className="btn-primary" onClick={() => navigate('/passenger')} style={{ background: '#10b981' }}>
              Ver mis vuelos
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div style={{ fontSize: 64, marginBottom: 20 }}>❌</div>
            <h2 style={{ color: '#ef4444', marginBottom: 8 }}>Error en el pago</h2>
            <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 32 }}>
              No pudimos verificar el estado de tu pago. Si el cargo se realizó, por favor contacta a soporte.
            </p>
            <button className="btn-primary" onClick={() => navigate('/passenger')}>
              Volver al inicio
            </button>
          </>
        )}
      </div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
