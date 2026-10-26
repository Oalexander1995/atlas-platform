import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getUserBadges, BADGE_DEFINITIONS } from '@/lib/badges';

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

    const earned = await getUserBadges(userId);

    const badges = BADGE_DEFINITIONS.map((b) => {
      const match = earned.find((e) => e.badgeCode === b.code);
      return {
        ...b,
        unlocked: Boolean(match),
        awardedAt: match?.awardedAt || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        badges,
        totalEarned: earned.length,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'FETCH_BADGES_FAILED', message: err.message } },
      { status: 500 }
    );
  }
}
