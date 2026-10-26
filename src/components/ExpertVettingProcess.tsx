'use client';

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
} from 'lucide-react';

export function ExpertVettingProcess() {
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
        'Commercial lease & power purchase agreement reviews',
        'Legally binding loan agreement covenants',
        'Dedicated escrow bank accounts to safeguard pooled funds',
      ],
    },
  ];

  return (
    <section className="bg-gradient-to-b from-stone-50 to-white rounded-3xl border border-stone-200 p-6 sm:p-8 md:p-10 shadow-sm space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Independent Due Diligence</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            How Every Project is Vetted by Experts
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-600 leading-relaxed">
            Anyone can pitch a project on Atlas, but <strong>less than 5% are accepted</strong>. Before
            an opportunity is opened to community co-investors, independent accountants, surveyors,
            and solicitors put it through a strict 4-stage vetting pipeline.
          </p>
        </div>

        {/* 5% Acceptance Rate Stat Box */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex items-center gap-4 flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-800 font-extrabold text-2xl flex items-center justify-center border border-amber-200">
            &lt;5%
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Strict Acceptance Rate</div>
            <p className="text-[11px] text-slate-500 max-w-[180px] leading-snug">
              95 out of 100 pitched projects are rejected during our expert review.
            </p>
          </div>
        </div>
      </div>

      {/* 4-Stage Due Diligence Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
        {vettingSteps.map((step) => (
          <div
            key={step.step}
            className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs hover:border-emerald-300 transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs font-mono font-bold text-slate-400">STAGE {step.step}</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-100 text-slate-700 text-[11px] font-semibold">
                  {step.badge}
                </span>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900">{step.title}</h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </div>

            {/* Checklist */}
            <div className="pt-3 border-t border-stone-100 space-y-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Certified Verification Points:
              </div>
              <ul className="space-y-1.5">
                {step.checklist.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Transparency Callout */}
      <div className="bg-emerald-950 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            100% Transparent Documentation
          </div>
          <div className="text-sm sm:text-base font-bold text-white">
            Every project page features an inspectable Vetting Checklist and live verification dates.
          </div>
          <p className="text-xs text-emerald-200/80">
            You can inspect the exact dates our team verified Companies House filings and physical site surveys.
          </p>
        </div>
        <Link
          href="/explore"
          className="px-5 py-2.5 rounded-xl bg-white text-emerald-950 font-bold text-xs sm:text-sm hover:bg-emerald-50 transition shadow-sm flex-shrink-0 flex items-center gap-2"
        >
          <span>View Vetted Opportunities</span>
          <ArrowRight className="w-4 h-4 text-emerald-800" />
        </Link>
      </div>
    </section>
  );
}
