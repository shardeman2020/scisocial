import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Persona,
  FeedPreference,
  CredibilitySignal,
  EngagementStyle,
} from './persona.entity';

@Injectable()
export class PersonaService {
  constructor(
    @InjectRepository(Persona)
    private personaRepository: Repository<Persona>,
  ) {}

  async create(
    name: string,
    description: string,
    preferredFields: string[],
    feedPreferences: FeedPreference[],
    credibilitySignals: CredibilitySignal[],
    engagementStyle: EngagementStyle,
    coldStartDefaults?: any,
  ): Promise<Persona> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const persona = this.personaRepository.create({
      name,
      slug,
      description,
      preferredFields,
      feedPreferences,
      credibilitySignals,
      engagementStyle,
      coldStartDefaults,
    });

    return this.personaRepository.save(persona);
  }

  async findAll(): Promise<Persona[]> {
    return this.personaRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Persona> {
    return this.personaRepository.findOne({ where: { slug } });
  }

  async findById(id: string): Promise<Persona> {
    return this.personaRepository.findOne({ where: { id } });
  }
}
