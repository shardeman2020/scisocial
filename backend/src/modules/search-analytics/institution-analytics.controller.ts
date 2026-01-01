import { Controller, Get, Param, Query } from '@nestjs/common';
import { InstitutionAnalyticsService } from './institution-analytics.service';

@Controller('analytics/institutions')
export class InstitutionAnalyticsController {
  constructor(
    private readonly institutionAnalyticsService: InstitutionAnalyticsService,
  ) {}

  @Get(':id/overview')
  async getOverview(@Param('id') institutionId: string) {
    return this.institutionAnalyticsService.getOverview(institutionId);
  }

  @Get(':id/top-queries')
  async getTopQueries(
    @Param('id') institutionId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.institutionAnalyticsService.getTopQueries(institutionId, limitNum);
  }

  @Get(':id/model-usage')
  async getModelUsage(@Param('id') institutionId: string) {
    return this.institutionAnalyticsService.getModelUsage(institutionId);
  }

  @Get(':id/thresholds')
  async getThresholds(@Param('id') institutionId: string) {
    return this.institutionAnalyticsService.getThresholds(institutionId);
  }
}
