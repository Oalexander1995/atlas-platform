import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAutoInvestDetails } from '@/lib/auto-invest';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  let userId = user?.userId;

  if (!userId) {
    const demo = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', ['ready@atlas.demo']);
    userId = demo.rows[0]?.id;
  }

  if (!userId) {
    return NextResponse.json(
      { error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const details = await getAutoInvestDetails(userId);
  return NextResponse.json({ data: details });
}
