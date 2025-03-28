// app/api/csrf-token/route.js
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * API route to generate and set a CSRF token
 * This endpoint is called by the CsrfToken component when needed
 */
export async function GET() {
  const cookieStore = cookies();
  
  // Check if the CSRF token cookie already exists
  const existingToken = cookieStore.get('XSRF-TOKEN');
  
  if (existingToken) {
    // Token already exists, return success response
    return new NextResponse(JSON.stringify({ status: 'success' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Generate a new secure random token
  const csrfToken = crypto.randomBytes(32).toString('hex');
  
  // Set the CSRF token as a cookie
  // Using HttpOnly: false here because the client needs to read this token
  // and include it in the X-CSRF-TOKEN header
  const response = NextResponse.json({ status: 'success' });
  
  response.cookies.set({
    name: 'XSRF-TOKEN',
    value: csrfToken,
    httpOnly: false, // Needs to be accessible by JavaScript
    secure: process.env.NODE_ENV === 'production', // Secure in production
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 // 1 day
  });
  
  return response;
}