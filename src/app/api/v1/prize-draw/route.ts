import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getOrCreateCurrentDraw, getPrizeDrawHistory } from '@/lib/prize-draw';
import { getUserPointsBalance } from '@/lib/points';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const currentDraw = await getOrCreateCurrentDraw();
    const history = await getPrizeDrawHistory();

    const session = await getCurrentUser();
    let userId = session?.userId;
    if (!userId) {
      const demoRes = await query<{ id: string }>(
        `SELECT id FROM users WHERE email IN ('demo@atlas.example', 'ready@atlas.demo') ORDER BY (email = 'demo@atlas.example') DESC LIMIT 1`
      );
      userId = demoRes.rows[0]?.id;
    }

    let userEntriesCount = 0;
    let pointsBalance = 0;

    if (userId) {
      const countRes = await query<{ count: string }>(
        'SELECT COUNT(*) AS count FROM prize_entries WHERE draw_id = $1 AND user_id = $2',
        [currentDraw.id, userId]
      );
      userEntriesCount = Number(countRes.rows[0]?.count || 0);
      pointsBalance = await getUserPointsBalance(userId);
    }

    const totalEntriesRes = await query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM prize_entries WHERE draw_id = $1',
      [currentDraw.id]
    );
    const totalEntriesInDraw = Number(totalEntriesRes.rows[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: {
        currentDraw: {
          ...currentDraw,
          totalEntries: totalEntriesInDraw,
        },
        userEntriesCount,
        userMaxEntriesRemaining: Math.max(0, 10 - userEntriesCount),
        pointsBalance,
        history,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'FETCH_PRIZE_DRAW_FAILED', message: err.message } },
      { status: 500 }
    );
  }
}
