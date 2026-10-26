import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { depositDemoMoney } from '@/lib/ledger';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required to make deposits',
        },
      },
      { status: 401 }
    );
  }

  const idempotencyKey =
    req.headers.get('idempotency-key') ||
    `deposit_${user.userId}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  try {
    const body = await req.json();
    const { amount_pence, description } = body;

    if (!amount_pence || typeof amount_pence !== 'number' || amount_pence <= 0) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'amount_pence must be a positive integer in pence',
          },
        },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = await depositDemoMoney({
      userId: user.userId,
      amountPence: Math.floor(amount_pence),
      idempotencyKey,
      description,
      ip,
    });

    return NextResponse.json({
      data: {
        journalEntryId: result.journalEntryId,
        balancePence: result.newBalancePence,
        notice: 'DEMO — simulated money. No real investments are made.',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'LIMIT_EXCEEDED',
          message: err.message || 'Deposit failed',
        },
      },
      { status: 400 }
    );
  }
}
