import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { recordAuditLog } from '@/lib/audit';
import { getDb, query, closeDb } from '@/lib/db';

describe('Audit Log Service', () => {
  beforeAll(async () => {
    await getDb('memory://');
  });

  afterAll(async () => {
    await closeDb();
  });

  it('records audit events with sanitized payloads', async () => {
    const eventId = await recordAuditLog({
      action: 'TEST_USER_CREATION',
      entityType: 'users',
      entityId: 'test-user-id',
      before: null,
      after: {
        email: 'test@atlas.demo',
        password: 'PlainTextPasswordShouldBeRedacted',
        password_hash: 'HashShouldAlsoBeRedacted',
        role: 'investor',
      },
      ip: '192.168.1.1',
    });

    expect(eventId).toBeDefined();

    const res = await query(
      'SELECT action, entity_type, entity_id, after, ip FROM audit_log WHERE id = $1',
      [eventId]
    );

    expect(res.rows.length).toBe(1);
    const row = res.rows[0];
    expect(row.action).toBe('TEST_USER_CREATION');
    expect(row.entity_type).toBe('users');
    expect(row.entity_id).toBe('test-user-id');
    expect(row.ip).toBe('192.168.1.1');

    // Verify sanitization
    const afterObj = typeof row.after === 'string' ? JSON.parse(row.after) : row.after;
    expect(afterObj.email).toBe('test@atlas.demo');
    expect(afterObj.password).toBe('[REDACTED]');
    expect(afterObj.password_hash).toBe('[REDACTED]');
    expect(afterObj.role).toBe('investor');
  });
});
