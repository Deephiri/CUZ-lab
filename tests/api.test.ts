import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/server/app.ts';
import { getDB } from '../src/server/db/index.ts';

const app = createApp();

describe('CUZ Lab Equipment Borrowing System - End-to-End API Suite', () => {
  let studentToken = '';
  let studentUserId: number;
  let technicianToken = '';
  let technicianUserId: number;
  let adminToken = '';
  let testEquipmentId: number;

  beforeAll(async () => {
    // Ensure database is initialized
    const db = getDB();
    await db.query('SELECT 1');

    // Acquire tokens in beforeAll so all suites have reliable auth
    const sLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: '115-564', password: 'Password123!' });
    studentToken = sLogin.body.token;
    studentUserId = sLogin.body.user?.userId;

    const tLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'TECH-CUZ-101', password: 'Password123!' });
    technicianToken = tLogin.body.token;
    technicianUserId = tLogin.body.user?.userId;

    const aLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'ADM-CUZ-001', password: 'Password123!' });
    adminToken = aLogin.body.token;
  });

  // 1. Health check
  it('GET /health returns healthy server status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
    expect(res.body.service).toContain('CUZ Lab');
    expect(res.body.database).toBe('healthy');
  });

  // 2. Authentication & Student Registration
  describe('Authentication & Roles', () => {
    it('Verifies student, technician, and admin login', () => {
      expect(studentToken).toBeDefined();
      expect(technicianToken).toBeDefined();
      expect(adminToken).toBeDefined();
    });

    it('Rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: '115-564', password: 'WrongPassword' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('Rejects student sign-in if they try using CUZ-2023-0412 style ID instead of 6-digit number', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'CUZ-2023-0412', password: 'Password123!' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('6-digit Student ID');
    });

    it('Rejects registration when student enters CUZ-2023-0412 style ID instead of 6-digit number', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          studentId: 'CUZ-2023-0412',
          fullName: 'Bwalya Phiri',
          email: 'bwalya.test@student.cuz.ac.zm',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('6-digit Student ID number');
    });

    it('Rejects registration with non-6-digit invalid input', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          studentId: '1234',
          fullName: 'Bwalya Phiri',
          email: 'bwalya.test@student.cuz.ac.zm',
          password: 'Password123!',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('6-digit');
    });

    it('Allows new student self-registration with 6-digit ID (e.g. 115-547) and dispatches automated welcome email receipt', async () => {
      const random3 = Math.floor(100 + Math.random() * 900);
      const testStudentId = `115-${random3}`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          studentId: testStudentId,
          fullName: 'Chileshe Mulenga',
          email: `cmulenga.${random3}@student.cuz.ac.zm`,
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.studentStaffId).toBe(testStudentId);

      // Verify automated welcome & registration receipt email was created
      const receiptRes = await request(app)
        .get('/api/auth/receipts')
        .set('Authorization', `Bearer ${res.body.token}`);

      expect(receiptRes.status).toBe(200);
      expect(receiptRes.body.receipts.length).toBeGreaterThan(0);
      const welcomeReceipt = receiptRes.body.receipts.find((r: any) => r.type === 'STUDENT_REGISTRATION');
      expect(welcomeReceipt).toBeDefined();
      expect(welcomeReceipt.recipientEmail).toBe(`cmulenga.${random3}@student.cuz.ac.zm`);
      expect(welcomeReceipt.subject).toContain(testStudentId);
    });

    it('Allows admin to add new staff members', async () => {
      const testStaffId = `TECH-NEW-${Date.now().toString().slice(-4)}`;
      const res = await request(app)
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          staffId: testStaffId,
          fullName: 'Kondwani Banda',
          email: `${testStaffId.toLowerCase()}@cuz.ac.zm`,
          role: 'technician',
          password: 'Password123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('Enforces role-based protection: Student cannot access staff endpoints', async () => {
      const res = await request(app)
        .post('/api/users/staff')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          staffId: 'TECH-ILLEGAL',
          fullName: 'Hacker',
          email: 'hacker@cuz.ac.zm',
          role: 'technician',
          password: 'Password123!',
        });

      expect(res.status).toBe(403);
    });
  });

  // 3. Station QR Routing
  describe('Station QR Routing', () => {
    it('GET /api/stations returns all lab stations', async () => {
      const res = await request(app).get('/api/stations');
      expect(res.status).toBe(200);
      expect(res.body.stations.length).toBeGreaterThanOrEqual(2);
      expect(res.body.stations.some((s: any) => s.station_code === 'STN-MAIN-01')).toBe(true);
    });

    it('GET /api/stations/:code/qr generates valid QR data for static station URL', async () => {
      const res = await request(app).get('/api/stations/STN-MAIN-01/qr');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.url).toContain('/borrow?station=STN-MAIN-01');
      expect(res.body.dataUrl).toContain('data:image/png;base64');
    });

    it('Returns friendly 404 for invalid station code', async () => {
      const res = await request(app).get('/api/stations/INVALID-CODE');
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });

  // 4. Equipment Catalog & Stock Reservation Race Condition
  describe('Equipment & Borrowing Flow', () => {
    it('Creates a limited-stock item for race-condition testing', async () => {
      const res = await request(app)
        .post('/api/equipment')
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({
          objectName: 'Rare Sensor Unit X1',
          category: 'Sensors & Actuators',
          totalQuantity: 1,
          availableQuantity: 1,
          status: 'active',
        });

      expect(res.status).toBe(201);
      testEquipmentId = res.body.item.equipment_id;
    });

    it('Student can borrow the item, stock is reserved', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      const returnDateStr = tomorrow.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          equipmentId: testEquipmentId,
          quantity: 1,
          expectedReturnDate: returnDateStr,
          stationCode: 'STN-MAIN-01',
          notes: 'Class project lab session',
        });

      expect(res.status).toBe(201);
      expect(res.body.loan.status).toBe('Pending');

      // Verify stock was decremented to 0
      const catalogRes = await request(app).get(`/api/equipment/${testEquipmentId}`);
      expect(catalogRes.body.item.available_quantity).toBe(0);

      // Verify automated borrow receipt email dispatched to student with return deadline date
      const receiptRes = await request(app)
        .get('/api/auth/receipts')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(receiptRes.status).toBe(200);
      expect(receiptRes.body.receipts.length).toBeGreaterThan(0);
      const borrowReceipt = receiptRes.body.receipts.find((r: any) => r.type === 'LOAN_REQUEST');
      expect(borrowReceipt).toBeDefined();
      expect(borrowReceipt.htmlBody).toContain(returnDateStr);
      expect(borrowReceipt.htmlBody).toContain('Main Campus IoT & Computing Lab');
    });

    it('Prevents race condition: Second student cannot borrow the reserved item', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 3);
      const returnDateStr = tomorrow.toISOString().split('T')[0];

      // Login another student using 6-digit ID (115-899)
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ identifier: '115-899', password: 'Password123!' });

      const secondStudentToken = loginRes.body.token;

      // Attempt to borrow same item
      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${secondStudentToken}`)
        .send({
          equipmentId: testEquipmentId,
          quantity: 1,
          expectedReturnDate: returnDateStr,
          stationCode: 'STN-MAIN-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Insufficient stock');
    });

    it('Enforces maximum 14 days return date policy', async () => {
      const past14Days = new Date();
      past14Days.setDate(past14Days.getDate() + 20);
      const returnDateStr = past14Days.toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          equipmentId: 1,
          quantity: 1,
          expectedReturnDate: returnDateStr,
          stationCode: 'STN-MAIN-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Maximum loan duration is');
    });
  });

  // 5. Technician Approval, Rejection, and Return Flows
  describe('Technician Approval and Return Workflow', () => {
    let pendingLoanId: number;

    it('Technician views pending loan requests', async () => {
      const res = await request(app)
        .get('/api/loans?status=Pending')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.loans.length).toBeGreaterThan(0);
      pendingLoanId = res.body.loans[0].loan_id;
    });

    it('Technician approves loan, status becomes Approved', async () => {
      const res = await request(app)
        .patch(`/api/loans/${pendingLoanId}/approve`)
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.loan.status).toBe('Approved');
    });

    it('Technician marks equipment as returned, restoring available stock', async () => {
      const res = await request(app)
        .patch(`/api/loans/${pendingLoanId}/return`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ notes: 'Item inspected and verified in perfect condition' });

      expect(res.status).toBe(200);
      expect(res.body.loan.status).toBe('Returned');

      // Check stock restored
      const eqRes = await request(app).get(`/api/equipment/${testEquipmentId}`);
      expect(eqRes.body.item.available_quantity).toBe(1);
    });

    it('Rejection flow restores stock correctly', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      // Student requests item again
      const reqRes = await request(app)
        .post('/api/loans')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          equipmentId: testEquipmentId,
          quantity: 1,
          expectedReturnDate: tomorrow.toISOString().split('T')[0],
          stationCode: 'STN-MAIN-01',
        });

      const newLoanId = reqRes.body.loan.loan_id;

      // Verify stock was reserved
      let eqRes = await request(app).get(`/api/equipment/${testEquipmentId}`);
      expect(eqRes.body.item.available_quantity).toBe(0);

      // Technician rejects with reason
      const rejRes = await request(app)
        .patch(`/api/loans/${newLoanId}/reject`)
        .set('Authorization', `Bearer ${technicianToken}`)
        .send({ reason: 'Item reserved for upcoming electronics practical examination' });

      expect(rejRes.status).toBe(200);
      expect(rejRes.body.loan.status).toBe('Rejected');

      // Verify stock was restored immediately
      eqRes = await request(app).get(`/api/equipment/${testEquipmentId}`);
      expect(eqRes.body.item.available_quantity).toBe(1);
    });
  });

  // 6. Reports & CSV Export
  describe('Reports & Summary', () => {
    it('GET /api/reports/summary returns aggregate metrics', async () => {
      const res = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.counts).toBeDefined();
      expect(res.body.summary.inventory).toBeDefined();
    });

    it('GET /api/reports/export.csv downloads CSV data', async () => {
      const res = await request(app)
        .get('/api/reports/export.csv')
        .set('Authorization', `Bearer ${technicianToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Loan ID');
      expect(res.text).toContain('Student ID');
    });
  });
});
