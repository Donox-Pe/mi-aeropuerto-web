import { Link, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useState } from 'react';
import { flightsApi, CreateFlightDto, UpdateFlightDto, Flight, adminFlightsApi, AdminFlightWithCount, PassengerLite, paymentsApi, Payment, seatsApi, Seat, pricingApi, PriceCalculation, bookingsApi, Booking } from '../services/api';
import NotificationBell from '../components/NotificationBell';
import SecuritySettings from '../components/SecuritySettings';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">Agente</div>
        <nav>
          <Link to="/agent">Inicio</Link>
          <Link to="/agent/flights">Vuelos</Link>
          <Link to="/agent/passengers">Pasajeros</Link>
          <Link to="/agent/pending">Reservas pendientes</Link>
          <Link to="/agent/payments">Historial de Pagos</Link>
        </nav>
        <div className="userbox">
          <div className="name">{user?.fullName}</div>
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
  const { user } = useAuth();
  return (
    <div className="card-fancy card">
      <h2>BIENVENIDO AGENTE {user?.fullName ?? ''} AL PANEL DE GESTIÓN DE VUELOS</h2>
      <p>
        Desde este panel puedes gestionar vuelos (crear, actualizar, eliminar), administrar pasajeros
        por vuelo (asignar o quitar) y consultar el historial de pagos y check-ins.
      </p>
    </div>
  );
}

function Flights() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [creating, setCreating] = useState<CreateFlightDto>({ code: '', origin: '', destination: '', departureAt: '', arrivalAt: '', seatsTotal: 150, categoria: 'BASIC' });
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<UpdateFlightDto>({});

  async function load() { setFlights(await flightsApi.list()); }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await flightsApi.create(creating);
    setCreating({ code: '', origin: '', destination: '', departureAt: '', arrivalAt: '', seatsTotal: 150, categoria: 'BASIC' });
    load();
  }
  async function startEdit(f: Flight) {
    setEditing(f.id);
    setEditForm({
      origin: f.origin,
      destination: f.destination,
      departureAt: f.departureAt,
      arrivalAt: f.arrivalAt,
      seatsAvailable: f.seatsAvailable,
      seatsTotal: f.seatsTotal,
      numeroAvion: f.numeroAvion,
      categoria: f.categoria,
      lugarArribo: f.lugarArribo,
      puertaArribo: f.puertaArribo,
      checkInTime: f.checkInTime,
    });
  }
  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      await flightsApi.update(editing, editForm);
      setEditing(null);
      load();
    }
  }
  async function remove(id: number) {
    if (confirm('¿Eliminar vuelo?')) {
      await flightsApi.delete(id);
      load();
    }
  }

  const now = new Date();
  const upcomingFlights = flights.filter(f => new Date(f.departureAt) > now);
  const pastFlights = flights.filter(f => new Date(f.departureAt) <= now);

  return (
    <div className="card">
      <h2>Gestión de Vuelos</h2>
      
      <div style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 12, color: '#10b981' }}>✈️ Próximos Vuelos</h3>
        <div className="table">
          <div className="thead" style={{ gridTemplateColumns: 'repeat(8,minmax(100px,1fr))' }}>
            <div>Código</div><div>Origen → Destino</div><div>Avion</div><div>Categoría</div><div>Salida</div><div>Llegada</div><div>Asientos</div><div>Acciones</div>
          </div>
          {upcomingFlights.length === 0 ? (
            <div className="trow" style={{ gridTemplateColumns: '1fr', textAlign: 'center', padding: 20 }}>No hay vuelos próximos</div>
          ) : (
            upcomingFlights.map(f => (
              <div className="trow" key={f.id} style={{ gridTemplateColumns: 'repeat(8,minmax(100px,1fr))' }}>
                <div>{f.code}</div>
                <div>{f.origin} → {f.destination}</div>
                <div>{f.numeroAvion || '-'}</div>
                <div>{f.categoria === 'BASIC' ? 'Básico' : f.categoria === 'PRIVATE' ? 'Privado' : 'Internacional'}</div>
                <div>{new Date(f.departureAt).toLocaleString()}</div>
                <div>{new Date(f.arrivalAt).toLocaleString()}</div>
                <div>{f.seatsAvailable}/{f.seatsTotal}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" onClick={() => startEdit(f)}>Editar</button>
                  <button className="btn-secondary" onClick={() => remove(f.id)}>Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginBottom: 32 }}>
        <h3 style={{ marginBottom: 12, opacity: 0.7 }}>🕒 Historial de Vuelos (Pasados)</h3>
        <div className="table" style={{ opacity: 0.8 }}>
          <div className="thead" style={{ gridTemplateColumns: 'repeat(8,minmax(100px,1fr))' }}>
            <div>Código</div><div>Origen → Destino</div><div>Avion</div><div>Categoría</div><div>Salida</div><div>Llegada</div><div>Asientos</div><div>Acciones</div>
          </div>
          {pastFlights.length === 0 ? (
            <div className="trow" style={{ gridTemplateColumns: '1fr', textAlign: 'center', padding: 20 }}>No hay historial de vuelos</div>
          ) : (
            pastFlights.map(f => (
              <div className="trow" key={f.id} style={{ gridTemplateColumns: 'repeat(8,minmax(100px,1fr))' }}>
                <div>{f.code}</div>
                <div>{f.origin} → {f.destination}</div>
                <div>{f.numeroAvion || '-'}</div>
                <div>{f.categoria === 'BASIC' ? 'Básico' : f.categoria === 'PRIVATE' ? 'Privado' : 'Internacional'}</div>
                <div>{new Date(f.departureAt).toLocaleString()}</div>
                <div>{new Date(f.arrivalAt).toLocaleString()}</div>
                <div>{f.seatsAvailable}/{f.seatsTotal}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn-secondary" onClick={() => startEdit(f)}>Editar</button>
                  <button className="btn-secondary" onClick={() => remove(f.id)}>Eliminar</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <h3 style={{marginTop:16}}>Crear vuelo</h3>
      <p className="muted" style={{marginBottom:12}}>Nota: Los asientos se crearán automáticamente (20 Primera, 30 Premium, 100 Económica = 150 total)</p>
      <form onSubmit={create} className="form">
        <input placeholder="Código" value={creating.code} onChange={e=>setCreating({...creating, code:e.target.value})} required />
        <input placeholder="Origen" value={creating.origin} onChange={e=>setCreating({...creating, origin:e.target.value})} required />
        <input placeholder="Destino" value={creating.destination} onChange={e=>setCreating({...creating, destination:e.target.value})} required />
        <input placeholder="Salida (YYYY-MM-DD HH:MM)" value={creating.departureAt} onChange={e=>setCreating({...creating, departureAt:e.target.value})} required />
        <input placeholder="Llegada (YYYY-MM-DD HH:MM)" value={creating.arrivalAt} onChange={e=>setCreating({...creating, arrivalAt:e.target.value})} required />
        <input placeholder="Número de Avión" value={creating.numeroAvion || ''} onChange={e=>setCreating({...creating, numeroAvion:e.target.value})} />
        <select value={creating.categoria || 'BASIC'} onChange={e=>setCreating({...creating, categoria: e.target.value as any})}>
          <option value="BASIC">Básico</option>
          <option value="PRIVATE">Privado</option>
          <option value="INTERNATIONAL">Internacional</option>
        </select>
        <input placeholder="Lugar de Arribo" value={creating.lugarArribo || ''} onChange={e=>setCreating({...creating, lugarArribo:e.target.value})} />
        <input placeholder="Puerta de Arribo" value={creating.puertaArribo || ''} onChange={e=>setCreating({...creating, puertaArribo:e.target.value})} />
        <input placeholder="Check-in (YYYY-MM-DD HH:MM)" value={creating.checkInTime || ''} onChange={e=>setCreating({...creating, checkInTime:e.target.value})} />
        <button className="btn-primary" type="submit">Crear Vuelo (150 asientos)</button>
      </form>

      {editing && (
        <div className="card" style={{marginTop:16}}>
          <h3>Editar vuelo</h3>
          <form onSubmit={saveEdit} className="form">
            <input placeholder="Origen" value={editForm.origin ?? ''} onChange={e=>setEditForm({...editForm, origin:e.target.value})} />
            <input placeholder="Destino" value={editForm.destination ?? ''} onChange={e=>setEditForm({...editForm, destination:e.target.value})} />
            <input placeholder="Salida (YYYY-MM-DD HH:MM)" value={editForm.departureAt ?? ''} onChange={e=>setEditForm({...editForm, departureAt:e.target.value})} />
            <input placeholder="Llegada (YYYY-MM-DD HH:MM)" value={editForm.arrivalAt ?? ''} onChange={e=>setEditForm({...editForm, arrivalAt:e.target.value})} />
            <input placeholder="Número de Avión" value={editForm.numeroAvion ?? ''} onChange={e=>setEditForm({...editForm, numeroAvion:e.target.value})} />
            <select value={editForm.categoria ?? 'BASIC'} onChange={e=>setEditForm({...editForm, categoria: e.target.value as any})}>
              <option value="BASIC">Básico</option>
              <option value="PRIVATE">Privado</option>
              <option value="INTERNATIONAL">Internacional</option>
            </select>
            <input placeholder="Lugar de Arribo" value={editForm.lugarArribo ?? ''} onChange={e=>setEditForm({...editForm, lugarArribo:e.target.value})} />
            <input placeholder="Puerta de Arribo" value={editForm.puertaArribo ?? ''} onChange={e=>setEditForm({...editForm, puertaArribo:e.target.value})} />
            <input placeholder="Check-in (YYYY-MM-DD HH:MM)" value={editForm.checkInTime ?? ''} onChange={e=>setEditForm({...editForm, checkInTime:e.target.value})} />
            <input placeholder="Asientos totales" type="number" value={editForm.seatsTotal ?? 0} onChange={e=>setEditForm({...editForm, seatsTotal:Number(e.target.value)})} />
            <input placeholder="Asientos disponibles" type="number" value={editForm.seatsAvailable ?? 0} onChange={e=>setEditForm({...editForm, seatsAvailable:Number(e.target.value)})} />
            <button className="btn-primary" type="submit">Guardar</button>
            <button className="btn-secondary" type="button" onClick={()=>setEditing(null)}>Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
}

function AdminSeatMap({ flightId, onSelect, selectedSeatId, refreshKey }: { flightId: number; onSelect: (seatId: number | null) => void; selectedSeatId: number | null; refreshKey?: number }) {
  const [seats, setSeats] = useState<Seat[]>([]);
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
    const isSelected = selectedSeatId === seat.id;
    return (
      <button
        onClick={() => {
          if (!seat.isOccupied) {
            onSelect(isSelected ? null : seat.id);
          }
        }}
        disabled={seat.isOccupied}
        style={{
          width: 45,
          height: 45,
          margin: 3,
          background: seat.isOccupied ? '#dc2626' : isSelected ? '#3b82f6' : '#10b981',
          color: 'white',
          border: isSelected ? '3px solid #60a5fa' : seat.isOccupied ? 'none' : '2px solid rgba(255,255,255,0.3)',
          borderRadius: 8,
          cursor: seat.isOccupied ? 'not-allowed' : 'pointer',
          fontWeight: isSelected ? 'bold' : 'normal',
          fontSize: isSelected ? '14px' : '12px',
          transition: 'all 0.2s ease',
          boxShadow: isSelected ? '0 0 10px rgba(59,130,246,0.5)' : 'none',
        }}
        title={seat.isOccupied ? `Ocupado: ${seat.number}` : isSelected ? `Seleccionado: ${seat.number}` : `Disponible: ${seat.number} - Haz clic para seleccionar`}
      >
        {seat.number}
      </button>
    );
  }

  return (
    <div className="card" style={{marginTop:16}}>
      <h4>Selecciona asiento (opcional)</h4>
      <p className="muted" style={{marginBottom:12}}>Haz clic en un asiento disponible (verde) para seleccionarlo. Haz clic nuevamente para deseleccionarlo.</p>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, background: '#10b981', borderRadius: 4 }} />
            <span>Disponible (clic para seleccionar)</span>
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
          <h5 style={{ marginBottom: 8 }}>Primera Clase</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {byClass.FIRST.map(s => <SeatButton key={s.id} seat={s} />)}
          </div>
        </div>
      )}

      {byClass.PREMIUM.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ marginBottom: 8 }}>Premium</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {byClass.PREMIUM.map(s => <SeatButton key={s.id} seat={s} />)}
          </div>
        </div>
      )}

      {byClass.ECONOMY.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <h5 style={{ marginBottom: 8 }}>Económica</h5>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {byClass.ECONOMY.map(s => <SeatButton key={s.id} seat={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function FlightPassengersManager({ flightId }: { flightId: number }) {
  const [passengers, setPassengers] = useState<{ id: number; user: PassengerLite; seat?: { id: number; number: string; seatClass: string } | null }[]>([]);
  const [allPassengers, setAllPassengers] = useState<PassengerLite[]>([]);
  const [selected, setSelected] = useState<number | ''>('');
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<string>('');
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [showFullSeatMap, setShowFullSeatMap] = useState(false);
  const [priceInfo, setPriceInfo] = useState<PriceCalculation | null>(null);
  const [seatMapRefreshKey, setSeatMapRefreshKey] = useState(0);

  async function load() {
    const [p, all] = await Promise.all([
      adminFlightsApi.listPassengers(flightId),
      adminFlightsApi.listAllPassengers(),
    ]);
    setPassengers(p);
    setAllPassengers(all);
  }
  useEffect(() => { load(); }, [flightId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    try {
      await adminFlightsApi.addPassenger(flightId, Number(selected), selectedSeat || undefined);
      setSelected('');
      setSelectedSeat(null);
      setSelectedSeatNumber('');
      setShowSeatMap(false);
      setShowFullSeatMap(false);
      setPriceInfo(null);
      setSeatMapRefreshKey(prev => prev + 1); // Forzar refresco del mapa de asientos
      load();
      alert(`Pasajero asignado exitosamente${selectedSeat ? ` con asiento ${selectedSeatNumber}` : ''}${priceInfo ? ` | Cobrado: ${priceInfo.formattedPrice}` : ''}`);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al asignar pasajero');
    }
  }
  async function remove(userId: number) {
    if (!confirm('¿Quitar pasajero del vuelo?')) return;
    await adminFlightsApi.removePassenger(flightId, userId);
    setSeatMapRefreshKey(prev => prev + 1); // Forzar refresco del mapa de asientos
    load();
  }

  useEffect(() => {
    async function updatePrice() {
      try {
        if (selectedSeat) {
          const price = await pricingApi.calculate(flightId, selectedSeat);
          setPriceInfo(price);
        } else {
          const price = await pricingApi.calculate(flightId);
          setPriceInfo(price);
        }
      } catch {
        setPriceInfo(null);
      }
    }
    if (selected || showFullSeatMap || showSeatMap) {
      updatePrice();
    }
  }, [flightId, selectedSeat, selected, showFullSeatMap, showSeatMap]);

  return (
    <div className="card" style={{marginTop:16}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h3>Pasajeros del vuelo</h3>
        <button type="button" className="btn-secondary" onClick={()=>setShowFullSeatMap(!showFullSeatMap)}>
          {showFullSeatMap ? 'Ocultar' : 'Ver'} Mapa de Asientos del Vuelo
        </button>
      </div>

      {showFullSeatMap && (
        <AdminSeatMap flightId={flightId} onSelect={()=>{}} selectedSeatId={null} refreshKey={seatMapRefreshKey} />
      )}
      <form onSubmit={add} className="form">
        <select value={selected} onChange={e=>{
          const val = e.target.value ? Number(e.target.value) : '';
          setSelected(val);
          if (val) {
            setShowSeatMap(true);
            setSelectedSeat(null);
            setSelectedSeatNumber('');
          } else {
            setShowSeatMap(false);
            setSelectedSeat(null);
            setSelectedSeatNumber('');
          }
        }}>
          <option value="">Selecciona pasajero…</option>
          {allPassengers.map(p => <option key={p.id} value={p.id}>{p.fullName} ({p.email})</option>)}
        </select>
        {selected && (
          <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
            <button type="button" className="btn-secondary" onClick={()=>setShowSeatMap(!showSeatMap)}>
              {showSeatMap ? 'Ocultar' : 'Mostrar'} Mapa de Asientos
            </button>
            {selectedSeat && selectedSeatNumber && (
              <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'rgba(59,130,246,0.2)',borderRadius:8,border:'1px solid #3b82f6'}}>
                <span style={{color:'#60a5fa',fontWeight:'bold'}}>Asiento seleccionado:</span>
                <span style={{color:'white',fontWeight:'bold',fontSize:16}}>{selectedSeatNumber}</span>
              </div>
            )}
          </div>
        )}
        <div style={{display:'flex',gap:12,alignItems:'center',flexWrap:'wrap'}}>
          {priceInfo && (
            <div style={{padding:'6px 10px',border:'1px solid #3b82f6',borderRadius:8,background:'rgba(59,130,246,0.12)'}}>Precio estimado: <strong>{priceInfo.formattedPrice}</strong></div>
          )}
          <button className="btn-primary" type="submit" disabled={!selected}>
            {selectedSeat ? `Asignar con asiento ${selectedSeatNumber}` : 'Asignar (sin asiento)'}
          </button>
        </div>
      </form>

      {showSeatMap && selected && (
        <AdminSeatMap flightId={flightId} onSelect={(seatId) => {
          setSelectedSeat(seatId);
          if (seatId) {
            seatsApi.getByFlight(flightId).then(seats => {
              const seat = seats.find(s => s.id === seatId);
              if (seat) setSelectedSeatNumber(seat.number);
            });
          } else {
            setSelectedSeatNumber('');
          }
        }} selectedSeatId={selectedSeat} refreshKey={seatMapRefreshKey} />
      )}

      <div className="table" style={{marginTop:12}}>
        <div className="thead" style={{gridTemplateColumns:'repeat(5,minmax(120px,1fr))'}}><div>Nombre</div><div>Email</div><div>Asiento</div><div>Clase</div><div>Acciones</div></div>
        {passengers.map(p => (
          <div className="trow" key={p.id} style={{gridTemplateColumns:'repeat(5,minmax(120px,1fr))'}}>
            <div>{p.user.fullName}</div>
            <div>{p.user.email}</div>
            <div>{p.seat ? p.seat.number : <span className="muted">Sin asignar</span>}</div>
            <div>{p.seat ? (p.seat.seatClass === 'FIRST' ? 'Primera' : p.seat.seatClass === 'PREMIUM' ? 'Premium' : 'Económica') : '-'}</div>
            <div><button className="btn-secondary" onClick={()=>remove(p.user.id)}>Quitar</button></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FlightsWithCounts() {
  const [flights, setFlights] = useState<AdminFlightWithCount[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  async function load() { setFlights(await adminFlightsApi.listWithCounts()); }
  useEffect(() => { load(); }, []);

  async function syncSeats() {
    if (!confirm('¿Sincronizar todos los asientos con los pasajeros reales? Esto corregirá cualquier inconsistencia.')) return;
    setSyncing(true);
    try {
      const result = await seatsApi.syncAll();
      alert(result.message);
      load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al sincronizar');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2>Vuelos (con pasajeros)</h2>
        <button className="btn-secondary" onClick={syncSeats} disabled={syncing}>
          {syncing ? 'Sincronizando...' : '🔄 Sincronizar Asientos'}
        </button>
      </div>
      <div className="table">
        <div className="thead" style={{gridTemplateColumns:'repeat(5,minmax(120px,1fr))'}}><div>Código</div><div>Ruta</div><div>Salida</div><div>Pasajeros</div><div>Acciones</div></div>
        {flights.map(f => (
          <div className="trow" key={f.id} style={{gridTemplateColumns:'repeat(5,minmax(120px,1fr))'}}>
            <div>{f.code}</div>
            <div>{f.origin} → {f.destination}</div>
            <div>{new Date(f.departureAt).toLocaleString()}</div>
            <div>{f.passengerCount}/200</div>
            <div><button className="btn-secondary" onClick={()=>setActive(f.id)}>Gestionar</button></div>
          </div>
        ))}
      </div>
      {active && <FlightPassengersManager flightId={active} />}
    </div>
  );
}

function PaymentsHistory() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<{ total: number; completed: number; pending: number; totalAmount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [integrity, setIntegrity] = useState<{
    totalBookings: number;
    bookingsWithPayments: number;
    bookingsWithoutPayments: number;
    bookingsWithoutPrice: number;
    integrity: {
      hasAllPayments: boolean;
      hasAllPrices: boolean;
      percentageComplete: string;
    };
  } | null>(null);

  async function load() {
    try {
      const [p, s, i] = await Promise.all([
        paymentsApi.history(),
        paymentsApi.stats(),
        paymentsApi.verify(),
      ]);
      setPayments(p);
      setStats(s);
      setIntegrity(i);
    } catch {
      setPayments([]);
      setStats(null);
      setIntegrity(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function syncPayments() {
    if (!confirm('¿Sincronizar todos los pagos faltantes? Esto creará pagos para bookings que no tienen pago asociado.')) return;
    setSyncing(true);
    try {
      const result = await paymentsApi.sync();
      alert(result.message);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al sincronizar pagos');
    } finally {
      setSyncing(false);
    }
  }

  if (loading) return <div className="card">Cargando...</div>;

  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <h2>Historial de Pagos y Check-ins</h2>
        <div style={{display:'flex',gap:8}}>
          <button className="btn-secondary" onClick={() => load()} disabled={loading}>
            🔄 Actualizar
          </button>
          <button className="btn-secondary" onClick={syncPayments} disabled={syncing}>
            {syncing ? 'Sincronizando...' : '💰 Sincronizar Pagos'}
          </button>
        </div>
      </div>
      
      {integrity && !integrity.integrity.hasAllPayments && (
        <div style={{padding:12,marginBottom:16,background:'rgba(239,68,68,0.1)',borderRadius:8,border:'1px solid #ef4444'}}>
          <div style={{fontWeight:'bold',marginBottom:4}}>⚠️ Advertencia: Pagos Faltantes</div>
          <div className="muted" style={{fontSize:14}}>
            {integrity.bookingsWithoutPayments} booking(s) sin pago. 
            Integridad: {integrity.integrity.percentageComplete}
            {' '}
            <button className="btn-secondary" onClick={syncPayments} disabled={syncing} style={{padding:'4px 8px',fontSize:12,marginLeft:8}}>
              Sincronizar ahora
            </button>
          </div>
        </div>
      )}

      {integrity && integrity.integrity.hasAllPayments && (
        <div style={{padding:12,marginBottom:16,background:'rgba(16,185,129,0.1)',borderRadius:8,border:'1px solid #10b981'}}>
          <div style={{fontWeight:'bold',marginBottom:4}}>✅ Integridad de Pagos Completa</div>
          <div className="muted" style={{fontSize:14}}>
            Todos los bookings tienen pagos asociados ({integrity.integrity.percentageComplete})
          </div>
        </div>
      )}
      
      {stats && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:24}}>
          <div style={{padding:16,background:'rgba(59,130,246,0.1)',borderRadius:8,border:'1px solid #3b82f6'}}>
            <div className="muted">Total Pagos</div>
            <div style={{fontSize:24,fontWeight:'bold'}}>{stats.total}</div>
          </div>
          <div style={{padding:16,background:'rgba(16,185,129,0.1)',borderRadius:8,border:'1px solid #10b981'}}>
            <div className="muted">Completados</div>
            <div style={{fontSize:24,fontWeight:'bold'}}>{stats.completed}</div>
          </div>
          <div style={{padding:16,background:'rgba(239,68,68,0.1)',borderRadius:8,border:'1px solid #ef4444'}}>
            <div className="muted">Pendientes</div>
            <div style={{fontSize:24,fontWeight:'bold'}}>{stats.pending}</div>
          </div>
          <div style={{padding:16,background:'rgba(251,191,36,0.1)',borderRadius:8,border:'1px solid #fbbf24'}}>
            <div className="muted">Total Recaudado</div>
            <div style={{fontSize:24,fontWeight:'bold'}}>MXN {stats.totalAmount.toLocaleString('es-MX')}</div>
          </div>
        </div>
      )}

      <div className="table">
        <div className="thead" style={{gridTemplateColumns:'repeat(8,minmax(120px,1fr))'}}>
          <div>Fecha</div><div>Pasajero</div><div>Email</div><div>Vuelo</div><div>Ruta</div><div>Asiento</div><div>Clase</div><div>Precio</div>
        </div>
        {payments.length === 0 ? (
          <div className="trow" style={{gridTemplateColumns:'1fr'}}>
            <div style={{textAlign:'center',padding:24}} className="muted">No hay pagos registrados</div>
          </div>
        ) : (
          payments.map(p => (
            <div className="trow" key={p.id} style={{gridTemplateColumns:'repeat(8,minmax(120px,1fr))'}}>
              <div>{new Date(p.createdAt).toLocaleString()}</div>
              <div>{p.booking.user.fullName}</div>
              <div>{p.booking.user.email}</div>
              <div>{p.booking.flight.code}</div>
              <div>{p.booking.flight.origin} → {p.booking.flight.destination}</div>
              <div>{p.booking.seat ? p.booking.seat.number : <span className="muted">Sin asiento</span>}</div>
              <div>{p.booking.seat ? (p.booking.seat.seatClass === 'FIRST' ? 'Primera' : p.booking.seat.seatClass === 'PREMIUM' ? 'Premium' : 'Económica') : '-'}</div>
              <div style={{fontWeight:'bold',color:'#10b981'}}>MXN {p.amount.toLocaleString('es-MX')}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PendingBookings() {
  const [pending, setPending] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await bookingsApi.listPending();
      setPending(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function approve(id: number) {
    setProcessing(id);
    try {
      await bookingsApi.approve(id);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al aprobar');
    } finally {
      setProcessing(null);
    }
  }

  async function reject(id: number) {
    if (!confirm('¿Rechazar esta reserva?')) return;
    setProcessing(id);
    try {
      await bookingsApi.reject(id);
      await load();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al rechazar');
    } finally {
      setProcessing(null);
    }
  }

  if (loading) return <div className="card">Cargando reservas pendientes...</div>;

  return (
    <div className="card">
      <h2>Reservas Pendientes</h2>
      {pending.length === 0 ? (
        <p className="muted">No hay reservas pendientes.</p>
      ) : (
        <div className="table">
          <div className="thead" style={{gridTemplateColumns:'repeat(8,minmax(120px,1fr))'}}>
            <div>Pasajero</div><div>Email</div><div>Vuelo</div><div>Ruta</div><div>Asiento</div><div>Precio</div><div>Estado</div><div>Acciones</div>
          </div>
          {pending.map(b => (
            <div className="trow" key={b.id} style={{gridTemplateColumns:'repeat(8,minmax(120px,1fr))'}}>
              <div>{b.user?.fullName || '-'}</div>
              <div>{b.user?.email || '-'}</div>
              <div>{b.flight.code}</div>
              <div>{b.flight.origin} → {b.flight.destination}</div>
              <div>{b.seat ? b.seat.number : <span className="muted">Sin asignar</span>}</div>
              <div>MXN {(b.finalPrice || b.price || 0).toLocaleString('es-MX')}</div>
              <div><span className="payment-badge" style={{background:'#fbbf24', color:'#000'}}>PENDIENTE</span></div>
              <div style={{display:'flex',gap:8}}>
                <button className="btn-primary" onClick={() => approve(b.id)} disabled={processing === b.id}>Aprobar</button>
                <button className="btn-secondary" onClick={() => reject(b.id)} disabled={processing === b.id}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AgentApp() {
  return (
    <Layout>
      <Routes>
        <Route index element={<Home />} />
        <Route path="flights" element={<><Flights /><div style={{height:16}} /><FlightsWithCounts /></>} />
        <Route path="passengers" element={<FlightsWithCounts />} />
        <Route path="pending" element={<PendingBookings />} />
        <Route path="payments" element={<PaymentsHistory />} />
        <Route path="*" element={<Navigate to="/agent" replace />} />
      </Routes>
    </Layout>
  );
}

export default function AgentDashboard() { return <AgentApp />; }
