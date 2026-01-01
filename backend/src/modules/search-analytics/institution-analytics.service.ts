import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchAnalytics } from './search-analytics.entity';

@Injectable()
export class InstitutionAnalyticsService {
  constructor(
    @InjectRepository(SearchAnalytics)
    private searchAnalyticsRepository: Repository<SearchAnalytics>,
  ) {}

  async getOverview(institutionId: string): Promise<{
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
  }> {
    // Get mode distribution
    const modeResults = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.mode', 'mode')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .groupBy('analytics.mode')
      .getRawMany();

    const stats = {
      totalSearches: 0,
      keywordCount: 0,
      semanticCount: 0,
      hybridCount: 0,
      keywordPercent: 0,
      semanticPercent: 0,
      hybridPercent: 0,
      avgExecutionTime: 0,
      p50: 0,
      p95: 0,
      p99: 0,
    };

    modeResults.forEach((result) => {
      const count = parseInt(result.count, 10);
      stats.totalSearches += count;

      if (result.mode === 'keyword') stats.keywordCount = count;
      else if (result.mode === 'semantic') stats.semanticCount = count;
      else if (result.mode === 'hybrid') stats.hybridCount = count;
    });

    if (stats.totalSearches > 0) {
      stats.keywordPercent = Math.round((stats.keywordCount / stats.totalSearches) * 100);
      stats.semanticPercent = Math.round((stats.semanticCount / stats.totalSearches) * 100);
      stats.hybridPercent = Math.round((stats.hybridCount / stats.totalSearches) * 100);
    }

    // Get performance metrics
    const performanceStats = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.executionTime)', 'avg')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.executionTime IS NOT NULL')
      .getRawOne();

    stats.avgExecutionTime = parseFloat(performanceStats?.avg) || 0;

    // Get percentiles
    const percentiles = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select(
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

    if (percentiles) {
      stats.p50 = parseFloat(percentiles.p50) || 0;
      stats.p95 = parseFloat(percentiles.p95) || 0;
      stats.p99 = parseFloat(percentiles.p99) || 0;
    }

    return stats;
  }

  async getTopQueries(institutionId: string, limit: number = 10): Promise<Array<{
    query: string;
    count: number;
    percent: number;
  }>> {
    // Get total for percentage calculation
    const totalResult = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(*)', 'total')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .getRawOne();

    const total = parseInt(totalResult?.total || '0', 10);

    // Get top queries
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .groupBy('analytics.query')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return results.map((result) => ({
      query: result.query,
      count: parseInt(result.count, 10),
      percent: total > 0 ? Math.round((parseInt(result.count, 10) / total) * 100) : 0,
    }));
  }

  async getModelUsage(institutionId: string): Promise<{
    total: number;
    general: number;
    biomed: number;
    legal: number;
    physics: number;
    generalPercent: number;
    biomedPercent: number;
    legalPercent: number;
    physicsPercent: number;
  }> {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.model', 'model')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.model IS NOT NULL')
      .groupBy('analytics.model')
      .getRawMany();

    const stats = {
      total: 0,
      general: 0,
      biomed: 0,
      legal: 0,
      physics: 0,
      generalPercent: 0,
      biomedPercent: 0,
      legalPercent: 0,
      physicsPercent: 0,
    };

    results.forEach((result) => {
      const count = parseInt(result.count, 10);
      stats.total += count;

      if (result.model === 'general') stats.general = count;
      else if (result.model === 'biomed') stats.biomed = count;
      else if (result.model === 'legal') stats.legal = count;
      else if (result.model === 'physics') stats.physics = count;
    });

    if (stats.total > 0) {
      stats.generalPercent = Math.round((stats.general / stats.total) * 100);
      stats.biomedPercent = Math.round((stats.biomed / stats.total) * 100);
      stats.legalPercent = Math.round((stats.legal / stats.total) * 100);
      stats.physicsPercent = Math.round((stats.physics / stats.total) * 100);
    }

    return stats;
  }

  async getThresholds(institutionId: string): Promise<
    Array<{ threshold: string; count: number }>
  > {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select(
        `
        CASE
          WHEN analytics.threshold = 0 THEN '0.0 (no filter)'
          WHEN analytics.threshold BETWEEN 0.01 AND 0.3 THEN '0.01-0.30'
          WHEN analytics.threshold BETWEEN 0.31 AND 0.5 THEN '0.31-0.50'
          WHEN analytics.threshold BETWEEN 0.51 AND 0.7 THEN '0.51-0.70'
          WHEN analytics.threshold BETWEEN 0.71 AND 1.0 THEN '0.71-1.00'
          ELSE 'other'
        END
      `,
        'threshold',
      )
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.threshold IS NOT NULL')
      .groupBy('threshold')
      .orderBy('threshold', 'ASC')
      .getRawMany();

    return results.map((result) => ({
      threshold: result.threshold,
      count: parseInt(result.count, 10),
    }));
  }
}
