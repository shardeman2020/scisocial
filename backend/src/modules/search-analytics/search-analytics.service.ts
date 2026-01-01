import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchAnalytics } from './search-analytics.entity';

@Injectable()
export class SearchAnalyticsService {
  constructor(
    @InjectRepository(SearchAnalytics)
    private searchAnalyticsRepository: Repository<SearchAnalytics>,
  ) {}

  async trackSearch(
    userId: string,
    query: string,
    filters: any,
    resultCount: number,
    mode?: 'keyword' | 'semantic' | 'hybrid',
    semanticWeight?: number,
    keywordWeight?: number,
    threshold?: number,
    executionTime?: number,
    model?: string,
    institutionId?: string,
  ): Promise<SearchAnalytics> {
    const analytics = this.searchAnalyticsRepository.create({
      userId,
      query,
      filters,
      resultCount,
      mode,
      model,
      semanticWeight,
      keywordWeight,
      threshold,
      executionTime,
      institutionId,
    });
    return this.searchAnalyticsRepository.save(analytics);
  }

  async getTopQueries(limit: number = 10): Promise<any[]> {
    return this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .groupBy('analytics.query')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async getTopFilters(limit: number = 10): Promise<any[]> {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.filters')
      .where('analytics.filters IS NOT NULL')
      .getMany();

    // Aggregate filter usage
    const filterCounts: Record<string, number> = {};

    results.forEach((result) => {
      if (result.filters) {
        Object.keys(result.filters).forEach((key) => {
          const value = result.filters[key];
          const filterKey = `${key}: ${JSON.stringify(value)}`;
          filterCounts[filterKey] = (filterCounts[filterKey] || 0) + 1;
        });
      }
    });

    // Convert to array and sort
    return Object.entries(filterCounts)
      .map(([filter, count]) => ({ filter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async getSearchesByInstitution(): Promise<any[]> {
    return this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .leftJoin('analytics.user', 'user')
      .leftJoin('user.institution', 'institution')
      .select('institution.name', 'institution')
      .addSelect('COUNT(*)', 'count')
      .where('institution.name IS NOT NULL')
      .groupBy('institution.name')
      .orderBy('count', 'DESC')
      .getRawMany();
  }

  async getTotalSearchCount(): Promise<number> {
    return this.searchAnalyticsRepository.count();
  }

  async getUniqueUsersCount(): Promise<number> {
    const result = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('COUNT(DISTINCT analytics.userId)', 'count')
      .getRawOne();
    return parseInt(result.count, 10);
  }

  async getAverageResultCount(): Promise<number> {
    const result = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.resultCount)', 'avg')
      .getRawOne();
    return parseFloat(result.avg) || 0;
  }

  // ========== HYBRID SEARCH ANALYTICS ==========

  async getHybridUsageStats(): Promise<{
    total: number;
    keyword: number;
    semantic: number;
    hybrid: number;
    keywordPercent: number;
    semanticPercent: number;
    hybridPercent: number;
  }> {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.mode', 'mode')
      .addSelect('COUNT(*)', 'count')
      .groupBy('analytics.mode')
      .getRawMany();

    const stats = {
      total: 0,
      keyword: 0,
      semantic: 0,
      hybrid: 0,
      keywordPercent: 0,
      semanticPercent: 0,
      hybridPercent: 0,
    };

    results.forEach((result) => {
      const count = parseInt(result.count, 10);
      stats.total += count;

      if (result.mode === 'keyword') stats.keyword = count;
      else if (result.mode === 'semantic') stats.semantic = count;
      else if (result.mode === 'hybrid') stats.hybrid = count;
    });

    if (stats.total > 0) {
      stats.keywordPercent = Math.round((stats.keyword / stats.total) * 100);
      stats.semanticPercent = Math.round((stats.semantic / stats.total) * 100);
      stats.hybridPercent = Math.round((stats.hybrid / stats.total) * 100);
    }

    return stats;
  }

  async getWeightDistribution(): Promise<{
    avgSemanticWeight: number;
    avgKeywordWeight: number;
    hybridSearchCount: number;
  }> {
    const result = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.semanticWeight)', 'avgSemanticWeight')
      .addSelect('AVG(analytics.keywordWeight)', 'avgKeywordWeight')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.mode = :mode', { mode: 'hybrid' })
      .getRawOne();

    return {
      avgSemanticWeight: parseFloat(result.avgSemanticWeight) || 0,
      avgKeywordWeight: parseFloat(result.avgKeywordWeight) || 0,
      hybridSearchCount: parseInt(result.count, 10) || 0,
    };
  }

  async getThresholdDistribution(): Promise<
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
      .where('analytics.threshold IS NOT NULL')
      .groupBy('threshold')
      .orderBy('threshold', 'ASC')
      .getRawMany();

    return results.map((result) => ({
      threshold: result.threshold,
      count: parseInt(result.count, 10),
    }));
  }

  // ========== PERFORMANCE ANALYTICS ==========

  async getPerformanceMetrics(): Promise<{
    avgExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    p50: number;
    p95: number;
    p99: number;
    totalQueries: number;
  }> {
    // Get basic stats
    const basicStats = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.executionTime)', 'avg')
      .addSelect('MIN(analytics.executionTime)', 'min')
      .addSelect('MAX(analytics.executionTime)', 'max')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.executionTime IS NOT NULL')
      .getRawOne();

    // Get percentiles using PostgreSQL's percentile_cont function
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
      .where('analytics.executionTime IS NOT NULL')
      .getRawOne();

    return {
      avgExecutionTime: parseFloat(basicStats.avg) || 0,
      minExecutionTime: parseFloat(basicStats.min) || 0,
      maxExecutionTime: parseFloat(basicStats.max) || 0,
      p50: parseFloat(percentiles.p50) || 0,
      p95: parseFloat(percentiles.p95) || 0,
      p99: parseFloat(percentiles.p99) || 0,
      totalQueries: parseInt(basicStats.count, 10) || 0,
    };
  }

  async getPerformanceByMode(): Promise<
    Array<{
      mode: string;
      avgExecutionTime: number;
      minExecutionTime: number;
      maxExecutionTime: number;
      count: number;
    }>
  > {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.mode', 'mode')
      .addSelect('AVG(analytics.executionTime)', 'avg')
      .addSelect('MIN(analytics.executionTime)', 'min')
      .addSelect('MAX(analytics.executionTime)', 'max')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.executionTime IS NOT NULL')
      .andWhere('analytics.mode IS NOT NULL')
      .groupBy('analytics.mode')
      .getRawMany();

    return results.map((result) => ({
      mode: result.mode,
      avgExecutionTime: parseFloat(result.avg) || 0,
      minExecutionTime: parseFloat(result.min) || 0,
      maxExecutionTime: parseFloat(result.max) || 0,
      count: parseInt(result.count, 10) || 0,
    }));
  }

  async getSlowQueries(limit: number = 10): Promise<
    Array<{
      query: string;
      executionTime: number;
      mode: string;
      resultCount: number;
      timestamp: Date;
    }>
  > {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select([
        'analytics.query',
        'analytics.executionTime',
        'analytics.mode',
        'analytics.resultCount',
        'analytics.timestamp',
      ])
      .where('analytics.executionTime IS NOT NULL')
      .orderBy('analytics.executionTime', 'DESC')
      .limit(limit)
      .getMany();

    return results.map((result) => ({
      query: result.query,
      executionTime: result.executionTime,
      mode: result.mode,
      resultCount: result.resultCount,
      timestamp: result.timestamp,
    }));
  }

  // ========== MODEL USAGE ANALYTICS ==========

  async getModelUsageStats(): Promise<{
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
      .where('analytics.model IS NOT NULL')
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
}
