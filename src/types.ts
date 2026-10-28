export type UserRole = 'student' | 'technician' | 'admin';

export interface User {
  userId: number;
  studentStaffId: string;
  fullName: string;
  email: string;
  role: UserRole;
  canBorrow?: boolean;
  activeLoanCount?: number;
  hasOverdue?: boolean;
  eligibilityReason?: string;
}

export interface Equipment {
  equipment_id: number;
  object_name: string;
  category: string;
  total_quantity: number;
  available_quantity: number;
  status: 'active' | 'maintenance' | 'retired';
  model_or_specs?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Station {
  station_id: number;
  station_code: string;
  lab_name: string;
  location_description?: string;
  created_at?: string;
}

export interface Loan {
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

  // Joined
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
