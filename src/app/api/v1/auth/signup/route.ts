import { NextRequest, NextResponse } from 'next/server';
import { registerUser, createSessionToken, COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, fullName, dateOfBirth, postcode } = body;

    if (!email || !password || !fullName || !dateOfBirth || !postcode) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email, password, full name, date of birth, and postcode are required.',
          },
        },
        { status: 400 }
      );
    }

    // Age validation (must be 18+)
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    const isAdult = age > 18 || (age === 18 && (monthDiff > 0 || (monthDiff === 0 && today.getDate() >= birthDate.getDate())));

    if (!isAdult) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'You must be at least 18 years old to register.',
          },
        },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userSession = await registerUser({
      email,
      password,
      fullName,
      dateOfBirth,
      postcode,
      ip,
    });

    const token = await createSessionToken(userSession);

    const response = NextResponse.json(
      { data: { user: userSession } },
      { status: 201 }
    );

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
    const message = err.message || 'Registration failed';
    return NextResponse.json(
      {
        error: {
          code: message.includes('already registered') ? 'EMAIL_TAKEN' : 'VALIDATION_ERROR',
          message,
        },
      },
      { status: 400 }
    );
  }
}
