import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { ResearcherDigestService } from './researcher-digest.service';

@Controller('digest/researchers')
export class ResearcherDigestController {
  constructor(
    private readonly researcherDigestService: ResearcherDigestService,
  ) {}

  @Get(':id/latest')
  async getLatestDigest(@Param('id') userId: string) {
    return this.researcherDigestService.getLatestDigest(userId);
  }

  @Get(':id/history')
  async getDigestHistory(
    @Param('id') userId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.researcherDigestService.getDigestHistory(userId, limitNum);
  }

  @Post(':id/generate')
  async generateDigest(@Param('id') userId: string) {
    return this.researcherDigestService.generateWeeklyDigest(userId);
  }
}
