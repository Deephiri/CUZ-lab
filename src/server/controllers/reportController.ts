import { Request, Response } from 'express';
import { ReportService } from '../services/reportService.ts';

export class ReportController {
  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      const summary = await ReportService.getSummary();
      res.json({ success: true, summary });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getOverdue(req: Request, res: Response): Promise<void> {
    try {
      const overdueList = await ReportService.getOverdueList();
      res.json({ success: true, overdueList });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async exportCSV(req: Request, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const status = req.query.status as string | undefined;

      const csv = await ReportService.exportLoansCSV(startDate, endDate, status);

      const filename = `cuz_lab_loans_report_${new Date().toISOString().split('T')[0]}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 100;
      const logs = await ReportService.getAuditLogs(limit);
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
