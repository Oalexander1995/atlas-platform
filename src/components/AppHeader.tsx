'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NotificationsBell } from './NotificationsBell';
import {
  ShieldCheck,
  ChevronDown,
  User,
  Sliders,
  Sparkles,
  Compass,
  PieChart,
  Wallet,
  BookOpen,
  Gift,
} from 'lucide-react';

interface AppHeaderProps {
  currentUserEmail?: string;
}

export function AppHeader({ currentUserEmail = 'ready@atlas.demo' }: AppHeaderProps) {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const navLinks = [
    { href: '/explore', label: 'Explore', icon: Compass },
    { href: '/pitch', label: 'Pitch Project', icon: Sparkles },
    { href: '/auto-invest', label: 'Auto-Invest', icon: Sparkles },
    { href: '/portfolio', label: 'Portfolio', icon: PieChart },
    { href: '/wallet', label: 'Wallet', icon: Wallet },
    { href: '/learn', label: 'Learn', icon: BookOpen },
    { href: '/rewards', label: 'Prize Draw', icon: Gift },
    { href: '/provision-fund', label: 'Provision Fund', icon: ShieldCheck },
  ];

  const demoAccounts = [
    {
      name: 'Alex (Ready)',
      email: 'ready@atlas.demo',
      role: 'Investor with £250 demo wallet',
      href: '/wallet',
    },
    {
      name: 'Jordan (Active)',
      email: 'active@atlas.demo',
      role: 'Active portfolio & holdings',
      href: '/portfolio?user=active@atlas.demo',
    },
    {
      name: 'Platform Admin',
      email: 'admin@atlas.demo',
      role: 'Create opportunities & view ledger',
      href: '/admin/opportunities',
    },
    {
      name: 'Compliance Officer',
      email: 'compliance@atlas.demo',
      role: 'Review AI conversations & audit trail',
      href: '/admin/compliance',
    },
  ];

  return (
    <header className="border-b border-emerald-500/20 bg-[#042016]/95 backdrop-blur-md text-white">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm group-hover:bg-emerald-300 transition">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-lg tracking-tight text-white leading-tight">
              Atlas
            </span>
            <span className="text-[10px] text-emerald-300 font-medium tracking-wide">
              Micro-Investing Demo
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            const isPitch = link.href === '/pitch';

            if (isPitch) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-xs'
                      : 'bg-amber-400/15 text-amber-300 hover:bg-amber-400/25 border border-amber-400/30 font-semibold'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-xl transition ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-emerald-100/75 hover:text-white hover:bg-emerald-900/40'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Notifications + Demo Account Switcher */}
        <div className="flex items-center gap-2">
          <NotificationsBell />
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-emerald-950/60 hover:bg-emerald-900/80 text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-500/30 transition"
              aria-expanded={showUserMenu}
              aria-label="Demo account switcher"
            >
              <div className="w-5 h-5 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                {currentUserEmail.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline truncate max-w-[130px] text-emerald-100 font-medium">
                {currentUserEmail.split('@')[0]}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-300" />
            </button>

            {/* Account Dropdown */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-72 bg-[#031c13] rounded-2xl shadow-2xl border border-emerald-500/30 p-2 z-50 text-xs text-white animate-in fade-in slide-in-from-top-1"
                onMouseLeave={() => setShowUserMenu(false)}
              >
                <div className="px-3 py-2 border-b border-emerald-500/20 mb-1">
                  <p className="font-semibold text-white">Demo Account Switcher</p>
                  <p className="text-[11px] text-emerald-200/70">
                    Switch personas to test different platform journeys
                  </p>
                </div>

                <div className="space-y-1">
                  {demoAccounts.map((acc) => (
                    <Link
                      key={acc.email}
                      href={acc.href}
                      onClick={() => setShowUserMenu(false)}
                      className="block px-3 py-2 rounded-xl hover:bg-emerald-900/40 transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white group-hover:text-emerald-300">
                          {acc.name}
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {acc.email}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-200/70 mt-0.5">{acc.role}</p>
                    </Link>
                  ))}
                </div>

                <div className="pt-2 mt-2 border-t border-emerald-500/20 flex items-center justify-between px-2 text-[11px]">
                  <Link
                    href="/onboarding"
                    onClick={() => setShowUserMenu(false)}
                    className="text-emerald-400 font-medium hover:underline flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Safety Check</span>
                  </Link>
                  <Link
                    href="/admin/opportunities"
                    onClick={() => setShowUserMenu(false)}
                    className="text-emerald-200/70 hover:text-white flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Admin Hub</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
