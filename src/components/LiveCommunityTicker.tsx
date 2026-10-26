'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, TrendingUp, ShieldCheck, Sparkles, MapPin, Clock } from 'lucide-react';

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
      name: 'Liam M.',
      location: 'Leeds',
      amountPounds: 50,
      project: 'Somerset 12MW Solar & Battery Storage Farm',
      timeAgo: '2m ago',
    },
    {
      id: '2',
      name: 'Sarah P.',
      location: 'Bristol',
      amountPounds: 250,
      project: 'Manchester Canal-Side Victorian Modernisation (8 Apartments)',
      timeAgo: '6m ago',
    },
    {
      id: '3',
      name: 'Marcus B.',
      location: 'Glasgow',
      amountPounds: 100,
      project: 'High-Throughput Diagnostic MRI Scanner Lease',
      timeAgo: '11m ago',
    },
    {
      id: '4',
      name: 'Elena K.',
      location: 'London',
      amountPounds: 20,
      project: 'National Highway Ultra-Fast EV Hub Network (6 Sites)',
      timeAgo: '17m ago',
    },
    {
      id: '5',
      name: 'David H.',
      location: 'Sheffield',
      amountPounds: 500,
      project: 'Hydroponic High-Yield Indoor Urban Farm',
      timeAgo: '24m ago',
    },
    {
      id: '6',
      name: 'Chloe T.',
      location: 'Birmingham',
      amountPounds: 1000,
      project: 'Manchester Canal-Side Victorian Modernisation (8 Apartments)',
      timeAgo: '31m ago',
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

  return (
    <div className="bg-[#031c13] rounded-3xl border border-emerald-500/30 p-5 sm:p-6 shadow-md space-y-4">
      {/* Top 3 High-Impact Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-emerald-500/20">
        <div className="flex items-center gap-3 pt-2 sm:pt-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">3,940+</span>
            <span className="block text-[11px] text-emerald-200/80 font-medium">UK Everyday Co-Investors</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 tracking-tight">£3.45M+</span>
            <span className="block text-[11px] text-emerald-200/80 font-medium">Pitched & Syndicated</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 sm:pt-0 sm:pl-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-white tracking-tight">£142,500</span>
            <span className="block text-[11px] text-emerald-200/80 font-medium">Community Provision Cushion</span>
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
            Live Syndicate Pulse:
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
