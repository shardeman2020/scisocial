'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_BASE_URL } from '../../../config/api'

interface WeeklyDigest {
  id: string;
  userId: string;
  weekStart: string;
  weekEnd: string;
  topQueries: Array<{ query: string; count: number; percent: number }>;
  modelUsage: {
    total: number;
    general: number;
    biomed: number;
    legal: number;
    physics: number;
    generalPercent: number;
    biomedPercent: number;
    legalPercent: number;
    physicsPercent: number;
  };
  searchModeUsage: {
    total: number;
    keywordCount: number;
    semanticCount: number;
    hybridCount: number;
    keywordPercent: number;
    semanticPercent: number;
    hybridPercent: number;
  };
  performanceMetrics: {
    avgExecutionTime: number;
    p50: number;
    p95: number;
    p99: number;
  };
  moderationActivity: {
    totalFlagged: number;
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
    byFlagType: Array<{ flagType: string; count: number }>;
    byEntityType: Array<{ entityType: string; count: number }>;
  };
  createdAt: string;
}

export default function ResearcherDigestPage() {
  const params = useParams();
  const userId = params.id as string;
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLatestDigest();
  }, [userId]);

  const fetchLatestDigest = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/digest/researchers/${userId}/latest`
      );
      const data = await response.json();
      setDigest(data);
    } catch (error) {
      console.error('Error fetching digest:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-purple-600 font-medium">Loading your digest...</div>
      </div>
    );
  }

  if (!digest) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Digest Available</h2>
            <p className="text-gray-600">
              Your weekly digest has not been generated yet. Check back after the weekend!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate percentages for moderation activity
  const totalModeration = digest.moderationActivity.resolved + digest.moderationActivity.dismissed;
  const resolvedPercent = totalModeration > 0
    ? (digest.moderationActivity.resolved / totalModeration) * 100
    : 0;
  const dismissedPercent = totalModeration > 0
    ? (digest.moderationActivity.dismissed / totalModeration) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Your Weekly Digest</h1>
          <p className="mt-2 text-gray-600">
            {formatDate(digest.weekStart)} - {formatDate(digest.weekEnd)}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Queries */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Top Queries</h2>
          {digest.topQueries.length > 0 ? (
            <div className="space-y-3">
              {digest.topQueries.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900">{item.query}</span>
                    <span className="text-sm text-gray-600">
                      {item.count} ({item.percent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${item.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-8">No query data available</p>
          )}
        </div>

        {/* Model Usage and Search Mode */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Model Usage Pie Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Model Usage Distribution</h2>
            {digest.modelUsage.total > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="20"
                        strokeDasharray={`${digest.modelUsage.generalPercent * 2.51} 251`}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#A855F7"
                        strokeWidth="20"
                        strokeDasharray={`${digest.modelUsage.biomedPercent * 2.51} 251`}
                        strokeDashoffset={`-${digest.modelUsage.generalPercent * 2.51}`}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="20"
                        strokeDasharray={`${digest.modelUsage.legalPercent * 2.51} 251`}
                        strokeDashoffset={`-${(digest.modelUsage.generalPercent + digest.modelUsage.biomedPercent) * 2.51}`}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#F97316"
                        strokeWidth="20"
                        strokeDasharray={`${digest.modelUsage.physicsPercent * 2.51} 251`}
                        strokeDashoffset={`-${(digest.modelUsage.generalPercent + digest.modelUsage.biomedPercent + digest.modelUsage.legalPercent) * 2.51}`}
                      />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm text-gray-700">General</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {digest.modelUsage.generalPercent.toFixed(1)}% ({digest.modelUsage.general})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm text-gray-700">Biomedical</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {digest.modelUsage.biomedPercent.toFixed(1)}% ({digest.modelUsage.biomed})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                      <span className="text-sm text-gray-700">Legal</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {digest.modelUsage.legalPercent.toFixed(1)}% ({digest.modelUsage.legal})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-orange-500" />
                      <span className="text-sm text-gray-700">Physics</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {digest.modelUsage.physicsPercent.toFixed(1)}% ({digest.modelUsage.physics})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No model usage data</p>
            )}
          </div>

          {/* Search Mode Donut Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Search Mode Usage</h2>
            {digest.searchModeUsage.total > 0 ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" strokeWidth="20" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#6366F1"
                        strokeWidth="20"
                        strokeDasharray={`${digest.searchModeUsage.hybridPercent * 2.51} 251`}
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="20"
                        strokeDasharray={`${digest.searchModeUsage.semanticPercent * 2.51} 251`}
                        strokeDashoffset={`-${digest.searchModeUsage.hybridPercent * 2.51}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {digest.searchModeUsage.total}
                        </div>
                        <div className="text-xs text-gray-500">Total</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <span className="text-sm text-gray-700">Hybrid</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {digest.searchModeUsage.hybridPercent.toFixed(1)}% ({digest.searchModeUsage.hybridCount})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-600" />
                      <span className="text-sm text-gray-700">Semantic</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {digest.searchModeUsage.semanticPercent.toFixed(1)}% ({digest.searchModeUsage.semanticCount})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-400" />
                      <span className="text-sm text-gray-700">Keyword</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      {digest.searchModeUsage.keywordPercent.toFixed(1)}% ({digest.searchModeUsage.keywordCount})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">No search mode data</p>
            )}
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Performance Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium">Average Latency</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {digest.performanceMetrics.avgExecutionTime.toFixed(0)}ms
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">P50 (Median)</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {digest.performanceMetrics.p50.toFixed(0)}ms
              </p>
            </div>
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <p className="text-sm text-indigo-800 font-medium">P95</p>
              <p className="text-2xl font-bold text-indigo-900 mt-2">
                {digest.performanceMetrics.p95.toFixed(0)}ms
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-800 font-medium">P99</p>
              <p className="text-2xl font-bold text-purple-900 mt-2">
                {digest.performanceMetrics.p99.toFixed(0)}ms
              </p>
            </div>
          </div>
        </div>

        {/* Moderation Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Moderation Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm text-orange-800 font-medium">Total Flagged</p>
              <p className="text-2xl font-bold text-orange-900 mt-2">
                {digest.moderationActivity.totalFlagged}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800 font-medium">Pending</p>
              <p className="text-2xl font-bold text-yellow-900 mt-2">
                {digest.moderationActivity.pending}
              </p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800 font-medium">Reviewed</p>
              <p className="text-2xl font-bold text-blue-900 mt-2">
                {digest.moderationActivity.reviewed}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800 font-medium">Resolved</p>
              <p className="text-2xl font-bold text-green-900 mt-2">
                {digest.moderationActivity.resolved}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-800 font-medium">Dismissed</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {digest.moderationActivity.dismissed}
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          {digest.moderationActivity.totalFlagged > 0 && totalModeration > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-20">Resolved</span>
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                  <div
                    className="bg-green-500 h-8 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${resolvedPercent}%` }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {resolvedPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 w-20">Dismissed</span>
                <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                  <div
                    className="bg-gray-500 h-8 rounded-full flex items-center justify-end pr-3"
                    style={{ width: `${dismissedPercent}%` }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {dismissedPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Breakdown by Flag Type */}
          {digest.moderationActivity.byFlagType.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">By Flag Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {digest.moderationActivity.byFlagType.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 capitalize">{item.flagType}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown by Entity Type */}
          {digest.moderationActivity.byEntityType.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-900 mb-3">By Entity Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {digest.moderationActivity.byEntityType.map((item, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-600 capitalize">{item.entityType}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">{item.count}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
