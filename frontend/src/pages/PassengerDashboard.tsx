import { Link, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import React, { useEffect, useState, useMemo } from 'react';
import { flightsApi, bookingsApi, seatsApi, Flight, Booking, Seat, pricingApi, PriceCalculation, travelOffersApi, TravelOffer, stripeApi } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import Ticket from '../components/Ticket';
import NotificationBell from '../components/NotificationBell';
import PaymentSuccess from './PaymentSuccess';
import PaymentCancel from './PaymentCancel';
import SecuritySettings from '../components/SecuritySettings';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Pasajero</div>
        <nav>
          <Link to="/passenger">Inicio</Link>
          <Link to="/passenger/flights">Vuelos Disponibles</Link>
          <Link to="/passenger/my-flights">Mis Vuelos / Estado</Link>
        </nav>
        <div className="userbox">
          <div className="name">{user?.fullName}</div>
          
          {/* Badge de Lealtad Premium */}
          {user?.role === 'PASSENGER' && (
            <div style={{
              margin: '12px 0',
              padding: '12px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.6, textTransform: 'uppercase', letterSpacing: 1 }}>Nivel</span>
                <span style={{ 
                  fontSize: 12, 
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  background: user.loyaltyTier === 'GOLD' ? 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)' : 
                             user.loyaltyTier === 'SILVER' ? 'linear-gradient(135deg, #94a3b8 0%, #475569 100%)' :
                             'linear-gradient(135deg, #b45309 0%, #78350f 100%)',
                  color: 'white'
                }}>
                  {user.loyaltyTier || 'BRONZE'}
                </span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 'bold', color: '#B19EEF' }}>
                {user.loyaltyPoints || 0} <span style={{ fontSize: 12, opacity: 0.8, fontWeight: 'normal' }}>puntos</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <SecuritySettings />
            <NotificationBell />
            <button className="btn-secondary" onClick={logout}>Salir</button>
          </div>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState<TravelOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketBooking, setTicketBooking] = useState<Booking | null>(null);
  const [showTicket, setShowTicket] = useState(false);

  useEffect(() => {
    travelOffersApi.listActive().then(setOffers).finally(() => setLoading(false));
  }, []);

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);
  };

  if (loading) return <div className="card">Cargando ofertas...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <div className="card-fancy hero" style={{ marginBottom: 32 }}>
        <h2>✈️ Ofertas Especiales de Viaje</h2>
        <p>Descubre destinos increíbles con descuentos exclusivos</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 24,
        marginBottom: 32
      }}>
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="card-fancy card-image"
            style={{
              backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.6) 100%), url(${offer.imageUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              padding: 0,
              position: 'relative',
              cursor: 'pointer',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              height: '400px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Badge de descuento */}
            <div style={{
              position: 'absolute',
              top: 16,
              right: 16,
              background: '#ef4444',
              color: 'white',
              padding: '8px 16px',
              borderRadius: 20,
              fontWeight: 'bold',
              fontSize: 14,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
            }}>
              {offer.discountPercent}% OFF
            </div>

            {/* Contenido */}
            <div style={{
              background: 'transparent',
              padding: 24,
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)'
            }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: 24 }}>{offer.destination}</h3>
              <p style={{ margin: '0 0 16px 0', opacity: 0.9, fontSize: 14 }}>{offer.description}</p>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ fontSize: 32, fontWeight: 'bold' }}>{formatPrice(offer.discountPrice)}</span>
                  <span style={{
                    fontSize: 18,
                    textDecoration: 'line-through',
                    opacity: 0.6
                  }}>{formatPrice(offer.originalPrice)}</span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>por persona</div>
              </div>

              <button
                className="btn-primary"
                style={{
                  width: '100%',
                  background: 'white',
                  color: '#1e293b',
                  fontWeight: 'bold',
                  padding: '12px',
                  fontSize: 16
                }}
                onClick={() => {
                  navigate(`/passenger/flights?discount=${offer.discountPercent}&destination=${encodeURIComponent(offer.destination)}&offerId=${offer.id}`);
                }}
              >
                Ver Vuelos Disponibles
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sección adicional */}
      <div className="card-fancy card" style={{
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.6) 0%, rgba(118, 75, 162, 1) 100%)',
        padding: 40,
        textAlign: 'center',
        color: 'white'
      }}>
        <h2 style={{ margin: '0 0 16px 0' }}>🌍 ¿Listo para tu próxima aventura?</h2>
        <p style={{ fontSize: 18, margin: '0 0 24px 0', opacity: 0.9 }}>
          Explora todos nuestros destinos y encuentra el viaje perfecto para ti
        </p>
        <button
          className="btn-primary"
          style={{
            background: 'white',
            color: '#667eea',
            fontWeight: 'bold',
            padding: '16px 32px',
            fontSize: 18
          }}
          onClick={() => navigate('/passenger/flights')}
        >
          Explorar Todos los Vuelos
        </button>
      </div>
    </div>
  );
}

function SeatMap({ flightId, onSelect, refreshKey }: { flightId: number; onSelect: (seatId: number) => void; refreshKey?: number }) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seatsApi.getByFlight(flightId).then(setSeats).finally(() => setLoading(false));
  }, [flightId, refreshKey]);

  if (loading) return <div className="muted">Cargando asientos...</div>;

  const byClass = {
    FIRST: seats.filter(s => s.seatClass === 'FIRST'),
    PREMIUM: seats.filter(s => s.seatClass === 'PREMIUM'),
    ECONOMY: seats.filter(s => s.seatClass === 'ECONOMY'),
  };

  function SeatButton({ seat }: { seat: Seat }) {
    const isSelected = selected === seat.id;
    return (
      <button
        onClick={() => !seat.isOccupied && (setSelected(seat.id), onSelect(seat.id))}
        disabled={seat.isOccupied}
        style={{
          width: 40,
          height: 40,
          margin: 2,
          background: seat.isOccupied ? '#dc2626' : isSelected ? '#3b82f6' : '#10b981',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: seat.isOccupied ? 'not-allowed' : 'pointer',
          fontWeight: isSelected ? 'bold' : 'normal',
        }}
        title={seat.isOccupied ? 'Ocupado' : seat.number}
      >
        {seat.number}
      </button>
    );
  }

  return (
    <div className="card">
      <h3>Selecciona tu asiento</h3>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, background: '#10b981', borderRadius: 4 }} />
            <span>Disponible</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, background: '#dc2626', borderRadius: 4 }} />
            <span>Ocupado</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, background: '#3b82f6', borderRadius: 4 }} />
            <span>Seleccionado</span>
          </div>
        </div>
      </div>

      {byClass.FIRST.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>Primera Clase</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {byClass.FIRST.map(s => <SeatButton key={s.id} seat={s} />)}
          </div>
        </div>
      )}

      {byClass.PREMIUM.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>Premium</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {byClass.PREMIUM.map(s => <SeatButton key={s.id} seat={s} />)}
          </div>
        </div>
      )}

      {byClass.ECONOMY.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ marginBottom: 8 }}>Económica</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {byClass.ECONOMY.map(s => <SeatButton key={s.id} seat={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function AvailableFlights({
  onPay,
  myBookings,
  loadBookings
}: {
  onPay: (flightId: number, priceInfo: PriceCalculation) => void;
  myBookings: Booking[];
  loadBookings: () => Promise<void>;
}) {
  const [searchParams] = useSearchParams();
  const discount = searchParams.get('discount');
  const destination = searchParams.get('destination');
  const offerId = searchParams.get('offerId');

  const [flights, setFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<number | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [priceInfo, setPriceInfo] = useState<PriceCalculation | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [seatMapRefreshKey, setSeatMapRefreshKey] = useState<Record<number, number>>({});
  const [showTicket, setShowTicket] = useState(false);
  const [ticketBooking, setTicketBooking] = useState<Booking | null>(null);
  const [currentOffer, setCurrentOffer] = useState<TravelOffer | null>(null);

  async function load() {
    try {
      const flightsData = await flightsApi.list();
      setFlights(flightsData);
      await loadBookings();
      setError(null);
    } catch {
      setError('No se pudieron cargar los vuelos');
    } finally {
      setLoading(false);
    }
  }

  // Cargar oferta si hay offerId
  useEffect(() => {
    if (offerId) {
      travelOffersApi.get(parseInt(offerId))
        .then(offer => {
          setCurrentOffer(offer);
        })
        .catch(err => {
          console.error('Error cargando oferta:', err);
          setCurrentOffer(null);
        });
    } else {
      setCurrentOffer(null);
    }
  }, [offerId]);

  useEffect(() => { load(); }, []);

  // Mapeo de códigos de oferta a códigos de aeropuerto posibles
  const airportCodeMap: Record<string, string[]> = {
    'PAR': ['PAR', 'CDG', 'ORY'], // París
    'TYO': ['TYO', 'NRT', 'HND'], // Tokio
    'CUN': ['CUN'], // Cancún
    'NYC': ['NYC', 'JFK', 'LGA', 'EWR'], // Nueva York
    'BCN': ['BCN'], // Barcelona
    'DXB': ['DXB'], // Dubái
  };

  // Mapeo de nombres de destino a códigos
  const nameToCodeMap: Record<string, string[]> = {
    'parís': ['PAR', 'CDG', 'ORY'],
    'francia': ['PAR', 'CDG', 'ORY'],
    'tokio': ['TYO', 'NRT', 'HND'],
    'japón': ['TYO', 'NRT', 'HND'],
    'cancún': ['CUN'],
    'méxico': ['CUN'],
    'nueva york': ['NYC', 'JFK', 'LGA', 'EWR'],
    'usa': ['NYC', 'JFK', 'LGA', 'EWR'],
    'barcelona': ['BCN'],
    'españa': ['BCN'],
    'dubái': ['DXB'],
    'eau': ['DXB'],
  };

  // Filtrar vuelos disponibles
  const bookedFlightIds = new Set(myBookings.map(b => b.flight.id));
  const now = new Date();
  let available = flights.filter(f => 
    !bookedFlightIds.has(f.id) && 
    f.seatsAvailable > 0 && 
    new Date(f.departureAt) > now
  );

  // Filtrar por destino si viene desde una oferta
  if (destination || currentOffer || offerId) {
    // Obtener códigos posibles
    let possibleCodes: string[] = [];
    
    // Prioridad 1: usar destinationCode de la oferta cargada
    if (currentOffer?.destinationCode) {
      const offerCode = currentOffer.destinationCode.toUpperCase().trim();
      possibleCodes = airportCodeMap[offerCode] || [offerCode];
    }
    
    // Prioridad 2: si no hay oferta cargada pero hay nombre de destino, usar mapeo de nombres
    if (possibleCodes.length === 0 && destination) {
      const destLower = destination.toLowerCase().trim();
      const keywords = destLower.split(',').map(s => s.trim());
      
      for (const keyword of keywords) {
        if (nameToCodeMap[keyword]) {
          possibleCodes = [...possibleCodes, ...nameToCodeMap[keyword]];
        }
      }
    }
    
    // Si hay códigos posibles, filtrar los vuelos
    if (possibleCodes.length > 0) {
      available = available.filter(f => {
        const flightDest = f.destination.toUpperCase().trim();
        return possibleCodes.some(code => {
          const codeUpper = code.toUpperCase().trim();
          return flightDest === codeUpper;
        });
      });
    }
  }

  // Helper functions para calcular descuentos
  const getDiscountedPrice = (originalPrice: number): number => {
    if (!discount) return originalPrice;
    const discountPercent = parseInt(discount);
    return Math.round(originalPrice * (1 - discountPercent / 100));
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(price);
  };

  async function loadPrice(flightId: number, seatId?: number) {
    setLoadingPrice(true);
    try {
      const price = await pricingApi.calculate(flightId, seatId);
      setPriceInfo(price);
    } catch {
      setPriceInfo(null);
    } finally {
      setLoadingPrice(false);
    }
  }

  useEffect(() => {
    if (selectedFlight && selectedSeat) {
      loadPrice(selectedFlight, selectedSeat);
    } else if (selectedFlight && !selectedSeat) {
      loadPrice(selectedFlight);
    } else {
      setPriceInfo(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFlight, selectedSeat]);

  function handleReserveClick(flightId: number) {
    if (!priceInfo) {
      alert('Por favor espera a que se calcule el precio');
      return;
    }
    if (selectedFlight !== flightId) {
      alert('Por favor selecciona un asiento primero');
      return;
    }
    onPay(flightId, priceInfo);
  }

  if (loading) return <div className="card">Cargando...</div>;
  if (error) return <div className="card error-chip">{error}</div>;

  return (
    <div className="card">
      {discount && destination && (
        <div style={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          padding: '16px 24px',
          borderRadius: 12,
          marginBottom: 20,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div>
            <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>🎉 ¡{discount}% de descuento aplicado!</div>
            <div style={{ fontSize: 14, opacity: 0.9 }}>En vuelos a {destination}</div>
            {currentOffer?.destinationCode && (
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                Código de destino: {currentOffer.destinationCode}
              </div>
            )}
          </div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>{discount}%</div>
        </div>
      )}
      <h2>Vuelos Disponibles</h2>
      {available.length === 0 ? (
        <div>
          <p className="muted">No hay vuelos disponibles para este destino en este momento.</p>
          {(destination || currentOffer) && (
            <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
              {currentOffer?.destinationCode ? `Buscando vuelos con código: ${currentOffer.destinationCode}` : `Buscando vuelos a: ${destination}`}
            </p>
          )}
        </div>
      ) : (
        <div>
          {available.map(f => (
            <div key={f.id} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                <div>
                  <h3>{f.code}</h3>
                  <div><strong>{f.origin} → {f.destination}</strong></div>
                  {f.numeroAvion && <div className="muted">Avión: {f.numeroAvion}</div>}
                  {f.categoria && <div className="muted">Categoría: {f.categoria === 'BASIC' ? 'Básico' : f.categoria === 'PRIVATE' ? 'Privado' : 'Internacional'}</div>}
                  <div className="muted">Salida: {new Date(f.departureAt).toLocaleString()}</div>
                  <div className="muted">Llegada: {new Date(f.arrivalAt).toLocaleString()}</div>
                  {f.lugarArribo && <div className="muted">Lugar de arribo: {f.lugarArribo}</div>}
                  {f.puertaArribo && <div className="muted">Puerta de arribo: {f.puertaArribo}</div>}
                  {f.checkInTime && <div className="muted">Check-in: {new Date(f.checkInTime).toLocaleString()}</div>}
                  <div className="muted">Asientos disponibles: {f.seatsAvailable}/{f.seatsTotal}</div>
                </div>
                <button
                  onClick={() => setSelectedFlight(selectedFlight === f.id ? null : f.id)}
                  className="btn-primary"
                >
                  {selectedFlight === f.id ? 'Ocultar Asientos' : 'Ver Asientos'}
                </button>
              </div>
              {selectedFlight === f.id && (
                <div>
                  <SeatMap flightId={f.id} onSelect={(seatId) => {
                    setSelectedSeat(seatId);
                  }} refreshKey={seatMapRefreshKey[f.id]} />
                  {priceInfo && (
                    <div style={{marginTop:16,padding:16,background:'rgba(59,130,246,0.1)',borderRadius:8,border:'2px solid #3b82f6',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <div>
                        <div className="muted" style={{fontSize:14}}>Precio a pagar:</div>
                        {discount ? (
                          <div>
                            <div style={{ fontSize: 16, textDecoration: 'line-through', opacity: 0.6, color: '#94a3b8' }}>
                              {priceInfo.formattedPrice}
                            </div>
                            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10b981' }}>
                              {formatPrice(getDiscountedPrice(priceInfo.price))}
                            </div>
                            <div style={{ fontSize: 12, color: '#10b981', fontWeight: 'bold', marginTop: 2 }}>
                              ¡Ahorras {formatPrice(priceInfo.price - getDiscountedPrice(priceInfo.price))}!
                            </div>
                          </div>
                        ) : (
                          <div style={{fontSize:24,fontWeight:'bold',color:'#3b82f6'}}>{priceInfo.formattedPrice}</div>
                        )}
                        <div className="muted" style={{fontSize:12,marginTop:4}}>
                          {priceInfo.categoria === 'BASIC' ? 'Vuelo Básico' : priceInfo.categoria === 'PRIVATE' ? 'Vuelo Privado' : 'Vuelo Internacional'} - 
                          {priceInfo.seatClass === 'ECONOMY' ? ' Clase Económica' : priceInfo.seatClass === 'PREMIUM' ? ' Clase Premium' : ' Primera Clase'}
                        </div>
                      </div>
                      <button onClick={() => handleReserveClick(f.id)} className="btn-primary" style={{padding:'12px 24px',fontSize:16}}>
                        Reservar y Pagar
                      </button>
                    </div>
                  )}
                  {selectedSeat && !priceInfo && loadingPrice && (
                    <div className="muted" style={{marginTop:12}}>Calculando precio...</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showTicket && ticketBooking && (
        <Ticket
          booking={ticketBooking}
          onClose={() => {
            setShowTicket(false);
            setTicketBooking(null);
          }}
        />
      )}
    </div>
  );
}

function MyFlights({
  onPay,
  bookings,
  loading,
  loadBookings
}: {
  onPay: (flightId: number, priceInfo: PriceCalculation) => void;
  bookings: Booking[];
  loading: boolean;
  loadBookings: () => Promise<void>;
}) {
  const [showTicket, setShowTicket] = useState(false);
  const [ticketBooking, setTicketBooking] = useState<Booking | null>(null);
  const [emailSending, setEmailSending] = useState<number | null>(null);

  function FlightCard({ b, isPast }: { b: Booking; isPast?: boolean }) {
    return (
      <div className="flight-card" style={{ opacity: isPast ? 0.8 : 1 }}>
        <div className="flight-head" style={{ background: isPast ? '#4b5563' : undefined }}>{b.flight.code}</div>
        <div><strong>{b.flight.origin} → {b.flight.destination}</strong></div>
        {b.flight.numeroAvion && <div className="muted">Avión: {b.flight.numeroAvion}</div>}
        {b.flight.categoria && <div className="muted">Categoría: {b.flight.categoria === 'BASIC' ? 'Básico' : b.flight.categoria === 'PRIVATE' ? 'Privado' : 'Internacional'}</div>}
        <div className="muted">Salida: {new Date(b.flight.departureAt).toLocaleString()}</div>
        <div className="muted">Llegada: {new Date(b.flight.arrivalAt).toLocaleString()}</div>
        {b.flight.lugarArribo && <div className="muted">Lugar de arribo: {b.flight.lugarArribo}</div>}
        {b.flight.puertaArribo && <div className="muted">Puerta de arribo: {b.flight.puertaArribo}</div>}
        {b.flight.checkInTime && <div className="muted">Check-in: {new Date(b.flight.checkInTime).toLocaleString()}</div>}
        {b.seat && <div style={{ fontWeight: 'bold', color: '#3b82f6', marginTop: 8 }}>Asiento: {b.seat.number} ({b.seat.seatClass === 'FIRST' ? 'Primera' : b.seat.seatClass === 'PREMIUM' ? 'Premium' : 'Económica'})</div>}
        <div style={{ marginTop: 8 }}>
          <span className="payment-badge" style={{ background: b.status === 'APPROVED' ? '#10b981' : b.status === 'REJECTED' ? '#dc2626' : '#fbbf24', color: '#000' }}>
            {b.status === 'APPROVED' ? 'APROBADO' : b.status === 'REJECTED' ? 'RECHAZADO' : 'PENDIENTE'}
          </span>
        </div>
        {b.payment && (
          <div style={{ marginTop: 8, fontSize: 14 }}>
            <span className="muted">Pago: </span>
            <span style={{ fontWeight: 'bold', color: '#10b981' }}>
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(b.payment.amount)}
            </span>
            <span className="muted" style={{ marginLeft: 8 }}>
              ({b.payment.paymentMethod === 'TARJETA' ? 'Tarjeta' : 'Efectivo'})
            </span>
          </div>
        )}
        <div className="muted">Reservado: {new Date(b.createdAt).toLocaleString()}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          {b.status === 'PENDING' && !isPast && (
            <>
              <button 
                onClick={() => {
                  onPay(b.flight.id, {
                    flightId: b.flight.id,
                    seatId: b.seat?.id || null,
                    categoria: b.flight.categoria || 'BASIC',
                    seatClass: b.seat?.seatClass || 'ECONOMY',
                    price: b.finalPrice || b.price || 0,
                    formattedPrice: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(b.finalPrice || b.price || 0)
                  });
                }} 
                className="btn-primary" 
                style={{ flex: '1 1 100%', marginBottom: 8, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
              >
                💳 Completar Pago
              </button>
            </>
          )}
          {!isPast && (
            <button onClick={() => leaveFlight(b.flight.id)} className="btn-secondary" style={{ flex: 1 }}>
              {b.status === 'PENDING' ? 'Eliminar Reserva' : 'Cancelar'}
            </button>
          )}
          {b.status === 'APPROVED' && (
            <button onClick={() => viewTicket(b.flight.id)} className="btn-primary" style={{ flex: 1 }}>
              🎫 {isPast ? 'Ver Registro' : 'Ver Mi Boleto'}
            </button>
          )}
          {b.status === 'APPROVED' && !isPast && (
            <button
              onClick={() => emailTicket(b.id, b.user?.email)}
              className="btn-secondary"
              style={{ flex: 1 }}
              disabled={emailSending === b.id}
            >
              {emailSending === b.id ? 'Enviando...' : 'Reenviar'}
            </button>
          )}
        </div>
      </div>
    );
  }

  async function leaveFlight(flightId: number) {
    if (!confirm('¿Estás seguro de que deseas salirte de este vuelo?')) return;
    try {
      await bookingsApi.cancel(flightId);
      await loadBookings();
      alert('Te has salido del vuelo exitosamente. El asiento ha sido liberado.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al salirse del vuelo');
    }
  }

  async function viewTicket(flightId: number) {
    try {
      const ticketData = await bookingsApi.getTicket(flightId);
      setTicketBooking(ticketData);
      setShowTicket(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al cargar el boleto');
    }
  }

  async function emailTicket(bookingId: number, emailDefault?: string) {
    const to = prompt('Correo destino del boleto:', emailDefault || '');
    if (!to) return;
    setEmailSending(bookingId);
    try {
      await bookingsApi.email(bookingId, to);
      alert('Boleto enviado al correo indicado.');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'No se pudo enviar el correo');
    } finally {
      setEmailSending(null);
    }
  }

  if (loading) return <div className="card">Cargando...</div>;

  return (
    <div className="card">
      <h2>Mis Vuelos</h2>
      {bookings.length === 0 ? (
        <p className="muted">Aún no tienes vuelos reservados.</p>
      ) : (
        <>
          {bookings.some(b => new Date(b.flight.departureAt) > new Date()) && (
            <div style={{ marginBottom: 32 }}>
              <h3 style={{ marginBottom: 16, color: '#10b981' }}>✈️ Próximos Viajes</h3>
              <div className="grid">
                {bookings
                  .filter(b => new Date(b.flight.departureAt) > new Date())
                  .map(b => <FlightCard key={b.id} b={b} />)}
              </div>
            </div>
          )}

          {bookings.some(b => new Date(b.flight.departureAt) <= new Date()) && (
            <div>
              <h3 style={{ marginBottom: 16, opacity: 0.7 }}>🕒 Vuelos Anteriores</h3>
              <div className="grid">
                {bookings
                  .filter(b => new Date(b.flight.departureAt) <= new Date())
                  .map(b => <FlightCard key={b.id} b={b} isPast />)}
              </div>
            </div>
          )}
        </>
      )}

      {showTicket && ticketBooking && (
        <Ticket
          booking={ticketBooking}
          onClose={() => {
            setShowTicket(false);
            setTicketBooking(null);
          }}
        />
      )}
    </div>
  );
}

function PassengerApp() {
  const { loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentFlightForPayment, setCurrentFlightForPayment] = useState<number | null>(null);
  const [priceInfo, setPriceInfo] = useState<PriceCalculation | null>(null);

  const [ticketBooking, setTicketBooking] = useState<Booking | null>(null);
  const [showTicket, setShowTicket] = useState(false);

  async function loadBookings() {
    try {
      const data = await bookingsApi.myBookings();
      setBookings(data);
    } catch {
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }

  useEffect(() => {
    if (!authLoading) loadBookings();
  }, [authLoading]);

  async function handlePaymentConfirm(paymentMethod: 'EFECTIVO' | 'TARJETA' | 'STRIPE') {
    if (!currentFlightForPayment || !priceInfo) return;
    
    try {
      // Intentar encontrar un booking pendiente para este vuelo
      const existing = bookings.find(b => b.flight.id === currentFlightForPayment && b.status === 'PENDING');
      
      let bookingId = existing?.id;

      if (!bookingId) {
        // Crear la reserva si no existe una pendiente
        const created = await bookingsApi.create(currentFlightForPayment, priceInfo.seatId || undefined);
        bookingId = created.id;
      }
      
      if (paymentMethod === 'STRIPE') {
        const session = await stripeApi.createSession(bookingId as number);
        window.location.href = session.url;
        return;
      }
      
      // Pago manual (Efectivo/Tarjeta)
      if ((paymentMethod as string) !== 'STRIPE') {
          // Si el booking ya existía, deberíamos enviar una señal de que queremos pagar manual
          // En este caso, el flujo manual asume aprobación inmediata o gestión por agente.
          // Para este demo, simplemente mostramos el ticket.
      }

      const ticketData = await bookingsApi.getTicket(currentFlightForPayment);
      setTicketBooking(ticketData);
      
      setShowPaymentModal(false);
      setPriceInfo(null);
      setCurrentFlightForPayment(null);
      
      await loadBookings();
      setShowTicket(true);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al procesar el pago');
      setShowPaymentModal(false);
    }
  }

  if (authLoading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#000', color: '#fff' }}>Recuperando sesión...</div>;
  }

  return (
    <Layout>
      <Routes>
        <Route index element={<Home />} />
        <Route path="flights" element={<AvailableFlights onPay={(id, p) => { setCurrentFlightForPayment(id); setPriceInfo(p); setShowPaymentModal(true); }} myBookings={bookings} loadBookings={loadBookings} />} />
        <Route path="my-flights" element={<MyFlights onPay={(id, p) => { setCurrentFlightForPayment(id); setPriceInfo(p); setShowPaymentModal(true); }} bookings={bookings} loading={loadingBookings} loadBookings={loadBookings} />} />
        <Route path="payment/success" element={<PaymentSuccess />} />
        <Route path="payment/cancel" element={<PaymentCancel />} />
        <Route path="*" element={<Navigate to="/passenger" replace />} />
      </Routes>

      {showPaymentModal && priceInfo && (
        <PaymentModal
          priceInfo={priceInfo}
          onConfirm={handlePaymentConfirm}
          onCancel={() => {
            setShowPaymentModal(false);
            setPriceInfo(null);
            setCurrentFlightForPayment(null);
          }}
        />
      )}

      {showTicket && ticketBooking && (
        <Ticket
          booking={ticketBooking}
          onClose={() => {
            setShowTicket(false);
            setTicketBooking(null);
          }}
        />
      )}
    </Layout>
  );
}

export default function PassengerDashboard() { return <PassengerApp />; }
