import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldAlert, FileText, CheckCircle2, Scale, Clock, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Terms of Use — Atlas Micro-Investing',
  description: 'Terms of service and platform rules for the Atlas micro-investing demo.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <FileText className="w-4 h-4 text-slate-500" />
          <span>Terms of Use (Demo Build)</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          Atlas Platform Terms of Use
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Last updated: October 2026. Written in plain English so everyone can understand how our
          rules protect you and how our platform operates.
        </p>

        {/* Section 0 Important Notice */}
        <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <p className="font-bold">Simulated Money Notice (Section 0 Non-Negotiable)</p>
            <p className="mt-0.5">
              Atlas is currently operating as an interactive prototype with simulated money. No
              real bank transfers, card debits, or actual investments take place. These terms
              describe the operating rules and legal model of the platform.
            </p>
          </div>
        </div>
      </div>

      {/* Terms Sections */}
      <div className="space-y-6">
        {/* Section 1 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-900">About Atlas & Who We Are</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            Atlas is an electronic peer-to-peer lending and micro-investing platform. We connect UK
            small businesses looking for expansion loans with everyday people who wish to lend small
            amounts starting from £10. Atlas does not provide personal financial advice. All
            information provided on the platform, including from our AI Educational Coach, is for
            educational guidance only.
          </p>
        </section>

        {/* Section 2 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-900">Investor Eligibility & Onboarding</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            To open an account and invest with Atlas, you must:
          </p>
          <ul className="text-xs md:text-sm text-slate-700 space-y-2 list-disc list-inside pl-2">
            <li>Be at least 18 years old and a resident of the United Kingdom.</li>
            <li>Pass our identity and address verification check (simulated in this demo).</li>
            <li>Complete our investor appropriateness questionnaire to ensure you understand key investment concepts.</li>
            <li>Complete a mandatory 24-hour cooling-off pause before your very first investment.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="text-lg font-bold text-slate-900">Capital at Risk & No Guarantees</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            When you invest in a business loan through Atlas:
          </p>
          <ul className="text-xs md:text-sm text-slate-700 space-y-2 list-disc list-inside pl-2">
            <li>
              <strong>Your capital is at risk.</strong> Returns are not guaranteed, and you may lose
              some or all of the money you invest if a borrower defaults or ceases trading.
            </li>
            <li>
              <strong>Past performance is not a reliable indicator</strong> of future results.
            </li>
            <li>
              <strong>No FSCS protection for loan defaults:</strong> Uninvested cash in your wallet
              is covered by the Financial Services Compensation Scheme (up to £85,000) against bank
              failure, but active loans are investments and are NOT covered by the FSCS.
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              4
            </span>
            <h2 className="text-lg font-bold text-slate-900">Investment Limits & Diversification</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            To prevent overexposure and protect your financial health, our system strictly enforces
            server-side limits:
          </p>
          <ul className="text-xs md:text-sm text-slate-700 space-y-2 list-disc list-inside pl-2">
            <li>Minimum investment: £10 per business.</li>
            <li>Maximum single investment: £1,000 for standard tiers (Low, Medium, High).</li>
            <li>Maximum single investment: £100 for Uncharted tier opportunities.</li>
            <li>Rolling 12-month platform cap: £5,000 total investments across all opportunities.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              5
            </span>
            <h2 className="text-lg font-bold text-slate-900">The Provision Fund Rules</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            Atlas maintains a Provision Fund funded by a 1% fee contributed by borrowers upon loan
            disbursement. The Provision Fund is designed to cushion investors against borrower
            defaults on Low, Medium, and High tier loans. However:
          </p>
          <ul className="text-xs md:text-sm text-slate-700 space-y-2 list-disc list-inside pl-2">
            <li>The Provision Fund is entirely discretionary and is not an insurance policy.</li>
            <li>Payouts are not guaranteed and depend on available reserves.</li>
            <li>Uncharted tier loans are strictly excluded from Provision Fund assistance.</li>
          </ul>
        </section>

        {/* Section 6 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              6
            </span>
            <h2 className="text-lg font-bold text-slate-900">Fees and Charges</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            Atlas is free for everyday investors. You pay 0% fees to deposit money, make investments,
            or withdraw money. Atlas charges a 2% origination fee to businesses when a loan is
            successfully funded to cover underwriting, platform operations, and compliance.
          </p>
        </section>

        {/* Section 7 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              7
            </span>
            <h2 className="text-lg font-bold text-slate-900">Atlas Points & Prize Draw Rules</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            Atlas Points are awarded exclusively for educational actions such as completing lessons,
            taking quizzes, and running simulations. In accordance with UK regulatory guidelines,
            points can NEVER be awarded for depositing, investing, or referring friends. Points have
            no cash surrender value. Prize draws are free to enter using points or via our free
            postal entry route with no purchase necessary.
          </p>
        </section>

        {/* Section 8 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              8
            </span>
            <h2 className="text-lg font-bold text-slate-900">Complaints and Governing Law</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            These terms are governed by the laws of England and Wales. If you have any complaint,
            please email complaints@atlas.demo. If we are unable to resolve your complaint within 8
            weeks, you have the right to escalate your dispute to the Financial Ombudsman Service
            (FOS) free of charge.
          </p>
        </section>
      </div>

      {/* Helpful links bar */}
      <div className="p-5 bg-stone-100 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="text-slate-600 font-medium">Have questions about these terms?</span>
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-emerald-700 font-semibold hover:underline">
            Visit Help Centre
          </Link>
          <Link href="/risk-summary" className="text-slate-700 font-semibold hover:underline">
            Read Risk Summary
          </Link>
        </div>
      </div>
    </div>
  );
}
