'use client';

import { useState, useMemo } from 'react';
import { DomainLifecycleTimeline, statusToPhase } from './DomainLifecycleTimeline';
import { generateRecoveryGuide, type RecoveryContext } from '@/lib/recovery/recovery-guide';
import {
  getRegistrarRecoveryEmail,
  getDomainPurchaseOfferEmail,
  getRegistrarTransferEmail,
  getTrademarkDisputeEmail,
  getCeaseAndDesistEmail,
  getHijackingReportEmail,
  getTransferDisputeEmail,
} from '@/lib/content/email-templates';
import {
  getServicesForStatus,
  PROOF_OF_OWNERSHIP_ITEMS,
  type ServiceRecommendation,
} from '@/lib/content/service-recommendations';
import { findRegistrar } from '@/lib/recovery/registrar-directory';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

/** Shape returned by the (not-yet-created) findRegistrar helper. */
interface RegistrarInfo {
  name: string;
  phone?: string;
  email?: string;
  supportUrl?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface RecoveryGuideData {
  headline: string;
  summary: string;
  headlineColor: string;
  timelinePhase: string;
  steps: RecoveryStep[];
  alternativeOptions: AlternativeOption[];
  proofOfOwnership: boolean;
  showScriptDownloads: boolean;
  isEmergencyMode?: boolean;
}

interface RecoveryStep {
  title: string;
  description: string;
  details?: string[];
  emailTemplateKey?: string;
  phoneScript?: string;
  links?: { label: string; url: string }[];
  urgency?: string;
}

interface AlternativeOption {
  title: string;
  description: string;
}

interface RecoveryGuideProps {
  domain: string;
  statusReport: {
    status: string;
    recoveryDifficulty: string;
    estimatedCost: { min: number; max: number; currency: string };
    estimatedTimeWeeks: number;
    successRate: number;
    opportunities: string[];
    warnings: string[];
    reasons: string[];
    registrar?: string;
    registrarContact?: { email?: string; phone?: string };
    expiryDate?: Date | string;
    daysSinceExpiry?: number;
    daysUntilExpiry?: number;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  whois: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wayback: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dns: any;
  recoveryContext?: RecoveryContext;
  onDownloadScript?: (type: 'bash' | 'nodejs' | 'python') => void;
  downloadingScript?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(min: number, max: number, currency: string): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
  if (min === max) return fmt(min);
  return `${fmt(min)} - ${fmt(max)}`;
}

function urgencyBadge(urgency: string) {
  switch (urgency) {
    case 'immediate':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
          Immediate
        </span>
      );
    case 'soon':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300">
          Soon
        </span>
      );
    case 'when-ready':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
          When Ready
        </span>
      );
    default:
      return null;
  }
}

function headlineColorToClasses(color: string): string {
  const map: Record<string, string> = {
    green:
      'bg-green-600 dark:bg-green-700 text-white',
    yellow:
      'bg-yellow-500 dark:bg-yellow-600 text-white',
    orange:
      'bg-orange-600 dark:bg-orange-700 text-white',
    red:
      'bg-red-600 dark:bg-red-700 text-white',
    blue:
      'bg-blue-600 dark:bg-blue-700 text-white',
    gray:
      'bg-gray-600 dark:bg-gray-700 text-white',
    purple:
      'bg-purple-600 dark:bg-purple-700 text-white',
  };
  return map[color] ?? map.blue;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md
        bg-gray-100 hover:bg-gray-200 text-gray-700
        dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300
        transition-colors duration-150 cursor-pointer"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy to Clipboard
        </>
      )}
    </button>
  );
}

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left
          bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750
          transition-colors duration-150 cursor-pointer"
      >
        <span className="font-semibold text-gray-900 dark:text-white text-sm">
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          open ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function RecoveryGuide({
  domain,
  statusReport,
  whois,
  wayback,
  dns,
  recoveryContext,
  onDownloadScript,
  downloadingScript,
}: RecoveryGuideProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [checkedOwnershipItems, setCheckedOwnershipItems] = useState<Set<number>>(new Set());

  /* Build the recovery guide from the library helper */
  const guide = useMemo((): RecoveryGuideData | null => {
    try {
      return generateRecoveryGuide({
        domain,
        statusReport,
        whois,
        wayback,
        dns,
        context: recoveryContext,
      }) as RecoveryGuideData;
    } catch {
      // If the guide generator is unavailable, return a minimal fallback
      return null;
    }
  }, [domain, statusReport, whois, wayback, dns, recoveryContext]);

  /* Registrar info enrichment */
  const registrarInfo = useMemo((): RegistrarInfo | null => {
    try {
      if (statusReport.registrar) {
        return findRegistrar(statusReport.registrar) as RegistrarInfo | null;
      }
    } catch {
      // registrar-directory not yet available
    }
    return null;
  }, [statusReport.registrar]);

  /* Recommended services */
  const services = useMemo((): ServiceRecommendation[] => {
    try {
      return getServicesForStatus(statusReport.status);
    } catch {
      return [];
    }
  }, [statusReport.status]);

  /* Proof of ownership items */
  const ownershipItems = useMemo(() => {
    try {
      return PROOF_OF_OWNERSHIP_ITEMS ?? [];
    } catch {
      return [];
    }
  }, []);

  /* Email template resolver */
  function resolveEmailTemplate(templateKey: string): string | null {
    try {
      switch (templateKey) {
        case 'registrar':
        case 'redemption-request':
          return getRegistrarRecoveryEmail(
            domain,
            statusReport.registrar ?? 'your registrar',
          );
        case 'owner-outreach':
        case 'purchase-offer':
          return getDomainPurchaseOfferEmail(domain);
        case 'transfer':
          return getRegistrarTransferEmail(
            domain,
            statusReport.registrar ?? 'current registrar',
            'your new registrar',
          );
        case 'trademark-dispute':
          return getTrademarkDisputeEmail(domain);
        case 'cease-and-desist':
          return getCeaseAndDesistEmail(domain);
        case 'hijacking-report':
          return getHijackingReportEmail(
            domain,
            statusReport.registrar,
          );
        case 'transfer-dispute':
          return getTransferDisputeEmail(domain);
        default:
          return null;
      }
    } catch {
      return null;
    }
  }

  /* Helpers */
  const toggleStep = (index: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleOwnershipItem = (index: number) => {
    setCheckedOwnershipItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  /* Computed values */
  const timelinePhase = guide?.timelinePhase ?? statusToPhase(statusReport.status);

  const daysInfoText = (() => {
    if (statusReport.daysSinceExpiry != null && statusReport.daysSinceExpiry > 0) {
      return `${statusReport.daysSinceExpiry} days since expiry`;
    }
    if (statusReport.daysUntilExpiry != null && statusReport.daysUntilExpiry > 0) {
      return `${statusReport.daysUntilExpiry} days until expiry`;
    }
    return undefined;
  })();

  const headline = guide?.headline ?? `Recovery Guide for ${domain}`;
  const summary = guide?.summary ?? statusReport.reasons.join('. ');
  const headlineColor = guide?.headlineColor ?? 'blue';
  const steps = guide?.steps ?? [];
  const alternativeOptions = guide?.alternativeOptions ?? [];
  const showProofOfOwnership = guide?.proofOfOwnership ?? false;
  const showScriptDownloads = guide?.showScriptDownloads ?? !!(wayback && wayback.available);
  const isEmergencyMode = guide?.isEmergencyMode ?? false;

  /* ----- Render ---- */
  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------- */}
      {/* A. Headline Banner                                          */}
      {/* ---------------------------------------------------------- */}
      <div
        className={`rounded-xl px-6 py-5 ${headlineColorToClasses(headlineColor)}`}
      >
        <h2 className="text-2xl md:text-3xl font-bold leading-tight">
          {headline}
        </h2>
        {summary && (
          <p className="mt-2 text-sm md:text-base opacity-90 leading-relaxed max-w-3xl">
            {summary}
          </p>
        )}
      </div>

      {/* Emergency Mode Banner */}
      {isEmergencyMode && (
        <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">&#9888;</span>
            <h3 className="text-lg font-bold text-red-800 dark:text-red-200">
              Emergency Mode Active
            </h3>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300">
            Showing only the most urgent steps. Follow them in order for the fastest path to recovery.
            {(statusReport.registrarContact?.phone || registrarInfo?.phone) && (
              <>
                {' '}Call your registrar immediately:{' '}
                <a
                  href={`tel:${statusReport.registrarContact?.phone ?? registrarInfo?.phone}`}
                  className="font-bold underline"
                >
                  {statusReport.registrarContact?.phone ?? registrarInfo?.phone}
                </a>
              </>
            )}
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* B. Domain Lifecycle Timeline                                 */}
      {/* ---------------------------------------------------------- */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Domain Lifecycle
        </h3>
        <DomainLifecycleTimeline
          currentPhase={timelinePhase}
          daysInfo={daysInfoText}
        />
      </div>

      {/* ---------------------------------------------------------- */}
      {/* C. Quick Stats Bar                                           */}
      {/* ---------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Estimated Cost */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Estimated Cost
          </div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(
              statusReport.estimatedCost.min,
              statusReport.estimatedCost.max,
              statusReport.estimatedCost.currency,
            )}
          </div>
        </div>

        {/* Estimated Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Estimated Time
          </div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {statusReport.estimatedTimeWeeks === 0
              ? 'Immediately'
              : `${statusReport.estimatedTimeWeeks} ${statusReport.estimatedTimeWeeks === 1 ? 'week' : 'weeks'}`}
          </div>
        </div>

        {/* Likelihood of Success */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Likelihood of Success
          </div>
          <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
            {statusReport.successRate}%
          </div>
          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${
                statusReport.successRate >= 70
                  ? 'bg-green-500'
                  : statusReport.successRate >= 40
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              }`}
              style={{ width: `${statusReport.successRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* D. Step-by-Step Recovery Plan                                */}
      {/* ---------------------------------------------------------- */}
      {steps.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-5">
            Your Recovery Plan
          </h3>
          <div className="space-y-4">
            {steps.map((step: RecoveryStep, index: number) => {
              const isExpanded = expandedSteps.has(index);
              const emailContent = step.emailTemplateKey
                ? resolveEmailTemplate(step.emailTemplateKey)
                : null;

              return (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                >
                  {/* Step header */}
                  <button
                    type="button"
                    onClick={() => toggleStep(index)}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left
                      hover:bg-gray-50 dark:hover:bg-gray-750
                      transition-colors duration-150 cursor-pointer"
                  >
                    {/* Step number circle */}
                    <span
                      className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center
                        text-sm font-bold text-white bg-blue-600 dark:bg-blue-500"
                    >
                      {index + 1}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
                          {step.title}
                        </span>
                        {step.urgency && urgencyBadge(step.urgency)}
                      </div>
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {step.description}
                      </p>
                    </div>

                    <svg
                      className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Expanded content */}
                  <div
                    className={`transition-all duration-200 ease-in-out overflow-hidden ${
                      isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-4 pb-4 pt-1 space-y-3 border-t border-gray-100 dark:border-gray-700">
                      {/* Detail bullets */}
                      {step.details && step.details.length > 0 && (
                        <ul className="space-y-1.5 ml-1">
                          {step.details.map((detail, di) => (
                            <li
                              key={di}
                              className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                            >
                              <span className="text-blue-500 mt-0.5 shrink-0">&#8226;</span>
                              <span>{detail}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Phone script */}
                      {step.phoneScript && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                          <div className="text-xs font-semibold text-yellow-800 dark:text-yellow-300 mb-1 uppercase tracking-wide">
                            Phone Script
                          </div>
                          <p className="text-sm text-yellow-900 dark:text-yellow-200 whitespace-pre-line leading-relaxed">
                            {step.phoneScript}
                          </p>
                          <div className="mt-2">
                            <CopyButton text={step.phoneScript} />
                          </div>
                        </div>
                      )}

                      {/* Email template */}
                      {emailContent && (
                        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                              Email Template
                            </span>
                            <CopyButton text={emailContent} />
                          </div>
                          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                            {emailContent}
                          </pre>
                        </div>
                      )}

                      {/* Action links */}
                      {step.links && step.links.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {step.links.map((link, li) => (
                            <a
                              key={li}
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium
                                rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200
                                dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-900/60
                                transition-colors duration-150"
                            >
                              {link.label}
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* E. Alternative Options                                       */}
      {/* ---------------------------------------------------------- */}
      {alternativeOptions.length > 0 && (
        <CollapsibleSection title="Other Options to Consider">
          <ul className="space-y-2">
            {alternativeOptions.map((option: AlternativeOption, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-purple-500 dark:text-purple-400 mt-0.5 shrink-0">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div>
                  <span className="font-medium text-sm text-gray-900 dark:text-white">
                    {option.title}
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {option.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {/* ---------------------------------------------------------- */}
      {/* F. Registrar Contact Info                                    */}
      {/* ---------------------------------------------------------- */}
      {(statusReport.registrar || registrarInfo) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Registrar Contact Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Registrar name */}
            <div>
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                Registrar
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {statusReport.registrar ?? registrarInfo?.name ?? 'Unknown'}
              </div>
            </div>

            {/* Phone */}
            {(statusReport.registrarContact?.phone || registrarInfo?.phone) && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                  Phone
                </div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {statusReport.registrarContact?.phone ?? registrarInfo?.phone}
                </div>
              </div>
            )}

            {/* Email */}
            {(statusReport.registrarContact?.email || registrarInfo?.email) && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                  Email
                </div>
                <div className="text-sm text-gray-900 dark:text-white break-all">
                  {statusReport.registrarContact?.email ?? registrarInfo?.email}
                </div>
              </div>
            )}

            {/* Support URL */}
            {registrarInfo?.supportUrl && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-0.5">
                  Support Page
                </div>
                <a
                  href={registrarInfo.supportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {registrarInfo.supportUrl}
                </a>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
            {(statusReport.registrarContact?.phone || registrarInfo?.phone) && (
              <a
                href={`tel:${statusReport.registrarContact?.phone ?? registrarInfo?.phone}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg
                  bg-green-600 hover:bg-green-700 text-white transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Call Now
              </a>
            )}
            {(statusReport.registrarContact?.email || registrarInfo?.email) && (
              <a
                href={`mailto:${statusReport.registrarContact?.email ?? registrarInfo?.email}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg
                  bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email
              </a>
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* G. Proof of Ownership Checklist                              */}
      {/* ---------------------------------------------------------- */}
      {showProofOfOwnership && ownershipItems.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
            Documents That Can Help Prove Ownership
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Gather as many of these as you can before contacting your registrar.
          </p>
          <ul className="space-y-2">
            {ownershipItems.map((item, i) => {
              const checked = checkedOwnershipItems.has(i);
              return (
                <li key={i}>
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleOwnershipItem(i)}
                      className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600
                        text-blue-600 focus:ring-blue-500 dark:bg-gray-700 cursor-pointer"
                    />
                    <span
                      className={`text-sm transition-colors duration-150 ${
                        checked
                          ? 'text-gray-400 dark:text-gray-500 line-through'
                          : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                      }`}
                    >
                      {item}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {checkedOwnershipItems.size} of {ownershipItems.length} items gathered
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* H. Recommended Services                                      */}
      {/* ---------------------------------------------------------- */}
      {services.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 md:p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recommended Services
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service: ServiceRecommendation, i: number) => (
              <div
                key={i}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col"
              >
                <h4 className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                  {service.name}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex-1">
                  {service.description}
                </p>
                {service.pricing && (
                  <div className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">
                    {service.pricing}
                  </div>
                )}
                <a
                  href={service.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium
                    rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-150"
                >
                  Visit Site
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------- */}
      {/* I. Recovery Scripts                                          */}
      {/* ---------------------------------------------------------- */}
      {showScriptDownloads && onDownloadScript && (
        <CollapsibleSection title="Advanced: Download Recovery Scripts">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            These scripts can download your website content from the Wayback Machine archive.
            Choose your preferred language and run the script on your local machine.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onDownloadScript('bash')}
              disabled={downloadingScript}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400
                dark:bg-gray-600 dark:hover:bg-gray-500 dark:disabled:bg-gray-700
                text-white transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Bash Script
            </button>
            <button
              type="button"
              onClick={() => onDownloadScript('nodejs')}
              disabled={downloadingScript}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                bg-green-700 hover:bg-green-800 disabled:bg-gray-400
                dark:bg-green-600 dark:hover:bg-green-500 dark:disabled:bg-gray-700
                text-white transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Node.js Script
            </button>
            <button
              type="button"
              onClick={() => onDownloadScript('python')}
              disabled={downloadingScript}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg
                bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400
                dark:bg-yellow-500 dark:hover:bg-yellow-400 dark:disabled:bg-gray-700
                text-white transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Python Script
            </button>
          </div>
          {downloadingScript && (
            <p className="mt-3 text-sm text-blue-600 dark:text-blue-400 animate-pulse">
              Generating script...
            </p>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
}
