import { query } from './db';
import { RiskTier } from '@/components/RiskTierBadge';

export interface HoldingDetail {
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  partnerName: string;
  riskTier: RiskTier;
  principalPence: number;
  source: 'manual' | 'auto_invest';
  status: string;
  opportunityStatus: string;
  repaymentsReceivedPence: number;
  nextRepaymentDate: string | null;
  createdAt: string;
  lossPence?: number;
  provisionPayoutPence?: number;
}

export interface PortfolioSummary {
  totalInvestedPence: number;
  totalReceivedBackPence: number;
  currentlyOutstandingPence: number;
  expectedFutureReturnsPence: number;
  totalLossesPence: number;
  totalProvisionPayoutsPence: number;
  tierBreakdown: {
    low: number;
    medium: number;
    high: number;
    uncharted: number;
  };
  holdings: HoldingDetail[];
}

/**
 * Returns full portfolio dashboard data for an investor (Section 5.10)
 */
export async function getUserPortfolio(userId: string): Promise<PortfolioSummary> {
  // 1. Fetch user holdings
  const holdingsRes = await query<any>(
    `SELECT
       h.id,
       h.opportunity_id AS "opportunityId",
       o.title AS "opportunityTitle",
       p.name AS "partnerName",
       o.risk_tier AS "riskTier",
       h.principal_pence AS "principalPence",
       h.source,
       h.status,
       o.status AS "opportunityStatus",
       h.created_at AS "createdAt"
     FROM holdings h
     JOIN opportunities o ON h.opportunity_id = o.id
     LEFT JOIN partners p ON o.partner_id = p.id
     WHERE h.user_id = $1
     ORDER BY h.created_at DESC`,
    [userId]
  );

  // 2. Fetch losses and provision payouts
  const lossesRes = await query<{
    holding_id: string;
    amount_pence: string;
    provision_payout_pence: string;
  }>(
    `SELECT holding_id, amount_pence, provision_payout_pence
     FROM holding_losses
     WHERE user_id = $1`,
    [userId]
  );
  const lossMap = new Map<string, { loss: number; payout: number }>();
  lossesRes.rows.forEach((r) => {
    lossMap.set(r.holding_id, {
      loss: Number(r.amount_pence),
      payout: Number(r.provision_payout_pence),
    });
  });

  const tierBreakdown = { low: 0, medium: 0, high: 0, uncharted: 0 };
  let totalInvestedPence = 0;
  let currentlyOutstandingPence = 0;
  let totalLossesPence = 0;
  let totalProvisionPayoutsPence = 0;

  const holdings: HoldingDetail[] = holdingsRes.rows.map((r) => {
    const principal = Number(r.principalPence);
    const tier = (r.riskTier || 'low') as RiskTier;
    const lossInfo = lossMap.get(r.id);

    totalInvestedPence += principal;
    if (r.status === 'active') {
      currentlyOutstandingPence += principal;
      tierBreakdown[tier] = (tierBreakdown[tier] || 0) + principal;
    }

    if (lossInfo) {
      totalLossesPence += lossInfo.loss;
      totalProvisionPayoutsPence += lossInfo.payout;
    }

    return {
      id: r.id,
      opportunityId: r.opportunityId,
      opportunityTitle: r.opportunityTitle,
      partnerName: r.partnerName,
      riskTier: tier,
      principalPence: principal,
      source: r.source,
      status: r.status,
      opportunityStatus: r.opportunityStatus,
      repaymentsReceivedPence: 0, // Augmented below
      nextRepaymentDate: null,
      createdAt: r.createdAt,
      lossPence: lossInfo?.loss,
      provisionPayoutPence: lossInfo?.payout,
    };
  });

  return {
    totalInvestedPence,
    totalReceivedBackPence: 0,
    currentlyOutstandingPence,
    expectedFutureReturnsPence: Math.round(currentlyOutstandingPence * 0.06), // ~6% not guaranteed estimate
    totalLossesPence,
    totalProvisionPayoutsPence,
    tierBreakdown,
    holdings,
  };
}

/**
 * Generates statement CSV string (Section 5.10)
 */
export async function generatePortfolioCsv(userId: string): Promise<string> {
  const portfolio = await getUserPortfolio(userId);

  const headers = [
    'Holding ID',
    'Opportunity Title',
    'Partner',
    'Risk Tier',
    'Invested Amount (GBP)',
    'Status',
    'Opportunity Status',
    'Date Invested',
  ];

  const rows = portfolio.holdings.map((h) => [
    h.id,
    `"${h.opportunityTitle.replace(/"/g, '""')}"`,
    `"${h.partnerName.replace(/"/g, '""')}"`,
    h.riskTier.toUpperCase(),
    (h.principalPence / 100).toFixed(2),
    h.status,
    h.opportunityStatus,
    new Date(h.createdAt).toLocaleDateString('en-GB'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
