import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './src/server/app.ts';
import { setupCronJobs } from './src/server/cron/overdueCron.ts';
import { getDB } from './src/server/db/index.ts';

const PORT = Number(process.env.PORT) || 3000;

async function bootstrap() {
  const app = createApp();

  // Initialize DB connection & verify
  try {
    const db = getDB();
    await db.query('SELECT 1');
    console.log('✅ Database layer connected successfully.');
  } catch (err) {
    console.error('❌ Failed initializing database:', err);
  }

  // Initialize background cron scheduler
  setupCronJobs();

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CUZ Lab Equipment Borrowing System running at http://0.0.0.0:${PORT}`);
    console.log(`📱 Health Check: http://localhost:${PORT}/health`);
  });
}

bootstrap().catch(err => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});
