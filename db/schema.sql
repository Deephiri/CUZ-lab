-- Cavendish University Zambia (CUZ) Lab Equipment Borrowing System
-- Database Schema (MySQL 8.0+ compatible)

CREATE TABLE IF NOT EXISTS stations (
  station_id INT AUTO_INCREMENT PRIMARY KEY,
  station_code VARCHAR(50) NOT NULL UNIQUE,
  lab_name VARCHAR(150) NOT NULL,
  location_description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  student_staff_id VARCHAR(50) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'technician', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_id_code (student_staff_id)
);

CREATE TABLE IF NOT EXISTS equipment (
  equipment_id INT AUTO_INCREMENT PRIMARY KEY,
  object_name VARCHAR(150) NOT NULL,
  category VARCHAR(100) NOT NULL,
  total_quantity INT NOT NULL DEFAULT 1,
  available_quantity INT NOT NULL DEFAULT 1,
  status ENUM('active', 'maintenance', 'retired') NOT NULL DEFAULT 'active',
  model_or_specs VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_avail_min CHECK (available_quantity >= 0),
  CONSTRAINT chk_avail_max CHECK (available_quantity <= total_quantity),
  INDEX idx_equipment_status (status),
  INDEX idx_equipment_category (category)
);

CREATE TABLE IF NOT EXISTS loans (
  loan_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  equipment_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expected_return_date DATE NOT NULL,
  actual_return_date TIMESTAMP NULL DEFAULT NULL,
  status ENUM('Pending', 'Approved', 'Returned', 'Overdue', 'Rejected') NOT NULL DEFAULT 'Pending',
  handled_by INT NULL,
  station_code VARCHAR(50) NOT NULL,
  notes TEXT,
  rejection_reason VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  FOREIGN KEY (equipment_id) REFERENCES equipment(equipment_id) ON DELETE RESTRICT,
  FOREIGN KEY (handled_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_loans_user (user_id),
  INDEX idx_loans_status (status),
  INDEX idx_loans_station (station_code),
  INDEX idx_loans_expected_return (expected_return_date)
);

CREATE TABLE IF NOT EXISTS loan_audit_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  loan_id INT NOT NULL,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by INT NULL,
  comments TEXT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_audit_loan (loan_id)
);
