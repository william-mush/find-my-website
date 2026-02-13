'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface SavedDomain {
  id: number;
  domain: string;
  notes: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export default function SavedDomainsPage() {
  const [domains, setDomains] = useState<SavedDomain[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editTags, setEditTags] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  // Collect all unique tags
  const allTags = Array.from(
    new Set(domains.flatMap((d) => d.tags || []))
  ).sort();

  const fetchDomains = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (activeTag) params.set('tag', activeTag);

      const response = await fetch(`/api/dashboard/saved-domains?${params}`);
      if (response.ok) {
        const data = await response.json();
        setDomains(data.domains || []);
      }
    } catch (error) {
      console.error('Failed to fetch saved domains:', error);
    } finally {
      setIsLoading(false);
    }
  }, [search, activeTag]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchDomains();
    }, 300);
    return () => clearTimeout(debounce);
  }, [fetchDomains]);

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to remove this saved domain?')) return;

    try {
      const response = await fetch(`/api/dashboard/saved-domains/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setDomains((prev) => prev.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete domain:', error);
    }
  };

  const startEditing = (domain: SavedDomain) => {
    setEditingId(domain.id);
    setEditNotes(domain.notes || '');
    setEditTags((domain.tags || []).join(', '));
  };

  const saveEdit = async (id: number) => {
    try {
      const tags = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const response = await fetch(`/api/dashboard/saved-domains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: editNotes, tags }),
      });

      if (response.ok) {
        const data = await response.json();
        setDomains((prev) =>
          prev.map((d) => (d.id === id ? data.domain : d))
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to update domain:', error);
    }
  };

  const addTag = async (id: number, tag: string) => {
    const domain = domains.find((d) => d.id === id);
    if (!domain || domain.tags?.includes(tag)) return;

    const newTags = [...(domain.tags || []), tag];
    try {
      const response = await fetch(`/api/dashboard/saved-domains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });

      if (response.ok) {
        const data = await response.json();
        setDomains((prev) =>
          prev.map((d) => (d.id === id ? data.domain : d))
        );
      }
    } catch (error) {
      console.error('Failed to add tag:', error);
    }
  };

  const removeTag = async (id: number, tag: string) => {
    const domain = domains.find((d) => d.id === id);
    if (!domain) return;

    const newTags = (domain.tags || []).filter((t) => t !== tag);
    try {
      const response = await fetch(`/api/dashboard/saved-domains/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tags: newTags }),
      });

      if (response.ok) {
        const data = await response.json();
        setDomains((prev) =>
          prev.map((d) => (d.id === id ? data.domain : d))
        );
      }
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Saved Domains
        </h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Manage your bookmarked domains with notes and tags
        </p>
      </div>

      {/* Search and filter bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search saved domains..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tag filter */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag('')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              activeTag === ''
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                activeTag === tag
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Domains list */}
      {domains.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-300 dark:text-gray-700 mx-auto mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No saved domains
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {search || activeTag
              ? 'No domains match your filters. Try adjusting your search.'
              : 'Save domains from search results to track and organize them here.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search for domains
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {domains.map((domain) => (
            <div
              key={domain.id}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
            >
              {editingId === domain.id ? (
                /* Editing mode */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {domain.domain}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(domain.id)}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Add notes about this domain..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={editTags}
                      onChange={(e) => setEditTags(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g. important, expired, client-project"
                    />
                  </div>
                </div>
              ) : (
                /* Display mode */
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {domain.domain}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          saved {new Date(domain.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {domain.notes && (
                        <p className="mt-2 text-gray-600 dark:text-gray-400 text-sm">
                          {domain.notes}
                        </p>
                      )}

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        {(domain.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
                          >
                            {tag}
                            <button
                              onClick={() => removeTag(domain.id, tag)}
                              className="ml-0.5 hover:text-red-500 transition-colors"
                              title="Remove tag"
                            >
                              x
                            </button>
                          </span>
                        ))}
                        {/* Inline add tag */}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (newTagInput.trim()) {
                              addTag(domain.id, newTagInput.trim());
                              setNewTagInput('');
                            }
                          }}
                          className="inline-flex"
                        >
                          <input
                            type="text"
                            value={editingId === null ? newTagInput : ''}
                            onChange={(e) => setNewTagInput(e.target.value)}
                            placeholder="+ tag"
                            className="w-16 px-2 py-0.5 text-xs bg-transparent border border-dashed border-gray-300 dark:border-gray-700 rounded-full text-gray-500 dark:text-gray-400 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:w-24 transition-all"
                          />
                        </form>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Link
                        href={`/?domain=${encodeURIComponent(domain.domain)}`}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title="Analyze domain"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => startEditing(domain)}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title="Edit notes and tags"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(domain.id)}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title="Remove saved domain"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
