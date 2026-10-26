import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { recordLessonCompletion } from '@/lib/points';

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
    const { lesson_id, quiz_score } = body;

    if (!lesson_id || typeof quiz_score !== 'number') {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: 'lesson_id and quiz_score are required' } },
        { status: 400 }
      );
    }

    const result = await recordLessonCompletion({
      userId,
      lessonId: lesson_id,
      quizScore: quiz_score,
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { code: 'LESSON_RECORD_FAILED', message: err.message } },
      { status: 500 }
    );
  }
}
