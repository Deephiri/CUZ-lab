import { Router } from 'express';
import { LoanController } from '../controllers/loanController.ts';
import { authenticateToken, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken);

// Student actions
router.post('/', requireRole('student', 'technician', 'admin'), LoanController.create);
router.get('/mine', requireRole('student', 'technician', 'admin'), LoanController.getMine);
router.get('/eligibility', requireRole('student', 'technician', 'admin'), LoanController.checkEligibility);

// Staff actions
router.get('/', requireRole('technician', 'admin'), LoanController.list);
router.patch('/:id/approve', requireRole('technician', 'admin'), LoanController.approve);
router.patch('/:id/reject', requireRole('technician', 'admin'), LoanController.reject);
router.patch('/:id/return', requireRole('technician', 'admin'), LoanController.returnEquipment);

// Cron trigger endpoint for testing & automated checks
router.post('/cron/check-overdue', requireRole('technician', 'admin'), LoanController.runOverdueCheck);

export default router;
