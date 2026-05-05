import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Si el servidor dice que no estamos autorizados, limpiar y recargar
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export type User = {
  id: number;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'AGENT' | 'PASSENGER';
  loyaltyPoints?: number;
  loyaltyTier?: string;
  lastLogin?: string;
  lastLogout?: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

// Admin Users
export type CreateUserDto = { email: string; password: string; fullName: string; role: User['role'] };
export type UpdateUserDto = Partial<{ fullName: string; password: string; role: User['role'] }>;

export const adminUsersApi = {
  list: () => api.get<User[]>('/admin/users').then(r => r.data),
  create: (dto: CreateUserDto) => api.post('/admin/users', dto).then(r => r.data),
  update: (id: number, dto: UpdateUserDto) => api.put(`/admin/users/${id}`, dto).then(r => r.data),
  delete: (id: number) => api.delete(`/admin/users/${id}`).then(r => r.data),
};

// Flights
export type Flight = {
  id: number;
  code: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  numeroAvion?: string;
  categoria?: 'BASIC' | 'PRIVATE' | 'INTERNATIONAL';
  lugarArribo?: string;
  puertaArribo?: string;
  checkInTime?: string;
};
export type CreateFlightDto = {
  code: string;
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  seatsTotal: number;
  numeroAvion?: string;
  categoria?: 'BASIC' | 'PRIVATE' | 'INTERNATIONAL';
  lugarArribo?: string;
  puertaArribo?: string;
  checkInTime?: string;
};
export type UpdateFlightDto = Partial<{
  origin: string;
  destination: string;
  departureAt: string;
  arrivalAt: string;
  seatsTotal: number;
  seatsAvailable: number;
  numeroAvion: string;
  categoria: 'BASIC' | 'PRIVATE' | 'INTERNATIONAL';
  lugarArribo: string;
  puertaArribo: string;
  checkInTime: string;
}>;

export const flightsApi = {
  list: () => api.get<Flight[]>('/flights').then(r => r.data),
  create: (dto: CreateFlightDto) => api.post('/flights', dto).then(r => r.data),
  update: (id: number, dto: UpdateFlightDto) => api.put(`/flights/${id}`, dto).then(r => r.data),
  delete: (id: number) => api.delete(`/flights/${id}`).then(r => r.data),
};

// Seats
export type Seat = { id: number; number: string; seatClass: 'FIRST' | 'PREMIUM' | 'ECONOMY'; isOccupied: boolean };

export const seatsApi = {
  getByFlight: (flightId: number) => api.get<Seat[]>(`/seats/${flightId}`).then(r => r.data),
  bookSeat: (flightId: number, seatId: number) => api.post(`/seats/${flightId}/book`, { seatId }).then(r => r.data),
  syncAll: () => api.post<{ message: string; updated: number }>('/seats/sync-all').then(r => r.data),
};

// Bookings
export type Booking = { 
  id: number; 
  createdAt: string; 
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  flight: Flight; 
  seat?: Seat | null; 
  price?: number | null;
  finalPrice?: number | null;
  discountPercent?: number | null;
  paymentMethod?: 'EFECTIVO' | 'TARJETA' | null;
  payment?: {
    id: number;
    amount: number;
    status: string;
    paymentMethod: 'EFECTIVO' | 'TARJETA';
    createdAt: string;
  } | null;
  offer?: {
    id: number;
    destination: string;
    description: string;
  } | null;
  user?: {
    id: number;
    email: string;
    fullName: string;
  };
};

export const bookingsApi = {
  myBookings: () => api.get<Booking[]>('/bookings/me').then(r => r.data),
  listPending: () => api.get<Booking[]>('/bookings/pending').then(r => r.data),
  getTicket: (flightId: number) => api.get<Booking>(`/bookings/${flightId}/ticket`).then(r => r.data),
  create: (flightId: number, seatId?: number, offerId?: number, discountPercent?: number, paymentMethod?: 'EFECTIVO' | 'TARJETA') => api.post('/bookings', { flightId, seatId, offerId, discountPercent, paymentMethod }).then(r => r.data),
  approve: (id: number) => api.post(`/bookings/${id}/approve`, {}).then(r => r.data),
  reject: (id: number) => api.post(`/bookings/${id}/reject`, {}).then(r => r.data),
  email: (id: number, to?: string) => api.post(`/bookings/${id}/email`, { to }).then(r => r.data),
  cancel: (flightId: number) => api.delete(`/bookings/${flightId}`).then(r => r.data),
};

// Admin flights with passengers
export type AdminFlightWithCount = Flight & { passengerCount: number };
export type PassengerLite = { id: number; email: string; fullName: string };

export const adminFlightsApi = {
  listWithCounts: () => api.get<AdminFlightWithCount[]>('/admin/flights').then(r => r.data),
  listPassengers: (flightId: number) => api.get<{ id: number; user: PassengerLite; seat?: { id: number; number: string; seatClass: string } | null }[]>(`/admin/flights/${flightId}/passengers`).then(r => r.data),
  addPassenger: (flightId: number, userId: number, seatId?: number) => api.post(`/admin/flights/${flightId}/passengers`, { userId, seatId }).then(r => r.data),
  removePassenger: (flightId: number, userId: number) => api.delete(`/admin/flights/${flightId}/passengers/${userId}`).then(r => r.data),
  listAllPassengers: () => api.get<PassengerLite[]>('/admin/flights/passengers').then(r => r.data),
};

// Payments
export type Payment = {
  id: number;
  bookingId: number;
  amount: number;
  status: string;
  createdAt: string;
  booking: {
    user: { id: number; email: string; fullName: string };
    flight: {
      id: number;
      code: string;
      origin: string;
      destination: string;
      categoria: string;
      departureAt: string;
      arrivalAt: string;
    };
    seat: { id: number; number: string; seatClass: string } | null;
    price: number;
  };
};

export type PriceCalculation = {
  flightId: number;
  seatId: number | null;
  categoria: string;
  seatClass: string;
  price: number;
  formattedPrice: string;
};

export const paymentsApi = {
  history: () => api.get<Payment[]>('/payments/history').then(r => r.data),
  stats: () => api.get<{ total: number; completed: number; pending: number; totalAmount: number }>('/payments/stats').then(r => r.data),
  sync: () => api.post<{ message: string; paymentsCreated: number; pricesUpdated: number }>('/payments/sync').then(r => r.data),
  verify: () => api.get<{ 
    totalBookings: number; 
    bookingsWithPayments: number; 
    bookingsWithoutPayments: number; 
    bookingsWithoutPrice: number;
    integrity: {
      hasAllPayments: boolean;
      hasAllPrices: boolean;
      percentageComplete: string;
    };
  }>('/payments/verify').then(r => r.data),
};

export const pricingApi = {
  calculate: (flightId: number, seatId?: number) => api.get<PriceCalculation>(`/flights/${flightId}/price${seatId ? `?seatId=${seatId}` : ''}`).then(r => r.data),
};

// Stripe
export const stripeApi = {
  status: () => api.get<{ configured: boolean; publishableKey: string | null }>('/stripe/status').then(r => r.data),
  createSession: (bookingId: number) => api.post<{ sessionId: string; url: string }>('/stripe/create-checkout-session', { bookingId }).then(r => r.data),
  getSessionStatus: (sessionId: string) => api.get<{ status: string; bookingId: string; amountTotal: number; currency: string }>(`/stripe/session/${sessionId}`).then(r => r.data),
};

// Travel Offers
export type TravelOffer = {
  id: number;
  destination: string;
  description: string;
  imageUrl: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  destinationCode: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTravelOfferDto = {
  destination: string;
  description: string;
  imageUrl: string;
  originalPrice: number;
  discountPrice: number;
  discountPercent: number;
  destinationCode?: string;
};

export type UpdateTravelOfferDto = Partial<CreateTravelOfferDto> & {
  isActive?: boolean;
};

export const travelOffersApi = {
  listActive: () => api.get<TravelOffer[]>('/travel-offers/active').then(r => r.data),
  list: () => api.get<TravelOffer[]>('/travel-offers').then(r => r.data),
  get: (id: number) => api.get<TravelOffer>(`/travel-offers/${id}`).then(r => r.data),
  create: (dto: CreateTravelOfferDto) => api.post<TravelOffer>('/travel-offers', dto).then(r => r.data),
  update: (id: number, dto: UpdateTravelOfferDto) => api.put<TravelOffer>(`/travel-offers/${id}`, dto).then(r => r.data),
  delete: (id: number) => api.delete(`/travel-offers/${id}`).then(r => r.data),
};


