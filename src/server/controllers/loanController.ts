import { Request, Response } from 'express';
import { LoanService } from '../services/loanService.ts';

export class LoanController {
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { equipmentId, quantity, expectedReturnDate, stationCode, notes } = req.body;

      if (!equipmentId || !expectedReturnDate || !stationCode) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: equipmentId, expectedReturnDate, and stationCode are required',
        });
        return;
      }

      const loan = await LoanService.createLoanRequest({
        userId,
        equipmentId: Number(equipmentId),
        quantity: Number(quantity) || 1,
        expectedReturnDate,
        stationCode,
        notes,
      });

      res.status(201).json({
        success: true,
        message: 'Borrow request submitted successfully! Awaiting lab technician handover.',
        loan,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async getMine(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const data = await LoanService.getStudentLoans(userId);
      res.json({ success: true, ...data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async checkEligibility(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const status = await LoanService.checkStudentEligibility(userId);
      res.json({ success: true, ...status });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async list(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const stationCode = req.query.stationCode as string | undefined;
      const searchQuery = req.query.q as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;

      const loans = await LoanService.getLoans({
        status,
        stationCode,
        searchQuery,
        limit,
      });

      res.json({ success: true, loans });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async approve(req: Request, res: Response): Promise<void> {
    try {
      const loanId = Number(req.params.id);
      const technicianId = req.user!.userId;

      const loan = await LoanService.approveLoan(loanId, technicianId);
      res.json({
        success: true,
        message: `Loan #${loanId} approved. Equipment physically handed over to student.`,
        loan,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async reject(req: Request, res: Response): Promise<void> {
    try {
      const loanId = Number(req.params.id);
      const technicianId = req.user!.userId;
      const { reason } = req.body;

      if (!reason || reason.trim().length === 0) {
        res.status(400).json({ success: false, error: 'Rejection reason is required' });
        return;
      }

      const loan = await LoanService.rejectLoan(loanId, technicianId, reason);
      res.json({
        success: true,
        message: `Loan #${loanId} rejected. Reserved stock has been restored to catalog.`,
        loan,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async returnEquipment(req: Request, res: Response): Promise<void> {
    try {
      const loanId = Number(req.params.id);
      const technicianId = req.user!.userId;
      const { notes } = req.body;

      const loan = await LoanService.returnLoan(loanId, technicianId, notes);
      res.json({
        success: true,
        message: `Loan #${loanId} marked as Returned. Available stock restored.`,
        loan,
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  static async runOverdueCheck(req: Request, res: Response): Promise<void> {
    try {
      const count = await LoanService.flagOverdueLoans();
      res.json({ success: true, message: `Overdue check complete. Flagged: ${count}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
