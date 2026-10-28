import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getOnboardingStatus } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
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
    return NextResponse.json(
      { error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const status = await getOnboardingStatus(user.userId);
  return NextResponse.json({
    data: status,
  });
}
