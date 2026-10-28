import React from 'react';
import Link from 'next/link';
import { ShieldAlert, AlertTriangle, Lock, Layers, HelpCircle, ArrowLeft } from 'lucide-react';

export default function RiskSummaryPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <div>
        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Explore
        </Link>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Understanding the Risks of Investing
        </h1>
        <p className="text-base text-slate-600 mt-2">
          Read this 2-minute guide before putting any money to work. We explain everything in simple, plain English.
        </p>
      </div>

      {/* Main Statutory Warning Box */}
      <div className="bg-amber-500 text-slate-950 p-6 rounded-2xl shadow-sm border border-amber-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-lg">
          <AlertTriangle className="w-5 h-5 text-slate-950 flex-shrink-0" />
          <span>Capital at Risk</span>
        </div>
        <p className="text-sm md:text-base font-medium leading-relaxed">
          Don&apos;t invest unless you&apos;re prepared to lose all the money you invest. This is a high-risk investment and you are unlikely to be protected if something goes wrong.
        </p>
      </div>

      {/* The 5 Key Things to Know in Plain English */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2>1. You could lose some or all of your money</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            When you invest on Atlas, you are lending money to small businesses. If a business struggles, closes down, or cannot repay what it borrowed, you could lose part or all of the money you lent them.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg">
            <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center text-sky-800">
              <Lock className="w-5 h-5" />
            </div>
            <h2>2. You cannot get your money back anytime you want</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Unlike a normal bank savings account, you cannot simply withdraw your investment whenever you want. Your money stays with the business for the agreed time (usually 6 to 36 months) while they repay it month by month.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800">
              <Layers className="w-5 h-5" />
            </div>
            <h2>3. Spreading money reduces impact, but does not remove risk</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Spreading money across several projects can reduce the impact if one fails, but does not remove the risk of loss. Putting all your money into a single business carries significant exposure. Spreading £10 slices across multiple vetted opportunities helps distribute risk, though all investments remain at risk.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg">
            <div className="w-9 h-9 rounded-xl bg-orange-100 flex items-center justify-center text-orange-800">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h2>4. The Provision Fund is not a guarantee</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            The Provision Fund is discretionary. It may not cover all losses, or any losses. It is not a guarantee and is not protected by the FSCS. It is a shared pot that Atlas may choose to use to help soften losses, but you should never rely on it.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3 text-slate-900 font-semibold text-lg">
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-800">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h2>5. FSCS protection does not cover poor performance</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Investments on Atlas are not protected by the Financial Services Compensation Scheme (FSCS) if the investment performs badly or the borrower fails to repay.
          </p>
        </div>
      </div>

      <div className="p-6 rounded-2xl bg-stone-100 border border-stone-200 text-center space-y-3">
        <h3 className="font-semibold text-slate-900">Ready to explore vetted businesses?</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Take your time, read through the details, and remember you can test everything with demo money first.
        </p>
        <Link
          href="/explore"
          className="inline-block px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition"
        >
          View Opportunities
        </Link>
      </div>
    </div>
  );
}
