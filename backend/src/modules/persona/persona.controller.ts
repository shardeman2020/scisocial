import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { PersonaService } from './persona.service';
import {
  FeedPreference,
  CredibilitySignal,
  EngagementStyle,
} from './persona.entity';

@Controller('personas')
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  @Get()
  async findAll() {
    return this.personaService.findAll();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.personaService.findBySlug(slug);
  }

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      description: string;
      preferredFields: string[];
      feedPreferences: FeedPreference[];
      credibilitySignals: CredibilitySignal[];
      engagementStyle: EngagementStyle;
      coldStartDefaults?: any;
    },
  ) {
    return this.personaService.create(
      body.name,
      body.description,
      body.preferredFields,
      body.feedPreferences,
      body.credibilitySignals,
      body.engagementStyle,
      body.coldStartDefaults,
    );
  }
}
