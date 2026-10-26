'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Users, Coins, Sparkles, Building2, ArrowRight, ShieldCheck } from 'lucide-react';

export function CrowdPowerCalculator() {
  const [investorCount, setInvestorCount] = useState<number>(1000);
  const [amountPerPerson, setAmountPerPerson] = useState<number>(1000);

  const totalRaised = investorCount * amountPerPerson;

  const projectExamples = [
    {
      threshold: 1000000,
      title: 'Commercial Solar & Battery Farm',
      desc: 'A £1,000,000 green energy farm powering 2,000 homes. Normally only accessible to giant banks!',
      icon: '☀️',
    },
    {
      threshold: 750000,
      title: '8-Apartment City Residential Complex',
      desc: 'A £750k property development generating monthly rental income from 8 families.',
      icon: '🏢',
    },
    {
      threshold: 500000,
      title: 'Commercial EV Fast-Charging Network',
      desc: 'Rapid highway charging stations generating daily revenue from electric vehicle drivers.',
      icon: '⚡',
    },
    {
      threshold: 100000,
      title: 'Specialist Medical Diagnostic Scanner',
      desc: 'High-tech imaging suite co-funding medical diagnostic capacity for local clinics.',
      icon: '🏥',
    },
    {
      threshold: 0,
      title: 'Urban Electric Delivery Fleet',
      desc: 'A fleet of zero-emission chilled delivery vans serving organic food logistics.',
      icon: '🚚',
    },
  ];

  const currentProject =
    projectExamples.find((p) => totalRaised >= p.threshold) ||
    projectExamples[projectExamples.length - 1];

  return (
    <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 sm:p-8 md:p-10 text-white shadow-md relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Crowd Power Multiplier</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            How 1,000 People Raise £1,000,000
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-emerald-100/90 max-w-2xl leading-relaxed">
            Major investments with big returns usually require £1 Million upfront—meaning everyday
            people are locked out. On Atlas, we pool together so anyone can join with £10 to £1,000.
          </p>
        </div>

        {/* Interactive Sliders & Presets */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Controls */}
          <div className="bg-white/10 backdrop-blur border border-white/15 rounded-2xl p-5 space-y-5">
            {/* Number of Investors */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-200 font-medium flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-300" />
                  Everyday Investors Pooling:
                </span>
                <span className="text-base font-bold text-white font-mono">
                  {investorCount.toLocaleString('en-GB')} people
                </span>
              </div>

              {/* Quick Preset Buttons for Investors */}
              <div className="grid grid-cols-4 gap-2 pb-1">
                {[100, 500, 1000, 2500].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setInvestorCount(count)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition border ${
                      investorCount === count
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-sm'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {count.toLocaleString('en-GB')}
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="50"
                max="5000"
                step="50"
                value={investorCount}
                onChange={(e) => setInvestorCount(Number(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-2 bg-white/20 rounded-lg"
              />

              {/* Mathematically aligned scale labels */}
              <div className="relative text-[10px] text-emerald-300/70 h-5 mt-1 font-mono">
                <span className="absolute left-0">50</span>
                <span
                  className="absolute -translate-x-1/2 font-bold text-emerald-300 flex flex-col items-center"
                  style={{ left: `${((1000 - 50) / (5000 - 50)) * 100}%` }}
                >
                  <span className="text-[9px] leading-none mb-0.5">▲</span>
                  <span>1,000</span>
                </span>
                <span
                  className="absolute -translate-x-1/2"
                  style={{ left: `${((2500 - 50) / (5000 - 50)) * 100}%` }}
                >
                  2,500
                </span>
                <span className="absolute right-0">5,000</span>
              </div>
            </div>

            {/* Amount Per Person */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-200 font-medium flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-300" />
                  Amount Each Person Puts In:
                </span>
                <span className="text-base font-bold text-white font-mono">
                  £{amountPerPerson.toLocaleString('en-GB')}
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-2">
                {[10, 100, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountPerPerson(amt)}
                    className={`py-2 rounded-xl text-xs font-bold transition border ${
                      amountPerPerson === amt
                        ? 'bg-emerald-400 text-slate-950 border-emerald-300 shadow-sm'
                        : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                    }`}
                  >
                    £{amt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result Card */}
          <div className="bg-white text-slate-900 rounded-2xl p-6 shadow-lg flex flex-col justify-between space-y-4">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Fund Raised Together
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 tracking-tight mt-1">
                £{totalRaised.toLocaleString('en-GB')}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {investorCount.toLocaleString('en-GB')} people × £{amountPerPerson.toLocaleString('en-GB')} each
              </p>
            </div>

            {/* Unlocked Project Card */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentProject.icon}</span>
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider">
                    Unlocks Big-Ticket Opportunity:
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                    {currentProject.title}
                  </h4>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed pl-8">
                {currentProject.desc}
              </p>
            </div>

            <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Single person: <strong className="text-rose-600">Locked out</strong>
              </span>
              <span className="text-slate-500">
                Pooled together: <strong className="text-emerald-700">Fully Funded</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom explainer pill */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-emerald-200">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>
              All investments are spread in safe slices (£10 minimum up to £1,000 cap per project) so you never put all your eggs in one basket.
            </span>
          </div>
          <Link
            href="/explore"
            className="whitespace-nowrap px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
          >
            <span>Browse £1M Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
