/**
 * Next.js Proxy (formerly Middleware)
 * Adds security headers and CORS configuration
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const response = NextResponse.next();

  // Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Content Security Policy - Improved security
  const csp = [
    "default-src 'self'",
    // Allow Next.js scripts + inline for dynamic imports (still requires unsafe-inline for now)
    // TODO: Use nonces for inline scripts in future
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live",
    // Tailwind requires unsafe-inline for dynamic styles
    // TODO: Extract critical CSS and use CSP hash
    "style-src 'self' 'unsafe-inline'",
    // Restrict images to self, data URIs, and specific external sources
    "img-src 'self' data: https://*.vercel.app https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
    "font-src 'self' data:",
    // API connections - whitelist specific domains
    "connect-src 'self' https://*.vercel.app https://web.archive.org https://rdap.org https://dns.google https://hackertarget.com https://ipapi.is",
    "frame-ancestors 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    // Block object/embed for extra protection
    "object-src 'none'",
    "frame-src 'none'",
    // Upgrade insecure requests
    "upgrade-insecure-requests",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // CORS Headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // Allow specific origins (adjust as needed)
    const allowedOrigins = [
      'https://find-my-website.vercel.app',
      'https://find-my-website-*.vercel.app',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '',
    ].filter(Boolean);

    const origin = request.headers.get('origin');

    // Check if origin is allowed (simplified - matches vercel.app domains)
    const isAllowed = origin && (
      origin.includes('vercel.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1')
    );

    if (isAllowed && origin) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
