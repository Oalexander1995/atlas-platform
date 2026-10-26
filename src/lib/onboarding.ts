import { query } from './db';
import { ClockService } from './clock';
import { recordAuditLog } from './audit';

export interface AppropriatenessQuestion {
  id: number;
  category: 'capital_at_risk' | 'illiquidity' | 'diversification' | 'provision_fund' | 'fscs';
  question: string;
  options: { id: string; text: string }[];
  correctOptionId: string;
  explanation: string;
}

export const QUESTION_BANK: AppropriatenessQuestion[] = [
  // Category 1: Capital at Risk
  {
    id: 1,
    category: 'capital_at_risk',
    question: 'What could happen to the money you lend to a business on Atlas?',
    options: [
      { id: 'a', text: 'You can lose some or all of your money if the business fails to repay.' },
      { id: 'b', text: 'Atlas will always repay your money no matter what happens.' },
      { id: 'c', text: 'Your money is 100% shielded against any possible loss.' },
    ],
    correctOptionId: 'a',
    explanation: 'All investments carry risk. If a business struggles or closes, you could lose some or all of the money you lent them.',
  },
  {
    id: 2,
    category: 'capital_at_risk',
    question: 'Are returns or interest on Atlas promised to happen?',
    options: [
      { id: 'a', text: 'Yes, interest payments are legally promised every month.' },
      { id: 'b', text: 'No, expected returns are estimates and are not guaranteed.' },
      { id: 'c', text: 'Yes, because Atlas chooses only businesses that can never fail.' },
    ],
    correctOptionId: 'b',
    explanation: 'Expected returns are always shown as ranges and are not guaranteed. Businesses might repay late or not at all.',
  },
  {
    id: 3,
    category: 'capital_at_risk',
    question: 'How much money should you invest in high-risk loans on Atlas?',
    options: [
      { id: 'a', text: 'All your savings, because returns can be higher than a bank.' },
      { id: 'b', text: 'Money you need for rent or bills next month.' },
      { id: 'c', text: 'Only money you can afford to lose without hurting your daily life.' },
    ],
    correctOptionId: 'c',
    explanation: 'Never invest money you need for rent, bills, or emergencies. Only invest what you can comfortably afford to lose.',
  },

  // Category 2: Illiquidity (Cannot withdraw early)
  {
    id: 4,
    category: 'illiquidity',
    question: 'If you invest £50 in an 18-month loan, when can you take your money back?',
    options: [
      { id: 'a', text: 'You can click a button and withdraw it instantly whenever you want.' },
      { id: 'b', text: 'You must wait as the business repays over the agreed 18 months.' },
      { id: 'c', text: 'Atlas will buy back your loan anytime if you ask nicely.' },
    ],
    correctOptionId: 'b',
    explanation: 'Investing is not like a bank cash machine. Your money is locked into the loan and is paid back gradually over the loan term.',
  },
  {
    id: 5,
    category: 'illiquidity',
    question: 'Can you sell your investment to another user if you urgently need cash?',
    options: [
      { id: 'a', text: 'No, Atlas does not currently have a secondary market to sell loans early.' },
      { id: 'b', text: 'Yes, there is an open marketplace to sell your loans anytime.' },
      { id: 'c', text: 'Yes, you can swap it for cash at any high street bank.' },
    ],
    correctOptionId: 'a',
    explanation: 'These investments are illiquid. There is no instant trading market, so you cannot easily cash out early.',
  },
  {
    id: 6,
    category: 'illiquidity',
    question: 'What does "illiquid investment" mean in plain English?',
    options: [
      { id: 'a', text: 'It means the investment involves water companies or drinks.' },
      { id: 'b', text: 'It means you cannot quickly or easily turn the investment back into cash.' },
      { id: 'c', text: 'It means the investment pays interest every single day.' },
    ],
    correctOptionId: 'b',
    explanation: 'Illiquid simply means hard to turn into cash quickly. Your money is tied up until repayments arrive.',
  },

  // Category 3: Diversification ("Don't put all your eggs in one basket")
  {
    id: 7,
    category: 'diversification',
    question: 'Dani has £50 to invest. What is the smartest and safest way to do it?',
    options: [
      { id: 'a', text: 'Put all £50 into one single business that has the highest target.' },
      { id: 'b', text: 'Split the £50 into five £10 pieces across 5 different businesses.' },
      { id: 'c', text: 'Wait until she has £5,000 before making any loans.' },
    ],
    correctOptionId: 'b',
    explanation: 'Spreading money across multiple businesses is called diversification. If one business struggles, your other four can still repay.',
  },
  {
    id: 8,
    category: 'diversification',
    question: 'Why is putting all your investment money into one business risky?',
    options: [
      { id: 'a', text: 'Because if that one business fails, you could lose everything you invested.' },
      { id: 'b', text: 'Because Atlas charges double fees for single investments.' },
      { id: 'c', text: 'It is not risky at all; one business is easier to remember.' },
    ],
    correctOptionId: 'a',
    explanation: 'If all your eggs are in one basket and that basket drops, all your eggs break. Spreading your loans protects you from a single failure.',
  },
  {
    id: 9,
    category: 'diversification',
    question: 'How does Atlas Auto-Invest help you diversify?',
    options: [
      { id: 'a', text: 'It puts all your money into a single lucky draw ticket.' },
      { id: 'b', text: 'It automatically splits your money into £10 slices across multiple vetted loans.' },
      { id: 'c', text: 'It borrows money from other people in your name.' },
    ],
    correctOptionId: 'b',
    explanation: 'Auto-Invest spreads your budget into £10 slices across open opportunities in your chosen risk tier so you never rely on just one.',
  },

  // Category 4: The Provision Fund
  {
    id: 10,
    category: 'provision_fund',
    question: 'What is the Atlas Provision Fund?',
    options: [
      { id: 'a', text: 'A discretionary buffer that may help cover some losses, but is not a guarantee.' },
      { id: 'b', text: 'An insurance policy that promises 100% of your money is protected.' },
      { id: 'c', text: 'A government grant that pays bonuses to top investors.' },
    ],
    correctOptionId: 'a',
    explanation: 'The Provision Fund is a separate pot Atlas holds. Payouts are discretionary, may not cover all or any losses, and are never a guarantee.',
  },
  {
    id: 11,
    category: 'provision_fund',
    question: 'Can you rely on the Provision Fund to protect you from any possible loss?',
    options: [
      { id: 'a', text: 'Yes, it completely removes all risk of losing money on Atlas.' },
      { id: 'b', text: 'No, it may run out of funds or may not pay out; investments still carry risk.' },
      { id: 'c', text: 'Yes, because it is backed by the Bank of England.' },
    ],
    correctOptionId: 'b',
    explanation: 'The Provision Fund is discretionary, is not a guarantee and cannot shield against all possible losses. You could still lose your money.',
  },
  {
    id: 12,
    category: 'provision_fund',
    question: 'Are Uncharted tier opportunities covered by the Provision Fund?',
    options: [
      { id: 'a', text: 'Yes, Uncharted loans get first priority from the Provision Fund.' },
      { id: 'b', text: 'No, Uncharted tier is the highest-risk tier and is never covered by the Provision Fund.' },
      { id: 'c', text: 'Yes, all loans receive the exact same coverage.' },
    ],
    correctOptionId: 'b',
    explanation: 'Uncharted tier loans are early-stage or experimental and are NEVER covered by the Provision Fund.',
  },

  // Category 5: FSCS Protection
  {
    id: 13,
    category: 'fscs',
    question: 'Are investments on Atlas covered by the FSCS if a borrower fails to repay?',
    options: [
      { id: 'a', text: 'No, FSCS does not protect against poor business performance or borrower default.' },
      { id: 'b', text: 'Yes, the FSCS pays back up to £85,000 for any business loan default.' },
      { id: 'c', text: 'Yes, FSCS covers all peer-to-peer loans in full.' },
    ],
    correctOptionId: 'a',
    explanation: 'Investments on Atlas are not protected by the Financial Services Compensation Scheme (FSCS) if the investment performs badly or the borrower fails to repay.',
  },
  {
    id: 14,
    category: 'fscs',
    question: 'How is lending money on Atlas different from a bank savings account with FSCS cover?',
    options: [
      { id: 'a', text: 'Bank savings up to £85k are protected if the bank fails; Atlas business loans are not protected if borrowers default.' },
      { id: 'b', text: 'There is no difference; both are exactly the same.' },
      { id: 'c', text: 'Atlas is a bank licensed by the Prudential Regulation Authority.' },
    ],
    correctOptionId: 'a',
    explanation: 'In a bank savings account, your deposit is protected by FSCS up to £85,000. On Atlas, you are making loans to small businesses where your capital is at risk.',
  },
  {
    id: 15,
    category: 'fscs',
    question: 'If an opportunity defaults and the borrower pays nothing back, can you claim from FSCS?',
    options: [
      { id: 'a', text: 'Yes, you fill out an FSCS compensation form online.' },
      { id: 'b', text: 'No, you cannot claim compensation from the FSCS for bad loans.' },
      { id: 'c', text: 'Yes, Atlas will file the FSCS claim for you.' },
    ],
    correctOptionId: 'b',
    explanation: 'The FSCS does not cover investment losses when borrowers fail to repay. That is why understanding risk is so important.',
  },
];

/**
 * Returns 5 random questions (1 from each category) with shuffled options
 */
export function getRandomAppropriatenessQuestions(): AppropriatenessQuestion[] {
  const categories: Array<AppropriatenessQuestion['category']> = [
    'capital_at_risk',
    'illiquidity',
    'diversification',
    'provision_fund',
    'fscs',
  ];

  return categories.map((cat) => {
    const matching = QUESTION_BANK.filter((q) => q.category === cat);
    const chosen = matching[Math.floor(Math.random() * matching.length)];

    // Shuffle options
    const shuffledOptions = [...chosen.options].sort(() => Math.random() - 0.5);

    return {
      ...chosen,
      options: shuffledOptions,
    };
  });
}

/**
 * Submits answers to the 5 appropriateness questions
 */
export async function submitAppropriatenessTest(params: {
  userId: string;
  answers: Record<number, string>; // { [questionId]: optionId }
  ip?: string;
}): Promise<{
  score: number;
  passed: boolean;
  attemptsCount: number;
  explanations: Array<{ questionId: number; correct: boolean; explanation: string }>;
  nextAttemptAllowedAt: string | null;
  coolingOffEndsAt: string | null;
}> {
  const { userId, answers, ip } = params;
  const now = await ClockService.now();

  // Check past attempts
  const pastAttemptsRes = await query<{
    score: number;
    passed: boolean;
    next_attempt_allowed_at: string | null;
  }>(
    `SELECT score, passed, next_attempt_allowed_at
     FROM appropriateness_attempts
     WHERE user_id = $1
     ORDER BY attempted_at DESC`,
    [userId]
  );

  const pastAttempts = pastAttemptsRes.rows;
  if (pastAttempts.length > 0 && pastAttempts[0].next_attempt_allowed_at) {
    const nextAllowed = new Date(pastAttempts[0].next_attempt_allowed_at);
    if (now.getTime() < nextAllowed.getTime()) {
      const waitHours = Math.ceil((nextAllowed.getTime() - now.getTime()) / (1000 * 60 * 60));
      throw new Error(
        `You must wait ${waitHours} hour(s) before retrying the appropriateness test. (Use admin Fast-Forward to skip in demo).`
      );
    }
  }

  // Score the answers
  let score = 0;
  const explanations: Array<{ questionId: number; correct: boolean; explanation: string }> = [];
  const questionIds: number[] = [];

  for (const [qIdStr, selectedOptionId] of Object.entries(answers)) {
    const qId = Number(qIdStr);
    questionIds.push(qId);
    const question = QUESTION_BANK.find((q) => q.id === qId);
    if (!question) continue;

    const isCorrect = question.correctOptionId === selectedOptionId;
    if (isCorrect) score++;

    explanations.push({
      questionId: qId,
      correct: isCorrect,
      explanation: question.explanation,
    });
  }

  const passed = score >= 4;
  let nextAttemptAllowedAt: Date | null = null;
  let coolingOffEndsAt: Date | null = null;

  if (!passed) {
    // 24 hour wait required after fail
    nextAttemptAllowedAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else {
    // Passed! Initiate 24-hour cooling-off period (Section 3.4)
    coolingOffEndsAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await query(
      `INSERT INTO cooling_off (user_id, started_at, ends_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET started_at = EXCLUDED.started_at, ends_at = EXCLUDED.ends_at`,
      [userId, now.toISOString(), coolingOffEndsAt.toISOString()]
    );
  }

  // Save attempt
  await query(
    `INSERT INTO appropriateness_attempts (
       user_id, question_ids, answers, score, passed, attempted_at, next_attempt_allowed_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      userId,
      questionIds,
      JSON.stringify(answers),
      score,
      passed,
      now.toISOString(),
      nextAttemptAllowedAt ? nextAttemptAllowedAt.toISOString() : null,
    ]
  );

  await recordAuditLog({
    actorUserId: userId,
    action: passed ? 'APPROPRIATENESS_PASSED' : 'APPROPRIATENESS_FAILED',
    entityType: 'appropriateness_attempts',
    after: { score, passed, attemptsCount: pastAttempts.length + 1 },
    ip,
  });

  return {
    score,
    passed,
    attemptsCount: pastAttempts.length + 1,
    explanations,
    nextAttemptAllowedAt: nextAttemptAllowedAt ? nextAttemptAllowedAt.toISOString() : null,
    coolingOffEndsAt: coolingOffEndsAt ? coolingOffEndsAt.toISOString() : null,
  };
}

/**
 * Saves investor self-declaration classification (Section 3.2)
 */
export async function submitInvestorClassification(params: {
  userId: string;
  category: 'restricted' | 'high_net_worth' | 'sophisticated';
  ip?: string;
}): Promise<void> {
  const { userId, category, ip } = params;
  const now = await ClockService.now();

  const declarationTexts: Record<string, string> = {
    restricted:
      'In the past 12 months I have not invested more than 10% of my net assets in high-risk investments, and I will not do so in the next 12 months.',
    high_net_worth:
      'I self-certify that I have an annual income of £100,000+ or net assets of £250,000+ (excluding main home and pension).',
    sophisticated:
      'I self-certify that I have qualifying experience or certifications in private market investing.',
  };

  const text = declarationTexts[category] || declarationTexts.restricted;

  await query(
    `INSERT INTO investor_classifications (user_id, category, declaration_text, declared_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, category, text, now.toISOString()]
  );

  await recordAuditLog({
    actorUserId: userId,
    action: 'INVESTOR_CLASSIFIED',
    entityType: 'investor_classifications',
    after: { category, declaration_text: text },
    ip,
  });
}

/**
 * Completes simulated KYC (Section 5.2)
 */
export async function submitSimulatedKyc(params: {
  userId: string;
  testName?: string;
  ip?: string;
}): Promise<{ verified: boolean; message: string }> {
  const { userId, testName = '', ip } = params;

  if (testName.toUpperCase().includes('FAIL KYC')) {
    await query(`UPDATE users SET account_state = 'restricted' WHERE id = $1`, [userId]);

    await recordAuditLog({
      actorUserId: userId,
      action: 'KYC_SIMULATION_FAILED',
      entityType: 'users',
      entityId: userId,
      after: { account_state: 'restricted', reason: 'FAIL KYC test trigger' },
      ip,
    });

    return {
      verified: false,
      message: 'We were unable to verify your identity in this demo check. Please contact support.',
    };
  }

  await query(`UPDATE users SET account_state = 'verified' WHERE id = $1`, [userId]);

  await recordAuditLog({
    actorUserId: userId,
    action: 'KYC_SIMULATION_VERIFIED',
    entityType: 'users',
    entityId: userId,
    after: { account_state: 'verified' },
    ip,
  });

  return {
    verified: true,
    message: 'Identity verified successfully (demo).',
  };
}

/**
 * Returns comprehensive onboarding status for a user (Section 5.3)
 */
export async function getOnboardingStatus(userId: string): Promise<{
  isKycVerified: boolean;
  classification: string | null;
  appropriateness: {
    passed: boolean;
    attemptsCount: number;
    score: number | null;
    canAttempt: boolean;
    nextAttemptAllowedAt: string | null;
  };
  coolingOff: {
    active: boolean;
    endsAt: string | null;
    secondsRemaining: number;
  };
  isReadyToInvest: boolean;
  nextStep: 'kyc' | 'classification' | 'appropriateness' | 'cooling_off' | 'ready';
}> {
  const now = await ClockService.now();

  // 1. KYC State
  const userRes = await query<{ account_state: string }>('SELECT account_state FROM users WHERE id = $1', [userId]);
  const isKycVerified = userRes.rows[0]?.account_state === 'verified';

  // 2. Classification
  const classRes = await query<{ category: string }>(
    'SELECT category FROM investor_classifications WHERE user_id = $1 ORDER BY declared_at DESC LIMIT 1',
    [userId]
  );
  const classification = classRes.rows[0]?.category || null;

  // 3. Appropriateness
  const appRes = await query<{
    passed: boolean;
    score: number;
    next_attempt_allowed_at: string | null;
  }>(
    'SELECT passed, score, next_attempt_allowed_at FROM appropriateness_attempts WHERE user_id = $1 ORDER BY attempted_at DESC',
    [userId]
  );
  const pastAttempts = appRes.rows;
  const passed = pastAttempts.some((a) => a.passed);
  const latestAttempt = pastAttempts[0] || null;

  let canAttempt = true;
  let nextAttemptAllowedAt: string | null = null;

  if (!passed && latestAttempt?.next_attempt_allowed_at) {
    const nextDate = new Date(latestAttempt.next_attempt_allowed_at);
    if (now.getTime() < nextDate.getTime()) {
      canAttempt = false;
      nextAttemptAllowedAt = nextDate.toISOString();
    }
  }

  // 4. Cooling Off
  const coolingRes = await query<{ started_at: string; ends_at: string }>(
    'SELECT started_at, ends_at FROM cooling_off WHERE user_id = $1',
    [userId]
  );
  const coolingRow = coolingRes.rows[0] || null;
  let coolingActive = false;
  let secondsRemaining = 0;
  let coolingEndsAt: string | null = null;

  if (coolingRow) {
    const ends = new Date(coolingRow.ends_at);
    coolingEndsAt = ends.toISOString();
    if (now.getTime() < ends.getTime()) {
      coolingActive = true;
      secondsRemaining = Math.max(0, Math.ceil((ends.getTime() - now.getTime()) / 1000));
    }
  }

  // 5. Next Step Calculation
  let nextStep: 'kyc' | 'classification' | 'appropriateness' | 'cooling_off' | 'ready' = 'ready';
  if (!isKycVerified) {
    nextStep = 'kyc';
  } else if (!classification) {
    nextStep = 'classification';
  } else if (!passed) {
    nextStep = 'appropriateness';
  } else if (coolingActive) {
    nextStep = 'cooling_off';
  }

  const isReadyToInvest = isKycVerified && Boolean(classification) && passed && !coolingActive;

  return {
    isKycVerified,
    classification,
    appropriateness: {
      passed,
      attemptsCount: pastAttempts.length,
      score: latestAttempt ? latestAttempt.score : null,
      canAttempt,
      nextAttemptAllowedAt,
    },
    coolingOff: {
      active: coolingActive,
      endsAt: coolingEndsAt,
      secondsRemaining,
    },
    isReadyToInvest,
    nextStep,
  };
}
