import { getDB } from '../db/index.ts';
import { EmailService } from './emailService.ts';

export interface LoanRecord {
  loan_id: number;
  user_id: number;
  equipment_id: number;
  quantity: number;
  request_date: string;
  expected_return_date: string;
  actual_return_date?: string | null;
  status: 'Pending' | 'Approved' | 'Returned' | 'Overdue' | 'Rejected';
  handled_by?: number | null;
  station_code: string;
  notes?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  student_name?: string;
  student_id_code?: string;
  student_email?: string;
  equipment_name?: string;
  category?: string;
  handler_name?: string;
  station_name?: string;
  days_overdue?: number;
  hours_until_due?: number;
}

export class LoanService {
  private static MAX_ACTIVE_LOANS = Number(process.env.MAX_ACTIVE_LOANS_PER_STUDENT) || 3;
  private static MAX_LOAN_DAYS = Number(process.env.MAX_LOAN_DAYS) || 14;
  private static PENDING_EXPIRY_MINUTES = Number(process.env.PENDING_EXPIRY_MINUTES) || 30;

  /**
   * Check if a student is eligible to borrow
   */
  static async checkStudentEligibility(userId: number): Promise<{
    canBorrow: boolean;
    reason?: string;
    activeLoanCount: number;
    hasOverdue: boolean;
  }> {
    const db = getDB();

    // Check overdue loans
    const overdueLoans = await db.query<LoanRecord>(
      `SELECT loan_id FROM loans WHERE user_id = ? AND status = 'Overdue' LIMIT 1`,
      [userId]
    );

    if (overdueLoans.length > 0) {
      return {
        canBorrow: false,
        reason: 'You have one or more overdue loans. All overdue equipment must be returned before new requests can be made.',
        activeLoanCount: 0,
        hasOverdue: true,
      };
    }

    // Check active loans (Pending or Approved)
    const activeLoans = await db.query<{ count: number }>(
      `SELECT count(*) as count FROM loans WHERE user_id = ? AND status IN ('Pending', 'Approved')`,
      [userId]
    );

    const activeCount = Number(activeLoans[0]?.count) || 0;
    if (activeCount >= this.MAX_ACTIVE_LOANS) {
      return {
        canBorrow: false,
        reason: `Borrowing limit reached: You currently have ${activeCount} active loan(s). Cavendish University lab policy limits each student to ${this.MAX_ACTIVE_LOANS} concurrent loans.`,
        activeLoanCount: activeCount,
        hasOverdue: false,
      };
    }

    return {
      canBorrow: true,
      activeLoanCount: activeCount,
      hasOverdue: false,
    };
  }

  /**
   * Student submits a borrow request
   * Implements strict DB transaction with row locking and temporary stock reservation
   */
  static async createLoanRequest(data: {
    userId: number;
    equipmentId: number;
    quantity: number;
    expectedReturnDate: string;
    stationCode: string;
    notes?: string;
  }): Promise<LoanRecord> {
    const { userId, equipmentId, quantity, expectedReturnDate, stationCode, notes } = data;

    // Validate inputs
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      throw new Error('Quantity must be at least 1 unit');
    }

    // Validate return date range (min = today, max = today + 14 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const returnDate = new Date(expectedReturnDate);
    returnDate.setHours(0, 0, 0, 0);

    if (isNaN(returnDate.getTime())) {
      throw new Error('Please select a valid expected return date');
    }

    if (returnDate < today) {
      throw new Error('Return date cannot be in the past');
    }

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + this.MAX_LOAN_DAYS);
    if (returnDate > maxDate) {
      const maxStr = maxDate.toISOString().split('T')[0];
      throw new Error(`Maximum loan duration is ${this.MAX_LOAN_DAYS} days (latest return date allowed: ${maxStr})`);
    }

    // Check eligibility
    const eligibility = await this.checkStudentEligibility(userId);
    if (!eligibility.canBorrow) {
      throw new Error(eligibility.reason || 'You are not currently eligible to borrow equipment');
    }

    const db = getDB();

    // Execute with transaction and row lock
    const loanId = await db.withTransaction(async tx => {
      // 1. Lock and check equipment row
      const equipmentRows = await tx.query<any>(
        'SELECT equipment_id, object_name, available_quantity, status FROM equipment WHERE equipment_id = ? FOR UPDATE',
        [equipmentId]
      );

      if (equipmentRows.length === 0) {
        throw new Error('The selected equipment does not exist');
      }

      const item = equipmentRows[0];
      if (item.status !== 'active') {
        throw new Error(`Item "${item.object_name}" is currently under maintenance or retired`);
      }

      if (item.available_quantity < qty) {
        throw new Error(
          `Insufficient stock: Only ${item.available_quantity} unit(s) of "${item.object_name}" available at this moment.`
        );
      }

      // 2. Temporarily RESERVE stock (decrement available_quantity)
      await tx.execute(
        'UPDATE equipment SET available_quantity = available_quantity - ? WHERE equipment_id = ?',
        [qty, equipmentId]
      );

      // 3. Create Loan with status Pending
      const insertResult = await tx.execute(
        `INSERT INTO loans (user_id, equipment_id, quantity, expected_return_date, station_code, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
        [userId, equipmentId, qty, expectedReturnDate, stationCode, notes || '']
      );

      const newLoanId = insertResult.insertId!;

      // 4. Audit Log
      await tx.execute(
        `INSERT INTO loan_audit_logs (loan_id, old_status, new_status, changed_by, comments)
         VALUES (?, NULL, 'Pending', ?, 'Student submitted borrow request at station ' || ?)`,
        [newLoanId, userId, stationCode]
      );

      return newLoanId;
    });

    // Fetch full loan details for response and email receipt
    const loan = await this.getLoanById(loanId);
    if (loan && loan.student_email) {
      EmailService.sendLoanReceipt({
        loanId: loan.loan_id,
        studentId: loan.student_id_code || '',
        studentName: loan.student_name || '',
        studentEmail: loan.student_email,
        equipmentName: loan.equipment_name || '',
        quantity: loan.quantity,
        stationName: loan.station_name || loan.station_code,
        status: 'Pending',
        expectedReturnDate: loan.expected_return_date,
      }).catch(err => console.error('Failed to send loan email:', err));
    }

    return loan!;
  }

  /**
   * Technician approves a pending loan request (hands over the physical item)
   */
  static async approveLoan(loanId: number, technicianUserId: number): Promise<LoanRecord> {
    const db = getDB();

    await db.withTransaction(async tx => {
      const rows = await tx.query<LoanRecord>(
        'SELECT * FROM loans WHERE loan_id = ? FOR UPDATE',
        [loanId]
      );

      if (rows.length === 0) {
        throw new Error('Loan record not found');
      }

      const loan = rows[0];
      if (loan.status !== 'Pending') {
        throw new Error(`Cannot approve loan: status is currently "${loan.status}". Only Pending loans can be approved.`);
      }

      // Update status to Approved (stock was already reserved)
      await tx.execute(
        `UPDATE loans
         SET status = 'Approved', handled_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE loan_id = ?`,
        [technicianUserId, loanId]
      );

      // Audit Log
      await tx.execute(
        `INSERT INTO loan_audit_logs (loan_id, old_status, new_status, changed_by, comments)
         VALUES (?, 'Pending', 'Approved', ?, 'Technician approved request and confirmed handover of equipment')`,
        [loanId, technicianUserId]
      );
    });

    const updated = await this.getLoanById(loanId);
    if (updated && updated.student_email) {
      EmailService.sendLoanReceipt({
        loanId: updated.loan_id,
        studentId: updated.student_id_code || '',
        studentName: updated.student_name || '',
        studentEmail: updated.student_email,
        equipmentName: updated.equipment_name || '',
        quantity: updated.quantity,
        stationName: updated.station_name || updated.station_code,
        status: 'Approved',
        expectedReturnDate: updated.expected_return_date,
      }).catch(err => console.error('Failed to send approval email:', err));
    }

    return updated!;
  }

  /**
   * Technician rejects a pending loan request (restores reserved stock!)
   */
  static async rejectLoan(loanId: number, technicianUserId: number, reason: string): Promise<LoanRecord> {
    if (!reason || reason.trim().length === 0) {
      throw new Error('A rejection reason is required');
    }

    const db = getDB();

    await db.withTransaction(async tx => {
      const rows = await tx.query<LoanRecord>(
        'SELECT * FROM loans WHERE loan_id = ? FOR UPDATE',
        [loanId]
      );

      if (rows.length === 0) {
        throw new Error('Loan record not found');
      }

      const loan = rows[0];
      if (loan.status !== 'Pending') {
        throw new Error(`Cannot reject loan: status is currently "${loan.status}". Only Pending requests can be rejected.`);
      }

      // Restore reserved quantity to equipment
      await tx.execute(
        'UPDATE equipment SET available_quantity = available_quantity + ? WHERE equipment_id = ?',
        [loan.quantity, loan.equipment_id]
      );

      // Update loan status to Rejected
      await tx.execute(
        `UPDATE loans
         SET status = 'Rejected', rejection_reason = ?, handled_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE loan_id = ?`,
        [reason.trim(), technicianUserId, loanId]
      );

      // Audit Log
      await tx.execute(
        `INSERT INTO loan_audit_logs (loan_id, old_status, new_status, changed_by, comments)
         VALUES (?, 'Pending', 'Rejected', ?, ?)`,
        [loanId, technicianUserId, `Rejected: ${reason.trim()}`]
      );
    });

    const updated = await this.getLoanById(loanId);
    if (updated && updated.student_email) {
      EmailService.sendLoanReceipt({
        loanId: updated.loan_id,
        studentId: updated.student_id_code || '',
        studentName: updated.student_name || '',
        studentEmail: updated.student_email,
        equipmentName: updated.equipment_name || '',
        quantity: updated.quantity,
        stationName: updated.station_name || updated.station_code,
        status: 'Rejected',
        expectedReturnDate: updated.expected_return_date,
        rejectionReason: reason.trim(),
      }).catch(err => console.error('Failed to send rejection email:', err));
    }

    return updated!;
  }

  /**
   * Technician marks equipment as returned (restores stock!)
   */
  static async returnLoan(loanId: number, technicianUserId: number, notes?: string): Promise<LoanRecord> {
    const db = getDB();

    await db.withTransaction(async tx => {
      const rows = await tx.query<LoanRecord>(
        'SELECT * FROM loans WHERE loan_id = ? FOR UPDATE',
        [loanId]
      );

      if (rows.length === 0) {
        throw new Error('Loan record not found');
      }

      const loan = rows[0];
      if (!['Approved', 'Overdue'].includes(loan.status)) {
        throw new Error(`Cannot mark as returned: loan status is "${loan.status}". Must be Approved or Overdue.`);
      }

      const oldStatus = loan.status;

      // Restore equipment stock
      await tx.execute(
        'UPDATE equipment SET available_quantity = available_quantity + ? WHERE equipment_id = ?',
        [loan.quantity, loan.equipment_id]
      );

      // Update loan
      await tx.execute(
        `UPDATE loans
         SET status = 'Returned', actual_return_date = CURRENT_TIMESTAMP, handled_by = ?, updated_at = CURRENT_TIMESTAMP
         WHERE loan_id = ?`,
        [technicianUserId, loanId]
      );

      // Audit Log
      await tx.execute(
        `INSERT INTO loan_audit_logs (loan_id, old_status, new_status, changed_by, comments)
         VALUES (?, ?, 'Returned', ?, ?)`,
        [loanId, oldStatus, technicianUserId, notes ? `Returned with notes: ${notes}` : 'Equipment returned in good condition']
      );
    });

    const updated = await this.getLoanById(loanId);
    if (updated && updated.student_email) {
      EmailService.sendLoanReceipt({
        loanId: updated.loan_id,
        studentId: updated.student_id_code || '',
        studentName: updated.student_name || '',
        studentEmail: updated.student_email,
        equipmentName: updated.equipment_name || '',
        quantity: updated.quantity,
        stationName: updated.station_name || updated.station_code,
        status: 'Returned',
        expectedReturnDate: updated.expected_return_date,
        actualReturnDate: new Date().toLocaleDateString('en-GB'),
      }).catch(err => console.error('Failed to send return email:', err));
    }

    return updated!;
  }

  /**
   * Get single loan record by ID with joined details
   */
  static async getLoanById(loanId: number): Promise<LoanRecord | null> {
    const db = getDB();
    const rows = await db.query<LoanRecord>(
      `SELECT l.*,
              u.full_name as student_name, u.student_staff_id as student_id_code, u.email as student_email,
              e.object_name as equipment_name, e.category,
              h.full_name as handler_name,
              s.lab_name as station_name
       FROM loans l
       JOIN users u ON l.user_id = u.user_id
       JOIN equipment e ON l.equipment_id = e.equipment_id
       LEFT JOIN users h ON l.handled_by = h.user_id
       LEFT JOIN stations s ON l.station_code = s.station_code
       WHERE l.loan_id = ?`,
      [loanId]
    );

    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get student's loans with upcoming due notices & overdue tracking
   */
  static async getStudentLoans(userId: number): Promise<{
    loans: LoanRecord[];
    upcomingDueLoans: LoanRecord[];
    hasOverdue: boolean;
  }> {
    const db = getDB();
    const rows = await db.query<LoanRecord>(
      `SELECT l.*,
              e.object_name as equipment_name, e.category,
              h.full_name as handler_name,
              s.lab_name as station_name
       FROM loans l
       JOIN equipment e ON l.equipment_id = e.equipment_id
       LEFT JOIN users h ON l.handled_by = h.user_id
       LEFT JOIN stations s ON l.station_code = s.station_code
       WHERE l.user_id = ?
       ORDER BY l.created_at DESC`,
      [userId]
    );

    const now = new Date();
    const upcomingDueLoans: LoanRecord[] = [];
    let hasOverdue = false;

    for (const loan of rows) {
      if (loan.status === 'Overdue') {
        hasOverdue = true;
      }
      if (loan.status === 'Approved') {
        const expectedDate = new Date(loan.expected_return_date);
        expectedDate.setHours(23, 59, 59, 999);
        const diffMs = expectedDate.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours >= 0 && diffHours <= 24) {
          loan.hours_until_due = Math.round(diffHours);
          upcomingDueLoans.push(loan);
        }
      }
    }

    return {
      loans: rows,
      upcomingDueLoans,
      hasOverdue,
    };
  }

  /**
   * Get all loans with filters (for staff dashboard)
   */
  static async getLoans(filter?: {
    status?: string;
    stationCode?: string;
    searchQuery?: string;
    limit?: number;
  }): Promise<LoanRecord[]> {
    const db = getDB();
    let sql = `
      SELECT l.*,
             u.full_name as student_name, u.student_staff_id as student_id_code, u.email as student_email,
             e.object_name as equipment_name, e.category,
             h.full_name as handler_name,
             s.lab_name as station_name
      FROM loans l
      JOIN users u ON l.user_id = u.user_id
      JOIN equipment e ON l.equipment_id = e.equipment_id
      LEFT JOIN users h ON l.handled_by = h.user_id
      LEFT JOIN stations s ON l.station_code = s.station_code
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filter?.status) {
      sql += ' AND l.status = ?';
      params.push(filter.status);
    }
    if (filter?.stationCode) {
      sql += ' AND l.station_code = ?';
      params.push(filter.stationCode);
    }
    if (filter?.searchQuery) {
      const q = `%${filter.searchQuery.trim().toLowerCase()}%`;
      sql += ` AND (LOWER(u.full_name) LIKE ? OR LOWER(u.student_staff_id) LIKE ? OR LOWER(e.object_name) LIKE ?)`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY l.request_date DESC';

    if (filter?.limit) {
      sql += ' LIMIT ?';
      params.push(filter.limit);
    }

    return await db.query<LoanRecord>(sql, params);
  }

  /**
   * Background task: Expire stale pending requests older than 30 minutes
   * Automatically restores reserved inventory!
   */
  static async expireStalePendingLoans(expiryMinutes = 30): Promise<number> {
    const db = getDB();
    let expiredCount = 0;

    await db.withTransaction(async tx => {
      // Find pending loans older than X minutes
      // Works across SQLite (datetime('now', '-30 minutes')) and MySQL (NOW() - INTERVAL 30 MINUTE)
      const pendingLoans = await tx.query<LoanRecord>(
        `SELECT loan_id, equipment_id, quantity, user_id, station_code
         FROM loans
         WHERE status = 'Pending'
           AND (strftime('%s', 'now') - strftime('%s', created_at)) > ?`,
        [expiryMinutes * 60]
      );

      for (const loan of pendingLoans) {
        // 1. Restore stock
        await tx.execute(
          'UPDATE equipment SET available_quantity = available_quantity + ? WHERE equipment_id = ?',
          [loan.quantity, loan.equipment_id]
        );

        // 2. Mark as Rejected due to timeout
        await tx.execute(
          `UPDATE loans
           SET status = 'Rejected', rejection_reason = 'Expired: request not approved or collected within 30 minutes', updated_at = CURRENT_TIMESTAMP
           WHERE loan_id = ?`,
          [loan.loan_id]
        );

        // 3. Audit Log
        await tx.execute(
          `INSERT INTO loan_audit_logs (loan_id, old_status, new_status, changed_by, comments)
           VALUES (?, 'Pending', 'Rejected', NULL, 'System auto-expired stale pending request and restored stock')`,
          [loan.loan_id]
        );

        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      console.log(`⏰ [STALE LOANS] Auto-expired ${expiredCount} pending loans and restored stock.`);
    }

    return expiredCount;
  }

  /**
   * Background cron task: Flag approved loans past expected return date as Overdue
   */
  static async flagOverdueLoans(): Promise<number> {
    const db = getDB();
    let flaggedCount = 0;

    await db.withTransaction(async tx => {
      // Find Approved loans where expected_return_date < today
      const overdueLoans = await tx.query<LoanRecord>(
        `SELECT loan_id, user_id, equipment_id, expected_return_date
         FROM loans
         WHERE status = 'Approved'
           AND expected_return_date < date('now')`
      );

      for (const loan of overdueLoans) {
        await tx.execute(
          `UPDATE loans SET status = 'Overdue', updated_at = CURRENT_TIMESTAMP WHERE loan_id = ?`,
          [loan.loan_id]
        );

        await tx.execute(
          `INSERT INTO loan_audit_logs (loan_id, old_status, new_status, changed_by, comments)
           VALUES (?, 'Approved', 'Overdue', NULL, 'System flagged loan as overdue after expected return date passed')`,
          [loan.loan_id]
        );

        flaggedCount++;
      }
    });

    if (flaggedCount > 0) {
      console.log(`🚨 [OVERDUE WATCH] Flagged ${flaggedCount} loan(s) as OVERDUE.`);
    }

    return flaggedCount;
  }
}
