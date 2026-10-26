'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Award,
  ChevronRight,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Gift,
  Coins,
} from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Lesson {
  id: string;
  number: number;
  title: string;
  readTime: string;
  summary: string;
  content: string[];
  quiz: QuizQuestion[];
}

const LESSONS: Lesson[] = [
  {
    id: 'what-is-investing',
    number: 1,
    title: 'What is Investing?',
    readTime: '3 mins',
    summary: 'Learn how putting spare money to work helps local businesses grow.',
    content: [
      'Imagine your neighbour Sarah bakes amazing sourdough bread. She wants to buy a larger oven so she can bake twice as many loaves every morning.',
      'If you lend Sarah £20 to help buy the oven, you are investing in her bakery. Sarah uses the oven to sell more bread. Over the next year, she pays you back your £20 plus a little extra (called interest) as a thank you.',
      'Investing means putting your money into projects or businesses in the hope that they will succeed and pay you back with interest. It is different from saving in a bank because the money is put to work in real businesses, meaning returns depend on the business performing well.',
    ],
    quiz: [
      {
        question: 'What is the main difference between keeping money in a jar and investing it?',
        options: [
          'Money in a jar can grow on its own',
          'Investing puts money to work in a business with the chance to earn interest',
          'Investing means you give your money away forever',
        ],
        correctIndex: 1,
        explanation: 'Investing gives businesses capital to grow and gives you the opportunity to earn interest as they succeed.',
      },
      {
        question: 'Where does the extra money (interest) come from when an investment pays back?',
        options: [
          'From thin air',
          'From the business earning revenue and sharing profits',
          'From government subsidies',
        ],
        correctIndex: 1,
        explanation: 'When businesses use funding effectively, they earn revenue and repay their investors with interest.',
      },
      {
        question: 'Are returns from business investments certain?',
        options: [
          'Yes, all businesses always succeed',
          'No, returns are not guaranteed because businesses can have tough times',
          'Yes, the government covers all business losses',
        ],
        correctIndex: 1,
        explanation: 'Investments carry risk. Businesses can face difficulties, so returns are never certain and are not guaranteed.',
      },
    ],
  },
  {
    id: 'risk-and-reward',
    number: 2,
    title: 'Risk and Reward',
    readTime: '4 mins',
    summary: 'Why higher potential rewards usually come with bigger risks.',
    content: [
      'Every investment has a balance between two things: potential reward and risk.',
      'Potential reward is the extra money (interest) you might earn. Risk is the chance that the business might struggle and not be able to pay all the money back.',
      'Established businesses with long track records usually offer lower interest rates (like 5% a year) because they have a steady income. Newer businesses with untested products might offer 9% a year, but they carry a higher risk of hiccups.',
      'A golden rule of investing: Never invest money you need for daily living, rent, or emergencies.',
    ],
    quiz: [
      {
        question: 'Why does an established shop usually offer a lower interest rate than a new startup?',
        options: [
          'Because the established shop is mean',
          'Because the established shop has a proven record and lower risk of non-payment',
          'Because established shops do not need money',
        ],
        correctIndex: 1,
        explanation: 'Lower risk usually means lower expected return. Investors accept a lower interest rate for steadier businesses.',
      },
      {
        question: 'What does "capital at risk" mean?',
        options: [
          'You might lose some or all of the money you put in',
          'Your money will double every month',
          'The government keeps your money in London',
        ],
        correctIndex: 0,
        explanation: 'Capital at risk means the money you put into an investment could be lost if the project fails.',
      },
      {
        question: 'Which money should you use when practicing or starting to invest?',
        options: [
          'Rent and food money',
          'Emergency bill money',
          'Spare pocket money you can afford to lock away for a while',
        ],
        correctIndex: 2,
        explanation: 'Only ever invest spare funds that you will not need for essential living expenses.',
      },
    ],
  },
  {
    id: 'why-diversify',
    number: 3,
    title: 'Why Diversify? (The Basket Rule)',
    readTime: '3 mins',
    summary: 'Never put all your eggs in one basket — spread your micro-investments.',
    content: [
      'Have you ever heard the saying: "Don\'t put all your eggs in one basket"?',
      'If you carry 10 eggs in a single basket and trip, all 10 eggs can crack. But if you put 2 eggs in 5 different baskets, a slip only damages 2 eggs while the other 8 remain intact.',
      'In investing, this is called diversification. Instead of putting £100 into one single shop, you put £10 into 10 different businesses across the UK (like a bakery, a solar farm, a veterinary clinic, and a bicycle shop).',
      'If one business has a bad year, the other nine continue repaying. On Atlas, Auto-Invest automatically spreads your money into small £10 slices to help you diversify.',
    ],
    quiz: [
      {
        question: 'What is diversification?',
        options: [
          'Putting all your money into the single biggest company',
          'Spreading your money across many different businesses and sectors',
          'Keeping cash hidden under the mattress',
        ],
        correctIndex: 1,
        explanation: 'Diversification means spreading your funds so problems at one company don\'t ruin your entire pot.',
      },
      {
        question: 'If you have £50 to invest, which approach is more diversified?',
        options: [
          '£50 in one high-risk tech company',
          '£10 each in 5 different businesses across different towns and sectors',
          '£50 in a single cafe',
        ],
        correctIndex: 1,
        explanation: 'Five £10 investments across different sectors spreads your risk much better than putting everything in one spot.',
      },
      {
        question: 'What is the maximum share Auto-Invest puts into any single business?',
        options: [
          '100%',
          '50%',
          '20% (to ensure you are never over-exposed)',
        ],
        correctIndex: 2,
        explanation: 'Atlas caps any single business to a maximum 20% slice to ensure your portfolio stays well-diversified.',
      },
    ],
  },
  {
    id: 'what-if-default',
    number: 4,
    title: 'What Happens if a Business Struggles?',
    readTime: '4 mins',
    summary: 'Understanding repayments, late payments, and default recovery.',
    content: [
      'Businesses aim to pay their loans every month. But what happens if unexpected events occur — like a flood, illness, or customer slump?',
      'First, the Atlas team works closely with the business to agree on a realistic recovery plan. Sometimes they catch up the next month.',
      'If a business truly cannot repay, it enters "default". The platform helps recover as much money as possible by selling business assets or restructuring.',
      'Any recovered funds are shared pro-rata among investors. In some cases, the Atlas Provision Fund may also step in to cushion the loss.',
    ],
    quiz: [
      {
        question: 'What does "default" mean in lending?',
        options: [
          'The computer system resets to original settings',
          'A business is unable to make its required loan repayments',
          'The business automatically gets a free grant',
        ],
        correctIndex: 1,
        explanation: 'A default occurs when a borrower is unable to meet their agreed legal repayment schedule.',
      },
      {
        question: 'If a business defaults, what happens to money that is recovered?',
        options: [
          'The CEO keeps it',
          'It is split fairly and proportionally among all investors who backed that loan',
          'It is destroyed',
        ],
        correctIndex: 1,
        explanation: 'Every penny recovered is returned pro-rata to the investors who provided the original capital.',
      },
      {
        question: 'Can you lose all the money you put into a single business that defaults?',
        options: [
          'No, losses are forbidden by law',
          'Yes, if no assets can be recovered and the Provision Fund is empty, you could lose your investment in that business',
          'Yes, but only on bank holidays',
        ],
        correctIndex: 1,
        explanation: 'Yes, full loss of principal is possible if a business fails completely with zero recovery.',
      },
    ],
  },
  {
    id: 'provision-fund',
    number: 5,
    title: 'What the Provision Fund Is & Isn\'t',
    readTime: '3 mins',
    summary: 'A community reserve cushion, not a bank guarantee or insurance.',
    content: [
      'Whenever a business borrows money on Atlas, 1% of the loan is placed into a shared community pool called the Provision Fund.',
      'If a vetted business in the Low, Medium, or High risk tier defaults, Atlas can use money from the Provision Fund to help cover outstanding investor capital.',
      'Important honesty check: The Provision Fund is discretionary. It is NOT an insurance policy or a government bank guarantee (like the FSCS). If many businesses fail at the same time, the fund could run dry.',
      'Uncharted tier projects are experimental and are NEVER covered by the Provision Fund.',
    ],
    quiz: [
      {
        question: 'How is the Provision Fund financed?',
        options: [
          'Taxpayer grants from Parliament',
          'A small 1% contribution from each successful business loan raise',
          'By charging investors a monthly subscription fee',
        ],
        correctIndex: 1,
        explanation: 'The fund is fed directly by contributions taken from funded business loan amounts.',
      },
      {
        question: 'Is the Provision Fund an insurance policy that ensures you will never lose money?',
        options: [
          'Yes, it completely protects against any loss',
          'No, it is a discretionary reserve fund; if losses are severe, the fund could run out',
          'Yes, backed by the Bank of England',
        ],
        correctIndex: 1,
        explanation: 'The fund is not an insurance policy and returns are not guaranteed. If claims exceed the reserve, payouts cannot be made.',
      },
      {
        question: 'Are experimental "Uncharted" risk tier investments covered by the Provision Fund?',
        options: [
          'Yes, all tiers are covered equally',
          'No, Uncharted investments carry experimental risk and are never covered',
          'Only on Tuesdays',
        ],
        correctIndex: 1,
        explanation: 'Uncharted tier investments are capped at £100 and are strictly excluded from Provision Fund coverage.',
      },
    ],
  },
  {
    id: 'fees-transparency',
    number: 6,
    title: 'Fees & How Atlas Works',
    readTime: '3 mins',
    summary: 'Simple, fair pricing with zero hidden fees for everyday savers.',
    content: [
      'Many investment firms hide fees in confusing fine print. Atlas keeps everything crystal clear.',
      'As an investor, you pay 0% account management fees, 0% deposit fees, and 0% withdrawal fees. What you put in is what works for you.',
      'How does Atlas stay running? Atlas charges the businesses a simple, transparent 2% platform fee when their funding round completes.',
      'Fair, transparent, and built so our incentives align with helping quality businesses succeed.',
    ],
    quiz: [
      {
        question: 'How much does an everyday investor pay to open or maintain an account on Atlas?',
        options: [
          '£10 every month',
          '£0 (Free for everyday savers and investors)',
          '5% of every deposit',
        ],
        correctIndex: 1,
        explanation: 'Atlas does not charge investors account maintenance fees.',
      },
      {
        question: 'Who pays the platform fee that funds Atlas operations?',
        options: [
          'The borrowing businesses pay a transparent 2% fee when their loan is funded',
          'The local council',
          'Investors pay a fee on every interest payment',
        ],
        correctIndex: 0,
        explanation: 'The businesses raising funds pay a clear 2% platform fee.',
      },
      {
        question: 'Why is fee transparency so important in financial services?',
        options: [
          'So companies can hide costs in long legalese',
          'So you know exactly how much your money is earning without hidden surprises',
          'It doesn\'t matter',
        ],
        correctIndex: 1,
        explanation: 'Transparent fees ensure you keep your hard-earned interest and know exactly how the platform operates.',
      },
    ],
  },
];

export function LearnHubClient() {
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(LESSONS[0]);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Record<string, boolean>>({});
  const [pointsBalance, setPointsBalance] = useState<number | null>(null);
  const [pointsToast, setPointsToast] = useState<string | null>(null);

  const fetchPoints = async () => {
    try {
      const res = await fetch('/api/v1/points');
      if (res.ok) {
        const json = await res.json();
        setPointsBalance(json.data?.balance || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleSelectOption = (questionIdx: number, optionIdx: number) => {
    if (showResults) return; // locked once checked
    setQuizAnswers((prev) => ({ ...prev, [questionIdx]: optionIdx }));
  };

  const handleCheckQuiz = async () => {
    setShowResults(true);
    const score = selectedLesson.quiz.filter(
      (q, idx) => quizAnswers[idx] === q.correctIndex
    ).length;

    if (score === 3) {
      setCompletedLessons((prev) => ({ ...prev, [selectedLesson.id]: true }));
    }

    try {
      const res = await fetch('/api/v1/lessons/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lesson_id: selectedLesson.id,
          quiz_score: score,
        }),
      });
      const data = await res.json();
      if (data.data?.pointsEarned > 0) {
        setPointsToast(`+${data.data.pointsEarned} Atlas Points earned! 🎉`);
        setPointsBalance(data.data.newBalance);
      }
    } catch {
      // ignore
    }
  };

  const handleResetQuiz = () => {
    setQuizAnswers({});
    setShowResults(false);
    setPointsToast(null);
  };

  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setQuizAnswers({});
    setShowResults(false);
    setPointsToast(null);
  };

  const score = selectedLesson.quiz.filter(
    (q, idx) => quizAnswers[idx] === q.correctIndex
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Atlas Learning Hub</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Investing Explained in Simple Steps
            </h1>
            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
              Short, friendly 3-minute lessons with mini-quizzes. Learn how money works, why
              spreading your eggs across multiple baskets matters, and how to practice safely.
            </p>
          </div>

          {/* Quick Tools & Points Pill */}
          <div className="flex flex-wrap sm:flex-col items-start sm:items-end gap-2 flex-shrink-0">
            {pointsBalance !== null && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-2 text-right">
                <span className="text-[10px] font-semibold text-emerald-800 uppercase block">
                  Atlas Points
                </span>
                <span className="text-xl font-bold text-emerald-950 font-mono">
                  {pointsBalance} pts
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/simulator"
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold transition flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>Simulator</span>
              </Link>
              <Link
                href="/rewards"
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold transition flex items-center gap-1.5"
              >
                <Gift className="w-3.5 h-3.5 text-emerald-700" />
                <span>Prize Draw</span>
              </Link>
            </div>
          </div>
        </div>

        {pointsToast && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3 text-xs flex items-center gap-2 animate-in fade-in">
            <Coins className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">{pointsToast}</span>
          </div>
        )}
      </div>

      {/* Main Grid: Lesson List (Left) + Active Lesson & Quiz (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Lesson Selector */}
        <div className="lg:col-span-4 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
            Lessons (6 Modules)
          </h2>
          <div className="space-y-2">
            {LESSONS.map((lesson) => {
              const isSelected = selectedLesson.id === lesson.id;
              const isDone = completedLessons[lesson.id];
              return (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className={`w-full text-left p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                      : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isDone
                          ? 'bg-emerald-600 text-white'
                          : isSelected
                          ? 'bg-emerald-800 text-white'
                          : 'bg-stone-100 text-slate-600'
                      }`}
                    >
                      {isDone ? '✓' : lesson.number}
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-semibold leading-tight ${
                          isSelected ? 'text-emerald-950' : 'text-slate-900'
                        }`}
                      >
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">{lesson.readTime}</p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 flex-shrink-0 transition ${
                      isSelected ? 'text-emerald-700' : 'text-slate-400'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Lesson Content + Mini Quiz */}
        <div className="lg:col-span-8 space-y-6">
          {/* Lesson Body */}
          <article className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="border-b border-stone-100 pb-4">
              <span className="text-xs font-semibold text-emerald-700 tracking-wide">
                Lesson {selectedLesson.number} of {LESSONS.length}
              </span>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
                {selectedLesson.title}
              </h2>
              <p className="text-slate-500 text-xs md:text-sm mt-1">
                {selectedLesson.summary}
              </p>
            </div>

            <div className="prose prose-slate max-w-none space-y-4 text-sm md:text-base text-slate-700 leading-relaxed">
              {selectedLesson.content.map((p, idx) => (
                <p key={idx} className="bg-stone-50/70 p-4 rounded-2xl border border-stone-100">
                  {p}
                </p>
              ))}
            </div>
          </article>

          {/* Interactive Mini-Quiz */}
          <div className="bg-white rounded-3xl border border-stone-200 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-emerald-700" />
                <h3 className="text-lg font-bold text-slate-900">
                  Quick Knowledge Check (3 Questions)
                </h3>
              </div>
              {showResults && (
                <div
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    score === 3
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  Score: {score} / 3
                </div>
              )}
            </div>

            <div className="space-y-6">
              {selectedLesson.quiz.map((q, qIdx) => {
                const selectedOpt = quizAnswers[qIdx];
                const isAnswered = selectedOpt !== undefined;
                const isCorrect = isAnswered && selectedOpt === q.correctIndex;

                return (
                  <div key={qIdx} className="space-y-3">
                    <p className="font-semibold text-sm text-slate-800">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-2">
                      {q.options.map((opt, optIdx) => {
                        const isThisSelected = selectedOpt === optIdx;
                        let btnStyle =
                          'bg-stone-50 border-stone-200 text-slate-700 hover:bg-stone-100';

                        if (showResults) {
                          if (optIdx === q.correctIndex) {
                            btnStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold';
                          } else if (isThisSelected && !isCorrect) {
                            btnStyle = 'bg-rose-50 border-rose-400 text-rose-950';
                          } else {
                            btnStyle = 'bg-stone-50 border-stone-200 text-slate-400 opacity-60';
                          }
                        } else if (isThisSelected) {
                          btnStyle =
                            'bg-emerald-100 border-emerald-600 text-emerald-950 font-semibold';
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelectOption(qIdx, optIdx)}
                            className={`w-full text-left p-3 rounded-xl border text-xs md:text-sm transition flex items-center justify-between gap-3 ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {showResults && optIdx === q.correctIndex && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            )}
                            {showResults && isThisSelected && !isCorrect && (
                              <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {showResults && (
                      <p className="text-xs text-slate-600 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Quiz Action Buttons */}
            <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-4">
              {!showResults ? (
                <button
                  onClick={handleCheckQuiz}
                  disabled={Object.keys(quizAnswers).length < 3}
                  className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold text-sm hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
                >
                  Check Answers
                </button>
              ) : (
                <div className="flex items-center gap-3 w-full justify-between">
                  <button
                    onClick={handleResetQuiz}
                    className="px-4 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-slate-700 hover:bg-stone-50 transition"
                  >
                    Try Again
                  </button>

                  {selectedLesson.number < LESSONS.length && (
                    <button
                      onClick={() => handleSelectLesson(LESSONS[selectedLesson.number])}
                      className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition flex items-center gap-1.5"
                    >
                      <span>Next Lesson</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
