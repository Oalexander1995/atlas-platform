import { describe, it, expect, beforeEach } from 'vitest';
import { getDb, query } from '../src/lib/db';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '../src/lib/seed';
import { executeInvestment } from '../src/lib/investments';
import { disburseOpportunity, processRepayment, processDefault } from '../src/lib/lifecycle';
import { getWalletBalancePence, runReconciliation, getProvisionFundStatus } from '../src/lib/ledger';
import { getUserNotifications } from '../src/lib/notifications';

async function createTestOpportunity(params?: {
  riskTier?: 'low' | 'medium' | 'high' | 'uncharted';
  status?: string;
  targetPence?: number;
  platformFeeBps?: number;
  pfBps?: number;
}) {
  const partnerRes = await query<{ id: string }>('SELECT id FROM partners LIMIT 1');
  const partnerId = partnerRes.rows[0].id;
  const oppRes = await query<{ id: string; title: string }>(
    `INSERT INTO opportunities (
       partner_id, title, summary, description, risk_tier, sector,
       target_pence, expected_return_min_bps, expected_return_max_bps,
       term_months, status, platform_fee_bps, provision_contribution_bps,
       per_user_cap_pence, opens_at, closes_at
     ) VALUES (
       $1, $2, 'Test summary', 'Test description', $3, 'Retail',
       $4, 400, 600, 12, $5, $6, $7, 100000, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '30 days'
     ) RETURNING id, title`,
    [
      partnerId,
      `Lifecycle Test Opp ${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      params?.riskTier || 'low',
      params?.targetPence || 1000000, // £10,000
      params?.status || 'open',
      params?.platformFeeBps ?? 200, // 2%
      params?.pfBps ?? 100, // 1%
    ]
  );
  return oppRes.rows[0];
}

describe('Milestone 7: Investment Lifecycle (Disbursement, Repayments, Defaults)', () => {
  beforeEach(async () => {
    await getDb('memory://');
    await ensureDemoUsersSeeded();
    await ensureOpportunitiesSeeded();
  });

  it('disburses fully funded opportunity with 2% fee and 1% Provision Fund contribution', async () => {
    const userRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
      'ready@atlas.demo',
    ]);
    const userId = userRes.rows[0].id;

    const opp = await createTestOpportunity({ platformFeeBps: 200, pfBps: 100 });

    // Invest £100 (10,000 pence)
    await executeInvestment({
      userId,
      opportunityId: opp.id,
      amountPence: 10000,
      riskAck: true,
      idempotencyKey: `test_inv_${Date.now()}`,
    });

    // Disburse opportunity
    const disburseRes = await disburseOpportunity({
      opportunityId: opp.id,
      actorUserId: userId,
    });

    expect(disburseRes.totalRaisedPence).toBe(10000);
    expect(disburseRes.platformFeePence).toBe(200); // 2% of £100 = £2.00
    expect(disburseRes.provisionContributionPence).toBe(100); // 1% of £100 = £1.00
    expect(disburseRes.netPartnerPence).toBe(9700); // 97% of £100 = £97.00
    expect(
      disburseRes.netPartnerPence +
        disburseRes.platformFeePence +
        disburseRes.provisionContributionPence
    ).toBe(disburseRes.totalRaisedPence);

    // Verify opportunity status is now 'repaying'
    const updatedOpp = await query<{ status: string }>(
      'SELECT status FROM opportunities WHERE id = $1',
      [opp.id]
    );
    expect(updatedOpp.rows[0].status).toBe('repaying');

    // Run reconciliation check
    const recon = await runReconciliation();
    expect(recon.passed).toBe(true);
  });

  it('processes pro-rata repayment with largest-remainder rounding and updates wallet & holdings', async () => {
    const userRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
      'ready@atlas.demo',
    ]);
    const userId = userRes.rows[0].id;

    const opp = await createTestOpportunity();

    // Invest £100
    await executeInvestment({
      userId,
      opportunityId: opp.id,
      amountPence: 10000,
      riskAck: true,
      idempotencyKey: `test_inv_repay_${Date.now()}`,
    });

    // Disburse to move to 'repaying'
    await disburseOpportunity({ opportunityId: opp.id });

    const balanceBefore = await getWalletBalancePence(userId);

    // Repay £40 capital + £5 interest (£45 total = 4,500 pence)
    const repayRes = await processRepayment({
      opportunityId: opp.id,
      capitalPence: 4000,
      interestPence: 500,
    });

    expect(repayRes.totalPence).toBe(4500);
    expect(repayRes.recipientsCount).toBe(1);
    expect(repayRes.distributions[0].capitalPence).toBe(4000);
    expect(repayRes.distributions[0].interestPence).toBe(500);

    // Wallet balance should increase by £45
    const balanceAfter = await getWalletBalancePence(userId);
    expect(balanceAfter - balanceBefore).toBe(4500);

    // Holding principal should decrease from £100 to £60
    const holdingRes = await query<{ principal_pence: string; status: string }>(
      'SELECT principal_pence, status FROM holdings WHERE user_id = $1 AND opportunity_id = $2',
      [userId, opp.id]
    );
    expect(Number(holdingRes.rows[0].principal_pence)).toBe(6000);
    expect(holdingRes.rows[0].status).toBe('active');

    // In-app notification should be created
    const notifs = await getUserNotifications(userId);
    expect(notifs.notifications.some((n) => n.type === 'repayment')).toBe(true);

    // Run reconciliation
    const recon = await runReconciliation();
    expect(recon.passed).toBe(true);
  });

  it('processes default with recovery and discretionary Provision Fund payout', async () => {
    const userRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
      'ready@atlas.demo',
    ]);
    const userId = userRes.rows[0].id;

    const opp = await createTestOpportunity({ riskTier: 'low' });

    // Invest £50
    await executeInvestment({
      userId,
      opportunityId: opp.id,
      amountPence: 5000,
      riskAck: true,
      idempotencyKey: `test_inv_default_${Date.now()}`,
    });

    // Disburse to add 1% contribution to Provision Fund
    await disburseOpportunity({ opportunityId: opp.id });

    const pfStatusBefore = await getProvisionFundStatus();
    expect(pfStatusBefore.balancePence).toBeGreaterThan(0);

    const balanceBefore = await getWalletBalancePence(userId);

    // Process default: 40% recovery, 100% Provision Fund payout on remaining loss
    const defaultRes = await processDefault({
      opportunityId: opp.id,
      recoveryPercent: 40,
      provisionPayoutPercent: 100,
      payoutReason: 'Discretionary provision payout for demo test',
    });

    // 40% recovery of £50 = £20 (2,000p)
    expect(defaultRes.totalRecoveredPence).toBe(2000);
    // Remaining loss: £30 (3,000p)
    expect(defaultRes.totalLossPence).toBe(3000);
    // Provision Fund payout up to available fund balance
    expect(defaultRes.totalProvisionPayoutPence).toBeGreaterThan(0);

    // Wallet received recovered capital + PF payout
    const balanceAfter = await getWalletBalancePence(userId);
    expect(balanceAfter).toBe(
      balanceBefore + defaultRes.totalRecoveredPence + defaultRes.totalProvisionPayoutPence
    );

    // Holding principal is now 0 and status is 'defaulted'
    const holdingRes = await query<{ principal_pence: string; status: string }>(
      'SELECT principal_pence, status FROM holdings WHERE user_id = $1 AND opportunity_id = $2',
      [userId, opp.id]
    );
    expect(Number(holdingRes.rows[0].principal_pence)).toBe(0);
    expect(holdingRes.rows[0].status).toBe('defaulted');

    // Opportunity status is 'defaulted'
    const oppCheck = await query<{ status: string }>('SELECT status FROM opportunities WHERE id = $1', [
      opp.id,
    ]);
    expect(oppCheck.rows[0].status).toBe('defaulted');

    // Holding loss recorded
    const lossRes = await query<{ amount_pence: string; provision_payout_pence: string }>(
      'SELECT amount_pence, provision_payout_pence FROM holding_losses WHERE user_id = $1 AND opportunity_id = $2',
      [userId, opp.id]
    );
    expect(Number(lossRes.rows[0].amount_pence)).toBe(3000);
    expect(Number(lossRes.rows[0].provision_payout_pence)).toBe(defaultRes.totalProvisionPayoutPence);

    // Ledger reconciles
    const recon = await runReconciliation();
    expect(recon.passed).toBe(true);
  });

  it('strictly excludes Uncharted risk tier from Provision Fund payouts per Section 5.12', async () => {
    const opp = await createTestOpportunity({ riskTier: 'uncharted' });

    const userRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
      'ready@atlas.demo',
    ]);
    const userId = userRes.rows[0].id;

    await executeInvestment({
      userId,
      opportunityId: opp.id,
      amountPence: 2000,
      riskAck: true,
      idempotencyKey: `uncharted_test_${Date.now()}`,
    });

    await disburseOpportunity({ opportunityId: opp.id });

    // Attempting Provision Fund payout on Uncharted should throw
    await expect(
      processDefault({
        opportunityId: opp.id,
        recoveryPercent: 50,
        provisionPayoutPercent: 50,
      })
    ).rejects.toThrow(/Uncharted tier holdings are strictly excluded/);
  });
});
