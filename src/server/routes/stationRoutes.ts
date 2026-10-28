import { Router } from 'express';
import { StationController } from '../controllers/stationController.ts';
import { authenticateToken, requireRole } from '../middleware/auth.ts';

const router = Router();

// Public / student station verification and QR retrieval
router.get('/', StationController.list);
router.get('/:code', StationController.getByCode);
router.get('/:code/qr', StationController.getQR);

// Admin station creation
router.post('/', authenticateToken, requireRole('admin'), StationController.create);

export default router;
