'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { API_BASE_URL } from '../../../config/api'

interface OverviewStats {
  totalSearches: number;
  keywordCount: number;
  semanticCount: number;
  hybridCount: number;
  keywordPercent: number;
  semanticPercent: number;
  hybridPercent: number;
  avgExecutionTime: number;
  p50: number;
  p95: number;
  p99: number;
}

interface QueryStat {
  query: string;
  count: number;
  percent: number;
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

interface ThresholdBucket {
  threshold: string;
  count: number;
}

export default function InstitutionDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const institutionId = params.id as string;

  const [institutionName, setInstitutionName] = useState<string>('');
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [topQueries, setTopQueries] = useState<QueryStat[]>([]);
  const [modelUsage, setModelUsage] = useState<ModelUsageStats | null>(null);
  const [thresholds, setThresholds] = useState<ThresholdBucket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (institutionId) {
      fetchDashboardData();
      fetchInstitutionInfo();
    }
  }, [institutionId]);

  const fetchInstitutionInfo = async () => {
    try {
      const response = await fetch(`http://localhost:3001/institutions/${institutionId}`);
      if (response.ok) {
        const data = await response.json();
        setInstitutionName(data.name);
      }
    } catch (err) {
      console.error('Error fetching institution info:', err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, queriesRes, modelUsageRes, thresholdsRes] = await Promise.all([
        fetch(`http://localhost:3001/analytics/institutions/${institutionId}/overview`),
        fetch(`http://localhost:3001/analytics/institutions/${institutionId}/top-queries?limit=10`),
        fetch(`http://localhost:3001/analytics/institutions/${institutionId}/model-usage`),
        fetch(`http://localhost:3001/analytics/institutions/${institutionId}/thresholds`),
      ]);

      const [overviewData, queriesData, modelUsageData, thresholdsData] = await Promise.all([
        overviewRes.json(),
        queriesRes.json(),
        modelUsageRes.json(),
        thresholdsRes.json(),
      ]);

      setOverview(overviewData);
      setTopQueries(queriesData);
      setModelUsage(modelUsageData);
      setThresholds(thresholdsData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setLoading(false);
    }
  };

  const getBarWidth = (value: number, max: number) => {
    return `${(value / max) * 100}%`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading institutional dashboard...</p>
        </div>
      </div>
    );
  }

  const maxQueryCount = topQueries.length > 0 ? topQueries[0].count : 1;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-purple-600 hover:text-purple-700"
            >
              ← Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{institutionName}</h1>
              <p className="text-sm text-gray-600">Institutional Search Analytics</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Metrics */}
        {overview && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Overview</h2>
              <p className="text-gray-600">Key metrics for this institution</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Searches */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Searches</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.totalSearches.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Hybrid Searches */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Hybrid Searches</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.hybridPercent}%</p>
                  </div>
                </div>
              </div>

              {/* Semantic Searches */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Semantic Searches</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.semanticPercent}%</p>
                  </div>
                </div>
              </div>

              {/* Avg Latency */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Latency</p>
                    <p className="text-2xl font-bold text-gray-900">{overview.avgExecutionTime.toFixed(0)}ms</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-2">P50 (Median)</p>
                  <p className="text-3xl font-bold text-gray-900">{overview.p50.toFixed(0)}ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">P95</p>
                  <p className="text-3xl font-bold text-gray-900">{overview.p95.toFixed(0)}ms</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">P99</p>
                  <p className="text-3xl font-bold text-gray-900">{overview.p99.toFixed(0)}ms</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Charts Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Insights</h2>
          <p className="text-gray-600">Detailed breakdowns of search behavior</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Top Queries */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Queries</h3>
            {topQueries.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No query data available yet</p>
            ) : (
              <div className="space-y-3">
                {topQueries.map((item, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 truncate flex-1">{item.query}</span>
                      <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm text-purple-600 font-semibold">{item.percent}%</span>
                        <span className="text-sm text-gray-500">({item.count})</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: getBarWidth(item.count, maxQueryCount) }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Model Usage Chart */}
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

        {/* Threshold Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Threshold Distribution</h3>
          {thresholds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {thresholds.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">{item.threshold}</span>
                  <span className="text-lg font-bold text-purple-600">{item.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No threshold data available yet</p>
          )}
        </div>
      </main>
    </div>
  );
}
