import { NextRequest, NextResponse } from 'next/server';
import { whoisAPI } from '@/lib/external-apis/whois';
import { waybackAPI } from '@/lib/external-apis/wayback';
import { dnsAPI } from '@/lib/external-apis/dns';
import { websiteAnalyzer } from '@/lib/external-apis/website-analyzer';
import { securityAPI } from '@/lib/external-apis/security';
import { seoAPI } from '@/lib/external-apis/seo';
import { domainStatusAnalyzer } from '@/lib/recovery/domain-status-analyzer';
import { withTimeout } from '@/lib/utils/fetch-with-timeout';
import { rateLimiter, getClientIP } from '@/lib/security/rate-limiter';
import { inputValidator } from '@/lib/security/input-validator';
import { usageTracker } from '@/lib/security/usage-tracker';
import { authenticateApiKey } from '@/lib/api-keys';
import { auth } from '@/auth';
import { db } from '@/lib/db';
import { searchHistory } from '@/lib/db/schema';

// Vercel serverless timeout is 10s on free tier
// We need to complete analysis in under 8s to be safe
export const maxDuration = 10;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  const referer = request.headers.get('referer') || undefined;

  let domain: string | undefined;
  let statusCode = 200;
  let rateLimitRemaining = 10;

  try {
    // 0. API Key Authentication (alternative to session auth)
    // If an API key is provided via Authorization header, validate it.
    // Authenticated API key requests bypass IP-based rate limiting and
    // use the key's own rate limit instead.
    const apiKeyAuth = await authenticateApiKey(request);
    if (apiKeyAuth) {
      console.log(`[Analysis] Authenticated via API key (keyId: ${apiKeyAuth.keyId}, userId: ${apiKeyAuth.userId})`);
    }

    // 1. Check IP-based blocking (database level)
    const ipStats = await usageTracker.getIPStats(clientIP);
    if (ipStats?.isBlocked && ipStats.blockedUntil && new Date() < ipStats.blockedUntil) {
      statusCode = 429;

      // Track this blocked request
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/analyze',
        method: 'POST',
        userAgent,
        referer,
        statusCode,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: 0,
        wasBlocked: true,
      });

      return NextResponse.json(
        {
          error: 'IP blocked',
          message: ipStats.blockReason || 'Your IP has been blocked due to abuse.',
          blockedUntil: ipStats.blockedUntil.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil((ipStats.blockedUntil.getTime() - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    // 2. Rate Limiting Check (Redis)
    // API key users get their own rate limit bucket (keyed by keyId) with a higher limit.
    // Anonymous/session users get the stricter IP-based limit (3/min).
    const rateLimitKey = apiKeyAuth ? `apikey:${apiKeyAuth.keyId}` : clientIP;
    const rateLimitMax = apiKeyAuth ? apiKeyAuth.rateLimit : 3;
    const rateLimitWindow = apiKeyAuth ? 3600 : 60; // API keys: per hour; anonymous: per minute
    const rateLimitResult = await rateLimiter.checkLimit(rateLimitKey, rateLimitMax, rateLimitWindow);
    rateLimitRemaining = rateLimitResult.remaining;

    if (!rateLimitResult.success) {
      statusCode = 429;

      // Track rate limit violation
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/analyze',
        method: 'POST',
        userAgent,
        referer,
        statusCode,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: 0,
        wasRateLimited: true,
      });

      const headers = {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
        'Retry-After': rateLimitResult.retryAfter?.toString() || '60',
      };

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
          limit: rateLimitResult.limit,
          reset: new Date(rateLimitResult.reset).toISOString(),
        },
        { status: 429, headers }
      );
    }

    // 3. Input Validation
    const body = await request.json();
    domain = body.domain;

    if (!domain) {
      statusCode = 400;

      // Track invalid request
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/analyze',
        method: 'POST',
        userAgent,
        referer,
        statusCode,
        responseTime: Date.now() - startTime,
        rateLimitRemaining,
      });

      return NextResponse.json(
        { error: 'Domain is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize domain input
    const validationResult = inputValidator.validateDomain(domain);

    if (!validationResult.valid) {
      statusCode = 400;

      // Track invalid input attempt
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/analyze',
        domain: domain.substring(0, 255),
        method: 'POST',
        userAgent,
        referer,
        statusCode,
        responseTime: Date.now() - startTime,
        rateLimitRemaining,
        wasInvalidInput: true,
      });

      return NextResponse.json(
        {
          error: 'Invalid domain',
          message: validationResult.errors.join(', '),
          providedInput: domain.substring(0, 50),
        },
        { status: 400 }
      );
    }

    const cleanDomain = validationResult.sanitized;
    domain = cleanDomain; // Update for tracking

    console.log(`[Analysis] Starting comprehensive analysis for: ${cleanDomain}`);

    // Fetch critical data first (with 3s timeout each)
    // These are the most important for domain recovery
    const [
      whoisResult,
      waybackResult,
      dnsResult,
      websiteResult,
    ] = await Promise.allSettled([
      withTimeout(whoisAPI.lookup(cleanDomain), 3000),
      withTimeout(waybackAPI.getRecoveryInfo(cleanDomain), 3000),
      withTimeout(dnsAPI.analyze(cleanDomain), 2000),
      withTimeout(websiteAnalyzer.analyze(cleanDomain), 2000),
    ]);

    // Extract data from results
    const whoisData = whoisResult.status === 'fulfilled' ? whoisResult.value : undefined;
    const waybackData = waybackResult.status === 'fulfilled' ? waybackResult.value : undefined;
    const dnsData = dnsResult.status === 'fulfilled' ? dnsResult.value : undefined;
    const websiteData = websiteResult.status === 'fulfilled' ? websiteResult.value : undefined;

    const phase1Time = Date.now() - startTime;
    console.log(`[Analysis] Phase 1 (${phase1Time}ms): WHOIS: ${whoisData ? 'OK' : 'FAIL'}, Wayback: ${waybackData ? 'OK' : 'FAIL'}, DNS: ${dnsData ? 'OK' : 'FAIL'}, Website: ${websiteData ? 'OK' : 'FAIL'}`);

    // Perform additional analyses with shorter timeouts (1-2s each)
    // These enhance the results but aren't critical
    const [
      securityResult,
      seoResult,
      statusResult,
    ] = await Promise.allSettled([
      withTimeout(securityAPI.analyze(cleanDomain, whoisData), 1500),
      withTimeout(seoAPI.analyze(cleanDomain, waybackData, whoisData), 1500),
      withTimeout(
        domainStatusAnalyzer.analyze(
          cleanDomain,
          whoisData,
          waybackData?.hasContent,
          websiteData?.isOnline
        ),
        1000
      ),
    ]);

    const securityData = securityResult.status === 'fulfilled' ? securityResult.value : undefined;
    const seoData = seoResult.status === 'fulfilled' ? seoResult.value : undefined;
    const statusReport = statusResult.status === 'fulfilled' ? statusResult.value : undefined;

    const totalTime = Date.now() - startTime;
    console.log(`[Analysis] Complete (${totalTime}ms): Security: ${securityData ? 'OK' : 'FAIL'}, SEO: ${seoData ? 'OK' : 'FAIL'}, Status: ${statusReport ? 'OK' : 'FAIL'}`);

    // Track successful request
    usageTracker.trackRequest({
      ipAddress: clientIP,
      endpoint: '/api/domain/analyze',
      domain: cleanDomain,
      method: 'POST',
      userAgent,
      referer,
      statusCode: 200,
      responseTime: totalTime,
      rateLimitRemaining: rateLimitResult.remaining,
    });

    // Save to search history for authenticated users (fire-and-forget)
    try {
      const session = await auth();
      if (session?.user?.id) {
        db.insert(searchHistory)
          .values({
            userId: session.user.id,
            domain: cleanDomain,
            analysisType: 'domain',
            resultSummary: {
              status: statusReport?.status || undefined,
              isRegistered: whoisData ? true : undefined,
              registrar: whoisData?.registrar || undefined,
              expiryDate: whoisData?.expiryDate
                ? (typeof whoisData.expiryDate === 'string'
                    ? whoisData.expiryDate
                    : new Date(whoisData.expiryDate as unknown as string).toISOString())
                : undefined,
              isOnline: websiteData?.isOnline || undefined,
              recoveryDifficulty: statusReport?.recoveryDifficulty || undefined,
            },
          })
          .then(() => console.log(`[History] Saved search for ${cleanDomain} (user: ${session.user!.id})`))
          .catch((err: unknown) => console.error('[History] Failed to save search:', err));
      }
    } catch {
      // Don't let history saving failure affect the response
    }

    // Build comprehensive response with rate limit headers
    const headers = {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
    };

    return NextResponse.json({
      domain: cleanDomain,

      // WHOIS Information (Enhanced)
      whois: whoisData ? {
        registrar: whoisData.registrar,
        registrarUrl: whoisData.registrarUrl,
        createdDate: whoisData.createdDate,
        updatedDate: whoisData.updatedDate,
        expiryDate: whoisData.expiryDate,
        registrant: whoisData.registrant,
        admin: whoisData.admin,
        tech: whoisData.tech,
        nameservers: whoisData.nameservers,
        status: whoisData.status,
        privacy: whoisData.privacy,
        locks: whoisData.locks,
        transferInfo: whoisData.transferInfo,
        dnssec: whoisData.dnssec,
      } : null,

      // DNS Records (New!)
      dns: dnsData ? {
        records: dnsData.records,
        emailSecurity: dnsData.emailSecurity,
        security: dnsData.security,
        ipAddresses: dnsData.ipAddresses,
        mailServers: dnsData.mailServers,
        nameservers: dnsData.nameservers,
        emailScore: dnsAPI.getEmailScore(dnsData),
      } : null,

      // Website Analysis (New!)
      website: websiteData ? {
        isOnline: websiteData.isOnline,
        httpStatus: websiteData.httpStatus,
        responseTime: websiteData.responseTime,
        ssl: websiteData.ssl,
        server: websiteData.server,
        technologies: websiteData.technologies,
        hosting: websiteData.hosting,
        security: websiteData.security,
        performance: websiteData.performance,
        techStack: websiteAnalyzer.getTechStack(websiteData),
      } : null,

      // Wayback Machine
      wayback: waybackData || null,

      // Security Analysis (New!)
      security: securityData ? {
        reputation: securityData.reputation,
        blacklists: securityData.blacklists,
        domainAge: securityData.domainAge,
        ownership: securityData.ownership,
        ssl: securityData.ssl,
        malware: securityData.malware,
        spam: securityData.spam,
        phishing: securityData.phishing,
        summary: securityAPI.getSecuritySummary(securityData),
      } : null,

      // SEO Analysis (New!)
      seo: seoData ? {
        domainAuthority: seoData.domainAuthority,
        backlinks: seoData.backlinks,
        content: seoData.content,
        traffic: seoData.traffic,
        keywords: seoData.keywords,
        history: seoData.history,
        seoHealth: seoData.seoHealth,
      } : null,

      // Domain Status Report
      statusReport,

      // Metadata
      analyzedAt: new Date().toISOString(),
      analysisVersion: '2.0',
    }, { headers });
  } catch (error) {
    console.error('Domain analysis failed:', error);
    statusCode = 500;

    // Track error
    usageTracker.trackRequest({
      ipAddress: clientIP,
      endpoint: '/api/domain/analyze',
      domain,
      method: 'POST',
      userAgent,
      referer,
      statusCode,
      responseTime: Date.now() - startTime,
      rateLimitRemaining,
    });

    return NextResponse.json(
      { error: 'Analysis failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
