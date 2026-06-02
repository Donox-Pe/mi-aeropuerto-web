import { useNavigate } from 'react-router-dom';

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="auth-wrapper">
      
      <div className="auth-card" style={{ maxWidth: 500, textAlign: 'center', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
        <div style={{ fontSize: 72, marginBottom: 24 }}>🛡️</div>
        <h2 style={{ color: '#fff', marginBottom: 16, fontSize: 28 }}>Pago No Completado</h2>
        <p style={{ color: '#94a3b8', fontSize: 16, lineHeight: '1.6', marginBottom: 32 }}>
          Has regresado del portal de pagos sin completar la transacción. 
          No te preocupes, <strong>tu lugar sigue reservado</strong> pero está en espera de pago.
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button 
            className="btn-primary" 
            onClick={() => navigate('/passenger/my-flights')} 
            style={{ width: '100%', padding: '16px', fontSize: 16, background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' }}
          >
            Ver mis vuelos (Pagar en efectivo/tarjeta)
          </button>
          
          <button 
            className="btn-secondary" 
            onClick={() => navigate('/passenger/flights')} 
            style={{ width: '100%', padding: '12px' }}
          >
            Explorar otros vuelos
          </button>
        </div>

        <p style={{ marginTop: 24, fontSize: 13, color: '#64748b' }}>
          Recuerda: Las reservas pendientes se liberan automáticamente si no se confirma el pago en 24 horas.
        </p>
      </div>
    </div>
  );
}
