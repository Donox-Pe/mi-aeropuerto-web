import { useNavigate } from 'react-router-dom';
import PixelBlast from '../components/PixelBlast';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="auth-wrapper">
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, background: '#000' }}>
        <PixelBlast variant="plane" color="#dc2626" />
      </div>
      
      <div className="auth-card" style={{ maxWidth: 400, textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 20 }}>⚠️</div>
        <h2 style={{ color: '#fff', marginBottom: 8 }}>Pago Cancelado</h2>
        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 32 }}>
          Has cancelado el proceso de pago. Tu reserva sigue pendiente y puedes intentarlo de nuevo o pagar en efectivo en el aeropuerto.
        </p>
        <button className="btn-secondary" onClick={() => navigate('/passenger')} style={{ width: '100%' }}>
          Volver a mis vuelos
        </button>
      </div>
    </div>
  );
}
