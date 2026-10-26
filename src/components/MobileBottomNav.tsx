'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, Sparkles, PieChart, Wallet, BookOpen } from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/pitch', label: 'Pitch', icon: Sparkles },
    { href: '/portfolio', label: 'Portfolio', icon: PieChart },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/learn', label: 'Learn', icon: BookOpen },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-[#042016]/95 backdrop-blur-md border-t border-emerald-500/20 z-50 flex items-center justify-around px-2 py-2 shadow-lg"
    >
      {links.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-xs font-medium transition ${
              isActive
                ? 'text-emerald-300 font-bold'
                : 'text-emerald-100/60 hover:text-white'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition ${
                isActive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-emerald-100/60'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
