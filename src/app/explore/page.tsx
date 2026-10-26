import React from 'react';
import { getOpportunities } from '@/lib/opportunities';
import { ensureOpportunitiesSeeded } from '@/lib/seed';
import { RiskWarningBanner } from '@/components/RiskWarningBanner';
import { ExploreClient } from './ExploreClient';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  await ensureOpportunitiesSeeded();
  const opportunities = await getOpportunities();

  return (
    <div className="space-y-6">
      {/* Statutory Section 3.1 Risk Warning Banner */}
      <RiskWarningBanner />

      <div className="space-y-1">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Explore Vetted Opportunities
        </h1>
        <p className="text-sm text-slate-600">
          Support real small businesses across the UK. Start from £10 with clearly labelled risk and plain-English summaries.
        </p>
      </div>

      <ExploreClient initialOpportunities={opportunities} />
    </div>
  );
}
