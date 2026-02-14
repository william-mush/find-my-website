'use client';

import { useState } from 'react';
import { RecoveryGuide } from './RecoveryGuide';
import { TriageQuestionnaire } from './TriageQuestionnaire';
import { HelpTooltip } from '@/components/ui/HelpTooltip';
import { GLOSSARY } from '@/lib/content/glossary';
import type { RecoveryContext } from '@/lib/recovery/recovery-guide';

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DomainAnalysisData {
  domain: string;
  statusReport: any;
  whois: any;
  wayback: any;
  dns: any;
  website: any;
  security: any;
  seo: any;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface DomainResultsProps {
  data: DomainAnalysisData;
}

export function DomainResults({ data }: DomainResultsProps) {
  const [activeTab, setActiveTab] = useState<'recovery' | 'overview' | 'dns' | 'website' | 'security' | 'seo' | 'history'>('recovery');
  const [downloadingScript, setDownloadingScript] = useState(false);
  const [recoveryContext, setRecoveryContext] = useState<RecoveryContext>({});

  const { domain, statusReport: rawStatusReport, whois, wayback, dns, website, security, seo } = data;

  // Fallback for when status analysis times out or fails
  const statusReport = rawStatusReport || {
    status: 'UNKNOWN',
    recoveryDifficulty: 'UNKNOWN',
    estimatedCost: { min: 0, max: 0, currency: 'USD' },
    estimatedTimeWeeks: 0,
    successRate: 0,
    opportunities: [],
    warnings: ['Status analysis was unavailable. Try searching again for complete results.'],
    reasons: [],
  };

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
      a.download = `recover-${domain.replace(/\./g, '-')}.${scriptType === 'bash' ? 'sh' : scriptType === 'python' ? 'py' : 'js'}`;
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

  /** Helper to get a plain-English trust score description */
  const getTrustDescription = (score: number) => {
    if (score >= 80) return 'This domain has an excellent reputation. It has been around for a long time and shows no signs of suspicious activity.';
    if (score >= 60) return 'This domain has a good reputation. Nothing concerning was found, though it may be relatively new or have limited history.';
    if (score >= 40) return 'This domain has a fair reputation. Some factors may warrant caution, such as limited history or missing security features.';
    if (score >= 20) return 'This domain has a poor reputation. Several warning signs were detected. Exercise caution before interacting with it.';
    return 'This domain has a very poor reputation. Multiple red flags were detected. Avoid sharing personal information on this site.';
  };

  return (
    <div className="mt-8 max-w-6xl mx-auto">
      {/* Partial results warning */}
      {!rawStatusReport && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            <strong>Partial Results:</strong> Some analysis data was unavailable. The information below may be incomplete. Try searching again for full results.
          </p>
        </div>
      )}

      {/* Domain Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {domain}
            </h2>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(statusReport.status)}`}>
              {statusReport.status.replace(/_/g, ' ')}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${getDifficultyColor(statusReport.recoveryDifficulty)}`}>
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

      {/* Triage Questionnaire -- shown for all statuses except AVAILABLE and RESERVED */}
      {statusReport.status !== 'AVAILABLE' && statusReport.status !== 'RESERVED' && (
        <TriageQuestionnaire onContextChange={setRecoveryContext} />
      )}

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto">
            {[
              { id: 'recovery', label: 'Recovery Guide', icon: '🔧' },
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'dns', label: 'DNS', icon: '🌐' },
              { id: 'website', label: 'Website', icon: '💻' },
              { id: 'security', label: 'Security', icon: '🔒' },
              { id: 'seo', label: 'SEO', icon: '📈' },
              { id: 'history', label: 'History', icon: '📜' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 min-w-fit py-3 px-3 md:px-5 text-center border-b-3 font-semibold transition-all duration-200 flex flex-col items-center justify-center gap-1 ${
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
          {/* Recovery Guide Tab */}
          {activeTab === 'recovery' && (
            <RecoveryGuide
              domain={domain}
              statusReport={statusReport}
              whois={whois}
              wayback={wayback}
              dns={dns}
              recoveryContext={recoveryContext}
              onDownloadScript={downloadScript}
              downloadingScript={downloadingScript}
            />
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Plain English Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-200">
                {whois ? (
                  <p>
                    Here is what we found about who owns <strong>{domain}</strong>.
                    {whois.registrar && <> It is registered through <strong>{whois.registrar}</strong>.</>}
                    {whois.expiryDate && <> The registration {new Date(whois.expiryDate) > new Date() ? 'expires' : 'expired'} on <strong>{new Date(whois.expiryDate).toLocaleDateString()}</strong>.</>}
                    {whois.privacy && <> The owner&apos;s personal details are hidden behind a privacy service.</>}
                  </p>
                ) : (
                  <p>We couldn&apos;t find ownership records for <strong>{domain}</strong>. This may mean the domain is not currently registered, or the WHOIS data is unavailable.</p>
                )}
              </div>

              {/* WHOIS Data */}
              {whois && (
                <div>
                  <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                    <HelpTooltip term="WHOIS" explanation={GLOSSARY.whois.detailed}>
                      WHOIS Information
                    </HelpTooltip>
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {whois.registrar && (
                      <div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <HelpTooltip term="Registrar" explanation={GLOSSARY.registrar.short}>
                            Registrar
                          </HelpTooltip>
                        </div>
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
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <HelpTooltip term="Nameservers" explanation={GLOSSARY.nameserver.short}>
                            Nameservers
                          </HelpTooltip>
                        </div>
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
                  <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                    Wayback Machine Data
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    The Wayback Machine has saved <strong>{wayback.totalSnapshots?.toLocaleString()}</strong> copies of this website over time. These archived snapshots can help you recover lost content.
                  </p>
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

          {/* DNS Tab */}
          {activeTab === 'dns' && dns && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                <HelpTooltip term="DNS" explanation={GLOSSARY.dns.short}>
                  DNS Records
                </HelpTooltip>
              </h3>

              {/* Plain English DNS Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-200">
                <p>
                  {dns.ipAddresses?.ipv4?.length > 0 && <>Your domain points to server{dns.ipAddresses.ipv4.length > 1 ? 's' : ''} at <strong>{dns.ipAddresses.ipv4.join(', ')}</strong>. </>}
                  {dns.mailServers?.length > 0 && <>Email for this domain is handled by <strong>{dns.mailServers[0]?.hostname}</strong>. </>}
                  {dns.emailSecurity?.hasSPF && dns.emailSecurity?.hasDMARC
                    ? 'Email security is properly configured.'
                    : 'Email security could be improved.'}
                </p>
              </div>

              {/* IP Addresses */}
              <div>
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  <HelpTooltip term="IP Address" explanation={GLOSSARY.ipAddress.short}>
                    IP Addresses
                  </HelpTooltip>
                </h4>
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
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <HelpTooltip term="MX Record" explanation={GLOSSARY.mxRecord.short}>
                      Mail Servers (MX)
                    </HelpTooltip>
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-sm text-gray-500 dark:text-gray-400">
                          <th className="pb-2">Priority</th>
                          <th className="pb-2">Hostname</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dns.mailServers.map((mx: { priority: number; hostname: string }, i: number) => (
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
                    <div className="text-sm font-medium mb-1">
                      <HelpTooltip term="SPF" explanation={GLOSSARY.spf.short}>
                        SPF Record
                      </HelpTooltip>
                    </div>
                    <div className={`text-lg font-bold ${dns.emailSecurity.hasSPF ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {dns.emailSecurity.hasSPF ? '✓ Configured' : '✗ Missing'}
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg ${dns.emailSecurity.hasDMARC ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                    <div className="text-sm font-medium mb-1">
                      <HelpTooltip term="DMARC" explanation={GLOSSARY.dmarc.short}>
                        DMARC Record
                      </HelpTooltip>
                    </div>
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
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <HelpTooltip term="Nameserver" explanation={GLOSSARY.nameserver.short}>
                      Nameservers
                    </HelpTooltip>
                  </h4>
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
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    <HelpTooltip term="TXT Record" explanation={GLOSSARY.txtRecord.short}>
                      TXT Records
                    </HelpTooltip>
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-2">
                    {dns.records.TXT.map((record: { value: string }, i: number) => (
                      <div key={i} className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all bg-white dark:bg-gray-800 p-2 rounded">
                        {record.value}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Website Tab */}
          {activeTab === 'website' && website && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Website Analysis</h3>

              {/* Plain English Website Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-200">
                <p>
                  {website.isOnline
                    ? <>This website is <strong>currently online</strong> and responded in {website.responseTime}ms. </>
                    : <>This website is <strong>currently offline</strong> or unreachable. </>}
                  {website.ssl?.enabled
                    ? 'It has a valid security certificate (SSL), so connections are encrypted. '
                    : 'It does not have a security certificate (SSL), which means connections are not encrypted. '}
                  {website.hosting?.provider && <>It appears to be hosted by <strong>{website.hosting.provider}</strong>. </>}
                  {website.technologies?.cms && <>The site runs on <strong>{website.technologies.cms}</strong>, which is useful to know if you need to rebuild it.</>}
                </p>
              </div>

              {/* Status */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg ${website.isOnline ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="text-sm font-medium mb-1">Status</div>
                  <div className={`text-lg font-bold ${website.isOnline ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {website.isOnline ? '✓ Online' : '✗ Offline'}
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    <HelpTooltip term="HTTP Status" explanation={GLOSSARY.httpStatus.short}>
                      HTTP Status
                    </HelpTooltip>
                  </div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{website.httpStatus || 'N/A'}</div>
                </div>
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Response Time</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{website.responseTime}ms</div>
                </div>
                <div className={`p-4 rounded-lg ${website.ssl.enabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <div className="text-sm font-medium mb-1">
                    <HelpTooltip term="SSL" explanation={GLOSSARY.ssl.short}>
                      SSL
                    </HelpTooltip>
                  </div>
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
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                  <HelpTooltip term="Hosting" explanation={GLOSSARY.hosting.short}>
                    Server &amp; Hosting
                  </HelpTooltip>
                </h4>
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
                      <span className="text-gray-500 dark:text-gray-400">
                        <HelpTooltip term="CDN" explanation={GLOSSARY.cdn.short}>
                          CDN
                        </HelpTooltip>:
                      </span>
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

          {/* Security Tab */}
          {activeTab === 'security' && security && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Security Analysis</h3>

              {/* Plain English Security Summary */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-sm text-blue-900 dark:text-blue-200">
                <p>{getTrustDescription(security.reputation.trustScore)}</p>
              </div>

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
                        {wayback.yearlyBreakdown.map((item: { year: number; count: number }) => (
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
