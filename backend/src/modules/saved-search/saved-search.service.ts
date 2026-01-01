import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SavedSearch } from './saved-search.entity';

@Injectable()
export class SavedSearchService {
  constructor(
    @InjectRepository(SavedSearch)
    private savedSearchRepository: Repository<SavedSearch>,
  ) {}

  async create(
    userId: string,
    query: string,
    filters?: any,
    name?: string,
  ): Promise<SavedSearch> {
    const savedSearch = this.savedSearchRepository.create({
      userId,
      query,
      filters,
      name,
    });

    return this.savedSearchRepository.save(savedSearch);
  }

  async findByUser(userId: string): Promise<SavedSearch[]> {
    return this.savedSearchRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<SavedSearch> {
    const savedSearch = await this.savedSearchRepository.findOne({
      where: { id, userId },
    });

    if (!savedSearch) {
      throw new NotFoundException('Saved search not found');
    }

    return savedSearch;
  }

  async update(
    id: string,
    userId: string,
    updates: {
      query?: string;
      filters?: any;
      name?: string;
      notificationsEnabled?: boolean;
    },
  ): Promise<SavedSearch> {
    const savedSearch = await this.findOne(id, userId);

    Object.assign(savedSearch, updates);

    return this.savedSearchRepository.save(savedSearch);
  }

  async delete(id: string, userId: string): Promise<void> {
    const savedSearch = await this.findOne(id, userId);
    await this.savedSearchRepository.remove(savedSearch);
  }

  async toggleNotifications(
    id: string,
    userId: string,
  ): Promise<SavedSearch> {
    const savedSearch = await this.findOne(id, userId);
    savedSearch.notificationsEnabled = !savedSearch.notificationsEnabled;
    return this.savedSearchRepository.save(savedSearch);
  }
}
