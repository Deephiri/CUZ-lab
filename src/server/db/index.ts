/**
 * Cavendish University Zambia - Lab Equipment Borrowing System
 * Database Abstraction Layer supporting MySQL 8+ and SQLite (better-sqlite3) fallback
 */

import Database from 'better-sqlite3';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

export interface QueryResult<T = any> {
  rows: T[];
  insertId?: number;
  affectedRows?: number;
}

export interface DBConnection {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<QueryResult>;
  withTransaction<T>(callback: (conn: DBConnection) => Promise<T>): Promise<T>;
}

class SQLiteAdapter implements DBConnection {
  private db: Database.Database;

  constructor(dbPath: string) {
    // Ensure dir exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
  }

  private initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS stations (
        station_id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_code TEXT NOT NULL UNIQUE,
        lab_name TEXT NOT NULL,
        location_description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_staff_id TEXT NOT NULL UNIQUE,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT CHECK(role IN ('student', 'technician', 'admin')) NOT NULL DEFAULT 'student',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS equipment (
        equipment_id INTEGER PRIMARY KEY AUTOINCREMENT,
        object_name TEXT NOT NULL,
        category TEXT NOT NULL,
        total_quantity INTEGER NOT NULL DEFAULT 1,
        available_quantity INTEGER NOT NULL DEFAULT 1,
        status TEXT CHECK(status IN ('active', 'maintenance', 'retired')) NOT NULL DEFAULT 'active',
        model_or_specs TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        CHECK (available_quantity >= 0),
        CHECK (available_quantity <= total_quantity)
      );

      CREATE TABLE IF NOT EXISTS loans (
        loan_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(user_id),
        equipment_id INTEGER NOT NULL REFERENCES equipment(equipment_id),
        quantity INTEGER NOT NULL DEFAULT 1,
        request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        expected_return_date DATE NOT NULL,
        actual_return_date DATETIME,
        status TEXT CHECK(status IN ('Pending', 'Approved', 'Returned', 'Overdue', 'Rejected')) NOT NULL DEFAULT 'Pending',
        handled_by INTEGER REFERENCES users(user_id),
        station_code TEXT NOT NULL,
        notes TEXT,
        rejection_reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS loan_audit_logs (
        log_id INTEGER PRIMARY KEY AUTOINCREMENT,
        loan_id INTEGER NOT NULL REFERENCES loans(loan_id) ON DELETE CASCADE,
        old_status TEXT,
        new_status TEXT NOT NULL,
        changed_by INTEGER REFERENCES users(user_id),
        comments TEXT,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if users table is empty; if so, run auto-seed
    const count = this.db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
    if (count.count === 0) {
      this.seedDefaultData();
    }
  }

  public seedDefaultData() {
    const seedPath = path.resolve(process.cwd(), 'db/seed.sql');
    if (fs.existsSync(seedPath)) {
      const sql = fs.readFileSync(seedPath, 'utf8');
      // Strip line comments
      const cleaned = sql.replace(/--.*$/gm, '').trim();
      const statements = cleaned
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      const tx = this.db.transaction(() => {
        for (const stmt of statements) {
          try {
            this.db.exec(stmt);
          } catch (err) {
            console.warn('Seed statement warning:', (err as Error).message);
          }
        }
      });
      tx();
      console.log('✅ CUZ Lab Database seeded with default data.');
    }
  }

  // Helper to convert MySQL ? placeholders or date functions if needed
  private sanitizeSql(sql: string): string {
    // Replace MySQL ON UPDATE CURRENT_TIMESTAMP or FOR UPDATE
    let s = sql.replace(/\s+FOR\s+UPDATE\b/gi, '');
    // In SQLite, boolean values are 0/1, datetime('now') vs NOW()
    s = s.replace(/\bNOW\(\)/gi, "datetime('now')");
    s = s.replace(/\bCURDATE\(\)/gi, "date('now')");
    return s;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const cleanSql = this.sanitizeSql(sql);
    const stmt = this.db.prepare(cleanSql);
    if (!stmt.reader) {
      const info = stmt.run(...params);
      return [] as T[];
    }
    return stmt.all(...params) as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<QueryResult> {
    const cleanSql = this.sanitizeSql(sql);
    const stmt = this.db.prepare(cleanSql);
    const info = stmt.run(...params);
    return {
      rows: [],
      insertId: Number(info.lastInsertRowid),
      affectedRows: info.changes,
    };
  }

  async withTransaction<T>(callback: (conn: DBConnection) => Promise<T>): Promise<T> {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = await callback(this);
      this.db.exec('COMMIT');
      return result;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK');
      } catch (e) {
        // Ignore rollback failure if already rolled back
      }
      throw err;
    }
  }
}

class MySQLAdapter implements DBConnection {
  private pool: mysql.Pool;

  constructor(pool: mysql.Pool) {
    this.pool = pool;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const [rows] = await this.pool.query(sql, params);
    return rows as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<QueryResult> {
    const [result] = await this.pool.execute(sql, params);
    const res = result as mysql.ResultSetHeader;
    return {
      rows: [],
      insertId: res.insertId,
      affectedRows: res.affectedRows,
    };
  }

  async withTransaction<T>(callback: (conn: DBConnection) => Promise<T>): Promise<T> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    try {
      const txConn: DBConnection = {
        async query<R = any>(sql: string, params: any[] = []): Promise<R[]> {
          const [rows] = await connection.query(sql, params);
          return rows as R[];
        },
        async execute(sql: string, params: any[] = []): Promise<QueryResult> {
          const [result] = await connection.execute(sql, params);
          const res = result as mysql.ResultSetHeader;
          return {
            rows: [],
            insertId: res.insertId,
            affectedRows: res.affectedRows,
          };
        },
        withTransaction: async () => {
          throw new Error('Nested transactions not supported');
        },
      };

      const result = await callback(txConn);
      await connection.commit();
      return result;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }
}

let dbInstance: DBConnection | null = null;

export function getDB(): DBConnection {
  if (dbInstance) return dbInstance;

  const dbHost = process.env.DB_HOST;
  const useMySQL = process.env.USE_MYSQL === 'true';

  if (useMySQL && dbHost && dbHost.trim().length > 0) {
    try {
      const pool = mysql.createPool({
        host: dbHost,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cuz_lab_db',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
      });
      console.log(`🔌 Connected to MySQL at ${dbHost}:${process.env.DB_PORT || 3306}`);
      dbInstance = new MySQLAdapter(pool);
      return dbInstance;
    } catch (err) {
      console.warn('⚠️ Could not connect to MySQL, falling back to embedded SQLite:', err);
    }
  }

  // Default to embedded database
  const localDbPath = path.resolve(process.cwd(), 'data/cuz_lab.sqlite');
  console.log(`📂 Using embedded SQLite database at ${localDbPath}`);
  dbInstance = new SQLiteAdapter(localDbPath);
  return dbInstance;
}
