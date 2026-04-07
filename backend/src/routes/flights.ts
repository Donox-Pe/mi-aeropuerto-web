import { Router } from 'express';
import { listFlights, createFlight, updateFlight, deleteFlight, calculatePrice } from '../controllers/flightController.js';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { cacheRoute } from '../middlewares/cacheMiddleware.js';

const router = Router();

// Cache de 60 segundos para lista de vuelos
router.get('/', requireAuth, cacheRoute(60, 'flights'), listFlights);
router.get('/:id/price', requireAuth, calculatePrice);
router.post('/', requireAuth, requireRole('ADMIN', 'AGENT'), createFlight);
router.put('/:id', requireAuth, requireRole('ADMIN', 'AGENT'), updateFlight);
router.delete('/:id', requireAuth, requireRole('ADMIN', 'AGENT'), deleteFlight);

export default router;
