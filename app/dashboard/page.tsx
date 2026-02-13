'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DashboardStats {
  savedDomainsCount: number;
  totalSearches: number;
  watchlistCount: number;
  recentSearches: Array<{
    id: number;
    domain: string;
    analysisType: string;
    resultSummary: Record<string, unknown> | null;
    createdAt: string;
  }>;
  recentSaved: Array<{
    id: number;
    domain: string;
    notes: string | null;
    tags: string[];
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [savedRes, historyRes, watchlistRes] = await Promise.all([
          fetch('/api/dashboard/saved-domains'),
          fetch('/api/dashboard/history?limit=5'),
          fetch('/api/dashboard/watchlist'),
        ]);

        const savedData = savedRes.ok ? await savedRes.json() : { domains: [], total: 0 };
        const historyData = historyRes.ok ? await historyRes.json() : { history: [], pagination: { total: 0 } };
        const watchlistData = watchlistRes.ok ? await watchlistRes.json() : { watchlist: [], total: 0 };

        setStats({
          savedDomainsCount: savedData.total || 0,
          totalSearches: historyData.pagination?.total || 0,
          watchlistCount: watchlistData.total || 0,
          recentSearches: historyData.history || [],
          recentSaved: (savedData.domains || []).slice(0, 5),
        });
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
        setStats({
          savedDomainsCount: 0,
          totalSearches: 0,
          watchlistCount: 0,
          recentSearches: [],
          recentSaved: [],
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
        <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Overview of your domain research activity
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/dashboard/history"
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Searches
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.totalSearches || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </Link>

        <Link
          href="/dashboard/saved"
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:border-green-300 dark:hover:border-green-700 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Saved Domains
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.savedDomainsCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
          </div>
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Watchlist
              </p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats?.watchlistCount || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent activity sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Searches */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Searches
            </h2>
            <Link
              href="/dashboard/history"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stats?.recentSearches && stats.recentSearches.length > 0 ? (
              stats.recentSearches.map((search) => (
                <div key={search.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {search.domain}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {search.analysisType === 'network' ? 'Network Analysis' : 'Domain Analysis'}
                      {' -- '}
                      {new Date(search.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link
                    href={`/?domain=${encodeURIComponent(search.domain)}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
                  >
                    Re-analyze
                  </Link>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <p>No searches yet.</p>
                <Link
                  href="/"
                  className="text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
                >
                  Start your first search
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recently Saved */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recently Saved
            </h2>
            <Link
              href="/dashboard/saved"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {stats?.recentSaved && stats.recentSaved.length > 0 ? (
              stats.recentSaved.map((domain) => (
                <div key={domain.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {domain.domain}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(domain.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {domain.notes && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {domain.notes}
                    </p>
                  )}
                  {domain.tags && domain.tags.length > 0 && (
                    <div className="flex gap-1.5 mt-2">
                      {domain.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {domain.tags.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{domain.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                <p>No saved domains yet.</p>
                <p className="text-sm mt-1">
                  Save domains from search results to track them here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Analyze Domain</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Search and analyze a domain</p>
            </div>
          </Link>

          <Link
            href="/dashboard/saved"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">View Saved</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage saved domains</p>
            </div>
          </Link>

          <Link
            href="/dashboard/history"
            className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Search History</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Review past searches</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
