import { Controller, Get, Query } from '@nestjs/common';
import { SearchAnalyticsService } from './search-analytics.service';

@Controller('analytics/searches')
export class SearchAnalyticsController {
  constructor(private readonly searchAnalyticsService: SearchAnalyticsService) {}

  @Get('top-queries')
  async getTopQueries(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.searchAnalyticsService.getTopQueries(limitNum);
  }

  @Get('top-filters')
  async getTopFilters(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.searchAnalyticsService.getTopFilters(limitNum);
  }

  @Get('by-institution')
  async getSearchesByInstitution() {
    return this.searchAnalyticsService.getSearchesByInstitution();
  }

  @Get('summary')
  async getSummary() {
    const [totalSearches, uniqueUsers, avgResultCount] = await Promise.all([
      this.searchAnalyticsService.getTotalSearchCount(),
      this.searchAnalyticsService.getUniqueUsersCount(),
      this.searchAnalyticsService.getAverageResultCount(),
    ]);

    return {
      totalSearches,
      uniqueUsers,
      avgResultCount: Math.round(avgResultCount * 10) / 10, // Round to 1 decimal
    };
  }

  @Get('hybrid-usage')
  async getHybridUsage() {
    return this.searchAnalyticsService.getHybridUsageStats();
  }

  @Get('weight-distribution')
  async getWeightDistribution() {
    return this.searchAnalyticsService.getWeightDistribution();
  }

  @Get('thresholds')
  async getThresholdDistribution() {
    return this.searchAnalyticsService.getThresholdDistribution();
  }

  @Get('model-usage')
  async getModelUsage() {
    return this.searchAnalyticsService.getModelUsageStats();
  }

  @Get('performance/metrics')
  async getPerformanceMetrics() {
    return this.searchAnalyticsService.getPerformanceMetrics();
  }

  @Get('performance/by-mode')
  async getPerformanceByMode() {
    return this.searchAnalyticsService.getPerformanceByMode();
  }

  @Get('performance/slow-queries')
  async getSlowQueries(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.searchAnalyticsService.getSlowQueries(limitNum);
  }
}
