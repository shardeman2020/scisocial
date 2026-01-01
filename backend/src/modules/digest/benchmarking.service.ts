import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchAnalytics } from '../search-analytics/search-analytics.entity';

@Injectable()
export class BenchmarkingService {
  constructor(
    @InjectRepository(SearchAnalytics)
    private searchAnalyticsRepository: Repository<SearchAnalytics>,
  ) {}

  async getBenchmarkOverview(institutionId: string) {
    // Get institution metrics
    const institutionMetrics = await this.getInstitutionMetrics(institutionId);

    // Get global metrics
    const globalMetrics = await this.getGlobalMetrics();

    // Calculate percentile ranks
    const hybridAdoptionPercentile = await this.calculatePercentileRank(
      institutionId,
      'hybridSearchUsage',
    );
    const semanticAdoptionPercentile = await this.calculatePercentileRank(
      institutionId,
      'semanticSearchUsage',
    );
    const avgLatencyPercentile = await this.calculatePercentileRank(
      institutionId,
      'avgLatency',
      true, // Lower is better for latency
    );

    return {
      institution: institutionMetrics,
      global: globalMetrics,
      percentiles: {
        hybridAdoption: hybridAdoptionPercentile,
        semanticAdoption: semanticAdoptionPercentile,
        avgLatency: avgLatencyPercentile,
      },
    };
  }

  async getBenchmarkModelUsage(institutionId: string) {
    // Get institution model usage
    const institutionUsage = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.model', 'model')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.model IS NOT NULL')
      .groupBy('analytics.model')
      .getRawMany();

    const institutionTotal = institutionUsage.reduce(
      (sum, item) => sum + parseInt(item.count, 10),
      0,
    );

    // Get global model usage (excluding current institution)
    const globalUsage = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.model', 'model')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId != :institutionId', { institutionId })
      .andWhere('analytics.model IS NOT NULL')
      .groupBy('analytics.model')
      .getRawMany();

    const globalTotal = globalUsage.reduce(
      (sum, item) => sum + parseInt(item.count, 10),
      0,
    );

    // Calculate distributions
    const models = ['general', 'biomed', 'legal', 'physics'];
    const comparison = models.map((model) => {
      const instCount =
        parseInt(
          institutionUsage.find((u) => u.model === model)?.count || '0',
          10,
        );
      const globalCount =
        parseInt(globalUsage.find((u) => u.model === model)?.count || '0', 10);

      const instPercent =
        institutionTotal > 0 ? (instCount / institutionTotal) * 100 : 0;
      const globalPercent =
        globalTotal > 0 ? (globalCount / globalTotal) * 100 : 0;

      return {
        model,
        institution: {
          count: instCount,
          percent: instPercent,
        },
        global: {
          count: globalCount,
          percent: globalPercent,
        },
        difference: {
          absolute: instPercent - globalPercent,
          relative:
            globalPercent > 0
              ? ((instPercent - globalPercent) / globalPercent) * 100
              : 0,
        },
      };
    });

    return {
      comparison,
      totals: {
        institution: institutionTotal,
        global: globalTotal,
      },
    };
  }

  async getBenchmarkTopQueries(institutionId: string) {
    // Get institution top queries
    const institutionQueries = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .groupBy('analytics.query')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    // Get global top queries (excluding current institution)
    const globalQueries = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId != :institutionId', { institutionId })
      .groupBy('analytics.query')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    // Calculate overlap score (Jaccard similarity)
    const instSet = new Set(institutionQueries.map((q) => q.query));
    const globalSet = new Set(globalQueries.map((q) => q.query));
    const intersection = new Set(
      [...instSet].filter((q) => globalSet.has(q)),
    );
    const union = new Set([...instSet, ...globalSet]);
    const overlapScore =
      union.size > 0 ? (intersection.size / union.size) * 100 : 0;

    return {
      institution: institutionQueries.map((q) => ({
        query: q.query,
        count: parseInt(q.count, 10),
      })),
      global: globalQueries.map((q) => ({
        query: q.query,
        count: parseInt(q.count, 10),
      })),
      overlapScore,
      commonQueries: Array.from(intersection),
    };
  }

  async getBenchmarkPerformance(institutionId: string) {
    // Get institution performance metrics
    const institutionPerf = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.executionTime)', 'avg')
      .addSelect(
        'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY analytics.executionTime)',
        'p50',
      )
      .addSelect(
        'PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY analytics.executionTime)',
        'p95',
      )
      .addSelect(
        'PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY analytics.executionTime)',
        'p99',
      )
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.executionTime IS NOT NULL')
      .getRawOne();

    // Get global performance metrics (excluding current institution)
    const globalPerf = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.executionTime)', 'avg')
      .addSelect(
        'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY analytics.executionTime)',
        'p50',
      )
      .addSelect(
        'PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY analytics.executionTime)',
        'p95',
      )
      .addSelect(
        'PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY analytics.executionTime)',
        'p99',
      )
      .where('analytics.institutionId != :institutionId', { institutionId })
      .andWhere('analytics.executionTime IS NOT NULL')
      .getRawOne();

    // Calculate percentile ranks for each metric
    const avgPercentile = await this.calculatePerformancePercentile(
      institutionId,
      'avg',
    );
    const p50Percentile = await this.calculatePerformancePercentile(
      institutionId,
      'p50',
    );
    const p95Percentile = await this.calculatePerformancePercentile(
      institutionId,
      'p95',
    );
    const p99Percentile = await this.calculatePerformancePercentile(
      institutionId,
      'p99',
    );

    return {
      institution: {
        avg: parseFloat(institutionPerf?.avg || 0),
        p50: parseFloat(institutionPerf?.p50 || 0),
        p95: parseFloat(institutionPerf?.p95 || 0),
        p99: parseFloat(institutionPerf?.p99 || 0),
      },
      global: {
        avg: parseFloat(globalPerf?.avg || 0),
        p50: parseFloat(globalPerf?.p50 || 0),
        p95: parseFloat(globalPerf?.p95 || 0),
        p99: parseFloat(globalPerf?.p99 || 0),
      },
      percentiles: {
        avg: avgPercentile,
        p50: p50Percentile,
        p95: p95Percentile,
        p99: p99Percentile,
      },
    };
  }

  private async getInstitutionMetrics(institutionId: string) {
    const searchModes = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.mode', 'mode')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .groupBy('analytics.mode')
      .getRawMany();

    const total = searchModes.reduce(
      (sum, item) => sum + parseInt(item.count, 10),
      0,
    );
    const hybridCount =
      parseInt(searchModes.find((m) => m.mode === 'hybrid')?.count || '0', 10);
    const semanticCount =
      parseInt(
        searchModes.find((m) => m.mode === 'semantic')?.count || '0',
        10,
      );

    const avgLatency = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.executionTime)', 'avg')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.executionTime IS NOT NULL')
      .getRawOne();

    return {
      totalSearches: total,
      hybridSearchUsage: total > 0 ? (hybridCount / total) * 100 : 0,
      semanticSearchUsage: total > 0 ? (semanticCount / total) * 100 : 0,
      avgLatency: parseFloat(avgLatency?.avg || 0),
    };
  }

  private async getGlobalMetrics() {
    const searchModes = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.mode', 'mode')
      .addSelect('COUNT(*)', 'count')
      .groupBy('analytics.mode')
      .getRawMany();

    const total = searchModes.reduce(
      (sum, item) => sum + parseInt(item.count, 10),
      0,
    );
    const hybridCount =
      parseInt(searchModes.find((m) => m.mode === 'hybrid')?.count || '0', 10);
    const semanticCount =
      parseInt(
        searchModes.find((m) => m.mode === 'semantic')?.count || '0',
        10,
      );

    const avgLatency = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.executionTime)', 'avg')
      .andWhere('analytics.executionTime IS NOT NULL')
      .getRawOne();

    return {
      totalSearches: total,
      hybridSearchUsage: total > 0 ? (hybridCount / total) * 100 : 0,
      semanticSearchUsage: total > 0 ? (semanticCount / total) * 100 : 0,
      avgLatency: parseFloat(avgLatency?.avg || 0),
    };
  }

  private async calculatePercentileRank(
    institutionId: string,
    metric: string,
    lowerIsBetter: boolean = false,
  ): Promise<number> {
    // Get institution's value for the metric
    const institutionMetrics = await this.getInstitutionMetrics(institutionId);
    const institutionValue = institutionMetrics[metric];

    // Get all institutions' values
    const allInstitutions = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('DISTINCT analytics.institutionId', 'institutionId')
      .where('analytics.institutionId IS NOT NULL')
      .getRawMany();

    const values = await Promise.all(
      allInstitutions.map(async (inst) => {
        const metrics = await this.getInstitutionMetrics(inst.institutionId);
        return metrics[metric];
      }),
    );

    // Calculate percentile rank
    const sortedValues = values.sort((a, b) => a - b);
    let rank;
    if (lowerIsBetter) {
      rank =
        sortedValues.filter((v) => v > institutionValue).length /
        sortedValues.length;
    } else {
      rank =
        sortedValues.filter((v) => v < institutionValue).length /
        sortedValues.length;
    }

    return Math.round(rank * 100);
  }

  private async calculatePerformancePercentile(
    institutionId: string,
    metric: string,
  ): Promise<number> {
    // Build the correct SQL expression based on metric type
    const getMetricExpression = (metricName: string): string => {
      switch (metricName) {
        case 'avg':
          return 'AVG(analytics.executionTime)';
        case 'p50':
          return 'PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY analytics.executionTime)';
        case 'p95':
          return 'PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY analytics.executionTime)';
        case 'p99':
          return 'PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY analytics.executionTime)';
        default:
          return 'AVG(analytics.executionTime)';
      }
    };

    // Get institution's performance value
    const institutionPerf = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select(getMetricExpression(metric), 'value')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.executionTime IS NOT NULL')
      .getRawOne();

    const institutionValue = parseFloat(institutionPerf?.value || 0);

    // Get all institutions' performance values
    const allInstitutions = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('DISTINCT analytics.institutionId', 'institutionId')
      .where('analytics.institutionId IS NOT NULL')
      .getRawMany();

    const values = await Promise.all(
      allInstitutions.map(async (inst) => {
        const perf = await this.searchAnalyticsRepository
          .createQueryBuilder('analytics')
          .select(getMetricExpression(metric), 'value')
          .where('analytics.institutionId = :institutionId', {
            institutionId: inst.institutionId,
          })
          .andWhere('analytics.executionTime IS NOT NULL')
          .getRawOne();
        return parseFloat(perf?.value || 0);
      }),
    );

    // Calculate percentile rank (lower latency is better)
    const sortedValues = values.sort((a, b) => a - b);
    const rank =
      sortedValues.filter((v) => v > institutionValue).length /
      sortedValues.length;

    return Math.round(rank * 100);
  }
}
