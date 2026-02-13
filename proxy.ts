/**
 * Next.js Proxy (Next.js 16+)
 * Generates per-request cryptographic nonces for Content Security Policy
 * and applies security headers to all responses.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Generate a cryptographic nonce for this request
  const nonce = crypto.randomUUID();

  // Build the Content Security Policy with the nonce
  const cspDirectives = [
    // Default: only allow same-origin
    "default-src 'self'",

    // Scripts: nonce-based with strict-dynamic for trusted script-loaded scripts
    // 'strict-dynamic' allows scripts loaded by nonced scripts to execute
    // 'unsafe-inline' is ignored when a nonce is present (fallback for older browsers)
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self' https://vercel.live https://*.sentry-cdn.com`,

    // Styles: nonce-based for inline styles
    // 'unsafe-inline' is a fallback for browsers that don't support nonces
    `style-src 'nonce-${nonce}' 'self' 'unsafe-inline'`,

    // Images: self, data URIs, and known external sources
    "img-src 'self' data: https://*.vercel.app https://avatars.githubusercontent.com https://lh3.googleusercontent.com",

    // Fonts: self-hosted (Next.js google fonts are inlined)
    "font-src 'self' data:",

    // API connections: whitelist specific domains and Sentry error reporting
    "connect-src 'self' https://*.vercel.app https://web.archive.org https://rdap.org https://dns.google https://hackertarget.com https://ipapi.is https://*.ingest.sentry.io",

    // Worker source for Sentry session replay
    "worker-src 'self' blob:",

    // Frame ancestors: same-origin only (replaces X-Frame-Options)
    "frame-ancestors 'self'",

    // Base URI and form actions restricted to self
    "base-uri 'self'",
    "form-action 'self'",

    // Block object/embed elements
    "object-src 'none'",

    // Block iframes
    "frame-src 'none'",

    // Upgrade HTTP to HTTPS
    "upgrade-insecure-requests",

    // Report violations to our endpoint
    "report-uri /api/csp-report",
  ].join('; ');

  // Clone the request headers and set the nonce for downstream use
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Use Content-Security-Policy-Report-Only for safe rollout
  // Once verified, switch to Content-Security-Policy to enforce
  response.headers.set('Content-Security-Policy-Report-Only', cspDirectives);

  // Other security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Pass the nonce in a response header for debugging (non-sensitive, single-use)
  response.headers.set('x-nonce', nonce);

  // CORS Headers for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');

    // Check if origin is allowed
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
