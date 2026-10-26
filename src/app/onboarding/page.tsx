import React from 'react';
import { getCurrentUser } from '@/lib/auth';
import { ensureDemoUsersSeeded } from '@/lib/seed';
import { query } from '@/lib/db';
import { getOnboardingStatus } from '@/lib/onboarding';
import { OnboardingClient } from './OnboardingClient';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams?: { user?: string };
}) {
  await ensureDemoUsersSeeded();

  const session = await getCurrentUser();
  const targetEmail = searchParams?.user || session?.email || 'new@atlas.demo';

  // Find user by email
  let userRes = await query<{ id: string; full_name: string; email: string }>(
    'SELECT id, full_name, email FROM users WHERE email = $1',
    [targetEmail]
  );

  if (userRes.rows.length === 0) {
    // Fall back to ready@atlas.demo or create new@atlas.demo
    userRes = await query<{ id: string; full_name: string; email: string }>(
      'SELECT id, full_name, email FROM users WHERE email = $1',
      ['new@atlas.demo']
    );

    if (userRes.rows.length === 0) {
      const created = await query<{ id: string; full_name: string; email: string }>(
        `INSERT INTO users (email, password_hash, full_name, date_of_birth, postcode, role, account_state)
         VALUES ('new@atlas.demo', '$2a$10$demo', 'New Investor', '1995-06-20', 'SW1A 1AA', 'investor', 'pending_kyc')
         RETURNING id, full_name, email`
      );
      userRes = created;
    }
  }

  const user = userRes.rows[0];
  const status = await getOnboardingStatus(user.id);

  return (
    <div className="space-y-4">
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2 max-w-2xl mx-auto">
        <span>
          Onboarding Persona: <strong>{user.email}</strong> ({user.full_name})
        </span>
        <div className="flex items-center gap-2">
          <a
            href="/onboarding?user=new@atlas.demo"
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition ${
              user.email === 'new@atlas.demo'
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            Reset (new@)
          </a>
          <a
            href="/onboarding?user=ready@atlas.demo"
            className={`px-2 py-1 rounded-lg border text-[11px] font-semibold transition ${
              user.email === 'ready@atlas.demo'
                ? 'bg-emerald-700 text-white border-emerald-800'
                : 'bg-white text-emerald-900 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            Ready Investor (ready@)
          </a>
        </div>
      </div>

      <OnboardingClient
        initialStatus={status}
        userFullName={user.full_name}
        userEmail={user.email}
      />
    </div>
  );
}
