import { Router } from 'express';
import { AuthController } from '../controllers/authController.ts';
import { authenticateToken } from '../middleware/auth.ts';

const router = Router();

// Public routes
router.post('/login', AuthController.login);
router.post('/register', AuthController.registerStudent);
router.post('/register-student', AuthController.registerStudent);
router.post('/logout', AuthController.logout);

// Protected routes
router.get('/me', authenticateToken, AuthController.me);
router.get('/receipts', authenticateToken, AuthController.getReceipts);

export default router;
