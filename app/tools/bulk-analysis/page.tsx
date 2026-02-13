'use client';

import { useState, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { parseCsvDomains, exportResultsCsv, type BulkAnalysisResult } from '@/lib/utils/csv';

const MAX_DOMAINS = 20;

export default function BulkAnalysisPage() {
  const { data: session, status: authStatus } = useSession();
  const [domainText, setDomainText] = useState('');
  const [results, setResults] = useState<BulkAnalysisResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedDomains = domainText
    .split(/\r?\n/)
    .map((line) => line.trim().toLowerCase())
    .filter((line) => line.length > 0 && !line.startsWith('#'));

  const domainCount = parsedDomains.length;

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) return;

        const domains = parseCsvDomains(text);
        if (domains.length === 0) {
          setError(
            'No valid domains found in the CSV file. Make sure domains are in the first column.'
          );
          return;
        }

        setDomainText(domains.join('\n'));
        setError(null);
      };
      reader.onerror = () => {
        setError('Failed to read file. Please try again.');
      };
      reader.readAsText(file);

      // Reset file input so the same file can be re-uploaded
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
    if (!session?.user) {
      setError('You must be signed in to use bulk analysis.');
      return;
    }

    const domains = parsedDomains.slice(0, MAX_DOMAINS);
    if (domains.length === 0) {
      setError('Please enter at least one domain to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setResults([]);
    setProgress({ current: 0, total: domains.length });

    try {
      const response = await fetch('/api/domain/bulk-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domains }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Bulk analysis failed');
      }

      setResults(data.results || []);
      setProgress({ current: domains.length, total: domains.length });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  }, [session, parsedDomains]);

  const handleExportCsv = useCallback(() => {
    if (results.length === 0) return;

    const csvContent = exportResultsCsv(results);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bulk-analysis-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [results]);

  const toggleRow = useCallback((domain: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) {
        next.delete(domain);
      } else {
        next.add(domain);
      }
      return next;
    });
  }, []);

  // Helper functions for extracting display values
  function getDaScore(result: BulkAnalysisResult): string {
    if (result.status === 'error' || !result.data) return '--';
    return result.data.seo?.domainAuthority?.score != null
      ? String(result.data.seo.domainAuthority.score)
      : '--';
  }

  function getDomainAge(result: BulkAnalysisResult): string {
    if (result.status === 'error' || !result.data) return '--';
    const created = result.data.whois?.createdDate;
    if (!created) return '--';
    const date = new Date(created);
    if (isNaN(date.getTime())) return '--';
    const years = Math.floor(
      (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    if (years < 1) {
      const months = Math.floor(
        (Date.now() - date.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
      );
      return `${months}mo`;
    }
    return `${years}y`;
  }

  function getSecurityLevel(result: BulkAnalysisResult): string {
    if (result.status === 'error' || !result.data) return '--';
    return result.data.security?.reputation?.level ?? '--';
  }

  function getSecurityBadgeColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'good':
      case 'safe':
        return 'bg-green-900/30 text-green-400 border-green-800';
      case 'moderate':
      case 'medium':
        return 'bg-yellow-900/30 text-yellow-400 border-yellow-800';
      case 'poor':
      case 'bad':
      case 'dangerous':
        return 'bg-red-900/30 text-red-400 border-red-800';
      default:
        return 'bg-gray-800 text-gray-400 border-gray-700';
    }
  }

  function getValueEstimate(result: BulkAnalysisResult): string {
    if (result.status === 'error' || !result.data) return '--';
    const est = result.data.statusReport?.estimatedCost;
    if (!est) return '--';
    const currency = est.currency === 'USD' ? '$' : est.currency;
    return `${currency}${est.min.toLocaleString()} - ${currency}${est.max.toLocaleString()}`;
  }

  // Auth loading state
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  // Auth required
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              Bulk Domain Analysis
            </h1>
            <p className="text-gray-400 mb-8">
              Sign in to analyze up to {MAX_DOMAINS} domains at once.
            </p>
            <Link
              href="/auth/signin"
              className="inline-block px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
            >
              Sign In to Continue
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const successCount = results.filter((r) => r.status === 'success').length;
  const errorCount = results.filter((r) => r.status === 'error').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black">
      <main className="container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Bulk Domain Analysis
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Analyze up to {MAX_DOMAINS} domains at once. Enter domains one per
            line or upload a CSV file.
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 md:p-8">
            {/* Textarea */}
            <label
              htmlFor="domains-input"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Domains (one per line)
            </label>
            <textarea
              id="domains-input"
              value={domainText}
              onChange={(e) => {
                setDomainText(e.target.value);
                setError(null);
              }}
              placeholder={
                'example.com\ngoogle.com\ngithub.com\n\nOr upload a CSV file below...'
              }
              rows={8}
              disabled={isAnalyzing}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm resize-y disabled:opacity-50"
            />

            {/* Domain count and controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-4">
                {/* CSV Upload */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAnalyzing}
                  className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed border border-gray-600"
                >
                  Upload CSV
                </button>
                <span className="text-sm text-gray-400">
                  {domainCount} domain{domainCount !== 1 ? 's' : ''}{' '}
                  {domainCount > MAX_DOMAINS && (
                    <span className="text-yellow-400">
                      (max {MAX_DOMAINS}, extras will be ignored)
                    </span>
                  )}
                </span>
              </div>

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || domainCount === 0}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze All'}
              </button>
            </div>

            {/* Error display */}
            {error && (
              <div className="mt-4 bg-red-900/20 border border-red-800 rounded-lg p-4">
                <p className="text-red-200 text-sm">
                  <strong>Error:</strong> {error}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {(isAnalyzing || results.length > 0) && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300">
                  {isAnalyzing ? 'Analyzing domains...' : 'Analysis complete'}
                </span>
                <span className="text-sm text-gray-400">
                  {isAnalyzing
                    ? `Processing ${progress.total} domains...`
                    : `${successCount} success, ${errorCount} error${errorCount !== 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    isAnalyzing
                      ? 'bg-blue-500 animate-pulse'
                      : errorCount > 0 && successCount === 0
                        ? 'bg-red-500'
                        : 'bg-green-500'
                  }`}
                  style={{
                    width: isAnalyzing
                      ? '100%'
                      : `${results.length > 0 ? 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Results Table */}
        {results.length > 0 && (
          <div className="max-w-6xl mx-auto">
            {/* Export button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleExportCsv}
                className="px-5 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium border border-gray-600"
              >
                Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700 bg-gray-800/80">
                      <th className="text-left px-4 py-3 text-gray-300 font-semibold w-8"></th>
                      <th className="text-left px-4 py-3 text-gray-300 font-semibold">
                        Domain
                      </th>
                      <th className="text-left px-4 py-3 text-gray-300 font-semibold">
                        Status
                      </th>
                      <th className="text-left px-4 py-3 text-gray-300 font-semibold">
                        DA Score
                      </th>
                      <th className="text-left px-4 py-3 text-gray-300 font-semibold">
                        Age
                      </th>
                      <th className="text-left px-4 py-3 text-gray-300 font-semibold">
                        Security
                      </th>
                      <th className="text-left px-4 py-3 text-gray-300 font-semibold">
                        Value Estimate
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => {
                      const isExpanded = expandedRows.has(result.domain);
                      const securityLevel = getSecurityLevel(result);

                      return (
                        <ResultRow
                          key={`${result.domain}-${index}`}
                          result={result}
                          isExpanded={isExpanded}
                          onToggle={() => toggleRow(result.domain)}
                          daScore={getDaScore(result)}
                          domainAge={getDomainAge(result)}
                          securityLevel={securityLevel}
                          securityBadgeColor={getSecurityBadgeColor(securityLevel)}
                          valueEstimate={getValueEstimate(result)}
                        />
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!isAnalyzing && results.length === 0 && (
          <div className="max-w-4xl mx-auto mt-8">
            <div className="bg-gray-800/30 border border-gray-700/50 rounded-2xl p-12 text-center">
              <div className="text-5xl mb-4">&#x1F4CA;</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Ready for Bulk Analysis
              </h3>
              <p className="text-gray-400 max-w-lg mx-auto">
                Enter domain names in the text area above or upload a CSV file
                with domains in the first column. You can analyze up to{' '}
                {MAX_DOMAINS} domains at once.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 py-8 border-t border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-400">
          <p>Find My Website - Bulk Domain Analysis Tool</p>
          <p className="mt-2 text-sm">
            <Link href="/" className="text-blue-400 hover:text-blue-300">
              Back to Home
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Individual result row with expandable details
 */
function ResultRow({
  result,
  isExpanded,
  onToggle,
  daScore,
  domainAge,
  securityLevel,
  securityBadgeColor,
  valueEstimate,
}: {
  result: BulkAnalysisResult;
  isExpanded: boolean;
  onToggle: () => void;
  daScore: string;
  domainAge: string;
  securityLevel: string;
  securityBadgeColor: string;
  valueEstimate: string;
}) {
  const isError = result.status === 'error';

  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-b border-gray-700/50 cursor-pointer transition-colors ${
          isError
            ? 'bg-red-900/10 hover:bg-red-900/20'
            : 'hover:bg-gray-700/30'
        }`}
      >
        {/* Expand icon */}
        <td className="px-4 py-3 text-gray-400">
          <span
            className={`inline-block transition-transform duration-200 ${
              isExpanded ? 'rotate-90' : ''
            }`}
          >
            &#9654;
          </span>
        </td>

        {/* Domain */}
        <td className="px-4 py-3">
          <span className="font-medium text-white">{result.domain}</span>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          {isError ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/30 text-red-400 border border-red-800">
              Error
            </span>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/30 text-green-400 border border-green-800">
              Success
            </span>
          )}
        </td>

        {/* DA Score */}
        <td className="px-4 py-3 text-gray-300">{daScore}</td>

        {/* Age */}
        <td className="px-4 py-3 text-gray-300">{domainAge}</td>

        {/* Security */}
        <td className="px-4 py-3">
          {securityLevel !== '--' ? (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${securityBadgeColor}`}
            >
              {securityLevel}
            </span>
          ) : (
            <span className="text-gray-500">--</span>
          )}
        </td>

        {/* Value Estimate */}
        <td className="px-4 py-3 text-gray-300">{valueEstimate}</td>
      </tr>

      {/* Expanded details */}
      {isExpanded && (
        <tr className="border-b border-gray-700/50">
          <td colSpan={7} className="px-4 py-0">
            <div className="py-4 pl-8 space-y-4">
              {isError ? (
                <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                  <p className="text-red-200 text-sm">
                    <strong>Error:</strong> {result.error}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* WHOIS Info */}
                  {result.data?.whois && (
                    <DetailCard title="WHOIS">
                      <DetailItem
                        label="Registrar"
                        value={result.data.whois.registrar}
                      />
                      <DetailItem
                        label="Created"
                        value={formatDate(result.data.whois.createdDate)}
                      />
                      <DetailItem
                        label="Expires"
                        value={formatDate(result.data.whois.expiryDate)}
                      />
                      {result.data.whois.nameservers && (
                        <DetailItem
                          label="Nameservers"
                          value={result.data.whois.nameservers.join(', ')}
                        />
                      )}
                    </DetailCard>
                  )}

                  {/* Website Info */}
                  {result.data?.website && (
                    <DetailCard title="Website">
                      <DetailItem
                        label="Online"
                        value={result.data.website.isOnline ? 'Yes' : 'No'}
                      />
                      <DetailItem
                        label="HTTP Status"
                        value={result.data.website.httpStatus}
                      />
                      <DetailItem
                        label="Response Time"
                        value={
                          result.data.website.responseTime
                            ? `${result.data.website.responseTime}ms`
                            : undefined
                        }
                      />
                      <DetailItem
                        label="SSL"
                        value={
                          result.data.website.ssl?.valid
                            ? 'Valid'
                            : result.data.website.ssl
                              ? 'Invalid'
                              : undefined
                        }
                      />
                    </DetailCard>
                  )}

                  {/* SEO Info */}
                  {result.data?.seo && (
                    <DetailCard title="SEO">
                      <DetailItem
                        label="Domain Authority"
                        value={result.data.seo.domainAuthority?.score}
                      />
                      <DetailItem
                        label="Backlinks"
                        value={
                          result.data.seo.backlinks?.total != null
                            ? result.data.seo.backlinks.total.toLocaleString()
                            : undefined
                        }
                      />
                      <DetailItem
                        label="SEO Health"
                        value={result.data.seo.seoHealth}
                      />
                    </DetailCard>
                  )}

                  {/* Security Info */}
                  {result.data?.security && (
                    <DetailCard title="Security">
                      <DetailItem
                        label="Reputation Score"
                        value={result.data.security.reputation?.score}
                      />
                      <DetailItem
                        label="Level"
                        value={result.data.security.reputation?.level}
                      />
                      <DetailItem
                        label="Summary"
                        value={result.data.security.summary}
                      />
                    </DetailCard>
                  )}

                  {/* Wayback Info */}
                  {result.data?.wayback && (
                    <DetailCard title="Wayback Machine">
                      <DetailItem
                        label="Total Captures"
                        value={
                          result.data.wayback.totalCaptures != null
                            ? result.data.wayback.totalCaptures.toLocaleString()
                            : undefined
                        }
                      />
                      <DetailItem
                        label="First Capture"
                        value={formatDate(result.data.wayback.firstCapture)}
                      />
                      <DetailItem
                        label="Last Capture"
                        value={formatDate(result.data.wayback.lastCapture)}
                      />
                    </DetailCard>
                  )}

                  {/* Status Report */}
                  {result.data?.statusReport && (
                    <DetailCard title="Domain Status">
                      <DetailItem
                        label="Status"
                        value={result.data.statusReport.status}
                      />
                      <DetailItem
                        label="Value Estimate"
                        value={valueEstimateString(result.data.statusReport.estimatedCost)}
                      />
                    </DetailCard>
                  )}
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/** Detail card for expanded row */
function DetailCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-blue-400 mb-3">{title}</h4>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

/** Individual detail item */
function DetailItem({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value == null || value === '') return null;
  return (
    <div className="flex justify-between text-xs">
      <span className="text-gray-400">{label}</span>
      <span className="text-gray-200 text-right max-w-[60%] break-words">
        {String(value)}
      </span>
    </div>
  );
}

/** Format an ISO date string for display */
function formatDate(dateStr?: string | null): string | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** Format value estimate for display in expanded view */
function valueEstimateString(
  est?: { min: number; max: number; currency: string } | null
): string | undefined {
  if (!est) return undefined;
  const sym = est.currency === 'USD' ? '$' : est.currency;
  return `${sym}${est.min.toLocaleString()} - ${sym}${est.max.toLocaleString()}`;
}
