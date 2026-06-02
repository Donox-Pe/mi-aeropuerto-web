import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { getAnalytics } from '../controllers/analyticsController.js';

const router = Router();

// Solo admins pueden acceder a las analíticas
router.use(requireAuth, requireRole('ADMIN'));
router.get('/', getAnalytics);

export default router;
