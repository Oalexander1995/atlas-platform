import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createOpportunity, OpportunityStatus } from '@/lib/opportunities';
import { recordAuditLog } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      partnerId,
      title,
      summary,
      description,
      riskTier,
      sector,
      targetPence,
      expectedReturnMinBps,
      expectedReturnMaxBps,
      termMonths,
      status = 'open',
      keyRisks = [],
    } = body;

    if (!title || !riskTier || !targetPence || !termMonths) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Title, risk tier, target pence, and term months are required.',
          },
        },
        { status: 400 }
      );
    }

    const oppId = await createOpportunity({
      partnerId,
      title,
      summary: summary || title,
      description: description || title,
      riskTier,
      sector: sector || 'General Business',
      targetPence,
      expectedReturnMinBps: expectedReturnMinBps || 500,
      expectedReturnMaxBps: expectedReturnMaxBps || 800,
      termMonths,
      status: status as OpportunityStatus,
      keyRisks: keyRisks.length > 0 ? keyRisks : [
        'Trading condition changes could impact revenue.',
        'Unexpected cost inflation on supplies or rent.',
        'Loss of key staff or management disruption.',
      ],
    });

    return NextResponse.json({
      data: { id: oppId, message: 'Opportunity created successfully' },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Failed to create opportunity',
        },
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Opportunity ID and target status are required.',
          },
        },
        { status: 400 }
      );
    }

    await query('UPDATE opportunities SET status = $1 WHERE id = $2', [status, id]);

    await recordAuditLog({
      action: 'OPPORTUNITY_STATUS_UPDATED',
      entityType: 'opportunities',
      entityId: id,
      after: { status },
    });

    return NextResponse.json({
      data: { success: true, id, status },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'SERVER_ERROR',
          message: err.message || 'Failed to update opportunity',
        },
      },
      { status: 500 }
    );
  }
}
