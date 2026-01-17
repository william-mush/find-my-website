/**
 * Network Analyzer Tool
 * Find all domains on the same IP and analyze network infrastructure
 */

'use client';

import { useState } from 'react';

interface Technology {
  name: string;
  category: string;
  version?: string;
  confidence: 'high' | 'medium' | 'low';
  indicators: string[];
}

interface TechStack {
  domain: string;
  technologies: Technology[];
  server: { software: string; version?: string; language?: string } | null;
  cms: string | null;
  frameworks: string[];
  analytics: string[];
  cdn: string | null;
  hostingPlatform: string | null;
  detectedAt: string;
}

interface NetworkResult {
  input: string;
  inputType: 'ip' | 'domain';
  primaryIP: string;
  reverseIP: {
    ip: string;
    domains: { domain: string }[];
    totalDomains: number;
  };
  networkInfo: {
    asn: {
      asn: number;
      asnOrganization: string;
      asnCountry: string;
      networkType: string;
      isDatacenter: boolean;
      hostingProvider?: string;
    } | null;
    geolocation: {
      city?: string;
      country: string;
      countryCode: string;
      latitude?: number;
      longitude?: number;
    } | null;
  };
  infrastructure: {
    hostingProvider: string;
    networkType: string;
    isDatacenter: boolean;
    location: string;
    asn: string;
  };
  analysis: {
    sharedHosting: boolean;
    estimatedDomainCount: number;
    hostingEnvironment: string;
    securityRisk: string;
    recommendations: string[];
  };
  techStacks?: TechStack[];
  techSummary?: {
    totalAnalyzed: number;
    cms: { name: string; count: number }[];
    frameworks: { name: string; count: number }[];
    servers: { name: string; count: number }[];
    hostingPlatforms: { name: string; count: number }[];
    programmingLanguages: { name: string; count: number }[];
  };
  meta?: {
    tier: string;
    limits: {
      domainsShown: number;
      totalDomainsFound: number;
      upgradeRequired: boolean;
    };
  };
}

export default function NetworkAnalyzerPage() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<NetworkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      setError('Please enter a domain or IP address');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/network/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: input.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Analysis failed');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌐 Network Analyzer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover all domains on the same IP address and analyze hosting infrastructure
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <form onSubmit={handleAnalyze}>
            <div className="flex gap-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter domain (example.com) or IP (8.8.8.8)"
                className="flex-1 px-6 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Network Overview</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="text-sm text-purple-600 font-medium mb-1">Primary IP</div>
                  <div className="text-xl font-bold text-gray-900">{result.primaryIP}</div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="text-sm text-blue-600 font-medium mb-1">Domains Found</div>
                  <div className="text-xl font-bold text-gray-900">
                    {result.reverseIP.totalDomains}
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-4">
                  <div className="text-sm text-green-600 font-medium mb-1">Hosting Provider</div>
                  <div className="text-xl font-bold text-gray-900 truncate" title={result.infrastructure.hostingProvider}>
                    {result.infrastructure.hostingProvider}
                  </div>
                </div>

                <div className="bg-orange-50 rounded-xl p-4">
                  <div className="text-sm text-orange-600 font-medium mb-1">Environment</div>
                  <div className="text-xl font-bold text-gray-900">
                    {result.analysis.hostingEnvironment}
                  </div>
                </div>
              </div>
            </div>

            {/* Domains List */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Domains on Same IP
                </h2>
                {result.meta?.limits.upgradeRequired && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
                    <p className="text-sm text-yellow-800">
                      Showing {result.meta.limits.domainsShown} of {result.meta.limits.totalDomainsFound} domains.
                      <span className="font-semibold"> Upgrade to see all!</span>
                    </p>
                  </div>
                )}
              </div>

              {result.reverseIP.domains.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {result.reverseIP.domains.map((item, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                    >
                      <a
                        href={`https://${item.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-800 font-medium break-all"
                      >
                        {item.domain}
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Only one domain found on this IP</p>
              )}
            </div>

            {/* Infrastructure Details */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Infrastructure Details</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ASN Info */}
                {result.networkInfo.asn && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">ASN Information</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">ASN:</span>
                        <span className="ml-2 font-medium">AS{result.networkInfo.asn.asn}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Organization:</span>
                        <span className="ml-2 font-medium">{result.networkInfo.asn.asnOrganization}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Country:</span>
                        <span className="ml-2 font-medium">{result.networkInfo.asn.asnCountry}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Network Type:</span>
                        <span className="ml-2 font-medium">{result.networkInfo.asn.networkType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Datacenter:</span>
                        <span className="ml-2 font-medium">
                          {result.networkInfo.asn.isDatacenter ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Geolocation */}
                {result.networkInfo.geolocation && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">Location</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Country:</span>
                        <span className="ml-2 font-medium">
                          {result.networkInfo.geolocation.country} ({result.networkInfo.geolocation.countryCode})
                        </span>
                      </div>
                      {result.networkInfo.geolocation.city && (
                        <div>
                          <span className="text-gray-600">City:</span>
                          <span className="ml-2 font-medium">{result.networkInfo.geolocation.city}</span>
                        </div>
                      )}
                      {result.networkInfo.geolocation.latitude && result.networkInfo.geolocation.longitude && (
                        <div>
                          <span className="text-gray-600">Coordinates:</span>
                          <span className="ml-2 font-medium">
                            {result.networkInfo.geolocation.latitude.toFixed(4)}, {result.networkInfo.geolocation.longitude.toFixed(4)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Analysis & Recommendations */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analysis & Recommendations</h2>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Shared Hosting:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.analysis.sharedHosting ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {result.analysis.sharedHosting ? 'Yes' : 'No'}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-gray-600">Security Risk:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    result.analysis.securityRisk === 'High' ? 'bg-red-100 text-red-800' :
                    result.analysis.securityRisk === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {result.analysis.securityRisk}
                  </span>
                </div>

                {result.analysis.recommendations.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Recommendations:</h3>
                    <ul className="space-y-2">
                      {result.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-purple-600">•</span>
                          <span className="text-gray-700">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Technology Stack Summary */}
            {result.techSummary && result.techSummary.totalAnalyzed > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Technology Stack Summary
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    (Analyzed {result.techSummary.totalAnalyzed} domain{result.techSummary.totalAnalyzed > 1 ? 's' : ''})
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* CMS */}
                  {result.techSummary.cms.length > 0 && (
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h3 className="font-semibold text-purple-900 mb-3">Content Management Systems</h3>
                      <ul className="space-y-2">
                        {result.techSummary.cms.map((item, index) => (
                          <li key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                              {item.count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Frameworks */}
                  {result.techSummary.frameworks.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-900 mb-3">JavaScript Frameworks</h3>
                      <ul className="space-y-2">
                        {result.techSummary.frameworks.map((item, index) => (
                          <li key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {item.count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Web Servers */}
                  {result.techSummary.servers.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-4">
                      <h3 className="font-semibold text-green-900 mb-3">Web Servers</h3>
                      <ul className="space-y-2">
                        {result.techSummary.servers.map((item, index) => (
                          <li key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs font-medium">
                              {item.count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Hosting Platforms */}
                  {result.techSummary.hostingPlatforms.length > 0 && (
                    <div className="bg-orange-50 rounded-xl p-4">
                      <h3 className="font-semibold text-orange-900 mb-3">Hosting Platforms</h3>
                      <ul className="space-y-2">
                        {result.techSummary.hostingPlatforms.map((item, index) => (
                          <li key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="bg-orange-200 text-orange-800 px-2 py-1 rounded text-xs font-medium">
                              {item.count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Programming Languages */}
                  {result.techSummary.programmingLanguages.length > 0 && (
                    <div className="bg-pink-50 rounded-xl p-4">
                      <h3 className="font-semibold text-pink-900 mb-3">Programming Languages</h3>
                      <ul className="space-y-2">
                        {result.techSummary.programmingLanguages.map((item, index) => (
                          <li key={index} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{item.name}</span>
                            <span className="bg-pink-200 text-pink-800 px-2 py-1 rounded text-xs font-medium">
                              {item.count}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Individual domain tech stacks */}
                {result.techStacks && result.techStacks.length > 0 && (
                  <div className="mt-8">
                    <h3 className="font-semibold text-gray-900 mb-4">Individual Domain Analysis</h3>
                    <div className="space-y-4">
                      {result.techStacks.map((stack, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <a
                              href={`https://${stack.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-purple-600 hover:text-purple-800"
                            >
                              {stack.domain}
                            </a>
                            <span className="text-xs text-gray-500">
                              {stack.technologies.length} technologies detected
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {stack.server && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                                {stack.server.software}{stack.server.version && ` ${stack.server.version}`}
                              </span>
                            )}
                            {stack.cms && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                                {stack.cms}
                              </span>
                            )}
                            {stack.frameworks.map((fw, i) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                {fw}
                              </span>
                            ))}
                            {stack.cdn && (
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                                CDN: {stack.cdn}
                              </span>
                            )}
                            {stack.hostingPlatform && (
                              <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                                {stack.hostingPlatform}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && !error && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Analyze
            </h3>
            <p className="text-gray-600">
              Enter a domain name or IP address above to discover its network infrastructure
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
