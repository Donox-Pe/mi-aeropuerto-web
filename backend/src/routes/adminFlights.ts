import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { listFlightsWithCounts, listPassengersByFlight, assignPassenger, removePassenger, listAllPassengers } from '../controllers/adminFlightPassengersController.js';

const router = Router();
// Permitir a ADMIN y AGENT gestionar vuelos y pasajeros
router.use(requireAuth, requireRole('ADMIN', 'AGENT'));

router.get('/', listFlightsWithCounts);
router.get('/passengers', listAllPassengers);
router.get('/:id/passengers', listPassengersByFlight);
router.post('/:id/passengers', assignPassenger);
router.delete('/:id/passengers/:userId', removePassenger);

export default router;






