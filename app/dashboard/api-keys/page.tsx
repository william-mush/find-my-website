'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ApiKeyData {
  id: number;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  revokedAt: string | null;
}

export default function ApiKeysPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create key form state
  const [keyName, setKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Newly created key (shown once)
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revocation state
  const [revokingId, setRevokingId] = useState<number | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      const res = await fetch('/api/keys');
      if (!res.ok) throw new Error('Failed to fetch API keys');
      const data = await res.json();
      setKeys(data.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (status === 'authenticated') {
      fetchKeys();
    }
  }, [status, router, fetchKeys]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setIsCreating(true);
    setError(null);
    setNewKey(null);

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create API key');

      // Show the full key once
      setNewKey(data.key);
      setKeyName('');
      // Refresh the list
      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    setRevokingId(id);
    setError(null);

    try {
      const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to revoke API key');

      await fetchKeys();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke API key');
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = async () => {
    if (!newKey) return;
    try {
      await navigator.clipboard.writeText(newKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = newKey;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
            <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const activeKeys = keys.filter(k => !k.revokedAt);
  const revokedKeys = keys.filter(k => k.revokedAt);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            API Keys
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage API keys for programmatic access to the Find My Website API.
            Keys use the format <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-sm font-mono">fmw_live_...</code>
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* New key display (shown once after creation) */}
        {newKey && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
              API Key Created Successfully
            </h3>
            <p className="text-green-700 dark:text-green-300 text-sm mb-4">
              Copy your API key now. You will not be able to see it again.
            </p>
            <div className="flex items-center gap-3">
              <code className="flex-1 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-lg px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100 break-all select-all">
                {newKey}
              </code>
              <button
                onClick={handleCopy}
                className={`px-4 py-3 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300'
                }`}
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="mt-4 text-sm text-green-700 dark:text-green-300 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Create new key form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Create New API Key
          </h2>
          <form onSubmit={handleCreate} className="flex items-end gap-4">
            <div className="flex-1">
              <label
                htmlFor="keyName"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Key Name
              </label>
              <input
                id="keyName"
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g., Production Server, CI/CD Pipeline"
                maxLength={100}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating || !keyName.trim()}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              {isCreating ? 'Creating...' : 'Create Key'}
            </button>
          </form>
        </div>

        {/* Active keys */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Active Keys ({activeKeys.length})
            </h2>
          </div>

          {activeKeys.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
              No active API keys. Create one above to get started.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {activeKeys.map((apiKey) => (
                <div key={apiKey.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                        {apiKey.name}
                      </h3>
                      <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-mono shrink-0">
                        {apiKey.keyPrefix}...
                      </code>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>Created: {formatDate(apiKey.createdAt)}</span>
                      <span>Last used: {formatDate(apiKey.lastUsedAt)}</span>
                      <span>Rate limit: {apiKey.rateLimit}/hr</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevoke(apiKey.id)}
                    disabled={revokingId === apiKey.id}
                    className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {revokingId === apiKey.id ? 'Revoking...' : 'Revoke'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Revoked keys */}
        {revokedKeys.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-500 dark:text-gray-400">
                Revoked Keys ({revokedKeys.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {revokedKeys.map((apiKey) => (
                <div key={apiKey.id} className="px-6 py-4 opacity-60">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate line-through">
                      {apiKey.name}
                    </h3>
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-mono shrink-0">
                      {apiKey.keyPrefix}...
                    </code>
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded font-medium shrink-0">
                      Revoked
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>Created: {formatDate(apiKey.createdAt)}</span>
                    <span>Revoked: {formatDate(apiKey.revokedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Usage guide */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Usage
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            Include your API key in the <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code> header:
          </p>
          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">
{`curl -X POST https://findmywebsite.com/api/domain/analyze \\
  -H "Authorization: Bearer fmw_live_your_key_here" \\
  -H "Content-Type: application/json" \\
  -d '{"domain": "example.com"}'`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
