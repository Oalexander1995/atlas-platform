import React from 'react';
import Link from 'next/link';
import { query } from '@/lib/db';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '@/lib/seed';
import { getCurrentUser } from '@/lib/auth';
import { getWalletBalancePence } from '@/lib/ledger';
import { ClockService } from '@/lib/clock';
import { RiskTierBadge, RiskTier } from '@/components/RiskTierBadge';
import { CrowdPowerCalculator } from '@/components/CrowdPowerCalculator';
import {
  Compass,
  Sparkles,
  PieChart,
  Wallet,
  BookOpen,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface FeaturedOpp {
  id: string;
  title: string;
  summary: string;
  risk_tier: RiskTier;
  target_pence: string | number;
  expected_return_min_bps: number;
  expected_return_max_bps: number;
  term_months: number;
  partner_name: string;
  raised_pence: string | number;
}

export default async function HomePage() {
  await ensureOpportunitiesSeeded();
  await ensureDemoUsersSeeded();

  const simulatedTime = await ClockService.now();
  const formattedDate = simulatedTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const session = await getCurrentUser();
  const demoEmail = session?.email || 'ready@atlas.demo';

  // Get user ID for demo stats
  const userRes = await query<{ id: string; email: string }>(
    'SELECT id, email FROM users WHERE email = $1',
    [demoEmail]
  );
  const userId = userRes.rows[0]?.id;
  const balancePence = userId ? await getWalletBalancePence(userId) : 25000;

  // Fetch featured opportunities
  const oppsRes = await query<FeaturedOpp>(
    `SELECT o.id, o.title, o.summary, o.risk_tier, o.target_pence,
            o.expected_return_min_bps, o.expected_return_max_bps, o.term_months,
            p.name as partner_name,
            COALESCE(SUM(h.principal_pence), 0) as raised_pence
     FROM opportunities o
     JOIN partners p ON o.partner_id = p.id
     LEFT JOIN holdings h ON o.id = h.opportunity_id
     WHERE o.status = 'open'
     GROUP BY o.id, p.name
     ORDER BY o.created_at ASC
     LIMIT 4`
  );
  const featured = oppsRes.rows;

  return (
    <div className="space-y-12">
      {/* Top Demo Status Ribbon */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-950 font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>
            Practice Account: <strong>{demoEmail}</strong>
          </span>
          <span className="text-emerald-700 hidden sm:inline">•</span>
          <span className="text-emerald-800">
            Wallet Balance: <strong>£{(balancePence / 100).toFixed(2)}</strong> demo money
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <span className="text-[11px] flex items-center gap-1 font-mono">
            <Clock className="w-3 h-3 text-slate-400" />
            {formattedDate}
          </span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="text-center space-y-5 max-w-3xl mx-auto pt-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-700 text-xs font-semibold">
          <span>🇬🇧 UK Investment Syndicates & Micro-Crowdfunding</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          Investments you couldn’t normally afford. <br />
          <span className="text-emerald-700">Unlocked for everyone.</span>
        </h1>
        <p className="text-slate-600 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
          Normally, a £1,000,000 high-return project requires being a multi-millionaire or an investment bank.
          On Atlas, 1,000 everyday people invest £1,000 each (or start with just £10) to collectively
          fund big-ticket projects and share the returns. Practice with simulated money first—learn
          step-by-step with complete peace of mind.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/explore"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-700 text-white font-bold text-sm sm:text-base hover:bg-emerald-800 transition shadow-sm flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Opportunities</span>
          </Link>
          <Link
            href="/pitch"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm sm:text-base transition shadow-sm flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Pitch an Opportunity (Raise Funds)</span>
          </Link>
          <Link
            href="/wallet"
            className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white border border-stone-300 text-slate-800 font-bold text-sm sm:text-base hover:bg-stone-50 transition shadow-sm flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4 text-emerald-700" />
            <span>Practice With £{(balancePence / 100).toFixed(0)}</span>
          </Link>
        </div>
      </section>

      {/* Crowd Power Multiplier Interactive Feature */}
      <CrowdPowerCalculator />

      {/* How It Works in 3 Kid-Simple Steps */}
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            How It Works in 3 Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Easy to understand, transparent, and built so anyone can learn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Step 1 */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl font-bold border border-emerald-100">
              💡
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              1. Project owners pitch big opportunities
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Person 1 has a major investment project—like a £1,000,000 commercial solar farm, an 8-flat
              residential modernisation, or rapid EV charging hubs—and pitches it on Atlas to raise community funding.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl font-bold border border-emerald-100">
              🤝
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              2. 1,000 people pool together from £10
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Instead of needing a millionaire, 1,000 everyday people invest £1,000 each (or start with
              as little as £10). This unlocks high-ticket projects while keeping your money diversified.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center text-xl font-bold border border-emerald-100">
              📈
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              3. Share big returns every month
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              As the completed project generates commercial revenue or rental yields, the borrower repays
              original capital plus interest directly into every investor’s Atlas wallet each month!
            </p>
          </div>
        </div>
      </section>

      {/* Featured Opportunities Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Featured Investment Opportunities
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Real vetted projects and ventures seeking funding from micro-investors starting from £10.
            </p>
          </div>
          <Link
            href="/explore"
            className="text-xs sm:text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {featured.map((opp) => {
            const target = Number(opp.target_pence);
            const raised = Number(opp.raised_pence);
            const progress = target > 0 ? Math.min(100, Math.round((raised / target) * 100)) : 0;
            const minRate = (opp.expected_return_min_bps / 100).toFixed(1);
            const maxRate = (opp.expected_return_max_bps / 100).toFixed(1);
            const targetPounds = Math.round(target / 100);
            const raisedPounds = Math.round(raised / 100);
            const coInvestors = Math.max(18, Math.round((raised / (target || 1)) * 1000));

            return (
              <div
                key={opp.id}
                className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm hover:border-emerald-200 transition flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          {opp.partner_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold">
                          👥 {coInvestors.toLocaleString('en-GB')} Co-investors
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug mt-0.5">
                        {opp.title}
                      </h3>
                    </div>
                    <RiskTierBadge tier={opp.risk_tier} size="sm" />
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                    {opp.summary}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-stone-100">
                  {/* Stats Bar */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Expected Return</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {minRate}% – {maxRate}% / yr
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Loan Term</span>
                      <span className="font-bold text-slate-900 text-sm">
                        {opp.term_months} Months
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[10px]">Funded</span>
                      <span className="font-bold text-emerald-700 text-sm">
                        £{raisedPounds.toLocaleString('en-GB')} ({progress}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Action Link */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-medium">
                      Goal: £{targetPounds.toLocaleString('en-GB')} • Co-invest from £10
                    </span>
                    <Link
                      href={`/opportunities/${opp.id}`}
                      className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold text-xs hover:bg-emerald-800 transition"
                    >
                      View & Invest
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4 Interactive Feature Pillars */}
      <section className="space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
          Tools to Help You Learn Safely
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/auto-invest"
            className="group bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition space-y-2.5 block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
              Auto-Invest Piggy Bank
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automatically split £10 a month across diversified risk buckets with a 20% cap on any single project.
            </p>
          </Link>

          <Link
            href="/portfolio"
            className="group bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition space-y-2.5 block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
              Your Money Garden
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              See your holdings breakdown, risk balance, and download statement spreadsheets anytime.
            </p>
          </Link>

          <Link
            href="/provision-fund"
            className="group bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition space-y-2.5 block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
              Community Reserve Fund
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              1% of every raise feeds a shared cushion to help if a vetted borrower hits hard times.
            </p>
          </Link>

          <Link
            href="/learn"
            className="group bg-white rounded-3xl border border-stone-200 p-5 shadow-sm hover:border-emerald-300 hover:shadow-md transition space-y-2.5 block"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-100 group-hover:bg-emerald-100 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-800">
              3-Minute Lessons
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bite-sized stories and mini-quizzes explaining inflation, interest, and why spreading eggs matters.
            </p>
          </Link>
        </div>
      </section>

      {/* Statutory Section 3.1 Risk Warning Banner */}
      <section className="bg-amber-50 rounded-3xl border border-amber-300 p-6 shadow-sm space-y-2">
        <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0" />
          <span>FCA Statutory Risk Warning (Section 3.1)</span>
        </div>
        <p className="text-amber-950 font-bold text-sm sm:text-base">
          Don’t invest unless you’re prepared to lose all the money you invest. This is a high-risk
          investment.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-amber-800">
          <p>
            You should not expect to be protected if something goes wrong.{' '}
            <Link
              href="/risk-summary"
              className="underline font-semibold hover:text-amber-950"
            >
              Take 2 mins to learn more
            </Link>
          </p>
          <span className="text-amber-700 font-medium">Demo platform — Simulated currency</span>
        </div>
      </section>
    </div>
  );
}
