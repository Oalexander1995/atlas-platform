'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  FastForward,
  UserCheck,
  Award,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

interface Question {
  id: number;
  category: string;
  question: string;
  options: { id: string; text: string }[];
}

interface OnboardingStatus {
  isKycVerified: boolean;
  classification: string | null;
  appropriateness: {
    passed: boolean;
    attemptsCount: number;
    score: number | null;
    canAttempt: boolean;
    nextAttemptAllowedAt: string | null;
  };
  coolingOff: {
    active: boolean;
    endsAt: string | null;
    secondsRemaining: number;
  };
  isReadyToInvest: boolean;
  nextStep: 'kyc' | 'classification' | 'appropriateness' | 'cooling_off' | 'ready';
}

export function OnboardingClient({
  initialStatus,
  userFullName,
  userEmail,
}: {
  initialStatus: OnboardingStatus;
  userFullName: string;
  userEmail: string;
}) {
  const [status, setStatus] = useState<OnboardingStatus>(initialStatus);
  const [loading, setLoading] = useState(false);

  // Step 1: Risk Warning Acknowledgement state
  const [riskWarningAccepted, setRiskWarningAccepted] = useState(
    Boolean(initialStatus.classification || initialStatus.appropriateness.passed)
  );

  // Step 2: Classification state
  const [selectedClass, setSelectedClass] = useState<'restricted' | 'high_net_worth' | 'sophisticated'>('restricted');
  const [restrictedConfirmed, setRestrictedConfirmed] = useState(false);
  const [hnwConfirmed, setHnwConfirmed] = useState(false);
  const [sophisticatedConfirmed, setSophisticatedConfirmed] = useState(false);

  // Step 3: Appropriateness state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testResult, setTestResult] = useState<{
    score: number;
    passed: boolean;
    explanations: Array<{ questionId: number; correct: boolean; explanation: string }>;
  } | null>(null);

  // Step 4: Cooling off state
  const [secondsLeft, setSecondsLeft] = useState(initialStatus.coolingOff.secondsRemaining);
  const [hasConfirmedContinue, setHasConfirmedContinue] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  // Load questions when user reaches appropriateness step
  useEffect(() => {
    if (
      (status.nextStep === 'appropriateness' || (!status.appropriateness.passed && status.classification)) &&
      questions.length === 0
    ) {
      fetch('/api/v1/onboarding/appropriateness')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setQuestions(data.data);
        });
    }
  }, [status.nextStep, status.appropriateness.passed, status.classification, questions.length]);

  const refreshStatus = async () => {
    try {
      const res = await fetch('/api/v1/onboarding/status');
      const json = await res.json();
      if (json.data) {
        setStatus(json.data);
        setSecondsLeft(json.data.coolingOff.secondsRemaining);
      }
    } catch {
      // keep local state
    }
  };

  // Step 1: Risk Warning Continue
  const handleRiskWarningContinue = async () => {
    setRiskWarningAccepted(true);
    // Ensure KYC is marked verified in the background
    if (!status.isKycVerified) {
      await fetch('/api/v1/onboarding/kyc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testName: userFullName }),
      }).catch(() => {});
      await refreshStatus();
    }
  };

  // Step 2: Investor Categorisation Submit
  const handleClassificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/onboarding/classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: selectedClass }),
      });
      if (res.ok) {
        await refreshStatus();
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Appropriateness Submit
  const handleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/v1/onboarding/appropriateness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json();
      if (res.ok) {
        setTestResult(json.data);
        await refreshStatus();
      } else {
        alert(json.error?.message || 'Error submitting test');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetryTest = () => {
    setAnswers({});
    setTestResult(null);
    fetch('/api/v1/onboarding/appropriateness')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setQuestions(data.data);
      });
  };

  // Step 4: Skip cooling off (demo only)
  const handleSkipCoolingOff = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/onboarding/cooling-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'skip' }),
      });
      setSecondsLeft(0);
      await refreshStatus();
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Active confirmation "I want to continue"
  const handleConfirmContinue = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/onboarding/cooling-off', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm' }),
      });
      setHasConfirmedContinue(true);
      await refreshStatus();
    } finally {
      setLoading(false);
    }
  };

  // Stepper steps
  const steps = [
    { id: 'risk_warning', label: '1. Risk Warning', done: riskWarningAccepted },
    { id: 'classification', label: '2. Categorisation', done: Boolean(status.classification) },
    { id: 'appropriateness', label: '3. Knowledge Check', done: status.appropriateness.passed },
    {
      id: 'cooling_off',
      label: '4. Cooling-Off',
      done: (!status.coolingOff.active && status.appropriateness.passed) || hasConfirmedContinue,
    },
  ];

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hours}h ${minutes}m ${s}s`;
  };

  // Determine current active step
  const currentStep = !riskWarningAccepted
    ? 'risk_warning'
    : !status.classification
    ? 'classification'
    : !status.appropriateness.passed
    ? 'appropriateness'
    : status.coolingOff.active && secondsLeft > 0
    ? 'cooling_off'
    : !hasConfirmedContinue && !status.isReadyToInvest
    ? 'cooling_off_confirm'
    : 'ready';

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      {/* Stepper Progress Bar */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>FCA First-Time Investor Journey</span>
          <span className="text-emerald-700">
            {steps.filter((s) => s.done).length} of {steps.length} steps complete
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {steps.map((step) => (
            <div key={step.id} className="space-y-1">
              <div
                className={`h-2 rounded-full transition-all ${
                  step.done
                    ? 'bg-emerald-600'
                    : currentStep === step.id
                    ? 'bg-amber-500'
                    : 'bg-stone-200'
                }`}
              />
              <div className="text-[10px] md:text-xs font-medium text-slate-600 truncate">
                {step.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Personalised Risk Warning Pop-up / Screen */}
      {currentStep === 'risk_warning' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 animate-in fade-in">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-slate-900 leading-tight">
              {userFullName || 'Demo Investor'}, this is a high-risk investment.
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
              Don&apos;t invest unless you&apos;re prepared to lose all the money you invest. This is a
              high-risk investment and you are unlikely to be protected if something goes wrong.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRiskWarningContinue}
              className="flex-1 py-3 px-6 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition shadow-sm"
            >
              Continue
            </button>
            <Link
              href="/explore"
              className="py-3 px-6 border border-stone-200 hover:bg-stone-50 text-slate-700 rounded-xl font-semibold text-sm transition text-center"
            >
              Leave
            </Link>
          </div>
        </div>
      )}

      {/* Step 2: Investor Categorisation */}
      {currentStep === 'classification' && (
        <form
          onSubmit={handleClassificationSubmit}
          className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 animate-in fade-in"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Investor Categorisation</h2>
              <p className="text-xs text-slate-500">
                UK regulatory categorisation required before viewing investment offers (COBS 4.12A).
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Please choose the declaration that best matches your financial circumstances. Most retail
            investors choose <strong>Restricted Investor</strong>.
          </p>

          <div className="space-y-4">
            {/* Restricted Investor */}
            <div
              onClick={() => setSelectedClass('restricted')}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                selectedClass === 'restricted'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                  : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="classification"
                  value="restricted"
                  checked={selectedClass === 'restricted'}
                  onChange={() => setSelectedClass('restricted')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-2 flex-1">
                  <div className="font-semibold text-sm text-slate-900">
                    Restricted Investor (Everyday Retail)
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-stone-200">
                    &ldquo;In the past 12 months I have not invested more than 10% of my net assets
                    in high-risk investments, and I will not do so in the next 12 months.&rdquo;
                  </div>
                  {selectedClass === 'restricted' && (
                    <label className="flex items-start gap-2 pt-1 text-xs font-semibold text-emerald-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restrictedConfirmed}
                        onChange={(e) => setRestrictedConfirmed(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        required
                      />
                      <span>
                        I confirm that I will not invest more than 10% of my net assets in these kinds
                        of investments.
                      </span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Certified High Net Worth */}
            <div
              onClick={() => setSelectedClass('high_net_worth')}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                selectedClass === 'high_net_worth'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                  : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="classification"
                  value="high_net_worth"
                  checked={selectedClass === 'high_net_worth'}
                  onChange={() => setSelectedClass('high_net_worth')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-2 flex-1">
                  <div className="font-semibold text-sm text-slate-900">
                    Certified High Net Worth Investor
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-stone-200">
                    I self-certify that I have had an annual net income of £100,000+ or net assets of
                    £250,000+ (excluding main home, pension, and life policies) in the previous 12 months.
                  </div>
                  {selectedClass === 'high_net_worth' && (
                    <label className="flex items-start gap-2 pt-1 text-xs font-semibold text-emerald-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hnwConfirmed}
                        onChange={(e) => setHnwConfirmed(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        required
                      />
                      <span>I declare that I meet the criteria for a Certified High Net Worth Investor.</span>
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Certified Sophisticated */}
            <div
              onClick={() => setSelectedClass('sophisticated')}
              className={`p-4 rounded-2xl border cursor-pointer transition ${
                selectedClass === 'sophisticated'
                  ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                  : 'border-stone-200 hover:border-stone-300 bg-stone-50/40'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="classification"
                  value="sophisticated"
                  checked={selectedClass === 'sophisticated'}
                  onChange={() => setSelectedClass('sophisticated')}
                  className="mt-1 text-emerald-600 focus:ring-emerald-500"
                />
                <div className="space-y-2 flex-1">
                  <div className="font-semibold text-sm text-slate-900">
                    Certified Sophisticated Investor
                  </div>
                  <div className="text-xs text-slate-600 leading-relaxed bg-white/80 p-3 rounded-xl border border-stone-200">
                    I self-certify that I have qualifying experience or certifications in private debt,
                    venture investments, or unlisted business finance.
                  </div>
                  {selectedClass === 'sophisticated' && (
                    <label className="flex items-start gap-2 pt-1 text-xs font-semibold text-emerald-950 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sophisticatedConfirmed}
                        onChange={(e) => setSophisticatedConfirmed(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                        required
                      />
                      <span>I declare that I meet the criteria for a Certified Sophisticated Investor.</span>
                    </label>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={
              loading ||
              (selectedClass === 'restricted' && !restrictedConfirmed) ||
              (selectedClass === 'high_net_worth' && !hnwConfirmed) ||
              (selectedClass === 'sophisticated' && !sophisticatedConfirmed)
            }
            className="w-full py-3.5 px-6 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-50 shadow-sm"
          >
            Confirm Investor Categorisation
          </button>
        </form>
      )}

      {/* Step 3: Appropriateness Test */}
      {currentStep === 'appropriateness' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              3
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Appropriateness Test</h2>
              <p className="text-xs text-slate-500">
                5 quick questions assessing your understanding of risks. Pass mark: 4/5.
              </p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            UK FCA rules require an appropriateness assessment to check that you understand the key
            risks of loan-based crowdfunding before allocating funds.
          </p>

          <form onSubmit={handleTestSubmit} className="space-y-6 pt-2">
            {questions.map((q, idx) => (
              <div key={q.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  Question {idx + 1} of {questions.length}
                </div>
                <h3 className="text-sm md:text-base font-semibold text-slate-900 leading-snug">
                  {q.question}
                </h3>

                <div className="space-y-2 pt-1">
                  {q.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer text-xs md:text-sm transition ${
                        answers[q.id] === opt.id
                          ? 'border-emerald-600 bg-white font-medium shadow-sm'
                          : 'border-stone-200 bg-white hover:border-stone-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value={opt.id}
                        checked={answers[q.id] === opt.id}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                        className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading || Object.keys(answers).length < questions.length}
              className="w-full py-3.5 px-6 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-50 shadow-sm"
            >
              Submit Appropriateness Answers
            </button>
          </form>

          {testResult && !testResult.passed && (
            <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-rose-900 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>
                  Result: {testResult.score}/{questions.length} (4/{questions.length} required to pass)
                </span>
              </div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Review the explanations below before retrying the assessment:
              </p>
              <div className="space-y-2 text-xs text-slate-700">
                {testResult.explanations.map((exp, i) => (
                  <div key={i} className="p-3 bg-white rounded-xl border border-rose-200 space-y-1">
                    <span className="font-bold text-rose-950">Question {i + 1}: </span>
                    <span>{exp.explanation}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={handleRetryTest}
                  className="px-5 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry Test Now
                </button>
                <Link
                  href="/risk-summary"
                  className="px-5 py-2.5 border border-stone-300 bg-white hover:bg-stone-50 rounded-xl text-xs font-semibold text-slate-700 transition"
                >
                  Review Risk Summary
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: 24-Hour Cooling-Off Period (Active Countdown) */}
      {currentStep === 'cooling_off' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 text-center animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">24-Hour Cooling-Off Period</h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Under UK FCA rules for first-time investors, after you first ask to see investment
              offers, you cannot view the invest screen for 24 hours. This gives you time to reflect
              on the high risks involved.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 max-w-sm mx-auto space-y-1">
            <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              Cooling-Off Time Remaining
            </div>
            <div className="text-3xl font-mono font-bold text-slate-900">
              {formatCountdown(secondsLeft)}
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Once this cooling-off period elapses, you will be prompted to actively confirm that you wish
            to continue before you can allocate money.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/explore"
              className="px-6 py-2.5 border border-stone-200 hover:bg-stone-50 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Browse Opportunities
            </Link>

            <button
              onClick={handleSkipCoolingOff}
              disabled={loading}
              className="px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              <FastForward className="w-3.5 h-3.5" />
              Skip cooling-off (demo only)
            </button>
          </div>
        </div>
      )}

      {/* Step 4 (Part B): Active Confirmation "I want to continue" */}
      {currentStep === 'cooling_off_confirm' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 text-center animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7 text-emerald-700" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              Cooling-Off Period Concluded
            </h2>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Your 24-hour reflection period has ended. Under FCA rules, you must now actively confirm
              that you still want to proceed to the investment offers screen.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 max-w-md mx-auto text-left text-xs text-slate-700 space-y-2">
            <div className="font-semibold text-slate-900">Confirmation Checklist:</div>
            <div>✓ Understand that capital is at risk and returns are not guaranteed</div>
            <div>✓ Acknowledge that loan investments are illiquid</div>
            <div>✓ Confirm your investor categorisation declaration</div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleConfirmContinue}
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
            >
              <span>I want to continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <Link
              href="/explore"
              className="w-full sm:w-auto px-6 py-3 border border-stone-200 hover:bg-stone-50 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Not now
            </Link>
          </div>
        </div>
      )}

      {/* Ready State */}
      {currentStep === 'ready' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 text-center animate-in fade-in">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7 text-emerald-700" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">You Are Ready to Invest!</h2>
            <p className="text-xs text-slate-500">
              Personalised risk warning confirmed • Investor declaration complete • Appropriateness passed • Cooling-off confirmed.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 max-w-md mx-auto space-y-1.5 text-left">
            <div className="font-semibold text-emerald-950">Onboarding Verified:</div>
            <div>• Risk Warning: Acknowledged</div>
            <div>• Classification: {status.classification || 'Restricted Investor'}</div>
            <div>• Appropriateness Test: Passed ({status.appropriateness.score ?? 5}/5)</div>
            <div>• 24-Hour Cooling-Off: Completed & actively confirmed</div>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/explore"
              className="px-8 py-3 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition flex items-center gap-2 shadow-sm"
            >
              Start Exploring Opportunities
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
