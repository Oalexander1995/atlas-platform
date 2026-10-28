'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import {
  TOTAL_CO_INVESTORS_COUNT,
  TOTAL_SYNDICATED_PENCE,
  PROVISION_FUND_BALANCE_PENCE,
} from '@/lib/constants/projects';

interface ActivityItem {
  id: string;
  name: string;
  location: string;
  amountPounds: number;
  project: string;
  timeAgo: string;
}

export function LiveCommunityTicker() {
  const [activities] = useState<ActivityItem[]>([
    {
      id: '1',
      name: 'Sarah P.',
      location: 'Bristol',
      amountPounds: 250,
      project: 'Manchester Canal-Side Victorian Modernisation (8 Apartments)',
      timeAgo: '4m ago',
    },
    {
      id: '2',
      name: 'Liam M.',
      location: 'Leeds',
      amountPounds: 50,
      project: 'Somerset Logistics Park Commercial Solar Array & Battery Farm',
      timeAgo: '9m ago',
    },
    {
      id: '3',
      name: 'Elena K.',
      location: 'London',
      amountPounds: 100,
      project: 'EV Fast-Charger Installation – Retail Park, Bristol',
      timeAgo: '16m ago',
    },
    {
      id: '4',
      name: 'David H.',
      location: 'Sheffield',
      amountPounds: 500,
      project: 'Vertical Hydroponic Supermarket Farm Automation',
      timeAgo: '24m ago',
    },
    {
      id: '5',
      name: 'Marcus B.',
      location: 'Glasgow',
      amountPounds: 75,
      project: 'Regional Diagnostic Clinic Imaging Scanner Lease',
      timeAgo: '32m ago',
    },
    {
      id: '6',
      name: 'Chloe T.',
      location: 'Birmingham',
      amountPounds: 400,
      project: 'Manchester Canal-Side Victorian Modernisation (8 Apartments)',
      timeAgo: '41m ago',
    },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activities.length]);

  const current = activities[currentIndex];

  const totalSyndicatedPounds = (TOTAL_SYNDICATED_PENCE / 100).toLocaleString('en-GB');
  const provisionFundPounds = (PROVISION_FUND_BALANCE_PENCE / 100).toLocaleString('en-GB');

  return (
    <div className="bg-[#031c13] rounded-3xl border border-emerald-500/30 p-5 sm:p-6 shadow-md space-y-4">
      {/* Top 3 High-Impact Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-emerald-500/20">
        <div className="flex items-center gap-3 pt-2 sm:pt-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {TOTAL_CO_INVESTORS_COUNT.toLocaleString('en-GB')}
            </span>
            <span className="block text-[11px] text-emerald-200/80 font-medium">
              UK Everyday Co-Investors
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">
              £{totalSyndicatedPounds}
            </span>
            <span className="block text-[11px] text-emerald-200/80 font-medium">
              Pitched & Syndicated
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">
              £{provisionFundPounds}
            </span>
            <span className="block text-[11px] text-emerald-200/80 font-medium">
              Provision Fund Balance (1% of raises)
            </span>
          </div>
        </div>
      </div>

      {/* Live Activity Ticker Bar */}
      <div className="pt-2 border-t border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">
            Simulated demo activity:
          </span>
        </div>

        <div className="flex-1 min-w-0 transition-all duration-300">
          <div className="flex flex-wrap items-center gap-2 text-emerald-100">
            <span className="font-semibold text-white">
              {current.name} ({current.location})
            </span>
            <span className="text-emerald-300/60">•</span>
            <span>
              co-invested <strong className="text-emerald-300">£{current.amountPounds}</strong> in
            </span>
            <span className="font-medium text-emerald-200 truncate max-w-xs">
              {current.project}
            </span>
            <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {current.timeAgo}
            </span>
          </div>
        </div>

        <Link
          href="/explore"
          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 whitespace-nowrap self-end sm:self-auto transition"
        >
          View live syndicates →
        </Link>
      </div>
    </div>
  );
}
