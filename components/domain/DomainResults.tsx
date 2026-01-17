'use client';

import { useState } from 'react';

interface DomainResultsProps {
  data: any;
}

export function DomainResults({ data }: DomainResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'dns' | 'website' | 'security' | 'seo' | 'recovery' | 'history'>('overview');
  const [downloadingScript, setDownloadingScript] = useState(false);

  const { domain, statusReport, whois, wayback, dns, website, security, seo } = data;

  const downloadScript = async (scriptType: 'bash' | 'nodejs' | 'python') => {
    setDownloadingScript(true);
    try {
      const response = await fetch('/api/recovery/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, scriptType }),
      });

      if (!response.ok) throw new Error('Failed to generate script');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recover-${domain.replace(/\\./g, '-')}.${scriptType === 'bash' ? 'sh' : scriptType === 'python' ? 'py' : 'js'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Script download failed:', error);
      alert('Failed to download script. Please try again.');
    } finally {
      setDownloadingScript(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      AVAILABLE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      EXPIRED_GRACE: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      EXPIRED_REDEMPTION: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
      PENDING_DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      ACTIVE_PARKED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      ACTIVE_FOR_SALE: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      ACTIVE_IN_USE: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      EASY: 'text-green-600 dark:text-green-400',
      MODERATE: 'text-yellow-600 dark:text-yellow-400',
      HARD: 'text-orange-600 dark:text-orange-400',
      VERY_HARD: 'text-red-600 dark:text-red-400',
      IMPOSSIBLE: 'text-gray-600 dark:text-gray-400',
    };
    return colors[difficulty] || 'text-gray-600';
  };

  return (
    <div className="mt-8 max-w-6xl mx-auto">
      {/* Domain Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {domain}
            </h2>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium \${getStatusColor(statusReport.status)}`}>
              {statusReport.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold \${getDifficultyColor(statusReport.recoveryDifficulty)}`}>
              {statusReport.recoveryDifficulty}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Recovery Difficulty</div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Cost</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              ${statusReport.estimatedCost.min.toLocaleString()} - ${statusReport.estimatedCost.max.toLocaleString()}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Time</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {statusReport.estimatedTimeWeeks} {statusReport.estimatedTimeWeeks === 1 ? 'week' : 'weeks'}
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Success Rate</div>
            <div className="text-xl font-semibold text-gray-900 dark:text-white">
              {statusReport.successRate}%
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'dns', label: 'DNS', icon: '🌐' },
              { id: 'website', label: 'Website', icon: '💻' },
              { id: 'security', label: 'Security', icon: '🔒' },
              { id: 'seo', label: 'SEO', icon: '📈' },
              { id: 'recovery', label: 'Recovery', icon: '🔧' },
              { id: 'history', label: 'History', icon: '📜' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-fit py-3 px-3 md:px-5 text-center border-b-3 font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1 \${
                  activeTab === tab.id
                    ? 'border-b-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700/30'
                }`}
              >
                <span className="text-xl">{tab.icon}</span>
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* WHOIS Data */}
              {whois && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    WHOIS Information
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {whois.registrar && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Registrar</div>
                        <div className="text-gray-900 dark:text-white">{whois.registrar}</div>
                      </div>
                    )}
                    {whois.createdDate && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Created Date</div>
                        <div className="text-gray-900 dark:text-white">
                          {new Date(whois.createdDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {whois.expiryDate && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Expiry Date</div>
                        <div className="text-gray-900 dark:text-white">
                          {new Date(whois.expiryDate).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {whois.nameservers && whois.nameservers.length > 0 && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">Nameservers</div>
                        <div className="text-gray-900 dark:text-white">
                          {whois.nameservers.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Wayback Data */}
              {wayback && wayback.available && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Wayback Machine Data
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Total Snapshots</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {wayback.totalSnapshots.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Quality</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                        {wayback.quality}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Estimated Pages</div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {wayback.estimatedPages}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'recovery' && (
            <div className="space-y-6">
              {/* Opportunities */}
              {statusReport.opportunities.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Recovery Opportunities
                  </h3>
                  <ul className="space-y-2">
                    {statusReport.opportunities.map((opportunity: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-500 mt-1">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{opportunity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {statusReport.warnings.length > 0 && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Important Warnings
                  </h3>
                  <ul className="space-y-2">
                    {statusReport.warnings.map((warning: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-yellow-500 mt-1">⚠</span>
                        <span className="text-gray-700 dark:text-gray-300">{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Download Recovery Scripts */}
              {wayback && wayback.available && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Download Recovery Script
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    Download a custom script to recover your website content from the Wayback Machine.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadScript('bash')}
                      disabled={downloadingScript}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                      Download Bash Script
                    </button>
                    <button
                      onClick={() => downloadScript('nodejs')}
                      disabled={downloadingScript}
                      className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                      Download Node.js Script
                    </button>
                    <button
                      onClick={() => downloadScript('python')}
                      disabled={downloadingScript}
                      className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                    >
                      Download Python Script
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'dns' && dns && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">DNS Records</h3>

              {/* IP Addresses */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">IP Addresses</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {dns.ipAddresses.ipv4.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">IPv4</div>
                      <ul className="space-y-1">
                        {dns.ipAddresses.ipv4.map((ip: string, i: number) => (
                          <li key={i} className="font-mono text-sm text-gray-900 dark:text-gray-100">{ip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {dns.ipAddresses.ipv6.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">IPv6</div>
                      <ul className="space-y-1">
                        {dns.ipAddresses.ipv6.map((ip: string, i: number) => (
                          <li key={i} className="font-mono text-sm text-gray-900 dark:text-gray-100 break-all">{ip}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Mail Servers */}
              {dns.mailServers.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Mail Servers (MX)</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                          <th className="pb-2">Priority</th>
                          <th className="pb-2">Hostname</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dns.mailServers.map((mx: any, i: number) => (
                          <tr key={i} className="border-t border-gray-200 dark:border-gray-600">
                            <td className="py-2 text-gray-900 dark:text-gray-100">{mx.priority}</td>
                            <td className="py-2 font-mono text-sm text-gray-900 dark:text-gray-100">{mx.hostname}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Email Security */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Email Security</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className={`p-4 rounded-lg ${dns.emailSecurity.hasSPF ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className="text-sm font-medium mb-1">SPF Record</div>
                    <div className={`text-lg font-bold ${dns.emailSecurity.hasSPF ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {dns.emailSecurity.hasSPF ? '✓ Configured' : '✗ Missing'}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${dns.emailSecurity.hasDMARC ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className="text-sm font-medium mb-1">DMARC Record</div>
                    <div className={`text-lg font-bold ${dns.emailSecurity.hasDMARC ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {dns.emailSecurity.hasDMARC ? '✓ Configured' : '✗ Missing'}
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <div className="text-sm font-medium mb-1">Email Score</div>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {dns.emailScore}/100
                    </div>
                  </div>
                </div>
              </div>

              {/* Nameservers */}
              {dns.nameservers.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Nameservers</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {dns.nameservers.map((ns: string, i: number) => (
                        <li key={i} className="font-mono text-sm text-gray-900 dark:text-gray-100">{ns}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* TXT Records */}
              {dns.records.TXT.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">TXT Records</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                    {dns.records.TXT.map((record: any, i: number) => (
                      <div key={i} className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 p-2 rounded">
                        {record.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'website' && website && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Website Analysis</h3>

              {/* Status */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${website.isOnline ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="text-sm font-medium mb-1">Status</div>
                  <div className={`text-lg font-bold ${website.isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {website.isOnline ? '✓ Online' : '✗ Offline'}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">HTTP Status</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{website.httpStatus || 'N/A'}</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Response Time</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{website.responseTime}ms</div>
                </div>
                <div className={`p-4 rounded-lg ${website.ssl.enabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="text-sm font-medium mb-1">SSL</div>
                  <div className={`text-lg font-bold ${website.ssl.enabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {website.ssl.enabled ? '✓ Enabled' : '✗ Disabled'}
                  </div>
                </div>
              </div>

              {/* Technology Stack */}
              {website.techStack.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Technology Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {website.techStack.map((tech: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Server & Hosting */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Server & Hosting</h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                  {website.server.software && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Server Software:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{website.server.software}</span>
                    </div>
                  )}
                  {website.server.language && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Language:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{website.server.language}</span>
                    </div>
                  )}
                  {website.hosting.provider && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Hosting Provider:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{website.hosting.provider}</span>
                    </div>
                  )}
                  {website.hosting.cdnProvider && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">CDN:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{website.hosting.cdnProvider}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Technologies */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Detected Technologies</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {website.technologies.cms && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">CMS</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{website.technologies.cms}</div>
                    </div>
                  )}
                  {website.technologies.framework && (
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Framework</div>
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{website.technologies.framework}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Security Score */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Security Headers</h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Security Score</span>
                      <span className="text-sm font-bold">{website.security.securityScore}/100</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${website.security.securityScore}%` }}></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">HSTS</span>
                      <span className={website.security.hasHSTS ? 'text-green-600' : 'text-red-600'}>
                        {website.security.hasHSTS ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Content Security Policy</span>
                      <span className={website.security.hasCSP ? 'text-green-600' : 'text-red-600'}>
                        {website.security.hasCSP ? '✓' : '✗'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">X-Frame-Options</span>
                      <span className={website.security.hasXFrameOptions ? 'text-green-600' : 'text-red-600'}>
                        {website.security.hasXFrameOptions ? '✓' : '✗'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && security && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Security Analysis</h3>

              {/* Trust Score */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Trust Score</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Overall domain reputation</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{security.reputation.trustScore}</div>
                    <div className="text-sm text-gray-500">out of 100</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all" style={{ width: `${security.reputation.trustScore}%` }}></div>
                </div>
                <div className={`mt-4 inline-block px-4 py-2 rounded-full text-sm font-medium ${
                  security.reputation.riskLevel === 'LOW' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                  security.reputation.riskLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  security.reputation.riskLevel === 'HIGH' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                  Risk Level: {security.reputation.riskLevel}
                </div>
              </div>

              {/* Domain Age */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Domain Age</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Age</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{security.domainAge.ageInYears} years</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Registered</div>
                    <div className="text-lg font-semibold text-gray-900 dark:text-white">
                      {security.domainAge.registeredDate ? new Date(security.domainAge.registeredDate).toLocaleDateString() : 'Unknown'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Maturity</div>
                    <div className={`text-lg font-semibold ${security.domainAge.isMatureDomain ? 'text-green-600' : security.domainAge.isNewDomain ? 'text-orange-600' : 'text-gray-600'}`}>
                      {security.domainAge.isMatureDomain ? 'Mature' : security.domainAge.isNewDomain ? 'New' : 'Established'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Summary */}
              {security.summary.warnings.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Security Warnings</h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <ul className="space-y-2">
                      {security.summary.warnings.map((warning: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-yellow-800 dark:text-yellow-300">
                          <span className="text-yellow-500 mt-1">⚠</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {security.summary.recommendations.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Recommendations</h4>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <ul className="space-y-2">
                      {security.summary.recommendations.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-blue-800 dark:text-blue-300">
                          <span className="text-blue-500 mt-1">💡</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Reputation Factors */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Reputation Factors</h4>
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <ul className="space-y-2">
                    {security.reputation.reasons.map((reason: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'seo' && seo && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">SEO & Traffic Analysis</h3>

              {/* Domain Authority */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">Domain Authority</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Estimated SEO strength</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">{seo.domainAuthority.score}</div>
                    <div className="text-sm text-gray-500">out of 100</div>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all" style={{ width: `${seo.domainAuthority.score}%` }}></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{seo.domainAuthority.calculation}</p>
              </div>

              {/* Traffic Estimates */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Traffic Estimates</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Visits</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      {seo.traffic.estimatedMonthlyVisits?.toLocaleString() || '0'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Trend</div>
                    <div className={`text-lg font-semibold ${
                      seo.traffic.trafficTrend === 'GROWING' ? 'text-green-600' :
                      seo.traffic.trafficTrend === 'DECLINING' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {seo.traffic.trafficTrend === 'GROWING' ? '📈 Growing' :
                       seo.traffic.trafficTrend === 'DECLINING' ? '📉 Declining' :
                       seo.traffic.trafficTrend === 'STABLE' ? '➡️ Stable' : '❓ Unknown'}
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Visibility</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{seo.keywords.visibility}%</div>
                  </div>
                </div>
              </div>

              {/* Backlinks */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Backlinks</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Estimated Total</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{seo.backlinks.estimatedTotal.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">From Archives</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{seo.backlinks.fromWayback.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Quality</div>
                    <div className={`text-lg font-semibold ${
                      seo.backlinks.quality === 'HIGH' ? 'text-green-600' :
                      seo.backlinks.quality === 'MEDIUM' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {seo.backlinks.quality}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Analysis */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Content</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Archived Pages</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{seo.content.archivedPages.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">SEO Health</div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{seo.seoHealth.score}/100</div>
                  </div>
                </div>
              </div>

              {/* Historical Events */}
              {seo.history.significantEvents.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">Historical Milestones</h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <ul className="space-y-2">
                      {seo.history.significantEvents.map((event: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                          <span className="text-purple-500 mt-1">📌</span>
                          <span>{event}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-6">
              {wayback && wayback.available ? (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    Snapshot Timeline
                  </h3>
                  <div className="space-y-3">
                    {wayback.firstSnapshot && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">First Snapshot</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {new Date(wayback.firstSnapshot).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    {wayback.lastSnapshot && (
                      <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                        <span className="text-gray-600 dark:text-gray-300">Last Snapshot</span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {new Date(wayback.lastSnapshot).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {wayback.yearlyBreakdown && wayback.yearlyBreakdown.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3 text-gray-900 dark:text-white">
                        Snapshots by Year
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {wayback.yearlyBreakdown.map((item: any) => (
                          <div key={item.year} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                              {item.count}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {item.year}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No historical data available for this domain.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
