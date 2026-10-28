'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  TrendingUp,
  AlertTriangle,
  History,
  Info,
  CheckCircle2,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { FICTIONAL_CASE_STUDIES, FictionalCaseStudy } from '@/lib/simulator';
import { RiskTierBadge } from '@/components/RiskTierBadge';

export function SimulatorClient() {
  const [amountPounds, setAmountPounds] = useState<number>(250);
  const [termMonths, setTermMonths] = useState<number>(12);
  const [lowPct, setLowPct] = useState<number>(40);
  const [medPct, setMedPct] = useState<number>(40);
  const [highPct, setHighPct] = useState<number>(20);
  const [unchartedPct, setUnchartedPct] = useState<number>(0);

  const [activeTab, setActiveTab] = useState<'simulator' | 'cases'>('simulator');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [pointsNotification, setPointsNotification] = useState<string | null>(null);

  // Normalize percentages so sum = 100
  const totalAllocation = lowPct + medPct + highPct + unchartedPct;

  const handleRunSimulation = async () => {
    setLoading(true);
    setPointsNotification(null);
    try {
      const res = await fetch('/api/v1/simulator/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_pounds: amountPounds,
          term_months: termMonths,
          allocation: {
            low: lowPct,
            medium: medPct,
            high: highPct,
            uncharted: unchartedPct,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Simulation failed');
      setResult(data.data);

      if (data.data.pointsAwarded > 0) {
        setPointsNotification(`+${data.data.pointsAwarded} Atlas Points awarded for exploring the simulator!`);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Title & Tabs */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Learning Lab</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mt-1.5">
              Investment Simulator
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Try pretend scenarios with 1,000 randomised Monte Carlo runs. See what could happen to
              your money under different risk combinations.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'simulator'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monte Carlo (1,000 Runs)
            </button>
            <button
              onClick={() => setActiveTab('cases')}
              className={`px-4 py-2 rounded-xl transition ${
                activeTab === 'cases'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Fictional Case Studies
            </button>
          </div>
        </div>

        {/* Mandatory Statutory Disclaimer (Section 5.14 AC) */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 text-xs text-slate-600 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <span>
            <strong>Illustration only.</strong> Past performance and simulations do not predict
            future results. Returns are not guaranteed and your capital is at risk.
          </span>
        </div>

        {pointsNotification && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3 text-xs flex items-center gap-2 animate-in fade-in">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span>{pointsNotification}</span>
          </div>
        )}
      </div>

      {activeTab === 'simulator' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Controls Column (Left) */}
          <div className="md:col-span-5 bg-white rounded-3xl border border-stone-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Sliders className="w-4 h-4 text-emerald-700" />
              <span>Simulation Controls</span>
            </div>

            {/* Amount Slider */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Simulated Amount:</span>
                <span className="text-emerald-800 font-bold">£{amountPounds}</span>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="10"
                value={amountPounds}
                onChange={(e) => setAmountPounds(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>£10</span>
                <span>£500</span>
                <span>£1,000</span>
              </div>
            </div>

            {/* Term Slider */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-slate-600">Loan Term:</span>
                <span className="text-slate-900 font-bold">{termMonths} Months</span>
              </div>
              <input
                type="range"
                min="6"
                max="36"
                step="6"
                value={termMonths}
                onChange={(e) => setTermMonths(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>6 mo</span>
                <span>18 mo</span>
                <span>36 mo</span>
              </div>
            </div>

            {/* Risk Tier Mix */}
            <div className="space-y-3 pt-2 border-t border-stone-100 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Risk Tier Basket Mix</span>
                <span className={totalAllocation === 100 ? 'text-emerald-700' : 'text-rose-600 font-bold'}>
                  {totalAllocation}%
                </span>
              </div>

              {/* Lower */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-teal-800 font-medium">Lower Risk (3–5% target return, 1% default rate)</span>
                  <span>{lowPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={lowPct}
                  onChange={(e) => setLowPct(Number(e.target.value))}
                  className="w-full accent-teal-600"
                />
              </div>

              {/* Medium */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-amber-800 font-medium">Medium Risk (5–8% target return, 4% default rate)</span>
                  <span>{medPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={medPct}
                  onChange={(e) => setMedPct(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Higher */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-orange-800 font-medium">Higher Risk (8–14% target return, 10% default rate)</span>
                  <span>{highPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={highPct}
                  onChange={(e) => setHighPct(Number(e.target.value))}
                  className="w-full accent-orange-600"
                />
              </div>

              {/* Uncharted */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-purple-800 font-medium">Uncharted (0–25% return, 25% default rate)</span>
                  <span>{unchartedPct}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={unchartedPct}
                  onChange={(e) => setUnchartedPct(Number(e.target.value))}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={loading || totalAllocation !== 100}
              className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Simulating 1,000 Scenarios...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run 1,000 Monte Carlo Simulations</span>
                </>
              )}
            </button>
          </div>

          {/* Results Column (Right) */}
          <div className="md:col-span-7 space-y-6">
            {result ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-6 animate-in fade-in">
                <div className="border-b border-stone-100 pb-4">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                    Simulation Complete (1,000 Random Runs)
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 mt-1">
                    Simulated Range for £{result.initialAmountPounds} Over {result.termMonths} Months
                  </h2>
                </div>

                {/* 3 Outcome Percentiles */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      Poor (10th %ile)
                    </span>
                    <p className="text-2xl font-bold text-rose-800">
                      £{result.outcomes.poorPounds.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">If multiple loans default</p>
                  </div>

                  <div className="bg-emerald-50/70 rounded-2xl p-4 border border-emerald-200 space-y-1">
                    <span className="text-[11px] font-semibold text-emerald-800 uppercase">
                      Typical (Median)
                    </span>
                    <p className="text-2xl font-bold text-emerald-900">
                      £{result.outcomes.typicalPounds.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-emerald-700">Most common outcome</p>
                  </div>

                  <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 space-y-1">
                    <span className="text-[11px] font-semibold text-slate-500 uppercase">
                      Good (90th %ile)
                    </span>
                    <p className="text-2xl font-bold text-slate-900">
                      £{result.outcomes.goodPounds.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-slate-400">If all loans perform well</p>
                  </div>
                </div>

                {/* Chance of Loss Callout */}
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-amber-950">
                      Simulated Chance of Losing Money: {result.chanceOfLossPercent}%
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      In {result.chanceOfLossPercent}% of simulated runs, defaults exceeded the
                      interest earned, resulting in a net return below the starting £
                      {result.initialAmountPounds}.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-slate-600">
                  <Sparkles className="w-6 h-6 text-emerald-700" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Ready to Run Pretend Scenarios</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Adjust the sliders on the left to set your desired mix of Low, Medium, High, or
                  Uncharted loans. Click <strong>Run Simulations</strong> to see 1,000 randomised outcomes.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Fictional Case Studies Tab (Section 5.14 AC) */
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">
              Historical Fictional Case Studies (3 Scenarios)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Labelled as fictional educational examples to illustrate how loans behave over time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FICTIONAL_CASE_STUDIES.map((study) => (
              <div
                key={study.id}
                className="bg-white rounded-3xl border border-stone-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {study.sector}
                    </span>
                    <RiskTierBadge tier={study.tier} size="sm" />
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">{study.title}</h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                        study.scenarioType === 'success'
                          ? 'bg-emerald-50 text-emerald-800'
                          : study.scenarioType === 'late_repayment'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {study.scenarioType === 'success'
                        ? 'Full Repayment'
                        : study.scenarioType === 'late_repayment'
                        ? 'Late but Caught Up'
                        : 'Default with Recovery'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{study.summary}</p>
                </div>

                <div className="pt-3 border-t border-stone-100 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Invested £{study.investedPounds} →</span>
                    <span
                      className={
                        study.returnedPounds >= study.investedPounds
                          ? 'text-emerald-700 font-bold'
                          : 'text-rose-700 font-bold'
                      }
                    >
                      £{study.returnedPounds.toFixed(2)} Returned
                    </span>
                  </div>

                  <div className="space-y-1.5 text-[11px] text-slate-500">
                    {study.timeline.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <span className="font-mono text-slate-400">M{step.month}:</span>
                        <span>{step.event}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
