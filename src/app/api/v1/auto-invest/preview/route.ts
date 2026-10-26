import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { previewAutoInvestAllocation } from '@/lib/auto-invest';
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

  try {
    const body = await req.json();
    const { risk_tier, amount_pence } = body;

    if (!risk_tier || !amount_pence) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'risk_tier and amount_pence are required' } },
        { status: 400 }
      );
    }

    const preview = await previewAutoInvestAllocation({
      userId,
      riskTier: risk_tier,
      amountPence: Math.floor(amount_pence),
    });

    return NextResponse.json({ data: preview });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_ERROR', message: err.message || 'Preview failed' } },
      { status: 400 }
    );
  }
}
