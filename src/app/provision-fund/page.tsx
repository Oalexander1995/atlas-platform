import React from 'react';
import { getProvisionFundStatus } from '@/lib/ledger';
import { ShieldCheck, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Provision Fund — Atlas Micro-Investing',
  description: 'Discretionary community reserve fund protecting Low, Medium, and High tier micro-investments.',
};

export default async function ProvisionFundPage() {
  const status = await getProvisionFundStatus();

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Honesty Statement Banner (Section 3.8 AC) */}
      <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-6 md:p-8 space-y-3">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-sm uppercase tracking-wide">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>Important Regulatory Honesty Statement</span>
        </div>
        <p className="text-amber-950 font-medium text-base md:text-lg leading-relaxed">
          The Provision Fund is a discretionary reserve fund. It is not an insurance policy or a
          guarantee. If multiple businesses fail, the fund could run out of money and you could
          lose some or all of your investment.
        </p>
        <p className="text-amber-800 text-xs md:text-sm">
          Unlike bank savings, peer-to-peer micro-investments are not covered by the Financial
          Services Compensation Scheme (FSCS).
        </p>
      </div>

      {/* Main Title & Overview */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Community Reserve Pool</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold text-slate-900 tracking-tight">
          Atlas Provision Fund
        </h1>
        <p className="text-slate-600 text-sm md:text-base leading-relaxed">
          Think of this like a community umbrella. Every time a business loan is funded, 1% is
          placed into this reserve fund. If an eligible business has trouble paying, the fund can
          help cushion investor losses where possible.
        </p>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-stone-100">
          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Reserve Fund Balance
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              £{(status.balancePence / 100).toFixed(2)}
            </p>
            <span className="text-[11px] text-slate-400">Held in dedicated ledger account</span>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Protected Capital
            </span>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              £{(status.outstandingCapitalPence / 100).toFixed(2)}
            </p>
            <span className="text-[11px] text-slate-400">Low, Med & High active loans</span>
          </div>

          <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
              Coverage Ratio
            </span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {status.coverageRatioPercent}%
            </p>
            <span className="text-[11px] text-slate-400">Fund ÷ Outstanding capital</span>
          </div>
        </div>
      </div>

      {/* Rules in Simple English */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>What IS Covered</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Loans in the <strong>Low</strong>, <strong>Medium</strong>, and <strong>High</strong> risk
            tiers. If a vetted borrower defaults, the fund can be used at discretion to refund
            unrecovered capital up to the user\'s outstanding principal.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-rose-700 font-semibold text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>What IS NOT Covered</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            <strong>Uncharted tier</strong> holdings are experimental and are <strong>strictly never covered</strong>.
            Lost expected interest is also not covered — the fund only assists with original capital.
          </p>
        </div>
      </div>

      {/* Payout History Table */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Historical Payout Ledger</h2>
          <span className="text-xs text-slate-400">All payouts are public & auditable</span>
        </div>

        {status.payouts.length === 0 ? (
          <div className="bg-stone-50 rounded-2xl p-6 text-center text-xs text-slate-500 border border-stone-100">
            No payouts have occurred. All active loans are currently performing to schedule.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-stone-200 text-slate-500">
                <tr>
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Opportunity</th>
                  <th className="pb-2">Reason</th>
                  <th className="pb-2 text-right">Amount Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {status.payouts.map((p) => (
                  <tr key={p.id}>
                    <td className="py-2.5 text-slate-600">
                      {new Date(p.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="py-2.5 font-medium text-slate-900">{p.opportunityTitle}</td>
                    <td className="py-2.5 text-slate-500">{p.payoutReason}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-900">
                      £{(p.amountPence / 100).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Back to Explore / Home */}
      <div className="text-center pt-2">
        <Link
          href="/explore"
          className="inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 transition shadow-sm"
        >
          Explore Available Opportunities
        </Link>
      </div>
    </div>
  );
}
