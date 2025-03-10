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
  
  // More reliable way to check for token
  const token = request.cookies.get('token')?.value;
  const isAuthenticated = !!token;
  
  console.log(`Middleware checking path: ${pathname}, isAuthenticated: ${isAuthenticated}`);
  
  // Handle protected routes
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      const url = new URL('/login', request.url);
      url.searchParams.set('from', pathname);
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

// Update your config to match routes
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