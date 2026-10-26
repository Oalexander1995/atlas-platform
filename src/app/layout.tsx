import type { Metadata } from 'next';
import './globals.css';
import { DemoBanner } from '@/components/DemoBanner';
import { AppHeader } from '@/components/AppHeader';
import { MobileBottomNav } from '@/components/MobileBottomNav';
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
        <div className="sticky top-0 z-40 bg-white shadow-xs">
          <DemoBanner />
          <AppHeader currentUserEmail={session?.email || 'ready@atlas.demo'} />
        </div>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6 md:py-8 pb-24 md:pb-12">
          {children}
        </main>

        <MobileBottomNav />

        <footer className="border-t border-stone-200 py-8 text-xs text-slate-500 bg-stone-50 pb-24 md:pb-8">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div>
              <p className="font-semibold text-slate-700">Atlas Platform (Demo Build)</p>
              <p className="mt-0.5 text-slate-500">
                Simulated money only. Section 0 compliant. No real investments or bank transfers take place.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-600">
              <Link href="/risk-summary" className="hover:text-slate-900 transition underline underline-offset-2">
                Risk Summary (2 mins)
              </Link>
              <Link href="/provision-fund" className="hover:text-slate-900 transition underline underline-offset-2">
                Provision Fund
              </Link>
              <Link href="/learn" className="hover:text-slate-900 transition underline underline-offset-2">
                Learn Hub
              </Link>
              <Link href="/admin/opportunities" className="hover:text-slate-900 transition underline underline-offset-2">
                Admin Panel
              </Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
