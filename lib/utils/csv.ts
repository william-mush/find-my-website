/**
 * CSV Utilities for Bulk Domain Analysis
 * Parse domains from CSV input and export analysis results as CSV
 */

/**
 * Parse domains from CSV text.
 * Extracts the first column from each row, skipping headers and empty lines.
 * Handles both comma-separated and tab-separated formats.
 */
export function parseCsvDomains(text: string): string[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) return [];

  const domains: string[] = [];
  const domainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*\.[a-z]{2,}$/;

  for (const line of lines) {
    // Split by comma or tab to get the first column
    const separator = line.includes('\t') ? '\t' : ',';
    const columns = line.split(separator);
    const candidate = columns[0]
      .trim()
      .toLowerCase()
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^https?:\/\//, '') // Remove protocol
      .replace(/^www\./, '') // Remove www prefix
      .split('/')[0] // Remove path
      .split('?')[0] // Remove query string
      .split(':')[0]; // Remove port

    // Skip header-like rows
    if (
      candidate === 'domain' ||
      candidate === 'domains' ||
      candidate === 'url' ||
      candidate === 'urls' ||
      candidate === 'website' ||
      candidate === 'hostname' ||
      candidate === 'host' ||
      candidate === 'name'
    ) {
      continue;
    }

    if (domainRegex.test(candidate) && !domains.includes(candidate)) {
      domains.push(candidate);
    }
  }

  return domains;
}

export interface BulkAnalysisResult {
  domain: string;
  status: 'success' | 'error';
  data?: {
    domain: string;
    whois?: {
      registrar?: string;
      createdDate?: string;
      expiryDate?: string;
      nameservers?: string[];
      status?: string[];
    } | null;
    dns?: {
      records?: unknown;
      emailSecurity?: unknown;
      ipAddresses?: string[];
      nameservers?: string[];
    } | null;
    website?: {
      isOnline?: boolean;
      httpStatus?: number;
      responseTime?: number;
      ssl?: { valid?: boolean; issuer?: string; expiresAt?: string } | null;
      server?: { software?: string; version?: string } | null;
      technologies?: unknown[];
      hosting?: unknown;
    } | null;
    seo?: {
      domainAuthority?: {
        score: number;
      };
      backlinks?: {
        total?: number;
      };
      traffic?: unknown;
      seoHealth?: string;
    } | null;
    security?: {
      reputation?: {
        score: number;
        level: string;
      };
      blacklists?: unknown;
      domainAge?: unknown;
      summary?: string;
    } | null;
    statusReport?: {
      status: string;
      estimatedCost: {
        min: number;
        max: number;
        currency: string;
      };
    } | null;
    wayback?: {
      firstCapture?: string;
      lastCapture?: string;
      totalCaptures?: number;
      hasContent?: boolean;
    } | null;
    analyzedAt?: string;
  };
  error?: string;
}

/**
 * Generate a CSV string from bulk analysis results.
 * Includes columns for key metrics from each domain analysis.
 */
export function exportResultsCsv(results: BulkAnalysisResult[]): string {
  const headers = [
    'Domain',
    'Status',
    'DA Score',
    'Domain Age',
    'Security Score',
    'Security Level',
    'Domain Status',
    'Value Estimate (Low)',
    'Value Estimate (High)',
    'Registrar',
    'Created Date',
    'Expiry Date',
    'Wayback Captures',
    'First Capture',
    'Last Capture',
    'Error',
  ];

  const rows = results.map((result) => {
    if (result.status === 'error') {
      return [
        escapeCsvField(result.domain),
        'Error',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        escapeCsvField(result.error || 'Unknown error'),
      ];
    }

    const data = result.data;
    const daScore = data?.seo?.domainAuthority?.score ?? '';
    const securityScore = data?.security?.reputation?.score ?? '';
    const securityLevel = data?.security?.reputation?.level ?? '';
    const domainStatus = data?.statusReport?.status ?? '';
    const valueLow = data?.statusReport?.estimatedCost?.min ?? '';
    const valueHigh = data?.statusReport?.estimatedCost?.max ?? '';
    const registrar = data?.whois?.registrar ?? '';
    const createdDate = data?.whois?.createdDate ?? '';
    const expiryDate = data?.whois?.expiryDate ?? '';
    const waybackCaptures = data?.wayback?.totalCaptures ?? '';
    const firstCapture = data?.wayback?.firstCapture ?? '';
    const lastCapture = data?.wayback?.lastCapture ?? '';

    // Calculate domain age from created date
    let domainAge = '';
    if (createdDate) {
      const created = new Date(createdDate);
      if (!isNaN(created.getTime())) {
        const years = Math.floor(
          (Date.now() - created.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
        );
        domainAge = `${years}y`;
      }
    }

    return [
      escapeCsvField(result.domain),
      'Success',
      String(daScore),
      domainAge,
      String(securityScore),
      escapeCsvField(String(securityLevel)),
      escapeCsvField(String(domainStatus)),
      String(valueLow),
      String(valueHigh),
      escapeCsvField(String(registrar)),
      String(createdDate),
      String(expiryDate),
      String(waybackCaptures),
      String(firstCapture),
      String(lastCapture),
      '',
    ];
  });

  const csvLines = [headers.join(','), ...rows.map((row) => row.join(','))];
  return csvLines.join('\n');
}

/**
 * Escape a field for CSV output.
 * Wraps in quotes if the field contains commas, quotes, or newlines.
 */
function escapeCsvField(field: string): string {
  if (
    field.includes(',') ||
    field.includes('"') ||
    field.includes('\n') ||
    field.includes('\r')
  ) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}
