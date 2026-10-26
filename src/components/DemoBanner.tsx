import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function DemoBanner() {
  return (
    <div
      role="banner"
      className="bg-amber-500 text-slate-950 font-medium px-4 py-2 text-center text-xs md:text-sm flex items-center justify-center gap-2 border-b border-amber-600 shadow-sm sticky top-0 z-50 tracking-wide"
    >
      <AlertTriangle className="w-4 h-4 text-slate-950 flex-shrink-0" aria-hidden="true" />
      <span>
        <strong>DEMO</strong> — simulated money. No real investments are made.
      </span>
    </div>
  );
}
