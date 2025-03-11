// middleware.js
import { NextResponse } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/bet/',
  '/bets',
  '/wallet',
];

const authRoutes = [
  '/login',
  '/register',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // More reliable token check
  const token = request.cookies.get('token')?.value;
  const isAuthenticated = !!token && token.length > 20; // Basic validation
  
  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      const url = new URL('/login', request.url);
      url.searchParams.set('from', encodeURIComponent(pathname));
      return NextResponse.redirect(url);
    }
  }
  
  // Handle auth routes (login, register)
  if (authRoutes.some(route => pathname === route)) {
    if (isAuthenticated) {
      // Redirect to dashboard if already authenticated
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bet/:path*',
    '/bets/:path*',
    '/wallet/:path*',
    '/login',
    '/register',
  ],
};