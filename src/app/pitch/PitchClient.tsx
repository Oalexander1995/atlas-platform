'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Coins,
  Clock,
  User,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Check,
} from 'lucide-react';
import { RiskTierBadge, RiskTier } from '@/components/RiskTierBadge';

export function PitchClient() {
  const router = useRouter();

  // Form states
  const [creatorName, setCreatorName] = useState('');
  const [creatorBio, setCreatorBio] = useState('');
  const [location, setLocation] = useState('Manchester, UK');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Property & Real Estate');
  const [summary, setSummary] = useState('');
  const [description, setDescription] = useState('');
  const [targetPounds, setTargetPounds] = useState('15000');
  const [expectedReturnPercent, setExpectedReturnPercent] = useState('6.5');
  const [termMonths, setTermMonths] = useState('12');
  const [riskTier, setRiskTier] = useState<RiskTier>('medium');
  const [risk1, setRisk1] = useState('Supply chain or material delays could push back the timeline.');
  const [risk2, setRisk2] = useState('Market demand or sales could be slower than anticipated.');
  const [risk3, setRisk3] = useState('Unexpected maintenance or repair costs could reduce profit.');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOppId, setCreatedOppId] = useState<string | null>(null);

  const categories = [
    'Property & Real Estate',
    'Clean Energy & Storage',
    'Tech & Digital Ventures',
    'Transport & Vehicle Fleets',
    'Smart Agriculture',
    'Specialist Equipment',
  ];

  // Quick preset templates for easy kid-friendly testing
  const applyPreset = (presetType: 'property' | 'energy' | 'tech') => {
    if (presetType === 'property') {
      setCreatorName('Marcus Vance (Property Renovator)');
      setCreatorBio('Experienced residential renovator with 4 successful house modernisations in Greater Manchester.');
      setLocation('Manchester, UK');
      setTitle('Manchester 2-Flat Victorian House Refurbishment');
      setCategory('Property & Real Estate');
      setSummary('Modernising a Victorian house into two energy-efficient apartments for long-term rental income.');
      setDescription('Funding pays for new kitchens, modern heat pumps, and insulation. Monthly rental income from vetted tenants will pay investors back their capital plus interest.');
      setTargetPounds('25000');
      setExpectedReturnPercent('6.5');
      setTermMonths('12');
      setRiskTier('medium');
      setRisk1('Renovation work could uncover hidden plumbing repairs.');
      setRisk2('Rental vacancy between tenancies could briefly delay cash flow.');
      setRisk3('Material prices for fixtures could rise slightly during building.');
    } else if (presetType === 'energy') {
      setCreatorName('Elena Rostova (CleanTech Engineer)');
      setCreatorBio('Renewable energy installer helping commercial buildings generate their own electricity.');
      setLocation('Bristol, UK');
      setTitle('Commercial Solar Roof Array & Battery Storage');
      setCategory('Clean Energy & Storage');
      setSummary('Mounting 48 commercial solar panels and lithium battery packs on a logistics warehouse.');
      setDescription('The business pays a fixed monthly energy fee that is cheaper than the National Grid. These contract payments repay investors their capital plus interest.');
      setTargetPounds('20000');
      setExpectedReturnPercent('5.0');
      setTermMonths('12');
      setRiskTier('low');
      setRisk1('Cloudy weather periods could temporarily reduce peak solar generation.');
      setRisk2('Component delivery for battery inverters could take an extra week.');
      setRisk3('Warehouse owner could change tenancy terms in year 3.');
    } else {
      setCreatorName('Tariq Khan (Robotics Specialist)');
      setCreatorBio('Robotics engineer building autonomous delivery rovers for university and hospital campuses.');
      setLocation('Leeds, UK');
      setTitle('Campus Autonomous Delivery Rovers Fleet (Batch of 8)');
      setCategory('Tech & Digital Ventures');
      setSummary('Building 8 autonomous delivery rovers to carry hot food and books around universities.');
      setDescription('Students and campus cafes pay a £1.50 delivery fee per trip. Revenue from over 200 daily trips repays investors over the 18-month term.');
      setTargetPounds('18000');
      setExpectedReturnPercent('9.0');
      setTermMonths('18');
      setRiskTier('high');
      setRisk1('Campus software updates could require rover recalibration.');
      setRisk2('Harsh winter weather could slow rover speeds outdoors.');
      setRisk3('Competition from bicycle couriers could reduce order volume.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/v1/opportunities/pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorName,
          creatorBio,
          location,
          title,
          category,
          summary,
          description,
          targetPounds,
          expectedReturnPercent,
          termMonths,
          riskTier,
          keyRisks: [risk1, risk2, risk3],
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit opportunity.');
      }

      setCreatedOppId(data.opportunityId);
    } catch (err: any) {
      setErrorMessage(err.message || 'Something went wrong. Please check your answers.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdOppId) {
    return (
      <div className="max-w-2xl mx-auto py-8 text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-800 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-sm">
          🎉
        </div>
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Opportunity Live on Atlas</span>
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Your Investment Opportunity is Live!
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-lg mx-auto leading-relaxed">
            Congratulations, <strong>{creatorName}</strong>! Your opportunity has been posted to the
            marketplace. Everyday people can now discover and invest in your project starting from £10.
          </p>
        </div>

        <div className="p-6 bg-white rounded-3xl border border-stone-200 shadow-sm max-w-md mx-auto text-left space-y-3">
          <div className="flex items-center justify-between">
            <RiskTierBadge tier={riskTier} size="sm" />
            <span className="text-xs font-mono text-slate-400">ID: {createdOppId.slice(0, 8)}</span>
          </div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-stone-100">
            <span>Target: <strong>£{Number(targetPounds).toLocaleString('en-GB')}</strong></span>
            <span>Return: <strong>{expectedReturnPercent}%/year</strong> (returns are not guaranteed)</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={`/opportunities/${createdOppId}`}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>View Opportunity Page</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/explore"
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-stone-100 hover:bg-stone-200 text-slate-800 font-bold text-sm transition"
          >
            Browse All Opportunities
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Raise Funding on Atlas</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Have an investment project? <br />
            Get it funded by everyday people.
          </h1>
          <p className="text-xs md:text-sm text-emerald-100/90 leading-relaxed">
            If you have a great project—like renovating a flat, putting solar panels on a building,
            or purchasing clean equipment—pitch it here. Everyday people pool money starting from £10
            to back you and share in the returns!
          </p>

          {/* Quick Preset Buttons for Evaluators */}
          <div className="pt-2">
            <p className="text-xs text-emerald-300 font-semibold mb-2">
              ⚡ Try a quick template to fill the form in 1 click:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('property')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center gap-1.5"
              >
                <span>🏠 Property Modernisation</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('energy')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center gap-1.5"
              >
                <span>☀️ Solar & Battery Array</span>
              </button>
              <button
                type="button"
                onClick={() => applyPreset('tech')}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center gap-1.5"
              >
                <span>🤖 Campus Delivery Rovers</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Pitch Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs md:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Section 1: The Creator & The Project */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h2 className="text-lg font-bold text-slate-900">About You & The Opportunity</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Name & Role (e.g. Person 1) *
              </label>
              <input
                type="text"
                required
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                placeholder="e.g. Marcus Vance (Property Developer)"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Location (Town or City) *
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Manchester, UK"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Your Background / Track Record (1-2 sentences)
            </label>
            <input
              type="text"
              value={creatorBio}
              onChange={(e) => setCreatorBio(e.target.value)}
              placeholder="e.g. 5 years of residential building and 3 previous refurbishments completed on time."
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Investment Opportunity Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Manchester 2-Flat Victorian House Refurbishment"
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Investment Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Quick Summary (1 sentence shown on cards) *
            </label>
            <input
              type="text"
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="e.g. Modernising a Victorian house into two energy-efficient apartments for long-term rental income."
              className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Section 2: Financial Details & Risk Level */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h2 className="text-lg font-bold text-slate-900">The Financials & Risk Level</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Funding Target (£) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  £
                </span>
                <input
                  type="number"
                  required
                  min="500"
                  max="100000"
                  step="500"
                  value={targetPounds}
                  onChange={(e) => setTargetPounds(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Min £500, max £100,000</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Proposed Return (%/year) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  required
                  min="2"
                  max="20"
                  step="0.5"
                  value={expectedReturnPercent}
                  onChange={(e) => setExpectedReturnPercent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  %
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Returns are not guaranteed</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Project Term (Months) *
              </label>
              <select
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="6">6 months</option>
                <option value="12">12 months (1 year)</option>
                <option value="18">18 months</option>
                <option value="24">24 months (2 years)</option>
                <option value="36">36 months (3 years)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Appropriate Risk Level *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'low', label: 'Low Risk', desc: 'Established asset or collateral' },
                { id: 'medium', label: 'Medium Risk', desc: 'Standard business project' },
                { id: 'high', label: 'High Risk', desc: 'New venture or startup' },
                { id: 'uncharted', label: 'Uncharted', desc: 'Experimental (£100 cap)' },
              ].map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => setRiskTier(tier.id as RiskTier)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    riskTier === tier.id
                      ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100'
                  }`}
                >
                  <RiskTierBadge tier={tier.id as RiskTier} size="sm" />
                  <span className="text-[11px] text-slate-500 mt-2">{tier.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section 3: The Investment Plan & Risks */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
              3
            </span>
            <h2 className="text-lg font-bold text-slate-900">How You Will Repay Investors & Risks</h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Plan: How does this investment produce money to pay investors back? *
            </label>
            <textarea
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain simply: What will the funds purchase? When does it start producing revenue? How do investors receive their capital and interest?"
              className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              List 3 Honest Risks (What could go wrong?) *
            </label>
            <div>
              <input
                type="text"
                required
                value={risk1}
                onChange={(e) => setRisk1(e.target.value)}
                placeholder="Risk 1 (e.g. Contractor delays)"
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <input
                type="text"
                required
                value={risk2}
                onChange={(e) => setRisk2(e.target.value)}
                placeholder="Risk 2 (e.g. Higher supply costs)"
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <input
                type="text"
                required
                value={risk3}
                onChange={(e) => setRisk3(e.target.value)}
                placeholder="Risk 3 (e.g. Slower tenant uptake)"
                className="w-full px-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500">
            <span>By publishing, this opportunity becomes live in the demo marketplace.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm md:text-base rounded-2xl shadow-sm transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Publishing Opportunity...</span>
            ) : (
              <>
                <span>Publish Investment Opportunity</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
