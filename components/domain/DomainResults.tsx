'use client';

import { useState } from 'react';

interface DomainResultsProps {
  data: any;
}

export function DomainResults({ data }: DomainResultsProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'recovery' | 'history'>('overview');
  const [downloadingScript, setDownloadingScript] = useState(false);

  const { domain, statusReport, whois, wayback } = data;

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
            <span className={\`inline-block px-3 py-1 rounded-full text-sm font-medium \${getStatusColor(statusReport.status)}\`}>
              {statusReport.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-right">
            <div className={\`text-2xl font-bold \${getDifficultyColor(statusReport.recoveryDifficulty)}\`}>
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
          <nav className="flex -mb-px">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'recovery', label: 'Recovery Guide' },
              { id: 'history', label: 'Historical Data' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={\`flex-1 py-4 px-6 text-center border-b-2 font-medium transition-colors \${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }\`}
              >
                {tab.label}
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
