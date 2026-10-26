import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getComplianceConversations } from '@/lib/coach';

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (session && session.role !== 'admin' && session.role !== 'compliance') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Compliance or Admin role required' } },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const flaggedOnly = searchParams.get('flagged_only') === 'true';

    const conversations = await getComplianceConversations(flaggedOnly);

    return NextResponse.json({
      success: true,
      data: { conversations },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'FETCH_COMPLIANCE_FAILED', message: err.message } },
      { status: 500 }
    );
  }
}
