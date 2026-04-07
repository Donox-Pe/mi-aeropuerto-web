import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { getPaymentHistory, getPaymentStats, syncMissingPayments, verifyPaymentsIntegrity } from '../controllers/paymentController.js';

const router = Router();

// Solo agentes y admins pueden ver el historial de pagos
router.get('/history', requireAuth, requireRole('AGENT', 'ADMIN'), getPaymentHistory);
router.get('/stats', requireAuth, requireRole('AGENT', 'ADMIN'), getPaymentStats);
router.post('/sync', requireAuth, requireRole('AGENT', 'ADMIN'), syncMissingPayments);
router.get('/verify', requireAuth, requireRole('AGENT', 'ADMIN'), verifyPaymentsIntegrity);

export default router;

