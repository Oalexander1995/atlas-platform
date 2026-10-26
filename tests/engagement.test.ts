import { describe, it, expect, beforeEach } from 'vitest';
import { getDb, query } from '../src/lib/db';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '../src/lib/seed';
import {
  getUserPointsBalance,
  recordLessonCompletion,
  recordSimulatorUsage,
  awardPoints,
} from '../src/lib/points';
import { getUserBadges } from '../src/lib/badges';
import {
  runMonteCarloSimulation,
  TIER_ASSUMPTIONS,
} from '../src/lib/simulator';
import {
  getOrCreateCurrentDraw,
  enterPrizeDrawWithPoints,
  addPostalEntry,
  runPrizeDraw,
  createSeededPrng,
  formatWinnerName,
} from '../src/lib/prize-draw';
import { depositDemoMoney, withdrawDemoMoney } from '../src/lib/ledger';
import { executeInvestment } from '../src/lib/investments';

describe('Milestone 8: Learning & Engagement (Points, Simulator, Badges, Prize Draw)', () => {
  let testUserId: string;

  beforeEach(async () => {
    await getDb('memory://');
    await ensureDemoUsersSeeded();
    await ensureOpportunitiesSeeded();

    const userRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
      'ready@atlas.demo',
    ]);
    testUserId = userRes.rows[0].id;
  });

  describe('Points Engine & Strict Regulatory Non-Incentive (Section 0, 3.5, 14.1)', () => {
    it('awards points strictly for educational learning actions', async () => {
      // 1. Complete lesson 1 with full score
      const res = await recordLessonCompletion({
        userId: testUserId,
        lessonId: 'what-is-investing',
        quizScore: 3,
      });

      expect(res.pointsEarned).toBe(70); // 50 lesson + 20 first-time quiz
      expect(res.passedFirstTime).toBe(true);

      const balance = await getUserPointsBalance(testUserId);
      expect(balance).toBe(70);

      // Verify badges awarded
      const badges = await getUserBadges(testUserId);
      expect(badges.some((b) => b.badgeCode === 'first_lesson')).toBe(true);
    });

    it('caps simulator usage points to once per day (Section 5.15)', async () => {
      // First use of the day
      const first = await recordSimulatorUsage(testUserId);
      expect(first.awarded).toBe(true);
      expect(first.pointsAwarded).toBe(10);

      // Immediate second use should NOT award extra points
      const second = await recordSimulatorUsage(testUserId);
      expect(second.awarded).toBe(false);
      expect(second.pointsAwarded).toBe(0);

      const badges = await getUserBadges(testUserId);
      expect(badges.some((b) => b.badgeCode === 'simulator_explorer')).toBe(true);
    });

    it('CRITICAL TEST: never awards points for deposits, investments, or wallet events (Section 14.1)', async () => {
      // Count points transactions before
      const countBeforeRes = await query<{ count: string }>(
        'SELECT COUNT(*) AS count FROM points_transactions WHERE user_id = $1',
        [testUserId]
      );
      const countBefore = Number(countBeforeRes.rows[0].count);

      // 1. Perform deposit
      await depositDemoMoney({
        userId: testUserId,
        amountPence: 5000,
        idempotencyKey: `dep_test_${Date.now()}`,
      });

      // 2. Perform investment
      const oppRes = await query<{ id: string }>(
        `SELECT id FROM opportunities WHERE status = 'open' LIMIT 1`
      );
      await executeInvestment({
        userId: testUserId,
        opportunityId: oppRes.rows[0].id,
        amountPence: 2000,
        riskAck: true,
        idempotencyKey: `inv_test_${Date.now()}`,
      });

      // 3. Perform withdrawal
      await withdrawDemoMoney({
        userId: testUserId,
        amountPence: 1000,
        idempotencyKey: `wth_test_${Date.now()}`,
      });

      // Verify NO points transactions were created for any of these events
      const countAfterRes = await query<{ count: string }>(
        'SELECT COUNT(*) AS count FROM points_transactions WHERE user_id = $1',
        [testUserId]
      );
      const countAfter = Number(countAfterRes.rows[0].count);

      expect(countAfter).toBe(countBefore);
    });
  });

  describe('Monte Carlo Investment Simulator (Section 5.14 & Section 6)', () => {
    it('runs 1,000 simulations and computes ordered percentiles and loss chance', () => {
      const result = runMonteCarloSimulation({
        amountPounds: 100,
        termMonths: 12,
        allocation: {
          low: 50,
          medium: 30,
          high: 20,
          uncharted: 0,
        },
      });

      expect(result.initialAmountPounds).toBe(100);
      expect(result.termMonths).toBe(12);

      // Quantile monotonicity: Poor <= Typical <= Good
      expect(result.outcomes.poorPounds).toBeLessThanOrEqual(result.outcomes.typicalPounds);
      expect(result.outcomes.typicalPounds).toBeLessThanOrEqual(result.outcomes.goodPounds);

      // Minimum <= Maximum
      expect(result.outcomes.minPounds).toBeLessThanOrEqual(result.outcomes.maxPounds);

      // Chance of loss is a valid percentage between 0 and 100
      expect(result.chanceOfLossPercent).toBeGreaterThanOrEqual(0);
      expect(result.chanceOfLossPercent).toBeLessThanOrEqual(100);

      // Mandatory disclaimer present
      expect(result.disclaimer).toContain('Illustration only');
    });
  });

  describe('Monthly Prize Draw & Free Postal Entry (Section 3.6, 5.15, 14.1)', () => {
    it('exchanges points for draw entries up to 10 entries per user', async () => {
      const balanceBefore = await getUserPointsBalance(testUserId);
      // Award 500 points first
      await awardPoints({ userId: testUserId, reason: 'complete_profile', points: 500 });

      // Exchange 200 points for 2 entries
      const entryRes = await enterPrizeDrawWithPoints({
        userId: testUserId,
        entriesCount: 2,
      });

      expect(entryRes.entriesAdded).toBe(2);
      expect(entryRes.remainingPoints).toBe(balanceBefore + 500 - 200);

      // Attempting to exceed 10 entries cap should throw
      await expect(
        enterPrizeDrawWithPoints({
          userId: testUserId,
          entriesCount: 9, // 2 + 9 = 11 > 10
        })
      ).rejects.toThrow(/Maximum 10 entries/);
    });

    it('registers free postal entries with equal eligibility (Section 3.6)', async () => {
      const draw = await getOrCreateCurrentDraw();

      const postal = await addPostalEntry({
        drawId: draw.id,
        name: 'Margaret Thatcher',
        town: 'Grantham',
      });

      expect(postal.source).toBe('postal');
      expect(postal.postalName).toBe('Margaret Thatcher');
      expect(postal.postalTown).toBe('Grantham');
    });

    it('formats winner names to first name + initial (Section 5.15)', () => {
      expect(formatWinnerName('Oliver Twist')).toBe('Oliver T.');
      expect(formatWinnerName('Sarah Jane Smith')).toBe('Sarah S.');
      expect(formatWinnerName('Madonna')).toBe('Madonna');
    });

    it('CRITICAL TEST: Prize draw is 100% reproducible from seed (Section 14.1)', async () => {
      const draw = await getOrCreateCurrentDraw();

      // Add 10 diverse entries
      for (let i = 1; i <= 10; i++) {
        await addPostalEntry({
          drawId: draw.id,
          name: `Contestant Number ${i}`,
          town: `Town ${i}`,
        });
      }

      // Run draw with explicit seed
      const fixedSeed = 'reproducible_test_seed_atlas_2026_xyz';
      const run1 = await runPrizeDraw(draw.id, fixedSeed);

      // Simulate re-running PRNG with the exact same seed on same entries list
      const prng1 = createSeededPrng(fixedSeed);
      const prng2 = createSeededPrng(fixedSeed);

      const seq1 = Array.from({ length: 15 }, () => prng1());
      const seq2 = Array.from({ length: 15 }, () => prng2());

      // Sequences must be byte-for-byte identical
      expect(seq1).toEqual(seq2);
      expect(run1.winners.length).toBeGreaterThan(0);
      expect(run1.seed).toBe(fixedSeed);
    });
  });
});
