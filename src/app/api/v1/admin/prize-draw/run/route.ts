import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runPrizeDraw } from '@/lib/prize-draw';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (session && session.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { draw_id, seed } = body;

    if (!draw_id) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'draw_id is required' } },
        { status: 400 }
      );
    }

    const result = await runPrizeDraw(draw_id, seed);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'PRIZE_DRAW_RUN_FAILED', message: err.message } },
      { status: 400 }
    );
  }
}
