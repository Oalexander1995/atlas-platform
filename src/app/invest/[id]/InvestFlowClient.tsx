'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { RiskTierBadge } from '@/components/RiskTierBadge';
import { RiskWarningBanner } from '@/components/RiskWarningBanner';
import { Opportunity } from '@/lib/opportunities';
import { UserLimits } from '@/lib/investments';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Wallet,
  Clock,
  Sparkles,
} from 'lucide-react';

interface InvestFlowClientProps {
  opportunity: Opportunity;
  initialLimits: UserLimits;
  userId: string;
  userName?: string;
  isReadyToInvest: boolean;
  onboardingNextStep: string;
  coolingOffSecondsRemaining?: number;
}

export function InvestFlowClient({
  opportunity,
  initialLimits,
  userId,
  userName = 'Demo Investor',
  isReadyToInvest: initialIsReady,
  onboardingNextStep,
  coolingOffSecondsRemaining = 0,
}: InvestFlowClientProps) {
  const [isReady, setIsReady] = useState(initialIsReady);
  const [coolingSeconds, setCoolingSeconds] = useState(coolingOffSecondsRemaining);
  const [hasConfirmedContinue, setHasConfirmedContinue] = useState(false);
  const [step, setStep] = useState<'amount' | 'review' | 'success'>('amount');
  const [amountPounds, setAmountPounds] = useState<number>(25);
  const [riskAck, setRiskAck] = useState<boolean>(false);
  const [unchartedAck, setUnchartedAck] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    journalEntryId: string;
    holdingId: string;
    amountPence: number;
    newBalancePence: number;
  } | null>(null);

  const amountPence = Math.round(amountPounds * 100);
  const minPence = 1000; // £10
  const maxPence = initialLimits.maxInvestableNowPence;

  const handleSkipCoolingOff = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/onboarding/cooling-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });
      setCoolingSeconds(0);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCoolingOff = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/onboarding/cooling-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      setHasConfirmedContinue(true);
      setIsReady(true);
    } finally {
      setLoading(false);
    }
  };

  // If user cannot invest yet due to onboarding
  if (!isReady && !hasConfirmedContinue) {
    if (onboardingNextStep === 'cooling_off' || coolingSeconds > 0) {
      return (
        <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 text-center my-6">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">24-Hour Cooling-Off Period</h2>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Under UK FCA rules for first-time investors, after you first ask to see investment offers, you cannot view the invest screen for 24 hours.
            </p>
          </div>

          {coolingSeconds > 0 ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 max-w-xs mx-auto">
                <div className="text-xs text-slate-500 font-medium">Time Remaining</div>
                <div className="text-2xl font-mono font-bold text-slate-900 mt-1">
                  {Math.floor(coolingSeconds / 3600)}h {Math.floor((coolingSeconds % 3600) / 60)}m {coolingSeconds % 60}s
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/opportunities/${opportunity.id}`}
                  className="px-5 py-2.5 border border-stone-200 hover:bg-stone-50 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Back to Project
                </Link>
                <button
                  onClick={handleSkipCoolingOff}
                  disabled={loading}
                  className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold transition shadow-sm"
                >
                  Skip cooling-off (demo only)
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Your 24-hour reflection period has ended. Please confirm you wish to proceed to investment offers:
              </p>
              <button
                onClick={handleConfirmCoolingOff}
                disabled={loading}
                className="px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-sm transition shadow-sm inline-flex items-center gap-2"
              >
                <span>I want to continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      );
    }

    // Step 1 Personalised Risk Warning Pop-up
    return (
      <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 my-6">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900 leading-tight">
            {userName}, this is a high-risk investment.
          </h2>
          <p className="text-base text-slate-700 font-medium leading-relaxed">
            How would you feel if you lost the money you&apos;re about to invest?{' '}
            <Link
              href="/risk-summary"
              className="text-emerald-700 underline font-semibold hover:text-emerald-800"
            >
              Take 2 mins to learn more.
            </Link>
          </p>
          <p className="text-xs text-slate-500 leading-relaxed">
            Before viewing investment offers or putting capital into loans, UK regulations require completion of our quick 4-step investor journey (categorisation, risk assessment, and cooling-off).
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <Link
            href={`/onboarding?user=new@atlas.demo&next=/invest/${opportunity.id}`}
            className="flex-1 py-3 px-6 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition shadow-sm text-center"
          >
            Continue
          </Link>
          <Link
            href={`/opportunities/${opportunity.id}`}
            className="py-3 px-6 border border-stone-200 hover:bg-stone-50 text-slate-700 rounded-xl font-semibold text-sm transition text-center"
          >
            Leave
          </Link>
        </div>
      </div>
    );
  }

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amountPence < minPence) {
      setError('Minimum investment is £10.00.');
      return;
    }

    if (amountPence > initialLimits.remainingInOpportunityPence) {
      setError(
        `This exceeds your remaining allowance for this opportunity (£${(
          initialLimits.remainingInOpportunityPence / 100
        ).toFixed(2)}).`
      );
      return;
    }

    if (amountPence > initialLimits.remainingYearlyLimitPence) {
      setError(
        `This exceeds your remaining £5,000 yearly investment limit (£${(
          initialLimits.remainingYearlyLimitPence / 100
        ).toFixed(2)} remaining).`
      );
      return;
    }

    if (amountPence > initialLimits.walletBalancePence) {
      setError(
        `Insufficient wallet balance. You have £${(
          initialLimits.walletBalancePence / 100
        ).toFixed(2)} available.`
      );
      return;
    }

    setStep('review');
  };

  const handleConfirmInvestment = async () => {
    if (!riskAck) {
      setError('You must acknowledge that you could lose all the money you invest.');
      return;
    }

    if (opportunity.risk_tier === 'uncharted' && !unchartedAck) {
      setError('You must acknowledge that Uncharted is the highest-risk tier.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const idempotencyKey = `inv_${userId}_${opportunity.id}_${amountPence}_${Date.now()}`;
      const res = await fetch('/api/v1/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: JSON.stringify({
          opportunity_id: opportunity.id,
          amount_pence: amountPence,
          risk_ack: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Investment failed');
      }

      setSuccessData(json.data);
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Investment could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      {/* Statutory Risk Warning */}
      <RiskWarningBanner />

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs md:text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: Enter Amount */}
      {step === 'amount' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Step 1 of 2
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                Choose Investment Amount
              </h1>
            </div>
            <RiskTierBadge tier={opportunity.risk_tier} size="sm" />
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
            <div className="text-xs font-semibold text-slate-500 uppercase">Selected Opportunity</div>
            <div className="font-bold text-slate-900 text-base">{opportunity.title}</div>
            <div className="text-xs text-slate-500">
              Expected return: {(opportunity.expected_return_min_bps / 100).toFixed(1)}%–
              {(opportunity.expected_return_max_bps / 100).toFixed(1)}% a year • {opportunity.term_months} month term
            </div>
            <div className="text-[11px] text-amber-800 font-medium">
              Target return, not guaranteed. Your capital is at risk.
            </div>
          </div>

          {/* Limits Remaining Helper */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-slate-500 block">Opportunity Allowance:</span>
              <strong className="text-slate-900 text-sm">
                £{(initialLimits.remainingInOpportunityPence / 100).toFixed(2)} left
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200">
              <span className="text-slate-500 block">Yearly Limit:</span>
              <strong className="text-slate-900 text-sm">
                £{(initialLimits.remainingYearlyLimitPence / 100).toFixed(2)} left of £5,000
              </strong>
            </div>
          </div>

          <form onSubmit={handleProceedToReview} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Amount (Min £10, Step £1)
              </label>

              {/* Preset buttons */}
              <div className="flex gap-2 mb-3">
                {[10, 25, 50, 100].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmountPounds(preset)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs md:text-sm font-semibold transition ${
                      amountPounds === preset
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-stone-200 hover:border-stone-300 text-slate-700'
                    }`}
                  >
                    £{preset}
                  </button>
                ))}
              </div>

              {/* Custom amount input */}
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400 font-semibold">£</span>
                <input
                  type="number"
                  min="10"
                  step="1"
                  max={(maxPence / 100).toString()}
                  value={amountPounds}
                  onChange={(e) => setAmountPounds(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-stone-200 text-base font-semibold focus:border-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                Wallet available: £{(initialLimits.walletBalancePence / 100).toFixed(2)}
              </span>
              <Link href="/wallet" className="text-emerald-800 underline font-medium">
                Add demo money
              </Link>
            </div>

            <button
              type="submit"
              disabled={amountPounds < 10 || amountPounds > initialLimits.walletBalancePence / 100}
              className="w-full py-3.5 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-50"
            >
              Continue to Review
            </button>
          </form>
        </div>
      )}

      {/* STEP 2: Review & Risk Acknowledgement */}
      {step === 'review' && (
        <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100">
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                Step 2 of 2
              </span>
              <h1 className="text-xl md:text-2xl font-bold text-slate-900">
                Review Your Investment
              </h1>
            </div>
            <button
              onClick={() => setStep('amount')}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Edit amount
            </button>
          </div>

          {/* Investment Summary */}
          <div className="divide-y divide-stone-100 border border-stone-200 rounded-2xl p-4 text-xs md:text-sm text-slate-700 space-y-2.5">
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">Opportunity:</span>
              <span className="font-semibold text-slate-900">{opportunity.title}</span>
            </div>
            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500">Risk Tier:</span>
              <RiskTierBadge tier={opportunity.risk_tier} size="sm" />
            </div>
            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500">Amount to Invest:</span>
              <span className="font-bold text-slate-900 text-base">£{amountPounds.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500">Expected Term:</span>
              <span>{opportunity.term_months} months</span>
            </div>
            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500">Remaining 12-Month Limit After:</span>
              <span>
                £{((initialLimits.remainingYearlyLimitPence - amountPence) / 100).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Stated Key Risks Reminder */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="font-bold text-amber-900 text-xs uppercase tracking-wider">
              Specific Risks for this Loan:
            </div>
            <ul className="list-disc pl-4 text-xs text-amber-950 space-y-1">
              {opportunity.key_risks.slice(0, 3).map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>

          {/* Required Checkboxes */}
          <div className="space-y-3 pt-1">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-stone-200 bg-stone-50 cursor-pointer text-xs md:text-sm">
              <input
                type="checkbox"
                checked={riskAck}
                onChange={(e) => setRiskAck(e.target.checked)}
                className="mt-0.5 text-emerald-600 focus:ring-emerald-500 rounded"
              />
              <span className="font-semibold text-slate-900">
                I understand I could lose all the money I invest.
              </span>
            </label>

            {opportunity.risk_tier === 'uncharted' && (
              <label className="flex items-start gap-3 p-3.5 rounded-xl border border-purple-200 bg-purple-50 cursor-pointer text-xs md:text-sm">
                <input
                  type="checkbox"
                  checked={unchartedAck}
                  onChange={(e) => setUnchartedAck(e.target.checked)}
                  className="mt-0.5 text-purple-600 focus:ring-purple-500 rounded"
                />
                <span className="font-semibold text-purple-950">
                  I understand this is the highest-risk tier and I may lose everything. (Uncharted loans are never covered by the Provision Fund).
                </span>
              </label>
            )}
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleConfirmInvestment}
            disabled={loading || !riskAck || (opportunity.risk_tier === 'uncharted' && !unchartedAck)}
            className="w-full py-3.5 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing Ledger Posting…
              </>
            ) : (
              'Confirm Investment'
            )}
          </button>
        </div>
      )}

      {/* STEP 3: Calm Confirmation Screen */}
      {step === 'success' && successData && (
        <div className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-700" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900">Investment Confirmed</h1>
            <p className="text-xs text-slate-500">
              Your holding has been created and recorded in the double-entry ledger.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 max-w-md mx-auto text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Opportunity:</span>
              <span className="font-semibold text-slate-900">{opportunity.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Amount Invested:</span>
              <span className="font-bold text-slate-900">£{(successData.amountPence / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">New Wallet Balance:</span>
              <span>£{(successData.newBalancePence / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400 font-mono text-[11px] pt-1 border-t border-stone-200">
              <span>Journal ID:</span>
              <span>{successData.journalEntryId.slice(0, 12)}…</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/portfolio"
              className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition shadow-sm"
            >
              View My Portfolio
            </Link>
            <Link
              href="/explore"
              className="px-6 py-2.5 border border-stone-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-stone-50 transition"
            >
              Back to Marketplace
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
