'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  Gift,
  Mail,
  CheckCircle2,
  Lock,
  ChevronDown,
  Info,
  ExternalLink,
  Coins,
  History,
} from 'lucide-react';
import Link from 'next/link';

interface RewardsData {
  currentDraw: {
    id: string;
    month: string;
    status: string;
    totalEntries: number;
    prizes: { title: string; valuePounds: number; count: number }[];
  };
  userEntriesCount: number;
  userMaxEntriesRemaining: number;
  pointsBalance: number;
  history: {
    month: string;
    seed: string;
    runAt: string;
    winners: { prizeTitle: string; displayName: string; displayTown: string }[];
  }[];
}

interface BadgeItem {
  code: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  awardedAt: string | null;
}

const fallbackRewardsData: RewardsData = {
  currentDraw: {
    id: 'draw-current',
    month: 'This Month',
    status: 'ACTIVE',
    totalEntries: 215,
    prizes: [
      { title: 'Eco Shopping Voucher', valuePounds: 50, count: 1 },
      { title: 'Bookshop Vouchers', valuePounds: 25, count: 2 },
      { title: 'Local Cafe Vouchers', valuePounds: 10, count: 5 },
    ],
  },
  userEntriesCount: 2,
  userMaxEntriesRemaining: 8,
  pointsBalance: 250,
  history: [
    {
      month: 'Previous Month',
      seed: '0x8f2a...c4e1',
      runAt: new Date().toISOString(),
      winners: [
        { prizeTitle: '£50 Eco Voucher', displayName: 'Sarah M.', displayTown: 'Manchester' },
        { prizeTitle: '£25 Book Voucher', displayName: 'David T.', displayTown: 'Bristol' },
        { prizeTitle: '£10 Cafe Voucher', displayName: 'Elena K.', displayTown: 'Leeds' },
      ],
    },
  ],
};

const fallbackBadges: BadgeItem[] = [
  {
    code: 'FIRST_LESSON',
    title: 'Financial Foundations',
    description: 'Completed your first financial literacy lesson on loan syndication.',
    icon: '🌱',
    unlocked: true,
    awardedAt: new Date().toISOString(),
  },
  {
    code: 'QUIZ_MASTER',
    title: 'Due Diligence Explorer',
    description: 'Scored 100% on the asset-backed lending risk quiz.',
    icon: '🎯',
    unlocked: true,
    awardedAt: new Date().toISOString(),
  },
  {
    code: 'ETHICAL_INVESTOR',
    title: 'Prudent Diversification',
    description: 'Mastered the module on platform exposure limits and capital risk.',
    icon: '🧭',
    unlocked: false,
    awardedAt: null,
  },
  {
    code: 'COMMUNITY_PILLAR',
    title: 'Senior Scholar',
    description: 'Finished all introductory educational modules on the Atlas platform.',
    icon: '🏛️',
    unlocked: false,
    awardedAt: null,
  },
];

export function RewardsClient() {
  const [data, setData] = useState<RewardsData>(fallbackRewardsData);
  const [badges, setBadges] = useState<BadgeItem[]>(fallbackBadges);
  const [loading, setLoading] = useState(false);
  const [entering, setEntering] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showTerms, setShowTerms] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [drawRes, badgesRes] = await Promise.all([
        fetch('/api/v1/prize-draw'),
        fetch('/api/v1/badges'),
      ]);
      const drawJson = await drawRes.json();
      const badgesJson = await badgesRes.json();

      if (drawJson.data) setData(drawJson.data);
      if (badgesJson.data?.badges && badgesJson.data.badges.length > 0) {
        setBadges(badgesJson.data.badges);
      }
    } catch {
      // Keep fallback data if request fails
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnterDraw = async () => {
    setEntering(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/prize-draw/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries_count: 1 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to enter prize draw');

      setMessage({
        type: 'success',
        text: 'Successfully exchanged 100 points for 1 Prize Draw entry! Good luck!',
      });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setEntering(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-2">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <Award className="w-3.5 h-3.5" />
              <span>Learning Rewards & Recognition</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Points, Badges & Monthly Prize Draw
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Celebrate your financial learning journey. Earn points for quizzes and lessons — never
              for deposits or investments.
            </p>
          </div>

          {/* Points Pill */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center sm:text-right flex-shrink-0">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              Your Atlas Points
            </span>
            <span className="text-3xl font-extrabold text-emerald-950 font-mono">
              {data?.pointsBalance ?? 0}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              100 points = 1 draw entry
            </span>
          </div>
        </div>

        {/* Strict Learning-Only Notice */}
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-950 flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-emerald-900">
              Rewards are earned through learning only. Investing does not earn entries or improve your chances.
            </p>
            <p className="text-emerald-800 text-[11px] leading-relaxed">
              Points and prize draw entries are awarded purely for completing financial literacy lessons, quizzes, and educational milestones. Points are never linked to deposits, investments, amounts committed, or friend referrals.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Monthly Prize Draw (Left) + Badges (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Monthly Prize Draw */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-emerald-700" />
                <h2 className="font-bold text-slate-900 text-base">Monthly Prize Draw</h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold">
                {data?.currentDraw.month}
              </span>
            </div>

            {/* Prizes List */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Monthly Voucher Prize Pool:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-slate-900 block">1 × £50</span>
                  <span className="text-[11px] text-slate-500">Eco Shopping Voucher</span>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-slate-900 block">2 × £25</span>
                  <span className="text-[11px] text-slate-500">Bookshop Vouchers</span>
                </div>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                  <span className="font-bold text-slate-900 block">5 × £10</span>
                  <span className="text-[11px] text-slate-500">Local Cafe Vouchers</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                *Prizes are awarded as digital retail voucher codes, never as investment wallet credit.
              </p>
            </div>

            {/* User Entries & Action */}
            <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-200 space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-emerald-950">Your Entries This Month:</span>
                <span className="font-bold text-emerald-900 text-sm">
                  {data?.userEntriesCount ?? 0} / 10 max
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-emerald-800">
                  Cost: 100 points per entry (max 10 entries per user per month)
                </span>
                <button
                  onClick={handleEnterDraw}
                  disabled={
                    entering ||
                    (data?.pointsBalance ?? 0) < 100 ||
                    (data?.userMaxEntriesRemaining ?? 0) <= 0
                  }
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50"
                >
                  {entering ? 'Entering...' : 'Get 1 Entry (100 Pts)'}
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border border-rose-200'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Free Postal Entry Route */}
            <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Mail className="w-4 h-4 text-slate-600" />
                <span>Free Postal Entry Route</span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                No purchase or points necessary. To enter for free by post, send a postcard with your
                full name, town, and email to:{' '}
                <strong>Atlas Monthly Draw, PO Box 123, London, EC1A 1BB</strong>. One entry per envelope.
                Postal entries have identical chances of winning and are recorded directly into the draw.
              </p>
            </div>

            {/* Terms Accordion */}
            <div>
              <button
                onClick={() => setShowTerms(!showTerms)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1"
              >
                <span>Prize Draw Rules & Terms</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition ${showTerms ? 'rotate-180' : ''}`}
                />
              </button>

              {showTerms && (
                <div className="mt-2 p-3 bg-stone-50 rounded-xl border border-stone-200 text-[11px] text-slate-600 space-y-1.5 animate-in fade-in">
                  <p>• Open to UK residents aged 18 and over.</p>
                  <p>• Draw takes place on the last business day of each calendar month.</p>
                  <p>• Winners selected using a deterministic, auditable pseudorandom seed.</p>
                  <p>• Maximum 10 entries per person per month across all entry routes.</p>
                  <p>• Vouchers sent via email within 5 business days of draw completion.</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Draw Winners Board */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-slate-900 text-sm">Recent Draw Winners</h3>
              </div>
              <span className="text-[10px] text-slate-400">Anonymised for privacy</span>
            </div>

            {data?.history && data.history.length > 0 ? (
              <div className="space-y-4">
                {data.history.map((h, idx) => (
                  <div key={idx} className="space-y-2">
                    <span className="text-xs font-semibold text-emerald-800">{h.month} Draw</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {h.winners.map((w, wIdx) => (
                        <div
                          key={wIdx}
                          className="bg-stone-50 p-2.5 rounded-xl border border-stone-100 text-xs flex items-center justify-between"
                        >
                          <div>
                            <p className="font-semibold text-slate-900">{w.displayName}</p>
                            <p className="text-[10px] text-slate-400">{w.displayTown}</p>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-700">
                            {w.prizeTitle.split(' ')[0]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400">
                The current monthly draw is underway. Winners will be published here upon completion.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Badges Collection */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-700" />
                <h2 className="font-bold text-slate-900 text-base">Your Learning Badges</h2>
              </div>
              <span className="text-xs font-semibold text-emerald-700">
                {badges.filter((b) => b.unlocked).length} of {badges.length} Unlocked
              </span>
            </div>

            <div className="space-y-3">
              {badges.map((b) => (
                <div
                  key={b.code}
                  className={`p-3.5 rounded-2xl border transition flex items-start gap-3 ${
                    b.unlocked
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : 'bg-stone-50/40 border-stone-100 opacity-60'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
                      b.unlocked ? 'bg-white shadow-xs' : 'bg-stone-200'
                    }`}
                  >
                    {b.unlocked ? b.icon : <Lock className="w-4 h-4 text-slate-400" />}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <h3
                        className={`text-xs font-bold ${
                          b.unlocked ? 'text-slate-900' : 'text-slate-500'
                        }`}
                      >
                        {b.title}
                      </h3>
                      {b.unlocked && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{b.description}</p>
                    {b.awardedAt && (
                      <span className="text-[9px] text-emerald-700 font-mono block mt-1">
                        Unlocked {new Date(b.awardedAt).toLocaleDateString('en-GB')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Link
                href="/learn"
                className="w-full py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <span>Take More Lessons</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
