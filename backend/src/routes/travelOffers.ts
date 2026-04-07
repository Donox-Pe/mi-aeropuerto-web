import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import {
  listOffers,
  listActiveOffers,
  getOffer,
  createOffer,
  updateOffer,
  deleteOffer,
} from '../controllers/travelOfferController.js';

const router = Router();

// Público: obtener ofertas activas
router.get('/active', listActiveOffers);

// Solo admins y agentes pueden gestionar ofertas
router.use(requireAuth, requireRole('ADMIN', 'AGENT'));

router.get('/', listOffers);
router.get('/:id', getOffer);
router.post('/', createOffer);
router.put('/:id', updateOffer);
router.delete('/:id', deleteOffer);

export default router;


