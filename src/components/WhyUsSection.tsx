'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

export function WhyUsSection() {
  return (
    <section className="bg-[#062c1e]/90 backdrop-blur-xl rounded-3xl border border-emerald-500/25 p-6 sm:p-8 md:p-10 shadow-xl space-y-8 text-white">
      {/* Header */}
      <div className="space-y-2 text-center md:text-left max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-400/30">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Marketplace Model</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Why Atlas?
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-emerald-100/90 leading-relaxed">
          Unlocking access to productive UK property renovations and clean infrastructure loans for
          everyday investors, while providing reliable funding for creditworthy project owners.
        </p>
      </div>

      {/* Two Sides of the Marketplace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Everyday Investors */}
        <div className="bg-[#031c13] rounded-2xl border border-emerald-500/30 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-xl">
              👤
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              For Everyday Investors
            </span>
            <h3 className="text-lg font-bold text-white">
              Direct Access to Tangible Loan Assets
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Private commercial loans and property conversions historically required £50k–£100k+
              minimum commitments. Atlas allows everyday investors to participate in vetted syndicates
              starting from £10 up to the £1,000 platform limit per project.
            </p>
          </div>

          <div className="pt-3 border-t border-emerald-500/20 space-y-1.5 text-xs text-emerald-100">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Participate from £10 up to the £1,000 platform limit per project.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>Receive scheduled monthly capital and interest payments as borrowers repay.</span>
            </div>
          </div>
        </div>

        {/* Card 2: Project Owners & Borrowers */}
        <div className="bg-[#031c13] rounded-2xl border border-emerald-500/30 p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-xl">
              💡
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider block">
              For Project Owners & Borrowers
            </span>
            <h3 className="text-lg font-bold text-white">
              Transparent, Merit-Based Financing
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Entrepreneurs with viable, revenue-generating commercial projects can pitch directly to
              our community. Once independent surveyors, accountants, and solicitors verify your project,
              you raise funding once your project passes our review.
            </p>
          </div>

          <div className="pt-3 border-t border-emerald-500/20 space-y-1.5 text-xs text-emerald-100">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <span>Raise funding once your project passes our independent review.</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
              <span>Repay monthly from actual residential rents or commercial energy revenue.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison: Traditional Private Lending vs. Atlas */}
      <div className="bg-[#031811] rounded-2xl border border-emerald-500/30 p-5 sm:p-6 space-y-4">
        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Fair & Balanced Comparison
          </span>
          <h3 className="text-lg md:text-xl font-bold text-white">
            Traditional Private Lending vs. Atlas Crowd Syndicates
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-emerald-500/20 text-emerald-300/80">
                <th className="py-2.5 px-3 font-semibold">Factor</th>
                <th className="py-2.5 px-3 font-semibold">Traditional Private Lending / Development Finance</th>
                <th className="py-2.5 px-3 font-semibold text-emerald-300">Atlas Crowd Syndicates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/15 text-emerald-100">
              <tr>
                <td className="py-2.5 px-3 font-bold text-white">Minimum Investment</td>
                <td className="py-2.5 px-3 text-slate-300">Typically £50,000 – £100,000+</td>
                <td className="py-2.5 px-3 font-bold text-emerald-300">From £10 (up to £1,000 platform limit)</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-white">Investor Eligibility</td>
                <td className="py-2.5 px-3 text-slate-300">Institutional lenders & high-net-worth investors</td>
                <td className="py-2.5 px-3 font-bold text-emerald-300">Everyday investors after onboarding checks</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-white">Liquidity & Early Exit</td>
                <td className="py-2.5 px-3 text-slate-300">Capital locked for loan duration</td>
                <td className="py-2.5 px-3 text-amber-200">Your money is tied up for the full loan term and may not be easy to withdraw early</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-white">Asset Security</td>
                <td className="py-2.5 px-3 text-slate-300">First legal charge or debenture</td>
                <td className="py-2.5 px-3 font-bold text-emerald-300">First legal charge or debenture registered at Companies House</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-white">Provision Fund Support</td>
                <td className="py-2.5 px-3 text-slate-300">None</td>
                <td className="py-2.5 px-3 font-bold text-emerald-300">Discretionary Provision Fund (1% of every raise; not a guarantee)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
