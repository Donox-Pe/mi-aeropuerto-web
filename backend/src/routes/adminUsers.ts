import { Router } from 'express';
import { requireAuth, requireRole } from '../middlewares/authMiddleware.js';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/adminUserController.js';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));
router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;








