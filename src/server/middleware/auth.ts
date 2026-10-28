import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cuz-lab-secret-jwt-key-minimum-32-chars-long';

export interface AuthUser {
  userId: number;
  studentStaffId: string;
  fullName: string;
  email: string;
  role: 'student' | 'technician' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      studentStaffId: user.studentStaffId,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  // Check cookie first, then Authorization Bearer header
  let token = req.cookies?.cuz_token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ success: false, error: 'Invalid or expired session. Please log in again.' });
  }
}

export function requireRole(...roles: Array<'student' | 'technician' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access denied. Requires one of: ${roles.join(', ')}`,
      });
      return;
    }

    next();
  };
}
