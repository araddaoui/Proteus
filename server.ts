import 'dotenv/config';
import { createApp } from './server/app.js';
import { assertRuntimeConfig, config } from './server/config.js';
import { checkDatabase, closeDb } from './server/db/client.js';
import { logger } from './server/lib/logger.js';

assertRuntimeConfig();

const app = createApp();
const server = app.listen(config.port, () => {
  logger.info({ port: config.port, env: config.nodeEnv }, 'Proteus server listening');
  checkDatabase().then((ok) => {
    if (!ok) logger.warn('Database health check failed at startup');
  });
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    closeDb()
      .catch((error) => logger.error({ error }, 'Failed to close database pool'))
      .finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
