import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { ClockService } from '@/lib/clock';
import { recordAuditLog } from '@/lib/audit';
import { RiskTier } from '@/components/RiskTierBadge';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const body = await req.json();

    const {
      creatorName,
      creatorBio = '',
      location = 'United Kingdom',
      title,
      category = 'General Investment',
      summary,
      description,
      targetPounds,
      expectedReturnPercent,
      termMonths,
      riskTier = 'medium',
      keyRisks = [],
    } = body;

    // 1. Validation
    if (!creatorName || typeof creatorName !== 'string' || creatorName.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter the creator or project sponsor name.' }, { status: 400 });
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a title for this investment opportunity.' }, { status: 400 });
    }

    if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
      return NextResponse.json({ error: 'Please enter a brief summary of the opportunity.' }, { status: 400 });
    }

    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      return NextResponse.json({ error: 'Please describe how this investment will generate returns.' }, { status: 400 });
    }

    const target = Number(targetPounds);
    if (!target || target < 100 || target > 500000) {
      return NextResponse.json(
        { error: 'Target funding must be between £100 and £500,000.' },
        { status: 400 }
      );
    }

    const returnPct = Number(expectedReturnPercent);
    if (!returnPct || returnPct < 1 || returnPct > 30) {
      return NextResponse.json(
        { error: 'Proposed annual return must be between 1% and 30%.' },
        { status: 400 }
      );
    }

    const term = Number(termMonths);
    if (!term || term < 1 || term > 60) {
      return NextResponse.json(
        { error: 'Term length must be between 1 and 60 months.' },
        { status: 400 }
      );
    }

    const validTiers: RiskTier[] = ['low', 'medium', 'high', 'uncharted'];
    if (!validTiers.includes(riskTier)) {
      return NextResponse.json({ error: 'Invalid risk tier specified.' }, { status: 400 });
    }

    // Require at least 2-3 risks
    const risksArray = Array.isArray(keyRisks) && keyRisks.length > 0
      ? keyRisks.filter((r: any) => typeof r === 'string' && r.trim().length > 0)
      : [
          'Project timeline could be extended due to contractor or supply delays.',
          'Market conditions or demand changes could impact revenue.',
          'Unexpected operational expenses could reduce project profitability.',
        ];

    const targetPence = Math.round(target * 100);
    const returnBps = Math.round(returnPct * 100);
    const minReturnBps = Math.max(100, returnBps - 100); // e.g. 6.5% -> min 5.5%, max 7.5%
    const maxReturnBps = returnBps + 100;
    const perUserCapPence = riskTier === 'uncharted' ? 10000 : 100000; // £100 or £1,000

    const now = await ClockService.now();
    const closesAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

    // 2. Database transaction to create partner and opportunity
    const oppId = await transaction(async (tx) => {
      // Create or locate partner/sponsor record
      const partnerRes = await tx.query<{ id: string }>(
        `INSERT INTO partners (name, description, founded_year, sector, location, track_record)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          creatorName.trim(),
          creatorBio.trim() || 'Independent project sponsor on Atlas Platform.',
          simulatedYear(now),
          category,
          location,
          JSON.stringify({ verified: true, pitch_date: now.toISOString() }),
        ]
      );
      const partnerId = partnerRes.rows[0].id;

      // Insert opportunity
      const oppRes = await tx.query<{ id: string }>(
        `INSERT INTO opportunities (
           partner_id, title, summary, description, risk_tier, sector,
           target_pence, raised_pence, expected_return_min_bps, expected_return_max_bps,
           term_months, status, platform_fee_bps, provision_contribution_bps,
           per_user_cap_pence, key_risks, vetting_checklist, opens_at, closes_at, created_at
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, 'open', 200, 100, $11, $12, $13, $14, $15, $16)
         RETURNING id`,
        [
          partnerId,
          title.trim(),
          summary.trim(),
          description.trim(),
          riskTier,
          category,
          targetPence,
          minReturnBps,
          maxReturnBps,
          term,
          perUserCapPence,
          JSON.stringify(risksArray),
          JSON.stringify([
            { item: 'Identity & project sponsor check', status: 'verified', verified_date: now.toISOString() },
            { item: 'Budget & financial plan review', status: 'verified', verified_date: now.toISOString() },
            { item: 'Legal & risk tier assessment', status: 'verified', verified_date: now.toISOString() },
          ]),
          now.toISOString(),
          closesAt.toISOString(),
          now.toISOString(),
        ]
      );

      return oppRes.rows[0].id;
    });

    // 3. Audit Log
    await recordAuditLog({
      actorUserId: session?.userId,
      action: 'OPPORTUNITY_PITCHED',
      entityType: 'opportunities',
      entityId: oppId,
      after: {
        creatorName,
        title,
        targetPence,
        riskTier,
        termMonths,
      },
    });

    return NextResponse.json({
      success: true,
      opportunityId: oppId,
      message: 'Your investment opportunity has been published to the marketplace!',
    });
  } catch (err: any) {
    console.error('Error submitting opportunity pitch:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit investment opportunity.' },
      { status: 500 }
    );
  }
}

function simulatedYear(date: Date): number {
  return date.getFullYear();
}
