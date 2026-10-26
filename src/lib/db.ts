import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

let dbInstance: PGlite | null = null;
let initPromise: Promise<PGlite> | null = null;

const DEFAULT_DATA_DIR = path.resolve(process.cwd(), './data/postgres');

/**
 * Returns the singleton PGlite database instance.
 * Automatically initializes tables and triggers if they do not exist.
 */
export async function getDb(customDir?: string): Promise<PGlite> {
  if (dbInstance) {
    return dbInstance;
  }

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const dataDir = customDir || process.env.DATABASE_DIR || DEFAULT_DATA_DIR;

    if (dataDir !== 'memory://' && !fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const db = new PGlite(dataDir === 'memory://' ? undefined : dataDir);
    await applyMigrations(db);
    dbInstance = db;
    return db;
  })();

  return initPromise;
}

/**
 * Runs migration scripts to ensure all required tables and triggers exist.
 */
export async function applyMigrations(db: PGlite): Promise<void> {
  const schemaPath = path.resolve(process.cwd(), 'src/lib/schema.sql');
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    await db.exec(schemaSql);
  } else {
    throw new Error(`Schema file not found at ${schemaPath}`);
  }
}

/**
 * Helper to execute a query with parameters ($1, $2, ...)
 */
export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<{ rows: T[]; rowCount?: number }> {
  const db = await getDb();
  const result = await db.query<T>(sql, params);
  return { rows: result.rows, rowCount: (result as any).affectedRows ?? result.rows.length };
}

/**
 * Helper to execute raw SQL statement batch
 */
export async function exec(sql: string): Promise<void> {
  const db = await getDb();
  await db.exec(sql);
}

export interface DbClient {
  query<T = any>(sql: string, params?: any[]): Promise<{ rows: T[]; rowCount?: number }>;
  exec(sql: string): Promise<any>;
}

/**
 * Helper to run operations in a transaction
 */
export async function transaction<T>(fn: (tx: DbClient) => Promise<T>): Promise<T> {
  const db = await getDb();
  await db.exec('BEGIN');
  try {
    const wrappedTx: DbClient = {
      query: async <R = any>(sql: string, params?: any[]) => {
        const res = await db.query<R>(sql, params);
        return { rows: res.rows, rowCount: (res as any).affectedRows ?? res.rows.length };
      },
      exec: async (sql: string) => {
        return db.exec(sql);
      },
    };
    const result = await fn(wrappedTx);
    await db.exec('COMMIT');
    return result;
  } catch (error) {
    await db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * For testing: close and reset the database instance
 */
export async function closeDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    initPromise = null;
  }
}
