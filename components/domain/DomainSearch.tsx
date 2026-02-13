'use client';

import { useState } from 'react';

interface DomainSearchProps {
  onSearch: (domain: string) => void;
  isLoading: boolean;
}

export function DomainSearch({ onSearch, isLoading }: DomainSearchProps) {
  const [domain, setDomain] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (domain.trim()) {
      onSearch(domain.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="Enter domain name (e.g., example.com)"
            className="w-full px-6 py-4 pr-32 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !domain.trim()}
            className="absolute right-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-full transition-colors"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Analyzing
              </span>
            ) : (
              'Search'
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <p>Try: google.com, expired-domain.com, or any domain you&apos;re interested in</p>
      </div>
    </div>
  );
}
