import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '@/lib/seed';
import { query } from '@/lib/db';
import { getUserPortfolio } from '@/lib/portfolio';
import { PortfolioClient } from './PortfolioClient';

export const dynamic = 'force-dynamic';

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams?: { user?: string };
}) {
  await ensureOpportunitiesSeeded();
  await ensureDemoUsersSeeded();

  const session = await getCurrentUser();
  const targetEmail = searchParams?.user || session?.email || 'active@atlas.demo';

  let userRes = await query<{ id: string; email: string; full_name: string }>(
    'SELECT id, email, full_name FROM users WHERE email = $1',
    [targetEmail]
  );

  if (userRes.rows.length === 0) {
    userRes = await query<{ id: string; email: string; full_name: string }>(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      ['active@atlas.demo']
    );
  }

  const user = userRes.rows[0];
  const portfolio = await getUserPortfolio(user.id);

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 max-w-5xl mx-auto">
        <span>
          Viewing Portfolio for: <strong>{user.email}</strong> ({user.full_name})
        </span>
        <div className="flex items-center gap-2">
          <a
            href="/portfolio?user=active@atlas.demo"
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition ${
              user.email === 'active@atlas.demo'
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            Active Investor (8 holdings)
          </a>
          <a
            href="/portfolio?user=ready@atlas.demo"
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition ${
              user.email === 'ready@atlas.demo'
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            Ready Investor (0 holdings)
          </a>
        </div>
      </div>

      <PortfolioClient portfolio={portfolio} />
    </div>
  );
}
