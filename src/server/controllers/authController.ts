import { Request, Response } from 'express';
import { AuthService } from '../services/authService.ts';
import { EmailService } from '../services/emailService.ts';
import { LoanService } from '../services/loanService.ts';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { identifier, password } = req.body;
      const result = await AuthService.login(identifier, password);

      // Set httpOnly cookie
      res.cookie('cuz_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000, // 12 hours
      });

      res.json({
        success: true,
        message: 'Login successful',
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async registerStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, fullName, email, password } = req.body;
      const result = await AuthService.registerStudent({
        studentId,
        fullName,
        email,
        password,
      });

      // Automatically log the new student in
      res.cookie('cuz_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: 'Account registered successfully! A confirmation receipt has been sent to your email.',
        user: result.user,
        token: result.token,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    res.clearCookie('cuz_token');
    res.json({ success: true, message: 'Logged out successfully' });
  }

  static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }

    let extraInfo: any = {};
    if (req.user.role === 'student') {
      const eligibility = await LoanService.checkStudentEligibility(req.user.userId);
      extraInfo = {
        canBorrow: eligibility.canBorrow,
        activeLoanCount: eligibility.activeLoanCount,
        hasOverdue: eligibility.hasOverdue,
        eligibilityReason: eligibility.reason,
      };
    }

    res.json({
      success: true,
      user: {
        ...req.user,
        ...extraInfo,
      },
    });
  }

  static async getReceipts(req: Request, res: Response): Promise<void> {
    const emailFilter = req.user?.role === 'student' ? req.user.email : undefined;
    const receipts = EmailService.getDispatchedReceipts(emailFilter);
    res.json({ success: true, receipts });
  }

  static async createStaff(req: Request, res: Response): Promise<void> {
    try {
      const { staffId, fullName, email, password, role } = req.body;
      const result = await AuthService.createStaff({
        staffId,
        fullName,
        email,
        password,
        role,
      });

      res.status(201).json({
        success: true,
        message: `Staff member ${fullName} (${role}) added successfully.`,
        data: result,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async listUsers(req: Request, res: Response): Promise<void> {
    try {
      const role = req.query.role as string | undefined;
      const users = await AuthService.getAllUsers(role);
      res.json({ success: true, users });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async updateUserRole(req: Request, res: Response): Promise<void> {
    try {
      const userId = Number(req.params.id);
      const { role } = req.body;
      if (!['student', 'technician', 'admin'].includes(role)) {
        res.status(400).json({ success: false, error: 'Invalid role' });
        return;
      }

      await AuthService.updateUserRole(userId, role);
      res.json({ success: true, message: 'User role updated successfully' });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}
