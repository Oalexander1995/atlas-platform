import { query, transaction } from './db';
import { ClockService } from './clock';
import { recordAuditLog } from './audit';
import {
  getOrCreateOpportunityEscrow,
  getOrCreateOpportunityPartnerAccount,
  getOrCreateSystemAccount,
  getOrCreateUserWallet,
} from './ledger';
import { distributeProRataLargestRemainder } from './rounding';
import { createNotification } from './notifications';

export interface DisbursementResult {
  journalEntryId: string;
  totalRaisedPence: number;
  netPartnerPence: number;
  platformFeePence: number;
  provisionContributionPence: number;
}

export interface RepaymentResult {
  journalEntryId: string;
  capitalPence: number;
  interestPence: number;
  totalPence: number;
  recipientsCount: number;
  distributions: {
    holdingId: string;
    userId: string;
    capitalPence: number;
    interestPence: number;
    totalPence: number;
  }[];
}

export interface DefaultResult {
  recoveryJournalEntryId: string | null;
  provisionJournalEntryId: string | null;
  totalLossPence: number;
  totalRecoveredPence: number;
  totalProvisionPayoutPence: number;
  affectedHoldersCount: number;
}

/**
 * Disburses fully funded opportunity escrow to partner, fees, and Provision Fund (Section 8.3)
 */
export async function disburseOpportunity(params: {
  opportunityId: string;
  actorUserId?: string;
  idempotencyKey?: string;
  ip?: string;
}): Promise<DisbursementResult> {
  const { opportunityId, actorUserId, idempotencyKey, ip } = params;

  return transaction(async (tx) => {
    // 1. Fetch opportunity
    const oppRes = await tx.query<{
      id: string;
      title: string;
      status: string;
      target_pence: string;
      platform_fee_bps: number;
      provision_contribution_bps: number;
    }>('SELECT * FROM opportunities WHERE id = $1 FOR UPDATE', [opportunityId]);

    if (oppRes.rows.length === 0) {
      throw new Error('Opportunity not found');
    }
    const opp = oppRes.rows[0];

    if (opp.status !== 'open' && opp.status !== 'funded') {
      throw new Error(`Opportunity cannot be disbursed in status: ${opp.status}`);
    }

    // 2. Calculate total raised from holdings
    const raisedRes = await tx.query<{ total: string }>(
      'SELECT COALESCE(SUM(principal_pence), 0) AS total FROM holdings WHERE opportunity_id = $1',
      [opportunityId]
    );
    const totalRaisedPence = Number(raisedRes.rows[0]?.total || 0);

    if (totalRaisedPence <= 0) {
      throw new Error('Cannot disburse an opportunity with zero funds raised');
    }

    // 3. Calculate fees (default 2% platform fee, 1% Provision Fund contribution)
    const feeBps = opp.platform_fee_bps ?? 200;
    const pfBps = opp.provision_contribution_bps ?? 100;

    const platformFeePence = Math.round((totalRaisedPence * feeBps) / 10000);
    const provisionContributionPence = Math.round((totalRaisedPence * pfBps) / 10000);
    const netPartnerPence = totalRaisedPence - platformFeePence - provisionContributionPence;

    // 4. Prepare ledger accounts
    const oppEscrow = await getOrCreateOpportunityEscrow(opportunityId);
    const oppPartner = await getOrCreateOpportunityPartnerAccount(opportunityId);
    const platformFeesAccount = await getOrCreateSystemAccount('platform_fees');
    const provisionFundAccount = await getOrCreateSystemAccount('provision_fund');

    const now = await ClockService.now();
    const key = idempotencyKey || `disburse_${opportunityId}_${now.getTime()}`;

    // 5. Create journal entry
    const entryRes = await tx.query<{ id: string }>(
      `INSERT INTO journal_entries (idempotency_key, type, description, created_by, created_at)
       VALUES ($1, 'disbursement', $2, $3, $4)
       RETURNING id`,
      [
        key,
        `Disbursement of £${(totalRaisedPence / 100).toFixed(2)} for ${opp.title}`,
        actorUserId || null,
        now.toISOString(),
      ]
    );
    const journalEntryId = entryRes.rows[0].id;

    // 6. Balanced postings:
    // escrow: -totalRaised (credit)
    // partner: +netPartner (debit)
    // platform_fees: +platformFee (debit)
    // provision_fund: +provisionContribution (debit)
    // Sum = -totalRaised + netPartner + platformFee + provisionContribution = 0
    await tx.query(
      `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
       VALUES
         ($1, $2, $3, $4),
         ($1, $5, $6, $4),
         ($1, $7, $8, $4),
         ($1, $9, $10, $4)`,
      [
        journalEntryId,
        oppEscrow.id,
        -totalRaisedPence,
        now.toISOString(),
        oppPartner.id,
        netPartnerPence,
        platformFeesAccount.id,
        platformFeePence,
        provisionFundAccount.id,
        provisionContributionPence,
      ]
    );

    // 7. Update opportunity status to 'repaying'
    await tx.query(
      `UPDATE opportunities SET status = 'repaying' WHERE id = $1`,
      [opportunityId]
    );

    // 8. Record audit log
    await recordAuditLog({
      actorUserId,
      action: 'disburse_opportunity',
      entityType: 'opportunity',
      entityId: opportunityId,
      before: { status: opp.status },
      after: {
        status: 'repaying',
        totalRaisedPence,
        netPartnerPence,
        platformFeePence,
        provisionContributionPence,
      },
      ip,
    });

    return {
      journalEntryId,
      totalRaisedPence,
      netPartnerPence,
      platformFeePence,
      provisionContributionPence,
    };
  });
}

/**
 * Distributes a loan repayment (capital and/or interest) pro-rata across all investors (Section 5.11 & 8.4)
 */
export async function processRepayment(params: {
  opportunityId: string;
  capitalPence: number;
  interestPence: number;
  actorUserId?: string;
  idempotencyKey?: string;
  ip?: string;
}): Promise<RepaymentResult> {
  const { opportunityId, capitalPence, interestPence, actorUserId, idempotencyKey, ip } = params;

  if (!Number.isInteger(capitalPence) || capitalPence < 0) {
    throw new Error('capitalPence must be a non-negative integer');
  }
  if (!Number.isInteger(interestPence) || interestPence < 0) {
    throw new Error('interestPence must be a non-negative integer');
  }
  const totalRepaymentPence = capitalPence + interestPence;
  if (totalRepaymentPence <= 0) {
    throw new Error('Total repayment must be greater than zero');
  }

  return transaction(async (tx) => {
    // 1. Fetch opportunity
    const oppRes = await tx.query<{ id: string; title: string; status: string }>(
      'SELECT id, title, status FROM opportunities WHERE id = $1 FOR UPDATE',
      [opportunityId]
    );
    if (oppRes.rows.length === 0) {
      throw new Error('Opportunity not found');
    }
    const opp = oppRes.rows[0];

    if (opp.status !== 'repaying') {
      throw new Error(`Repayments can only be processed on repaying loans (current status: ${opp.status})`);
    }

    // 2. Fetch active holdings
    const holdingsRes = await tx.query<{
      id: string;
      user_id: string;
      principal_pence: string;
      created_at: string;
    }>(
      `SELECT id, user_id, principal_pence, created_at
       FROM holdings
       WHERE opportunity_id = $1 AND principal_pence > 0 AND status = 'active'
       ORDER BY created_at ASC`,
      [opportunityId]
    );

    const activeHoldings = holdingsRes.rows;
    if (activeHoldings.length === 0) {
      throw new Error('No active holdings found to receive repayments');
    }

    const totalOutstandingPrincipal = activeHoldings.reduce(
      (sum, h) => sum + Number(h.principal_pence),
      0
    );

    if (capitalPence > totalOutstandingPrincipal) {
      throw new Error(
        `Capital repayment (£${(capitalPence / 100).toFixed(2)}) cannot exceed total outstanding principal (£${(
          totalOutstandingPrincipal / 100
        ).toFixed(2)})`
      );
    }

    // 3. Pro-rata distribution via largest-remainder method (Section 8.4)
    const weights = activeHoldings.map((h) => ({
      id: h.id,
      weight: Number(h.principal_pence),
      tieBreaker: h.created_at,
    }));

    const capitalMap = distributeProRataLargestRemainder(capitalPence, weights);
    const interestMap = distributeProRataLargestRemainder(interestPence, weights);

    // 4. Ledger postings
    const oppPartner = await getOrCreateOpportunityPartnerAccount(opportunityId);
    const now = await ClockService.now();
    const key = idempotencyKey || `repay_${opportunityId}_${now.getTime()}`;

    const journalRes = await tx.query<{ id: string }>(
      `INSERT INTO journal_entries (idempotency_key, type, description, created_by, created_at)
       VALUES ($1, 'repayment', $2, $3, $4)
       RETURNING id`,
      [
        key,
        `Repayment of £${(totalRepaymentPence / 100).toFixed(2)} (£${(capitalPence / 100).toFixed(2)} cap + £${(interestPence / 100).toFixed(2)} int) for ${opp.title}`,
        actorUserId || null,
        now.toISOString(),
      ]
    );
    const journalEntryId = journalRes.rows[0].id;

    // Partner account debited by total repayment
    await tx.query(
      `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
       VALUES ($1, $2, $3, $4)`,
      [journalEntryId, oppPartner.id, -totalRepaymentPence, now.toISOString()]
    );

    const distributions = [];

    // Distribute to each user's wallet and update holdings
    for (const h of activeHoldings) {
      const cShare = capitalMap.get(h.id) || 0;
      const iShare = interestMap.get(h.id) || 0;
      const totalUserShare = cShare + iShare;

      if (totalUserShare > 0) {
        const userWallet = await getOrCreateUserWallet(h.user_id);
        await tx.query(
          `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
           VALUES ($1, $2, $3, $4)`,
          [journalEntryId, userWallet.id, totalUserShare, now.toISOString()]
        );
      }

      const currentPrincipal = Number(h.principal_pence);
      const newPrincipal = currentPrincipal - cShare;
      const newStatus = newPrincipal === 0 ? 'completed' : 'active';

      await tx.query(
        `UPDATE holdings SET principal_pence = $1, status = $2 WHERE id = $3`,
        [newPrincipal, newStatus, h.id]
      );

      distributions.push({
        holdingId: h.id,
        userId: h.user_id,
        capitalPence: cShare,
        interestPence: iShare,
        totalPence: totalUserShare,
      });

      // In-app notification
      await createNotification({
        userId: h.user_id,
        type: 'repayment',
        title: 'Repayment Received',
        message: `You received £${(totalUserShare / 100).toFixed(2)} (£${(cShare / 100).toFixed(2)} capital + £${(iShare / 100).toFixed(2)} interest) from ${opp.title}.`,
        payload: {
          opportunityId,
          opportunityTitle: opp.title,
          capitalPence: cShare,
          interestPence: iShare,
          totalPence: totalUserShare,
        },
      });
    }

    // 5. If all capital repaid, mark opportunity as completed
    const remainingRes = await tx.query<{ remaining: string }>(
      'SELECT COALESCE(SUM(principal_pence), 0) AS remaining FROM holdings WHERE opportunity_id = $1',
      [opportunityId]
    );
    const totalRemaining = Number(remainingRes.rows[0]?.remaining || 0);
    if (totalRemaining === 0) {
      await tx.query(`UPDATE opportunities SET status = 'completed' WHERE id = $1`, [
        opportunityId,
      ]);
    }

    // 6. Record audit log
    await recordAuditLog({
      actorUserId,
      action: 'process_repayment',
      entityType: 'opportunity',
      entityId: opportunityId,
      after: {
        capitalPence,
        interestPence,
        totalRepaymentPence,
        recipientsCount: distributions.length,
      },
      ip,
    });

    return {
      journalEntryId,
      capitalPence,
      interestPence,
      totalPence: totalRepaymentPence,
      recipientsCount: distributions.length,
      distributions,
    };
  });
}

/**
 * Marks an opportunity as defaulted with recovery percentage and discretionary Provision Fund payout (Section 5.11 & 5.12)
 */
export async function processDefault(params: {
  opportunityId: string;
  recoveryPercent: number; // 0 to 100
  provisionPayoutPercent?: number; // 0 to 100
  payoutReason?: string;
  actorUserId?: string;
  idempotencyKey?: string;
  ip?: string;
}): Promise<DefaultResult> {
  const {
    opportunityId,
    recoveryPercent,
    provisionPayoutPercent = 0,
    payoutReason,
    actorUserId,
    idempotencyKey,
    ip,
  } = params;

  if (recoveryPercent < 0 || recoveryPercent > 100) {
    throw new Error('recoveryPercent must be between 0 and 100');
  }
  if (provisionPayoutPercent < 0 || provisionPayoutPercent > 100) {
    throw new Error('provisionPayoutPercent must be between 0 and 100');
  }

  return transaction(async (tx) => {
    // 1. Fetch opportunity
    const oppRes = await tx.query<{ id: string; title: string; risk_tier: string; status: string }>(
      'SELECT id, title, risk_tier, status FROM opportunities WHERE id = $1 FOR UPDATE',
      [opportunityId]
    );
    if (oppRes.rows.length === 0) {
      throw new Error('Opportunity not found');
    }
    const opp = oppRes.rows[0];

    // Uncharted tier is strictly NEVER covered by Provision Fund (Section 5.12)
    if (opp.risk_tier === 'uncharted' && provisionPayoutPercent > 0) {
      throw new Error('Uncharted tier holdings are strictly excluded from Provision Fund coverage');
    }

    // 2. Fetch active holdings
    const holdingsRes = await tx.query<{
      id: string;
      user_id: string;
      principal_pence: string;
      created_at: string;
    }>(
      `SELECT id, user_id, principal_pence, created_at
       FROM holdings
       WHERE opportunity_id = $1 AND principal_pence > 0
       ORDER BY created_at ASC`,
      [opportunityId]
    );

    const activeHoldings = holdingsRes.rows;
    if (activeHoldings.length === 0) {
      throw new Error('No active holdings found for this opportunity');
    }

    const totalPrincipal = activeHoldings.reduce(
      (sum, h) => sum + Number(h.principal_pence),
      0
    );

    const now = await ClockService.now();
    const baseKey = idempotencyKey || `default_${opportunityId}_${now.getTime()}`;

    // 3. Calculate recovery amount
    const totalRecoveredPence = Math.round(totalPrincipal * (recoveryPercent / 100));
    let recoveryJournalEntryId: string | null = null;

    const weights = activeHoldings.map((h) => ({
      id: h.id,
      weight: Number(h.principal_pence),
      tieBreaker: h.created_at,
    }));

    const recoveryMap = distributeProRataLargestRemainder(totalRecoveredPence, weights);

    // 4. Post recovery to ledger if > 0
    if (totalRecoveredPence > 0) {
      const oppPartner = await getOrCreateOpportunityPartnerAccount(opportunityId);
      const recJournalRes = await tx.query<{ id: string }>(
        `INSERT INTO journal_entries (idempotency_key, type, description, created_by, created_at)
         VALUES ($1, 'repayment', $2, $3, $4)
         RETURNING id`,
        [
          `${baseKey}_rec`,
          `Default recovery of £${(totalRecoveredPence / 100).toFixed(2)} (${recoveryPercent}%) for ${opp.title}`,
          actorUserId || null,
          now.toISOString(),
        ]
      );
      recoveryJournalEntryId = recJournalRes.rows[0].id;

      // Partner account debited
      await tx.query(
        `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
         VALUES ($1, $2, $3, $4)`,
        [recoveryJournalEntryId, oppPartner.id, -totalRecoveredPence, now.toISOString()]
      );

      // Each user wallet credited with their recovery share
      for (const h of activeHoldings) {
        const share = recoveryMap.get(h.id) || 0;
        if (share > 0) {
          const userWallet = await getOrCreateUserWallet(h.user_id);
          await tx.query(
            `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
             VALUES ($1, $2, $3, $4)`,
            [recoveryJournalEntryId, userWallet.id, share, now.toISOString()]
          );
        }
      }
    }

    // 5. Calculate loss for each holding
    const losses: {
      holdingId: string;
      userId: string;
      currentPrincipal: number;
      recoveredShare: number;
      lossPence: number;
    }[] = activeHoldings.map((h) => {
      const principal = Number(h.principal_pence);
      const recovered = recoveryMap.get(h.id) || 0;
      return {
        holdingId: h.id,
        userId: h.user_id,
        currentPrincipal: principal,
        recoveredShare: recovered,
        lossPence: principal - recovered,
      };
    });

    const totalLossPence = losses.reduce((sum, l) => sum + l.lossPence, 0);

    // 6. Handle Discretionary Provision Fund Payout (Section 5.12)
    let provisionJournalEntryId: string | null = null;
    let totalProvisionPayoutPence = 0;
    const pfPayoutMap = new Map<string, number>();

    if (provisionPayoutPercent > 0 && totalLossPence > 0) {
      const pfAccount = await getOrCreateSystemAccount('provision_fund');

      // Check available fund balance
      const pfBalRes = await tx.query<{ balance_pence: string }>(
        'SELECT balance_pence FROM account_balances WHERE account_id = $1',
        [pfAccount.id]
      );
      const availablePfBalance = Math.max(0, Number(pfBalRes.rows[0]?.balance_pence || 0));

      const requestedPfPayout = Math.round(totalLossPence * (provisionPayoutPercent / 100));
      totalProvisionPayoutPence = Math.min(availablePfBalance, requestedPfPayout);

      if (totalProvisionPayoutPence > 0) {
        // Distribute PF payout pro-rata based on individual losses
        const lossWeights = losses.map((l) => ({
          id: l.holdingId,
          weight: l.lossPence,
        }));
        const distributedPf = distributeProRataLargestRemainder(
          totalProvisionPayoutPence,
          lossWeights
        );

        for (const [k, v] of distributedPf.entries()) {
          pfPayoutMap.set(k, v);
        }

        const pfJournalRes = await tx.query<{ id: string }>(
          `INSERT INTO journal_entries (idempotency_key, type, description, created_by, created_at)
           VALUES ($1, 'provision_payout', $2, $3, $4)
           RETURNING id`,
          [
            `${baseKey}_pf`,
            `Provision Fund discretionary payout of £${(totalProvisionPayoutPence / 100).toFixed(2)} for ${opp.title}: ${payoutReason || 'Default coverage'}`,
            actorUserId || null,
            now.toISOString(),
          ]
        );
        provisionJournalEntryId = pfJournalRes.rows[0].id;

        // Postings: provision_fund debited, user wallets credited
        await tx.query(
          `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
           VALUES ($1, $2, $3, $4)`,
          [provisionJournalEntryId, pfAccount.id, -totalProvisionPayoutPence, now.toISOString()]
        );

        for (const l of losses) {
          const pfShare = pfPayoutMap.get(l.holdingId) || 0;
          if (pfShare > 0) {
            const userWallet = await getOrCreateUserWallet(l.userId);
            await tx.query(
              `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
               VALUES ($1, $2, $3, $4)`,
              [provisionJournalEntryId, userWallet.id, pfShare, now.toISOString()]
            );
          }
        }
      }
    }

    // 7. Record holding_losses, zero out principal, and set status to 'defaulted'
    for (const l of losses) {
      const pfShare = pfPayoutMap.get(l.holdingId) || 0;
      await tx.query(
        `INSERT INTO holding_losses (holding_id, user_id, opportunity_id, amount_pence, provision_payout_pence, payout_reason, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          l.holdingId,
          l.userId,
          opportunityId,
          l.lossPence,
          pfShare,
          payoutReason || 'Discretionary provision payout',
          now.toISOString(),
        ]
      );

      await tx.query(
        `UPDATE holdings SET principal_pence = 0, status = 'defaulted' WHERE id = $1`,
        [l.holdingId]
      );

      // Send in-app notification
      await createNotification({
        userId: l.userId,
        type: 'default',
        title: 'Business Default Update',
        message: `Update on ${opp.title}: The business was unable to repay. You received £${(l.recoveredShare / 100).toFixed(2)} recovery and £${(pfShare / 100).toFixed(2)} from the Provision Fund.`,
        payload: {
          opportunityId,
          opportunityTitle: opp.title,
          recoveredPence: l.recoveredShare,
          lossPence: l.lossPence,
          provisionPayoutPence: pfShare,
          payoutReason,
        },
      });
    }

    // 8. Update opportunity status to 'defaulted'
    await tx.query(`UPDATE opportunities SET status = 'defaulted' WHERE id = $1`, [opportunityId]);

    // 9. Record audit log
    await recordAuditLog({
      actorUserId,
      action: 'process_default',
      entityType: 'opportunity',
      entityId: opportunityId,
      after: {
        recoveryPercent,
        provisionPayoutPercent,
        totalLossPence,
        totalRecoveredPence,
        totalProvisionPayoutPence,
        payoutReason,
      },
      ip,
    });

    return {
      recoveryJournalEntryId,
      provisionJournalEntryId,
      totalLossPence,
      totalRecoveredPence,
      totalProvisionPayoutPence,
      affectedHoldersCount: losses.length,
    };
  });
}
