import 'dotenv/config';
import { closeDb } from '../server/db/client.js';
import { seedFromEnvironment } from '../server/seed/rsu.js';
import { logger } from '../server/lib/logger.js';

async function main() {
  const result = await seedFromEnvironment();
  logger.info(result, 'Seeded RSU demo tenant');
}

main()
  .catch((error) => {
    logger.error({ error }, 'Seed failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDb();
  });
