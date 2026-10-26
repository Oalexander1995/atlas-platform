import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, Eye, ShieldCheck, Database, Trash2, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacy Policy — Atlas Micro-Investing',
  description: 'How Atlas protects your personal data under UK GDPR. Plain English policy.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider mb-3">
          <Lock className="w-4 h-4 text-emerald-600" />
          <span>Privacy Policy</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
          How We Protect Your Privacy
        </h1>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          Last updated: October 2026. We believe in total transparency. We do not sell your personal
          details, and we only collect what is strictly necessary to run your demo account.
        </p>
      </div>

      {/* Privacy Content Cards */}
      <div className="space-y-6">
        {/* Card 1 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">1. Information We Collect</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            In this prototype demo, we collect only simulated information necessary to test the
            investment platform:
          </p>
          <ul className="text-xs md:text-sm text-slate-700 space-y-2 list-disc list-inside pl-2">
            <li>
              <strong>Account Information:</strong> Your demo email address and simulated identity details.
            </li>
            <li>
              <strong>Investor Profile:</strong> Your answers to the regulatory appropriateness questionnaire.
            </li>
            <li>
              <strong>Activity & Ledger:</strong> Simulated deposits, investments, repayments, points earned, and AI coach conversations.
            </li>
            <li>
              <strong>Technical Data:</strong> Essential session cookies used to keep you signed in. We do not use third-party advertising cookies or cross-site trackers.
            </li>
          </ul>
        </section>

        {/* Card 2 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">2. How We Use and Store Your Data</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            All data in this demo is stored in an embedded, local database on this host machine. We
            use this information solely to:
          </p>
          <ul className="text-xs md:text-sm text-slate-700 space-y-2 list-disc list-inside pl-2">
            <li>Simulate double-entry accounting balances and portfolio holdings.</li>
            <li>Enforce safety limits and mandatory 24-hour cooling-off intervals.</li>
            <li>Maintain an immutable audit trail for compliance verification.</li>
            <li>Improve educational content and AI coach explanations.</li>
          </ul>
        </section>

        {/* Card 3 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">3. Your Rights Under UK GDPR</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            Under United Kingdom data protection law (UK GDPR and Data Protection Act 2018), you
            have clear rights regarding your personal information:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="font-semibold text-slate-900 text-xs">Right to Access</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Request a full copy of the data we hold about your account.
              </p>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="font-semibold text-slate-900 text-xs">Right to Rectification</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Ask us to correct any inaccurate or incomplete details.
              </p>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="font-semibold text-slate-900 text-xs">Right to Erasure</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Request that we delete your account and personal history.
              </p>
            </div>
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-100">
              <p className="font-semibold text-slate-900 text-xs">Right to Portability</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Export your transaction and holding records in standard CSV format.
              </p>
            </div>
          </div>
        </section>

        {/* Card 4 */}
        <section className="bg-white rounded-2xl p-6 border border-stone-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">4. Contact Our Data Protection Team</h2>
          </div>
          <p className="text-xs md:text-sm text-slate-700 leading-relaxed">
            If you have questions about how we handle your information or wish to exercise any of
            your statutory rights, please contact our Data Protection Officer at:
          </p>
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
            <p className="font-semibold">Atlas Privacy & Data Office</p>
            <p className="mt-0.5">Email: privacy@atlas.demo</p>
            <p className="mt-0.5">Address: Atlas Micro-Investing, London, United Kingdom</p>
          </div>
        </section>
      </div>

      {/* Footer bar */}
      <div className="p-5 bg-stone-100 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-4 text-xs">
        <span className="text-slate-600 font-medium">Looking for platform terms or help?</span>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-emerald-700 font-semibold hover:underline">
            Terms of Use
          </Link>
          <Link href="/help" className="text-slate-700 font-semibold hover:underline">
            Help Centre
          </Link>
        </div>
      </div>
    </div>
  );
}
