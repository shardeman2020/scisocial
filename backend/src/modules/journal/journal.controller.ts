import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { JournalService } from './journal.service';

@Controller('journals')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  async findAll() {
    return this.journalService.findAll();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.journalService.findBySlug(slug);
  }

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      description?: string;
      impactFactor?: number;
      publisher?: string;
    },
  ) {
    return this.journalService.create(
      body.name,
      body.description,
      body.impactFactor,
      body.publisher,
    );
  }
}
