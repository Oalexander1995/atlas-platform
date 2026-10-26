import React from 'react';
import Link from 'next/link';
import { getOpportunities } from '@/lib/opportunities';
import { ensureOpportunitiesSeeded } from '@/lib/seed';
import { AdminOpportunitiesClient } from './AdminOpportunitiesClient';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOpportunitiesPage() {
  await ensureOpportunitiesSeeded();
  const opportunities = await getOpportunities();

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Admin Console: Opportunities
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review, update status, and manage vetted opportunities across all risk tiers.
        </p>
      </div>

      <AdminOpportunitiesClient initialOpportunities={opportunities} />
    </div>
  );
}
