import { query, transaction } from './db';
import { ClockService } from './clock';
import { recordAuditLog } from './audit';
import { getOrCreateUserWallet, getOrCreateOpportunityEscrow, getWalletBalancePence } from './ledger';
import { getOnboardingStatus } from './onboarding';

export const MIN_INVESTMENT_PENCE = 1000; // £10.00
export const MAX_YEARLY_LIMIT_PENCE = 500000; // £5,000.00 rolling 12 months

export interface UserLimits {
  walletBalancePence: number;
  opportunityCapPence: number;
  currentHeldInOpportunityPence: number;
  remainingInOpportunityPence: number;
  rolling12MonthInvestedPence: number;
  remainingYearlyLimitPence: number;
  maxInvestableNowPence: number;
}

/**
 * Calculates current investment limits for a user on a given opportunity (Section 5.4)
 */
export async function getUserLimitsRemaining(
  userId: string,
  opportunityId: string
): Promise<UserLimits> {
  const now = await ClockService.now();
  const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

  // 1. Opportunity tier & cap
  const oppRes = await query<{ risk_tier: string; per_user_cap_pence: string }>(
    'SELECT risk_tier, per_user_cap_pence FROM opportunities WHERE id = $1',
    [opportunityId]
  );
  if (oppRes.rows.length === 0) {
    throw new Error('Opportunity not found');
  }

  const riskTier = oppRes.rows[0].risk_tier;
  const oppCap = riskTier === 'uncharted' ? 10000 : Number(oppRes.rows[0].per_user_cap_pence) || 100000;

  // 2. Currently held by user in this opportunity
  const heldRes = await query<{ total_held: string }>(
    'SELECT COALESCE(SUM(principal_pence), 0) AS total_held FROM holdings WHERE user_id = $1 AND opportunity_id = $2',
    [userId, opportunityId]
  );
  const currentHeld = Number(heldRes.rows[0].total_held) || 0;
  const remainingInOpp = Math.max(0, oppCap - currentHeld);

  // 3. Rolling 12-month confirmed investments (Section 5.4: confirmed postings, not deposits)
  const userWallet = await getOrCreateUserWallet(userId);
  const rollingRes = await query<{ rolling_total: string }>(
    `SELECT COALESCE(SUM(-p.amount_pence), 0) AS rolling_total
     FROM postings p
     JOIN journal_entries j ON p.journal_entry_id = j.id
     WHERE p.account_id = $1
       AND j.type IN ('investment', 'auto_invest')
       AND p.amount_pence < 0
       AND p.created_at >= $2`,
    [userWallet.id, twelveMonthsAgo.toISOString()]
  );
  const rollingTotal = Number(rollingRes.rows[0].rolling_total) || 0;
  const remainingYearly = Math.max(0, MAX_YEARLY_LIMIT_PENCE - rollingTotal);

  // 4. Current wallet balance
  const walletBalance = await getWalletBalancePence(userId);

  // Max investable right now
  const maxInvestable = Math.max(0, Math.min(walletBalance, remainingInOpp, remainingYearly));

  return {
    walletBalancePence: walletBalance,
    opportunityCapPence: oppCap,
    currentHeldInOpportunityPence: currentHeld,
    remainingInOpportunityPence: remainingInOpp,
    rolling12MonthInvestedPence: rollingTotal,
    remainingYearlyLimitPence: remainingYearly,
    maxInvestableNowPence: maxInvestable,
  };
}

/**
 * Executes a single investment order in a transaction with strict limit enforcement (Section 5.8)
 */
export async function executeInvestment(params: {
  userId: string;
  opportunityId: string;
  amountPence: number;
  riskAck: boolean;
  idempotencyKey: string;
  ip?: string;
}): Promise<{
  journalEntryId: string;
  holdingId: string;
  amountPence: number;
  newBalancePence: number;
  opportunityTitle: string;
}> {
  const { userId, opportunityId, amountPence, riskAck, idempotencyKey, ip } = params;

  // 1. Mandatory risk acknowledgement (Section 5.8)
  if (!riskAck) {
    const err = new Error('You must acknowledge that you could lose all the money you invest.');
    (err as any).code = 'RISK_ACK_REQUIRED';
    throw err;
  }

  // 2. Minimum investment validation
  if (!Number.isInteger(amountPence) || amountPence < MIN_INVESTMENT_PENCE) {
    const err = new Error('Minimum investment is £10 (1,000 pence).');
    (err as any).code = 'LIMIT_EXCEEDED';
    throw err;
  }

  // 3. Onboarding & cooling-off gatekeeper (Section 5.3)
  const onboarding = await getOnboardingStatus(userId);
  if (!onboarding.isReadyToInvest) {
    if (onboarding.coolingOff.active) {
      const err = new Error('Your 24-hour cooling-off period is currently active.');
      (err as any).code = 'COOLING_OFF_ACTIVE';
      throw err;
    }
    const err = new Error('You must complete onboarding before you can make an investment.');
    (err as any).code = 'ONBOARDING_INCOMPLETE';
    throw err;
  }

  return transaction(async (tx) => {
    // 4. Idempotency check: if key was already submitted, return existing holding
    const existingEntry = await tx.query(
      'SELECT id FROM journal_entries WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (existingEntry.rows.length > 0) {
      const jId = existingEntry.rows[0].id;
      const holdingRes = await tx.query(
        'SELECT id FROM holdings WHERE user_id = $1 AND opportunity_id = $2',
        [userId, opportunityId]
      );
      const balance = await getWalletBalancePence(userId);
      return {
        journalEntryId: jId,
        holdingId: holdingRes.rows[0]?.id || '',
        amountPence,
        newBalancePence: balance,
        opportunityTitle: 'Already processed',
      };
    }

    // 5. Lock opportunity row & verify status and funding capacity
    const oppRes = await tx.query(
      `SELECT id, title, risk_tier, status, target_pence, raised_pence, per_user_cap_pence
       FROM opportunities
       WHERE id = $1
       FOR UPDATE`,
      [opportunityId]
    );

    if (oppRes.rows.length === 0) {
      const err = new Error('Opportunity not found');
      (err as any).code = 'NOT_FOUND';
      throw err;
    }

    const opp = oppRes.rows[0];
    if (opp.status !== 'open') {
      const err = new Error(`This opportunity is no longer open for investments (status: ${opp.status}).`);
      (err as any).code = 'OPPORTUNITY_NOT_OPEN';
      throw err;
    }

    const currentRaised = Number(opp.raised_pence);
    const targetPence = Number(opp.target_pence);

    if (currentRaised + amountPence > targetPence) {
      const err = new Error('Opportunity cannot accept this amount as it exceeds the funding target.');
      (err as any).code = 'OPPORTUNITY_FULLY_FUNDED';
      throw err;
    }

    // 6. Lock user wallet account & verify funds
    const userWallet = await getOrCreateUserWallet(userId);
    const oppEscrow = await getOrCreateOpportunityEscrow(opportunityId);

    await tx.query('SELECT id FROM ledger_accounts WHERE id = $1 FOR UPDATE', [userWallet.id]);

    const balanceRes = await tx.query(
      'SELECT balance_pence FROM account_balances WHERE account_id = $1',
      [userWallet.id]
    );
    const currentWalletBalance = Number(balanceRes.rows[0]?.balance_pence) || 0;

    if (currentWalletBalance < amountPence) {
      const err = new Error(
        `Insufficient funds. Available balance: £${(currentWalletBalance / 100).toFixed(2)}, required: £${(amountPence / 100).toFixed(2)}`
      );
      (err as any).code = 'INSUFFICIENT_FUNDS';
      throw err;
    }

    // 7. Limit check 1: Per-opportunity limit (stricter £100 for Uncharted)
    const oppCap = opp.risk_tier === 'uncharted' ? 10000 : Number(opp.per_user_cap_pence) || 100000;
    const currentHeldRes = await tx.query(
      'SELECT COALESCE(SUM(principal_pence), 0) AS total FROM holdings WHERE user_id = $1 AND opportunity_id = $2',
      [userId, opportunityId]
    );
    const currentHeld = Number(currentHeldRes.rows[0]?.total) || 0;

    if (currentHeld + amountPence > oppCap) {
      const err = new Error(
        `Investment would exceed the maximum limit of £${(oppCap / 100).toFixed(2)} for this opportunity. You currently hold £${(currentHeld / 100).toFixed(2)}.`
      );
      (err as any).code = 'LIMIT_EXCEEDED';
      throw err;
    }

    // 8. Limit check 2: Rolling 12-month limit (£5,000)
    const now = await ClockService.now();
    const twelveMonthsAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

    const rollingRes = await tx.query(
      `SELECT COALESCE(SUM(-p.amount_pence), 0) AS rolling_total
       FROM postings p
       JOIN journal_entries j ON p.journal_entry_id = j.id
       WHERE p.account_id = $1
         AND j.type IN ('investment', 'auto_invest')
         AND p.amount_pence < 0
         AND p.created_at >= $2`,
      [userWallet.id, twelveMonthsAgo.toISOString()]
    );
    const rollingTotal = Number(rollingRes.rows[0]?.rolling_total) || 0;

    if (rollingTotal + amountPence > MAX_YEARLY_LIMIT_PENCE) {
      const err = new Error(
        `Investment would exceed your £5,000 rolling 12-month limit. You have already invested £${(rollingTotal / 100).toFixed(2)} in the past 12 months.`
      );
      (err as any).code = 'LIMIT_EXCEEDED';
      throw err;
    }

    // 9. Post to double-entry ledger
    const journalEntryRes = await tx.query(
      `INSERT INTO journal_entries (idempotency_key, type, description, created_by, created_at)
       VALUES ($1, 'investment', $2, $3, $4)
       RETURNING id`,
      [
        idempotencyKey,
        `Investment of £${(amountPence / 100).toFixed(2)} in ${opp.title}`,
        userId,
        now.toISOString(),
      ]
    );
    const journalEntryId = journalEntryRes.rows[0].id;

    // Postings: wallet -amount, escrow +amount
    await tx.query(
      `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
       VALUES ($1, $2, $3, $4), ($1, $5, $6, $4)`,
      [
        journalEntryId,
        userWallet.id,
        -amountPence,
        now.toISOString(),
        oppEscrow.id,
        amountPence,
      ]
    );

    // 10. Create or update holdings row
    const holdingRes = await tx.query(
      `INSERT INTO holdings (user_id, opportunity_id, principal_pence, source, status, created_at)
       VALUES ($1, $2, $3, 'manual', 'active', $4)
       ON CONFLICT (user_id, opportunity_id, source) DO UPDATE
       SET principal_pence = holdings.principal_pence + EXCLUDED.principal_pence
       RETURNING id`,
      [userId, opportunityId, amountPence, now.toISOString()]
    );
    const holdingId = holdingRes.rows[0].id;

    // 11. Update opportunity raised amount & check if fully funded
    const newRaised = currentRaised + amountPence;
    const newStatus = newRaised >= targetPence ? 'funded' : 'open';

    await tx.query(
      `UPDATE opportunities
       SET raised_pence = $1, status = $2
       WHERE id = $3`,
      [newRaised, newStatus, opportunityId]
    );

    // 12. Audit log
    await recordAuditLog({
      actorUserId: userId,
      action: 'INVESTMENT_EXECUTED',
      entityType: 'holdings',
      entityId: holdingId,
      after: {
        opportunity_id: opportunityId,
        amount_pence: amountPence,
        new_raised_pence: newRaised,
        risk_acknowledged: true,
      },
      ip,
    });

    return {
      journalEntryId,
      holdingId,
      amountPence,
      newBalancePence: currentWalletBalance - amountPence,
      opportunityTitle: opp.title,
    };
  });
}
