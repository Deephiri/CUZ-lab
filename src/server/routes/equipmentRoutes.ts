import { Router } from 'express';
import { EquipmentController } from '../controllers/equipmentController.ts';
import { authenticateToken, requireRole } from '../middleware/auth.ts';

const router = Router();

// Catalog is accessible to students and staff
router.get('/', EquipmentController.getCatalog);
router.get('/:id', EquipmentController.getById);

// Inventory mutations require technician or admin role
router.post('/', authenticateToken, requireRole('technician', 'admin'), EquipmentController.create);
router.put('/:id', authenticateToken, requireRole('technician', 'admin'), EquipmentController.update);
router.patch('/:id/stock', authenticateToken, requireRole('technician', 'admin'), EquipmentController.adjustStock);

export default router;
