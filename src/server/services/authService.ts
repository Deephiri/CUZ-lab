import bcrypt from 'bcryptjs';
import { getDB } from '../db/index.ts';
import { generateToken, AuthUser } from '../middleware/auth.ts';
import { EmailService } from './emailService.ts';

export interface UserRow {
  user_id: number;
  student_staff_id: string;
  full_name: string;
  email: string;
  password_hash: string;
  role: 'student' | 'technician' | 'admin';
  created_at: string;
}

export class AuthService {
  /**
   * Validate Cavendish University Zambia Student ID format for student registration.
   * Students must only use their 6-digit student ID number, for example 115-547.
   * Prefixes like CUZ-2023-0412 are explicitly rejected.
   */
  static validateStudentId(rawId: string): { valid: boolean; normalizedId: string; error?: string } {
    if (!rawId || typeof rawId !== 'string' || !rawId.trim()) {
      return {
        valid: false,
        normalizedId: '',
        error: 'Student ID number is required.',
      };
    }

    const clean = rawId.trim();

    // Explicitly reject CUZ prefix formats
    if (/^CUZ/i.test(clean)) {
      return {
        valid: false,
        normalizedId: clean,
        error:
          'Please enter only your 6-digit Student ID number (e.g. 115-547). Do not include the CUZ- prefix.',
      };
    }

    // Check 6 digits with hyphen: NNN-NNN (e.g. 115-547)
    if (/^\d{3}-\d{3}$/.test(clean)) {
      return {
        valid: true,
        normalizedId: clean,
      };
    }

    // Check 6 continuous digits: NNNNNN (e.g. 115547) -> normalize to 115-547
    if (/^\d{6}$/.test(clean)) {
      return {
        valid: true,
        normalizedId: `${clean.slice(0, 3)}-${clean.slice(3)}`,
      };
    }

    return {
      valid: false,
      normalizedId: clean,
      error:
        'Invalid Student ID. You must enter your 6-digit student ID number (e.g. 115-547).',
    };
  }

  /**
   * Log in user using Student ID (must be 6 digits, e.g. 115-564), Staff ID, or Email + Password
   */
  static async login(identifier: string, password: string): Promise<{ user: AuthUser; token: string }> {
    if (!identifier || !password) {
      throw new Error('Please provide both your Student/Staff ID or Email and password');
    }

    const cleanId = identifier.trim().toLowerCase();

    // Block CUZ-YYYY-NNNN format for student logins
    if (/^cuz/i.test(cleanId)) {
      throw new Error('Students must sign in using their 6-digit Student ID (e.g. 115-564). Do not include the CUZ prefix.');
    }

    const isEmail = cleanId.includes('@');
    const isStaffId = /^tech-/i.test(cleanId) || /^adm-/i.test(cleanId);
    const isSixDigitStudent = /^\d{3}-\d{3}$/.test(cleanId) || /^\d{6}$/.test(cleanId);

    // If identifier is not an email and not staff, enforce 6-digit student ID format
    if (!isEmail && !isStaffId && !isSixDigitStudent) {
      throw new Error('Invalid Student ID format. Students must enter their 6-digit Student ID number (e.g. 115-564).');
    }

    const db = getDB();
    const hyphenId = /^\d{6}$/.test(cleanId) ? `${cleanId.slice(0, 3)}-${cleanId.slice(3)}` : cleanId;
    const unhyphenId = cleanId.replace(/-/g, '');

    const users = await db.query<UserRow>(
      'SELECT * FROM users WHERE LOWER(student_staff_id) = ? OR LOWER(student_staff_id) = ? OR LOWER(student_staff_id) = ? OR LOWER(email) = ? LIMIT 1',
      [cleanId, hyphenId, unhyphenId, cleanId]
    );

    if (!users || users.length === 0) {
      throw new Error('Invalid credentials. User ID or password incorrect.');
    }

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      throw new Error('Invalid credentials. User ID or password incorrect.');
    }

    const authUser: AuthUser = {
      userId: user.user_id,
      studentStaffId: user.student_staff_id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    };

    const token = generateToken(authUser);
    return { user: authUser, token };
  }

  /**
   * Self-registration for new students
   * - Validates Student ID format (CUZ-YYYY-NNNN)
   * - Validates email format & uniqueness
   * - Hashes password
   * - Generates student account
   * - Dispatches official automated welcome / receipt email
   */
  static async registerStudent(data: {
    studentId: string;
    fullName: string;
    email: string;
    password: string;
  }): Promise<{ user: AuthUser; token: string }> {
    const rawStudentId = data.studentId;
    const fullName = data.fullName ? data.fullName.trim() : '';
    const email = data.email ? data.email.trim().toLowerCase() : '';
    const password = data.password;

    if (!rawStudentId || !fullName || !email || !password) {
      throw new Error('All registration fields (Student ID, full name, email, password) are required.');
    }

    // 1. Validate Student ID format
    const idValidation = this.validateStudentId(rawStudentId);
    if (!idValidation.valid) {
      throw new Error(idValidation.error);
    }
    const studentId = idValidation.normalizedId;

    // 2. Validate Password length
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    // 3. Validate Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address.');
    }

    const db = getDB();

    // 4. Check duplicate student_staff_id or email
    const existing = await db.query<UserRow>(
      'SELECT user_id, student_staff_id, email FROM users WHERE LOWER(student_staff_id) = ? OR LOWER(email) = ?',
      [studentId.toLowerCase(), email]
    );

    if (existing.length > 0) {
      if (existing.some(u => u.student_staff_id.toLowerCase() === studentId.toLowerCase())) {
        throw new Error(`Student ID ${studentId} is already registered. Please log in.`);
      }
      if (existing.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error(`Email ${email} is already in use by another account.`);
      }
    }

    // 5. Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.execute(
      `INSERT INTO users (student_staff_id, full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'student')`,
      [studentId, fullName, email, passwordHash]
    );

    const userId = result.insertId || 0;

    // 6. Trigger automated welcome & receipt email upon successful signup
    await EmailService.sendRegistrationReceipt({
      studentId,
      fullName,
      email,
    });

    const authUser: AuthUser = {
      userId,
      studentStaffId: studentId,
      fullName,
      email,
      role: 'student',
    };

    const token = generateToken(authUser);
    return { user: authUser, token };
  }

  /**
   * Add new staff member (Technician or Admin) - Admin action
   */
  static async createStaff(data: {
    staffId: string;
    fullName: string;
    email: string;
    password: string;
    role: 'technician' | 'admin';
  }): Promise<{ userId: number; staffId: string }> {
    const staffId = data.staffId.trim().toUpperCase();
    const fullName = data.fullName.trim();
    const email = data.email.trim().toLowerCase();
    const role = data.role;
    const password = data.password || 'Password123!';

    if (!staffId || !fullName || !email) {
      throw new Error('Staff ID, full name, and email are required');
    }

    if (!['technician', 'admin'].includes(role)) {
      throw new Error('Role must be technician or admin');
    }

    const db = getDB();

    const existing = await db.query<UserRow>(
      'SELECT user_id FROM users WHERE LOWER(student_staff_id) = ? OR LOWER(email) = ?',
      [staffId.toLowerCase(), email]
    );

    if (existing.length > 0) {
      throw new Error(`User with ID ${staffId} or email ${email} already exists`);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.execute(
      `INSERT INTO users (student_staff_id, full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
      [staffId, fullName, email, passwordHash, role]
    );

    return {
      userId: result.insertId || 0,
      staffId,
    };
  }

  /**
   * Get all users for admin management
   */
  static async getAllUsers(roleFilter?: string): Promise<Omit<UserRow, 'password_hash'>[]> {
    const db = getDB();
    let sql = 'SELECT user_id, student_staff_id, full_name, email, role, created_at FROM users';
    const params: any[] = [];

    if (roleFilter && ['student', 'technician', 'admin'].includes(roleFilter)) {
      sql += ' WHERE role = ?';
      params.push(roleFilter);
    }

    sql += ' ORDER BY created_at DESC';
    return await db.query(sql, params);
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: number, newRole: 'student' | 'technician' | 'admin'): Promise<void> {
    const db = getDB();
    await db.execute('UPDATE users SET role = ? WHERE user_id = ?', [newRole, userId]);
  }
}
