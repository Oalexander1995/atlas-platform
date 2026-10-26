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
  const [kycChecking, setKycChecking] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);

  // Classification state
  const [selectedClass, setSelectedClass] = useState<'restricted' | 'high_net_worth' | 'sophisticated'>('restricted');

  // Appropriateness state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [testResult, setTestResult] = useState<{
    score: number;
    passed: boolean;
    explanations: Array<{ questionId: number; correct: boolean; explanation: string }>;
  } | null>(null);

  // Countdown timer for cooling off
  const [secondsLeft, setSecondsLeft] = useState(initialStatus.coolingOff.secondsRemaining);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  // Load questions when user reaches appropriateness step
  useEffect(() => {
    if (status.nextStep === 'appropriateness' && questions.length === 0) {
      fetch('/api/v1/onboarding/appropriateness')
        .then((res) => res.json())
        .then((data) => {
          if (data.data) setQuestions(data.data);
        });
    }
  }, [status.nextStep, questions.length]);

  const refreshStatus = async () => {
    const res = await fetch('/api/v1/onboarding/status');
    const json = await res.json();
    if (json.data) {
      setStatus(json.data);
      setSecondsLeft(json.data.coolingOff.secondsRemaining);
    }
  };

  // Step 1: Simulated KYC
  const runSimulatedKyc = (fail = false) => {
    setKycChecking(true);
    setKycError(null);

    setTimeout(async () => {
      try {
        const res = await fetch('/api/v1/onboarding/kyc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testName: fail ? 'FAIL KYC' : userFullName }),
        });
        const json = await res.json();
        if (!json.data.verified) {
          setKycError(json.data.message);
        } else {
          await refreshStatus();
        }
      } catch (err: any) {
        setKycError(err.message || 'KYC error');
      } finally {
        setKycChecking(false);
      }
    }, 2000); // 2-second simulated check (PRD 5.2)
  };

  // Step 2: Investor Classification
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

  // Demo: Fast Forward Time
  const handleFastForward24Hours = async () => {
    setLoading(true);
    try {
      await fetch('/api/v1/admin/time/fast-forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hours: 25 }),
      });
      await refreshStatus();
    } finally {
      setLoading(false);
    }
  };

  // Stepper steps
  const steps = [
    { id: 'kyc', label: '1. Identity', done: status.isKycVerified },
    { id: 'classification', label: '2. Investor Type', done: Boolean(status.classification) },
    { id: 'appropriateness', label: '3. Knowledge Check', done: status.appropriateness.passed },
    { id: 'cooling_off', label: '4. Cooling-off', done: !status.coolingOff.active && status.appropriateness.passed },
    { id: 'ready', label: '5. Ready', done: status.isReadyToInvest },
  ];

  const formatCountdown = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const minutes = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hours}h ${minutes}m ${s}s`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-4">
      {/* Stepper Progress Bar */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-stone-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Investor Onboarding</span>
          <span className="text-emerald-700">
            {steps.filter((s) => s.done).length} of {steps.length} steps complete
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {steps.map((step) => (
            <div key={step.id} className="space-y-1">
              <div
                className={`h-2 rounded-full transition-all ${
                  step.done ? 'bg-emerald-600' : status.nextStep === step.id ? 'bg-amber-500' : 'bg-stone-200'
                }`}
              />
              <div className="text-[10px] md:text-xs font-medium text-slate-600 truncate">{step.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Identity (Simulated KYC) */}
      {status.nextStep === 'kyc' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              1
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Check Your Identity</h2>
              <p className="text-xs text-slate-500">Quick simulated identity verification for the demo.</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            In a real app, we check names against the UK electoral roll. For this demo, clicking the button below runs a 2-second simulated check.
          </p>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 text-xs space-y-1 text-slate-700">
            <div>Name: <strong>{userFullName}</strong></div>
            <div>Email: <strong>{userEmail}</strong></div>
          </div>

          {kycError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600" />
              <span>{kycError}</span>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => runSimulatedKyc(false)}
              disabled={kycChecking}
              className="flex-1 py-3 px-6 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {kycChecking ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking your identity…
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Verify My Identity (Demo)
                </>
              )}
            </button>

            <button
              onClick={() => runSimulatedKyc(true)}
              disabled={kycChecking}
              className="py-3 px-4 border border-rose-200 text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-semibold transition"
              title="Test KYC failure state"
            >
              Test Failure
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Investor Classification */}
      {status.nextStep === 'classification' && (
        <form onSubmit={handleClassificationSubmit} className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              2
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Choose Your Investor Type</h2>
              <p className="text-xs text-slate-500">Required UK regulatory classification (COBS 4.12A).</p>
            </div>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            Please choose the statement that best describes you. Most everyday retail investors select <strong>Restricted Investor</strong>.
          </p>

          <div className="space-y-3">
            {/* Restricted Investor */}
            <label
              className={`block p-4 rounded-2xl border cursor-pointer transition ${
                selectedClass === 'restricted'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
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
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-slate-900">Restricted Investor (Recommended)</div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    &ldquo;In the past 12 months I have not invested more than 10% of my net assets in high-risk investments, and I will not do so in the next 12 months.&rdquo;
                  </div>
                </div>
              </div>
            </label>

            {/* High Net Worth */}
            <label
              className={`block p-4 rounded-2xl border cursor-pointer transition ${
                selectedClass === 'high_net_worth'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
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
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-slate-900">High Net Worth Investor</div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    I self-certify that I have an annual income of £100,000+ or net assets of £250,000+ (excluding main home and pension).
                  </div>
                </div>
              </div>
            </label>

            {/* Sophisticated */}
            <label
              className={`block p-4 rounded-2xl border cursor-pointer transition ${
                selectedClass === 'sophisticated'
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
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
                <div className="space-y-1">
                  <div className="font-semibold text-sm text-slate-900">Sophisticated Investor</div>
                  <div className="text-xs text-slate-600 leading-relaxed">
                    I self-certify that I have qualified private investing experience or work in private finance.
                  </div>
                </div>
              </div>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-50"
          >
            Confirm Classification
          </button>
        </form>
      )}

      {/* Step 3: Appropriateness Test */}
      {status.nextStep === 'appropriateness' && (
        <div className="space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Knowledge Check</h2>
                <p className="text-xs text-slate-500">5 quick questions. Pass mark: 4 out of 5.</p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              Before you can invest, UK regulations require a short check to make sure you understand the risks of lending money to businesses.
            </p>

            {!status.appropriateness.canAttempt ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-4">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-sm">
                  <Clock className="w-5 h-5 text-amber-700" />
                  <span>24-Hour Wait Active</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  You did not pass the knowledge check on your last attempt. Under UK rules, you must wait 24 hours to review the materials before trying again.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href="/risk-summary"
                    className="px-4 py-2 bg-amber-200 text-amber-950 rounded-xl text-xs font-semibold hover:bg-amber-300 transition"
                  >
                    Read Risk Summary
                  </Link>
                  <button
                    onClick={handleFastForward24Hours}
                    disabled={loading}
                    className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition flex items-center gap-1.5"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    Skip Wait (Demo Fast-Forward)
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleTestSubmit} className="space-y-6 pt-2">
                {questions.map((q, idx) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                    <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Question {idx + 1} of 5
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
                  className="w-full py-3.5 px-6 bg-emerald-700 text-white rounded-xl font-semibold text-sm hover:bg-emerald-800 transition disabled:opacity-50"
                >
                  Submit Knowledge Check
                </button>
              </form>
            )}

            {testResult && !testResult.passed && (
              <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 space-y-3">
                <div className="font-bold text-rose-900 text-sm">
                  Score: {testResult.score}/5 (Needs 4/5 to pass)
                </div>
                <div className="space-y-2 text-xs text-rose-800">
                  {testResult.explanations.map((exp, i) => (
                    <div key={i} className="p-2.5 bg-white/80 rounded-xl border border-rose-200">
                      <strong>Question {i + 1}:</strong> {exp.explanation}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 4: Cooling-Off Period (Section 3.4) */}
      {status.nextStep === 'cooling_off' && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-5 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">24-Hour Cooling-Off Period</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Under UK FCA rules for first-time investors, you must wait 24 hours after passing the knowledge check before your first investment is accepted.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-stone-50 border border-stone-200 max-w-sm mx-auto space-y-1">
            <div className="text-xs text-slate-500 font-medium">Time Remaining</div>
            <div className="text-2xl md:text-3xl font-mono font-bold text-slate-900">
              {formatCountdown(secondsLeft)}
            </div>
          </div>

          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            This gives you time to reflect and make sure investing in loans is right for you. While you wait, you can explore opportunities or practice with demo money in your wallet.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/explore"
              className="px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-semibold hover:bg-emerald-800 transition"
            >
              Browse Opportunities
            </Link>

            <button
              onClick={handleFastForward24Hours}
              disabled={loading}
              className="px-6 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-black transition flex items-center gap-1.5"
            >
              <FastForward className="w-4 h-4 text-amber-400" />
              Fast-Forward 24 Hours (Demo)
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Ready to Invest */}
      {status.isReadyToInvest && (
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-stone-200 shadow-sm space-y-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Award className="w-7 h-7 text-emerald-700" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">You Are Ready to Invest!</h2>
            <p className="text-xs text-slate-500">
              Identity verified • Restricted Investor declared • Knowledge check passed • Cooling-off complete.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 max-w-md mx-auto space-y-1 text-left">
            <div className="font-semibold">All Onboarding Steps Complete:</div>
            <div>• Identity check: Verified (Demo)</div>
            <div>• Classification: {status.classification}</div>
            <div>• Appropriateness test: Passed ({status.appropriateness.score}/5)</div>
            <div>• Cooling-off period: Completed</div>
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
