import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { generatePortfolioCsv } from '@/lib/portfolio';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  let userId = user?.userId;

  if (!userId) {
    const demoUser = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', ['active@atlas.demo']);
    userId = demoUser.rows[0]?.id;
  }

  if (!userId) {
    return new NextResponse('Authentication required', { status: 401 });
  }

  const csv = await generatePortfolioCsv(userId);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="atlas_portfolio_statement.csv"',
    },
  });
}
