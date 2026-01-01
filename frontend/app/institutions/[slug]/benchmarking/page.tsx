'use client';

import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../../config/api'

interface BenchmarkOverview {
  institution: {
    totalSearches: number;
    hybridSearchUsage: number;
    semanticSearchUsage: number;
    avgLatency: number;
  };
  global: {
    totalSearches: number;
    hybridSearchUsage: number;
    semanticSearchUsage: number;
    avgLatency: number;
  };
  percentiles: {
    hybridAdoption: number;
    semanticAdoption: number;
    avgLatency: number;
  };
}

interface ModelComparison {
  model: string;
  institution: {
    count: number;
    percent: number;
  };
  global: {
    count: number;
    percent: number;
  };
  difference: {
    absolute: number;
    relative: number;
  };
}

interface TopQueriesData {
  institution: Array<{ query: string; count: number }>;
  global: Array<{ query: string; count: number }>;
  overlapScore: number;
  commonQueries: string[];
}

interface PerformanceData {
  institution: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  global: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  percentiles: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
}

export default function BenchmarkingPage() {
  const params = useParams();
  const institutionSlug = params.slug as string;
  const [overview, setOverview] = useState<BenchmarkOverview | null>(null);
  const [modelUsage, setModelUsage] = useState<{ comparison: ModelComparison[] } | null>(null);
  const [topQueries, setTopQueries] = useState<TopQueriesData | null>(null);
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstitutionId = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/institutions/${institutionSlug}`
        );
        const data = await response.json();
        setInstitutionId(data.id);
      } catch (error) {
        console.error('Error fetching institution:', error);
      }
    };

    fetchInstitutionId();
  }, [institutionSlug]);

  useEffect(() => {
    if (!institutionId) return;

    const fetchBenchmarkData = async () => {
      try {
        const [overviewRes, modelRes, queriesRes, perfRes] = await Promise.all([
          fetch(`http://localhost:3001/analytics/benchmarking/${institutionId}/overview`),
          fetch(`http://localhost:3001/analytics/benchmarking/${institutionId}/model-usage`),
          fetch(`http://localhost:3001/analytics/benchmarking/${institutionId}/top-queries`),
          fetch(`http://localhost:3001/analytics/benchmarking/${institutionId}/performance`),
        ]);

        const [overviewData, modelData, queriesData, perfData] = await Promise.all([
          overviewRes.json(),
          modelRes.json(),
          queriesRes.json(),
          perfRes.json(),
        ]);

        setOverview(overviewData);
        setModelUsage(modelData);
        setTopQueries(queriesData);
        setPerformance(perfData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching benchmark data:', error);
        setLoading(false);
      }
    };

    fetchBenchmarkData();
  }, [institutionId]);

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 75) return 'text-green-600 bg-green-50';
    if (percentile >= 50) return 'text-blue-600 bg-blue-50';
    if (percentile >= 25) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getPercentileLabel = (percentile: number) => {
    if (percentile >= 75) return 'Top 25%';
    if (percentile >= 50) return 'Above Average';
    if (percentile >= 25) return 'Below Average';
    return 'Bottom 25%';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center text-gray-600">Loading benchmarking data...</div>
      </div>
    );
  }

  if (!overview || !modelUsage || !topQueries || !performance) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="text-center text-gray-600">
          Not enough data available for benchmarking. Ensure your institution has search activity.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Cross-Institution Benchmarking
          </h1>
          <p className="text-gray-600">
            Compare your institution's metrics against anonymized aggregates from all institutions
          </p>
        </div>

        {/* Benchmark Overview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Benchmark Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Hybrid Search Adoption */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Hybrid Search Adoption</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {overview.institution.hybridSearchUsage.toFixed(1)}%
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getPercentileColor(
                    overview.percentiles.hybridAdoption
                  )}`}
                  title={`${overview.percentiles.hybridAdoption}th percentile`}
                >
                  {getPercentileLabel(overview.percentiles.hybridAdoption)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Institution</span>
                  <span className="font-medium text-purple-600">
                    {overview.institution.hybridSearchUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Global Average</span>
                  <span className="font-medium text-gray-900">
                    {overview.global.hybridSearchUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Difference</span>
                  <span
                    className={`font-medium ${
                      overview.institution.hybridSearchUsage >
                      overview.global.hybridSearchUsage
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {overview.institution.hybridSearchUsage >
                    overview.global.hybridSearchUsage
                      ? '+'
                      : ''}
                    {(
                      overview.institution.hybridSearchUsage -
                      overview.global.hybridSearchUsage
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Semantic Search Usage */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Semantic Search Usage</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {overview.institution.semanticSearchUsage.toFixed(1)}%
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getPercentileColor(
                    overview.percentiles.semanticAdoption
                  )}`}
                  title={`${overview.percentiles.semanticAdoption}th percentile`}
                >
                  {getPercentileLabel(overview.percentiles.semanticAdoption)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Institution</span>
                  <span className="font-medium text-purple-600">
                    {overview.institution.semanticSearchUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Global Average</span>
                  <span className="font-medium text-gray-900">
                    {overview.global.semanticSearchUsage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Difference</span>
                  <span
                    className={`font-medium ${
                      overview.institution.semanticSearchUsage >
                      overview.global.semanticSearchUsage
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {overview.institution.semanticSearchUsage >
                    overview.global.semanticSearchUsage
                      ? '+'
                      : ''}
                    {(
                      overview.institution.semanticSearchUsage -
                      overview.global.semanticSearchUsage
                    ).toFixed(1)}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Average Latency */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Average Latency</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {overview.institution.avgLatency.toFixed(0)}ms
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${getPercentileColor(
                    overview.percentiles.avgLatency
                  )}`}
                  title={`${overview.percentiles.avgLatency}th percentile (lower is better)`}
                >
                  {getPercentileLabel(overview.percentiles.avgLatency)}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Your Institution</span>
                  <span className="font-medium text-purple-600">
                    {overview.institution.avgLatency.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Global Average</span>
                  <span className="font-medium text-gray-900">
                    {overview.global.avgLatency.toFixed(0)}ms
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Difference</span>
                  <span
                    className={`font-medium ${
                      overview.institution.avgLatency < overview.global.avgLatency
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {overview.institution.avgLatency < overview.global.avgLatency
                      ? ''
                      : '+'}
                    {(
                      overview.institution.avgLatency - overview.global.avgLatency
                    ).toFixed(0)}
                    ms
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Model Usage Comparison */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Model Usage Comparison</h2>
          <div className="space-y-6">
            {modelUsage.comparison.map((model) => (
              <div key={model.model} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-medium text-gray-900 capitalize">
                    {model.model}
                  </h3>
                  <span
                    className={`text-sm font-medium ${
                      model.difference.absolute > 0 ? 'text-green-600' : model.difference.absolute < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}
                  >
                    {model.difference.absolute > 0 ? '+' : ''}
                    {model.difference.absolute.toFixed(1)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Institution Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Your Institution</span>
                      <span className="font-medium text-purple-600">
                        {model.institution.percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-purple-600 h-3 rounded-full transition-all"
                        style={{ width: `${model.institution.percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Global Bar */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">Global Average</span>
                      <span className="font-medium text-gray-900">
                        {model.global.percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-gray-400 h-3 rounded-full transition-all"
                        style={{ width: `${model.global.percent}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Queries Comparison */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Top Queries</h2>
              <div className="text-sm">
                <span className="text-gray-600">Overlap Score: </span>
                <span className="font-bold text-purple-600">
                  {topQueries.overlapScore.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Institution Queries */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-purple-600 rounded-full mr-2"></span>
                  Your Institution
                </h3>
                <div className="space-y-2">
                  {topQueries.institution.slice(0, 10).map((q, idx) => (
                    <div
                      key={idx}
                      className={`text-sm p-2 rounded ${
                        topQueries.commonQueries.includes(q.query)
                          ? 'bg-purple-50 border border-purple-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {q.query}
                      </div>
                      <div className="text-xs text-gray-600">{q.count} searches</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Global Queries */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                  Global
                </h3>
                <div className="space-y-2">
                  {topQueries.global.slice(0, 10).map((q, idx) => (
                    <div
                      key={idx}
                      className={`text-sm p-2 rounded ${
                        topQueries.commonQueries.includes(q.query)
                          ? 'bg-purple-50 border border-purple-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 truncate">
                        {q.query}
                      </div>
                      <div className="text-xs text-gray-600">{q.count} searches</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Benchmarking */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Performance Benchmarking
            </h2>
            <div className="space-y-4">
              {[
                { key: 'avg' as const, label: 'Average', percentile: performance.percentiles.avg },
                { key: 'p50' as const, label: 'P50 (Median)', percentile: performance.percentiles.p50 },
                { key: 'p95' as const, label: 'P95', percentile: performance.percentiles.p95 },
                { key: 'p99' as const, label: 'P99', percentile: performance.percentiles.p99 },
              ].map((metric) => (
                <div key={metric.key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700">
                      {metric.label}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getPercentileColor(
                        metric.percentile
                      )}`}
                      title={`${metric.percentile}th percentile`}
                    >
                      {getPercentileLabel(metric.percentile)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Your Institution</p>
                      <p className="text-lg font-bold text-purple-600">
                        {performance.institution[metric.key].toFixed(0)}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Global Average</p>
                      <p className="text-lg font-bold text-gray-900">
                        {performance.global[metric.key].toFixed(0)}ms
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>0ms</span>
                      <span>
                        {Math.max(
                          performance.institution[metric.key],
                          performance.global[metric.key]
                        ).toFixed(0)}
                        ms
                      </span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 left-0 h-full bg-purple-600 rounded-full"
                        style={{
                          width: `${
                            (performance.institution[metric.key] /
                              Math.max(
                                performance.institution[metric.key],
                                performance.global[metric.key]
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                      <div
                        className="absolute top-0 left-0 h-full border-l-2 border-gray-400"
                        style={{
                          left: `${
                            (performance.global[metric.key] /
                              Math.max(
                                performance.institution[metric.key],
                                performance.global[metric.key]
                              )) *
                            100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
