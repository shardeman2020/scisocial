import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { Topic } from '../topic/topic.entity';
import { Journal } from '../journal/journal.entity';
import { User } from '../user/user.entity';
import { Institution } from '../institution/institution.entity';
import { Post } from '../post/post.entity';

export interface SearchFilters {
  discipline?: string;
  impactFactorMin?: number;
  impactFactorMax?: number;
  citationCountMin?: number;
  openAccess?: boolean;
  institutionId?: string;
}

export interface SearchResults {
  topics: Topic[];
  journals: Journal[];
  users: User[];
  institutions: Institution[];
  posts: Post[];
}

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async search(query: string, limit: number = 5, filters: SearchFilters = {}): Promise<SearchResults> {
    const searchPattern = `%${query}%`;

    // Search across all entities in parallel
    const [topics, journals, users, institutions, posts] = await Promise.all([
      // Search topics by name or description
      this.topicRepository.find({
        where: [
          { name: ILike(searchPattern) },
          { description: ILike(searchPattern) },
        ],
        take: limit,
        order: { postCount: 'DESC' },
      }),

      // Search journals by name or publisher
      this.searchJournals(searchPattern, limit, filters),

      // Search users by username or expertise tags
      this.searchUsers(searchPattern, limit, filters),

      // Search institutions by name or location
      this.institutionRepository.find({
        where: [
          { name: ILike(searchPattern) },
          { location: ILike(searchPattern) },
          { description: ILike(searchPattern) },
        ],
        take: limit,
        order: { verifiedUserCount: 'DESC' },
      }),

      // Search posts by content
      this.searchPosts(searchPattern, limit, filters),
    ]);

    return {
      topics,
      journals,
      users,
      institutions,
      posts,
    };
  }

  private async searchJournals(searchPattern: string, limit: number, filters: SearchFilters): Promise<Journal[]> {
    const queryBuilder = this.journalRepository.createQueryBuilder('journal')
      .where('journal.name ILIKE :pattern OR journal.publisher ILIKE :pattern', { pattern: searchPattern });

    // Apply discipline filter
    if (filters.discipline) {
      queryBuilder.andWhere(':discipline = ANY(journal.disciplines)', { discipline: filters.discipline });
    }

    return queryBuilder
      .take(limit)
      .orderBy('journal.articleCount', 'DESC')
      .getMany();
  }

  private async searchUsers(searchPattern: string, limit: number, filters: SearchFilters): Promise<User[]> {
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.institution', 'institution')
      .where('user.username ILIKE :pattern OR user.bio ILIKE :pattern', { pattern: searchPattern });

    // Apply institution filter
    if (filters.institutionId) {
      queryBuilder.andWhere('user.institutionId = :institutionId', { institutionId: filters.institutionId });
    }

    return queryBuilder
      .take(limit)
      .getMany();
  }

  private async searchPosts(searchPattern: string, limit: number, filters: SearchFilters): Promise<Post[]> {
    const queryBuilder = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.citation', 'citation')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.content ILIKE :pattern', { pattern: searchPattern });

    // Apply impact factor filter
    if (filters.impactFactorMin !== undefined && filters.impactFactorMax !== undefined) {
      queryBuilder.andWhere('citation.impactFactor BETWEEN :min AND :max', {
        min: filters.impactFactorMin,
        max: filters.impactFactorMax,
      });
    } else if (filters.impactFactorMin !== undefined) {
      queryBuilder.andWhere('citation.impactFactor >= :min', { min: filters.impactFactorMin });
    } else if (filters.impactFactorMax !== undefined) {
      queryBuilder.andWhere('citation.impactFactor <= :max', { max: filters.impactFactorMax });
    }

    // Apply citation count filter
    if (filters.citationCountMin !== undefined) {
      queryBuilder.andWhere('citation.citationCount >= :minCitations', { minCitations: filters.citationCountMin });
    }

    // Apply open access filter
    if (filters.openAccess !== undefined) {
      queryBuilder.andWhere('citation.isOpenAccess = :openAccess', { openAccess: filters.openAccess });
    }

    // Apply institution filter (filter by post author's institution)
    if (filters.institutionId) {
      queryBuilder.andWhere('author.institutionId = :institutionId', { institutionId: filters.institutionId });
    }

    return queryBuilder
      .take(limit)
      .orderBy('post.createdAt', 'DESC')
      .getMany();
  }

  async autocomplete(query: string, limit: number = 5): Promise<any[]> {
    const results = await this.search(query, limit);

    // Combine all results into a single autocomplete list
    const autocompleteResults: any[] = [];

    results.topics.forEach((topic) => {
      autocompleteResults.push({
        type: 'topic',
        id: topic.id,
        name: topic.name,
        slug: topic.slug,
        description: topic.description,
        followerCount: topic.followerCount,
      });
    });

    results.journals.forEach((journal) => {
      autocompleteResults.push({
        type: 'journal',
        id: journal.id,
        name: journal.name,
        slug: journal.slug,
        publisher: journal.publisher,
        articleCount: journal.articleCount,
      });
    });

    results.institutions.forEach((institution) => {
      autocompleteResults.push({
        type: 'institution',
        id: institution.id,
        name: institution.name,
        slug: institution.slug,
        location: institution.location,
        verifiedUserCount: institution.verifiedUserCount,
      });
    });

    results.users.forEach((user) => {
      autocompleteResults.push({
        type: 'user',
        id: user.id,
        username: user.username,
        bio: user.bio,
        badgeType: user.badgeType,
        institutionName: user.institution?.name,
      });
    });

    return autocompleteResults.slice(0, limit);
  }
}
