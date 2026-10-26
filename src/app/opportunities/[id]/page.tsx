import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getOpportunityById } from '@/lib/opportunities';
import { ensureOpportunitiesSeeded } from '@/lib/seed';
import { RiskWarningBanner } from '@/components/RiskWarningBanner';
import { RiskTierBadge } from '@/components/RiskTierBadge';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  TrendingUp,
  HelpCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OpportunityDetailPage({
  params,
}: {
  params: { id: string };
}) {
  await ensureOpportunitiesSeeded();
  const { opportunity, repayments } = await getOpportunityById(params.id);

  if (!opportunity) {
    notFound();
  }

  const minReturn = (opportunity.expected_return_min_bps / 100).toFixed(1);
  const maxReturn = (opportunity.expected_return_max_bps / 100).toFixed(1);
  const percentRaised = Math.min(100, Math.round((opportunity.raised_pence / opportunity.target_pence) * 100));

  // "Example: if you invest £100" calculations (Section 5.7)
  const expectedReturnPounds = (100 * (opportunity.expected_return_min_bps / 10000) * (opportunity.term_months / 12)).toFixed(2);
  const totalExpectedPounds = (100 + parseFloat(expectedReturnPounds)).toFixed(2);

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Back button */}
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all opportunities
        </Link>
      </div>

      {/* Prominent Statutory Section 3.1 Risk Warning */}
      <RiskWarningBanner />

      {/* Hero Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RiskTierBadge tier={opportunity.risk_tier} size="md" />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-stone-100 text-slate-700 uppercase">
              {opportunity.status}
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">ID: {opportunity.id.slice(0, 8)}</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
            {opportunity.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-500">
            <span className="flex items-center gap-1.5 text-slate-700 font-medium">
              <Building2 className="w-4 h-4 text-emerald-700" />
              {opportunity.partner_name}
            </span>
            {opportunity.partner_location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {opportunity.partner_location}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {opportunity.term_months} month term
            </span>
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
          <div>
            <div className="text-xs text-slate-500">Target</div>
            <div className="text-base md:text-lg font-bold text-slate-900">
              £{(opportunity.target_pence / 100).toLocaleString('en-GB')}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Expected return</div>
            <div className="text-base md:text-lg font-bold text-slate-900">
              {minReturn}%–{maxReturn}% <span className="text-xs font-normal text-slate-500">/ yr, not guaranteed</span>
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Loan term</div>
            <div className="text-base md:text-lg font-bold text-slate-900">
              {opportunity.term_months} months
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Individual cap</div>
            <div className="text-base md:text-lg font-bold text-slate-900">
              £{(opportunity.per_user_cap_pence / 100).toLocaleString('en-GB')}
            </div>
          </div>
        </div>

        {/* Funding Progress & Call to Action */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>£{(opportunity.raised_pence / 100).toLocaleString('en-GB')} raised</span>
            <span>{percentRaised}% of goal</span>
          </div>
          <div className="w-full h-2 rounded-full bg-stone-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${percentRaised}%` }}
            />
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <Link
              href={`/invest/${opportunity.id}`}
              className={`w-full sm:w-auto px-8 py-3 rounded-xl font-semibold text-sm transition text-center shadow-sm ${
                opportunity.status === 'open'
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                  : 'bg-stone-200 text-stone-500 cursor-not-allowed pointer-events-none'
              }`}
            >
              {opportunity.status === 'open' ? 'Invest from £10' : `Opportunity is ${opportunity.status}`}
            </Link>
            <span className="text-xs text-slate-400">
              Minimum £10. Maximum £{(opportunity.per_user_cap_pence / 100).toLocaleString('en-GB')} for this opportunity.
            </span>
          </div>
        </div>
      </div>

      {/* Section: "Example: if you invest £100" (Section 5.7) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-700" />
          <h2 className="text-lg font-bold text-slate-900">
            Example: If you invest £100
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          This simple comparison shows what might happen in three different scenarios over the {opportunity.term_months}-month term.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Expected Outcome */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Expected outcome
            </div>
            <div className="text-2xl font-bold text-emerald-950">£{totalExpectedPounds}</div>
            <p className="text-xs text-emerald-900 leading-relaxed">
              You get back your £100 plus approximately £{expectedReturnPounds} in interest over {opportunity.term_months} months (<span className="italic">not guaranteed</span>).
            </p>
          </div>

          {/* Poor Outcome */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-800">
              Poor outcome
            </div>
            <div className="text-2xl font-bold text-amber-950">£40.00 – £80.00</div>
            <p className="text-xs text-amber-900 leading-relaxed">
              If the borrower encounters difficult trading conditions and misses several repayments, you may receive only part of your money back.
            </p>
          </div>

          {/* Worst Case */}
          <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Worst case
            </div>
            <div className="text-2xl font-bold text-rose-950">£0.00</div>
            <p className="text-xs text-rose-900 leading-relaxed">
              The borrower goes out of business and cannot repay. You lose all £100 you invested.
            </p>
          </div>
        </div>
      </div>

      {/* Section: Overview & How the money will be used */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">How the money will be used</h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          {opportunity.description}
        </p>
      </div>

      {/* Section: Who you're investing with */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-emerald-700" />
          <h2 className="text-lg font-bold text-slate-900">Project Creator & Sponsor</h2>
        </div>
        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <strong>{opportunity.partner_name}</strong> is the project creator pitching this opportunity on Atlas.
          </p>
          <p className="text-slate-600 leading-relaxed">{opportunity.partner_description}</p>
        </div>
      </div>

      {/* Section: What could go wrong (At least 3 specific risks) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-bold">What could go wrong (Key risks)</h2>
        </div>
        <p className="text-xs text-slate-500">
          We believe in complete honesty. Here are the 3 main things that could cause delays or losses on this loan:
        </p>

        <div className="space-y-3 pt-1">
          {opportunity.key_risks.map((risk, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-50/40 border border-amber-200 text-xs md:text-sm text-slate-800"
            >
              <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                {index + 1}
              </span>
              <span>{risk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section: How we vetted it (Checklist with dates) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <ShieldCheck className="w-5 h-5 text-emerald-700" />
          <h2 className="text-lg font-bold">How we vetted this opportunity</h2>
        </div>
        <p className="text-xs text-slate-500">
          Every loan published on Atlas goes through our 4-step diligence check.
        </p>

        <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl overflow-hidden">
          {opportunity.vetting_checklist.map((item, index) => (
            <div key={index} className="p-4 flex items-center justify-between text-xs md:text-sm">
              <span className="font-medium text-slate-800">{item.item}</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5 text-xs">
                Verified on {item.verified_date}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Section: How and when you get paid back (Repayment schedule) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-900">
          <Calendar className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-bold">How and when you get paid back</h2>
        </div>
        <p className="text-xs text-slate-500">
          Repayments are made monthly. Each payment includes a slice of the original loan (capital) and interest.
        </p>

        <div className="overflow-x-auto border border-stone-200 rounded-2xl">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-stone-50 border-b border-stone-200 text-slate-500">
              <tr>
                <th className="p-3 font-semibold">Due Date</th>
                <th className="p-3 font-semibold">Total Capital</th>
                <th className="p-3 font-semibold">Total Interest</th>
                <th className="p-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-slate-700">
              {repayments.slice(0, 6).map((r) => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="p-3">{r.due_date}</td>
                  <td className="p-3 font-mono">£{(r.capital_pence / 100).toFixed(2)}</td>
                  <td className="p-3 font-mono">£{(r.interest_pence / 100).toFixed(2)}</td>
                  <td className="p-3">
                    <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-slate-700">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section: Documents & Updates */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Documents */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
            <FileText className="w-4 h-4 text-slate-600" />
            <h3>Key Documents</h3>
          </div>
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <span>Loan Agreement & Terms (PDF)</span>
              <span className="text-emerald-700 font-semibold cursor-pointer">View</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
              <span>Equipment Invoice & Valuation (PDF)</span>
              <span className="text-emerald-700 font-semibold cursor-pointer">View</span>
            </div>
          </div>
        </div>

        {/* Updates */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
          <h3 className="font-bold text-slate-900 text-base">Progress Updates</h3>
          <div className="space-y-2 text-xs">
            {opportunity.updates.map((u, i) => (
              <div key={i} className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1">
                <div className="flex items-center justify-between font-semibold text-slate-800">
                  <span>{u.title}</span>
                  <span className="text-slate-400 font-normal">{u.date}</span>
                </div>
                <p className="text-slate-600">{u.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
