import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ClockService } from '@/lib/clock';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    // Fast-forward is allowed in demo mode or for admins
    const body = await req.json().catch(() => ({}));
    const { hours = 24, reset = false } = body;

    let newTime: Date;

    if (reset) {
      newTime = await ClockService.reset();
    } else {
      newTime = await ClockService.fastForwardHours(Number(hours));
    }

    await recordAuditLog({
      actorUserId: user?.userId || null,
      action: reset ? 'TIME_RESET' : 'TIME_FAST_FORWARDED',
      entityType: 'system_clock',
      after: {
        newTime: newTime.toISOString(),
        hoursAdded: reset ? 0 : hours,
      },
    });

    return NextResponse.json({
      data: {
        simulatedTime: newTime.toISOString(),
        offsetMs: await ClockService.getOffsetMs(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Failed to fast forward time',
        },
      },
      { status: 500 }
    );
  }
}
