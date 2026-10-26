import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  executeInvestment,
  getUserLimitsRemaining,
  MIN_INVESTMENT_PENCE,
} from '@/lib/investments';
import { registerUser } from '@/lib/auth';
import { submitSimulatedKyc, submitInvestorClassification, submitAppropriatenessTest } from '@/lib/onboarding';
import { depositDemoMoney, getWalletBalancePence } from '@/lib/ledger';
import { ensureOpportunitiesSeeded } from '@/lib/seed';
import { getOpportunities } from '@/lib/opportunities';
import { getUserPortfolio, generatePortfolioCsv } from '@/lib/portfolio';
import { ClockService } from '@/lib/clock';
import { getDb, closeDb, query } from '@/lib/db';

describe('Investments, Limits & Portfolio (Milestone 5)', () => {
  let investorUserId: string;
  let openLowOppId: string;
  let openUnchartedOppId: string;

  beforeAll(async () => {
    await getDb('memory://');
    await ClockService.reset();
    await ensureOpportunitiesSeeded();

    // 1. Create and fully onboard test investor
    const user = await registerUser({
      email: 'investor_tester_m5@atlas.demo',
      password: 'StrongInvestPassword123!',
      fullName: 'Jordan Taylor',
      dateOfBirth: '1994-03-22',
      postcode: 'M1 1AE',
    });
    investorUserId = user.userId;

    // Verify KYC
    await submitSimulatedKyc({ userId: investorUserId, testName: 'Jordan Taylor' });

    // Classification
    await submitInvestorClassification({ userId: investorUserId, category: 'restricted' });

    // Pass appropriateness test (score 5/5)
    await submitAppropriatenessTest({
      userId: investorUserId,
      answers: { 1: 'a', 4: 'b', 7: 'b', 10: 'a', 13: 'a' },
    });

    // Skip cooling-off period (25 hrs)
    await ClockService.fastForwardHours(25);

    // Deposit £1,000 demo money
    await depositDemoMoney({
      userId: investorUserId,
      amountPence: 100000,
      idempotencyKey: 'seed_investor_tester_m5_funds',
    });

    // Retrieve open opportunities
    const opps = await getOpportunities({ status: 'open' });
    const lowOpp = opps.find((o) => o.risk_tier === 'low')!;
    const unchartedOpp = opps.find((o) => o.risk_tier === 'uncharted')!;

    openLowOppId = lowOpp.id;
    openUnchartedOppId = unchartedOpp.id;
  });

  afterAll(async () => {
    await closeDb();
  });

  it('enforces minimum investment of £10 (1,000p): rejects 999p, accepts 1,000p', async () => {
    // 999 pence should fail
    await expect(
      executeInvestment({
        userId: investorUserId,
        opportunityId: openLowOppId,
        amountPence: 999,
        riskAck: true,
        idempotencyKey: 'fail_min_999',
      })
    ).rejects.toThrow(/Minimum investment is £10/);

    // 1,000 pence should succeed
    const res = await executeInvestment({
      userId: investorUserId,
      opportunityId: openLowOppId,
      amountPence: 1000,
      riskAck: true,
      idempotencyKey: 'pass_min_1000',
    });

    expect(res.amountPence).toBe(1000);
    expect(res.holdingId).toBeDefined();
    expect(res.journalEntryId).toBeDefined();

    // Verify wallet deducted exactly 1000 pence
    const bal = await getWalletBalancePence(investorUserId);
    expect(bal).toBe(99000); // 100,000 - 1,000
  });

  it('requires mandatory risk acknowledgement checkbox (Section 5.8)', async () => {
    await expect(
      executeInvestment({
        userId: investorUserId,
        opportunityId: openLowOppId,
        amountPence: 2000,
        riskAck: false, // Not acknowledged!
        idempotencyKey: 'fail_no_ack',
      })
    ).rejects.toThrow(/acknowledge/);
  });

  it('enforces stricter £100 (10,000p) limit for Uncharted tier (Section 5.4)', async () => {
    // Attempting 10,001 pence in Uncharted tier must be rejected
    await expect(
      executeInvestment({
        userId: investorUserId,
        opportunityId: openUnchartedOppId,
        amountPence: 10001,
        riskAck: true,
        idempotencyKey: 'fail_uncharted_cap',
      })
    ).rejects.toThrow(/maximum limit of £100\.00/);

    // Exactly 5,000p (£50) succeeds
    const res = await executeInvestment({
      userId: investorUserId,
      opportunityId: openUnchartedOppId,
      amountPence: 5000,
      riskAck: true,
      idempotencyKey: 'pass_uncharted_50',
    });
    expect(res.amountPence).toBe(5000);

    // Now attempting another 6,000p (£60) would total £110 and must be rejected
    await expect(
      executeInvestment({
        userId: investorUserId,
        opportunityId: openUnchartedOppId,
        amountPence: 6000,
        riskAck: true,
        idempotencyKey: 'fail_uncharted_second_slice',
      })
    ).rejects.toThrow(/maximum limit of £100\.00/);
  });

  it('enforces idempotency: identical key returns original holding without double debiting', async () => {
    const key = 'idempotent_test_key_m5';
    const initialBal = await getWalletBalancePence(investorUserId);

    const first = await executeInvestment({
      userId: investorUserId,
      opportunityId: openLowOppId,
      amountPence: 2500,
      riskAck: true,
      idempotencyKey: key,
    });

    const second = await executeInvestment({
      userId: investorUserId,
      opportunityId: openLowOppId,
      amountPence: 2500,
      riskAck: true,
      idempotencyKey: key,
    });

    expect(second.journalEntryId).toBe(first.journalEntryId);

    const finalBal = await getWalletBalancePence(investorUserId);
    expect(finalBal).toBe(initialBal - 2500); // Charged once, not twice!
  });

  it('updates portfolio summary and displays direct holdings (Section 5.10)', async () => {
    const portfolio = await getUserPortfolio(investorUserId);
    expect(portfolio.totalInvestedPence).toBeGreaterThan(0);
    expect(portfolio.holdings.length).toBeGreaterThanOrEqual(2);

    const holdingTiers = portfolio.holdings.map((h) => h.riskTier);
    expect(holdingTiers).toContain('low');
    expect(holdingTiers).toContain('uncharted');

    expect(portfolio.tierBreakdown.low).toBeGreaterThan(0);
    expect(portfolio.tierBreakdown.uncharted).toBe(5000);
  });

  it('generates compliant portfolio CSV statement (Section 5.10)', async () => {
    const csv = await generatePortfolioCsv(investorUserId);
    expect(csv).toContain('Holding ID,Opportunity Title,Partner,Risk Tier,Invested Amount (GBP)');
    expect(csv).toContain('LOW');
    expect(csv).toContain('UNCHARTED');
  });
});
