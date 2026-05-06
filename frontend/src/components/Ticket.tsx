import { useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Booking } from '../services/api';
import './Ticket.css';

interface TicketProps {
  booking: Booking;
  onClose?: () => void;
}

export default function Ticket({ booking, onClose }: TicketProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (date: string): string => {
    return new Date(date).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSeatClass = (seatClass?: string): string => {
    if (!seatClass) return 'Sin asiento';
    switch (seatClass) {
      case 'FIRST': return 'Primera Clase';
      case 'PREMIUM': return 'Premium';
      case 'ECONOMY': return 'Económica';
      default: return seatClass;
    }
  };

  const getCategory = (categoria?: string): string => {
    if (!categoria) return 'Básico';
    switch (categoria) {
      case 'BASIC': return 'Básico';
      case 'PRIVATE': return 'Privado';
      case 'INTERNATIONAL': return 'Internacional';
      default: return categoria;
    }
  };

  const getPaymentMethod = (method?: string): string => {
    if (method === 'TARJETA') return 'Tarjeta';
    return 'Efectivo';
  };

  const handlePrint = () => {
    window.print();
  };

  const qrValue = JSON.stringify({
    code: booking.flight.code,
    passenger: booking.user?.fullName,
    seat: booking.seat?.number ?? 'N/A',
    status: booking.status,
    departure: booking.flight.departureAt,
    arrival: booking.flight.arrivalAt,
  });

  if (isMinimized) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        animation: 'slideInUp 0.3s ease-out',
      }}>
        <div style={{
          background: '#000',
          border: '2px solid #dc2626',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 4px 20px rgba(220, 38, 38, 0.5)',
          minWidth: '320px',
          maxWidth: '400px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 6px 25px rgba(220, 38, 38, 0.7)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(220, 38, 38, 0.5)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onClick={() => setIsMinimized(false)}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                ✈️ Boleto de Vuelo
              </div>
              <div style={{ fontSize: 14, color: '#fff', marginTop: 6, fontWeight: '500' }}>
                {booking.flight.code} - {booking.flight.origin} → {booking.flight.destination}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(false);
                }}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                title="Maximizar"
              >
                ⬆️
              </button>
              {onClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    border: '1px solid #dc2626',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                  title="Cerrar"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div style={{ 
            fontSize: 13, 
            color: '#94a3b8',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            paddingTop: 8,
            borderTop: '1px solid rgba(220, 38, 38, 0.3)',
          }}>
            {booking.seat && (
              <span style={{ color: '#dc2626', fontWeight: 'bold' }}>
                🪑 {booking.seat.number}
              </span>
            )}
            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
              💰 {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(booking.finalPrice || booking.price || 0)}
            </span>
          </div>
          <div style={{ 
            fontSize: 11, 
            color: '#6b7280',
            marginTop: 8,
            fontStyle: 'italic',
          }}>
            Haz clic para ver el boleto completo
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ticket-modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
      overflow: 'auto',
      animation: 'fadeIn 0.3s ease-out',
    }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: '700px' }}>
        <div className="ticket">
          <div className="left"></div>
          <div className="right"></div>
          <div className="ticket-content-wrapper" style={{ position: 'relative' }}>
            {/* Botón de minimizar en la esquina superior derecha del ticket */}
            <div className="ticket-print-hide" style={{
              position: 'absolute',
              top: 16,
              right: 120,
              zIndex: 1001,
            }}>
              <button
                onClick={() => setIsMinimized(true)}
                style={{
                  background: '#1f2937',
                  color: '#fff',
                  border: '2px solid #dc2626',
                  borderRadius: '8px',
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#1f2937';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                title="Minimizar a la esquina"
              >
                ⬇️ Minimizar
              </button>
            </div>
            <div className="ticket-header">
              <h2>✈️ BOLETO DE VUELO</h2>
              <div className="ticket-code">{booking.flight.code}</div>
            </div>

            <div className="ticket-body">
              <div className="ticket-section">
                <div className="ticket-label">Pasajero</div>
                <div className="ticket-value">{booking.user?.fullName || 'N/A'}</div>
                <div className="ticket-value" style={{ fontSize: 12, opacity: 0.7 }}>{booking.user?.email || ''}</div>
              </div>

              <div className="ticket-section">
                <div className="ticket-label">Ruta</div>
                <div className="ticket-value" style={{ fontSize: 20, fontWeight: 'bold' }}>
                  {booking.flight.origin} → {booking.flight.destination}
                </div>
              </div>

              <div className="ticket-section">
                <div className="ticket-label">Salida</div>
                <div className="ticket-value">{formatDate(booking.flight.departureAt)}</div>
                <div className="ticket-value" style={{ fontSize: 14, color: '#dc2626' }}>
                  Hora: {formatTime(booking.flight.departureAt)}
                </div>
              </div>

              <div className="ticket-section">
                <div className="ticket-label">Llegada</div>
                <div className="ticket-value">{formatDate(booking.flight.arrivalAt)}</div>
                <div className="ticket-value" style={{ fontSize: 14, color: '#dc2626' }}>
                  Hora: {formatTime(booking.flight.arrivalAt)}
                </div>
              </div>

              <div className="ticket-section">
                <div className="ticket-label">Asiento</div>
                <div className="ticket-value" style={{ fontSize: 24, fontWeight: 'bold', color: '#dc2626' }}>
                  {booking.seat ? booking.seat.number : 'Sin asignar'}
                </div>
                <div className="ticket-value" style={{ fontSize: 12 }}>
                  {getSeatClass(booking.seat?.seatClass)}
                </div>
              </div>

              <div className="ticket-section">
                <div className="ticket-label">Categoría</div>
                <div className="ticket-value">{getCategory(booking.flight.categoria)}</div>
                {booking.flight.numeroAvion && (
                  <div className="ticket-value" style={{ fontSize: 12, opacity: 0.7 }}>
                    Avión: {booking.flight.numeroAvion}
                  </div>
                )}
              </div>

              {booking.flight.lugarArribo && (
                <div className="ticket-section">
                  <div className="ticket-label">Lugar de Arribo</div>
                  <div className="ticket-value">{booking.flight.lugarArribo}</div>
                </div>
              )}

              {booking.flight.puertaArribo && (
                <div className="ticket-section">
                  <div className="ticket-label">Puerta</div>
                  <div className="ticket-value" style={{ fontSize: 20, fontWeight: 'bold' }}>
                    {booking.flight.puertaArribo}
                  </div>
                </div>
              )}

              {booking.flight.checkInTime && (
                <div className="ticket-section">
                  <div className="ticket-label">Check-in</div>
                  <div className="ticket-value">{formatDate(booking.flight.checkInTime)}</div>
                </div>
              )}

              {booking.discountPercent && booking.discountPercent > 0 && (
                <div className="ticket-section">
                  <div className="ticket-label">Descuento Aplicado</div>
                  <div className="ticket-value" style={{ color: '#10b981', fontWeight: 'bold' }}>
                    {booking.discountPercent}% OFF
                  </div>
                  {booking.offer && (
                    <div className="ticket-value" style={{ fontSize: 12, opacity: 0.7 }}>
                      Oferta: {booking.offer.destination}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="ticket-section" style={{ alignItems: 'center' }}>
              <div className="ticket-label">Código QR</div>
              <div style={{ background: '#fff', padding: 10, borderRadius: 12 }}>
                <QRCodeCanvas value={qrValue} size={110} />
              </div>
            </div>

            <div className="ticket-footer">
              <div>
                <div className="ticket-label">Precio Total</div>
                <div className="ticket-price">
                  {formatPrice(booking.finalPrice || booking.price || 0)}
                </div>
                {booking.discountPercent && booking.discountPercent > 0 && booking.price && (
                  <div style={{ fontSize: 12, textDecoration: 'line-through', opacity: 0.6, marginTop: 4 }}>
                    {formatPrice(booking.price)}
                  </div>
                )}
              </div>
              <div>
                <div className="ticket-label">Método de Pago</div>
                <div className="ticket-payment-method">
                  <span className="payment-badge">
                    {getPaymentMethod(booking.payment?.paymentMethod || booking.paymentMethod || 'EFECTIVO')}
                  </span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
                  {formatDate(booking.payment?.createdAt || booking.createdAt)}
                </div>
              </div>
            </div>

            <div className="ticket-print-hide" style={{ marginTop: 20, textAlign: 'center' }}>
              <button
                onClick={handlePrint}
                style={{
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 16,
                }}
              >
                🖨️ Imprimir Boleto
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


