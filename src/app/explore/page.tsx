import React from 'react';
import { getOpportunities } from '@/lib/opportunities';
import { ensureOpportunitiesSeeded } from '@/lib/seed';
import { RiskWarningBanner } from '@/components/RiskWarningBanner';
import { ExploreClient } from './ExploreClient';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ExplorePage() {
  await ensureOpportunitiesSeeded();
  const opportunities = await getOpportunities();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6">
      {/* Statutory Risk Warning Banner */}
      <RiskWarningBanner />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            Explore Investment Opportunities
          </h1>
          <p className="text-xs md:text-sm text-slate-600">
            Discover vetted investment projects pitched by project creators and sponsors. Back them from £10.
          </p>
        </div>
        <Link
          href="/pitch"
          className="self-start sm:self-auto px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs md:text-sm font-semibold transition shadow-xs flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4 text-emerald-200" />
          <span>Pitch an Opportunity</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <ExploreClient initialOpportunities={opportunities} />
    </div>
  );
}
