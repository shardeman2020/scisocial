import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution, InstitutionType } from './institution.entity';

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
  ) {}

  async create(
    name: string,
    domains: string[],
    type: InstitutionType,
    description?: string,
    location?: string,
    website?: string,
  ): Promise<Institution> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const institution = this.institutionRepository.create({
      name,
      slug,
      domains,
      type,
      description,
      location,
      website,
    });

    return this.institutionRepository.save(institution);
  }

  async findAll(): Promise<Institution[]> {
    return this.institutionRepository.find({
      order: { verifiedUserCount: 'DESC', name: 'ASC' },
    });
  }

  async findBySlug(slug: string): Promise<Institution> {
    return this.institutionRepository.findOne({ where: { slug } });
  }

  async findById(id: string): Promise<Institution> {
    return this.institutionRepository.findOne({ where: { id } });
  }

  async findByDomain(domain: string): Promise<Institution> {
    const institutions = await this.institutionRepository.find();
    return institutions.find((inst) => inst.domains.includes(domain));
  }

  async incrementVerifiedUserCount(institutionId: string): Promise<void> {
    await this.institutionRepository.increment(
      { id: institutionId },
      'verifiedUserCount',
      1,
    );
  }

  async decrementVerifiedUserCount(institutionId: string): Promise<void> {
    await this.institutionRepository.decrement(
      { id: institutionId },
      'verifiedUserCount',
      1,
    );
  }

  async incrementPostCount(institutionId: string): Promise<void> {
    await this.institutionRepository.increment(
      { id: institutionId },
      'postCount',
      1,
    );
  }

  async verifyInstitution(institutionId: string): Promise<void> {
    await this.institutionRepository.update(institutionId, {
      isVerified: true,
    });
  }
}
