# CUZ Lab Equipment Borrowing System (CUZ-LEBS)
### Cavendish University Zambia • Faculty of Science & Technology

A station-based QR-code laboratory equipment checkout and tracking system replacing paper logbooks at Cavendish University Zambia.

---

## 🚀 Key Features

1. **Fixed Station QR Routing**:
   - Each lab counter has ONE fixed QR code encoding `https://<host>/borrow?station=<station_code>`.
   - Students scan with any smartphone camera to open the mobile-first borrow form.
   - Preserves counter context even through login or new student registration.

2. **Student Self-Registration & Official Digital Receipts**:
   - New students can register directly with their Student ID, name, email, and password.
   - System automatically generates and dispatches official Cavendish University registration and loan receipts to the student's email, viewable in the interactive **Digital Receipts Inbox**.

3. **Concurrency-Safe Transactional Reservation**:
   - When a student submits a request, stock is temporarily reserved (`available_quantity` decremented) inside a database transaction with row-locking (`SELECT ... FOR UPDATE` / `BEGIN IMMEDIATE`), preventing race conditions.
   - Stale requests auto-expire after 30 minutes, automatically restoring inventory.

4. **Technician Live Approval Panel**:
   - Auto-refreshes every 5 seconds (with live countdown and pause controls).
   - Shows student name, Student ID, item, quantity, expected return date, and request time.
   - Single-click **Approve Handover** or **Reject** (with mandatory reason, which instantly restores reserved stock).

5. **Return Processing & Inventory Restoration**:
   - Search active checked-out loans by student name, ID, or item.
   - Record equipment condition inspection notes and restore stock on return.

6. **Overdue Tracking & Reports**:
   - Background cron scheduler checks overdue loans hourly.
   - Banner notification for items due within 24 hours.
   - Students with any overdue loan are prevented from making new requests.
   - Instant CSV export filterable by date range and status.

7. **Staff & User Access Control**:
   - Administrators can add new staff members (Technicians and Admins) to manage the laboratory and edit inventory.

---

## 🔑 Demo Credentials

All seed accounts use the default password: **`Password123!`**

| Role | Identifier / Student ID | Name | Email |
| :--- | :--- | :--- | :--- |
| **System Admin** | `ADM-CUZ-001` | Dr. Mwamba Chileshe | `admin.mwamba@cuz.ac.zm` |
| **Lab Technician** | `TECH-CUZ-101` | Joseph Banda | `jbanda.tech@cuz.ac.zm` |
| **Lab Technician** | `TECH-CUZ-102` | Mutale Nkonde | `mnkonde.tech@cuz.ac.zm` |
| **Student** | `115-564` | Dalitso Phiri | `dphiri23@student.cuz.ac.zm` |
| **Student** | `115-899` | Thandiwe Zulu | `tzulu23@student.cuz.ac.zm` |
| **Student** | `115-155` | Kondwani Tembo | `ktembo24@student.cuz.ac.zm` |

---

## 🛠️ Quick Start & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Seed Sample Data
```bash
# Initialize database schema
npm run db:init

# Seed initial stations, users, and 16 realistic lab items
npm run db:seed
```

### 3. Start Development Server
```bash
npm run dev
# Or for production:
npm start
```
The application will be live at `http://localhost:3000`.

### 4. Run Automated Test Suite
```bash
npm test
```
Runs 19 automated tests covering authentication, self-registration, role-based protection, station QR routing, stock race condition, approve/reject/return transactions, and CSV export.

---

## 🖨️ How to Print Station Counter QR Codes

1. Log in with technician or admin credentials (`TECH-CUZ-101` / `Password123!`).
2. Navigate to **Station QR Codes** (`/admin/stations`).
3. Select any station counter (e.g. `STN-MAIN-01` or `STN-ENG-02`).
4. Click **Print Lab Counter Sign** or **Download PNG**.
5. The print layout is styled for standard A4/Letter paper with the official university crest, counter code, high-resolution QR code, and student instructions.

---

## 🛡️ Production & 99% Uptime with PM2

To run the application with high availability and automatic restart:

```bash
# Install PM2 globally
npm install -g pm2

# Build the frontend assets
npm run build

# Start with PM2
pm2 start server.ts --name "cuz-lab-system" --interpreter tsx --watch false

# Monitor uptime and status
pm2 status
pm2 logs cuz-lab-system
```

### Health Check Endpoint
A dedicated health check endpoint is available at:
```
GET /health
```
Returns:
```json
{
  "status": "UP",
  "uptime": 1245.2,
  "service": "CUZ Lab Equipment Borrowing System",
  "institution": "Cavendish University Zambia",
  "database": "healthy",
  "version": "1.0.0"
}
```

---

## 📂 Project Structure

```
├── db/
│   ├── schema.sql         # MySQL 8+ database schema
│   └── seed.sql           # Realistic seed data (stations, users, items)
├── scripts/
│   ├── db-init.ts         # Schema runner
│   └── db-seed.ts         # Seed data runner
├── src/
│   ├── server/
│   │   ├── controllers/   # Auth, Equipment, Station, Loan, Report controllers
│   │   ├── services/      # Business logic, email receipts, transactional loans
│   │   ├── routes/        # Express REST API routes
│   │   ├── middleware/    # JWT auth & RBAC validation
│   │   ├── cron/          # Hourly overdue checker & 30-min pending expiry
│   │   ├── db/            # MySQL & SQLite transactional database adapter
│   │   └── app.ts         # Express server configuration & /health
│   ├── components/        # Navbar, ReceiptModal, print sign views
│   ├── context/           # AuthContext provider
│   ├── pages/             # Login, Borrow, MyLoans, StaffDashboard, Returns, Inventory, Stations, Users, Reports
│   ├── types.ts           # Shared TypeScript interfaces
│   └── App.tsx            # Full-stack SPA router
├── tests/
│   └── api.test.ts        # End-to-end Vitest test suite
└── server.ts              # Express + Vite dev server entry point
```
