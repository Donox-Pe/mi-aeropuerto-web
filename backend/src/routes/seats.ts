import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { getSeatsByFlight, bookSeat, syncAllSeats } from '../controllers/seatController.js';

const router = Router();

router.get('/:id', requireAuth, getSeatsByFlight);
router.post('/:id/book', requireAuth, bookSeat);
router.post('/sync-all', requireAuth, requireRole('ADMIN', 'AGENT'), syncAllSeats);

export default router;



