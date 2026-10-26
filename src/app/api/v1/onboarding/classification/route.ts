import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { submitInvestorClassification } from '@/lib/onboarding';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const { category } = body;

  if (!category || !['restricted', 'high_net_worth', 'sophisticated'].includes(category)) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Category must be one of: restricted, high_net_worth, sophisticated',
        },
      },
      { status: 400 }
    );
  }

  const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
  await submitInvestorClassification({
    userId: user.userId,
    category,
    ip,
  });

  return NextResponse.json({
    data: { success: true, category },
  });
}
