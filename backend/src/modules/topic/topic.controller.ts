import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TopicService } from './topic.service';

@Controller('topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Get()
  async findAll() {
    return this.topicService.findAll();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.topicService.findBySlug(slug);
  }

  @Post()
  async create(@Body() body: { name: string; description?: string }) {
    return this.topicService.create(body.name, body.description);
  }
}
