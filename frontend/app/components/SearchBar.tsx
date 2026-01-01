'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '../config/api'

interface SearchResult {
  type: 'topic' | 'journal' | 'user' | 'institution';
  id: string;
  name?: string;
  username?: string;
  slug: string;
  description?: string;
  bio?: string;
  location?: string;
  publisher?: string;
  followerCount?: number;
  articleCount?: number;
  badgeType?: string;
  institutionName?: string;
  verifiedUserCount?: number;
}

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
  createdAt: string;
}

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [savedSearchesOpen, setSavedSearchesOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    if (query.trim().length === 0) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/search/autocomplete?q=${encodeURIComponent(query)}&limit=8`);
        const data = await response.json();
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSavedSearchesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch saved searches on mount
  useEffect(() => {
    const fetchSavedSearches = async () => {
      try {
        const userId = '7af7ae67-4d01-4d97-a81f-c3b329231c7e'; // TODO: Replace with auth
        const response = await fetch(`http://localhost:3001/saved-searches?userId=${userId}`);
        const data = await response.json();
        setSavedSearches(data.slice(0, 5)); // Show only top 5 in dropdown
      } catch (err) {
        console.error('Error fetching saved searches:', err);
      }
    };

    fetchSavedSearches();
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');

    switch (result.type) {
      case 'topic':
        router.push(`/topics/${result.slug}`);
        break;
      case 'journal':
        router.push(`/journals/${result.slug}`);
        break;
      case 'user':
        router.push(`/users/${result.username || result.slug}`);
        break;
      case 'institution':
        router.push(`/institutions/${result.slug}`);
        break;
    }
  };

  const handleSavedSearchClick = (search: SavedSearch) => {
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

    setSavedSearchesOpen(false);
    router.push(`/search?${params.toString()}`);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'topic':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        );
      case 'journal':
        return (
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'user':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'institution':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getResultTitle = (result: SearchResult) => {
    return result.name || result.username || '';
  };

  const getResultSubtitle = (result: SearchResult) => {
    switch (result.type) {
      case 'topic':
        return result.description || `${result.followerCount || 0} followers`;
      case 'journal':
        return result.publisher || `${result.articleCount || 0} articles`;
      case 'user':
        return result.bio || result.institutionName || '';
      case 'institution':
        return result.location || `${result.verifiedUserCount || 0} verified researchers`;
      default:
        return '';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative flex gap-2">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                setIsOpen(false);
              }
            }}
            placeholder="Search topics, journals, users, institutions..."
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-500"></div>
            </div>
          )}
        </div>

        {/* Saved Searches Button */}
        <button
          onClick={() => {
            setSavedSearchesOpen(!savedSearchesOpen);
            setIsOpen(false);
          }}
          className={`px-4 py-3 border rounded-lg transition-colors ${
            savedSearchesOpen
              ? 'bg-blue-50 border-blue-500 text-blue-600'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
          title="Saved Searches"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
            >
              <div className="flex-shrink-0 mt-1">{getTypeIcon(result.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 truncate">{getResultTitle(result)}</span>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                    {getTypeLabel(result.type)}
                  </span>
                  {result.type === 'user' && result.institutionName && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex-shrink-0">
                      {result.institutionName}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 truncate mt-0.5">{getResultSubtitle(result)}</p>
              </div>
            </button>
          ))}
          <button
            onClick={() => {
              router.push(`/search?q=${encodeURIComponent(query)}`);
              setIsOpen(false);
            }}
            className="w-full px-4 py-3 text-center text-blue-600 hover:bg-blue-50 font-medium text-sm border-t border-gray-200"
          >
            View all results for "{query}"
          </button>
        </div>
      )}

      {isOpen && query.trim() && !loading && results.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 px-4 py-6 text-center text-gray-500">
          No results found for "{query}"
        </div>
      )}

      {/* Saved Searches Dropdown */}
      {savedSearchesOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {savedSearches.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <p className="text-gray-600 text-sm mb-3">No saved searches yet</p>
              <button
                onClick={() => {
                  setSavedSearchesOpen(false);
                  router.push('/search');
                }}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Create your first search
              </button>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-700">Saved Searches</h3>
              </div>
              {savedSearches.map((search) => (
                <button
                  key={search.id}
                  onClick={() => handleSavedSearchClick(search)}
                  className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100 text-left"
                >
                  <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 truncate text-sm">
                      {search.name || `Search: ${search.query}`}
                    </div>
                    <div className="text-xs text-gray-600 truncate mt-0.5">
                      {search.query}
                      {search.filters && Object.keys(search.filters).length > 0 && (
                        <span className="text-blue-600 ml-1">
                          • {Object.keys(search.filters).length} filter{Object.keys(search.filters).length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => {
                  setSavedSearchesOpen(false);
                  router.push('/saved-searches');
                }}
                className="w-full px-4 py-3 text-center text-blue-600 hover:bg-blue-50 font-medium text-sm border-t border-gray-200"
              >
                View All Saved Searches
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
