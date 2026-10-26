import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getUserLimitsRemaining } from '@/lib/investments';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const opportunityId = req.nextUrl.searchParams.get('opportunity_id');
  if (!opportunityId) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: 'opportunity_id is required' } },
      { status: 400 }
    );
  }

  try {
    const limits = await getUserLimitsRemaining(user.userId, opportunityId);
    return NextResponse.json({ data: limits });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
