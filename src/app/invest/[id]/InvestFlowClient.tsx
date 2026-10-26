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
  isReadyToInvest: boolean;
  onboardingNextStep: string;
}

export function InvestFlowClient({
  opportunity,
  initialLimits,
  userId,
  isReadyToInvest,
  onboardingNextStep,
}: InvestFlowClientProps) {
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

  // If user cannot invest yet due to onboarding
  if (!isReadyToInvest) {
    return (
      <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 text-center my-6">
        <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-slate-900">Onboarding Step Required</h2>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            UK regulations require identity verification, investor classification, and a quick knowledge check before you can invest.
          </p>
        </div>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-700 text-white rounded-xl text-sm font-semibold hover:bg-emerald-800 transition shadow-sm"
        >
          Complete Onboarding (Takes 2 mins)
          <ArrowRight className="w-4 h-4" />
        </Link>
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
      {/* Prominent Statutory Section 3.1 Warning */}
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
              {(opportunity.expected_return_max_bps / 100).toFixed(1)}% a year,{' '}
              <span className="italic">not guaranteed</span> • {opportunity.term_months} month term
            </div>
          </div>

          {/* Limits Remaining Helper (Section 5.4) */}
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

          {/* Required Checkboxes (Section 5.8) */}
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

      {/* STEP 3: Calm Success Screen (Section 5.8 - No confetti, calm confirmation) */}
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
