'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface SearchHistoryItem {
  id: number;
  domain: string;
  analysisType: string;
  resultSummary: {
    status?: string;
    isRegistered?: boolean;
    registrar?: string;
    expiryDate?: string;
    isOnline?: boolean;
    recoveryDifficulty?: string;
  } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function SearchHistoryPage() {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [savingDomainId, setSavingDomainId] = useState<number | null>(null);

  const fetchHistory = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (typeFilter) params.set('type', typeFilter);
      if (fromDate) params.set('from', fromDate);
      if (toDate) params.set('to', toDate);

      const response = await fetch(`/api/dashboard/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [typeFilter, fromDate, toDate]);

  useEffect(() => {
    fetchHistory(1);
  }, [fetchHistory]);

  const saveDomain = async (domain: string, id: number) => {
    setSavingDomainId(id);
    try {
      const response = await fetch('/api/dashboard/saved-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      if (response.ok) {
        alert(`Saved ${domain} to your domains.`);
      } else {
        const data = await response.json();
        if (response.status === 409) {
          alert(`${domain} is already in your saved domains.`);
        } else {
          alert(data.error || 'Failed to save domain.');
        }
      }
    } catch (error) {
      console.error('Failed to save domain:', error);
    } finally {
      setSavingDomainId(null);
    }
  };

  const getStatusBadge = (summary: SearchHistoryItem['resultSummary']) => {
    if (!summary) return null;

    if (summary.isOnline) {
      return (
        <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
          Online
        </span>
      );
    }

    if (summary.status) {
      const statusColors: Record<string, string> = {
        ACTIVE_IN_USE: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
        ACTIVE_PARKED: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
        ACTIVE_FOR_SALE: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
        EXPIRED_GRACE: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        EXPIRED_REDEMPTION: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        PENDING_DELETE: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
        AVAILABLE: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      };

      const colorClass = statusColors[summary.status] || 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
      const label = summary.status.replace(/_/g, ' ');

      return (
        <span className={`px-2 py-0.5 ${colorClass} text-xs rounded-full`}>
          {label}
        </span>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Search History
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Review your past domain analyses and re-run them
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Type filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Analysis Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="domain">Domain Analysis</option>
              <option value="network">Network Analysis</option>
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              From
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Clear filters */}
          {(typeFilter || fromDate || toDate) && (
            <div className="flex items-end">
              <button
                onClick={() => {
                  setTypeFilter('');
                  setFromDate('');
                  setToDate('');
                }}
                className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* History list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No search history
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {typeFilter || fromDate || toDate
              ? 'No results match your filters.'
              : 'Your domain analyses will appear here automatically.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Analyze a domain
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Domain
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.domain}
                        </span>
                        {item.resultSummary?.registrar && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {item.resultSummary.registrar}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          item.analysisType === 'network'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        }`}>
                          {item.analysisType === 'network' ? 'Network' : 'Domain'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.resultSummary)}
                        {item.resultSummary?.recoveryDifficulty && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            Recovery: {item.resultSummary.recoveryDifficulty}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/?domain=${encodeURIComponent(item.domain)}`}
                            className="px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            Re-analyze
                          </Link>
                          <button
                            onClick={() => saveDomain(item.domain, item.id)}
                            disabled={savingDomainId === item.id}
                            className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
                            title="Save domain"
                          >
                            {savingDomainId === item.id ? 'Saving...' : 'Save'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchHistory(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchHistory(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
