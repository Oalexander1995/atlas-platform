'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  Search,
  ShieldAlert,
  Coins,
  Building,
  Award,
  Scale,
  ExternalLink,
  ChevronDown,
  Mail,
  Phone,
  Compass,
} from 'lucide-react';

interface FaqItem {
  id: string;
  category: 'general' | 'risk' | 'limits' | 'rewards' | 'complaints';
  question: string;
  answer: string;
  highlight?: string;
}

export function HelpClient() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'what-is-atlas': true,
    'fscs-protection': true,
  });

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const categories = [
    { id: 'all', label: 'All Topics', icon: HelpCircle },
    { id: 'general', label: 'Getting Started', icon: Compass },
    { id: 'risk', label: 'Safety & Risks', icon: ShieldAlert },
    { id: 'limits', label: 'Rules & Limits', icon: Coins },
    { id: 'rewards', label: 'Points & Prizes', icon: Award },
    { id: 'complaints', label: 'Complaints & FOS', icon: Scale },
  ];

  const faqs: FaqItem[] = [
    {
      id: 'what-is-atlas',
      category: 'general',
      question: 'What is Atlas and how does it work?',
      answer:
        'Atlas is a co-investment syndicate marketplace built for everyday UK households: Big investments, Small barriers. We connect viable project owners and entrepreneurs (such as residential modernisations, commercial solar farms, EV charging hubs, and NHS medical equipment) with everyday people pooling small amounts from £10 up to £1,000. By pooling 1,000 everyday investors together, we raise £1,000,000 to fund high-impact assets that traditionally only institutions could access.',
    },
    {
      id: 'vetting-process-faq',
      category: 'general',
      question: 'How are projects vetted before appearing on Atlas?',
      answer:
        'Every project passes 4 strict independent diligence gates before approval: identity & fraud screening, cash-flow stress testing by chartered accountants, physical asset surveys by RICS surveyors, and legal debenture structuring by commercial solicitors. Fewer than 5% of pitched projects pass our vetting tests.',
      highlight: 'Strict 4-stage independent diligence with a <5% acceptance rate.',
    },
    {
      id: 'pitching-faq',
      category: 'general',
      question: 'Who can pitch a project to raise funds on Atlas?',
      answer:
        'Any UK company, property renovator, or enterprise with a viable commercial project can pitch at /pitch. If traditional high-street banks are too slow or inflexible, Atlas provides transparent terms and a community of co-investors ready to back viable proposals.',
    },
    {
      id: 'simulated-money',
      category: 'general',
      question: 'Is this real money or a demo?',
      answer:
        'This website is an interactive prototype using simulated money. No real bank accounts, real card payments, or actual investments take place. It is designed to let anyone explore and test how micro-investing works in a hands-on practice environment before ever touching real money.',
      highlight: 'Simulated demo money only. No real financial transactions occur.',
    },
    {
      id: 'how-atlas-makes-money',
      category: 'general',
      question: 'How does Atlas make money? Are there fees for investors?',
      answer:
        'Investors pay 0% fees. There are no fees to open an account, deposit, invest, or withdraw. Atlas earns revenue by charging project owners an upfront 2% origination fee on funded raises to cover independent expert vetting, surveyor audits, and legal charges, plus a 1% contribution to the Community Provision Fund.',
    },
    {
      id: 'fscs-protection',
      category: 'risk',
      question: 'Is my money protected by the FSCS (Financial Services Compensation Scheme)?',
      answer:
        'Here is the important difference:\n\n1. Uninvested money sitting in your Atlas wallet is held in a segregated client bank account with a regulated UK clearing bank and is protected by the FSCS up to £85,000 if that bank goes out of business.\n\n2. Money invested into loans is NOT protected by the FSCS. When you invest in a business loan, your capital is at risk. If a borrower fails to repay, you could lose some or all of the money you lent them.',
      highlight:
        'Investments are not protected by the FSCS. Capital is at risk and returns are not guaranteed.',
    },
    {
      id: 'what-is-provision-fund',
      category: 'risk',
      question: 'What is the Provision Fund and how does it help?',
      answer:
        'The Provision Fund is a separate reserve funded by a 1% fee paid by borrowers on funded loans. If a business defaults and cannot repay, Atlas may use the Provision Fund to repay some or all of the lost principal to investors on Low, Medium, and High tier loans.\n\nImportant: The Provision Fund is completely discretionary and is not an insurance policy. It does not cover Uncharted tier loans, and payouts are not guaranteed if the fund runs out of money.',
    },
    {
      id: 'cooling-off-period',
      category: 'risk',
      question: 'What is the 24-hour cooling-off period?',
      answer:
        'UK financial regulations require all first-time investors to wait at least 24 hours after opening an account before making their first investment. This cooling-off pause ensures you have plenty of time to consider whether investing is right for you without feeling pressured.\n\nIn this demo, you can click "Fast-forward 24 hours" in the header or wallet to see how the experience unlocks.',
    },
    {
      id: 'investment-limits',
      category: 'limits',
      question: 'What are the investment limits?',
      answer:
        'To protect everyday investors from risking more than they can afford, Atlas enforces strict limits:\n• Minimum investment: £10 per project syndicate\n• Maximum per standard opportunity: £1,000\n• Maximum per Uncharted opportunity: £100\n• Maximum total investments over 12 months: £5,000\n\nThese rules are checked automatically on our servers every time an investment is made.',
    },
    {
      id: 'auto-invest-explained',
      category: 'limits',
      question: 'How does Auto-Invest work?',
      answer:
        'Auto-Invest lets you set a monthly budget (like £50 or £100) and pick your preferred risk tiers. Our engine then splits your money into small £10 slices across multiple vetted syndicates using a round-robin schedule. It also enforces a strict 20% cap so no single project ever gets more than one-fifth of your plan budget.',
    },
    {
      id: 'points-rules',
      category: 'rewards',
      question: 'How do I earn Atlas Points? Can I buy them?',
      answer:
        'Atlas Points can NEVER be bought with money, and they can NEVER be earned by depositing or investing. You only earn points by learning! You earn points for finishing reading lessons, taking financial quizzes, completing your profile, and running scenarios in the investment simulator.',
    },
    {
      id: 'prize-draw-rules',
      category: 'rewards',
      question: 'How does the monthly prize draw work?',
      answer:
        'Every month, members can exchange 100 educational points for a ticket into our monthly prize draw (up to 10 tickets per month) to win High Street shopping vouchers. There is also a free postal entry route for anyone who wishes to enter without using points. It is 100% free with no purchase necessary.',
    },
    {
      id: 'complaints-procedure',
      category: 'complaints',
      question: 'How do I make a complaint?',
      answer:
        'We hope you never have reason to complain, but if something goes wrong, we want to hear about it so we can fix it.\n\n• Step 1: Send an email to complaints@atlas.demo detailing your issue.\n• Step 2: We will send an acknowledgment within 3 working days.\n• Step 3: Our compliance team will investigate and issue a final written response within 8 weeks.',
    },
    {
      id: 'fos-escalation',
      category: 'complaints',
      question: 'What is the Financial Ombudsman Service (FOS)?',
      answer:
        'If you are not satisfied with our final response or if 8 weeks have passed without an answer, you have the right to refer your complaint to the Financial Ombudsman Service (FOS). The Ombudsman is an independent, free dispute resolution service established by UK Parliament.\n\n• Phone: 0800 023 4567 or 0300 123 9123\n• Email: complaint.info@financial-ombudsman.org.uk\n• Address: Financial Ombudsman Service, Exchange Tower, Harbour Exchange Square, London E14 9SR\n• Website: www.financial-ombudsman.org.uk',
    },
  ];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesQuery =
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 rounded-3xl p-6 md:p-10 text-white relative overflow-hidden shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-3">
            <HelpCircle className="w-4 h-4 text-emerald-300" />
            <span>Help Centre & FAQs</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            How can we help you today?
          </h1>
          <p className="mt-2 text-sm md:text-base text-emerald-100/90 leading-relaxed">
            Everything you need to know about how Atlas works, keeping your money clear,
            understanding risks, and getting in touch.
          </p>

          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help topics (e.g. FSCS, fees, cooling-off, complaints)..."
              className="w-full pl-12 pr-4 py-3.5 bg-white text-slate-900 rounded-2xl text-sm font-medium shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition border ${
                isActive
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                  : 'bg-white text-slate-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 text-slate-500">
            <HelpCircle className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-800">No questions found</p>
            <p className="text-xs text-slate-500 mt-1">
              Try searching for something else, like &quot;FSCS&quot; or &quot;limits&quot;.
            </p>
          </div>
        ) : (
          filteredFaqs.map((faq) => {
            const isOpen = !!openItems[faq.id];
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition"
              >
                <button
                  onClick={() => toggleItem(faq.id)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-stone-50 transition"
                  aria-expanded={isOpen}
                >
                  <span className="font-bold text-slate-900 text-sm md:text-base">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-emerald-700' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-slate-700 leading-relaxed border-t border-stone-100 bg-stone-50/50">
                    <p className="whitespace-pre-line">{faq.answer}</p>
                    {faq.highlight && (
                      <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium flex items-start gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                        <span>{faq.highlight}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Need more help contact box */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center mb-3">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Contact Our Team</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Have a question about your account or how to use Atlas? Our friendly UK support
              team is here to assist.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100">
            <a
              href="mailto:support@atlas.demo"
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 flex items-center gap-1"
            >
              support@atlas.demo
            </a>
          </div>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center mb-3">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Complaints & Ombudsman</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              If you are not satisfied with our service, you have the right to contact the
              independent Financial Ombudsman Service.
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Free independent advice</span>
            <a
              href="https://www.financial-ombudsman.org.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-slate-800 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>FOS Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
