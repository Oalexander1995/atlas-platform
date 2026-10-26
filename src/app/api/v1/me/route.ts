import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { ClockService } from '@/lib/clock';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required',
        },
      },
      { status: 401 }
    );
  }

  const simulatedNow = await ClockService.nowISO();

  return NextResponse.json({
    data: {
      user,
      simulatedTime: simulatedNow,
    },
  });
}
