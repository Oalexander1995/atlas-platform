import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { submitSimulatedKyc } from '@/lib/onboarding';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { testName } = body;
  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

  const result = await submitSimulatedKyc({
    userId: user.userId,
    testName: testName || user.fullName,
    ip,
  });

  return NextResponse.json({
    data: result,
  });
}
