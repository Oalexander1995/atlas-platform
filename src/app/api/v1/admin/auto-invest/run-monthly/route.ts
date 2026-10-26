import { NextRequest, NextResponse } from 'next/server';
import { runMonthlyAutoInvestScheduled } from '@/lib/auto-invest';

export async function POST(req: NextRequest) {
  try {
    const result = await runMonthlyAutoInvestScheduled();
    return NextResponse.json({
      data: {
        success: true,
        executedPlans: result.executedCount,
        totalDeployedPence: result.totalDeployedPence,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}
