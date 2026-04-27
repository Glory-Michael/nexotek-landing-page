import { type NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  const accept = request.headers.get('accept') ?? '';
  if (!accept.includes('text/markdown')) return NextResponse.next();

  const { pathname } = request.nextUrl;

  const url = request.nextUrl.clone();
  url.pathname = '/api/markdown-doc';
  url.searchParams.set('path', pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/|admin/).*)'],
};
