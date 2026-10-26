import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { ensureDemoUsersSeeded } from '@/lib/seed';
import { query } from '@/lib/db';
import { getWalletBalancePence, getWalletTransactions } from '@/lib/ledger';
import { WalletClient } from './WalletClient';

export const dynamic = 'force-dynamic';

export default async function WalletPage() {
  await ensureDemoUsersSeeded();

  let session = await getCurrentUser();
  let userId = session?.userId;
  let userEmail = session?.email || 'ready@atlas.demo';

  // In demo mode, if not explicitly logged in, default to ready@atlas.demo
  if (!userId) {
    const demoUserRes = await query<{ id: string; email: string }>(
      'SELECT id, email FROM users WHERE email = $1',
      ['ready@atlas.demo']
    );
    if (demoUserRes.rows.length > 0) {
      userId = demoUserRes.rows[0].id;
      userEmail = demoUserRes.rows[0].email;
    }
  }

  if (!userId) {
    return <div>Unable to initialize demo wallet.</div>;
  }

  const balancePence = await getWalletBalancePence(userId);
  const transactions = await getWalletTransactions(userId);

  return (
    <div className="py-4">
      <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-4 py-2 text-xs flex items-center justify-between">
        <span>
          Viewing demo wallet for: <strong>{userEmail}</strong>
        </span>
        <span className="text-emerald-700">Demo Active</span>
      </div>
      <WalletClient
        initialBalancePence={balancePence}
        initialTransactions={transactions}
        userEmail={userEmail}
      />
    </div>
  );
}
