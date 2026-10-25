import 'dotenv/config';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { closeDb, getDb } from '../server/db/client.js';
import { logger } from '../server/lib/logger.js';

async function main() {
  await migrate(getDb(), { migrationsFolder: './drizzle' });
  logger.info('Database migrations applied');
}

main()
  .catch((error) => {
    logger.error({ error }, 'Migration failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
