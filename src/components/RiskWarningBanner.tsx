import React from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export function RiskWarningBanner() {
  return (
    <div
      role="region"
      aria-label="Statutory Investment Risk Warning"
      className="bg-amber-50 border-2 border-amber-500/80 rounded-2xl p-4 md:p-5 shadow-sm text-slate-900 my-4"
    >
      <div className="flex items-start gap-3.5">
        <AlertCircle className="w-6 h-6 text-amber-700 flex-shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm md:text-base leading-relaxed font-normal">
          <strong className="font-semibold text-slate-950">
            Don&apos;t invest unless you&apos;re prepared to lose all the money you invest.
          </strong>{' '}
          This is a high-risk investment and you are unlikely to be protected if something goes wrong.{' '}
          <Link
            href="/risk-summary"
            className="font-semibold underline underline-offset-4 text-emerald-800 hover:text-emerald-950 hover:bg-emerald-100/60 rounded px-1 py-0.5 transition inline-block"
          >
            Take 2 mins to learn more
          </Link>
        </div>
      </div>
    </div>
  );
}
