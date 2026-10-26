import { NextRequest, NextResponse } from 'next/server';
import { runReconciliation } from '@/lib/ledger';

export async function GET(req: NextRequest) {
  try {
    const report = await runReconciliation();
    return NextResponse.json({ data: report });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Reconciliation failed to execute',
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
