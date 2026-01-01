import { Controller, Get, Param } from '@nestjs/common';
import { BenchmarkingService } from './benchmarking.service';

@Controller('analytics/benchmarking')
export class BenchmarkingController {
  constructor(private readonly benchmarkingService: BenchmarkingService) {}

  @Get(':id/overview')
  async getOverview(@Param('id') institutionId: string) {
    return this.benchmarkingService.getBenchmarkOverview(institutionId);
  }

  @Get(':id/model-usage')
  async getModelUsage(@Param('id') institutionId: string) {
    return this.benchmarkingService.getBenchmarkModelUsage(institutionId);
  }

  @Get(':id/top-queries')
  async getTopQueries(@Param('id') institutionId: string) {
    return this.benchmarkingService.getBenchmarkTopQueries(institutionId);
  }

  @Get(':id/performance')
  async getPerformance(@Param('id') institutionId: string) {
    return this.benchmarkingService.getBenchmarkPerformance(institutionId);
  }
}
