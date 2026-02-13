/**
 * CSP Violation Report Endpoint
 * Receives Content-Security-Policy violation reports from browsers
 * and logs them for monitoring.
 *
 * Browsers send reports as POST requests with a JSON body when a CSP
 * directive is violated (in Report-Only or enforced mode).
 */

import { NextRequest, NextResponse } from 'next/server';

interface CSPViolationReport {
  'csp-report'?: {
    'document-uri'?: string;
    'violated-directive'?: string;
    'effective-directive'?: string;
    'original-policy'?: string;
    'blocked-uri'?: string;
    'source-file'?: string;
    'line-number'?: number;
    'column-number'?: number;
    'status-code'?: number;
    referrer?: string;
    disposition?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    // CSP reports are sent as application/csp-report or application/json
    if (
      !contentType.includes('application/csp-report') &&
      !contentType.includes('application/json')
    ) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    const body: CSPViolationReport = await request.json();
    const report = body['csp-report'];

    if (!report) {
      return NextResponse.json(
        { error: 'Invalid CSP report format' },
        { status: 400 }
      );
    }

    // Log the violation for monitoring
    // In production, this should be sent to a logging service (e.g., Sentry, Datadog)
    console.error('[CSP Violation]', {
      documentUri: report['document-uri'],
      violatedDirective: report['violated-directive'],
      effectiveDirective: report['effective-directive'],
      blockedUri: report['blocked-uri'],
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number'],
      disposition: report.disposition,
      timestamp: new Date().toISOString(),
    });

    // Return 204 No Content (standard for report endpoints)
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[CSP Report] Failed to process report:', error);
    return new NextResponse(null, { status: 400 });
  }
}

// CSP reports are always POST
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. CSP reports must use POST.' },
    { status: 405 }
  );
}
