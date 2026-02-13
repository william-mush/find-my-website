import { NextRequest, NextResponse } from 'next/server';
import { networkAnalyzer } from '@/lib/intelligence/network-analyzer';
import { rateLimiter, getClientIP } from '@/lib/security/rate-limiter';
import { inputValidator } from '@/lib/security/input-validator';
import { usageTracker } from '@/lib/security/usage-tracker';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { users, searchHistory } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const maxDuration = 10;

// Tier-based limits for network scans
const TIER_LIMITS: Record<string, { scansPerDay: number; domainsPerLookup: number }> = {
  free: {
    scansPerDay: 5,
    domainsPerLookup: 5,
  },
  pro: {
    scansPerDay: 50,
    domainsPerLookup: 100,
  },
  enterprise: {
    scansPerDay: Infinity,
    domainsPerLookup: 500,
  },
};

// Unauthenticated users get a very limited allowance
const ANONYMOUS_LIMITS = {
  scansPerDay: 2,
  domainsPerLookup: 5,
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

    // 2. Check authentication and determine tier
    const session = await auth();
    let userTier = 'anonymous';
    let userId: string | undefined;
    let dailyLimit = ANONYMOUS_LIMITS.scansPerDay;
    let domainLimit = ANONYMOUS_LIMITS.domainsPerLookup;

    if (session?.user?.id) {
      userId = session.user.id;

      // Look up user tier from database
      const userRecord = await db
        .select({ tier: users.tier })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      userTier = userRecord[0]?.tier || 'free';
      const tierConfig = TIER_LIMITS[userTier] || TIER_LIMITS.free;
      dailyLimit = tierConfig.scansPerDay;
      domainLimit = tierConfig.domainsPerLookup;
    }

    // 3. Check daily usage limit
    const todayUsage = await usageTracker.getDailyUsageCount(
      '/api/network/analyze',
      userId,
      clientIP
    );
    const remaining = Math.max(0, dailyLimit - todayUsage);

    if (dailyLimit !== Infinity && todayUsage >= dailyLimit) {
      statusCode = 429;
      usageTracker.trackRequest({
        ipAddress: clientIP,
        userId,
        endpoint: '/api/network/analyze',
        method: 'POST',
        userAgent,
        statusCode,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: 0,
        wasRateLimited: true,
      });

      const upgradeMessage = !session
        ? 'Sign in for more scans, or upgrade to Pro for 50 scans/day.'
        : userTier === 'free'
          ? 'Upgrade to Pro for 50 scans/day, or Enterprise for unlimited scans.'
          : 'Upgrade to Enterprise for unlimited scans.';

      return NextResponse.json(
        {
          error: 'Daily scan limit reached',
          message: `You have used all ${dailyLimit} scans for today. ${upgradeMessage}`,
          dailyLimit,
          used: todayUsage,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    // 4. Parse and validate input
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
        userId,
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

    console.log(`[NetworkAnalyze] Analyzing: ${input} (tier: ${userTier}, limit: ${domainLimit}, scans: ${todayUsage + 1}/${dailyLimit})`);

    // 5. Perform network analysis with tech stack detection
    const analysis = await networkAnalyzer.analyze(input, {
      limit: domainLimit,
      detectTechStacks: true,
    });

    // 6. Track usage
    usageTracker.trackRequest({
      ipAddress: clientIP,
      userId,
      endpoint: '/api/network/analyze',
      method: 'POST',
      userAgent,
      statusCode,
      responseTime: Date.now() - startTime,
      rateLimitRemaining: rateLimitResult.remaining,
    });

    // 6b. Save to search history for authenticated users (fire-and-forget)
    if (userId) {
      db.insert(searchHistory)
        .values({
          userId,
          domain: input,
          analysisType: 'network',
          resultSummary: {
            status: analysis.reverseIP ? `${analysis.reverseIP.totalDomains} domains found` : undefined,
            isOnline: true,
          },
        })
        .then(() => console.log(`[History] Saved network search for ${input} (user: ${userId})`))
        .catch((err: unknown) => console.error('[History] Failed to save network search:', err));
    }

    // 7. Return results with usage info
    const newRemaining = dailyLimit === Infinity ? -1 : remaining - 1;

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
          usage: {
            scansUsedToday: todayUsage + 1,
            dailyLimit: dailyLimit === Infinity ? null : dailyLimit,
            remaining: dailyLimit === Infinity ? null : newRemaining,
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
  } catch (error) {
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
        message: error instanceof Error ? error.message : 'An error occurred while analyzing the network',
      },
      { status: 500 }
    );
  }
}
