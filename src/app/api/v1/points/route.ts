import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getUserPointsBalance } from '@/lib/points';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    let userId = session?.userId;

    if (!userId) {
      const demoRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
        'ready@atlas.demo',
      ]);
      userId = demoRes.rows[0]?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not identified' } },
        { status: 401 }
      );
    }

    const balance = await getUserPointsBalance(userId);

    const historyRes = await query<{
      id: string;
      points: number;
      reason: string;
      created_at: string;
    }>(
      `SELECT id, points, reason, created_at
       FROM points_transactions
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: {
        balance,
        transactions: historyRes.rows,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'FETCH_POINTS_FAILED', message: err.message } },
      { status: 500 }
    );
  }
}
