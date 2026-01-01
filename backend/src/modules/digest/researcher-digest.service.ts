import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ResearcherDigest } from './researcher-digest.entity';
import { SearchAnalytics } from '../search-analytics/search-analytics.entity';
import { ModerationEvent } from '../moderation/moderation-event.entity';
import { User } from '../user/user.entity';

@Injectable()
export class ResearcherDigestService {
  constructor(
    @InjectRepository(ResearcherDigest)
    private researcherDigestRepository: Repository<ResearcherDigest>,
    @InjectRepository(SearchAnalytics)
    private searchAnalyticsRepository: Repository<SearchAnalytics>,
    @InjectRepository(ModerationEvent)
    private moderationEventRepository: Repository<ModerationEvent>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Run every Sunday at midnight
  @Cron(CronExpression.EVERY_WEEK)
  async generateWeeklyDigestsForAllResearchers(): Promise<void> {
    console.log('Starting weekly researcher digest generation...');

    // Get all users who have search activity in the past week
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const activeUsers = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('DISTINCT analytics.userId', 'userId')
      .where('analytics.userId IS NOT NULL')
      .andWhere('analytics.createdAt BETWEEN :weekStart AND :now', { weekStart, now })
      .getRawMany();

    console.log(`Found ${activeUsers.length} active researchers for digest generation`);

    for (const { userId } of activeUsers) {
      try {
        await this.generateWeeklyDigest(userId);
        console.log(`Generated digest for researcher ${userId}`);
      } catch (error) {
        console.error(`Failed to generate digest for researcher ${userId}:`, error);
      }
    }

    console.log('Weekly researcher digest generation completed');
  }

  async generateWeeklyDigest(userId: string): Promise<ResearcherDigest> {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(now);
    weekEnd.setHours(23, 59, 59, 999);

    // Get top queries
    const topQueries = await this.getTopQueries(userId, weekStart, weekEnd);

    // Get model usage
    const modelUsage = await this.getModelUsage(userId, weekStart, weekEnd);

    // Get search mode usage
    const searchModeUsage = await this.getSearchModeUsage(userId, weekStart, weekEnd);

    // Get performance metrics
    const performanceMetrics = await this.getPerformanceMetrics(userId, weekStart, weekEnd);

    // Get moderation activity
    const moderationActivity = await this.getModerationActivity(userId, weekStart, weekEnd);

    // Create digest
    const digest = this.researcherDigestRepository.create({
      userId,
      weekStart,
      weekEnd,
      topQueries,
      modelUsage,
      searchModeUsage,
      performanceMetrics,
      moderationActivity,
    });

    return this.researcherDigestRepository.save(digest);
  }

  private async getTopQueries(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<Array<{ query: string; count: number; percent: number }>> {
    const queries = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.query', 'query')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.userId = :userId', { userId })
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
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.model', 'model')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.userId = :userId', { userId })
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
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    const results = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('analytics.mode', 'mode')
      .addSelect('COUNT(*)', 'count')
      .where('analytics.userId = :userId', { userId })
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
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    const avgResult = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('AVG(analytics.executionTime)', 'avg')
      .where('analytics.userId = :userId', { userId })
      .andWhere('analytics.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
      .andWhere('analytics.executionTime IS NOT NULL')
      .getRawOne();

    const percentiles = await this.searchAnalyticsRepository
      .createQueryBuilder('analytics')
      .select('PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY analytics.executionTime)', 'p50')
      .addSelect('PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY analytics.executionTime)', 'p95')
      .addSelect('PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY analytics.executionTime)', 'p99')
      .where('analytics.userId = :userId', { userId })
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

  private async getModerationActivity(
    userId: string,
    weekStart: Date,
    weekEnd: Date,
  ): Promise<any> {
    // Get moderation events flagged by this user
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
          flaggedBy: userId,
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository.count({
        where: {
          flaggedBy: userId,
          status: 'pending',
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository.count({
        where: {
          flaggedBy: userId,
          status: 'reviewed',
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository.count({
        where: {
          flaggedBy: userId,
          status: 'resolved',
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository.count({
        where: {
          flaggedBy: userId,
          status: 'dismissed',
          createdAt: Between(weekStart, weekEnd),
        },
      }),
      this.moderationEventRepository
        .createQueryBuilder('event')
        .select('event.flagType', 'flagType')
        .addSelect('COUNT(*)', 'count')
        .where('event.flaggedBy = :userId', { userId })
        .andWhere('event.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
        .groupBy('event.flagType')
        .getRawMany(),
      this.moderationEventRepository
        .createQueryBuilder('event')
        .select('event.entityType', 'entityType')
        .addSelect('COUNT(*)', 'count')
        .where('event.flaggedBy = :userId', { userId })
        .andWhere('event.createdAt BETWEEN :weekStart AND :weekEnd', { weekStart, weekEnd })
        .groupBy('event.entityType')
        .getRawMany(),
    ]);

    return {
      totalFlagged,
      pending,
      reviewed,
      resolved,
      dismissed,
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

  async getLatestDigest(userId: string): Promise<ResearcherDigest | null> {
    return this.researcherDigestRepository.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDigestHistory(
    userId: string,
    limit: number = 10,
  ): Promise<ResearcherDigest[]> {
    return this.researcherDigestRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
