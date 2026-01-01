import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Journal } from './journal.entity';

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
  ) {}

  async findAll(): Promise<Journal[]> {
    return this.journalRepository.find({
      order: { impactFactor: 'DESC' },
    });
  }

  async findBySlug(slug: string): Promise<Journal> {
    return this.journalRepository.findOne({
      where: { slug },
    });
  }

  async findById(id: string): Promise<Journal> {
    return this.journalRepository.findOne({
      where: { id },
    });
  }

  async create(
    name: string,
    description?: string,
    impactFactor?: number,
    publisher?: string,
  ): Promise<Journal> {
    const slug = name.toLowerCase().replace(/\s+/g, '-');
    const journal = this.journalRepository.create({
      name,
      slug,
      description,
      impactFactor,
      publisher,
    });
    return this.journalRepository.save(journal);
  }

  async incrementFollowerCount(journalId: string): Promise<void> {
    await this.journalRepository.increment(
      { id: journalId },
      'followerCount',
      1,
    );
  }

  async decrementFollowerCount(journalId: string): Promise<void> {
    await this.journalRepository.decrement(
      { id: journalId },
      'followerCount',
      1,
    );
  }

  async incrementArticleCount(journalId: string): Promise<void> {
    await this.journalRepository.increment(
      { id: journalId },
      'articleCount',
      1,
    );
  }
}
