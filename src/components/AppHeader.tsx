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
    <header className="border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:bg-emerald-800 transition">
            A
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-slate-900 leading-tight">
              Atlas
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              Micro-Investing Demo
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-lg transition ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-stone-50'
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
            className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 transition"
            aria-expanded={showUserMenu}
            aria-label="Demo account switcher"
          >
            <div className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
              {currentUserEmail.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:inline truncate max-w-[130px]">
              {currentUserEmail.split('@')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Account Dropdown */}
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 p-2 z-50 text-xs animate-in fade-in slide-in-from-top-1"
              onMouseLeave={() => setShowUserMenu(false)}
            >
              <div className="px-3 py-2 border-b border-stone-100 mb-1">
                <p className="font-semibold text-slate-800">Demo Account Switcher</p>
                <p className="text-[11px] text-slate-500">
                  Switch personas to test different platform journeys
                </p>
              </div>

              <div className="space-y-1">
                {demoAccounts.map((acc) => (
                  <Link
                    key={acc.email}
                    href={acc.href}
                    onClick={() => setShowUserMenu(false)}
                    className="block px-3 py-2 rounded-xl hover:bg-emerald-50 transition group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 group-hover:text-emerald-800">
                        {acc.name}
                      </span>
                      <span className="text-[10px] text-emerald-700 font-mono">
                        {acc.email}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">{acc.role}</p>
                  </Link>
                ))}
              </div>

              <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between px-2 text-[11px]">
                <Link
                  href="/onboarding"
                  onClick={() => setShowUserMenu(false)}
                  className="text-emerald-700 font-medium hover:underline flex items-center gap-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Safety Check</span>
                </Link>
                <Link
                  href="/admin/opportunities"
                  onClick={() => setShowUserMenu(false)}
                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
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
