import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addPostalEntry } from '@/lib/prize-draw';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (session && session.role !== 'admin') {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Admin role required' } },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, town, draw_id } = body;

    if (!name || !town) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Name and town are required' } },
        { status: 400 }
      );
    }

    const entry = await addPostalEntry({
      drawId: draw_id,
      name,
      town,
    });

    return NextResponse.json({
      success: true,
      data: entry,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'POSTAL_ENTRY_FAILED', message: err.message } },
      { status: 400 }
    );
  }
}
