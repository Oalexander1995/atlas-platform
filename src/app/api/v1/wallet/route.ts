import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getWalletBalancePence, getWalletTransactions } from '@/lib/ledger';

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required to access wallet',
        },
      },
      { status: 401 }
    );
  }

  const balancePence = await getWalletBalancePence(user.userId);
  const transactions = await getWalletTransactions(user.userId);

  return NextResponse.json({
    data: {
      availableBalancePence: balancePence,
      investedPence: 0, // Computed from active holdings in Milestone 5
      currency: 'GBP',
      simulated: true,
      notice: 'Simulated — no real bank connection.',
      transactions,
    },
  });
}
