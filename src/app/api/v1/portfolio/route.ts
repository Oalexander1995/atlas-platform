import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserPortfolio } from '@/lib/portfolio';
import { ensureDemoUsersSeeded } from '@/lib/seed';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await ensureDemoUsersSeeded();

  const user = await getCurrentUser();
  let userId = user?.userId;

  // In demo mode, if not logged in, default to active@atlas.demo (or ready@atlas.demo)
  if (!userId) {
    const demoUser = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', ['active@atlas.demo']);
    userId = demoUser.rows[0]?.id;
  }

  if (!userId) {
    return NextResponse.json(
      { error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const portfolio = await getUserPortfolio(userId);
  return NextResponse.json({ data: portfolio });
}
