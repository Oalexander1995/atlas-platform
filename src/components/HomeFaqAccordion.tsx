'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle, ArrowRight, ShieldCheck, Coins, Users, Building2, Sparkles, Scale } from 'lucide-react';

interface FaqItem {
  id: string;
  icon: React.ElementType;
  question: string;
  answer: string;
  badge?: string;
}

export function HomeFaqAccordion() {
  const [openId, setOpenId] = useState<string | null>('can-invest-10');

  const faqs: FaqItem[] = [
    {
      id: 'can-invest-10',
      icon: Coins,
      question: 'Can I really start investing with as little as £10?',
      answer:
        'Yes. Historically, commercial real estate, clean solar arrays, and medical equipment leases required hundreds of thousands of pounds upfront—locking out regular households. Atlas slices institutional-scale investments into accessible £10 micro-units. You can invest as little as £10 up to the £1,000 Atlas platform limit per project, allowing you to build a well-diversified portfolio.',
      badge: 'Low Barriers',
    },
    {
      id: 'how-crowd-pools',
      icon: Users,
      question: 'How do people pool together to raise funds for projects?',
      answer:
        'When a project owner needs funding to modernise an 8-apartment building or install a commercial solar farm, they submit their proposal on Atlas. Everyday investors join the syndicate with small amounts (£10 up to the £1,000 platform limit). Once the syndicate reaches 100% of its goal, funds are released in staged milestones. Tenant rents or energy revenue are collected monthly and distributed directly back to all co-investors in proportion to their contribution.',
      badge: 'The Power of Pooling',
    },
    {
      id: 'what-if-struggles',
      icon: ShieldCheck,
      question: 'What happens if a borrower or project runs into difficulties?',
      answer:
        'Every project funded on Atlas is secured by a first legal charge or commercial debenture registered at UK Companies House over the underlying physical asset. If a borrower struggles to make payments, independent chartered recovery professionals work to recover capital. Furthermore, Atlas maintains a discretionary Provision Fund (supported by 1% of every raise) designed to help cushion unexpected shortfalls on eligible syndicates. The Provision Fund is discretionary, has no guarantee of payment, and may not cover all losses.',
      badge: 'Asset Security',
    },
    {
      id: 'why-not-banks',
      icon: Building2,
      question: 'Why do project owners come to Atlas instead of high-street banks?',
      answer:
        'Commercial banks are notoriously rigid and slow, often taking 6 to 9 months for loan committees while demanding onerous personal guarantees or rejecting viable projects due to bureaucratic criteria. Atlas offers viable entrepreneurs fast, merit-based execution, transparent covenant terms, and an engaged community of co-investors who actively champion their project.',
      badge: 'Two-Sided Market',
    },
    {
      id: 'how-atlas-makes-money',
      icon: Scale,
      question: 'How does Atlas make money? Are there hidden fees for investors?',
      answer:
        'Investors pay 0% fees. Opening an account, depositing, holding, and withdrawing returns is completely free for investors. Atlas generates revenue exclusively from borrowers: borrowers pay an arrangement fee of 2.0% upon successful raise completion and an annual platform servicing fee of 0.5%. In addition, 1.0% of each raise goes directly to the Provision Fund. There are no hidden fees or exit charges for investors.',
      badge: 'Transparent Fees',
    },
    {
      id: 'who-can-pitch',
      icon: Sparkles,
      question: 'Who can pitch a project on Atlas?',
      answer:
        'Any UK company, property developer, clean energy sponsor, or venture owner with a viable, revenue-generating commercial proposition can submit a pitch. You must provide financial projections, proof of identity, planning permissions (if applicable), and agree to our rigorous 4-stage independent diligence process. Pitching takes less than 5 minutes online.',
      badge: 'Open Applications',
    },
  ];

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/15 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white">
          Everything You Need to Know
        </h2>
        <p className="text-xs sm:text-sm text-emerald-200/80 max-w-xl mx-auto">
          Plain-English answers about how everyday people pool funds, how projects are protected, and how our marketplace works.
        </p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3 pt-2">
        {faqs.map((faq) => {
          const isOpen = openId === faq.id;
          const Icon = faq.icon;

          return (
            <div
              key={faq.id}
              className={`rounded-2xl border transition duration-200 overflow-hidden ${
                isOpen
                  ? 'bg-[#031c13] border-emerald-400/60 shadow-lg shadow-emerald-950/50'
                  : 'bg-[#031c13]/70 border-emerald-500/20 hover:border-emerald-500/40'
              }`}
            >
              <button
                onClick={() => toggle(faq.id)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 text-white focus:outline-none"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition ${
                      isOpen
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white leading-snug">
                      {faq.question}
                    </h3>
                    {faq.badge && (
                      <span className="text-[10px] font-semibold text-emerald-400/90 tracking-wide uppercase mt-0.5 inline-block">
                        {faq.badge}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 bg-emerald-500/20 text-emerald-300' : 'text-emerald-300/60'
                  }`}
                >
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-emerald-100/85 leading-relaxed border-t border-emerald-500/15 animate-in fade-in duration-200">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <Link
          href="/help"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-300 hover:text-emerald-200 transition"
        >
          <span>Have more questions? Visit our comprehensive Help Centre</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
