import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { authenticateToken, requireRole } from '../middleware/auth.ts';

const router = Router();

// Staff & Admin endpoints
router.use(authenticateToken);
router.get('/', requireRole('admin', 'technician'), AuthController.listUsers);
router.post('/staff', requireRole('admin'), AuthController.createStaff);
router.patch('/:id/role', requireRole('admin'), AuthController.updateUserRole);

export default router;
