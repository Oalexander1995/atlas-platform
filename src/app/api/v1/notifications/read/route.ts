import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { markNotificationAsRead, markAllNotificationsAsRead } from '@/lib/notifications';

export async function POST(req: NextRequest) {
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
        { error: { code: 'UNAUTHORIZED', message: 'No user identified' } },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { id, all } = body;

    if (all) {
      const count = await markAllNotificationsAsRead(userId);
      return NextResponse.json({ success: true, count });
    }

    if (id) {
      const ok = await markNotificationAsRead(id, userId);
      return NextResponse.json({ success: true, updated: ok });
    }

    return NextResponse.json(
      { error: { code: 'INVALID_REQUEST', message: 'Must provide id or all: true' } },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'UPDATE_FAILED', message: err.message || 'Failed to update notifications' } },
      { status: 500 }
    );
  }
}
