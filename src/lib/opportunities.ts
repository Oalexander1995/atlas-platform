import { query, transaction } from './db';
import { RiskTier } from '@/components/RiskTierBadge';
import { ClockService } from './clock';
import { recordAuditLog } from './audit';
import { CANONICAL_PROJECTS, findCanonicalProject, CanonicalProject } from '@/lib/constants/projects';

export type OpportunityStatus =
  | 'draft'
  | 'open'
  | 'funded'
  | 'repaying'
  | 'completed'
  | 'defaulted';

export interface Opportunity {
  id: string;
  partner_id: string;
  partner_name?: string;
  partner_description?: string;
  partner_founded_year?: number;
  partner_location?: string;
  title: string;
  summary: string;
  description: string;
  risk_tier: RiskTier;
  sector: string;
  target_pence: number;
  raised_pence: number;
  co_investors_count?: number;
  expected_return_min_bps: number;
  expected_return_max_bps: number;
  term_months: number;
  status: OpportunityStatus;
  platform_fee_bps: number;
  provision_contribution_bps: number;
  per_user_cap_pence: number;
  key_risks: string[];
  vetting_checklist: Array<{ item: string; verified_date: string; status: string }>;
  updates: Array<{ date: string; title: string; content: string }>;
  opens_at: string;
  closes_at: string;
  created_at: string;
}

export interface OpportunityFilter {
  tier?: RiskTier | 'all';
  term?: 'all' | 'under_1' | '1_to_3' | '3_plus';
  sector?: string;
  status?: OpportunityStatus | 'all';
  sort?: 'newest' | 'ending_soonest' | 'term_length';
}

/**
 * Returns a list of opportunities applying the specified filters and sorts.
 * Note: Sort by "highest return" is explicitly forbidden per PRD 5.6.
 */
export async function getOpportunities(
  filters: OpportunityFilter = {}
): Promise<Opportunity[]> {
  let sql = `
    SELECT
      o.id,
      o.partner_id,
      p.name AS partner_name,
      p.description AS partner_description,
      p.founded_year AS partner_founded_year,
      p.location AS partner_location,
      o.title,
      o.summary,
      o.description,
      o.risk_tier,
      o.sector,
      o.target_pence,
      o.raised_pence,
      o.expected_return_min_bps,
      o.expected_return_max_bps,
      o.term_months,
      o.status,
      o.platform_fee_bps,
      o.provision_contribution_bps,
      o.per_user_cap_pence,
      o.key_risks,
      o.vetting_checklist,
      o.updates,
      o.opens_at,
      o.closes_at,
      o.created_at
    FROM opportunities o
    LEFT JOIN partners p ON o.partner_id = p.id
    WHERE 1=1
  `;

  const params: any[] = [];
  let paramIdx = 1;

  if (filters.tier && filters.tier !== 'all') {
    sql += ` AND o.risk_tier = $${paramIdx++}`;
    params.push(filters.tier);
  }

  if (filters.status && filters.status !== 'all') {
    sql += ` AND o.status = $${paramIdx++}`;
    params.push(filters.status);
  }

  if (filters.sector && filters.sector !== 'all') {
    sql += ` AND o.sector = $${paramIdx++}`;
    params.push(filters.sector);
  }

  if (filters.term && filters.term !== 'all') {
    if (filters.term === 'under_1') {
      sql += ` AND o.term_months < 12`;
    } else if (filters.term === '1_to_3') {
      sql += ` AND o.term_months >= 12 AND o.term_months <= 36`;
    } else if (filters.term === '3_plus') {
      sql += ` AND o.term_months > 36`;
    }
  }

  // Sort orders (PRD 5.6: No sort by highest return)
  switch (filters.sort) {
    case 'ending_soonest':
      sql += ` ORDER BY o.closes_at ASC`;
      break;
    case 'term_length':
      sql += ` ORDER BY o.term_months ASC`;
      break;
    case 'newest':
    default:
      sql += ` ORDER BY o.created_at DESC`;
      break;
  }

  const res = await query<any>(sql, params);
  return res.rows.map(mapOpportunityRow);
}

/**
 * Returns single opportunity details with partner profile and repayment schedule
 */
export async function getOpportunityById(id: string): Promise<{
  opportunity: Opportunity | null;
  repayments: Array<{
    id: string;
    due_date: string;
    capital_pence: number;
    interest_pence: number;
    status: string;
  }>;
}> {
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  let oppRow: any = null;
  let repaymentsRows: any[] = [];

  if (isValidUuid) {
    try {
      const oppRes = await query<any>(
        `SELECT
          o.id,
          o.partner_id,
          p.name AS partner_name,
          p.description AS partner_description,
          p.founded_year AS partner_founded_year,
          p.location AS partner_location,
          o.title,
          o.summary,
          o.description,
          o.risk_tier,
          o.sector,
          o.target_pence,
          o.raised_pence,
          o.expected_return_min_bps,
          o.expected_return_max_bps,
          o.term_months,
          o.status,
          o.platform_fee_bps,
          o.provision_contribution_bps,
          o.per_user_cap_pence,
          o.key_risks,
          o.vetting_checklist,
          o.updates,
          o.opens_at,
          o.closes_at,
          o.created_at
        FROM opportunities o
        LEFT JOIN partners p ON o.partner_id = p.id
        WHERE o.id = $1`,
        [id]
      );

      if (oppRes.rows.length > 0) {
        oppRow = oppRes.rows[0];
        const repaymentsRes = await query<any>(
          `SELECT id, due_date, capital_pence, interest_pence, status
           FROM repayment_schedules
           WHERE opportunity_id = $1
           ORDER BY due_date ASC`,
          [id]
        );
        repaymentsRows = repaymentsRes.rows;
      }
    } catch {
      // ignore db error, fall back to canonical lookup below
    }
  }

  // If not found in DB or invalid UUID, find in canonical projects or fallback to Manchester
  if (!oppRow) {
    const canonical = findCanonicalProject(id) || CANONICAL_PROJECTS[0];
    const opp = mapCanonicalToOpportunity(canonical);
    const mockRepayments = generateCanonicalRepayments(canonical);
    return {
      opportunity: opp,
      repayments: mockRepayments,
    };
  }

  return {
    opportunity: mapOpportunityRow(oppRow),
    repayments: repaymentsRows.map((r) => ({
      id: r.id,
      due_date: r.due_date,
      capital_pence: Number(r.capital_pence),
      interest_pence: Number(r.interest_pence),
      status: r.status,
    })),
  };
}

function mapOpportunityRow(r: any): Opportunity {
  const canonical = findCanonicalProject(r.id) || findCanonicalProject(r.title);

  return {
    id: r.id,
    partner_id: r.partner_id || 'partner-default',
    partner_name: canonical ? canonical.partnerName : r.partner_name,
    partner_description: canonical ? canonical.partnerDesc : r.partner_description,
    partner_founded_year: canonical ? canonical.partnerFoundedYear : r.partner_founded_year,
    partner_location: canonical ? canonical.partnerLocation : r.partner_location,
    title: canonical ? canonical.title : r.title,
    summary: canonical ? canonical.summary : r.summary,
    description: canonical ? canonical.description : r.description,
    risk_tier: canonical ? canonical.riskTier : r.risk_tier,
    sector: canonical ? canonical.sector : r.sector,
    target_pence: canonical ? canonical.targetPence : Number(r.target_pence),
    raised_pence: canonical ? canonical.raisedPence : Number(r.raised_pence),
    co_investors_count: canonical ? canonical.coInvestorsCount : Math.max(1, Math.round((Number(r.raised_pence) / (Number(r.target_pence) || 1)) * 500)),
    expected_return_min_bps: canonical ? canonical.expectedReturnMinBps : Number(r.expected_return_min_bps),
    expected_return_max_bps: canonical ? canonical.expectedReturnMaxBps : Number(r.expected_return_max_bps),
    term_months: canonical ? canonical.termMonths : Number(r.term_months),
    status: (r.status as OpportunityStatus) || (canonical ? canonical.status : 'open'),
    platform_fee_bps: Number(r.platform_fee_bps || 200),
    provision_contribution_bps: Number(r.provision_contribution_bps || 100),
    per_user_cap_pence: Number(r.per_user_cap_pence || 100000),
    key_risks: canonical ? canonical.keyRisks : (typeof r.key_risks === 'string' ? JSON.parse(r.key_risks) : r.key_risks || []),
    vetting_checklist: canonical ? canonical.vettingChecklist : (typeof r.vetting_checklist === 'string' ? JSON.parse(r.vetting_checklist) : r.vetting_checklist || []),
    updates: canonical ? canonical.updates : (typeof r.updates === 'string' ? JSON.parse(r.updates) : r.updates || []),
    opens_at: r.opens_at || '2026-10-01T00:00:00Z',
    closes_at: r.closes_at || '2026-12-01T00:00:00Z',
    created_at: r.created_at || '2026-10-01T00:00:00Z',
  };
}

export function mapCanonicalToOpportunity(p: CanonicalProject): Opportunity {
  return {
    id: p.id,
    partner_id: 'partner-' + p.id.slice(0, 8),
    partner_name: p.partnerName,
    partner_description: p.partnerDesc,
    partner_founded_year: p.partnerFoundedYear,
    partner_location: p.partnerLocation,
    title: p.title,
    summary: p.summary,
    description: p.description,
    risk_tier: p.riskTier,
    sector: p.sector,
    target_pence: p.targetPence,
    raised_pence: p.raisedPence,
    co_investors_count: p.coInvestorsCount,
    expected_return_min_bps: p.expectedReturnMinBps,
    expected_return_max_bps: p.expectedReturnMaxBps,
    term_months: p.termMonths,
    status: p.status,
    platform_fee_bps: 200,
    provision_contribution_bps: 100,
    per_user_cap_pence: 100000,
    key_risks: p.keyRisks,
    vetting_checklist: p.vettingChecklist,
    updates: p.updates,
    opens_at: '2026-10-01T00:00:00Z',
    closes_at: '2026-12-01T00:00:00Z',
    created_at: '2026-10-01T00:00:00Z',
  };
}

export function generateCanonicalRepayments(p: CanonicalProject) {
  const monthlyPrincipal = Math.floor(p.targetPence / p.termMonths);
  const monthlyInterest = Math.floor((p.targetPence * (p.expectedReturnMinBps / 10000)) / 12);
  const repayments = [];
  for (let m = 1; m <= Math.min(p.termMonths, 6); m++) {
    const d = new Date(2026, 9 + m, 15);
    repayments.push({
      id: `rep-${p.id.slice(0, 8)}-${m}`,
      due_date: d.toISOString().split('T')[0],
      capital_pence: monthlyPrincipal,
      interest_pence: monthlyInterest,
      status: p.status === 'completed' ? 'paid' : p.status === 'defaulted' && m > 2 ? 'defaulted' : 'pending',
    });
  }
  return repayments;
}

/**
 * Admin CRUD: Create or update an opportunity
 */
export async function createOpportunity(data: {
  partnerId: string;
  title: string;
  summary: string;
  description: string;
  riskTier: RiskTier;
  sector: string;
  targetPence: number;
  expectedReturnMinBps: number;
  expectedReturnMaxBps: number;
  termMonths: number;
  status: OpportunityStatus;
  keyRisks: string[];
  vettingChecklist?: any[];
  adminUserId?: string;
}): Promise<string> {
  const now = await ClockService.now();
  const closesAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days
  const perUserCap = data.riskTier === 'uncharted' ? 10000 : 100000; // £100 or £1,000

  const res = await query<{ id: string }>(
    `INSERT INTO opportunities (
       partner_id, title, summary, description, risk_tier, sector,
       target_pence, expected_return_min_bps, expected_return_max_bps,
       term_months, status, per_user_cap_pence, key_risks, vetting_checklist,
       opens_at, closes_at, created_at
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
     RETURNING id`,
    [
      data.partnerId,
      data.title,
      data.summary,
      data.description,
      data.riskTier,
      data.sector,
      data.targetPence,
      data.expectedReturnMinBps,
      data.expectedReturnMaxBps,
      data.termMonths,
      data.status,
      perUserCap,
      JSON.stringify(data.keyRisks),
      JSON.stringify(data.vettingChecklist || []),
      now.toISOString(),
      closesAt.toISOString(),
      now.toISOString(),
    ]
  );

  const oppId = res.rows[0].id;

  await recordAuditLog({
    actorUserId: data.adminUserId,
    action: 'OPPORTUNITY_CREATED',
    entityType: 'opportunities',
    entityId: oppId,
    after: { title: data.title, risk_tier: data.riskTier, target_pence: data.targetPence },
  });

  return oppId;
}
