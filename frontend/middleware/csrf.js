// middleware/csrf.js
// This middleware ensures CSRF tokens are properly set for the client
import { NextResponse } from 'next/server';

// CSRF middleware to help with token setup
export function middleware(request) {
  // Get the response to modify
  const response = NextResponse.next();
  
  // Check if we need to request a new CSRF token
  const hasCsrfCookie = request.cookies.get('XSRF-TOKEN');
  
  if (!hasCsrfCookie) {
    // Append a custom header to tell our API to set a new CSRF token
    response.headers.set('X-Request-CSRF-Token', '1');
  }
  
  return response;
}

// Apply this middleware to all pages - Next.js will only invoke it once per request
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};