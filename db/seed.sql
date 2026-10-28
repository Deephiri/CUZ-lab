-- Cavendish University Zambia (CUZ) Lab Equipment Borrowing System
-- Seed Data

-- 1. Stations
INSERT INTO stations (station_code, lab_name, location_description) VALUES
('STN-MAIN-01', 'Main Campus IoT & Computing Lab', 'Building B, 2nd Floor, Room B-204'),
('STN-ENG-02', 'Engineering & Robotics Workshop', 'Engineering Annex, Ground Floor, Room E-101');

-- 2. Users (Password for all accounts is: Password123!)
-- Hash: $2b$10$WYinTjPZ4Cy9P/m6CGVnheIsvYAxa9IDMvRh8/Ab6qrRMWvzWMxaW
INSERT INTO users (student_staff_id, full_name, email, password_hash, role) VALUES
-- Admin (1)
('ADM-CUZ-001', 'Dr. Mwamba Chileshe', 'admin.mwamba@cuz.ac.zm', '$2b$10$WYinTjPZ4Cy9P/m6CGVnheIsvYAxa9IDMvRh8/Ab6qrRMWvzWMxaW', 'admin'),

-- Technicians (2)
('TECH-CUZ-101', 'Joseph Banda', 'jbanda.tech@cuz.ac.zm', '$2b$10$WYinTjPZ4Cy9P/m6CGVnheIsvYAxa9IDMvRh8/Ab6qrRMWvzWMxaW', 'technician'),
('TECH-CUZ-102', 'Mutale Nkonde', 'mnkonde.tech@cuz.ac.zm', '$2b$10$WYinTjPZ4Cy9P/m6CGVnheIsvYAxa9IDMvRh8/Ab6qrRMWvzWMxaW', 'technician'),

-- Students (5) - 6-digit Student ID format (e.g. 115-564)
('115-564', 'Dalitso Phiri', 'dphiri23@student.cuz.ac.zm', '$2b$10$WYinTjPZ4Cy9P/m6CGVnheIsvYAxa9IDMvRh8/Ab6qrRMWvzWMxaW', 'student'),
('115-899', 'Thandiwe Zulu', 'tzulu23@student.cuz.ac.zm', '$2b$10$WYinTjPZ4Cy9P/m6CGVnheIsvYAxa9IDMvRh8/Ab6qrRMWvzWMxaW', 'student'),
('115-155', 'Kondwani Tembo', 'ktembo24@student.cuz.ac.zm', '$2b$10$WYinTjPZ4Cy9P/m6CGVnheIsvYAxa9IDMvRh8/Ab6qrRMWvzWMxaW', 'student'),
('115-322', 'Natasha Mulenga', 'nmulenga24@student.cuz.ac.zm', '$2b$10$WYinTjPZ4Cy9P/m6CGVnheIsvYAxa9IDMvRh8/Ab6qrRMWvzWMxaW', 'student'),
('115-518', 'Bwalya Musonda', 'bmusonda24@student.cuz.ac.zm', '$2b$10$WYinTjPZ4Cy9P/m6CGVnheIsvYAxa9IDMvRh8/Ab6qrRMWvzWMxaW', 'student');

-- 3. Equipment (~15 realistic laboratory items)
INSERT INTO equipment (object_name, category, total_quantity, available_quantity, status, model_or_specs) VALUES
('Arduino Uno R3 Kit', 'Microcontrollers & Embedded', 18, 18, 'active', 'ATmega328P with USB Cable & breadboard jumpers'),
('Raspberry Pi 4 Model B (4GB)', 'Single Board Computers', 12, 12, 'active', 'Quad-Core 1.5GHz with 32GB SD & Type-C PSU'),
('Digital Multimeter Pro', 'Measurement & Testing', 15, 15, 'active', 'UNI-T UT61E Auto-ranging with probes'),
('Solderless Breadboard 830-Point', 'Prototyping & Circuits', 30, 30, 'active', 'Standard MB-102 with power supply rails'),
('High-Speed HDMI to HDMI Cable (2m)', 'Cables & Adapters', 25, 25, 'active', 'Braided 4K@60Hz male-to-male'),
('Cat6 Shielded Ethernet Cable (3m)', 'Networking', 35, 35, 'active', 'RJ45 snagless gold-plated connectors'),
('Jumper Wire Kit (120 Pcs M-M/M-F/F-F)', 'Prototyping & Circuits', 20, 20, 'active', 'Multicolored 20cm ribbon cables'),
('Dell Latitude 5420 Core i5 Lab Laptop', 'Computing Hardware', 8, 8, 'active', '16GB RAM, 512GB NVMe, Ubuntu LTS dual boot'),
('ESP32 NodeMCU Wi-Fi + BLE Board', 'Microcontrollers & Embedded', 16, 16, 'active', 'Dual-core CP2102 development board'),
('Rigol DS1054Z Digital Oscilloscope', 'Measurement & Testing', 4, 4, 'active', '50MHz 4-channel 1GSa/s with probes'),
('Adjustable DC Bench Power Supply (30V/5A)', 'Power & Bench Equipment', 6, 6, 'active', 'Linear variable regulation with banana leads'),
('Logitech C920 HD Pro Webcam', 'Peripherals & AV', 10, 10, 'active', '1080p 30fps autofocus with tripod mount'),
('Soldering Station Kit 60W', 'Tools & Fabrication', 8, 8, 'active', 'Temperature controlled with stand and brass cleaner'),
('Logic Analyzer 8-Channel 24MHz', 'Measurement & Testing', 7, 7, 'active', 'USB logic probe compatible with PulseView/Sigrok'),
('Ultrasonic Sensor HC-SR04 Module Kit', 'Sensors & Actuators', 22, 22, 'active', '5V sonar distance module with mounting bracket'),
('HDMI to VGA Active Adapter with Audio', 'Cables & Adapters', 14, 14, 'active', '1080p supported with 3.5mm jack output');
