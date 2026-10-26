import { query, transaction, getDb } from './db';
import { recordAuditLog } from './audit';
import { ClockService } from './clock';

export interface LedgerAccount {
  id: string;
  code: string;
  type: 'asset' | 'liability' | 'income' | 'expense' | 'equity';
  owner_user_id: string | null;
  opportunity_id: string | null;
  purpose:
    | 'user_wallet'
    | 'opportunity_escrow'
    | 'opportunity_partner'
    | 'provision_fund'
    | 'platform_fees'
    | 'external_bank'
    | 'prize_vouchers';
  created_at: string;
}

export interface JournalEntry {
  id: string;
  idempotency_key: string;
  type: string;
  description: string;
  created_by: string | null;
  created_at: string;
}

export interface WalletTransaction {
  id: string;
  journalEntryId: string;
  idempotencyKey: string;
  type: string;
  description: string;
  amountPence: number;
  createdAt: string;
}

export interface ReconciliationReport {
  passed: boolean;
  timestamp: string;
  checks: {
    name: string;
    passed: boolean;
    details: string;
  }[];
  mismatches: string[];
}

/**
 * Max wallet balance allowed for demo users (£5,000 = 500,000 pence) per Section 5.5
 */
export const MAX_WALLET_BALANCE_PENCE = 500000;

/**
 * Returns or creates the dedicated system account for a given purpose
 */
export async function getOrCreateSystemAccount(
  purpose: 'external_bank' | 'provision_fund' | 'platform_fees' | 'prize_vouchers'
): Promise<LedgerAccount> {
  const code = `system:${purpose}`;
  const types: Record<string, 'asset' | 'liability' | 'income' | 'expense' | 'equity'> = {
    external_bank: 'asset',
    provision_fund: 'equity',
    platform_fees: 'income',
    prize_vouchers: 'expense',
  };

  const existing = await query<LedgerAccount>(
    'SELECT * FROM ledger_accounts WHERE code = $1',
    [code]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const res = await query<LedgerAccount>(
    `INSERT INTO ledger_accounts (code, type, purpose)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [code, types[purpose], purpose]
  );
  return res.rows[0];
}

/**
 * Returns or creates the user's wallet ledger account
 */
export async function getOrCreateUserWallet(userId: string): Promise<LedgerAccount> {
  const code = `user:${userId}:wallet`;
  const existing = await query<LedgerAccount>(
    'SELECT * FROM ledger_accounts WHERE code = $1',
    [code]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const res = await query<LedgerAccount>(
    `INSERT INTO ledger_accounts (code, type, owner_user_id, purpose)
     VALUES ($1, 'liability', $2, 'user_wallet')
     RETURNING *`,
    [code, userId]
  );
  return res.rows[0];
}

/**
 * Returns or creates the escrow ledger account for an opportunity
 */
export async function getOrCreateOpportunityEscrow(
  opportunityId: string
): Promise<LedgerAccount> {
  const code = `opp:${opportunityId}:escrow`;
  const existing = await query<LedgerAccount>(
    'SELECT * FROM ledger_accounts WHERE code = $1',
    [code]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const res = await query<LedgerAccount>(
    `INSERT INTO ledger_accounts (code, type, opportunity_id, purpose)
     VALUES ($1, 'liability', $2, 'opportunity_escrow')
     RETURNING *`,
    [code, opportunityId]
  );
  return res.rows[0];
}

/**
 * Returns or creates the partner borrower ledger account for an opportunity
 */
export async function getOrCreateOpportunityPartnerAccount(
  opportunityId: string
): Promise<LedgerAccount> {
  const code = `opp:${opportunityId}:partner`;
  const existing = await query<LedgerAccount>(
    'SELECT * FROM ledger_accounts WHERE code = $1',
    [code]
  );
  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const res = await query<LedgerAccount>(
    `INSERT INTO ledger_accounts (code, type, opportunity_id, purpose)
     VALUES ($1, 'asset', $2, 'opportunity_partner')
     RETURNING *`,
    [code, opportunityId]
  );
  return res.rows[0];
}

/**
 * Returns user wallet balance derived from ledger postings
 */
export async function getWalletBalancePence(userId: string): Promise<number> {
  const wallet = await getOrCreateUserWallet(userId);
  const res = await query<{ balance_pence: string | number }>(
    `SELECT balance_pence FROM account_balances WHERE account_id = $1`,
    [wallet.id]
  );
  if (res.rows.length === 0) return 0;
  return Number(res.rows[0].balance_pence) || 0;
}

/**
 * Adds demo money to a user's wallet (Deposit)
 */
export async function depositDemoMoney(params: {
  userId: string;
  amountPence: number;
  idempotencyKey: string;
  description?: string;
  ip?: string;
}): Promise<{ journalEntryId: string; newBalancePence: number }> {
  const { userId, amountPence, idempotencyKey, description, ip } = params;

  if (!Number.isInteger(amountPence) || amountPence <= 0) {
    throw new Error('Deposit amount must be a positive integer in pence');
  }

  return transaction(async (tx) => {
    // 1. Idempotency check
    const existing = await tx.query(
      'SELECT id FROM journal_entries WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (existing.rows.length > 0) {
      const balance = await getWalletBalancePence(userId);
      return { journalEntryId: existing.rows[0].id, newBalancePence: balance };
    }

    // 2. Fetch and lock wallet account
    const userWallet = await getOrCreateUserWallet(userId);
    const bankAccount = await getOrCreateSystemAccount('external_bank');

    await tx.query('SELECT id FROM ledger_accounts WHERE id = $1 FOR UPDATE', [
      userWallet.id,
    ]);

    // 3. Check max balance limit (£5,000)
    const currentBalance = await getWalletBalancePence(userId);
    if (currentBalance + amountPence > MAX_WALLET_BALANCE_PENCE) {
      throw new Error(
        `Wallet balance cannot exceed £5,000. Current balance: £${(
          currentBalance / 100
        ).toFixed(2)}, attempted deposit: £${(amountPence / 100).toFixed(2)}`
      );
    }

    const now = await ClockService.now();
    const entryDesc = description || `Demo deposit of £${(amountPence / 100).toFixed(2)}`;

    // 4. Create journal entry
    const entryRes = await tx.query(
      `INSERT INTO journal_entries (idempotency_key, type, description, created_by, created_at)
       VALUES ($1, 'deposit', $2, $3, $4)
       RETURNING id`,
      [idempotencyKey, entryDesc, userId, now.toISOString()]
    );
    const journalEntryId = entryRes.rows[0].id;

    // 5. Create balanced postings:
    // external_bank: -amount (credit)
    // user_wallet: +amount (debit)
    await tx.query(
      `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
       VALUES ($1, $2, $3, $4), ($1, $5, $6, $4)`,
      [
        journalEntryId,
        bankAccount.id,
        -amountPence,
        now.toISOString(),
        userWallet.id,
        amountPence,
      ]
    );

    // 6. Audit log
    await recordAuditLog({
      actorUserId: userId,
      action: 'WALLET_DEPOSIT',
      entityType: 'journal_entries',
      entityId: journalEntryId,
      after: {
        amount_pence: amountPence,
        new_balance_pence: currentBalance + amountPence,
        idempotency_key: idempotencyKey,
      },
      ip,
    });

    return {
      journalEntryId,
      newBalancePence: currentBalance + amountPence,
    };
  });
}

/**
 * Withdraws demo money from a user's wallet
 */
export async function withdrawDemoMoney(params: {
  userId: string;
  amountPence: number;
  idempotencyKey: string;
  description?: string;
  ip?: string;
}): Promise<{ journalEntryId: string; newBalancePence: number }> {
  const { userId, amountPence, idempotencyKey, description, ip } = params;

  if (!Number.isInteger(amountPence) || amountPence <= 0) {
    throw new Error('Withdrawal amount must be a positive integer in pence');
  }

  return transaction(async (tx) => {
    // 1. Idempotency check
    const existing = await tx.query(
      'SELECT id FROM journal_entries WHERE idempotency_key = $1',
      [idempotencyKey]
    );
    if (existing.rows.length > 0) {
      const balance = await getWalletBalancePence(userId);
      return { journalEntryId: existing.rows[0].id, newBalancePence: balance };
    }

    // 2. Fetch and lock wallet account
    const userWallet = await getOrCreateUserWallet(userId);
    const bankAccount = await getOrCreateSystemAccount('external_bank');

    await tx.query('SELECT id FROM ledger_accounts WHERE id = $1 FOR UPDATE', [
      userWallet.id,
    ]);

    // 3. Verify sufficient funds
    const currentBalance = await getWalletBalancePence(userId);
    if (currentBalance < amountPence) {
      throw new Error(
        `Insufficient funds. Available balance: £${(currentBalance / 100).toFixed(
          2
        )}, requested: £${(amountPence / 100).toFixed(2)}`
      );
    }

    const now = await ClockService.now();
    const entryDesc = description || `Demo withdrawal of £${(amountPence / 100).toFixed(2)}`;

    // 4. Create journal entry
    const entryRes = await tx.query(
      `INSERT INTO journal_entries (idempotency_key, type, description, created_by, created_at)
       VALUES ($1, 'withdrawal', $2, $3, $4)
       RETURNING id`,
      [idempotencyKey, entryDesc, userId, now.toISOString()]
    );
    const journalEntryId = entryRes.rows[0].id;

    // 5. Create balanced postings:
    // user_wallet: -amount
    // external_bank: +amount
    await tx.query(
      `INSERT INTO postings (journal_entry_id, account_id, amount_pence, created_at)
       VALUES ($1, $2, $3, $4), ($1, $5, $6, $4)`,
      [
        journalEntryId,
        userWallet.id,
        -amountPence,
        now.toISOString(),
        bankAccount.id,
        amountPence,
      ]
    );

    // 6. Audit log
    await recordAuditLog({
      actorUserId: userId,
      action: 'WALLET_WITHDRAWAL',
      entityType: 'journal_entries',
      entityId: journalEntryId,
      after: {
        amount_pence: amountPence,
        new_balance_pence: currentBalance - amountPence,
        idempotency_key: idempotencyKey,
      },
      ip,
    });

    return {
      journalEntryId,
      newBalancePence: currentBalance - amountPence,
    };
  });
}

/**
 * Returns full transaction history for a user's wallet
 */
export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const wallet = await getOrCreateUserWallet(userId);

  const res = await query<any>(
    `SELECT
       p.id,
       p.journal_entry_id AS "journalEntryId",
       j.idempotency_key AS "idempotencyKey",
       j.type,
       j.description,
       p.amount_pence AS "amountPence",
       p.created_at AS "createdAt"
     FROM postings p
     JOIN journal_entries j ON p.journal_entry_id = j.id
     WHERE p.account_id = $1
     ORDER BY p.created_at DESC`,
    [wallet.id]
  );

  return res.rows.map((row) => ({
    id: row.id,
    journalEntryId: row.journalEntryId,
    idempotencyKey: row.idempotencyKey,
    type: row.type,
    description: row.description,
    amountPence: Number(row.amountPence),
    createdAt: row.createdAt,
  }));
}

/**
 * Double-Entry Reconciliation (Section 8.5)
 */
export async function runReconciliation(): Promise<ReconciliationReport> {
  const mismatches: string[] = [];
  const checks: { name: string; passed: boolean; details: string }[] = [];
  const now = await ClockService.nowISO();

  // 1. Every journal entry sums to zero
  const unbalanced = await query<{
    journal_entry_id: string;
    sum_pence: string;
    type: string;
  }>(
    `SELECT
       p.journal_entry_id,
       j.type,
       SUM(p.amount_pence) AS sum_pence
     FROM postings p
     JOIN journal_entries j ON p.journal_entry_id = j.id
     GROUP BY p.journal_entry_id, j.type
     HAVING SUM(p.amount_pence) <> 0`
  );

  const check1Passed = unbalanced.rows.length === 0;
  if (!check1Passed) {
    unbalanced.rows.forEach((r) => {
      mismatches.push(
        `Journal entry ${r.journal_entry_id} (${r.type}) is unbalanced by ${r.sum_pence}p`
      );
    });
  }
  checks.push({
    name: 'Journal Entries Balanced',
    passed: check1Passed,
    details: check1Passed
      ? 'All journal entries net to zero exactly'
      : `${unbalanced.rows.length} unbalanced journal entry/entries found`,
  });

  // 2. No user wallet is negative
  const negativeWallets = await query<{
    code: string;
    owner_user_id: string;
    balance_pence: string;
  }>(
    `SELECT code, owner_user_id, balance_pence
     FROM account_balances
     WHERE purpose = 'user_wallet' AND balance_pence < 0`
  );

  const check2Passed = negativeWallets.rows.length === 0;
  if (!check2Passed) {
    negativeWallets.rows.forEach((r) => {
      mismatches.push(
        `User wallet ${r.code} has negative balance: ${r.balance_pence}p`
      );
    });
  }
  checks.push({
    name: 'No Negative Wallets',
    passed: check2Passed,
    details: check2Passed
      ? 'All user wallets have non-negative balances'
      : `${negativeWallets.rows.length} negative wallet(s) found`,
  });

  // 3. Provision Fund balance = contributions - payouts
  const pfAccount = await getOrCreateSystemAccount('provision_fund');
  const pfBalanceRes = await query<{ balance_pence: string }>(
    `SELECT balance_pence FROM account_balances WHERE account_id = $1`,
    [pfAccount.id]
  );
  const pfBalance = Number(pfBalanceRes.rows[0]?.balance_pence || 0);

  const pfPostingsRes = await query<{
    contributions: string;
    payouts: string;
  }>(
    `SELECT
       COALESCE(SUM(CASE WHEN j.type IN ('provision_contribution', 'disbursement') THEN p.amount_pence ELSE 0 END), 0) AS contributions,
       COALESCE(SUM(CASE WHEN j.type = 'provision_payout' THEN -p.amount_pence ELSE 0 END), 0) AS payouts
     FROM postings p
     JOIN journal_entries j ON p.journal_entry_id = j.id
     WHERE p.account_id = $1`,
    [pfAccount.id]
  );

  const contributions = Number(pfPostingsRes.rows[0]?.contributions || 0);
  const payouts = Number(pfPostingsRes.rows[0]?.payouts || 0);
  const expectedPfBalance = contributions - payouts;
  const check3Passed = pfBalance === expectedPfBalance;

  if (!check3Passed) {
    mismatches.push(
      `Provision Fund balance (${pfBalance}p) does not match contributions (${contributions}p) - payouts (${payouts}p)`
    );
  }
  checks.push({
    name: 'Provision Fund Reconciled',
    passed: check3Passed,
    details: check3Passed
      ? `Provision Fund balance (${(pfBalance / 100).toFixed(2)}) matches ledger activity`
      : `Provision Fund mismatch: actual ${pfBalance}p vs expected ${expectedPfBalance}p`,
  });

  const passed = checks.every((c) => c.passed);

  return {
    passed,
    timestamp: now,
    checks,
    mismatches,
  };
}

export interface ProvisionFundPayout {
  id: string;
  opportunityTitle: string;
  amountPence: number;
  payoutReason: string;
  createdAt: string;
}

export interface ProvisionFundStatus {
  balancePence: number;
  outstandingCapitalPence: number;
  coverageRatioPercent: number;
  payouts: ProvisionFundPayout[];
}

export async function getProvisionFundStatus(): Promise<ProvisionFundStatus> {
  const pfAccount = await getOrCreateSystemAccount('provision_fund');
  const pfBalRes = await query<{ balance_pence: string }>(
    `SELECT balance_pence FROM account_balances WHERE account_id = $1`,
    [pfAccount.id]
  );
  const balancePence = Number(pfBalRes.rows[0]?.balance_pence || 0);

  const outstandingRes = await query<{ total_outstanding: string }>(
    `SELECT COALESCE(SUM(h.principal_pence), 0) AS total_outstanding
     FROM holdings h
     JOIN opportunities o ON h.opportunity_id = o.id
     WHERE o.risk_tier IN ('low', 'medium', 'high')
       AND h.status = 'active'`
  );
  const outstandingCapitalPence = Number(outstandingRes.rows[0]?.total_outstanding || 0);

  const coverageRatioPercent =
    outstandingCapitalPence > 0
      ? Number(((balancePence / outstandingCapitalPence) * 100).toFixed(1))
      : balancePence > 0
      ? 100
      : 0;

  const payoutsRes = await query<{
    id: string;
    title: string;
    provision_payout_pence: string;
    payout_reason: string;
    created_at: string;
  }>(
    `SELECT hl.id, o.title, hl.provision_payout_pence, hl.payout_reason, hl.created_at
     FROM holding_losses hl
     JOIN opportunities o ON hl.opportunity_id = o.id
     WHERE hl.provision_payout_pence > 0
     ORDER BY hl.created_at DESC`
  );

  const payouts: ProvisionFundPayout[] = payoutsRes.rows.map((r) => ({
    id: r.id,
    opportunityTitle: r.title,
    amountPence: Number(r.provision_payout_pence),
    payoutReason: r.payout_reason || 'Discretionary provision payout',
    createdAt: r.created_at,
  }));

  return {
    balancePence,
    outstandingCapitalPence,
    coverageRatioPercent,
    payouts,
  };
}

