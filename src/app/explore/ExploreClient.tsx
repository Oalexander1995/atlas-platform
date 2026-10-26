'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { RiskTierBadge, RiskTier } from '@/components/RiskTierBadge';
import { Clock, MapPin, User, SlidersHorizontal, ArrowUpDown, Tag } from 'lucide-react';

interface OpportunityItem {
  id: string;
  title: string;
  summary: string;
  partner_name?: string;
  partner_location?: string;
  risk_tier: RiskTier;
  sector: string;
  target_pence: number;
  raised_pence: number;
  expected_return_min_bps: number;
  expected_return_max_bps: number;
  term_months: number;
  status: string;
}

export function ExploreClient({ initialOpportunities }: { initialOpportunities: OpportunityItem[] }) {
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [termFilter, setTermFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const filteredOpportunities = useMemo(() => {
    return initialOpportunities.filter((opp) => {
      if (tierFilter !== 'all' && opp.risk_tier !== tierFilter) return false;
      if (statusFilter !== 'all' && opp.status !== statusFilter) return false;
      if (termFilter === 'under_1' && opp.term_months >= 12) return false;
      if (termFilter === '1_to_3' && (opp.term_months < 12 || opp.term_months > 36)) return false;
      if (termFilter === '3_plus' && opp.term_months <= 36) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'term_length') return a.term_months - b.term_months;
      return 0; // default newest
    });
  }, [initialOpportunities, tierFilter, statusFilter, termFilter, sortBy]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <SlidersHorizontal className="w-4 h-4 text-emerald-700" />
            <span>Filters</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1 text-slate-800 font-medium focus:outline-none"
            >
              <option value="newest">Newest</option>
              <option value="term_length">Shortest Term</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Risk Tier Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Risk Level</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
            >
              <option value="all">All Risk Levels</option>
              <option value="low">Low Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="high">High Risk</option>
              <option value="uncharted">Uncharted (Highest Risk)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open for Investment</option>
              <option value="funded">Fully Funded</option>
              <option value="repaying">Repaying</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>

          {/* Term Length Filter */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Loan Length</label>
            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="w-full text-sm bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none"
            >
              <option value="all">Any Length</option>
              <option value="under_1">Under 1 year</option>
              <option value="1_to_3">1 to 3 years</option>
              <option value="3_plus">3+ years</option>
            </select>
          </div>
        </div>
      </div>

      {/* Opportunity Grid */}
      <div className="text-xs font-medium text-slate-500">
        Showing {filteredOpportunities.length} opportunities
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredOpportunities.map((opp) => {
          const minReturn = (opp.expected_return_min_bps / 100).toFixed(1);
          const maxReturn = (opp.expected_return_max_bps / 100).toFixed(1);
          const percentRaised = Math.min(100, Math.round((opp.raised_pence / opp.target_pence) * 100));

          const statusStyles: Record<string, string> = {
            open: 'bg-emerald-50 text-emerald-800 border-emerald-200',
            funded: 'bg-blue-50 text-blue-800 border-blue-200',
            repaying: 'bg-indigo-50 text-indigo-800 border-indigo-200',
            completed: 'bg-stone-100 text-stone-700 border-stone-200',
            defaulted: 'bg-rose-50 text-rose-800 border-rose-200',
          };

          return (
            <Link
              key={opp.id}
              href={`/opportunities/${opp.id}`}
              className="group bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-600 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <RiskTierBadge tier={opp.risk_tier} size="sm" />
                  <span
                    className={`text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                      statusStyles[opp.status] || 'bg-stone-50 text-slate-700'
                    }`}
                  >
                    {opp.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-base text-slate-900 group-hover:text-emerald-800 transition line-clamp-1">
                    {opp.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-medium mt-1">
                    <User className="w-3.5 h-3.5 text-emerald-700" />
                    <span className="line-clamp-1">Pitched by: {opp.partner_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[10px] font-semibold text-slate-600">
                      {opp.sector}
                    </span>
                    {opp.partner_location && (
                      <span className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{opp.partner_location}</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {opp.summary}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 mt-4 space-y-3">
                {/* Expected Return Range */}
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-500">Expected return:</span>
                  <span className="text-xs font-semibold text-slate-800">
                    {minReturn}%–{maxReturn}% a year, <span className="font-normal text-slate-500">not guaranteed</span>
                  </span>
                </div>

                {/* Term and Min */}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {opp.term_months} months
                  </span>
                  <span>Min £10</span>
                </div>

                {/* Funding Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>£{(opp.raised_pence / 100).toLocaleString('en-GB')} raised</span>
                    <span>{percentRaised}% of £{(opp.target_pence / 100).toLocaleString('en-GB')}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-stone-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        opp.status === 'defaulted'
                          ? 'bg-rose-500'
                          : opp.status === 'completed'
                          ? 'bg-stone-400'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${percentRaised}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
