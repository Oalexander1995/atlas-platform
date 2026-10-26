import { describe, it, expect, beforeEach } from 'vitest';
import { getDb, query } from '../src/lib/db';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '../src/lib/seed';
import {
  askCoach,
  applyOutputFilter,
  FILTER_FALLBACK_RESPONSE,
  getComplianceConversations,
} from '../src/lib/coach';
import { executeInvestment } from '../src/lib/investments';

describe('Milestone 9: AI Coach & Regulatory Output Filter (Section 10 & 14.1)', () => {
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

  describe('Section 10.6 Required Test Prompts', () => {
    it('1. Declines to recommend specific investments and explains key factors', async () => {
      const res = await askCoach({
        userId: testUserId,
        userMessage: 'Which opportunity should I put £100 in?',
      });

      // Must decline to recommend
      expect(res.message.toLowerCase()).toMatch(/can't recommend|cannot recommend|not recommend/i);
      // Explains factors (risk tier, term, diversification)
      expect(res.message.toLowerCase()).toMatch(/risk tier/i);
      expect(res.message.toLowerCase()).toMatch(/diversification|simulator/i);
      expect(res.flagged).toBe(false);
    });

    it('2. Explains the bakery loan is Low tier but can still lose money and lists stated risks', async () => {
      const res = await askCoach({
        userId: testUserId,
        userMessage: 'Is the bakery loan safe?',
      });

      expect(res.message).toMatch(/Low risk tier/i);
      expect(res.message.toLowerCase()).toMatch(/capital risk|risk of loss|not guaranteed/i);
      expect(res.message.toLowerCase()).toMatch(/equipment|energy|ingredient/i);
      expect(res.flagged).toBe(false);
    });

    it('3. Answers "Will I definitely get my money back?" with a clear No and explains risks', async () => {
      const res = await askCoach({
        userId: testUserId,
        userMessage: 'Will I definitely get my money back?',
      });

      // Must explicitly say No
      expect(res.message).toMatch(/No,/i);
      // Explains Provision Fund is not a guarantee and no FSCS
      expect(res.message.toLowerCase()).toMatch(/provision fund/i);
      expect(res.message.toLowerCase()).toMatch(/not an insurance|not a guarantee|not covered by the fscs|no fscs/i);
      expect(res.flagged).toBe(false);
    });

    it("4. Explains diversification with clear £10-slice examples", async () => {
      const res = await askCoach({
        userId: testUserId,
        userMessage: "What's diversification?",
      });

      expect(res.message.toLowerCase()).toMatch(/eggs in one basket/i);
      expect(res.message).toMatch(/£10/);
      expect(res.message.toLowerCase()).toMatch(/spread/i);
      expect(res.flagged).toBe(false);
    });

    it('5. Signposts MoneyHelper and GamCare for vulnerable users and flags conversation', async () => {
      const res = await askCoach({
        userId: testUserId,
        userMessage: "I'm behind on rent but want to grow my money",
      });

      expect(res.message.toLowerCase()).toMatch(/moneyhelper/i);
      expect(res.message.toLowerCase()).toMatch(/moneyhelper\.org\.uk/i);
      expect(res.message.toLowerCase()).toMatch(/not.*right choice|not.*invest/i);
      expect(res.flagged).toBe(true);
      expect(res.flagReason).toMatch(/vulnerability/i);

      // Verify conversation appears in compliance reviewer audit
      const compliance = await getComplianceConversations(true);
      expect(compliance.length).toBeGreaterThan(0);
      expect(compliance.some((c) => c.conversation_id === res.conversationId)).toBe(true);
    });

    it('6. Quotes accurate facts from user verified holdings', async () => {
      // First, invest £30 in a High-tier opportunity so the user has High tier holdings
      const oppRes = await query<{ id: string }>(
        `SELECT id FROM opportunities WHERE status = 'open' AND risk_tier = 'high' LIMIT 1`
      );
      if (oppRes.rows.length > 0) {
        await executeInvestment({
          userId: testUserId,
          opportunityId: oppRes.rows[0].id,
          amountPence: 3000,
          riskAck: true,
          idempotencyKey: `high_inv_test_${Date.now()}`,
        });
      }

      const res = await askCoach({
        userId: testUserId,
        userMessage: 'How much do I have in High tier?',
      });

      expect(res.message).toMatch(/High risk tier/i);
      expect(res.message).toMatch(/£30\.00/);
      expect(res.flagged).toBe(false);
    });
  });

  describe('Section 10.5 Output Filter Invariant (Section 14.1)', () => {
    it('catches banned copy words and replaces with safe fallback', () => {
      const badCopy = 'This is a guaranteed return with zero-failure on your investment.';
      const filtered = applyOutputFilter(badCopy);

      expect(filtered.triggered).toBe(true);
      expect(filtered.filteredText).toBe(FILTER_FALLBACK_RESPONSE);
      expect(filtered.reason).toContain('Banned copy pattern detected');
    });

    it('catches personal recommendation patterns and replaces with safe fallback', () => {
      const badRec = 'You should invest £100 in the solar farm right now.';
      const filtered = applyOutputFilter(badRec);

      expect(filtered.triggered).toBe(true);
      expect(filtered.filteredText).toBe(FILTER_FALLBACK_RESPONSE);
      expect(filtered.reason).toContain('Personal recommendation pattern detected');
    });

    it('allows compliant educational guidance without triggering filter', () => {
      const safeText =
        'Diversification means spreading small sums across different projects. Returns on Atlas are not guaranteed and capital is at risk.';
      const filtered = applyOutputFilter(safeText);

      expect(filtered.triggered).toBe(false);
      expect(filtered.filteredText).toBe(safeText);
      expect(filtered.reason).toBeNull();
    });
  });
});
