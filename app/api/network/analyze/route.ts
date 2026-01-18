import { NextRequest, NextResponse } from 'next/server';
import { networkAnalyzer } from '@/lib/intelligence/network-analyzer';
import { rateLimiter, getClientIP } from '@/lib/security/rate-limiter';
import { inputValidator } from '@/lib/security/input-validator';
import { usageTracker } from '@/lib/security/usage-tracker';

export const maxDuration = 10;

// Tier limits for network lookups
const TIER_LIMITS = {
  FREE: {
    lookupsPerMonth: 1,
    domainsPerLookup: 5,
  },
  PRO: {
    lookupsPerMonth: 50,
    domainsPerLookup: 100,
  },
  BUSINESS: {
    lookupsPerMonth: 500,
    domainsPerLookup: 500,
  },
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  let statusCode = 200;

  try {
    // 1. Rate limiting - Network analysis: 1 request per minute (more expensive)
    const rateLimitResult = await rateLimiter.checkLimit(clientIP, 1, 60);

    if (!rateLimitResult.success) {
      statusCode = 429;
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/network/analyze',
        method: 'POST',
        userAgent,
        statusCode,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: 0,
        wasRateLimited: true,
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
          },
        }
      );
    }

    // 2. Parse and validate input
    const body = await request.json();
    const { input } = body;

    if (!input) {
      statusCode = 400;
      return NextResponse.json({ error: 'Input required' }, { status: 400 });
    }

    // Validate input
    const validation = inputValidator.validateDomainOrIP(input);

    if (!validation.isValid) {
      statusCode = 400;
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/network/analyze',
        method: 'POST',
        userAgent,
        statusCode,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: rateLimitResult.remaining,
        wasInvalidInput: true,
      });

      return NextResponse.json(
        {
          error: 'Invalid input',
          message: validation.error || 'Please provide a valid domain or IP address',
        },
        { status: 400 }
      );
    }

    // 3. Determine user tier and apply limits
    // TODO: Get actual user tier from session when auth is implemented
    const userTier = 'FREE'; // Default to free tier
    const limits = TIER_LIMITS[userTier];

    // For free tier, limit to 5 domains
    const domainLimit = limits.domainsPerLookup;

    console.log(`[NetworkAnalyze] Analyzing: ${input} (tier: ${userTier}, limit: ${domainLimit})`);

    // 4. Perform network analysis with tech stack detection
    const analysis = await networkAnalyzer.analyze(input, {
      limit: domainLimit,
      detectTechStacks: true, // Enable tech stack detection
    });

    // 5. Track usage
    usageTracker.trackRequest({
      ipAddress: clientIP,
      endpoint: '/api/network/analyze',
      method: 'POST',
      userAgent,
      statusCode,
      responseTime: Date.now() - startTime,
      rateLimitRemaining: rateLimitResult.remaining,
    });

    // 6. Return results
    return NextResponse.json(
      {
        ...analysis,
        meta: {
          tier: userTier,
          limits: {
            domainsShown: Math.min(analysis.reverseIP.totalDomains, domainLimit),
            totalDomainsFound: analysis.reverseIP.totalDomains,
            upgradeRequired: analysis.reverseIP.totalDomains > domainLimit,
          },
        },
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  } catch (error: any) {
    console.error('[NetworkAnalyze] Error:', error);

    statusCode = 500;

    usageTracker.trackRequest({
      ipAddress: clientIP,
      endpoint: '/api/network/analyze',
      method: 'POST',
      userAgent,
      statusCode,
      responseTime: Date.now() - startTime,
      rateLimitRemaining: 0,
    });

    return NextResponse.json(
      {
        error: 'Analysis failed',
        message: error.message || 'An error occurred while analyzing the network',
      },
      { status: 500 }
    );
  }
}
