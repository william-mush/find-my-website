import { NextRequest, NextResponse } from 'next/server';
import { domainValuation } from '@/lib/intelligence/domain-valuation';
import { inputValidator } from '@/lib/security/input-validator';
import type { WhoisData } from '@/lib/external-apis/whois';
import type { SEOAnalysis } from '@/lib/external-apis/seo';
import type { SecurityAnalysis } from '@/lib/external-apis/security';
import type { WebsiteAnalysis } from '@/lib/external-apis/website-analyzer';

export const maxDuration = 5;

/**
 * GET /api/domain/valuate?domain=example.com
 *
 * Quick valuation using heuristics only (no external data lookups).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domain = searchParams.get('domain');

  if (!domain) {
    return NextResponse.json(
      { error: 'Missing required query parameter: domain' },
      { status: 400 }
    );
  }

  const validation = inputValidator.validateDomain(domain);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid domain', message: validation.errors.join(', ') },
      { status: 400 }
    );
  }

  try {
    const result = domainValuation.estimate(validation.sanitized);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Valuation failed:', error);
    return NextResponse.json(
      {
        error: 'Valuation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/domain/valuate
 *
 * Enriched valuation — accepts optional WHOIS, SEO, security, and
 * website data in the request body to produce a higher-confidence estimate.
 *
 * Body:
 * {
 *   "domain": "example.com",
 *   "whoisData": { ... },     // optional
 *   "seoData": { ... },       // optional
 *   "securityData": { ... },  // optional
 *   "websiteData": { ... }    // optional
 * }
 */
export async function POST(request: NextRequest) {
  let body: {
    domain?: string;
    whoisData?: WhoisData;
    seoData?: SEOAnalysis;
    securityData?: SecurityAnalysis;
    websiteData?: WebsiteAnalysis;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  const { domain, whoisData, seoData, securityData, websiteData } = body;

  if (!domain) {
    return NextResponse.json(
      { error: 'Missing required field: domain' },
      { status: 400 }
    );
  }

  const validation = inputValidator.validateDomain(domain);
  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Invalid domain', message: validation.errors.join(', ') },
      { status: 400 }
    );
  }

  try {
    const result = domainValuation.estimate(
      validation.sanitized,
      whoisData,
      seoData,
      securityData,
      websiteData
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Valuation failed:', error);
    return NextResponse.json(
      {
        error: 'Valuation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
