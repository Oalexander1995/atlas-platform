import React from 'react';
import Link from 'next/link';
import { query } from '@/lib/db';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '@/lib/seed';
import { getCurrentUser } from '@/lib/auth';
import { getWalletBalancePence } from '@/lib/ledger';
import { ClockService } from '@/lib/clock';
import { RiskTierBadge, RiskTier } from '@/components/RiskTierBadge';
import { CrowdPowerCalculator } from '@/components/CrowdPowerCalculator';
import { ReturnAssetsShowcase } from '@/components/ReturnAssetsShowcase';
import { ExpertVettingProcess } from '@/components/ExpertVettingProcess';
import { WhyUsSection } from '@/components/WhyUsSection';
import { LiveCommunityTicker } from '@/components/LiveCommunityTicker';
import { HomeFaqAccordion } from '@/components/HomeFaqAccordion';
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
    <div className="w-full bg-gradient-to-b from-[#062419] via-[#082f21] to-[#041a12] text-white min-h-screen py-6 md:py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Top Demo Status Ribbon */}
        <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs backdrop-blur-md">
          <div className="flex items-center gap-2 text-emerald-100 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>
              Practice Account: <strong className="text-white">{demoEmail}</strong>
            </span>
            <span className="text-emerald-500 hidden sm:inline">•</span>
            <span className="text-emerald-200">
              Wallet Balance: <strong className="text-white">£{(balancePence / 100).toFixed(2)}</strong> demo money
            </span>
          </div>
          <div className="flex items-center gap-3 text-emerald-300/70">
            <span className="text-[11px] flex items-center gap-1 font-mono">
              <Clock className="w-3 h-3 text-emerald-400" />
              {formattedDate}
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <section className="text-center space-y-6 max-w-4xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold tracking-wide">
            <span>🇬🇧 An Example Platform Showing What Investing Could Be</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-tight">
            Big investments, <br />
            <span className="text-emerald-400">Small barriers.</span>
          </h1>

          <p className="text-emerald-100/90 text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto font-normal">
            We believe everyone deserves the chance to grow their wealth. Our platform makes
            investing more accessible, opening up opportunities once out of reach and helping people
            make their money work harder.
          </p>

          {/* Primary Call to Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <Link
              href="/explore"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-sm sm:text-base transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
            >
              <Compass className="w-5 h-5 text-slate-950" />
              <span>Browse Opportunities</span>
            </Link>
            <Link
              href="/pitch"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm sm:text-base transition shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-slate-950" />
              <span>Pitch a Project (Raise Funds)</span>
            </Link>
            <Link
              href="/wallet"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-sm sm:text-base transition backdrop-blur flex items-center justify-center gap-2"
            >
              <Wallet className="w-5 h-5 text-emerald-300" />
              <span>Try With £{(balancePence / 100).toFixed(0)} Demo</span>
            </Link>
          </div>
        </section>

        {/* Live Community Activity & Social Proof Bar */}
        <LiveCommunityTicker />

        {/* Crowd Power Multiplier Interactive Feature */}
        <CrowdPowerCalculator />

      {/* How It Works in 4 Simple Steps */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <span>The 4-Step Flywheel</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
            How It Works in 4 Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl mx-auto">
            Easy to understand, transparent, and built so anyone can learn without finance jargon.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Step 1 */}
          <div className="bg-[#031c13] rounded-3xl border border-emerald-500/30 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center text-2xl border border-emerald-400/30">
              💡
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">Step 01</span>
            <h3 className="font-bold text-white text-base">
              1. Project Owners Pitch
            </h3>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              Entrepreneurs with viable projects—like an 8-flat housing modernisation or clean solar array—pitch on Atlas when traditional banks say no.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#031c13] rounded-3xl border border-emerald-500/30 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center text-2xl border border-emerald-400/30">
              🔍
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">Step 02</span>
            <h3 className="font-bold text-white text-base">
              2. Independent Expert Vetting
            </h3>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              Chartered surveyors, accountants, and solicitors audit the project. Less than 5% pass our strict tests before opening.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#031c13] rounded-3xl border border-emerald-500/30 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center text-2xl border border-emerald-400/30">
              🤝
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">Step 03</span>
            <h3 className="font-bold text-white text-base">
              3. 1,000 People Pool From £10
            </h3>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              Everyday people join the syndicate with small amounts from £10 up to £1,000. Pooling together raises £1,000,000 with complete diversification.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-[#031c13] rounded-3xl border border-emerald-500/30 p-6 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center text-2xl border border-emerald-400/30">
              📈
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block">Step 04</span>
            <h3 className="font-bold text-white text-base">
              4. Monthly Cash Returns
            </h3>
            <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed">
              As completed projects collect tenant rents or clean power fees, the borrower repays capital plus interest monthly into your wallet.
            </p>
          </div>
        </div>
      </section>

      {/* Everything That Brings in a Return — Real Tangible Assets */}
      <ReturnAssetsShowcase />

      {/* Why Us — Traditional Finance vs Atlas */}
      <WhyUsSection />

      {/* How Every Project is Vetted by Experts Before Acceptance */}
      <ExpertVettingProcess />

      {/* Featured Opportunities Section */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Open Syndicates</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Featured Investment Opportunities
            </h2>
            <p className="text-xs sm:text-sm text-emerald-200/80">
              Real vetted projects and ventures seeking crowd funding from everyday investors starting from £10.
            </p>
          </div>
          <Link
            href="/explore"
            className="text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
          >
            <span>View All Opportunities</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                className="bg-[#031c13] rounded-3xl border border-emerald-500/30 p-6 shadow-sm hover:border-emerald-400/60 transition flex flex-col justify-between gap-4 text-white"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                          {opp.partner_name}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold">
                          👥 {coInvestors.toLocaleString('en-GB')} Co-investors
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white leading-snug mt-0.5">
                        {opp.title}
                      </h3>
                    </div>
                    <RiskTierBadge tier={opp.risk_tier} size="sm" />
                  </div>

                  <p className="text-xs sm:text-sm text-emerald-100/80 line-clamp-2 leading-relaxed">
                    {opp.summary}
                  </p>
                </div>

                <div className="space-y-3 pt-3 border-t border-emerald-500/20">
                  {/* Stats Bar */}
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-emerald-300/70 block text-[10px]">Expected Return</span>
                      <span className="font-bold text-emerald-400 text-sm">
                        {minRate}% – {maxRate}% / yr
                      </span>
                    </div>
                    <div>
                      <span className="text-emerald-300/70 block text-[10px]">Loan Term</span>
                      <span className="font-bold text-white text-sm">
                        {opp.term_months} Months
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-emerald-300/70 block text-[10px]">Funded</span>
                      <span className="font-bold text-white text-sm">
                        £{raisedPounds.toLocaleString('en-GB')} ({progress}%)
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Action Link */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-emerald-300/80 font-medium">
                      Goal: £{targetPounds.toLocaleString('en-GB')} • Co-invest from £10
                    </span>
                    <Link
                      href={`/opportunities/${opp.id}`}
                      className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-xs transition shadow-sm"
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

      {/* Frequently Asked Questions */}
      <HomeFaqAccordion />

      {/* 4 Interactive Educational Feature Pillars */}
      <section className="space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            <span>Section 0 Guardrails</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Tools to Help You Practice with Peace of Mind
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/auto-invest"
            className="group bg-[#031c13] rounded-3xl border border-emerald-500/30 p-5 shadow-sm hover:border-emerald-400/60 transition space-y-2.5 block text-white"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-400/30 group-hover:bg-emerald-400/25 transition">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-emerald-300">
              Auto-Invest Piggy Bank
            </h3>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Automatically split £10 a month across diversified risk buckets with a 20% cap on any single project.
            </p>
          </Link>

          <Link
            href="/portfolio"
            className="group bg-[#031c13] rounded-3xl border border-emerald-500/30 p-5 shadow-sm hover:border-emerald-400/60 transition space-y-2.5 block text-white"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-400/30 group-hover:bg-emerald-400/25 transition">
              <PieChart className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-emerald-300">
              Your Money Garden
            </h3>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              See your holdings breakdown, risk balance, and download statement spreadsheets anytime.
            </p>
          </Link>

          <Link
            href="/provision-fund"
            className="group bg-[#031c13] rounded-3xl border border-emerald-500/30 p-5 shadow-sm hover:border-emerald-400/60 transition space-y-2.5 block text-white"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-400/30 group-hover:bg-emerald-400/25 transition">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-emerald-300">
              Community Reserve Fund
            </h3>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              1% of every raise feeds a shared cushion to help if a vetted borrower hits hard times.
            </p>
          </Link>

          <Link
            href="/learn"
            className="group bg-[#031c13] rounded-3xl border border-emerald-500/30 p-5 shadow-sm hover:border-emerald-400/60 transition space-y-2.5 block text-white"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center border border-emerald-400/30 group-hover:bg-emerald-400/25 transition">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-sm group-hover:text-emerald-300">
              3-Minute Lessons
            </h3>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Bite-sized stories and mini-quizzes explaining inflation, interest, and why spreading eggs matters.
            </p>
          </Link>
        </div>
      </section>

      {/* Statutory Section 3.1 Risk Warning Banner */}
      <section className="bg-amber-500/10 rounded-3xl border border-amber-400/30 p-6 shadow-sm space-y-2 text-amber-200">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-xs uppercase tracking-wider">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>FCA Statutory Risk Warning (Section 3.1)</span>
        </div>
        <p className="text-white font-bold text-sm sm:text-base">
          Don’t invest unless you’re prepared to lose all the money you invest. This is a high-risk
          investment.
        </p>
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs text-amber-200/90">
          <p>
            You should not expect to be protected if something goes wrong.{' '}
            <Link
              href="/risk-summary"
              className="underline font-semibold hover:text-white"
            >
              Take 2 mins to learn more
            </Link>
          </p>
          <span className="text-amber-300/80 font-medium">Demo platform — Simulated currency</span>
        </div>
      </section>
      </div>
    </div>
  );
}
