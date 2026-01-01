import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { InstitutionService } from './institution.service';
import { InstitutionType } from './institution.entity';

@Controller('institutions')
export class InstitutionController {
  constructor(private readonly institutionService: InstitutionService) {}

  @Get()
  async findAll() {
    return this.institutionService.findAll();
  }

  @Get(':slug')
  async findBySlug(@Param('slug') slug: string) {
    return this.institutionService.findBySlug(slug);
  }

  @Post()
  async create(
    @Body()
    body: {
      name: string;
      domains: string[];
      type: InstitutionType;
      description?: string;
      location?: string;
      website?: string;
    },
  ) {
    return this.institutionService.create(
      body.name,
      body.domains,
      body.type,
      body.description,
      body.location,
      body.website,
    );
  }

  @Get('verify/domain/:domain')
  async verifyDomain(@Param('domain') domain: string) {
    const institution = await this.institutionService.findByDomain(domain);
    return {
      isValid: !!institution,
      institution: institution || null,
    };
  }
}
