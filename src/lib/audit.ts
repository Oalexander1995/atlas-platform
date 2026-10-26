import { query } from './db';
import { ClockService } from './clock';

export interface AuditEventParams {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  ip?: string | null;
}

/**
 * Strips sensitive keys such as passwords or secrets before logging
 */
function sanitizeAuditPayload(data?: Record<string, any> | null): Record<string, any> | null {
  if (!data) return null;
  const clone = { ...data };
  const sensitiveKeys = ['password', 'password_hash', 'token', 'secret', 'gemini_api_key'];

  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
      clone[key] = '[REDACTED]';
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      clone[key] = sanitizeAuditPayload(clone[key]);
    }
  }

  return clone;
}

/**
 * Records an append-only audit event in the database.
 */
export async function recordAuditLog(params: AuditEventParams): Promise<string> {
  const simulatedNow = await ClockService.now();
  const sanitizedBefore = sanitizeAuditPayload(params.before);
  const sanitizedAfter = sanitizeAuditPayload(params.after);

  const res = await query<{ id: string }>(
    `INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, before, after, ip, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      params.actorUserId || null,
      params.action,
      params.entityType,
      params.entityId || null,
      sanitizedBefore ? JSON.stringify(sanitizedBefore) : null,
      sanitizedAfter ? JSON.stringify(sanitizedAfter) : null,
      params.ip || null,
      simulatedNow.toISOString(),
    ]
  );

  return res.rows[0].id;
}
