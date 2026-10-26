'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { RiskTierBadge } from '@/components/RiskTierBadge';
import { AutoInvestPreview, AutoInvestPlan } from '@/lib/auto-invest';
import {
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RefreshCw,
  Wallet,
  Building2,
  Info,
  Calendar,
} from 'lucide-react';

interface AutoInvestClientProps {
  initialPlan: AutoInvestPlan | null;
  initialHoldings: Array<{
    id: string;
    opportunityId: string;
    opportunityTitle: string;
    riskTier: any;
    principalPence: number;
    status: string;
    createdAt: string;
  }>;
  walletBalancePence: number;
  userId: string;
}

export function AutoInvestClient({
  initialPlan,
  initialHoldings,
  walletBalancePence,
  userId,
}: AutoInvestClientProps) {
  const [activeTab, setActiveTab] = useState<'setup' | 'my_plan'>('setup');
  const [riskTier, setRiskTier] = useState<'low' | 'medium' | 'high'>(initialPlan?.riskTier || 'medium');
  const [amountPounds, setAmountPounds] = useState<number>(50);
  const [monthlyPounds, setMonthlyPounds] = useState<number>(0);
  const [preview, setPreview] = useState<AutoInvestPreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [holdings, setHoldings] = useState(initialHoldings);
  const [plan, setPlan] = useState<AutoInvestPlan | null>(initialPlan);

  // Live preview update
  useEffect(() => {
    let cancelled = false;
    const fetchPreview = async () => {
      setLoadingPreview(true);
      try {
        const res = await fetch('/api/v1/auto-invest/preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            risk_tier: riskTier,
            amount_pence: amountPounds * 100,
          }),
        });
        const json = await res.json();
        if (!cancelled && json.data) {
          setPreview(json.data);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    };

    fetchPreview();
    return () => {
      cancelled = true;
    };
  }, [riskTier, amountPounds]);

  const handleExecute = async () => {
    setExecuting(true);
    setMessage(null);
    try {
      const res = await fetch('/api/v1/auto-invest/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          risk_tier: riskTier,
          amount_pence: amountPounds * 100,
          monthly_pence: monthlyPounds * 100,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to execute Auto-Invest');
      }

      setMessage({
        type: 'success',
        text: `Successfully allocated £${(json.data.allocatedPence / 100).toFixed(2)} across ${
          json.data.allocations.length
        } loans!`,
      });

      // Refresh holdings and plan
      const refresh = await fetch('/api/v1/auto-invest');
      const refreshJson = await refresh.json();
      if (refreshJson.data) {
        setHoldings(refreshJson.data.holdings);
        setPlan(refreshJson.data.plan);
      }

      setActiveTab('my_plan');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Auto-Invest failed' });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
          Auto-Invest Portfolio
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Sit back and let Atlas automatically spread your money into £10 slices across vetted loans.
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-sm border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-stone-200 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('setup')}
          className={`py-3 px-5 border-b-2 transition ${
            activeTab === 'setup'
              ? 'border-emerald-700 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Set Up Auto-Invest
        </button>
        <button
          onClick={() => setActiveTab('my_plan')}
          className={`py-3 px-5 border-b-2 transition flex items-center gap-2 ${
            activeTab === 'my_plan'
              ? 'border-emerald-700 text-emerald-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>My Auto-Invest</span>
          <span className="px-2 py-0.5 rounded-full bg-stone-100 text-slate-600 text-xs">
            {holdings.length} holdings
          </span>
        </button>
      </div>

      {/* SETUP TAB */}
      {activeTab === 'setup' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Form (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6">
              {/* Plain English Explainer (Section 5.9) */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-slate-600 space-y-1">
                <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-emerald-700" />
                  How Auto-Invest Works
                </div>
                <p>
                  Atlas will split your money into £10 pieces across open opportunities in your chosen tier. You will own each piece directly and can see every one.
                </p>
              </div>

              {/* Step 1: Choose Risk Tier */}
              <div className="space-y-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  1. Choose Risk Tier (Uncharted Excluded)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['low', 'medium', 'high'] as const).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setRiskTier(tier)}
                      className={`p-3 rounded-2xl border text-center transition ${
                        riskTier === tier
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                          : 'border-stone-200 hover:border-stone-300 bg-white'
                      }`}
                    >
                      <RiskTierBadge tier={tier} size="sm" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: One-Off Amount */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                    2. One-Off Amount (£10 Slices)
                  </label>
                  <span className="text-xs text-slate-400">
                    Wallet: £{(walletBalancePence / 100).toFixed(2)}
                  </span>
                </div>

                <div className="flex gap-2">
                  {[20, 50, 100, 200].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setAmountPounds(preset)}
                      className={`flex-1 py-2 rounded-xl border text-xs font-semibold transition ${
                        amountPounds === preset
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                          : 'border-stone-200 hover:border-stone-300 text-slate-700'
                      }`}
                    >
                      £{preset}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">£</span>
                  <input
                    type="number"
                    min="10"
                    step="10"
                    value={amountPounds}
                    onChange={(e) => setAmountPounds(Math.max(10, parseInt(e.target.value) || 10))}
                    className="w-full pl-8 pr-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Step 3: Optional Monthly Amount */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  3. Optional Monthly Habit
                </label>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">£</span>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      placeholder="e.g. 50 (optional)"
                      value={monthlyPounds || ''}
                      onChange={(e) => setMonthlyPounds(parseInt(e.target.value) || 0)}
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-stone-200 text-sm font-semibold focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <span className="text-xs text-slate-400">per month</span>
                </div>
              </div>

              {/* Confirm CTA */}
              <button
                type="button"
                onClick={handleExecute}
                disabled={executing || Boolean(preview && preview.totalAllocatedPence === 0)}
                className="w-full py-3.5 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {executing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deploying £10 Slices…
                  </>
                ) : (
                  <>
                    <span>Confirm Auto-Invest (£{amountPounds})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Live Preview Panel (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                  <Sparkles className="w-4 h-4 text-emerald-700" />
                  <span>Live Allocation Preview</span>
                </div>
                {loadingPreview && (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                )}
              </div>

              {preview ? (
                <div className="space-y-4 text-xs">
                  <div className="flex justify-between p-3 rounded-2xl bg-stone-50 border border-stone-200">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Total to deploy</span>
                      <strong className="text-slate-900 text-sm font-mono">
                        £{(preview.totalAllocatedPence / 100).toFixed(2)}
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 block text-[11px]">Slices</span>
                      <strong className="text-slate-900 text-sm">
                        {preview.allocatedSlices} × £10
                      </strong>
                    </div>
                  </div>

                  {preview.notice && (
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[11px] leading-relaxed">
                      {preview.notice}
                    </div>
                  )}

                  {preview.allocations.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      No matching open opportunities right now.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[11px] font-semibold uppercase text-slate-400">
                        Assigned Loans ({preview.allocations.length})
                      </div>
                      <div className="space-y-2">
                        {preview.allocations.map((a) => (
                          <div
                            key={a.opportunityId}
                            className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1"
                          >
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span className="truncate max-w-[180px]">{a.opportunityTitle}</span>
                              <span className="text-emerald-800 font-mono">
                                £{(a.allocatedPence / 100).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>{a.slicesCount} × £10 slice</span>
                              <span>{a.percentOfTotal}% of total</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {preview.remainderInWalletPence > 0 && (
                    <div className="text-[11px] text-slate-500 pt-1">
                      * £{(preview.remainderInWalletPence / 100).toFixed(2)} stays in your wallet.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Calculating allocation…
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MY PLAN & UNDERLYING HOLDINGS TAB */}
      {activeTab === 'my_plan' && (
        <div className="space-y-6">
          {plan ? (
            <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <RiskTierBadge tier={plan.riskTier} size="sm" />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold uppercase">
                    {plan.status}
                  </span>
                </div>
                <div className="font-bold text-slate-900 text-base">
                  Monthly Auto-Invest: £{(plan.monthlyPence / 100).toFixed(2)}/month
                </div>
                <div className="text-xs text-slate-500">
                  Runs on the 1st of every month • Slices deployed automatically
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Plan ID: {plan.id.slice(0, 8)}…</span>
              </div>
            </div>
          ) : (
            <div className="bg-stone-50 p-6 rounded-3xl border border-stone-200 text-center space-y-2">
              <div className="text-sm font-semibold text-slate-700">No active monthly Auto-Invest plan</div>
              <p className="text-xs text-slate-500">
                You can set up a one-off or monthly auto-invest above anytime.
              </p>
            </div>
          )}

          {/* Table of all underlying Auto-Invest Holdings */}
          <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 text-base">
                Your Auto-Invest Loan Slices ({holdings.length})
              </h2>
              <span className="text-xs text-slate-400">Individually owned</span>
            </div>

            {holdings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No Auto-Invest holdings yet. Run a one-off allocation above to see your £10 slices.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200 text-slate-500">
                    <tr>
                      <th className="p-4 font-semibold">Opportunity Title</th>
                      <th className="p-4 font-semibold">Risk Tier</th>
                      <th className="p-4 font-semibold">Principal Owned</th>
                      <th className="p-4 font-semibold">Status</th>
                      <th className="p-4 font-semibold">View</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 text-slate-700">
                    {holdings.map((h) => (
                      <tr key={h.id} className="hover:bg-stone-50 transition">
                        <td className="p-4 font-semibold text-slate-900">{h.opportunityTitle}</td>
                        <td className="p-4">
                          <RiskTierBadge tier={h.riskTier} size="sm" />
                        </td>
                        <td className="p-4 font-bold text-slate-900 font-mono">
                          £{(h.principalPence / 100).toFixed(2)}
                        </td>
                        <td className="p-4">
                          <span className="capitalize px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-slate-700">
                            {h.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/opportunities/${h.opportunityId}`}
                            className="text-emerald-800 hover:text-emerald-950 font-semibold text-xs"
                          >
                            Details →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
