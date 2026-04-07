import { Router } from 'express';
import { createBooking, myBookings, cancelBooking, getTicket, approveBooking, rejectBooking, listPendingBookings, emailTicket } from '../controllers/bookingController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/me', requireAuth, requireRole('PASSENGER', 'AGENT', 'ADMIN'), myBookings);
router.get('/pending', requireAuth, requireRole('ADMIN', 'AGENT'), listPendingBookings);
router.get('/:id/ticket', requireAuth, requireRole('PASSENGER', 'AGENT', 'ADMIN'), getTicket);
router.post('/', requireAuth, requireRole('PASSENGER', 'AGENT', 'ADMIN'), createBooking);
router.post('/:id/approve', requireAuth, requireRole('ADMIN', 'AGENT'), approveBooking);
router.post('/:id/reject', requireAuth, requireRole('ADMIN', 'AGENT'), rejectBooking);
router.post('/:id/email', requireAuth, requireRole('PASSENGER', 'AGENT', 'ADMIN'), emailTicket);
router.delete('/:id', requireAuth, requireRole('PASSENGER', 'AGENT', 'ADMIN'), cancelBooking);

export default router;


