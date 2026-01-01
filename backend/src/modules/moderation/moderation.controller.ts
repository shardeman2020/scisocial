import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { ModerationService } from './moderation.service';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post('flag')
  async flagContent(
    @Body()
    body: {
      entityType: 'post' | 'topic' | 'journal' | 'user';
      entityId: string;
      flagType: 'misinformation' | 'spam' | 'harassment' | 'low-quality' | 'other';
      description?: string;
      flaggedBy?: string;
    },
  ) {
    return this.moderationService.flagContent(body);
  }

  @Get('events')
  async getEvents(
    @Query('status') status?: string,
    @Query('entityType') entityType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.moderationService.getEvents({
      status,
      entityType,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('events/:id')
  async getEventById(@Param('id') id: string) {
    return this.moderationService.getEventById(id);
  }

  @Patch('events/:id')
  async updateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'reviewed' | 'resolved' | 'dismissed';
      reviewedBy: string;
      reviewNote?: string;
    },
  ) {
    return this.moderationService.updateStatus(id, body);
  }

  @Get('events/:id/log')
  async getTransparencyLog(@Param('id') entityId: string) {
    return this.moderationService.getTransparencyLog(entityId);
  }

  @Get('stats')
  async getStats() {
    return this.moderationService.getModerationStats();
  }
}
