import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const refreshToken = request.cookies.get('refreshToken')?.value;

  // Protect app routes (dashboard, security, staff, branches, departments, rooms, etc.)
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/security') ||
    pathname.startsWith('/staff') ||
    pathname.startsWith('/branches') ||
    pathname.startsWith('/departments') ||
    pathname.startsWith('/rooms')
  ) {
    if (!refreshToken) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated user away from auth pages
  if (pathname === '/login' && refreshToken) {
    const dashboardUrl = new URL('/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/security/:path*',
    '/staff/:path*',
    '/branches/:path*',
    '/departments/:path*',
    '/rooms/:path*',
    '/login',
  ],
};
