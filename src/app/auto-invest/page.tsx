import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '@/lib/seed';
import { query } from '@/lib/db';
import { getWalletBalancePence } from '@/lib/ledger';
import { getAutoInvestDetails } from '@/lib/auto-invest';
import { AutoInvestClient } from './AutoInvestClient';

export const dynamic = 'force-dynamic';

export default async function AutoInvestPage() {
  await ensureOpportunitiesSeeded();
  await ensureDemoUsersSeeded();

  const session = await getCurrentUser();
  let userId = session?.userId;

  if (!userId) {
    const readyUser = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', ['ready@atlas.demo']);
    userId = readyUser.rows[0]?.id;
  }

  if (!userId) {
    return <div>Unable to initialize user for Auto-Invest.</div>;
  }

  const walletBalance = await getWalletBalancePence(userId);
  const details = await getAutoInvestDetails(userId);

  return (
    <AutoInvestClient
      initialPlan={details.plan}
      initialHoldings={details.holdings}
      walletBalancePence={walletBalance}
      userId={userId}
    />
  );
}
