import { NextRequest, NextResponse } from 'next/server';
import { getOpportunityById } from '@/lib/opportunities';
import { ensureOpportunitiesSeeded } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await ensureOpportunitiesSeeded();

  const { id } = params;
  const data = await getOpportunityById(id);

  if (!data.opportunity) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_FOUND',
          message: 'Opportunity not found',
        },
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    data,
  });
}
