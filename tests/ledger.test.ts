import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  depositDemoMoney,
  withdrawDemoMoney,
  getWalletBalancePence,
  getWalletTransactions,
  getOrCreateUserWallet,
  runReconciliation,
  MAX_WALLET_BALANCE_PENCE,
} from '@/lib/ledger';
import { getDb, query, closeDb } from '@/lib/db';
import { registerUser } from '@/lib/auth';

describe('Double-Entry Ledger & Demo Wallet (Milestone 2)', () => {
  let testUserId: string;

  beforeAll(async () => {
    await getDb('memory://');

    const user = await registerUser({
      email: 'ledger_tester@atlas.demo',
      password: 'StrongLedgerPass123!',
      fullName: 'Ledger Tester',
      dateOfBirth: '1992-04-10',
      postcode: 'EC1A 1BB',
    });
    testUserId = user.userId;
  });

  afterAll(async () => {
    await closeDb();
  });

  it('initializes wallet with zero balance derived from postings', async () => {
    const balance = await getWalletBalancePence(testUserId);
    expect(balance).toBe(0);
  });

  it('deposits demo money and creates balanced ledger postings', async () => {
    const amountPence = 10000; // £100.00
    const key = 'test_dep_100';

    const { journalEntryId, newBalancePence } = await depositDemoMoney({
      userId: testUserId,
      amountPence,
      idempotencyKey: key,
      description: 'First demo deposit',
    });

    expect(newBalancePence).toBe(10000);
    expect(journalEntryId).toBeDefined();

    // Verify balance view
    const currentBalance = await getWalletBalancePence(testUserId);
    expect(currentBalance).toBe(10000);

    // Verify that the postings for this journal entry net to zero
    const postingsRes = await query<{ amount_pence: string }>(
      'SELECT amount_pence FROM postings WHERE journal_entry_id = $1',
      [journalEntryId]
    );
    expect(postingsRes.rows.length).toBe(2);

    const sum = postingsRes.rows.reduce(
      (acc, r) => acc + Number(r.amount_pence),
      0
    );
    expect(sum).toBe(0);
  });

  it('enforces idempotency on deposits: duplicate key does not double-credit', async () => {
    const key = 'test_dep_idempotent';
    const amountPence = 5000; // £50.00

    const first = await depositDemoMoney({
      userId: testUserId,
      amountPence,
      idempotencyKey: key,
    });
    expect(first.newBalancePence).toBe(15000);

    const second = await depositDemoMoney({
      userId: testUserId,
      amountPence,
      idempotencyKey: key,
    });
    expect(second.journalEntryId).toBe(first.journalEntryId);
    expect(second.newBalancePence).toBe(15000);

    const finalBalance = await getWalletBalancePence(testUserId);
    expect(finalBalance).toBe(15000); // Not 20,000!
  });

  it('withdraws demo money and balances to zero', async () => {
    const withdrawAmount = 2500; // £25.00
    const key = 'test_with_25';

    const { journalEntryId, newBalancePence } = await withdrawDemoMoney({
      userId: testUserId,
      amountPence: withdrawAmount,
      idempotencyKey: key,
    });

    expect(newBalancePence).toBe(12500); // 15000 - 2500

    const postingsRes = await query<{ amount_pence: string }>(
      'SELECT amount_pence FROM postings WHERE journal_entry_id = $1',
      [journalEntryId]
    );
    expect(postingsRes.rows.length).toBe(2);

    const sum = postingsRes.rows.reduce(
      (acc, r) => acc + Number(r.amount_pence),
      0
    );
    expect(sum).toBe(0);
  });

  it('rejects withdrawal if funds are insufficient (prevents negative wallet)', async () => {
    const excessiveAmount = 9999999; // £99,999.99

    await expect(
      withdrawDemoMoney({
        userId: testUserId,
        amountPence: excessiveAmount,
        idempotencyKey: 'fail_withdraw_excess',
      })
    ).rejects.toThrow(/Insufficient funds/);

    // Balance remains unchanged
    const currentBalance = await getWalletBalancePence(testUserId);
    expect(currentBalance).toBe(12500);
  });

  it('enforces maximum £5,000 wallet limit on deposits', async () => {
    const overLimitDeposit = MAX_WALLET_BALANCE_PENCE + 1;

    await expect(
      depositDemoMoney({
        userId: testUserId,
        amountPence: overLimitDeposit,
        idempotencyKey: 'over_limit_key',
      })
    ).rejects.toThrow(/cannot exceed £5,000/);
  });

  it('enforces append-only immutability on journal_entries and postings', async () => {
    const entries = await query<{ id: string }>('SELECT id FROM journal_entries LIMIT 1');
    const entryId = entries.rows[0].id;

    // UPDATE on journal_entries must fail
    await expect(
      query(`UPDATE journal_entries SET description = 'Modified' WHERE id = $1`, [entryId])
    ).rejects.toThrow(/append-only/);

    // DELETE on journal_entries must fail
    await expect(
      query(`DELETE FROM journal_entries WHERE id = $1`, [entryId])
    ).rejects.toThrow(/append-only/);

    const postings = await query<{ id: string }>('SELECT id FROM postings LIMIT 1');
    const postingId = postings.rows[0].id;

    // UPDATE on postings must fail
    await expect(
      query(`UPDATE postings SET amount_pence = 999 WHERE id = $1`, [postingId])
    ).rejects.toThrow(/append-only/);

    // DELETE on postings must fail
    await expect(
      query(`DELETE FROM postings WHERE id = $1`, [postingId])
    ).rejects.toThrow(/append-only/);
  });

  it('returns full wallet transaction history with linked journal entry IDs', async () => {
    const history = await getWalletTransactions(testUserId);
    expect(history.length).toBeGreaterThanOrEqual(3);

    for (const tx of history) {
      expect(tx.id).toBeDefined();
      expect(tx.journalEntryId).toBeDefined();
      expect(tx.idempotencyKey).toBeDefined();
      expect(['deposit', 'withdrawal']).toContain(tx.type);
      expect(typeof tx.amountPence).toBe('number');
    }
  });

  it('passes automated ledger reconciliation check (Section 8.5)', async () => {
    const report = await runReconciliation();
    expect(report.passed).toBe(true);
    expect(report.mismatches.length).toBe(0);
    expect(report.checks.every((c) => c.passed)).toBe(true);
  });
});
