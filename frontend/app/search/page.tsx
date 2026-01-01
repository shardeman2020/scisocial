'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '../config/api'

interface SearchFilters {
  discipline?: string;
  impactFactorMin?: number;
  impactFactorMax?: number;
  citationCountMin?: number;
  openAccess?: boolean;
  institutionId?: string;
}

interface SearchResults {
  topics: any[];
  journals: any[];
  users: any[];
  institutions: any[];
  posts: any[];
}

function SearchResultsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResults>({
    topics: [],
    journals: [],
    users: [],
    institutions: [],
    posts: [],
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [useSemanticSearch, setUseSemanticSearch] = useState(false);
  const [useHybridSearch, setUseHybridSearch] = useState(false);
  const [semanticWeight, setSemanticWeight] = useState(0.7);
  const [keywordWeight, setKeywordWeight] = useState(0.3);
  const [searchThreshold, setSearchThreshold] = useState(0.0);
  const [selectedModel, setSelectedModel] = useState<'general' | 'biomed' | 'legal' | 'physics'>('general');

  useEffect(() => {
    if (query) {
      performSearch();
    }
  }, [query, filters, useSemanticSearch, useHybridSearch, semanticWeight, keywordWeight, searchThreshold, selectedModel]);

  const performSearch = async () => {
    setLoading(true);
    try {
      if (useSemanticSearch) {
        // Semantic or Hybrid search - uses embeddings
        const params = new URLSearchParams({ q: query, limit: '20' });

        // Add model parameter
        params.append('model', selectedModel);

        if (searchThreshold > 0) {
          params.append('threshold', searchThreshold.toString());
        }

        if (useHybridSearch) {
          params.append('hybrid', 'true');
          params.append('semanticWeight', semanticWeight.toString());
          params.append('keywordWeight', keywordWeight.toString());
        }

        const response = await fetch(`http://localhost:3001/semantic-search?${params.toString()}`);
        const data = await response.json();

        // Transform search results to include all scores
        setResults({
          topics: data.topics.map((item: any) => ({
            ...item.topic,
            similarity: item.similarity,
            keywordScore: item.keywordScore,
            combinedScore: item.combinedScore
          })),
          journals: data.journals.map((item: any) => ({
            ...item.journal,
            similarity: item.similarity,
            keywordScore: item.keywordScore,
            combinedScore: item.combinedScore
          })),
          users: data.users.map((item: any) => ({
            ...item.user,
            similarity: item.similarity,
            keywordScore: item.keywordScore,
            combinedScore: item.combinedScore
          })),
          institutions: [],
          posts: data.posts.map((item: any) => ({
            ...item.post,
            similarity: item.similarity,
            keywordScore: item.keywordScore,
            combinedScore: item.combinedScore
          })),
        });
      } else {
        // Traditional keyword search with filters
        const params = new URLSearchParams({ q: query, limit: '20' });

        if (filters.discipline) params.append('discipline', filters.discipline);
        if (filters.impactFactorMin) params.append('impactFactorMin', filters.impactFactorMin.toString());
        if (filters.impactFactorMax) params.append('impactFactorMax', filters.impactFactorMax.toString());
        if (filters.citationCountMin) params.append('citationCountMin', filters.citationCountMin.toString());
        if (filters.openAccess !== undefined) params.append('openAccess', filters.openAccess.toString());
        if (filters.institutionId) params.append('institutionId', filters.institutionId);

        const response = await fetch(`http://localhost:3001/search?${params.toString()}`);
        const data = await response.json();
        setResults(data);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleSaveSearch = async () => {
    setSaving(true);
    try {
      // For MVP, using first user ID from posts (in production, use auth context)
      const userId = '7af7ae67-4d01-4d97-a81f-c3b329231c7e'; // TODO: Replace with actual user auth

      await fetch(`${API_BASE_URL}/saved-searches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          query,
          filters: Object.keys(filters).length > 0 ? filters : undefined,
          name: searchName || `Search: ${query}`,
        }),
      });

      setSaveDialogOpen(false);
      setSearchName('');
      alert('Search saved successfully!');
    } catch (err) {
      console.error('Failed to save search:', err);
      alert('Failed to save search');
    } finally {
      setSaving(false);
    }
  };

  const totalResults =
    results.topics.length +
    results.journals.length +
    results.users.length +
    results.institutions.length +
    results.posts.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700"
            >
              ← Back
            </button>
            <h1 className="text-xl font-bold text-gray-900">Search Results</h1>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Search Box */}
        <div className="mb-6">
          <div className="flex gap-4 mb-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={useSemanticSearch ? "Ask a question or describe what you're looking for..." : "Search..."}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              disabled={useSemanticSearch}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
            <button
              onClick={() => setSaveDialogOpen(true)}
              disabled={!query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Save Search
            </button>
          </div>

          {/* Semantic Search Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useSemanticSearch}
                  onChange={(e) => {
                    setUseSemanticSearch(e.target.checked);
                    if (e.target.checked) {
                      setShowFilters(false);
                    } else {
                      setUseHybridSearch(false);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Use Semantic Search
                </span>
              </label>
              <div className="text-xs text-gray-500">
                {useSemanticSearch ? (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    AI-powered natural language search
                  </span>
                ) : (
                  'Traditional keyword matching with filters'
                )}
              </div>
            </div>

            {/* Model Selector */}
            {useSemanticSearch && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Embedding Model
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as 'general' | 'biomed' | 'legal' | 'physics')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value="general">General - All-purpose scientific content</option>
                  <option value="biomed">Biomedical - Life sciences and medical research</option>
                  <option value="legal">Legal - Law and policy documents</option>
                  <option value="physics">Physics - Physical sciences</option>
                </select>
                <p className="text-xs text-gray-600 mt-2">
                  Domain-specific models provide better results for specialized content
                </p>
              </div>
            )}

            {/* Hybrid Search Controls */}
            {useSemanticSearch && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useHybridSearch}
                      onChange={(e) => setUseHybridSearch(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-800">
                      Enable Hybrid Search
                    </span>
                  </label>
                  <span className="text-xs text-blue-700 font-medium">
                    {useHybridSearch ? 'Semantic + Keyword' : 'Semantic Only'}
                  </span>
                </div>

                {useHybridSearch && (
                  <div className="space-y-3 pl-6 border-l-2 border-blue-300">
                    {/* Weight Sliders */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">
                          Semantic Weight
                        </label>
                        <span className="text-xs font-semibold text-blue-600">
                          {(semanticWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={semanticWeight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setSemanticWeight(val);
                          setKeywordWeight(1 - val);
                        }}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">
                          Keyword Weight
                        </label>
                        <span className="text-xs font-semibold text-blue-600">
                          {(keywordWeight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={keywordWeight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setKeywordWeight(val);
                          setSemanticWeight(1 - val);
                        }}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                    </div>

                    {/* Threshold Input */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">
                          Relevance Threshold
                        </label>
                        <span className="text-xs font-semibold text-blue-600">
                          {searchThreshold.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={searchThreshold}
                        onChange={(e) => setSearchThreshold(parseFloat(e.target.value))}
                        className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <p className="text-xs text-gray-500">
                        Only show results with combined score ≥ {searchThreshold.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save Search Dialog */}
        {saveDialogOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Save This Search</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Name (Optional)
                </label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder={`Search: ${query}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="mb-4 text-sm text-gray-600">
                <p><strong>Query:</strong> {query}</p>
                {Object.keys(filters).length > 0 && (
                  <p className="mt-2"><strong>Filters:</strong> {Object.keys(filters).length} active</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setSaveDialogOpen(false);
                    setSearchName('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSearch}
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Discipline Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discipline
                </label>
                <select
                  value={filters.discipline || ''}
                  onChange={(e) => setFilters({ ...filters, discipline: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Disciplines</option>
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Engineering">Engineering</option>
                </select>
              </div>

              {/* Impact Factor Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Impact Factor
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={filters.impactFactorMin || ''}
                  onChange={(e) => setFilters({ ...filters, impactFactorMin: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="e.g., 5.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Impact Factor
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={filters.impactFactorMax || ''}
                  onChange={(e) => setFilters({ ...filters, impactFactorMax: e.target.value ? parseFloat(e.target.value) : undefined })}
                  placeholder="e.g., 50.0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Citation Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Citations
                </label>
                <input
                  type="number"
                  value={filters.citationCountMin || ''}
                  onChange={(e) => setFilters({ ...filters, citationCountMin: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="e.g., 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Open Access */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Type
                </label>
                <select
                  value={filters.openAccess === undefined ? '' : filters.openAccess.toString()}
                  onChange={(e) => setFilters({ ...filters, openAccess: e.target.value === '' ? undefined : e.target.value === 'true' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="true">Open Access Only</option>
                  <option value="false">Restricted Access</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <p className="text-gray-600">
              {loading ? 'Searching...' : `Found ${totalResults} results for "${query}"`}
            </p>
            {useSemanticSearch && !loading && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 border border-purple-300 rounded-full text-xs font-semibold text-purple-700">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {selectedModel === 'general' && 'General Model'}
                {selectedModel === 'biomed' && 'Biomedical Model'}
                {selectedModel === 'legal' && 'Legal Model'}
                {selectedModel === 'physics' && 'Physics Model'}
              </span>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Topics Results */}
            {results.topics.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Topics ({results.topics.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => router.push(`/topics/${topic.slug}`)}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left relative"
                    >
                      {/* Relevance Score Badge */}
                      {(topic.similarity !== undefined || topic.combinedScore !== undefined) && (
                        <div className="absolute top-3 right-3">
                          <div className="group relative">
                            <div className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full text-xs font-bold text-white shadow-sm">
                              {(topic.combinedScore !== undefined ? topic.combinedScore : topic.similarity).toFixed(3)}
                            </div>
                            {topic.combinedScore !== undefined && (
                              <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-10 w-48 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
                                <div className="space-y-1">
                                  <div className="flex justify-between">
                                    <span>Semantic:</span>
                                    <span className="font-semibold">{topic.similarity?.toFixed(3) || 'N/A'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Keyword:</span>
                                    <span className="font-semibold">{topic.keywordScore?.toFixed(3) || '0.000'}</span>
                                  </div>
                                  <div className="flex justify-between border-t border-gray-700 pt-1 mt-1">
                                    <span>Combined:</span>
                                    <span className="font-bold">{topic.combinedScore.toFixed(3)}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      <h4 className="font-semibold text-gray-900 mb-2 pr-16">{topic.name}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{topic.description}</p>
                      <div className="text-xs text-gray-500">
                        {topic.postCount} posts · {topic.followerCount} followers
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Journals Results */}
            {results.journals.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Journals ({results.journals.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.journals.map((journal) => (
                    <button
                      key={journal.id}
                      onClick={() => router.push(`/journals/${journal.slug}`)}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{journal.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{journal.publisher}</p>
                      <div className="text-xs text-gray-500">
                        {journal.articleCount} articles · Impact Factor: {journal.impactFactor || 'N/A'}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Users Results */}
            {results.users.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Users ({results.users.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => router.push(`/users/${user.username}`)}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{user.username}</h4>
                          <p className="text-sm text-gray-600">{user.institution?.name}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">{user.bio}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Institutions Results */}
            {results.institutions.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Institutions ({results.institutions.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.institutions.map((institution) => (
                    <button
                      key={institution.id}
                      onClick={() => router.push(`/institutions/${institution.slug}`)}
                      className="bg-white rounded-lg p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-left"
                    >
                      <h4 className="font-semibold text-gray-900 mb-2">{institution.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{institution.location}</p>
                      <div className="text-xs text-gray-500">
                        {institution.verifiedUserCount} verified researchers
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Posts Results */}
            {results.posts.length > 0 && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Posts ({results.posts.length})</h3>
                <div className="space-y-4">
                  {results.posts.map((post) => (
                    <div key={post.id} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {post.author.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{post.author.username}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 mb-3">{post.content}</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h5 className="font-semibold text-sm text-gray-900 mb-1">
                          {post.citation.title}
                        </h5>
                        <p className="text-xs text-gray-600">
                          {post.citation.journal} ({post.citation.year})
                          {post.citation.isOpenAccess && (
                            <span className="ml-2 text-green-600 font-medium">Open Access</span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* No Results */}
            {totalResults === 0 && !loading && (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-500">No results found. Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResultsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading search...</p>
        </div>
      </div>
    }>
      <SearchResultsContent />
    </Suspense>
  );
}
