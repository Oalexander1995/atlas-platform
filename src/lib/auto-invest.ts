import { query, transaction } from './db';
import { ClockService } from './clock';
import { recordAuditLog } from './audit';
import { getOrCreateUserWallet, getOrCreateOpportunityEscrow, getWalletBalancePence } from './ledger';
import { getOnboardingStatus } from './onboarding';
import { RiskTier } from '@/components/RiskTierBadge';

export const SLICE_SIZE_PENCE = 1000; // £10.00
export const MAX_OPPORTUNITY_CAP_PENCE = 100000; // £1,000.00
export const MAX_YEARLY_LIMIT_PENCE = 500000; // £5,000.00

export interface AutoInvestPreviewItem {
  opportunityId: string;
  opportunityTitle: string;
  partnerName: string;
  riskTier: RiskTier;
  slicesCount: number;
  allocatedPence: number;
  percentOfTotal: number;
}

export interface AutoInvestPreview {
  riskTier: 'low' | 'medium' | 'high';
  requestedAmountPence: number;
  totalAllocatedPence: number;
  remainderInWalletPence: number;
  totalSlices: number;
  allocatedSlices: number;
  allocations: AutoInvestPreviewItem[];
  notice?: string;
}

export interface AutoInvestPlan {
  id: string;
  userId: string;
  riskTier: 'low' | 'medium' | 'high';
  monthlyPence: number;
  status: 'active' | 'paused' | 'stopped';
  createdAt: string;
}

/**
 * Previews proposed Auto-Invest allocation without mutating data (Section 5.9)
 */
export async function previewAutoInvestAllocation(params: {
  userId: string;
  riskTier: 'low' | 'medium' | 'high';
  amountPence: number;
}): Promise<AutoInvestPreview> {
  const { userId, riskTier, amountPence } = params;

  if (riskTier === ('uncharted' as any)) {
    throw new Error('Uncharted tier is excluded from Auto-Invest.');
  }

  if (amountPence < SLICE_SIZE_PENCE) {
    throw new Error('Minimum Auto-Invest amount is £10.00.');
  }

  // 1. Calculate slices and initial remainder
  const totalSlices = Math.floor(amountPence / SLICE_SIZE_PENCE);
  const remainderUnderTen = amountPence % SLICE_SIZE_PENCE;

  // 2. Fetch eligible opportunities
  // Eligible: open, matching tier, not fully funded
  const oppsRes = await query<any>(
    `SELECT
       o.id,
       o.title,
       p.name AS partner_name,
       o.risk_tier,
       o.target_pence,
       o.raised_pence,
       COALESCE(h.principal_pence, 0) AS current_held_pence
     FROM opportunities o
     LEFT JOIN partners p ON o.partner_id = p.id
     LEFT JOIN holdings h ON h.opportunity_id = o.id AND h.user_id = $1
     WHERE o.status = 'open'
       AND o.risk_tier = $2
       AND (o.target_pence - o.raised_pence) >= $3
     ORDER BY current_held_pence ASC, o.created_at ASC`,
    [userId, riskTier, SLICE_SIZE_PENCE]
  );

  const eligibleOpps = oppsRes.rows;
  if (eligibleOpps.length === 0) {
    return {
      riskTier,
      requestedAmountPence: amountPence,
      totalAllocatedPence: 0,
      remainderInWalletPence: amountPence,
      totalSlices,
      allocatedSlices: 0,
      allocations: [],
      notice: `No open opportunities currently available in the ${riskTier} tier. Your money remains in your wallet.`,
    };
  }

  // 3. Diversification cap: no more than 20% of Auto-Invest total in one opportunity
  // Relaxed only if fewer than 5 eligible opportunities exist (Section 5.9 rule 3)
  const isRelaxed = eligibleOpps.length < 5;
  const maxSlicesPerOpp = isRelaxed
    ? totalSlices
    : Math.max(1, Math.floor(totalSlices * 0.2));

  // 4. Assign slices round-robin
  const sliceAllocations = new Map<string, number>();
  let remainingSlices = totalSlices;

  // Keep track of dynamic capacity
  const capacityMap = new Map<string, number>();
  eligibleOpps.forEach((o) => {
    const remainingToTarget = Number(o.target_pence) - Number(o.raised_pence);
    const remainingToUserCap = MAX_OPPORTUNITY_CAP_PENCE - Number(o.current_held_pence);
    const maxAllowedPence = Math.min(remainingToTarget, remainingToUserCap);
    capacityMap.set(o.id, Math.max(0, Math.floor(maxAllowedPence / SLICE_SIZE_PENCE)));
    sliceAllocations.set(o.id, 0);
  });

  let madeProgress = true;
  while (remainingSlices > 0 && madeProgress) {
    madeProgress = false;
    for (const opp of eligibleOpps) {
      if (remainingSlices <= 0) break;

      const currentAssigned = sliceAllocations.get(opp.id) || 0;
      const maxPossible = Math.min(maxSlicesPerOpp, capacityMap.get(opp.id) || 0);

      if (currentAssigned < maxPossible) {
        sliceAllocations.set(opp.id, currentAssigned + 1);
        remainingSlices--;
        madeProgress = true;
      }
    }
  }

  const allocatedSlices = totalSlices - remainingSlices;
  const totalAllocatedPence = allocatedSlices * SLICE_SIZE_PENCE;
  const finalRemainderPence = remainderUnderTen + remainingSlices * SLICE_SIZE_PENCE;

  const allocations: AutoInvestPreviewItem[] = [];
  eligibleOpps.forEach((opp) => {
    const assigned = sliceAllocations.get(opp.id) || 0;
    if (assigned > 0) {
      const allocatedPence = assigned * SLICE_SIZE_PENCE;
      allocations.push({
        opportunityId: opp.id,
        opportunityTitle: opp.title,
        partnerName: opp.partner_name || 'Partner',
        riskTier: opp.risk_tier,
        slicesCount: assigned,
        allocatedPence,
        percentOfTotal: Math.round((allocatedPence / totalAllocatedPence) * 100),
      });
    }
  });

  let notice: string | undefined;
  if (isRelaxed) {
    notice = `Fewer than 5 open opportunities available in ${riskTier} tier; diversification cap relaxed.`;
  }
  if (remainingSlices > 0) {
    notice = (notice ? notice + ' ' : '') + `Could not deploy all slices due to capacity limits. £${(finalRemainderPence / 100).toFixed(2)} remains in your wallet.`;
  }

  return {
    riskTier,
    requestedAmountPence: amountPence,
    totalAllocatedPence,
    remainderInWalletPence: finalRemainderPence,
    totalSlices,
    allocatedSlices,
    allocations,
    notice,
  };
}

/**
 * Executes Auto-Invest allocation inside a single ledger transaction (Section 5.9)
 */
export async function executeAutoInvestAllocation(params: {
  userId: string;
  riskTier: 'low' | 'medium' | 'high';
  amountPence: number;
  monthlyPence?: number;
  idempotencyKey: string;
  ip?: string;
}): Promise<{
  planId?: string;
  journalEntryId: string;
  allocatedPence: number;
  remainderPence: number;
  allocations: AutoInvestPreviewItem[];
  notice?: string;
}> {
  const { userId, riskTier, amountPence, monthlyPence = 0, idempotencyKey, ip } = params;

  // Onboarding check
  const onboarding = await getOnboardingStatus(userId);
  if (!onboarding.isReadyToInvest) {
    throw new Error('Onboarding must be completed before starting Auto-Invest.');
  }

  // Preview allocation first
  const preview = await previewAutoInvestAllocation({ userId, riskTier, amountPence });
  if (preview.totalAllocatedPence <= 0) {
    throw new Error(preview.notice || 'Unable to allocate funds.');
  }

  return transaction(async (tx) => {
    // Check idempotency
    const existing = await tx.query('SELECT id FROM journal_entries WHERE idempotency_key = $1', [idempotencyKey]);
    if (existing.rows.length > 0) {
      return {
        journalEntryId: existing.rows[0].id,
        allocatedPence: preview.totalAllocatedPence,
        remainderPence: preview.remainderInWalletPence,
        allocations: preview.allocations,
      };
    }

    // Verify wallet balance
    const userWallet = await getOrCreateUserWallet(userId);
    await tx.query('SELECT id FROM ledger_accounts WHERE id = $1 FOR UPDATE', [userWallet.id]);

    const balRes = await tx.query('SELECT balance_pence FROM account_balances WHERE account_id = $1', [userWallet.id]);
    const walletBalance = Number(balRes.rows[0]?.balance_pence) || 0;

    if (walletBalance < preview.totalAllocatedPence) {
      throw new Error(`Insufficient wallet funds. Balance: £${(walletBalance / 100).toFixed(2)}`);
    }

    const now = await ClockService.now();

    // 1. Create single journal entry for entire auto-invest run
    const entryRes = await tx.query(
      `INSERT INTO journal_entries (idempotency_key, type, description, created_by, created_at)
       VALUES ($1, 'auto_invest', $2, $3, $4)
       RETURNING id`,
      [
        idempotencyKey,
        `Auto-Invest £${(preview.totalAllocatedPence / 100).toFixed(2)} across ${preview.allocations.length} ${riskTier}-tier loans`,
        userId,
        now.toISOString(),
      ]
    );
    const journalEntryId = entryRes.rows[0].id;

    // 2. Postings: debit user wallet for total
    await tx.query(
      `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
       VALUES ($1, $2, $3, $4)`,
      [journalEntryId, userWallet.id, -preview.totalAllocatedPence, now.toISOString()]
    );

    // 3. Credit each opportunity escrow and update holdings
    for (const alloc of preview.allocations) {
      const oppEscrow = await getOrCreateOpportunityEscrow(alloc.opportunityId);

      // Post to escrow
      await tx.query(
        `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
         VALUES ($1, $2, $3, $4)`,
        [journalEntryId, oppEscrow.id, alloc.allocatedPence, now.toISOString()]
      );

      // Create or update holdings row
      await tx.query(
        `INSERT INTO holdings (user_id, opportunity_id, principal_pence, source, status, created_at)
         VALUES ($1, $2, $3, 'auto_invest', 'active', $4)
         ON CONFLICT (user_id, opportunity_id, source) DO UPDATE
         SET principal_pence = holdings.principal_pence + EXCLUDED.principal_pence`,
        [userId, alloc.opportunityId, alloc.allocatedPence, now.toISOString()]
      );

      // Update opportunity raised amount
      await tx.query(
        `UPDATE opportunities
         SET raised_pence = raised_pence + $1
         WHERE id = $2`,
        [alloc.allocatedPence, alloc.opportunityId]
      );
    }

    // 4. Save/update auto-invest plan if monthly amount was set
    let planId: string | undefined;
    if (monthlyPence > 0) {
      const planRes = await tx.query(
        `INSERT INTO auto_invest_plans (user_id, risk_tier, monthly_pence, status, created_at)
         VALUES ($1, $2, $3, 'active', $4)
         RETURNING id`,
        [userId, riskTier, monthlyPence, now.toISOString()]
      );
      planId = planRes.rows[0]?.id;
    }

    // 5. Audit log
    await recordAuditLog({
      actorUserId: userId,
      action: 'AUTO_INVEST_EXECUTED',
      entityType: 'auto_invest_plans',
      entityId: planId || journalEntryId,
      after: {
        total_allocated_pence: preview.totalAllocatedPence,
        slices: preview.allocatedSlices,
        opportunities_count: preview.allocations.length,
      },
      ip,
    });

    return {
      planId,
      journalEntryId,
      allocatedPence: preview.totalAllocatedPence,
      remainderPence: preview.remainderInWalletPence,
      allocations: preview.allocations,
      notice: preview.notice,
    };
  });
}

/**
 * Returns user's active auto-invest plans and underlying auto-invest holdings
 */
export async function getAutoInvestDetails(userId: string): Promise<{
  plan: AutoInvestPlan | null;
  holdings: Array<{
    id: string;
    opportunityId: string;
    opportunityTitle: string;
    riskTier: RiskTier;
    principalPence: number;
    status: string;
    createdAt: string;
  }>;
}> {
  // Fetch active plan
  const planRes = await query<any>(
    `SELECT id, user_id AS "userId", risk_tier AS "riskTier", monthly_pence AS "monthlyPence", status, created_at AS "createdAt"
     FROM auto_invest_plans
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  const plan: AutoInvestPlan | null = planRes.rows[0] || null;

  // Fetch holdings created via auto_invest
  const holdingsRes = await query<any>(
    `SELECT
       h.id,
       h.opportunity_id AS "opportunityId",
       o.title AS "opportunityTitle",
       o.risk_tier AS "riskTier",
       h.principal_pence AS "principalPence",
       h.status,
       h.created_at AS "createdAt"
     FROM holdings h
     JOIN opportunities o ON h.opportunity_id = o.id
     WHERE h.user_id = $1 AND h.source = 'auto_invest'
     ORDER BY h.created_at DESC`,
    [userId]
  );

  return {
    plan,
    holdings: holdingsRes.rows.map((r) => ({
      id: r.id,
      opportunityId: r.opportunityId,
      opportunityTitle: r.opportunityTitle,
      riskTier: r.riskTier,
      principalPence: Number(r.principalPence),
      status: r.status,
      createdAt: r.createdAt,
    })),
  };
}

/**
 * Admin action: triggers monthly auto-invest run for all active plans
 */
export async function runMonthlyAutoInvestScheduled(): Promise<{
  executedCount: number;
  totalDeployedPence: number;
}> {
  const activePlans = await query<{
    id: string;
    user_id: string;
    risk_tier: 'low' | 'medium' | 'high';
    monthly_pence: string;
  }>(`SELECT id, user_id, risk_tier, monthly_pence FROM auto_invest_plans WHERE status = 'active'`);

  let executedCount = 0;
  let totalDeployedPence = 0;

  for (const plan of activePlans.rows) {
    const monthlyPence = Number(plan.monthly_pence);
    if (monthlyPence < SLICE_SIZE_PENCE) continue;

    try {
      const now = await ClockService.now();
      const idempotencyKey = `monthly_run_${plan.id}_${now.toISOString().slice(0, 7)}`;
      const res = await executeAutoInvestAllocation({
        userId: plan.user_id,
        riskTier: plan.risk_tier,
        amountPence: monthlyPence,
        idempotencyKey,
      });
      executedCount++;
      totalDeployedPence += res.allocatedPence;
    } catch {
      // Ignore if user has insufficient funds this month
    }
  }

  return { executedCount, totalDeployedPence };
}
