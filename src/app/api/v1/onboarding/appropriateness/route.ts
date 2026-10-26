import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import {
  getRandomAppropriatenessQuestions,
  submitAppropriatenessTest,
} from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

export async function GET() {
  const questions = getRandomAppropriatenessQuestions();

  // Strip correct answer before sending to frontend
  const sanitized = questions.map((q) => ({
    id: q.id,
    category: q.category,
    question: q.question,
    options: q.options,
  }));

  return NextResponse.json({
    data: sanitized,
  });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_AUTHENTICATED', message: 'Authentication required' } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { answers } = body;

    if (!answers || typeof answers !== 'object') {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Answers must be a key-value object of question ID to option ID',
          },
        },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = await submitAppropriatenessTest({
      userId: user.userId,
      answers,
      ip,
    });

    return NextResponse.json({
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'COOLING_OFF_ACTIVE',
          message: err.message || 'Failed to submit test',
        },
      },
      { status: 400 }
    );
  }
}
