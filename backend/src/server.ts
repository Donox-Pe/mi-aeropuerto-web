import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import authRoutes from './routes/auth.js';
import flightRoutes from './routes/flights.js';
import bookingRoutes from './routes/bookings.js';
import adminUsersRoutes from './routes/adminUsers.js';
import adminFlightsRoutes from './routes/adminFlights.js';
import seatsRoutes from './routes/seats.js';
import paymentsRoutes from './routes/payments.js';
import travelOffersRoutes from './routes/travelOffers.js';
import stripeRoutes from './routes/stripe.js';
import notificationRoutes from './routes/notifications.js';
import { handleWebhook } from './controllers/stripeController.js';
import { apiRateLimiter } from './middlewares/rateLimiter.js';

dotenv.config();

export function createServer() {
  const app = express();

  // Confiar en el proxy (necesario para Render/Heroku para detectar el IP real)
  app.set('trust proxy', 1);

  // CORS
  app.use(cors());

  // Stripe webhook necesita raw body ANTES de express.json()
  app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleWebhook);

  // Parsers normales
  app.use(express.json());
  app.use(morgan('dev'));

  // Rate limiter general
  app.use(apiRateLimiter);

  // Health check
  app.get('/health', (_req, res) => res.json({ ok: true }));

  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/flights', flightRoutes);
  app.use('/api/bookings', bookingRoutes);
  app.use('/api/admin/users', adminUsersRoutes);
  app.use('/api/admin/flights', adminFlightsRoutes);
  app.use('/api/seats', seatsRoutes);
  app.use('/api/payments', paymentsRoutes);
  app.use('/api/travel-offers', travelOffersRoutes);
  app.use('/api/stripe', stripeRoutes);
  app.use('/api/notifications', notificationRoutes);
  
  // Servir frontend en producción (solo si existe la carpeta dist)
  const frontendPath = path.resolve(__dirname, '../../frontend/dist');
  
  if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(frontendPath, 'index.html'));
    });
  } else {
    // Si no hay frontend, responder algo básico en el root
    app.get('/', (req, res) => {
      res.json({ message: 'AeroAzteca API Online', version: '1.0.0' });
    });
  }
  
  // Manejador de errores global
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('SERVER ERROR:', err);
    res.status(500).json({ message: 'Error interno del servidor', error: err.message });
  });

  return app;
}
