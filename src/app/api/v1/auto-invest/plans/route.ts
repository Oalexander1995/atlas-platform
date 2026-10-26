import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { executeAutoInvestAllocation } from '@/lib/auto-invest';
import { query } from '@/lib/db';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  let userId = user?.userId;

  if (!userId) {
    const demo = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', ['ready@atlas.demo']);
    userId = demo.rows[0]?.id;
  }

  if (!userId) {
    return NextResponse.json(
      { error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  const idempotencyKey =
    req.headers.get('idempotency-key') ||
    `auto_inv_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    const body = await req.json();
    const { risk_tier, amount_pence, monthly_pence = 0 } = body;

    if (!risk_tier || !amount_pence) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'risk_tier and amount_pence are required' } },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = await executeAutoInvestAllocation({
      userId,
      riskTier: risk_tier,
      amountPence: Math.floor(amount_pence),
      monthlyPence: Math.floor(monthly_pence),
      idempotencyKey,
      ip,
    });

    return NextResponse.json({ data: result });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'AUTO_INVEST_ERROR', message: err.message || 'Auto-invest execution failed' } },
      { status: 400 }
    );
  }
}
