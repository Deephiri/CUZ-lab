import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.ts';
import userRoutes from './routes/userRoutes.ts';
import equipmentRoutes from './routes/equipmentRoutes.ts';
import stationRoutes from './routes/stationRoutes.ts';
import loanRoutes from './routes/loanRoutes.ts';
import reportRoutes from './routes/reportRoutes.ts';
import { getDB } from './db/index.ts';

export function createApp() {
  const app = express();

  // Basic security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // disabled for Vite SPA development and iframe rendering
      crossOriginEmbedderPolicy: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Rate limiting for auth
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 attempts per window
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many authentication attempts. Please try again later.' },
  });

  // Health check endpoint
  app.get('/health', async (req: Request, res: Response) => {
    let dbStatus = 'healthy';
    try {
      const db = getDB();
      await db.query('SELECT 1');
    } catch (err: any) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    res.json({
      status: 'UP',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: 'CUZ Lab Equipment Borrowing System',
      institution: 'Cavendish University Zambia',
      database: dbStatus,
      version: '1.0.0',
    });
  });

  // API Routes
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/equipment', equipmentRoutes);
  app.use('/api/stations', stationRoutes);
  app.use('/api/loans', loanRoutes);
  app.use('/api/reports', reportRoutes);

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled Application Error:', err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'An unexpected server error occurred',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
