import React from 'react';
import { notFound } from 'next/navigation';
import { getOpportunityById } from '@/lib/opportunities';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '@/lib/seed';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { getUserLimitsRemaining } from '@/lib/investments';
import { getOnboardingStatus } from '@/lib/onboarding';
import { InvestFlowClient } from './InvestFlowClient';

export const dynamic = 'force-dynamic';

export default async function InvestPage({
  params,
}: {
  params: { id: string };
}) {
  await ensureOpportunitiesSeeded();
  await ensureDemoUsersSeeded();

  const { opportunity } = await getOpportunityById(params.id);
  if (!opportunity) {
    notFound();
  }

  // Get current user or default to demo@atlas.example / ready@atlas.demo
  const session = await getCurrentUser();
  let userId = session?.userId;

  if (!userId) {
    const readyUser = await query<{ id: string }>(
      `SELECT id FROM users WHERE email IN ('demo@atlas.example', 'ready@atlas.demo') ORDER BY (email = 'demo@atlas.example') DESC LIMIT 1`
    );
    userId = readyUser.rows[0]?.id;
  }

  if (!userId) {
    return <div>Unable to initialize user session for investment.</div>;
  }

  let userName = 'Demo Investor';
  const userRow = await query<{ full_name: string }>('SELECT full_name FROM users WHERE id = $1', [userId]);
  if (userRow.rows[0]?.full_name) {
    userName = userRow.rows[0].full_name;
  }

  const limits = await getUserLimitsRemaining(userId, opportunity.id);
  const onboarding = await getOnboardingStatus(userId);

  return (
    <InvestFlowClient
      opportunity={opportunity}
      initialLimits={limits}
      userId={userId}
      userName={userName}
      isReadyToInvest={onboarding.isReadyToInvest}
      onboardingNextStep={onboarding.nextStep}
      coolingOffSecondsRemaining={onboarding.coolingOff.secondsRemaining}
    />
  );
}
