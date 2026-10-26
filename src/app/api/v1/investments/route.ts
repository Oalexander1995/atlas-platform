import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { executeInvestment } from '@/lib/investments';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required to invest' } },
      { status: 401 }
    );
  }

  const idempotencyKey =
    req.headers.get('idempotency-key') ||
    `invest_${user.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    const body = await req.json();
    const { opportunity_id, amount_pence, risk_ack } = body;

    if (!opportunity_id || !amount_pence) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'opportunity_id and amount_pence are required',
          },
        },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = await executeInvestment({
      userId: user.userId,
      opportunityId: opportunity_id,
      amountPence: Math.floor(amount_pence),
      riskAck: Boolean(risk_ack),
      idempotencyKey,
      ip,
    });

    return NextResponse.json({
      data: result,
    });
  } catch (err: any) {
    const code = err.code || 'LIMIT_EXCEEDED';
    return NextResponse.json(
      {
        error: {
          code,
          message: err.message || 'Investment failed',
        },
      },
      { status: 400 }
    );
  }
}
