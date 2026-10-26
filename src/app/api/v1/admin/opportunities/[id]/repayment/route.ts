import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { processRepayment } from '@/lib/lifecycle';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getCurrentUser();
    if (session && session.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
        { status: 403 }
      );
    }

    const opportunityId = params.id;
    const body = await req.json();

    const capitalPence = Number(body.capital_pence || 0);
    const interestPence = Number(body.interest_pence || 0);
    const idempotencyKey = req.headers.get('Idempotency-Key') || undefined;

    const result = await processRepayment({
      opportunityId,
      capitalPence,
      interestPence,
      actorUserId: session?.userId,
      idempotencyKey,
      ip: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'REPAYMENT_FAILED',
          message: err.message || 'Failed to process repayment',
        },
      },
      { status: 400 }
    );
  }
}
