import { NextRequest, NextResponse } from 'next/server';
import { getOpportunities, OpportunityFilter } from '@/lib/opportunities';
import { ensureOpportunitiesSeeded } from '@/lib/seed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  await ensureOpportunitiesSeeded();

  const searchParams = req.nextUrl.searchParams;
  const filters: OpportunityFilter = {
    tier: (searchParams.get('tier') as any) || 'all',
    status: (searchParams.get('status') as any) || 'all',
    sector: searchParams.get('sector') || 'all',
    term: (searchParams.get('term') as any) || 'all',
    sort: (searchParams.get('sort') as any) || 'newest',
  };

  const opportunities = await getOpportunities(filters);

  return NextResponse.json({
    data: opportunities,
  });
}
