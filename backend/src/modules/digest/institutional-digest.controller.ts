import { Controller, Get, Param, Query, Post } from '@nestjs/common';
import { InstitutionalDigestService } from './institutional-digest.service';

@Controller('digest/institutions')
export class InstitutionalDigestController {
  constructor(
    private readonly institutionalDigestService: InstitutionalDigestService,
  ) {}

  @Get(':id/latest')
  async getLatestDigest(@Param('id') institutionId: string) {
    return this.institutionalDigestService.getLatestDigest(institutionId);
  }

  @Get(':id/history')
  async getDigestHistory(
    @Param('id') institutionId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.institutionalDigestService.getDigestHistory(
      institutionId,
      limitNum,
    );
  }

  @Post(':id/generate')
  async generateDigest(@Param('id') institutionId: string) {
    return this.institutionalDigestService.generateWeeklyDigest(institutionId);
  }
}
