/**
 * Investment Simulator (Section 5.14 & Section 6)
 *
 * Runs 1,000 Monte Carlo randomized outcomes based on statutory Section 6 risk tier assumptions.
 * Computes typical (50th percentile), poor (10th percentile), and good (90th percentile)
 * scenarios along with the simulated probability of capital loss.
 */

export interface SimulatorInputs {
  amountPounds: number;
  termMonths: number;
  allocation: {
    low: number; // percentage (0 - 100)
    medium: number;
    high: number;
    uncharted: number;
  };
}

export interface SimulatorResult {
  initialAmountPounds: number;
  termMonths: number;
  outcomes: {
    poorPounds: number; // 10th percentile
    typicalPounds: number; // 50th percentile (median)
    goodPounds: number; // 90th percentile
    minPounds: number;
    maxPounds: number;
  };
  chanceOfLossPercent: number;
  disclaimer: string;
}

export interface FictionalCaseStudy {
  id: string;
  title: string;
  sector: string;
  tier: 'low' | 'medium' | 'high' | 'uncharted';
  scenarioType: 'success' | 'late_repayment' | 'default';
  investedPounds: number;
  returnedPounds: number;
  summary: string;
  timeline: { month: number; event: string }[];
}

export const TIER_ASSUMPTIONS = {
  low: {
    minReturn: 0.03,
    maxReturn: 0.05,
    annualDefaultRate: 0.01, // 1%
    minRecovery: 0.35,
    maxRecovery: 0.55,
  },
  medium: {
    minReturn: 0.05,
    maxReturn: 0.08,
    annualDefaultRate: 0.04, // 4%
    minRecovery: 0.25,
    maxRecovery: 0.45,
  },
  high: {
    minReturn: 0.08,
    maxReturn: 0.14,
    annualDefaultRate: 0.1, // 10%
    minRecovery: 0.15,
    maxRecovery: 0.35,
  },
  uncharted: {
    minReturn: 0.0,
    maxReturn: 0.25,
    annualDefaultRate: 0.25, // 25%
    minRecovery: 0.0,
    maxRecovery: 0.2,
  },
} as const;

export function runMonteCarloSimulation(inputs: SimulatorInputs): SimulatorResult {
  const { amountPounds, termMonths, allocation } = inputs;
  const termYears = termMonths / 12;

  const totalRuns = 1000;
  const runOutcomes: number[] = new Array(totalRuns);

  for (let i = 0; i < totalRuns; i++) {
    let runTotal = 0;

    const tiers: Array<keyof typeof TIER_ASSUMPTIONS> = ['low', 'medium', 'high', 'uncharted'];
    for (const tier of tiers) {
      const pct = (allocation[tier] || 0) / 100;
      if (pct <= 0) continue;

      const tierPrincipal = amountPounds * pct;
      const assumption = TIER_ASSUMPTIONS[tier];

      // Default probability over term
      const defaultProbability = Math.min(0.9, assumption.annualDefaultRate * termYears);
      const isDefault = Math.random() < defaultProbability;

      if (isDefault) {
        // Partial recovery
        const recoveryRate =
          assumption.minRecovery +
          Math.random() * (assumption.maxRecovery - assumption.minRecovery);
        runTotal += tierPrincipal * recoveryRate;
      } else {
        // Full repayment with interest
        const annualRate =
          assumption.minReturn + Math.random() * (assumption.maxReturn - assumption.minReturn);
        const interestEarned = tierPrincipal * annualRate * termYears;
        runTotal += tierPrincipal + interestEarned;
      }
    }

    runOutcomes[i] = runTotal;
  }

  runOutcomes.sort((a, b) => a - b);

  const poorPounds = Math.round(runOutcomes[Math.floor(totalRuns * 0.1)] * 100) / 100;
  const typicalPounds = Math.round(runOutcomes[Math.floor(totalRuns * 0.5)] * 100) / 100;
  const goodPounds = Math.round(runOutcomes[Math.floor(totalRuns * 0.9)] * 100) / 100;
  const minPounds = Math.round(runOutcomes[0] * 100) / 100;
  const maxPounds = Math.round(runOutcomes[totalRuns - 1] * 100) / 100;

  const lossRuns = runOutcomes.filter((val) => val < amountPounds).length;
  const chanceOfLossPercent = Math.round((lossRuns / totalRuns) * 1000) / 10;

  return {
    initialAmountPounds: amountPounds,
    termMonths,
    outcomes: {
      poorPounds,
      typicalPounds,
      goodPounds,
      minPounds,
      maxPounds,
    },
    chanceOfLossPercent,
    disclaimer:
      'Illustration only. Past performance and simulations do not predict future results.',
  };
}

export const FICTIONAL_CASE_STUDIES: FictionalCaseStudy[] = [
  {
    id: 'case_bakery',
    title: 'The Daily Loaf Stone Oven Upgrade',
    sector: 'Food & Drink',
    tier: 'low',
    scenarioType: 'success',
    investedPounds: 100,
    returnedPounds: 104.5,
    summary:
      'The bakery used loan funds to buy an energy-efficient oven. Sourdough production increased by 40%, and all 12 monthly payments were made on time in full.',
    timeline: [
      { month: 1, event: 'Loan funded and modern electric deck oven installed.' },
      { month: 6, event: 'Halfway mark: 6 on-time repayments received without incident.' },
      { month: 12, event: 'Final loan repayment completed: £100 principal + £4.50 interest returned.' },
    ],
  },
  {
    id: 'case_solar',
    title: 'Highland Hydro Community Generator',
    sector: 'Green Energy',
    tier: 'medium',
    scenarioType: 'late_repayment',
    investedPounds: 100,
    returnedPounds: 106.8,
    summary:
      'Turbine maintenance in winter caused a temporary cash flow hiccup. Month 5 was late, but the cooperative communicated transparently and caught up with all back interest in Month 6.',
    timeline: [
      { month: 1, event: 'Generator upgrade completed on schedule.' },
      { month: 5, event: 'Winter freezing delayed turbine servicing; partial repayment made.' },
      { month: 6, event: 'Grid subsidy received; overdue balance paid with full interest.' },
      { month: 18, event: 'All capital and interest fully repaid to investors.' },
    ],
  },
  {
    id: 'case_ebikes',
    title: 'Coastal E-Bikes Repair Workshop',
    sector: 'Transport',
    tier: 'high',
    scenarioType: 'default',
    investedPounds: 100,
    returnedPounds: 72.0,
    summary:
      'Severe winter tidal flooding damaged the workshop and inventory. The business was unable to continue trading. Assets were sold, recovering £42, and the Provision Fund contributed £30 to cushion the loss.',
    timeline: [
      { month: 1, event: 'Workshop purchased specialised battery testing tooling.' },
      { month: 4, event: 'Storm flooding forced shop closure and insolvency.' },
      { month: 6, event: 'Tooling auctioned for £42 recovery pro-rata.' },
      { month: 7, event: 'Discretionary Provision Fund approved £30 payout. Net outcome: £72 returned (£28 loss).' },
    ],
  },
];
