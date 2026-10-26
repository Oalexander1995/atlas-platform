import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  previewAutoInvestAllocation,
  executeAutoInvestAllocation,
  runMonthlyAutoInvestScheduled,
  SLICE_SIZE_PENCE,
} from '@/lib/auto-invest';
import { registerUser } from '@/lib/auth';
import { submitSimulatedKyc, submitInvestorClassification, submitAppropriatenessTest } from '@/lib/onboarding';
import { depositDemoMoney, getWalletBalancePence } from '@/lib/ledger';
import { ensureOpportunitiesSeeded } from '@/lib/seed';
import { ClockService } from '@/lib/clock';
import { getDb, closeDb, query } from '@/lib/db';

describe('Auto-Invest Allocation Engine (Milestone 6)', () => {
  let testUserId: string;

  beforeAll(async () => {
    await getDb('memory://');
    await ClockService.reset();
    await ensureOpportunitiesSeeded();

    const user = await registerUser({
      email: 'auto_invest_tester@atlas.demo',
      password: 'StrongAutoInvestPass123!',
      fullName: 'Taylor Swift',
      dateOfBirth: '1989-12-13',
      postcode: 'W1A 1AA',
    });
    testUserId = user.userId;

    // Fully onboard test user
    await submitSimulatedKyc({ userId: testUserId, testName: 'Taylor Swift' });
    await submitInvestorClassification({ userId: testUserId, category: 'restricted' });
    await submitAppropriatenessTest({
      userId: testUserId,
      answers: { 1: 'a', 4: 'b', 7: 'b', 10: 'a', 13: 'a' },
    });
    await ClockService.fastForwardHours(25); // Pass cooling-off

    // Deposit £1,000 demo funds
    await depositDemoMoney({
      userId: testUserId,
      amountPence: 100000,
      idempotencyKey: 'seed_funds_for_auto_invest',
    });
  });

  afterAll(async () => {
    await closeDb();
  });

  it('rejects Uncharted tier from Auto-Invest (Section 5.9 Rule 2)', async () => {
    await expect(
      previewAutoInvestAllocation({
        userId: testUserId,
        riskTier: 'uncharted' as any,
        amountPence: 5000,
      })
    ).rejects.toThrow(/Uncharted tier is excluded/);
  });

  it('handles exact multiples: £50 splits into five £10 slices', async () => {
    const preview = await previewAutoInvestAllocation({
      userId: testUserId,
      riskTier: 'medium',
      amountPence: 5000, // £50
    });

    expect(preview.totalSlices).toBe(5);
    expect(preview.allocatedSlices).toBe(5);
    expect(preview.totalAllocatedPence).toBe(5000);
    expect(preview.remainderInWalletPence).toBe(0);
    expect(preview.allocations.length).toBeGreaterThan(0);
  });

  it('handles remainders: £55 splits into five £10 slices with £5 remaining in wallet', async () => {
    const preview = await previewAutoInvestAllocation({
      userId: testUserId,
      riskTier: 'medium',
      amountPence: 5500, // £55
    });

    expect(preview.totalSlices).toBe(5);
    expect(preview.allocatedSlices).toBe(5);
    expect(preview.totalAllocatedPence).toBe(5000);
    expect(preview.remainderInWalletPence).toBe(500); // 500p (£5) remains in wallet
  });

  it('relaxes diversification cap when fewer than 5 eligible opportunities exist (Section 5.9 Rule 3)', async () => {
    // In seed data, Low risk tier has 1 open opportunity
    const preview = await previewAutoInvestAllocation({
      userId: testUserId,
      riskTier: 'low',
      amountPence: 4000, // £40
    });

    expect(preview.notice).toContain('diversification cap relaxed');
    expect(preview.allocatedSlices).toBe(4);
  });

  it('executes Auto-Invest allocation creating one balanced journal entry and individual holdings', async () => {
    const initialBal = await getWalletBalancePence(testUserId);

    const result = await executeAutoInvestAllocation({
      userId: testUserId,
      riskTier: 'medium',
      amountPence: 4000, // £40
      monthlyPence: 5000, // £50/mo plan
      idempotencyKey: 'test_auto_invest_exec_1',
    });

    expect(result.allocatedPence).toBe(4000);
    expect(result.journalEntryId).toBeDefined();

    // Verify wallet deduction
    const finalBal = await getWalletBalancePence(testUserId);
    expect(finalBal).toBe(initialBal - 4000);

    // Verify double-entry ledger postings net to zero exactly
    const postingsRes = await query<{ amount_pence: string }>(
      'SELECT amount_pence FROM postings WHERE journal_entry_id = $1',
      [result.journalEntryId]
    );
    expect(postingsRes.rows.length).toBeGreaterThanOrEqual(2);

    const netSum = postingsRes.rows.reduce((acc, r) => acc + Number(r.amount_pence), 0);
    expect(netSum).toBe(0);

    // Verify holdings created with source = 'auto_invest'
    const holdingsRes = await query<{ principal_pence: string }>(
      `SELECT principal_pence FROM holdings WHERE user_id = $1 AND source = 'auto_invest'`,
      [testUserId]
    );
    expect(holdingsRes.rows.length).toBeGreaterThan(0);
  });

  it('simulates scheduled monthly auto-invest run (Section 5.9)', async () => {
    const monthlyRun = await runMonthlyAutoInvestScheduled();
    expect(monthlyRun.executedCount).toBeGreaterThanOrEqual(1);
    expect(monthlyRun.totalDeployedPence).toBeGreaterThan(0);
  });
});
