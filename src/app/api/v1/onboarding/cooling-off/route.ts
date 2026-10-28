import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { ClockService } from '@/lib/clock';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  let user = await getCurrentUser();
  if (!user) {
    const fallbackRes = await query<{ id: string; email: string; full_name: string; role: string; account_state: string }>(
      `SELECT id, email, full_name, role, account_state FROM users WHERE email IN ('new@atlas.demo', 'demo@atlas.example', 'ready@atlas.demo') LIMIT 1`
    );
    if (fallbackRes.rows[0]) {
      const row = fallbackRes.rows[0];
      user = {
        userId: row.id,
        email: row.email,
        fullName: row.full_name,
        role: row.role as any,
        accountState: row.account_state as any,
      };
    }
  }

  if (!user) {
    return NextResponse.json({ error: { message: 'User not found' } }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const action = body.action || 'skip';
  const now = await ClockService.now();

  if (action === 'skip') {
    // End cooling-off period immediately (demo shortcut)
    const pastTime = new Date(now.getTime() - 1000);
    await query(
      `UPDATE cooling_off SET ends_at = $1 WHERE user_id = $2`,
      [pastTime.toISOString(), user.userId]
    );

    await recordAuditLog({
      actorUserId: user.userId,
      action: 'COOLING_OFF_SKIPPED_DEMO',
      entityType: 'cooling_off',
      after: { ends_at: pastTime.toISOString() },
    });

    return NextResponse.json({ success: true, message: 'Cooling-off skipped for demo.' });
  }

  if (action === 'confirm') {
    // User actively confirms "I want to continue" after cooling-off
    await recordAuditLog({
      actorUserId: user.userId,
      action: 'COOLING_OFF_CONFIRMED',
      entityType: 'cooling_off',
      after: { confirmed: true, confirmed_at: now.toISOString() },
    });

    return NextResponse.json({ success: true, message: 'Cooling-off period actively confirmed.' });
  }

  return NextResponse.json({ error: { message: 'Invalid action' } }, { status: 400 });
}
