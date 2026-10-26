import { RiskTierBadge } from '@/components/RiskTierBadge';
import { ClockService } from '@/lib/clock';

export default async function HomePage() {
  const simulatedTime = await ClockService.now();
  const formattedDate = simulatedTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-4 max-w-2xl mx-auto pt-6">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-slate-900">
          Start investing from £10. <br />
          <span className="text-emerald-700">Learn as you go.</span>
        </h1>
        <p className="text-slate-600 text-base md:text-lg leading-relaxed">
          Curated opportunities for low to moderate income households across the UK. Simple,
          transparent, and built with education at its core.
        </p>
      </section>

      {/* Milestone 1 System Status Card */}
      <section className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              System Foundations (Milestone 1)
            </h2>
            <p className="text-sm text-slate-500">
              Core architecture, simulated clock, auth, audit trail, and design system.
            </p>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Simulated Clock: {formattedDate}
          </div>
        </div>

        {/* Risk Tiers Design System Showcase */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Risk Tier Badges (Section 7.1)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Designed with non-reliant colors, explicit iconography, and clear plain-English labels.
          </p>
          <div className="flex flex-wrap gap-3">
            <RiskTierBadge tier="low" size="md" />
            <RiskTierBadge tier="medium" size="md" />
            <RiskTierBadge tier="high" size="md" />
            <RiskTierBadge tier="uncharted" size="md" />
          </div>
        </div>

        {/* Quick Demo Credentials */}
        <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">Demo Accounts Available:</p>
          <p>• Admin: <code>admin@atlas.demo</code></p>
          <p>• Compliance: <code>compliance@atlas.demo</code></p>
          <p>• Investors: <code>ready@atlas.demo</code>, <code>active@atlas.demo</code></p>
          <p className="text-slate-500 italic mt-1">Default demo password: <code>AtlasDemo!2026</code></p>
        </div>
      </section>
    </div>
  );
}
