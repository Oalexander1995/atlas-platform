import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { processDefault } from '@/lib/lifecycle';

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

    const recoveryPercent = Number(body.recovery_percent ?? 0);
    const provisionPayoutPercent = Number(body.provision_payout_percent ?? 0);
    const payoutReason = body.payout_reason || 'Discretionary provision payout';
    const idempotencyKey = req.headers.get('Idempotency-Key') || undefined;

    const result = await processDefault({
      opportunityId,
      recoveryPercent,
      provisionPayoutPercent,
      payoutReason,
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
          code: 'DEFAULT_FAILED',
          message: err.message || 'Failed to process default',
        },
      },
      { status: 400 }
    );
  }
}
