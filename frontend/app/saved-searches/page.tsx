'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';
import { API_BASE_URL } from '../config/api'

interface SavedSearch {
  id: string;
  query: string;
  name: string | null;
  filters: {
    discipline?: string;
    impactFactorMin?: number;
    impactFactorMax?: number;
    citationCountMin?: number;
    openAccess?: boolean;
    institutionId?: string;
  } | null;
  notificationsEnabled: boolean;
  createdAt: string;
}

export default function SavedSearchesPage() {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    try {
      const userId = '7af7ae67-4d01-4d97-a81f-c3b329231c7e'; // TODO: Replace with auth
      const response = await fetch(`http://localhost:3001/saved-searches?userId=${userId}`);
      const data = await response.json();
      setSavedSearches(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching saved searches:', err);
      setLoading(false);
    }
  };

  const handleRunSearch = (search: SavedSearch) => {
    const params = new URLSearchParams({ q: search.query });

    if (search.filters) {
      if (search.filters.discipline) params.append('discipline', search.filters.discipline);
      if (search.filters.impactFactorMin !== undefined)
        params.append('impactFactorMin', search.filters.impactFactorMin.toString());
      if (search.filters.impactFactorMax !== undefined)
        params.append('impactFactorMax', search.filters.impactFactorMax.toString());
      if (search.filters.citationCountMin !== undefined)
        params.append('citationCountMin', search.filters.citationCountMin.toString());
      if (search.filters.openAccess !== undefined)
        params.append('openAccess', search.filters.openAccess.toString());
      if (search.filters.institutionId)
        params.append('institutionId', search.filters.institutionId);
    }

    router.push(`/search?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this saved search?')) {
      return;
    }

    try {
      await fetch(`http://localhost:3001/saved-searches/${id}`, {
        method: 'DELETE',
      });
      setSavedSearches(savedSearches.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting saved search:', err);
      alert('Failed to delete saved search');
    }
  };

  const handleToggleNotifications = async (id: string, currentState: boolean) => {
    try {
      await fetch(`http://localhost:3001/saved-searches/${id}/toggle-notifications`, {
        method: 'POST',
      });
      setSavedSearches(savedSearches.map(s =>
        s.id === id ? { ...s, notificationsEnabled: !currentState } : s
      ));
    } catch (err) {
      console.error('Error toggling notifications:', err);
      alert('Failed to toggle notifications');
    }
  };

  const getFilterSummary = (filters: SavedSearch['filters']) => {
    if (!filters) return 'No filters';

    const parts = [];
    if (filters.discipline) parts.push(`Discipline: ${filters.discipline}`);
    if (filters.impactFactorMin !== undefined || filters.impactFactorMax !== undefined) {
      const min = filters.impactFactorMin ?? 0;
      const max = filters.impactFactorMax ?? '∞';
      parts.push(`Impact Factor: ${min}-${max}`);
    }
    if (filters.citationCountMin !== undefined) {
      parts.push(`Min Citations: ${filters.citationCountMin}`);
    }
    if (filters.openAccess !== undefined) {
      parts.push(`Open Access: ${filters.openAccess ? 'Yes' : 'No'}`);
    }
    if (filters.institutionId) {
      parts.push('Institution filter');
    }

    return parts.length > 0 ? parts.join(' • ') : 'No filters';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading saved searches...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Logo size="md" />
          <div className="flex gap-4 text-sm text-gray-600">
            <button onClick={() => router.push('/')} className="hover:text-gray-900">Home</button>
            <button onClick={() => router.push('/topics')} className="hover:text-gray-900">Topics</button>
            <button onClick={() => router.push('/journals')} className="hover:text-gray-900">Journals</button>
            <button onClick={() => router.push('/explore')} className="hover:text-gray-900">Explore</button>
            <button onClick={() => router.push('/trending')} className="hover:text-gray-900">Trending</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Saved Searches</h1>
            <p className="text-gray-600 mt-2">Manage your saved searches and notifications</p>
          </div>
          <button
            onClick={() => router.push('/search')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            New Search
          </button>
        </div>

        {savedSearches.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-200">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved searches yet</h3>
            <p className="text-gray-600 mb-6">Save your searches to quickly access them later and get notifications about new results.</p>
            <button
              onClick={() => router.push('/search')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Start Searching
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <div key={search.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {search.name || `Search: ${search.query}`}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span className="font-medium">{search.query}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleNotifications(search.id, search.notificationsEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        search.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      title={search.notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          search.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-xs text-gray-500">
                      {search.notificationsEnabled ? 'Notifications on' : 'Notifications off'}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">Filters:</span> {getFilterSummary(search.filters)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Saved on {new Date(search.createdAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRunSearch(search)}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Run Search
                  </button>
                  <button
                    onClick={() => handleDelete(search.id)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
