import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { enterPrizeDrawWithPoints } from '@/lib/prize-draw';

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
        { error: { code: 'UNAUTHORIZED', message: 'User not identified' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const count = Number(body.entries_count || 1);

    const result = await enterPrizeDrawWithPoints({
      userId,
      entriesCount: count,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'ENTRY_FAILED', message: err.message } },
      { status: 400 }
    );
  }
}
