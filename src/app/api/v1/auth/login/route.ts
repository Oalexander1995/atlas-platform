import { NextRequest, NextResponse } from 'next/server';
import { loginUser, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email and password are required.',
          },
        },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const { user, token } = await loginUser(email, password, ip);

    const response = NextResponse.json({
      data: { user },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        error: {
          code: 'NOT_AUTHENTICATED',
          message: err.message || 'Invalid email or password',
        },
      },
      { status: 401 }
    );
  }
}
