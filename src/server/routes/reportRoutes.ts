import { Router } from 'express';
import { ReportController } from '../controllers/reportController.ts';
import { authenticateToken, requireRole } from '../middleware/auth.ts';

const router = Router();

router.use(authenticateToken);
router.use(requireRole('technician', 'admin'));

router.get('/summary', ReportController.getSummary);
router.get('/overdue', ReportController.getOverdue);
router.get('/export.csv', ReportController.exportCSV);
router.get('/audit-logs', ReportController.getAuditLogs);

export default router;
