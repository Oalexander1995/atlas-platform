import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, query, exec, closeDb } from '@/lib/db';

describe('Database and Migrations (PostgreSQL via PGlite)', () => {
  beforeAll(async () => {
    await getDb('memory://');
  });

  afterAll(async () => {
    await closeDb();
  });

  it('initializes schema and creates core tables', async () => {
    const res = await query<{ table_name: string }>(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const tableNames = res.rows.map((r) => r.table_name);

    expect(tableNames).toContain('users');
    expect(tableNames).toContain('audit_log');
    expect(tableNames).toContain('system_settings');
  });

  it('enforces append-only trigger on audit_log', async () => {
    // Insert test row into audit_log
    const insertRes = await query<{ id: string }>(
      `INSERT INTO audit_log (action, entity_type) VALUES ($1, $2) RETURNING id`,
      ['TEST_ACTION', 'test_entity']
    );
    const rowId = insertRes.rows[0].id;
    expect(rowId).toBeDefined();

    // Attempting to UPDATE must fail due to trigger
    await expect(
      query(`UPDATE audit_log SET action = 'MODIFIED' WHERE id = $1`, [rowId])
    ).rejects.toThrow(/audit_log is append-only/);

    // Attempting to DELETE must fail due to trigger
    await expect(
      query(`DELETE FROM audit_log WHERE id = $1`, [rowId])
    ).rejects.toThrow(/audit_log is append-only/);
  });
});
