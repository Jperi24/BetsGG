import { NextResponse } from 'next/server';

// Define protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/bet/',
  '/bets',
  '/wallet',
];

// Define auth routes that should redirect to dashboard if already logged in
const authRoutes = [
  '/login',
  '/register',
];

export function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Check if token exists in cookies - using request.cookies instead of the cookies() API
  const token = request.cookies.get('token')?.value;
  const isAuthenticated = !!token;
  
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

// Configure which routes should trigger this middleware
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