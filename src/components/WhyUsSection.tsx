'use client';

import React from 'react';
import Link from 'next/link';
import {
  Users,
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  Coins,
} from 'lucide-react';

export function WhyUsSection() {
  return (
    <section className="bg-[#062c1e]/90 backdrop-blur-xl rounded-3xl border border-emerald-500/25 p-6 sm:p-8 md:p-10 shadow-xl space-y-10 text-white">
      {/* Header */}
      <div className="space-y-3 text-center md:text-left max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-400/15 text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-400/30">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Why Us — The New Standard</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white leading-tight">
          Why Atlas? Big Investments, <span className="text-emerald-400">Small Barriers.</span>
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-emerald-100/90 leading-relaxed">
          Atlas is an example platform demonstrating what modern investing could look like: unlocking
          deals for the <strong>average Joe</strong> who wants to grow their wealth, while offering
          entrepreneurs who were <strong>turned down by traditional banks</strong> the funding they deserve.
        </p>
      </div>

      {/* Two Sides of the Marketplace */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: The Average Joe */}
        <div className="bg-[#031c13] rounded-2xl border border-emerald-500/30 p-6 md:p-7 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-2xl">
              👤
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider block">
              For The Everyday Micro-Investor
            </span>
            <h3 className="text-xl font-bold text-white">
              Access Deals You’d Never Normally Get
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              In the old system, high-return property conversions, solar farms, and commercial equipment
              deals were locked away behind £100k+ minimum investment barriers—reserved exclusively for
              multi-millionaires and institutional funds.
            </p>
          </div>

          <div className="pt-4 border-t border-emerald-500/20 space-y-2">
            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
              How Atlas Changes It:
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-100">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Start micro-investing with as little as <strong>£10 up to £1,000</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>1,000 everyday people pool together to fund £1,000,000 projects.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>Earn regular monthly capital + interest payouts directly into your wallet.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Card 2: The Project Creator */}
        <div className="bg-[#031c13] rounded-2xl border border-emerald-500/30 p-6 md:p-7 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-2xl">
              💡
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider block">
              For Project Owners & Borrowers
            </span>
            <h3 className="text-xl font-bold text-white">
              Couldn’t Get a Bank Loan? Get Funded Here.
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Traditional high-street banks are slow, bureaucratic, and reject viable local projects
              or demand punitive rates and personal asset guarantees. Quality projects often get
              abandoned simply because bank algorithms say &quot;no&quot;.
            </p>
          </div>

          <div className="pt-4 border-t border-emerald-500/20 space-y-2">
            <div className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
              How Atlas Changes It:
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-100">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <span>Pitch your project directly to a passionate community of co-investors.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <span>If independent experts verify your project, raise up to £1,000,000 in days.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-300 flex-shrink-0 mt-0.5" />
                <span>Repay investors monthly from your project’s actual rental or commercial income.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Comparison: Traditional Finance vs Atlas */}
      <div className="bg-[#031811] rounded-2xl border border-emerald-500/30 p-6 md:p-8 space-y-5">
        <div className="text-center md:text-left space-y-1">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Side-By-Side Comparison
          </span>
          <h3 className="text-xl md:text-2xl font-bold text-white">
            Traditional Finance vs. Atlas Crowd Syndicates
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-emerald-500/20 text-emerald-300/80">
                <th className="py-3 px-3 font-semibold">Feature</th>
                <th className="py-3 px-3 font-semibold">Traditional High-Street Finance</th>
                <th className="py-3 px-3 font-semibold text-emerald-300">Atlas Crowd Syndicates</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-500/15 text-emerald-100">
              <tr>
                <td className="py-3 px-3 font-bold text-white">Minimum Investment</td>
                <td className="py-3 px-3 text-rose-300">£100,000+ (High barriers)</td>
                <td className="py-3 px-3 font-bold text-emerald-300">From £10 (Small barriers)</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-white">Who Can Invest?</td>
                <td className="py-3 px-3 text-rose-300">Only ultra-wealthy & banks</td>
                <td className="py-3 px-3 font-bold text-emerald-300">The Average Joe & everyday households</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-white">Borrower Funding</td>
                <td className="py-3 px-3 text-rose-300">Months of red tape, frequent rejections</td>
                <td className="py-3 px-3 font-bold text-emerald-300">Fast community crowd raise upon expert vetting</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-white">Asset Backing</td>
                <td className="py-3 px-3 text-emerald-200/70">Opaque funds or volatile paper</td>
                <td className="py-3 px-3 font-bold text-emerald-300">Tangible assets: property rents, solar PPAs, EV chargers</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-white">Transparency</td>
                <td className="py-3 px-3 text-rose-300">Hidden fees, broker cuts, opaque decisions</td>
                <td className="py-3 px-3 font-bold text-emerald-300">100% transparent double-entry ledger & public checklist</td>
              </tr>
              <tr>
                <td className="py-3 px-3 font-bold text-white">Safety Cushion</td>
                <td className="py-3 px-3 text-emerald-200/70">None for commercial syndicated loans</td>
                <td className="py-3 px-3 font-bold text-emerald-300">Discretionary Provision Fund public reserve</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
