'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../components/Logo';
import { API_BASE_URL } from '../config/api'

interface AnalyticsSummary {
  totalSearches: number;
  uniqueUsers: number;
  avgResultCount: number;
}

interface QueryStat {
  query: string;
  count: string;
}

interface FilterStat {
  filter: string;
  count: number;
}

interface InstitutionStat {
  institution: string;
  count: string;
}

interface HybridUsageStats {
  total: number;
  keyword: number;
  semantic: number;
  hybrid: number;
  keywordPercent: number;
  semanticPercent: number;
  hybridPercent: number;
}

interface WeightDistribution {
  avgSemanticWeight: number;
  avgKeywordWeight: number;
  hybridSearchCount: number;
}

interface ThresholdBucket {
  threshold: string;
  count: number;
}

interface ModelUsageStats {
  total: number;
  general: number;
  biomed: number;
  legal: number;
  physics: number;
  generalPercent: number;
  biomedPercent: number;
  legalPercent: number;
  physicsPercent: number;
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topQueries, setTopQueries] = useState<QueryStat[]>([]);
  const [topFilters, setTopFilters] = useState<FilterStat[]>([]);
  const [institutionStats, setInstitutionStats] = useState<InstitutionStat[]>([]);
  const [hybridUsage, setHybridUsage] = useState<HybridUsageStats | null>(null);
  const [weightDist, setWeightDist] = useState<WeightDistribution | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdBucket[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [
        summaryRes,
        queriesRes,
        filtersRes,
        institutionsRes,
        hybridUsageRes,
        weightDistRes,
        thresholdsRes,
        modelUsageRes,
      ] = await Promise.all([
        fetch(`${API_BASE_URL}/analytics/searches/summary`),
        fetch(`${API_BASE_URL}/analytics/searches/top-queries?limit=10`),
        fetch(`${API_BASE_URL}/analytics/searches/top-filters?limit=10`),
        fetch(`${API_BASE_URL}/analytics/searches/by-institution`),
        fetch(`${API_BASE_URL}/analytics/searches/hybrid-usage`),
        fetch(`${API_BASE_URL}/analytics/searches/weight-distribution`),
        fetch(`${API_BASE_URL}/analytics/searches/thresholds`),
        fetch(`${API_BASE_URL}/analytics/searches/model-usage`),
      ]);

      const [
        summaryData,
        queriesData,
        filtersData,
        institutionsData,
        hybridUsageData,
        weightDistData,
        thresholdsData,
        modelUsageData,
      ] = await Promise.all([
        summaryRes.json(),
        queriesRes.json(),
        filtersRes.json(),
        institutionsRes.json(),
        hybridUsageRes.json(),
        weightDistRes.json(),
        thresholdsRes.json(),
        modelUsageRes.json(),
      ]);

      setSummary(summaryData);
      setTopQueries(queriesData);
      setTopFilters(filtersData);
      setInstitutionStats(institutionsData);
      setHybridUsage(hybridUsageData);
      setWeightDist(weightDistData);
      setThresholds(thresholdsData);
      setModelUsage(modelUsageData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setLoading(false);
    }
  };

  const getBarWidth = (value: number, max: number) => {
    return `${(value / max) * 100}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  const maxQueryCount = topQueries.length > 0 ? parseInt(topQueries[0].count, 10) : 1;
  const maxFilterCount = topFilters.length > 0 ? topFilters[0].count : 1;
  const maxInstitutionCount = institutionStats.length > 0 ? parseInt(institutionStats[0].count, 10) : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Search Analytics</h1>
          <p className="text-gray-600 mt-2">Insights into search behavior and trends</p>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Searches</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.totalSearches.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Unique Users</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.uniqueUsers.toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avg Results per Search</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.avgResultCount.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Queries Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Top Search Queries</h2>
            {topQueries.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No search data available yet</p>
            ) : (
              <div className="space-y-3">
                {topQueries.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{item.query}</span>
                      <span className="text-sm text-gray-500 ml-2">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: getBarWidth(parseInt(item.count, 10), maxQueryCount) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Filters Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Most Used Filters</h2>
            {topFilters.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No filter data available yet</p>
            ) : (
              <div className="space-y-3">
                {topFilters.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate">{item.filter}</span>
                      <span className="text-sm text-gray-500 ml-2">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: getBarWidth(item.count, maxFilterCount) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Searches by Institution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Searches by Institution</h2>
          {institutionStats.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No institution data available yet</p>
          ) : (
            <div className="space-y-3">
              {institutionStats.slice(0, 10).map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 truncate">{item.institution}</span>
                    <span className="text-sm text-gray-500 ml-2">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-orange-500 h-2 rounded-full transition-all"
                      style={{ width: getBarWidth(parseInt(item.count, 10), maxInstitutionCount) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hybrid Search Analytics Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hybrid Search Analytics</h2>
          <p className="text-gray-600">Advanced insights into hybrid search usage and configuration</p>
        </div>

        {/* Hybrid Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {/* Hybrid Usage Stats */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Search Mode Distribution</h3>
            {hybridUsage && hybridUsage.total > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    {/* Simple pie visualization with percentages */}
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {/* Semantic slice */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="20"
                        strokeDasharray={`${hybridUsage.semanticPercent * 2.51} 251`}
                        strokeDashoffset="0"
                      />
                      {/* Hybrid slice */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="20"
                        strokeDasharray={`${hybridUsage.hybridPercent * 2.51} 251`}
                        strokeDashoffset={`-${hybridUsage.semanticPercent * 2.51}`}
                      />
                      {/* Keyword slice */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="20"
                        strokeDasharray={`${hybridUsage.keywordPercent * 2.51} 251`}
                        strokeDashoffset={`-${(hybridUsage.semanticPercent + hybridUsage.hybridPercent) * 2.51}`}
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Semantic</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{hybridUsage.semanticPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Hybrid</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{hybridUsage.hybridPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Keyword</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{hybridUsage.keywordPercent}%</span>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Total Searches</p>
                  <p className="text-xl font-bold text-gray-900">{hybridUsage.total.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No search mode data available yet</p>
            )}
          </div>

          {/* Weight Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Average Hybrid Weights</h3>
            {weightDist && weightDist.hybridSearchCount > 0 ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Semantic Weight</span>
                    <span className="text-sm font-semibold text-blue-600">{(weightDist.avgSemanticWeight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-blue-500 h-4 rounded-full transition-all"
                      style={{ width: `${weightDist.avgSemanticWeight * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Keyword Weight</span>
                    <span className="text-sm font-semibold text-purple-600">{(weightDist.avgKeywordWeight * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-purple-500 h-4 rounded-full transition-all"
                      style={{ width: `${weightDist.avgKeywordWeight * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Hybrid Searches</p>
                  <p className="text-xl font-bold text-gray-900">{weightDist.hybridSearchCount.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No hybrid weight data available yet</p>
            )}
          </div>

          {/* Threshold Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Threshold Distribution</h3>
            {thresholds.length > 0 ? (
              <div className="space-y-3">
                {thresholds.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.threshold}</span>
                      <span className="text-sm text-gray-500">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: getBarWidth(item.count, Math.max(...thresholds.map(t => t.count))) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No threshold data available yet</p>
            )}
          </div>

          {/* Model Usage Distribution */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Model Usage Distribution</h3>
            {modelUsage && modelUsage.total > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative w-32 h-32">
                    {/* Pie chart visualization */}
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      {/* General slice (Blue) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="20"
                        strokeDasharray={`${modelUsage.generalPercent * 2.51} 251`}
                        strokeDashoffset="0"
                      />
                      {/* Biomedical slice (Purple) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="20"
                        strokeDasharray={`${modelUsage.biomedPercent * 2.51} 251`}
                        strokeDashoffset={`-${modelUsage.generalPercent * 2.51}`}
                      />
                      {/* Legal slice (Green) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="20"
                        strokeDasharray={`${modelUsage.legalPercent * 2.51} 251`}
                        strokeDashoffset={`-${(modelUsage.generalPercent + modelUsage.biomedPercent) * 2.51}`}
                      />
                      {/* Physics slice (Orange) */}
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="20"
                        strokeDasharray={`${modelUsage.physicsPercent * 2.51} 251`}
                        strokeDashoffset={`-${(modelUsage.generalPercent + modelUsage.biomedPercent + modelUsage.legalPercent) * 2.51}`}
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">General</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{modelUsage.generalPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Biomedical</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{modelUsage.biomedPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Legal</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{modelUsage.legalPercent}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Physics</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{modelUsage.physicsPercent}%</span>
                  </div>
                </div>
                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">Total Semantic Searches</p>
                  <p className="text-xl font-bold text-gray-900">{modelUsage.total.toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No model usage data available yet</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
