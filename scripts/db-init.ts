/**
 * Database Initialization Script
 * Runs db/schema.sql
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { getDB } from '../src/server/db/index.ts';

async function main() {
  console.log('🔄 Initializing database schema...');
  const schemaPath = path.resolve(process.cwd(), 'db/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    console.error('❌ Schema file not found at:', schemaPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');
  const db = getDB();

  // Split and execute statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const stmt of statements) {
    try {
      await db.execute(stmt);
    } catch (err: any) {
      console.warn('Init statement notice:', err.message);
    }
  }

  console.log('✅ Database schema initialized successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ DB init failed:', err);
  process.exit(1);
});
