'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Clock, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export interface OnboardingStatusProps {
  isKycVerified?: boolean;
  classification?: string | null;
  appropriateness?: {
    passed: boolean;
    score: number | null;
  };
  coolingOff?: {
    active: boolean;
    secondsRemaining: number;
  };
  isReadyToInvest: boolean;
}

export function OnboardingProgressCard({ status }: { status: OnboardingStatusProps }) {
  if (status.isReadyToInvest) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Investor Onboarding Status:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                Verified & Ready to Invest
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Risk warning confirmed • Investor declaration complete • Appropriateness passed • 24h cooling-off elapsed
            </p>
          </div>
        </div>

        <Link
          href="/explore"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition self-start sm:self-center"
        >
          <span>Explore Projects</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  // Calculate current stage
  let stageLabel = 'Risk Warning & Classification';
  if (status.coolingOff?.active) {
    stageLabel = '24-Hour Cooling-Off Period Active';
  } else if (!status.appropriateness?.passed && status.classification) {
    stageLabel = 'Knowledge Check (Appropriateness Test)';
  } else if (!status.classification) {
    stageLabel = 'Investor Categorisation Declaration';
  }

  return (
    <div className="bg-amber-50/80 rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
            {status.coolingOff?.active ? (
              <Clock className="w-5 h-5 text-amber-700" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-amber-700" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Investor Onboarding:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                Action Required
              </span>
            </div>
            <p className="text-xs font-semibold text-amber-950 mt-0.5">{stageLabel}</p>
            <p className="text-[11px] text-slate-600 mt-0.5">
              UK FCA rules require completion of our 4-step first-time investor journey before you can allocate funds to live projects.
            </p>
          </div>
        </div>

        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition self-start sm:self-center shadow-xs"
        >
          <span>Complete Onboarding</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-1.5 pt-1">
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-emerald-600" />
          <span className="text-[10px] text-slate-600 block">1. Risk Warning</span>
        </div>
        <div className="space-y-1">
          <div
            className={`h-1.5 rounded-full ${
              status.classification ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
          />
          <span className="text-[10px] text-slate-600 block">2. Category</span>
        </div>
        <div className="space-y-1">
          <div
            className={`h-1.5 rounded-full ${
              status.appropriateness?.passed ? 'bg-emerald-600' : 'bg-stone-300'
            }`}
          />
          <span className="text-[10px] text-slate-600 block">3. Appropriateness</span>
        </div>
        <div className="space-y-1">
          <div
            className={`h-1.5 rounded-full ${
              !status.coolingOff?.active && status.appropriateness?.passed
                ? 'bg-emerald-600'
                : 'bg-stone-300'
            }`}
          />
          <span className="text-[10px] text-slate-600 block">4. Cooling-Off</span>
        </div>
      </div>
    </div>
  );
}
