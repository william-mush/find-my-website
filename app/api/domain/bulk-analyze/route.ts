import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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

const MAX_DOMAINS_PER_REQUEST = 20;

// Bulk analysis needs more time -- up to 60s on paid Vercel, 10s on free
export const maxDuration = 60;

interface BulkResult {
  domain: string;
  status: 'success' | 'error';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  error?: string;
}

/**
 * Analyze a single domain and return a structured result.
 * Failures are caught and returned as error results rather than thrown.
 */
async function analyzeSingleDomain(cleanDomain: string): Promise<BulkResult> {
  try {
    // Phase 1: Critical data (shorter timeouts for bulk)
    const [whoisResult, waybackResult, dnsResult, websiteResult] =
      await Promise.allSettled([
        withTimeout(whoisAPI.lookup(cleanDomain), 4000),
        withTimeout(waybackAPI.getRecoveryInfo(cleanDomain), 4000),
        withTimeout(dnsAPI.analyze(cleanDomain), 3000),
        withTimeout(websiteAnalyzer.analyze(cleanDomain), 3000),
      ]);

    const whoisData =
      whoisResult.status === 'fulfilled' ? whoisResult.value : undefined;
    const waybackData =
      waybackResult.status === 'fulfilled' ? waybackResult.value : undefined;
    const dnsData =
      dnsResult.status === 'fulfilled' ? dnsResult.value : undefined;
    const websiteData =
      websiteResult.status === 'fulfilled' ? websiteResult.value : undefined;

    // Phase 2: Enhancement data
    const [securityResult, seoResult, statusResult] =
      await Promise.allSettled([
        withTimeout(
          securityAPI.analyze(cleanDomain, whoisData),
          2000
        ),
        withTimeout(
          seoAPI.analyze(cleanDomain, waybackData, whoisData),
          2000
        ),
        withTimeout(
          domainStatusAnalyzer.analyze(
            cleanDomain,
            whoisData,
            waybackData?.hasContent,
            websiteData?.isOnline
          ),
          1500
        ),
      ]);

    const securityData =
      securityResult.status === 'fulfilled' ? securityResult.value : undefined;
    const seoData =
      seoResult.status === 'fulfilled' ? seoResult.value : undefined;
    const statusReport =
      statusResult.status === 'fulfilled' ? statusResult.value : undefined;

    return {
      domain: cleanDomain,
      status: 'success',
      data: {
        domain: cleanDomain,
        whois: whoisData
          ? {
              registrar: whoisData.registrar,
              createdDate: whoisData.createdDate,
              expiryDate: whoisData.expiryDate,
              nameservers: whoisData.nameservers,
              status: whoisData.status,
            }
          : null,
        dns: dnsData
          ? {
              records: dnsData.records,
              emailSecurity: dnsData.emailSecurity,
              ipAddresses: dnsData.ipAddresses,
              nameservers: dnsData.nameservers,
            }
          : null,
        website: websiteData
          ? {
              isOnline: websiteData.isOnline,
              httpStatus: websiteData.httpStatus,
              responseTime: websiteData.responseTime,
              ssl: websiteData.ssl,
              server: websiteData.server,
              technologies: websiteData.technologies,
              hosting: websiteData.hosting,
            }
          : null,
        wayback: waybackData || null,
        security: securityData
          ? {
              reputation: securityData.reputation,
              blacklists: securityData.blacklists,
              domainAge: securityData.domainAge,
              summary: securityAPI.getSecuritySummary(securityData),
            }
          : null,
        seo: seoData
          ? {
              domainAuthority: seoData.domainAuthority,
              backlinks: seoData.backlinks,
              traffic: seoData.traffic,
              seoHealth: seoData.seoHealth,
            }
          : null,
        statusReport,
        analyzedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return {
      domain: cleanDomain,
      status: 'error',
      error: error instanceof Error ? error.message : 'Analysis failed',
    };
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;
  const referer = request.headers.get('referer') || undefined;

  try {
    // 1. Authentication check
    const session = await auth();
    if (!session?.user) {
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/bulk-analyze',
        method: 'POST',
        userAgent,
        referer,
        statusCode: 401,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: 0,
      });

      return NextResponse.json(
        {
          error: 'Authentication required',
          message: 'You must be signed in to use bulk analysis.',
        },
        { status: 401 }
      );
    }

    // 2. Check IP-based blocking
    const ipStats = await usageTracker.getIPStats(clientIP);
    if (
      ipStats?.isBlocked &&
      ipStats.blockedUntil &&
      new Date() < ipStats.blockedUntil
    ) {
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/bulk-analyze',
        method: 'POST',
        userAgent,
        referer,
        statusCode: 429,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: 0,
        wasBlocked: true,
      });

      return NextResponse.json(
        {
          error: 'IP blocked',
          message:
            ipStats.blockReason || 'Your IP has been blocked due to abuse.',
          blockedUntil: ipStats.blockedUntil.toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(
              (ipStats.blockedUntil.getTime() - Date.now()) / 1000
            ).toString(),
          },
        }
      );
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const { domains } = body;

    if (!domains || !Array.isArray(domains) || domains.length === 0) {
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/bulk-analyze',
        method: 'POST',
        userAgent,
        referer,
        statusCode: 400,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: 0,
      });

      return NextResponse.json(
        {
          error: 'Invalid request',
          message:
            'Request body must include a "domains" array with at least one domain.',
        },
        { status: 400 }
      );
    }

    if (domains.length > MAX_DOMAINS_PER_REQUEST) {
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/bulk-analyze',
        method: 'POST',
        userAgent,
        referer,
        statusCode: 400,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: 0,
      });

      return NextResponse.json(
        {
          error: 'Too many domains',
          message: `Maximum ${MAX_DOMAINS_PER_REQUEST} domains per request. You sent ${domains.length}.`,
        },
        { status: 400 }
      );
    }

    // 4. Rate limiting -- count as N requests for N domains
    // Authenticated users get a higher limit: 20 requests per 2 minutes
    const rateLimitResult = await rateLimiter.checkLimit(
      `bulk:${clientIP}`,
      20,
      120
    );

    if (!rateLimitResult.success) {
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/bulk-analyze',
        method: 'POST',
        userAgent,
        referer,
        statusCode: 429,
        responseTime: Date.now() - startTime,
        rateLimitRemaining: 0,
        wasRateLimited: true,
      });

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.`,
          limit: rateLimitResult.limit,
          reset: new Date(rateLimitResult.reset).toISOString(),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(
              rateLimitResult.reset
            ).toISOString(),
            'Retry-After': rateLimitResult.retryAfter?.toString() || '120',
          },
        }
      );
    }

    // 5. Validate all domains up front
    const validatedDomains: { original: string; clean: string }[] = [];
    const validationErrors: BulkResult[] = [];

    for (const rawDomain of domains) {
      if (typeof rawDomain !== 'string') {
        validationErrors.push({
          domain: String(rawDomain),
          status: 'error',
          error: 'Domain must be a string',
        });
        continue;
      }

      const validationResult = inputValidator.validateDomain(rawDomain);
      if (!validationResult.valid) {
        validationErrors.push({
          domain: rawDomain,
          status: 'error',
          error: validationResult.errors.join(', '),
        });
        continue;
      }

      // Skip duplicates
      const alreadyIncluded = validatedDomains.some(
        (d) => d.clean === validationResult.sanitized
      );
      if (!alreadyIncluded) {
        validatedDomains.push({
          original: rawDomain,
          clean: validationResult.sanitized,
        });
      }
    }

    if (validatedDomains.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid domains',
          message: 'None of the provided domains passed validation.',
          results: validationErrors,
        },
        { status: 400 }
      );
    }

    // 6. Consume rate limit slots for each valid domain
    // We already checked the limit above, now add extra slots for N-1 additional domains
    for (let i = 1; i < validatedDomains.length; i++) {
      await rateLimiter.checkLimit(`bulk:${clientIP}`, 20, 120);
    }

    console.log(
      `[Bulk Analysis] Starting analysis of ${validatedDomains.length} domains for ${clientIP}`
    );

    // 7. Run all analyses in parallel using Promise.allSettled
    const analysisPromises = validatedDomains.map(({ clean }) =>
      analyzeSingleDomain(clean)
    );

    const settledResults = await Promise.allSettled(analysisPromises);

    // 8. Collect results
    const results: BulkResult[] = [];

    for (const settled of settledResults) {
      if (settled.status === 'fulfilled') {
        results.push(settled.value);
      } else {
        // This shouldn't normally happen since analyzeSingleDomain catches errors,
        // but handle it defensively
        results.push({
          domain: 'unknown',
          status: 'error',
          error:
            settled.reason instanceof Error
              ? settled.reason.message
              : 'Analysis failed unexpectedly',
        });
      }
    }

    // Append validation errors
    results.push(...validationErrors);

    const totalTime = Date.now() - startTime;
    const successCount = results.filter((r) => r.status === 'success').length;
    const errorCount = results.filter((r) => r.status === 'error').length;

    console.log(
      `[Bulk Analysis] Complete (${totalTime}ms): ${successCount} success, ${errorCount} errors`
    );

    // 9. Track usage for each analyzed domain
    for (const result of results) {
      usageTracker.trackRequest({
        ipAddress: clientIP,
        endpoint: '/api/domain/bulk-analyze',
        domain: result.domain,
        method: 'POST',
        userAgent,
        referer,
        statusCode: result.status === 'success' ? 200 : 422,
        responseTime: totalTime,
        rateLimitRemaining: rateLimitResult.remaining,
      });
    }

    const headers = {
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': Math.max(
        0,
        rateLimitResult.remaining - validatedDomains.length
      ).toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
    };

    return NextResponse.json(
      {
        results,
        summary: {
          total: results.length,
          success: successCount,
          errors: errorCount,
          analysisTime: totalTime,
        },
        analyzedAt: new Date().toISOString(),
      },
      { headers }
    );
  } catch (error) {
    console.error('Bulk analysis failed:', error);

    usageTracker.trackRequest({
      ipAddress: clientIP,
      endpoint: '/api/domain/bulk-analyze',
      method: 'POST',
      userAgent,
      referer,
      statusCode: 500,
      responseTime: Date.now() - startTime,
      rateLimitRemaining: 0,
    });

    return NextResponse.json(
      {
        error: 'Bulk analysis failed',
        message:
          error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
