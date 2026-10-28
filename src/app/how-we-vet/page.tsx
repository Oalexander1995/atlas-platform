import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Search,
  FileCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Award,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'How We Vet Projects — Atlas Micro-Investing',
  description:
    'Our 4-stage independent diligence process by chartered surveyors, accountants, and solicitors. Less than 5% of projects pass.',
};

export default function HowWeVetPage() {
  const vettingSteps = [
    {
      step: '01',
      title: 'Identity & Director Background Checks',
      badge: 'Fraud & Sanctions Screening',
      icon: '🔍',
      desc: 'We verify the project owner and company directors through Companies House, anti-money laundering registries, and bankruptcy databases. We verify their past track record—confirming they have successfully built or managed similar projects before.',
      checklist: [
        'Companies House active registry & director identification',
        'Anti-fraud, insolvency & disqualification checks',
        'Verification of past borrowing history & on-time repayments',
      ],
    },
    {
      step: '02',
      title: 'Financial Audit & Cash Flow Stress-Test',
      badge: 'Accountant Review',
      icon: '📊',
      desc: 'Independent financial specialists review 12–24 months of bank statements, tax records, and revenue models. We run conservative stress-tests—modeling what happens if tenant vacancies rise or electricity prices drop—to ensure repayments remain viable.',
      checklist: [
        '12–24 months of business bank statements audited',
        'Debt-service coverage ratio (DSCR) stress-testing',
        'Worst-case financial resilience modelling',
      ],
    },
    {
      step: '03',
      title: 'Physical Site Visit & Technical Appraisal',
      badge: 'On-Site Surveyors',
      icon: '🏗️',
      desc: 'Our technical team and independent chartered surveyors physically visit the site. Whether it’s an apartment building in Manchester, a solar roof in Bristol, or diagnostic scanners for a clinic, we confirm the physical assets exist, are in good condition, and are properly valued.',
      checklist: [
        'Physical site inspection by chartered building surveyors',
        'Hardware serial number and manufacturer warranty checks',
        'Independent asset valuation and structural reports',
      ],
    },
    {
      step: '04',
      title: 'Legal Review & Repayment Contracts',
      badge: 'Commercial Solicitors',
      icon: '⚖️',
      desc: 'Commercial solicitors review the contracts that will generate the revenue—such as 15-year power purchase agreements, residential tenancy contracts, or NHS clinic equipment leases. We confirm all legal covenants and ring-fenced escrow mechanics before opening funding.',
      checklist: [
        'First legal charge or commercial debenture registered at Companies House',
        'Contractual lease and revenue agreement legal review',
        'Staged construction milestone escrow payment controls',
      ],
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-10 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Independent Diligence Standard</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
          How Every Project Is Vetted Before Acceptance
        </h1>
        <p className="text-sm md:text-base text-slate-600 max-w-3xl leading-relaxed">
          Before any project is accepted onto the Atlas platform, it must pass a rigorous,
          multi-stage independent review conducted by qualified third-party professionals:
          RICS-chartered surveyors, chartered accountants, and commercial solicitors.
        </p>

        {/* 5% Pass Rate Banner */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl flex-shrink-0">
              &lt;5%
            </div>
            <div>
              <span className="font-bold text-slate-900 text-sm block">Strict Acceptance Rate</span>
              <p className="text-xs text-slate-600">
                Fewer than 1 in 20 pitched projects pass all four stages of our independent diligence.
              </p>
            </div>
          </div>
          <Link
            href="/explore"
            className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl text-xs transition shadow-sm self-start sm:self-auto"
          >
            Browse Vetted Projects →
          </Link>
        </div>
      </div>

      {/* 4 Vetting Steps Detailed Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vettingSteps.map((step) => (
          <div
            key={step.step}
            className="bg-white rounded-3xl border border-stone-200 p-6 md:p-7 shadow-sm space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-2xl p-2.5 bg-stone-100 rounded-2xl border border-stone-200">
                  {step.icon}
                </span>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Stage {step.step} • {step.badge}
                </span>
              </div>

              <h2 className="text-lg md:text-xl font-bold text-slate-900 leading-snug">
                {step.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                {step.desc}
              </p>
            </div>

            <div className="pt-4 border-t border-stone-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Verification Checklist:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {step.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Security & Risk Reminder */}
      <div className="bg-stone-50 rounded-3xl border border-stone-200 p-6 md:p-8 space-y-4">
        <div className="flex items-center gap-2 text-slate-900 font-bold text-sm uppercase tracking-wide">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <span>Vetting Reduces Risk But Does Not Remove It</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
          While our 4-stage vetting process verifies that borrowers exist, assets are genuine, and
          financial projections are realistic, loan-based crowdfunding always carries investment risk.
          Unexpected economic shifts, tenant defaults, or equipment breakdowns can cause delays or losses.
          Spreading money across multiple projects reduces the impact of a single failure, but does not remove the risk of loss.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href="/risk-summary"
            className="px-5 py-2.5 rounded-xl bg-white border border-stone-300 hover:bg-stone-100 text-slate-800 text-xs font-semibold transition"
          >
            Read Risk Summary
          </Link>
          <Link
            href="/explore"
            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition shadow-sm"
          >
            Explore Open Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
