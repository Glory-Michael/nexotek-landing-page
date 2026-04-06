import { NextResponse } from 'next/server';

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(new URL('/logo.png', origin), { status: 301 });
}
