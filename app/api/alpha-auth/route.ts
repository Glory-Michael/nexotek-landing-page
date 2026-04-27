import { type NextRequest, NextResponse } from 'next/server';
import { getAlphaConfig, makeAlphaToken, ALPHA_COOKIE_NAME } from '@/lib/alpha-features';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  let password = '';
  try {
    const body = await request.json();
    password = body.password || '';
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const alphaConfig = await getAlphaConfig();

  if (!alphaConfig.password || password !== alphaConfig.password) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ALPHA_COOKIE_NAME, makeAlphaToken(alphaConfig.password), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
