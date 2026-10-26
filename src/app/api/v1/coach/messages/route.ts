import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { askCoach } from '@/lib/coach';

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    let userId = session?.userId;
    if (!userId) {
      const demoRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
        'ready@atlas.demo',
      ]);
      userId = demoRes.rows[0]?.id;
    }

    if (!userId) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'User not identified' } },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { message, conversation_id } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'Message string is required' } },
        { status: 400 }
      );
    }

    const result = await askCoach({
      userId,
      userMessage: message.trim(),
      conversationId: conversation_id,
      ip: req.headers.get('x-forwarded-for') || undefined,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'COACH_ERROR', message: err.message } },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    let userId = session?.userId;
    if (!userId) {
      const demoRes = await query<{ id: string }>('SELECT id FROM users WHERE email = $1', [
        'ready@atlas.demo',
      ]);
      userId = demoRes.rows[0]?.id;
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversation_id');

    if (!conversationId) {
      return NextResponse.json({ success: true, data: { messages: [] } });
    }

    const messagesRes = await query<{
      id: string;
      role: string;
      content: string;
      flagged: boolean;
      created_at: string;
    }>(
      `SELECT id, role, content, flagged, created_at
       FROM ai_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    return NextResponse.json({
      success: true,
      data: { messages: messagesRes.rows },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'FETCH_MESSAGES_FAILED', message: err.message } },
      { status: 500 }
    );
  }
}
