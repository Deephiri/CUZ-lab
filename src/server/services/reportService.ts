import { getDB } from '../db/index.ts';

export interface DashboardSummary {
  counts: {
    pending: number;
    active: number;
    overdue: number;
    returned: number;
    totalLoans: number;
  };
  inventory: {
    totalItems: number;
    availableItems: number;
    borrowedItems: number;
    catalogCount: number;
  };
  stationsCount: number;
  registeredStudentsCount: number;
}

export interface OverdueReportItem {
  loan_id: number;
  student_name: string;
  student_id: string;
  student_email: string;
  equipment_name: string;
  quantity: number;
  station_code: string;
  lab_name: string;
  request_date: string;
  expected_return_date: string;
  days_overdue: number;
}

export class ReportService {
  /**
   * Get overall summary statistics
   */
  static async getSummary(): Promise<DashboardSummary> {
    const db = getDB();

    const [statusRows, invRows, stationRows, userRows] = await Promise.all([
      db.query<{ status: string; count: number }>(
        'SELECT status, count(*) as count FROM loans GROUP BY status'
      ),
      db.query<{ total: number; available: number; count: number }>(
        `SELECT SUM(total_quantity) as total, SUM(available_quantity) as available, COUNT(*) as count FROM equipment WHERE status != 'retired'`
      ),
      db.query<{ count: number }>('SELECT COUNT(*) as count FROM stations'),
      db.query<{ count: number }>(`SELECT COUNT(*) as count FROM users WHERE role = 'student'`),
    ]);

    const counts = {
      pending: 0,
      active: 0,
      overdue: 0,
      returned: 0,
      totalLoans: 0,
    };

    for (const r of statusRows) {
      const c = Number(r.count) || 0;
      counts.totalLoans += c;
      if (r.status === 'Pending') counts.pending = c;
      if (r.status === 'Approved') counts.active = c;
      if (r.status === 'Overdue') counts.overdue = c;
      if (r.status === 'Returned') counts.returned = c;
    }

    const totalQty = Number(invRows[0]?.total) || 0;
    const availQty = Number(invRows[0]?.available) || 0;

    return {
      counts,
      inventory: {
        totalItems: totalQty,
        availableItems: availQty,
        borrowedItems: Math.max(0, totalQty - availQty),
        catalogCount: Number(invRows[0]?.count) || 0,
      },
      stationsCount: Number(stationRows[0]?.count) || 0,
      registeredStudentsCount: Number(userRows[0]?.count) || 0,
    };
  }

  /**
   * Get list of overdue loans with days overdue calculated
   */
  static async getOverdueList(): Promise<OverdueReportItem[]> {
    const db = getDB();
    const rows = await db.query<any>(
      `SELECT l.loan_id, l.quantity, l.request_date, l.expected_return_date, l.station_code,
              u.full_name as student_name, u.student_staff_id as student_id, u.email as student_email,
              e.object_name as equipment_name,
              s.lab_name,
              CAST((strftime('%s', 'now') - strftime('%s', l.expected_return_date)) / 86400 AS INTEGER) as days_overdue
       FROM loans l
       JOIN users u ON l.user_id = u.user_id
       JOIN equipment e ON l.equipment_id = e.equipment_id
       LEFT JOIN stations s ON l.station_code = s.station_code
       WHERE l.status = 'Overdue' OR (l.status = 'Approved' AND l.expected_return_date < date('now'))
       ORDER BY l.expected_return_date ASC`
    );

    return rows.map(r => ({
      ...r,
      days_overdue: Math.max(1, Number(r.days_overdue) || 1),
    }));
  }

  /**
   * Export loans to standard CSV format
   */
  static async exportLoansCSV(startDate?: string, endDate?: string, status?: string): Promise<string> {
    const db = getDB();
    let sql = `
      SELECT l.loan_id,
             u.student_staff_id, u.full_name as student_name, u.email as student_email,
             e.object_name as equipment_name, e.category,
             l.quantity, l.station_code,
             l.request_date, l.expected_return_date, l.actual_return_date,
             l.status,
             h.full_name as handled_by_name,
             l.notes, l.rejection_reason
      FROM loans l
      JOIN users u ON l.user_id = u.user_id
      JOIN equipment e ON l.equipment_id = e.equipment_id
      LEFT JOIN users h ON l.handled_by = h.user_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (startDate) {
      sql += ' AND date(l.request_date) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND date(l.request_date) <= ?';
      params.push(endDate);
    }
    if (status && status !== 'all') {
      sql += ' AND l.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY l.request_date DESC';

    const rows = await db.query<any>(sql, params);

    // Build CSV string
    const headers = [
      'Loan ID',
      'Student ID',
      'Student Name',
      'Student Email',
      'Equipment Item',
      'Category',
      'Quantity',
      'Station Code',
      'Request Date',
      'Expected Return Date',
      'Actual Return Date',
      'Status',
      'Handled By Staff',
      'Notes',
      'Rejection Reason',
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const lines = [headers.join(',')];

    for (const r of rows) {
      const line = [
        escapeCsv(r.loan_id),
        escapeCsv(r.student_staff_id),
        escapeCsv(r.student_name),
        escapeCsv(r.student_email),
        escapeCsv(r.equipment_name),
        escapeCsv(r.category),
        escapeCsv(r.quantity),
        escapeCsv(r.station_code),
        escapeCsv(r.request_date),
        escapeCsv(r.expected_return_date),
        escapeCsv(r.actual_return_date || 'N/A'),
        escapeCsv(r.status),
        escapeCsv(r.handled_by_name || 'N/A'),
        escapeCsv(r.notes || ''),
        escapeCsv(r.rejection_reason || ''),
      ];
      lines.push(line.join(','));
    }

    return lines.join('\r\n');
  }

  /**
   * Get audit log history
   */
  static async getAuditLogs(limit = 100): Promise<any[]> {
    const db = getDB();
    return await db.query(
      `SELECT a.*,
              u.full_name as changed_by_name, u.role as changed_by_role,
              l.station_code,
              e.object_name as equipment_name,
              st.full_name as student_name, st.student_staff_id as student_id
       FROM loan_audit_logs a
       LEFT JOIN users u ON a.changed_by = u.user_id
       JOIN loans l ON a.loan_id = l.loan_id
       JOIN equipment e ON l.equipment_id = e.equipment_id
       JOIN users st ON l.user_id = st.user_id
       ORDER BY a.changed_at DESC
       LIMIT ?`,
      [limit]
    );
  }
}
