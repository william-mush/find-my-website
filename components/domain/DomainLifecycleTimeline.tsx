'use client';

import { useState } from 'react';

interface DomainLifecycleTimelineProps {
  currentPhase: string; // 'registered' | 'active' | 'expired' | 'grace' | 'redemption' | 'pending-delete' | 'available' | 'unknown'
  daysInfo?: string;    // e.g., "15 days since expiry" or "30 days until expiry"
}

interface PhaseNode {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
}

const PHASES: PhaseNode[] = [
  {
    id: 'registered',
    label: 'Registered',
    shortLabel: 'Reg.',
    description: 'The domain has been registered with a registrar.',
  },
  {
    id: 'active',
    label: 'Active',
    shortLabel: 'Active',
    description: 'The domain is live and in use, parked, or listed for sale.',
  },
  {
    id: 'expired',
    label: 'Expired',
    shortLabel: 'Exp.',
    description: 'The registration period has lapsed and was not renewed.',
  },
  {
    id: 'grace',
    label: 'Grace Period',
    shortLabel: 'Grace',
    description: 'The original owner can still renew at the normal price (typically 0-45 days).',
  },
  {
    id: 'redemption',
    label: 'Redemption',
    shortLabel: 'Redm.',
    description: 'Recovery is possible but requires a substantial redemption fee ($80-$200+).',
  },
  {
    id: 'pending-delete',
    label: 'Pending Delete',
    shortLabel: 'Del.',
    description: 'The domain will be released to the public within about 5 days.',
  },
  {
    id: 'available',
    label: 'Available',
    shortLabel: 'Avail.',
    description: 'The domain is not registered and can be purchased by anyone.',
  },
];

/**
 * Maps a DomainStatus string from the analyzer to a lifecycle phase id.
 */
export function statusToPhase(status: string): string {
  const map: Record<string, string> = {
    AVAILABLE: 'available',
    ACTIVE_IN_USE: 'active',
    ACTIVE_PARKED: 'active',
    ACTIVE_FOR_SALE: 'active',
    EXPIRED_GRACE: 'grace',
    EXPIRED_REDEMPTION: 'redemption',
    PENDING_DELETE: 'pending-delete',
    UNKNOWN: 'unknown',
    RESERVED: 'unknown',
    ACTIVE_HOSTING_ISSUE: 'active',
  };
  return map[status] ?? 'unknown';
}

export function DomainLifecycleTimeline({
  currentPhase,
  daysInfo,
}: DomainLifecycleTimelineProps) {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const currentIndex = PHASES.findIndex((p) => p.id === currentPhase);
  const isUnknown = currentPhase === 'unknown' || currentIndex === -1;

  function getNodeState(index: number): 'past' | 'current' | 'future' {
    if (isUnknown) return 'future';
    if (index < currentIndex) return 'past';
    if (index === currentIndex) return 'current';
    return 'future';
  }

  function getNodeColors(state: 'past' | 'current' | 'future'): {
    dot: string;
    label: string;
    line: string;
  } {
    switch (state) {
      case 'past':
        return {
          dot: 'bg-gray-400 dark:bg-gray-500 border-gray-400 dark:border-gray-500',
          label: 'text-gray-400 dark:text-gray-500',
          line: 'bg-gray-400 dark:bg-gray-500',
        };
      case 'current':
        return {
          dot: 'bg-blue-600 dark:bg-blue-400 border-blue-600 dark:border-blue-400 ring-4 ring-blue-200 dark:ring-blue-900',
          label: 'text-blue-700 dark:text-blue-300 font-bold',
          line: 'bg-blue-600 dark:bg-blue-400',
        };
      case 'future':
        return {
          dot: 'bg-gray-200 dark:bg-gray-700 border-gray-300 dark:border-gray-600',
          label: 'text-gray-300 dark:text-gray-600',
          line: 'bg-gray-200 dark:bg-gray-700',
        };
    }
  }

  return (
    <div className="w-full py-4">
      {/* Unknown phase banner */}
      {isUnknown && (
        <div className="mb-4 px-3 py-2 rounded-md bg-gray-100 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400 text-center">
          Unable to determine the exact lifecycle phase for this domain.
        </div>
      )}

      {/* Desktop / horizontal view */}
      <div className="hidden md:block">
        <div className="relative flex items-start justify-between">
          {PHASES.map((phase, index) => {
            const state = getNodeState(index);
            const colors = getNodeColors(state);
            const isExpanded = expandedPhase === phase.id;
            const isCurrent = state === 'current';

            return (
              <div
                key={phase.id}
                className="flex flex-col items-center relative"
                style={{ flex: '1 1 0%' }}
              >
                {/* Connecting line (left half) */}
                {index > 0 && (
                  <div
                    className={`absolute top-3 right-1/2 h-0.5 w-full ${
                      getNodeState(index - 1) === 'future'
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : getNodeColors(getNodeState(index - 1)).line
                    }`}
                    style={{ zIndex: 0 }}
                  />
                )}

                {/* Dot */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPhase(isExpanded ? null : phase.id)
                  }
                  aria-label={`${phase.label}: ${phase.description}`}
                  className={`
                    relative z-10 w-6 h-6 rounded-full border-2
                    transition-all duration-200 cursor-pointer
                    ${colors.dot}
                  `}
                />

                {/* Label */}
                <span
                  className={`mt-2 text-xs text-center leading-tight transition-colors duration-200 ${colors.label}`}
                >
                  {phase.label}
                </span>

                {/* Current phase indicator + daysInfo */}
                {isCurrent && daysInfo && (
                  <span className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 text-center leading-snug max-w-[110px]">
                    {daysInfo}
                  </span>
                )}

                {/* Expanded description */}
                {isExpanded && (
                  <div className="absolute top-full mt-2 z-20 w-48 p-2.5 rounded-lg shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {phase.label}
                    </span>
                    <br />
                    {phase.description}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile / vertical stacked view */}
      <div className="md:hidden space-y-0">
        {PHASES.map((phase, index) => {
          const state = getNodeState(index);
          const colors = getNodeColors(state);
          const isExpanded = expandedPhase === phase.id;
          const isCurrent = state === 'current';

          return (
            <div key={phase.id} className="flex items-start gap-3">
              {/* Left column: dot + connecting line */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedPhase(isExpanded ? null : phase.id)
                  }
                  aria-label={`${phase.label}: ${phase.description}`}
                  className={`
                    w-5 h-5 rounded-full border-2 shrink-0
                    transition-all duration-200 cursor-pointer
                    ${colors.dot}
                  `}
                />
                {index < PHASES.length - 1 && (
                  <div
                    className={`w-0.5 grow min-h-[24px] ${
                      state === 'future'
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : colors.line
                    }`}
                  />
                )}
              </div>

              {/* Right column: label + info */}
              <div className="pb-3 min-w-0">
                <span
                  className={`text-sm leading-tight transition-colors duration-200 ${colors.label}`}
                >
                  {phase.shortLabel === phase.label
                    ? phase.label
                    : phase.label}
                </span>

                {isCurrent && daysInfo && (
                  <span className="block mt-0.5 text-xs text-blue-600 dark:text-blue-400">
                    {daysInfo}
                  </span>
                )}

                {isExpanded && (
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    {phase.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
