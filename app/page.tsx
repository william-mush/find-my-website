'use client';

import { useState } from 'react';
import { DomainSearch } from '@/components/domain/DomainSearch';
import { DomainResults } from '@/components/domain/DomainResults';

export default function Home() {
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (domain: string) => {
    setIsLoading(true);
    setError(null);
    setSearchResults(null);

    try {
      const response = await fetch('/api/domain/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Analysis failed');
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black">
      <main className="container mx-auto px-4 py-8 md:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Find My Website
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Recover lost domains and websites. Get complete domain information, historical data, and step-by-step recovery guidance.
          </p>
        </div>

        {/* Search Component */}
        <DomainSearch
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        {/* Error Display */}
        {error && (
          <div className="mt-8 max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">
                <strong>Error:</strong> {error}
              </p>
            </div>
          </div>
        )}

        {/* Results Display */}
        {searchResults && (
          <DomainResults data={searchResults} />
        )}

        {/* Features Section (shown when no results) */}
        {!searchResults && !isLoading && (
          <div className="mt-16 max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
              What You'll Get
            </h2>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Complete Domain Info
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  WHOIS data, DNS records, registration history, expiry dates, and current status.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="text-4xl mb-4">📸</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Historical Snapshots
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Browse archived versions of the website from the Wayback Machine spanning years.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="text-4xl mb-4">🛠️</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Recovery Tools
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Download custom scripts to recover your website content and get step-by-step recovery guidance.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="text-4xl mb-4">💰</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Cost Estimates
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get realistic cost and time estimates for different recovery methods.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Action Plan
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Receive prioritized recommendations based on domain status and your situation.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
                <div className="text-4xl mb-4">🤝</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Service Recommendations
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get matched with the right backorder services, brokers, or legal help.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>Find My Website - Domain Recovery & Information Tool</p>
          <p className="mt-2 text-sm">
            Helping you recover lost domains and websites since 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
