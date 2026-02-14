'use client';

import { useState } from 'react';

interface HelpTooltipProps {
  term: string;
  explanation: string;
  children: React.ReactNode;
}

export function HelpTooltip({ term, explanation, children }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <span className="inline">
      <span className="inline-flex items-center gap-1">
        {children}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={`What is ${term}?`}
          aria-expanded={isOpen}
          className={`
            inline-flex items-center justify-center
            w-4 h-4 rounded-full text-[10px] font-bold leading-none
            border border-gray-400 dark:border-gray-500
            transition-colors duration-150
            cursor-pointer select-none shrink-0
            ${
              isOpen
                ? 'bg-blue-600 text-white border-blue-600 dark:bg-blue-500 dark:border-blue-500'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
            }
          `}
        >
          ?
        </button>
      </span>

      <span
        className={`
          block overflow-hidden
          transition-all duration-200 ease-in-out
          ${isOpen ? 'max-h-40 opacity-100 mt-1.5 mb-1' : 'max-h-0 opacity-0 mt-0 mb-0'}
        `}
      >
        <span
          className="
            block text-sm leading-relaxed
            px-3 py-2 rounded-md
            bg-blue-50 text-blue-900
            dark:bg-blue-950/40 dark:text-blue-200
            border border-blue-200 dark:border-blue-800
          "
        >
          <span className="font-semibold">{term}:</span>{' '}
          {explanation}
        </span>
      </span>
    </span>
  );
}
