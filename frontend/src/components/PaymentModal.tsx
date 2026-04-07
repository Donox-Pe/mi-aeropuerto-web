import { useState } from 'react';
import { PriceCalculation } from '../services/api';

interface PaymentModalProps {
  priceInfo: PriceCalculation;
  discountPercent?: number;
  onConfirm: (paymentMethod: 'EFECTIVO' | 'TARJETA' | 'STRIPE') => void;
  onCancel: () => void;
}

export default function PaymentModal({ priceInfo, discountPercent, onConfirm, onCancel }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<'EFECTIVO' | 'TARJETA' | 'STRIPE' | null>(null);
  const [processing, setProcessing] = useState(false);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);
  };

  const getDiscountedPrice = (originalPrice: number): number => {
    if (!discountPercent) return originalPrice;
    return Math.round(originalPrice * (1 - discountPercent / 100));
  };

  const finalPrice = discountPercent ? getDiscountedPrice(priceInfo.price) : priceInfo.price;

  const handleConfirm = async () => {
    if (!selectedMethod) {
      alert('Por favor selecciona un método de pago');
      return;
    }
    setProcessing(true);
    try {
      await onConfirm(selectedMethod);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div style={{
        background: '#111827',
        border: '2px solid #dc2626',
        borderRadius: '16px',
        padding: '32px',
        maxWidth: '500px',
        width: '100%',
        position: 'relative',
      }}>
        <button
          onClick={onCancel}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: '#fff',
            fontSize: 24,
            cursor: 'pointer',
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
        >
          ✕
        </button>

        <h2 style={{ margin: '0 0 24px 0', color: '#dc2626', fontSize: 24 }}>Método de Pago</h2>

        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 12, color: '#94a3b8', fontSize: 14 }}>Total a pagar:</div>
          {discountPercent ? (
            <div>
              <div style={{ fontSize: 16, textDecoration: 'line-through', opacity: 0.6, color: '#94a3b8', marginBottom: 4 }}>
                {priceInfo.formattedPrice}
              </div>
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#10b981' }}>
                {formatPrice(finalPrice)}
              </div>
              <div style={{ fontSize: 12, color: '#10b981', fontWeight: 'bold', marginTop: 4 }}>
                ¡Ahorras {formatPrice(priceInfo.price - finalPrice)}!
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 32, fontWeight: 'bold', color: '#dc2626' }}>
              {priceInfo.formattedPrice}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setSelectedMethod('EFECTIVO')}
            style={{
              padding: '16px',
              background: selectedMethod === 'EFECTIVO' ? '#dc2626' : 'transparent',
              border: `2px solid ${selectedMethod === 'EFECTIVO' ? '#dc2626' : '#1f2937'}`,
              borderRadius: '12px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            💵 EFECTIVO
          </button>

          <button
            onClick={() => setSelectedMethod('TARJETA')}
            style={{
              padding: '16px',
              background: selectedMethod === 'TARJETA' ? '#dc2626' : 'transparent',
              border: `2px solid ${selectedMethod === 'TARJETA' ? '#dc2626' : '#1f2937'}`,
              borderRadius: '12px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            💳 TARJETA
          </button>

          <button
            onClick={() => setSelectedMethod('STRIPE')}
            style={{
              padding: '16px',
              background: selectedMethod === 'STRIPE' ? '#6366f1' : 'transparent',
              border: `2px solid ${selectedMethod === 'STRIPE' ? '#6366f1' : '#1f2937'}`,
              borderRadius: '12px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 16,
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            🔒 STRIPE (PAGO SEGURO)
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px',
              background: 'transparent',
              border: '1px solid #1f2937',
              borderRadius: '8px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: 14,
            }}
            disabled={processing}
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedMethod || processing}
            style={{
              flex: 1,
              padding: '12px',
              background: selectedMethod && !processing ? '#dc2626' : '#1f2937',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              cursor: selectedMethod && !processing ? 'pointer' : 'not-allowed',
              fontSize: 14,
              fontWeight: 'bold',
            }}
          >
            {processing ? 'Procesando...' : 'Confirmar Pago'}
          </button>
        </div>
      </div>
    </div>
  );
}


