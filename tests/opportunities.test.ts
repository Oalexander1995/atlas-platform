import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getOpportunities, getOpportunityById } from '@/lib/opportunities';
import { ensureOpportunitiesSeeded, ensureDemoUsersSeeded } from '@/lib/seed';
import { getDb, closeDb, query } from '@/lib/db';

describe('Opportunities Marketplace & Seed Data (Milestone 3)', () => {
  beforeAll(async () => {
    await getDb('memory://');
    await ensureDemoUsersSeeded();
    await ensureOpportunitiesSeeded();
  });

  afterAll(async () => {
    await closeDb();
  });

  it('seeds exactly 12 fictional UK small businesses across 4 tiers', async () => {
    const opps = await getOpportunities();
    expect(opps.length).toBe(12);

    const tierCounts = opps.reduce((acc, o) => {
      acc[o.risk_tier] = (acc[o.risk_tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(tierCounts.low).toBe(3);
    expect(tierCounts.medium).toBe(4);
    expect(tierCounts.high).toBe(3);
    expect(tierCounts.uncharted).toBe(2);
  });

  it('includes the required mix of statuses (7 open, 2 funded, 1 repaying, 1 completed, 1 defaulted)', async () => {
    const opps = await getOpportunities();
    const statusCounts = opps.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(statusCounts.open).toBe(7);
    expect(statusCounts.funded).toBe(2);
    expect(statusCounts.repaying).toBe(1);
    expect(statusCounts.completed).toBe(1);
    expect(statusCounts.defaulted).toBe(1);
  });

  it('enforces stricter £100 per-user cap for Uncharted tier', async () => {
    const opps = await getOpportunities({ tier: 'uncharted' });
    expect(opps.length).toBe(2);

    for (const opp of opps) {
      expect(opp.per_user_cap_pence).toBe(10000); // £100.00
    }

    const lowOpps = await getOpportunities({ tier: 'low' });
    for (const opp of lowOpps) {
      expect(opp.per_user_cap_pence).toBe(100000); // £1,000.00
    }
  });

  it('ensures every opportunity lists at least 3 specific risks', async () => {
    const opps = await getOpportunities();
    for (const opp of opps) {
      expect(Array.isArray(opp.key_risks)).toBe(true);
      expect(opp.key_risks.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('filters opportunities by risk tier and term', async () => {
    const lowOpps = await getOpportunities({ tier: 'low' });
    expect(lowOpps.every((o) => o.risk_tier === 'low')).toBe(true);

    const under1Year = await getOpportunities({ term: 'under_1' });
    expect(under1Year.every((o) => o.term_months < 12)).toBe(true);
  });

  it('fetches opportunity details with repayment schedule and partner profile', async () => {
    const opps = await getOpportunities();
    const target = opps[0];

    const detail = await getOpportunityById(target.id);
    expect(detail.opportunity).not.toBeNull();
    expect(detail.opportunity?.id).toBe(target.id);
    expect(detail.opportunity?.partner_name).toBeDefined();
    expect(detail.repayments.length).toBeGreaterThan(0);
    expect(typeof detail.repayments[0].capital_pence).toBe('number');
  });

  it('allows admin to update opportunity status', async () => {
    const openOpps = await getOpportunities({ status: 'open' });
    const target = openOpps[0];

    await query('UPDATE opportunities SET status = $1 WHERE id = $2', ['funded', target.id]);

    const updated = await getOpportunityById(target.id);
    expect(updated.opportunity?.status).toBe('funded');
  });
});
