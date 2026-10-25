import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { schema } from './schema.js';

const { Pool } = pg;

export type Database = NodePgDatabase<typeof schema>;

let pool: pg.Pool | null = null;
let database: Database | null = null;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not configured. Set it to a PostgreSQL connection string before starting the server.',
    );
  }
  return url;
}

function sslConfig(): false | { rejectUnauthorized: boolean } {
  if (process.env.DATABASE_SSL === 'false' || process.env.NODE_ENV === 'test') return false;
  if (process.env.DATABASE_SSL === undefined && process.env.NODE_ENV !== 'production') return false;
  return { rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false' };
}

export function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl(),
      max: Number(process.env.DATABASE_POOL_MAX || 5),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
      ssl: sslConfig(),
    });
    pool.on('error', (error) => {
      console.error('[database] idle client error', error);
    });
  }
  return pool;
}

export function getDb(): Database {
  if (!database) {
    database = drizzle(getPool(), { schema });
  }
  return database;
}

export async function checkDatabase(): Promise<boolean> {
  try {
    await getPool().query('select 1');
    return true;
  } catch (error) {
    console.error('[database] health check failed', error);
    return false;
  }
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    database = null;
  }
}
