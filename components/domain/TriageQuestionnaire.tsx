'use client';

import { useState } from 'react';
import type { RecoveryContext } from '@/lib/recovery/recovery-guide';

interface TriageQuestionnaireProps {
  onContextChange: (context: RecoveryContext) => void;
}

interface TriageQuestion {
  key: keyof RecoveryContext;
  question: string;
  description: string;
}

const QUESTIONS: TriageQuestion[] = [
  {
    key: 'lostCredentials',
    question: 'Has someone else managed this domain for you?',
    description:
      'Select this if you do not know or remember your registrar login, or if a previous employee, IT person, or family member set it up.',
  },
  {
    key: 'stolenOrHijacked',
    question:
      'Do you believe this domain was stolen or transferred without your permission?',
    description:
      'Select this if the domain disappeared from your account, WHOIS shows a different owner, or you suspect unauthorized access.',
  },
  {
    key: 'contractualDispute',
    question:
      'Is a web developer or agency refusing to release the domain?',
    description:
      'Select this if someone registered or managed the domain on your behalf and will not hand it over.',
  },
  {
    key: 'contentRecoveryPriority',
    question: 'Is recovering your website content a top priority?',
    description:
      'Select this if getting your pages, images, or data back matters as much as getting the domain itself.',
  },
  {
    key: 'emergencyMode',
    question: 'Is this an emergency? (production site down)',
    description:
      'Select this if your business website or email is currently offline and you need the fastest path to recovery.',
  },
];

export function TriageQuestionnaire({
  onContextChange,
}: TriageQuestionnaireProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [context, setContext] = useState<RecoveryContext>({});

  const hasAnySelection = Object.values(context).some(Boolean);

  const toggle = (key: keyof RecoveryContext) => {
    const next = { ...context, [key]: !context[key] };
    setContext(next);
    onContextChange(next);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header / toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left
          hover:bg-gray-50 dark:hover:bg-gray-750
          transition-colors duration-150 cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center
            bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 text-lg">
            ?
          </span>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white text-sm md:text-base">
              Personalize Your Recovery Guide
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {hasAnySelection
                ? 'Your guide has been customized based on your answers below.'
                : 'Answer a few quick questions to get advice tailored to your situation.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {hasAnySelection && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold
              bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">
              Active
            </span>
          )}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Collapsible body */}
      <div
        className={`transition-all duration-200 ease-in-out overflow-hidden ${
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-5 pt-1 border-t border-gray-100 dark:border-gray-700 space-y-3">
          {QUESTIONS.map((q) => {
            const isActive = !!context[q.key];
            return (
              <label
                key={q.key}
                className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors duration-150 ${
                  isActive
                    ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                    : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={() => toggle(q.key)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 dark:border-gray-600
                    text-purple-600 focus:ring-purple-500 dark:bg-gray-700 cursor-pointer"
                />
                <div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? 'text-purple-900 dark:text-purple-200'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {q.question}
                  </span>
                  <p
                    className={`text-xs mt-0.5 ${
                      isActive
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {q.description}
                  </p>
                </div>
              </label>
            );
          })}

          {hasAnySelection && (
            <button
              type="button"
              onClick={() => {
                const reset: RecoveryContext = {};
                setContext(reset);
                onContextChange(reset);
              }}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300
                underline transition-colors duration-150 cursor-pointer"
            >
              Clear all selections
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
