/**
 * Email & Digital Receipt Dispatch Service for Cavendish University Zambia
 * Formats official university email receipts and logs/stores dispatched receipts
 */

export interface EmailReceipt {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  type: 'STUDENT_REGISTRATION' | 'LOAN_REQUEST' | 'LOAN_APPROVED' | 'LOAN_RETURNED' | 'STAFF_INVITATION';
  htmlBody: string;
  sentAt: string;
  referenceNumber: string;
}

// In-memory + persisted store for dispatched receipts so users/technicians can view them in UI
const dispatchedReceipts: EmailReceipt[] = [];

export class EmailService {
  /**
   * Send a student registration confirmation receipt
   */
  static async sendRegistrationReceipt(params: {
    studentId: string;
    fullName: string;
    email: string;
  }): Promise<EmailReceipt> {
    const referenceNumber = `CUZ-REG-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const sentAt = new Date().toISOString();

    const htmlBody = `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">CAVENDISH UNIVERSITY ZAMBIA</h1>
          <p style="margin: 0; font-size: 13px; color: #bfdbfe; font-weight: 500;">Laboratory Equipment Borrowing System (CUZ-LEBS)</p>
        </div>

        <div style="padding: 24px; color: #1e293b;">
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: 700; color: #166534; font-size: 15px;">✓ Student Account Registration Confirmed</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: #15803d;">Your lab borrowing account is now active and ready for station checkouts.</p>
          </div>

          <p style="font-size: 15px; line-height: 1.5;">Dear <strong>${params.fullName}</strong>,</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5;">
            Welcome to the Cavendish University Zambia Laboratory Services. Your electronic equipment borrowing profile has been successfully registered. You can now scan lab counter QR codes to check out hardware and instruments.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Student ID:</td>
              <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #0f172a;">${params.studentId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Registered Email:</td>
              <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #0f172a;">${params.email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Receipt Reference:</td>
              <td style="padding: 10px 0; font-family: monospace; font-weight: 700; text-align: right; color: #2563eb;">${referenceNumber}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #64748b;">Registration Date:</td>
              <td style="padding: 10px 0; text-align: right; color: #0f172a;">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            </tr>
          </table>

          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #1e40af;">
            <strong>Important Lab Regulations:</strong>
            <ul style="margin: 6px 0 0 0; padding-left: 18px; line-height: 1.4;">
              <li>Maximum active loans per student: <strong>3 items</strong></li>
              <li>Maximum loan duration: <strong>14 calendar days</strong></li>
              <li>Overdue items block any subsequent borrowing until cleared.</li>
            </ul>
          </div>
        </div>

        <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          Cavendish University Zambia • Faculty of Science & Technology • ICT Laboratory Services
        </div>
      </div>
    `;

    const receipt: EmailReceipt = {
      id: `rcpt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientEmail: params.email,
      recipientName: params.fullName,
      subject: `[CUZ Lab Receipt] Account Registration Confirmation - ${params.studentId}`,
      type: 'STUDENT_REGISTRATION',
      htmlBody,
      sentAt,
      referenceNumber,
    };

    dispatchedReceipts.unshift(receipt);
    console.log(`📧 [EMAIL RECEIPT DISPATCHED] To: ${params.email} | Subject: ${receipt.subject}`);
    return receipt;
  }

  /**
   * Send a loan request / approval / return receipt
   */
  static async sendLoanReceipt(params: {
    loanId: number;
    studentId: string;
    studentName: string;
    studentEmail: string;
    equipmentName: string;
    quantity: number;
    stationName: string;
    status: 'Pending' | 'Approved' | 'Returned' | 'Rejected';
    expectedReturnDate: string;
    actualReturnDate?: string;
    rejectionReason?: string;
  }): Promise<EmailReceipt> {
    const referenceNumber = `CUZ-LN-${params.loanId}-${Date.now().toString(36).toUpperCase()}`;
    const sentAt = new Date().toISOString();

    const statusColors = {
      Pending: {
        bg: '#eff6ff',
        text: '#1e40af',
        border: '#bfdbfe',
        badge: 'Borrowing Request Successful & Reserved',
        title: 'Equipment Borrowing Successful — Return Receipt',
      },
      Approved: {
        bg: '#dcfce7',
        text: '#166534',
        border: '#bbf7d0',
        badge: 'Handover Confirmed & Approved',
        title: 'Equipment Handover Receipt',
      },
      Returned: {
        bg: '#f0fdf4',
        text: '#15803d',
        border: '#bbf7d0',
        badge: 'Returned & Inventory Restored',
        title: 'Equipment Return Clearance Receipt',
      },
      Rejected: {
        bg: '#fee2e2',
        text: '#991b1b',
        border: '#fecaca',
        badge: 'Request Rejected',
        title: 'Borrow Request Rejected',
      },
    };

    const currentStatus = statusColors[params.status];

    const htmlBody = `
      <div style="font-family: 'Plus Jakarta Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; background: #ffffff;">
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%); color: #ffffff; padding: 24px; text-align: center;">
          <h1 style="margin: 0 0 4px 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">CAVENDISH UNIVERSITY ZAMBIA</h1>
          <p style="margin: 0; font-size: 13px; color: #bfdbfe;">Laboratory Equipment Borrowing System (CUZ-LEBS)</p>
        </div>

        <div style="padding: 24px; color: #1e293b;">
          <div style="background: ${currentStatus.bg}; border: 1px solid ${currentStatus.border}; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px;">
            <p style="margin: 0; font-weight: 800; color: ${currentStatus.text}; font-size: 15px;">✓ ${currentStatus.title}</p>
            <p style="margin: 4px 0 0 0; font-size: 13px; color: ${currentStatus.text};">Official Receipt Reference: <strong>${referenceNumber}</strong></p>
          </div>

          <p style="font-size: 15px; margin-bottom: 8px;">Dear <strong>${params.studentName}</strong> (Student ID: <strong>${params.studentId}</strong>),</p>
          <p style="font-size: 14px; color: #475569; line-height: 1.5; margin-top: 0;">
            ${params.status === 'Pending'
              ? `Your laboratory equipment checkout request was <strong>successful</strong>. The requested hardware has been reserved at <strong>${params.stationName}</strong>. Please present this receipt and your Student ID to the technician for collection.`
              : `This is your official electronic receipt for laboratory equipment transaction at <strong>${params.stationName}</strong>.`
            }
          </p>

          <!-- PROMINENT RETURN DEADLINE RECEIPT BOX -->
          <div style="background: #fef2f2; border: 2px dashed #dc2626; border-radius: 12px; padding: 16px 20px; margin: 20px 0; text-align: center;">
            <p style="margin: 0; font-size: 12px; font-weight: 800; color: #991b1b; text-transform: uppercase; letter-spacing: 1px;">
              ⚠️ OFFICIAL RETURN RECEIPT & DEADLINE
            </p>
            <p style="margin: 8px 0 2px 0; font-size: 24px; font-weight: 900; color: #b91c1c;">
              ${params.expectedReturnDate}
            </p>
            <p style="margin: 0; font-size: 13px; color: #7f1d1d; font-weight: 500;">
              This equipment must be returned to <strong>${params.stationName}</strong> on or before this date.
            </p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Equipment Item:</td>
              <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #0f172a;">${params.equipmentName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Quantity:</td>
              <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #0f172a;">${params.quantity} unit(s)</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Station Counter:</td>
              <td style="padding: 10px 0; text-align: right; color: #0f172a; font-weight: 600;">${params.stationName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Transaction Date:</td>
              <td style="padding: 10px 0; text-align: right; color: #0f172a;">${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Current Status:</td>
              <td style="padding: 10px 0; font-weight: 700; text-align: right; color: ${currentStatus.text};">${currentStatus.badge}</td>
            </tr>
            ${params.actualReturnDate ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #64748b;">Actual Return Date:</td>
              <td style="padding: 10px 0; font-weight: 700; text-align: right; color: #16a34a;">${params.actualReturnDate}</td>
            </tr>` : ''}
            ${params.rejectionReason ? `
            <tr style="border-bottom: 1px solid #f1f5f9;">
              <td style="padding: 10px 0; color: #dc2626;">Reason for Rejection:</td>
              <td style="padding: 10px 0; font-weight: 600; text-align: right; color: #dc2626;">${params.rejectionReason}</td>
            </tr>` : ''}
          </table>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; font-size: 12px; color: #64748b; margin-top: 16px;">
            <strong>Lab Regulation:</strong> Failure to return equipment by the deadline will flag your account as Overdue and prevent any further borrowing across all Cavendish University laboratories until resolved.
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 14px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
          Cavendish University Zambia • ICT Laboratory Services • Please present your Student ID (${params.studentId}) upon collection.
        </div>
      </div>
    `;

    const receiptSubject = params.status === 'Pending'
      ? `[CUZ Lab Receipt] Borrowing Successful & Return Receipt: ${params.equipmentName} (Return by ${params.expectedReturnDate})`
      : `[CUZ Lab Receipt] Loan ${params.status}: ${params.equipmentName} (#${params.loanId})`;

    const receiptTypeMap = {
      Pending: 'LOAN_REQUEST' as const,
      Approved: 'LOAN_APPROVED' as const,
      Returned: 'LOAN_RETURNED' as const,
      Rejected: 'LOAN_REQUEST' as const,
    };

    const receipt: EmailReceipt = {
      id: `rcpt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipientEmail: params.studentEmail,
      recipientName: params.studentName,
      subject: receiptSubject,
      type: receiptTypeMap[params.status],
      htmlBody,
      sentAt,
      referenceNumber,
    };

    dispatchedReceipts.unshift(receipt);
    console.log(`📧 [LOAN RECEIPT DISPATCHED] To: ${params.studentEmail} | Subject: ${receipt.subject}`);
    return receipt;
  }

  /**
   * Get all dispatched receipts for viewing/auditing in the UI
   */
  static getDispatchedReceipts(emailFilter?: string): EmailReceipt[] {
    if (!emailFilter) return dispatchedReceipts;
    return dispatchedReceipts.filter(r => r.recipientEmail.toLowerCase() === emailFilter.toLowerCase());
  }
}
