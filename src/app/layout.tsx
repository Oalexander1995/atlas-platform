import type { Metadata } from 'next';
import './globals.css';
import { DemoBanner } from '@/components/DemoBanner';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Atlas — Micro-Investing for Everyone',
  description: 'Curated micro-investment platform for UK households. Demo with simulated money.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen flex flex-col bg-[#fdfbf7] text-slate-900">
        <DemoBanner />
        <header className="border-b border-stone-200 bg-white/80 backdrop-blur sticky top-[37px] z-40">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-bold text-lg group-hover:bg-emerald-800 transition">
                A
              </div>
              <span className="font-semibold text-xl tracking-tight text-slate-900">
                Atlas
              </span>
            </Link>
            <nav className="flex items-center gap-3 md:gap-6 text-sm font-medium">
              <Link
                href="/explore"
                className="text-slate-600 hover:text-slate-900 transition"
              >
                Explore
              </Link>
              <Link
                href="/onboarding"
                className="text-slate-600 hover:text-slate-900 transition"
              >
                Onboarding
              </Link>
              <Link
                href="/portfolio"
                className="text-slate-600 hover:text-slate-900 transition"
              >
                Portfolio
              </Link>
              <Link
                href="/learn"
                className="text-slate-600 hover:text-slate-900 transition"
              >
                Learn
              </Link>
              <Link
                href="/wallet"
                className="text-slate-600 hover:text-slate-900 transition"
              >
                Wallet
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-stone-200 py-6 text-center text-xs text-slate-500 bg-stone-50">
          <p>Atlas Platform (Demo Build) — Simulated money only. Section 0 compliant.</p>
        </footer>
      </body>
    </html>
  );
}
