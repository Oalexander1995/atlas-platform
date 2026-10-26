import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getUserNotifications } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    let userId = session?.userId;

    if (!userId) {
      // Default to demo user ready@atlas.demo if not logged in
      const demoRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
        'ready@atlas.demo',
      ]);
      userId = demoRes.rows[0]?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'No user identified' } },
        { status: 401 }
      );
    }

    const { notifications, unreadCount } = await getUserNotifications(userId);

    return NextResponse.json({
      success: true,
      data: {
        notifications,
        unreadCount,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'FETCH_FAILED', message: err.message || 'Failed to fetch notifications' } },
      { status: 500 }
    );
  }
}
