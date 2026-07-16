import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const isWww = host.startsWith('www.');
  const isHttp = request.headers.get('x-forwarded-proto') === 'http';

  // Only perform redirects in production
  if (process.env.NODE_ENV === 'production') {
    if (isWww || isHttp) {
      const cleanHost = host.replace(/^www\./, '');
      const secureUrl = `https://${cleanHost}${request.nextUrl.pathname}${request.nextUrl.search}`;
      
      // Return 301 Permanent Redirect
      return NextResponse.redirect(secureUrl, 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
