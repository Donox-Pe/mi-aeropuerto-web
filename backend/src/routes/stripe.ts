import { Router } from 'express';
import { requireAuth } from '../middlewares/authMiddleware.js';
import {
  createStripeSession,
  handleWebhook,
  getSessionStatus,
  getStripeStatus,
} from '../controllers/stripeController.js';

const router = Router();

// Estado de Stripe
router.get('/status', getStripeStatus);

// Crear sesión de checkout (requiere auth)
router.post('/create-checkout-session', requireAuth, createStripeSession);

// Consultar estado de sesión (requiere auth)
router.get('/session/:sessionId', requireAuth, getSessionStatus);

// Webhook se registra por separado en server.ts con raw body parser

export default router;
