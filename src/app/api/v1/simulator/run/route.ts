import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { runMonteCarloSimulation, SimulatorInputs } from '@/lib/simulator';
import { recordSimulatorUsage } from '@/lib/points';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const amountPounds = Number(body.amount_pounds || 100);
    const termMonths = Number(body.term_months || 12);
    const allocation = body.allocation || { low: 40, medium: 40, high: 20, uncharted: 0 };

    const simulationResult = runMonteCarloSimulation({
      amountPounds,
      termMonths,
      allocation,
    });

    // Check if user is logged in or demo user to award simulator points (max once a day)
    let pointsAwarded = 0;
    const session = await getCurrentUser();
    let userId = session?.userId;
    if (!userId) {
      const demoRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
        'ready@atlas.demo',
      ]);
      userId = demoRes.rows[0]?.id;
    }

    if (userId) {
      const usage = await recordSimulatorUsage(userId);
      pointsAwarded = usage.pointsAwarded;
    }

    return NextResponse.json({
      success: true,
      data: {
        ...simulationResult,
        pointsAwarded,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'SIMULATION_FAILED', message: err.message } },
      { status: 500 }
    );
  }
}
