import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InstitutionalDigest } from './institutional-digest.entity';
import { SearchAnalytics } from '../search-analytics/search-analytics.entity';
import { ModerationEvent } from '../moderation/moderation-event.entity';

@Injectable()
export class InstitutionalDigestService {
  constructor(
    @InjectRepository(InstitutionalDigest)
    private institutionalDigestRepository: Repository<InstitutionalDigest>,
    @InjectRepository(SearchAnalytics)
    private searchAnalyticsRepository: Repository<SearchAnalytics>,
    @InjectRepository(ModerationEvent)
    private moderationEventRepository: Repository<ModerationEvent>,
  ) {}

  // Run every Sunday at midnight
  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyDigestsForAllInstitutions(): Promise<void> {
    console.log('Starting weekly institutional digest generation...');

    // Get all unique institution IDs from search analytics
    const institutions = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('DISTINCT analytics.institutionId', 'institutionId')
      .where('analytics.institutionId IS NOT NULL')
      .getRawMany();

    console.log(`Found ${institutions.length} institutions for digest generation`);

    for (const { institutionId } of institutions) {
      try {
        await this.generateWeeklyDigest(institutionId);
        console.log(`Generated digest for institution ${institutionId}`);
      } catch (error) {
        console.error(`Failed to generate digest for institution ${institutionId}:`, error);
      }
    }

    console.log('Weekly institutional digest generation completed');
  }

  async generateWeeklyDigest(institutionId: string): Promise<InstitutionalDigest> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Get top queries
    const topQueries = await this.getTopQueries(institutionId, weekStart, weekEnd);

    // Get model usage
    const modelUsage = await this.getModelUsage(institutionId, weekStart, weekEnd);

    // Get search mode usage
    const searchModeUsage = await this.getSearchModeUsage(institutionId, weekStart, weekEnd);

    // Get performance metrics
    const performanceMetrics = await this.getPerformanceMetrics(institutionId, weekStart, weekEnd);

    // Get moderation stats
    const moderationStats = await this.getModerationStats(institutionId, weekStart, weekEnd);

    // Create digest
    const digest = this.institutionalDigestRepository.create({
      institutionId,
      weekStart,
      weekEnd,
      topQueries,
      modelUsage,
      searchModeUsage,
      performanceMetrics,
      moderationStats,
    });

    return this.institutionalDigestRepository.save(digest);
  }

  private async getTopQueries(
    institutionId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<Array<{ query: string; count: number; percent: number }>> {
    const queries = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
      .groupBy('analytics.query')
      .orderBy('COUNT(*)', 'DESC')
      .limit(5)
      .getRawMany();

    const total = queries.reduce((sum, q) => sum + parseInt(q.count, 10), 0);

    return queries.map((q) => ({
      query: q.query,
      count: parseInt(q.count, 10),
      percent: total > 0 ? (parseInt(q.count, 10) / total) * 100 : 0,
    }));
  }

  private async getModelUsage(
    institutionId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.model', 'model')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
      .andWhere('analytics.model IS NOT NULL')
      .groupBy('analytics.model')
      .getRawMany();

    const total = results.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
    const general = results.find((r) => r.model === 'general')?.count || 0;
    const biomed = results.find((r) => r.model === 'biomed')?.count || 0;
    const legal = results.find((r) => r.model === 'legal')?.count || 0;
    const physics = results.find((r) => r.model === 'physics')?.count || 0;

    return {
      total,
      general: parseInt(general, 10),
      biomed: parseInt(biomed, 10),
      legal: parseInt(legal, 10),
      physics: parseInt(physics, 10),
      generalPercent: total > 0 ? (parseInt(general, 10) / total) * 100 : 0,
      biomedPercent: total > 0 ? (parseInt(biomed, 10) / total) * 100 : 0,
      legalPercent: total > 0 ? (parseInt(legal, 10) / total) * 100 : 0,
      physicsPercent: total > 0 ? (parseInt(physics, 10) / total) * 100 : 0,
    };
  }

  private async getSearchModeUsage(
    institutionId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.mode', 'mode')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
      .groupBy('analytics.mode')
      .getRawMany();

    const total = results.reduce((sum, r) => sum + parseInt(r.count, 10), 0);
    const keywordCount = results.find((r) => r.mode === 'keyword')?.count || 0;
    const semanticCount = results.find((r) => r.mode === 'semantic')?.count || 0;
    const hybridCount = results.find((r) => r.mode === 'hybrid')?.count || 0;

    return {
      total,
      keywordCount: parseInt(keywordCount, 10),
      semanticCount: parseInt(semanticCount, 10),
      hybridCount: parseInt(hybridCount, 10),
      keywordPercent: total > 0 ? (parseInt(keywordCount, 10) / total) * 100 : 0,
      semanticPercent: total > 0 ? (parseInt(semanticCount, 10) / total) * 100 : 0,
      hybridPercent: total > 0 ? (parseInt(hybridCount, 10) / total) * 100 : 0,
    };
  }

  private async getPerformanceMetrics(
    institutionId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    const avgResult = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.executionTime)', 'avg')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
      .andWhere('analytics.executionTime IS NOT NULL')
      .getRawOne();

    const percentiles = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY analytics.executionTime)', 'p50')
      .addSelect('PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY analytics.executionTime)', 'p95')
      .addSelect('PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY analytics.executionTime)', 'p99')
      .where('analytics.institutionId = :institutionId', { institutionId })
      .andWhere('analytics.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
      .andWhere('analytics.executionTime IS NOT NULL')
      .getRawOne();

    return {
      avgExecutionTime: parseFloat(avgResult?.avg || 0),
      p50: parseFloat(percentiles?.p50 || 0),
      p95: parseFloat(percentiles?.p95 || 0),
      p99: parseFloat(percentiles?.p99 || 0),
    };
  }

  private async getModerationStats(
    institutionId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    // Note: This assumes moderation events can be linked to institutions
    // You may need to join through the entity being flagged to get institutionId
    const [
      totalFlagged,
      pending,
      reviewed,
      resolved,
      dismissed,
      byFlagType,
      byEntityType,
    ] = await Promise.all([
      this.moderationEventRepository.count({
        where: {
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository.count({
        where: {
          status: 'pending',
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository.count({
        where: {
          status: 'reviewed',
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository.count({
        where: {
          status: 'resolved',
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository.count({
        where: {
          status: 'dismissed',
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository
        .createQueryBuilder('event')
        .select('event.flagType', 'flagType')
        .addSelect('COUNT(*)', 'count')
        .where('event.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
        .groupBy('event.flagType')
        .getRawMany(),
      this.moderationEventRepository
        .createQueryBuilder('event')
        .select('event.entityType', 'entityType')
        .addSelect('COUNT(*)', 'count')
        .where('event.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
        .groupBy('event.entityType')
        .getRawMany(),
    ]);

    const resolvedAndDismissed = resolved + dismissed;

    return {
      totalFlagged,
      pending,
      reviewed,
      resolved,
      dismissed,
      resolvedPercent: totalFlagged > 0 ? (resolved / totalFlagged) * 100 : 0,
      dismissedPercent: totalFlagged > 0 ? (dismissed / totalFlagged) * 100 : 0,
      byFlagType: byFlagType.map((item) => ({
        flagType: item.flagType,
        count: parseInt(item.count, 10),
      })),
      byEntityType: byEntityType.map((item) => ({
        entityType: item.entityType,
        count: parseInt(item.count, 10),
      })),
    };
  }

  async getLatestDigest(institutionId: string): Promise<InstitutionalDigest | null> {
    return this.institutionalDigestRepository.findOne({
      where: { institutionId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDigestHistory(
    institutionId: string,
    limit: number = 10,
  ): Promise<InstitutionalDigest[]> {
    return this.institutionalDigestRepository.find({
      where: { institutionId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
