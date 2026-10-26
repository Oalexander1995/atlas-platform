import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, closeDb, query } from '../src/lib/db';
import { registerUser } from '../src/lib/auth';
import {
  submitSimulatedKyc,
  submitInvestorClassification,
  submitAppropriatenessTest,
  getOnboardingStatus,
} from '../src/lib/onboarding';
import { ClockService } from '../src/lib/clock';
import {
  depositDemoMoney,
  getWalletBalancePence,
  runReconciliation,
  getProvisionFundStatus,
} from '../src/lib/ledger';
import { executeInvestment } from '../src/lib/investments';
import { getUserPortfolio } from '../src/lib/portfolio';
import { executeAutoInvestAllocation } from '../src/lib/auto-invest';
import { disburseOpportunity, processRepayment, processDefault } from '../src/lib/lifecycle';
import { awardPoints, getUserPointsBalance } from '../src/lib/points';
import { askCoach } from '../src/lib/coach';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '../src/lib/seed';

describe('End-to-End Definition of Done Journey (Section 0.2)', () => {
  const e2eEmail = `e2e_investor_${Date.now()}@atlas.demo`;
  const e2ePassword = 'StrongE2EPassword123!';
  let userId: string;
  let testOppId: string;

  beforeAll(async () => {
    await getDb('memory://');
    await ClockService.reset();
    await ensureDemoUsersSeeded();
    await ensureOpportunitiesSeeded();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('Step 1: User signs up, passes simulated KYC, and classifies as investor', async () => {
    const userRes = await registerUser({
      email: e2eEmail,
      password: e2ePassword,
      fullName: 'Emma Watson',
      dateOfBirth: '1995-04-15',
      postcode: 'SW1A 1AA',
    });
    expect(userRes).toBeDefined();
    expect(userRes.email).toBe(e2eEmail);
    userId = userRes.userId;

    // Simulate KYC pass
    const kycResult = await submitSimulatedKyc({
      userId,
      testName: 'Emma Watson',
    });
    expect(kycResult.verified).toBe(true);

    // Investor classification
    await submitInvestorClassification({
      userId,
      category: 'restricted',
    });
    const status = await getOnboardingStatus(userId);
    expect(status.classification).toBe('restricted');
  });

  it('Step 2: Appropriateness test failure, cooling wait, pass, and 24-hr cooling-off pause', async () => {
    // Attempt with failing answers (score < 80%)
    const failResult = await submitAppropriatenessTest({
      userId,
      answers: { 1: 'b', 4: 'a', 7: 'a', 10: 'b', 13: 'b' },
    });
    expect(failResult.passed).toBe(false);

    // Immediate status should show failed test
    const statusBefore = await getOnboardingStatus(userId);
    expect(statusBefore.isReadyToInvest).toBe(false);
    expect(statusBefore.appropriateness.passed).toBe(false);

    // Fast-forward clock by 25 hours to clear re-test cooldown
    await ClockService.fastForwardHours(25);

    // Now re-attempt with 100% correct answers
    const passResult = await submitAppropriatenessTest({
      userId,
      answers: { 1: 'a', 4: 'b', 7: 'b', 10: 'a', 13: 'a' },
    });
    expect(passResult.passed).toBe(true);
    expect(passResult.score).toBe(5);

    // 24-hour statutory cooling-off period starts now!
    const duringCoolingOff = await getOnboardingStatus(userId);
    expect(duringCoolingOff.isReadyToInvest).toBe(false);
    expect(duringCoolingOff.coolingOff.secondsRemaining).toBeGreaterThan(0);

    // Fast-forward clock 25 hours to complete statutory cooling-off
    await ClockService.fastForwardHours(25);

    const afterCoolingOff = await getOnboardingStatus(userId);
    expect(afterCoolingOff.isReadyToInvest).toBe(true);
  });

  it('Step 3: Deposit £500 demo money into wallet via double-entry ledger', async () => {
    // Deposit £500 (50,000 pence)
    const deposit = await depositDemoMoney({
      userId,
      amountPence: 50000,
      idempotencyKey: `e2e_deposit_${Date.now()}`,
    });
    expect(deposit.newBalancePence).toBe(50000);
    expect(deposit.journalEntryId).toBeDefined();

    const balance = await getWalletBalancePence(userId);
    expect(balance).toBe(50000);
  });

  it('Step 4: Browse opportunities and invest £25 in a single opportunity', async () => {
    const oppRes = await query<{ id: string; title: string; risk_tier: string }>(
      `SELECT id, title, risk_tier
       FROM opportunities
       WHERE status = 'open'
       ORDER BY opens_at DESC
       LIMIT 1`
    );
    expect(oppRes.rows.length).toBeGreaterThan(0);
    const opportunity = oppRes.rows[0];

    // Invest £25 (2,500 pence)
    const investRes = await executeInvestment({
      userId,
      opportunityId: opportunity.id,
      amountPence: 2500,
      riskAck: true,
      idempotencyKey: `e2e_invest_${Date.now()}`,
    });
    expect(investRes.holdingId).toBeDefined();
    expect(investRes.amountPence).toBe(2500);
    expect(investRes.newBalancePence).toBe(47500);

    // Verify wallet balance decreased by £25
    const wallet = await getWalletBalancePence(userId);
    expect(wallet).toBe(47500);

    // Verify holding record exists in portfolio
    const portfolio = await getUserPortfolio(userId);
    const myHolding = portfolio.holdings.find((h) => h.opportunityId === opportunity.id);
    expect(myHolding).toBeDefined();
    expect(myHolding?.principalPence).toBe(2500);
  });

  it('Step 5: Set up £100 Auto-Invest plan across Medium tier and run allocation', async () => {
    // Execute Auto-Invest allocation of £100 (10,000 pence)
    const runResult = await executeAutoInvestAllocation({
      userId,
      riskTier: 'medium',
      amountPence: 10000,
      idempotencyKey: `auto_invest_e2e_${Date.now()}`,
    });
    expect(runResult.allocatedPence).toBeGreaterThan(0);
    expect(runResult.allocations.length).toBeGreaterThan(0);

    // Verify wallet decreased by total allocated
    const wallet = await getWalletBalancePence(userId);
    expect(wallet).toBe(47500 - runResult.allocatedPence);
  });

  it('Step 6: Admin opportunity lifecycle: fully fund -> disburse -> repayment -> default with Provision Fund payout', async () => {
    const partnerRes = await query<{ id: string }>('SELECT id FROM partners LIMIT 1');
    const partnerId = partnerRes.rows[0].id;

    // 1. Create and fund a dedicated opportunity for lifecycle simulation
    const oppInsert = await query<{ id: string }>(
      `INSERT INTO opportunities (
        partner_id, title, summary, description, risk_tier, sector,
        target_pence, expected_return_min_bps, expected_return_max_bps,
        term_months, status, platform_fee_bps, provision_contribution_bps,
        per_user_cap_pence, opens_at, closes_at
      ) VALUES (
        $1, $2, 'E2E Lifecycle Test', 'Testing loan lifecycle and Provision Fund safety net',
        'medium', 'Food & Beverage', 50000, 600, 800, 12, 'open', 200, 100, 100000,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
      ) RETURNING id`,
      [partnerId, `E2E Lifecycle Bakery Loan ${Date.now()}`]
    );
    testOppId = oppInsert.rows[0].id;

    // Invest in this opportunity so an investor holding exists
    await executeInvestment({
      userId,
      opportunityId: testOppId,
      amountPence: 5000,
      riskAck: true,
      idempotencyKey: `e2e_lifecycle_inv_${Date.now()}`,
    });

    // 2. Disburse opportunity
    const initialFundStatus = await getProvisionFundStatus();
    const disburseResult = await disburseOpportunity({
      opportunityId: testOppId,
      actorUserId: userId,
    });
    expect(disburseResult.journalEntryId).toBeDefined();
    expect(disburseResult.platformFeePence).toBeGreaterThan(0);
    expect(disburseResult.provisionContributionPence).toBeGreaterThan(0);

    const fundAfterDisburse = await getProvisionFundStatus();
    expect(fundAfterDisburse.balancePence).toBeGreaterThanOrEqual(initialFundStatus.balancePence);

    // 3. Process repayment: £20 principal + £5 interest
    const repaymentResult = await processRepayment({
      opportunityId: testOppId,
      capitalPence: 2000,
      interestPence: 500,
      notes: 'Month 1 E2E repayment',
      actorUserId: userId,
    });
    expect(repaymentResult.journalEntryId).toBeDefined();

    // 4. Simulate default with Provision Fund assistance (50% recovery, 50% Provision Fund payout)
    const defaultResult = await processDefault({
      opportunityId: testOppId,
      recoveryPercent: 50,
      provisionPayoutPercent: 50,
      payoutReason: 'Borrower ceased trading, Provision Fund cushioning applied',
      actorUserId: userId,
    });
    expect(defaultResult.totalRecoveredPence).toBeGreaterThan(0);
    expect(defaultResult.totalLossPence).toBeGreaterThan(0);

    // Verify holding was updated to defaulted in portfolio
    const portfolioAfter = await getUserPortfolio(userId);
    const defaultedHolding = portfolioAfter.holdings.find((h) => h.opportunityId === testOppId);
    expect(defaultedHolding?.status).toBe('defaulted');
  });

  it('Step 7: Learning & engagement: earn points for education, strictly zero for investing', async () => {
    const pointsBefore = await getUserPointsBalance(userId);

    // Complete reading lesson (+50 points)
    const award1 = await awardPoints({
      userId,
      points: 50,
      reason: 'complete_lesson',
    });
    expect(award1.pointsAwarded).toBe(50);

    // Pass quiz (+20 points)
    const award2 = await awardPoints({
      userId,
      points: 20,
      reason: 'pass_quiz_first_time',
    });
    expect(award2.pointsAwarded).toBe(20);

    const pointsAfter = await getUserPointsBalance(userId);
    expect(pointsAfter).toBe(pointsBefore + 70);

    // INVARIANT CHECK: points can NEVER be awarded for deposit or investment
    const illegalCheck = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM points_transactions
       WHERE user_id = $1 AND reason IN ('deposit', 'investment', 'auto_invest', 'referral')`,
      [userId]
    );
    expect(Number(illegalCheck.rows[0].count)).toBe(0);
  });

  it('Step 8: AI Educational Coach: guidance-only answers and vulnerability detection', async () => {
    // 1. Guidance-only query: "Which opportunity gives the highest return?"
    const res1 = await askCoach({
      userId,
      userMessage: 'Which opportunity gives the highest return? Tell me which one to pick.',
    });
    expect(res1.flagged).toBe(false);
    expect(res1.message.toLowerCase()).not.toContain('guaranteed');
    expect(res1.message.toLowerCase()).not.toContain('risk-free');

    // 2. Vulnerability signposting: "I am behind on rent and want to invest my grocery money"
    const res2 = await askCoach({
      userId,
      userMessage: 'I am behind on rent and want to invest my grocery money to make quick cash.',
    });
    expect(res2.flagged).toBe(true);
    expect(res2.message).toContain('MoneyHelper');
  });

  it('Step 9: Complete double-entry ledger reconciliation check', async () => {
    // Every single credit must equal debit across all journal entries
    const reconciliation = await runReconciliation();
    expect(reconciliation.passed).toBe(true);
    expect(reconciliation.mismatches.length).toBe(0);
  });
});
