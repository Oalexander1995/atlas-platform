import type { Metadata } from 'next';
import './globals.css';
import { DemoBanner } from '@/components/DemoBanner';
import { AppHeader } from '@/components/AppHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { AiCoachDrawer } from '@/components/AiCoachDrawer';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Atlas — Micro-Investing for Everyone',
  description: 'Curated micro-investment platform for UK households. Demo with simulated money.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  return (
    <html lang="en-GB">
      <body className="min-h-screen flex flex-col bg-[#fdfbf7] text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-800 focus:text-white focus:rounded-xl focus:shadow-lg focus:font-semibold text-xs"
        >
          Skip to main content
        </a>
        <div className="sticky top-0 z-40 bg-white shadow-xs">
          <DemoBanner />
          <AppHeader currentUserEmail={session?.email || 'ready@atlas.demo'} />
        </div>

        <main
          id="main-content"
          className="flex-1 w-full pb-24 md:pb-12"
        >
          {children}
        </main>

        <MobileBottomNav />
        <AiCoachDrawer />

        <footer
          role="contentinfo"
          className="border-t border-emerald-900/40 py-10 text-xs text-emerald-200/70 bg-[#02130d] pb-28 md:pb-12"
        >
          <div className="max-w-6xl mx-auto px-4 space-y-6">
            {/* Statutory Risk Warning Bar (Section 3.1) */}
            <div className="p-4 bg-amber-500/10 border border-amber-400/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200">
              <div className="space-y-0.5">
                <p className="font-bold text-amber-300 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                  Statutory Regulatory Warning (Section 3.1)
                </p>
                <p className="text-xs text-white/90 leading-relaxed max-w-3xl">
                  Don&apos;t invest unless you&apos;re prepared to lose all the money you invest.
                  This is a high-risk investment and you are unlikely to be protected if something
                  goes wrong.
                </p>
              </div>
              <Link
                href="/risk-summary"
                className="whitespace-nowrap px-3.5 py-1.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-semibold rounded-xl text-xs transition self-start sm:self-auto border border-amber-400/40"
              >
                Take 2 mins to learn more →
              </Link>
            </div>

            {/* Footer Navigation and Disclaimers */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left pt-2">
              <div>
                <p className="font-bold text-white text-sm">Atlas Platform</p>
                <p className="mt-1 text-emerald-200/60 max-w-md leading-relaxed text-[11px]">
                  Curated micro-investing demo for UK households. Section 0 compliant. Simulated
                  money only — no real financial transactions take place.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-emerald-100/70 font-medium">
                <Link
                  href="/help"
                  className="hover:text-emerald-300 transition underline underline-offset-2"
                >
                  Help & FAQs
                </Link>
                <Link
                  href="/terms"
                  className="hover:text-emerald-300 transition underline underline-offset-2"
                >
                  Terms of Use
                </Link>
                <Link
                  href="/privacy"
                  className="hover:text-emerald-300 transition underline underline-offset-2"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/risk-summary"
                  className="hover:text-emerald-300 transition underline underline-offset-2"
                >
                  Risk Summary
                </Link>
                <Link
                  href="/provision-fund"
                  className="hover:text-emerald-300 transition underline underline-offset-2"
                >
                  Provision Fund
                </Link>
                <Link
                  href="/learn"
                  className="hover:text-emerald-300 transition underline underline-offset-2"
                >
                  Learn Hub
                </Link>
                <Link
                  href="/admin/opportunities"
                  className="hover:text-emerald-300 transition underline underline-offset-2"
                >
                  Admin Hub
                </Link>
                <Link
                  href="/admin/compliance"
                  className="hover:text-emerald-300 transition underline underline-offset-2"
                >
                  Compliance
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
