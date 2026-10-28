/**
 * Database Seed Script
 * Runs db/seed.sql
 */
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { getDB } from '../src/server/db/index.ts';

async function main() {
  console.log('🌱 Seeding database...');
  const seedPath = path.resolve(process.cwd(), 'db/seed.sql');
  if (!fs.existsSync(seedPath)) {
    console.error('❌ Seed file not found at:', seedPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(seedPath, 'utf8');
  const db = getDB();

  const cleaned = sql.replace(/--.*$/gm, '').trim();
  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      await db.execute(stmt);
    } catch (err: any) {
      console.warn('Seed statement notice:', err.message);
    }
  }

  console.log('✅ Database seeded successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ DB seed failed:', err);
  process.exit(1);
});
