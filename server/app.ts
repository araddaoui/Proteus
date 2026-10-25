import fs from 'node:fs';
import path from 'node:path';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { checkDatabase } from './db/client.js';
import { readLimiter, writeLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFound } from './middleware/errors.js';
import { requestContext } from './middleware/request.js';
import { apiRouter } from './routes/index.js';
import { asyncHandler } from './middleware/errors.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (!config.corsOrigins.length) return callback(null, !config.isProduction);
        return callback(null, config.corsOrigins.includes(origin));
      },
      credentials: false,
      allowedHeaders: ['Authorization', 'Content-Type', 'X-Tenant-Id', 'X-Request-Id', 'Idempotency-Key'],
      exposedHeaders: ['X-Request-Id'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(requestContext);

  app.get('/api/v1/health', asyncHandler(async (_req, res) => {
    const database = await checkDatabase();
    res.status(database ? 200 : 503).json({
      status: database ? 'ok' : 'degraded',
      database,
      demoMode: config.demoMode,
    });
  }));

  app.use('/api/v1', apiRouter);
  app.use('/api', apiRouter);

  const distPath = path.join(process.cwd(), 'dist');
  if (!process.env.VERCEL && fs.existsSync(path.join(distPath, 'index.html'))) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}

export default createApp;
