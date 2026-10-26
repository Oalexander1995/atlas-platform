'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  SunMedium,
  Zap,
  HeartPulse,
  Sprout,
  Bot,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface AssetCategory {
  id: string;
  name: string;
  icon: string;
  tagline: string;
  howItEarns: string;
  sourceOfIncome: string;
  realExampleTitle: string;
  exampleTarget: string;
  exampleReturn: string;
  exampleTerm: string;
  howInvestorsGetPaid: string;
}

export function ReturnAssetsShowcase() {
  const [activeTab, setActiveTab] = useState<string>('property');

  const categories: AssetCategory[] = [
    {
      id: 'property',
      name: 'Property & Housing',
      icon: '🏢',
      tagline: 'Modernising buildings into energy-efficient homes',
      howItEarns:
        'A property renovator buys a large Victorian house and renovates it into 8 modern apartments. Once tenants move in, they pay monthly rent.',
      sourceOfIncome: 'Monthly tenant rent and residential leasing',
      realExampleTitle: 'Manchester Canal-Side Victorian Residential Modernisation (8 Apartments)',
      exampleTarget: '£1,000,000',
      exampleReturn: '5.5% – 6.5% / yr',
      exampleTerm: '18 Months',
      howInvestorsGetPaid:
        'A portion of every month’s rental income goes straight to repaying investors their original capital plus interest.',
    },
    {
      id: 'energy',
      name: 'Clean Energy & Batteries',
      icon: '☀️',
      tagline: 'Rooftop solar panels and mega-battery storage',
      howItEarns:
        'Commercial solar panels and industrial batteries are placed on warehouse roofs. The warehouse buys cheap, clean electricity rather than grid power.',
      sourceOfIncome: 'Fixed 15-year commercial power purchase agreements',
      realExampleTitle: 'Somerset Logistics Park — Commercial Solar Roof & Battery Farm',
      exampleTarget: '£1,000,000',
      exampleReturn: '4.5% – 5.5% / yr',
      exampleTerm: '24 Months',
      howInvestorsGetPaid:
        'The warehouse owner pays fixed monthly clean energy fees, which directly fund the monthly investor repayments.',
    },
    {
      id: 'transport',
      name: 'EV Fleets & Fast Chargers',
      icon: '⚡',
      tagline: 'Highway rapid charging hubs and electric courier vans',
      howItEarns:
        'Installing 12 ultra-fast 150kW commercial EV chargers across 6 motorway service areas. Drivers and fleet delivery vans pay a fee every time they charge up.',
      sourceOfIncome: 'Per-kilowatt-hour charging fees from delivery fleets & motorists',
      realExampleTitle: 'National Commercial EV Fast-Charging Highway Hub Network (6 Sites)',
      exampleTarget: '£750,000',
      exampleReturn: '6.0% – 8.0% / yr',
      exampleTerm: '18 Months',
      howInvestorsGetPaid:
        'Daily charging revenue accumulates throughout the month and is disbursed as capital plus interest to co-investors.',
    },
    {
      id: 'healthcare',
      name: 'Healthcare & Medical Tech',
      icon: '🏥',
      tagline: 'High-tech diagnostic imaging equipment leased to NHS clinics',
      howItEarns:
        'Co-funding state-of-the-art ultrasound scanners and diagnostic MRI machines that regional clinics lease to reduce patient scan backlogs.',
      sourceOfIncome: 'Long-term medical equipment rental leases paid by diagnostic clinics',
      realExampleTitle: 'Regional Diagnostic Clinic — Imaging Scanner Equipment Lease',
      exampleTarget: '£500,000',
      exampleReturn: '4.0% – 5.0% / yr',
      exampleTerm: '24 Months',
      howInvestorsGetPaid:
        'The clinic pays fixed monthly lease fees to use the scanners, providing predictable cash flow to repay investors.',
    },
    {
      id: 'agritech',
      name: 'Smart Agriculture',
      icon: '🌿',
      tagline: 'Automated indoor vertical herb towers for supermarkets',
      howItEarns:
        'Indoor vertical farms grow fresh basil and mint using 95% less water and zero pesticides, under LED lighting sensors. Supermarkets pre-order the produce.',
      sourceOfIncome: 'Contracted supermarket wholesale supply agreements',
      realExampleTitle: 'Vertical Hydroponic Supermarket Farm Automation',
      exampleTarget: '£350,000',
      exampleReturn: '5.5% – 7.5% / yr',
      exampleTerm: '24 Months',
      howInvestorsGetPaid:
        'Supermarkets pay weekly for fresh herbs delivered to stores. Cash reserves from sales fund regular investor payouts.',
    },
    {
      id: 'tech',
      name: 'Tech & Field Services',
      icon: '🤖',
      tagline: 'Offshore wind inspection drones & satellite earth dishes',
      howItEarns:
        'Industrial drones with thermal cameras survey offshore wind turbines and bridge cables, saving energy firms weeks of manual rope inspections.',
      sourceOfIncome: 'Commercial survey contracts from energy companies and utilities',
      realExampleTitle: 'Commercial Drone Offshore Turbine Inspection Fleet',
      exampleTarget: '£400,000',
      exampleReturn: '10.0% – 13.0% / yr',
      exampleTerm: '30 Months',
      howInvestorsGetPaid:
        'Energy firms pay per inspection survey completed. This funds the borrower’s repayments (higher risk tier, treated with care).',
    },
  ];

  const current = categories.find((c) => c.id === activeTab) || categories[0];

  return (
    <section className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 md:p-10 shadow-sm space-y-8">
      {/* Header */}
      <div className="space-y-3 text-center md:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider border border-emerald-200">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          <span>Real Tangible Assets</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
          Everything That Brings in a Return
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-slate-600 max-w-3xl leading-relaxed">
          Investing on Atlas isn’t about guessing stock charts or hoping a token goes up. Every project
          is backed by <strong>real assets and contracts that earn predictable cash flow</strong>—from
          residential rents to solar energy agreements and commercial equipment leases.
        </p>
      </div>

      {/* Asset Category Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {categories.map((cat) => {
          const isActive = cat.id === activeTab;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveTab(cat.id)}
              className={`p-3 rounded-2xl border text-left transition flex flex-col items-center sm:items-start gap-1.5 ${
                isActive
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-stone-50 hover:bg-stone-100 text-slate-700 border-stone-200'
              }`}
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="text-xs font-bold leading-snug line-clamp-1">{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Active Asset Deep-Dive Card */}
      <div className="bg-stone-50 rounded-2xl border border-stone-200 p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl md:text-4xl p-2.5 bg-white rounded-2xl shadow-xs border border-stone-200">
              {current.icon}
            </span>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-slate-900">{current.name}</h3>
              <p className="text-xs sm:text-sm text-emerald-800 font-medium">{current.tagline}</p>
            </div>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition"
          >
            <span>Explore {current.name} Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 3 Step Cash Flow Mechanism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Box 1: How it earns */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              1. The Asset & Project
            </div>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              {current.howItEarns}
            </p>
          </div>

          {/* Box 2: Source of Income */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-2">
            <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
              2. How Income Is Created
            </div>
            <p className="text-xs sm:text-sm text-slate-900 font-semibold leading-relaxed">
              {current.sourceOfIncome}
            </p>
            <p className="text-[11px] text-slate-500">
              Backed by commercial contracts, lease paperwork, and customer payments.
            </p>
          </div>

          {/* Box 3: How investors get paid */}
          <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-2xs space-y-2">
            <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">
              3. Returns Back To You
            </div>
            <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed font-medium">
              {current.howInvestorsGetPaid}
            </p>
            <span className="text-[10px] text-emerald-700 italic block">
              Returns are not guaranteed; capital is at risk.
            </span>
          </div>
        </div>

        {/* Real Example Bar */}
        <div className="p-4 bg-white rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Featured Atlas Syndicate Example
            </span>
            <div className="text-sm font-bold text-slate-900">{current.realExampleTitle}</div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Raise Goal</span>
              <span className="font-bold text-slate-900">{current.exampleTarget}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Expected Return</span>
              <span className="font-bold text-emerald-700">{current.exampleReturn}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Term</span>
              <span className="font-bold text-slate-900">{current.exampleTerm}</span>
            </div>
            <Link
              href="/explore"
              className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white font-bold text-xs hover:bg-emerald-800 transition"
            >
              View
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
