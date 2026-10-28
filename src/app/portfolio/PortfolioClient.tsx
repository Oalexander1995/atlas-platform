'use client';

import React from 'react';
import Link from 'next/link';
import { RiskTierBadge } from '@/components/RiskTierBadge';
import { PortfolioSummary } from '@/lib/portfolio';
import { OnboardingProgressCard, OnboardingStatusProps } from '@/components/OnboardingProgressCard';
import {
  Download,
  Building2,
  TrendingUp,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';

export function PortfolioClient({
  portfolio,
  onboardingStatus,
}: {
  portfolio: PortfolioSummary;
  onboardingStatus?: OnboardingStatusProps;
}) {
  const totalOutstandingPounds = (portfolio.currentlyOutstandingPence / 100).toFixed(2);
  const totalInvestedPounds = (portfolio.totalInvestedPence / 100).toFixed(2);
  const totalReceivedPounds = (portfolio.totalReceivedBackPence / 100).toFixed(2);
  const expectedReturnsPounds = (portfolio.expectedFutureReturnsPence / 100).toFixed(2);
  const totalLossesPounds = (portfolio.totalLossesPence / 100).toFixed(2);
  const totalPayoutsPounds = (portfolio.totalProvisionPayoutsPence / 100).toFixed(2);

  // Percentages for risk tier breakdown
  const totalForTiers = Math.max(1, portfolio.currentlyOutstandingPence);
  const lowPct = Math.round((portfolio.tierBreakdown.low / totalForTiers) * 100);
  const medPct = Math.round((portfolio.tierBreakdown.medium / totalForTiers) * 100);
  const highPct = Math.round((portfolio.tierBreakdown.high / totalForTiers) * 100);
  const unchartedPct = Math.round((portfolio.tierBreakdown.uncharted / totalForTiers) * 100);

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Header with Download Statement */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
            My Portfolio
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Track your individual loan slices, repayments, and risk breakdown.
          </p>
        </div>

        <a
          href="/api/v1/portfolio/statement.csv"
          download
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-slate-700 transition shadow-sm self-start"
        >
          <Download className="w-4 h-4 text-slate-500" />
          Download Statement (CSV)
        </a>
      </div>

      {onboardingStatus && <OnboardingProgressCard status={onboardingStatus} />}

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase text-slate-400">Total Outstanding</div>
          <div className="text-2xl md:text-3xl font-bold text-slate-900">
            £{totalOutstandingPounds}
          </div>
          <div className="text-[11px] text-slate-400">Active principal working</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase text-slate-400">Received Back</div>
          <div className="text-2xl md:text-3xl font-bold text-emerald-800">
            £{totalReceivedPounds}
          </div>
          <div className="text-[11px] text-slate-400">Capital + interest repaid</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase text-slate-400">Expected Future Interest</div>
          <div className="text-2xl md:text-3xl font-bold text-slate-700">
            ~£{expectedReturnsPounds}
          </div>
          <div className="text-[11px] text-slate-400 italic">Not guaranteed</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
          <div className="text-xs font-semibold uppercase text-slate-400">Total Losses</div>
          <div className="text-2xl md:text-3xl font-bold text-rose-800">
            £{totalLossesPounds}
          </div>
          <div className="text-[11px] text-slate-400">
            {portfolio.totalProvisionPayoutsPence > 0
              ? `£${totalPayoutsPounds} covered by Provision Fund`
              : 'Written off from defaults'}
          </div>
        </div>
      </div>

      {/* Risk Tier Diversification Breakdown (Section 5.10) */}
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Portfolio Breakdown by Risk Tier</h2>
            <p className="text-xs text-slate-500">
              Diversifying across tiers balances potential return against capital risk.
            </p>
          </div>
        </div>

        {/* Visual Multi-Segment Bar */}
        <div className="w-full h-3 rounded-full bg-stone-100 overflow-hidden flex">
          {lowPct > 0 && <div className="bg-teal-500 h-full" style={{ width: `${lowPct}%` }} title={`Low: ${lowPct}%`} />}
          {medPct > 0 && <div className="bg-amber-500 h-full" style={{ width: `${medPct}%` }} title={`Medium: ${medPct}%`} />}
          {highPct > 0 && <div className="bg-orange-500 h-full" style={{ width: `${highPct}%` }} title={`High: ${highPct}%`} />}
          {unchartedPct > 0 && <div className="bg-purple-600 h-full" style={{ width: `${unchartedPct}%` }} title={`Uncharted: ${unchartedPct}%`} />}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-teal-500" />
            <span className="text-slate-600">Low: £{(portfolio.tierBreakdown.low / 100).toFixed(2)} ({lowPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-slate-600">Medium: £{(portfolio.tierBreakdown.medium / 100).toFixed(2)} ({medPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-slate-600">High: £{(portfolio.tierBreakdown.high / 100).toFixed(2)} ({highPct}%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-purple-600" />
            <span className="text-slate-600">Uncharted: £{(portfolio.tierBreakdown.uncharted / 100).toFixed(2)} ({unchartedPct}%)</span>
          </div>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-base">
            Individual Holdings ({portfolio.holdings.length})
          </h2>
          <span className="text-xs text-slate-400">Direct individual ownership</span>
        </div>

        {portfolio.holdings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-stone-100 text-slate-400 flex items-center justify-center mx-auto">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-800">No active investments yet</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven&apos;t made any loans yet. Browse open opportunities to start from £10.
            </p>
            <Link
              href="/explore"
              className="inline-block px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition"
            >
              Browse Opportunities
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-slate-500">
                <tr>
                  <th className="p-4 font-semibold">Opportunity & Partner</th>
                  <th className="p-4 font-semibold">Risk Tier</th>
                  <th className="p-4 font-semibold">Principal</th>
                  <th className="p-4 font-semibold">Loan Status</th>
                  <th className="p-4 font-semibold">Repayments</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-slate-700">
                {portfolio.holdings.map((h) => {
                  const isDefaulted = h.opportunityStatus === 'defaulted' || h.status === 'defaulted';

                  return (
                    <tr key={h.id} className="hover:bg-stone-50 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{h.opportunityTitle}</div>
                        <div className="text-xs text-slate-400">{h.partnerName}</div>
                      </td>
                      <td className="p-4">
                        <RiskTierBadge tier={h.riskTier} size="sm" />
                      </td>
                      <td className="p-4 font-bold text-slate-900 font-mono">
                        £{(h.principalPence / 100).toFixed(2)}
                      </td>
                      <td className="p-4">
                        {isDefaulted ? (
                          <div className="space-y-1">
                            <span className="font-semibold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-full text-xs">
                              Defaulted
                            </span>
                            <div className="text-[11px] text-rose-700 leading-snug">
                              Borrower was unable to repay.
                              {h.provisionPayoutPence && h.provisionPayoutPence > 0 ? (
                                <span> Provision Fund paid £{(h.provisionPayoutPence / 100).toFixed(2)}.</span>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-slate-800">
                            {h.opportunityStatus}
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-xs">
                          £{(h.repaymentsReceivedPence / 100).toFixed(2)} received
                        </div>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/opportunities/${h.opportunityId}`}
                          className="text-emerald-800 hover:text-emerald-950 font-semibold text-xs flex items-center gap-1"
                        >
                          View Loan
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
