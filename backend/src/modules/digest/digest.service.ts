import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { SavedSearch } from '../saved-search/saved-search.entity';
import { Post } from '../post/post.entity';
import { User } from '../user/user.entity';
import { EmailService, DigestData, DigestPost } from '../email/email.service';
import { UserPreferencesService } from '../user-preferences/user-preferences.service';

@Injectable()
export class DigestService {
  constructor(
    @InjectRepository(SavedSearch)
    private savedSearchRepository: Repository<SavedSearch>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
    private userPreferencesService: UserPreferencesService,
  ) {}

  async generateWeeklyDigests(): Promise<void> {
    console.log('Starting weekly digest generation...');

    // Get users who want weekly digests
    const preferences = await this.userPreferencesService.getUsersForWeeklyDigest();
    console.log(`Found ${preferences.length} users for weekly digest`);

    for (const pref of preferences) {
      try {
        await this.generateDigestForUser(pref.userId, 7); // 7 days for weekly
        await this.userPreferencesService.updateLastDigestSent(pref.userId);
      } catch (error) {
        console.error(`Failed to generate digest for user ${pref.userId}:`, error);
      }
    }

    console.log('Weekly digest generation completed');
  }

  async generateDailyDigests(): Promise<void> {
    console.log('Starting daily digest generation...');

    const preferences = await this.userPreferencesService.getUsersForDailyDigest();
    console.log(`Found ${preferences.length} users for daily digest`);

    for (const pref of preferences) {
      try {
        await this.generateDigestForUser(pref.userId, 1); // 1 day for daily
        await this.userPreferencesService.updateLastDigestSent(pref.userId);
      } catch (error) {
        console.error(`Failed to generate digest for user ${pref.userId}:`, error);
      }
    }

    console.log('Daily digest generation completed');
  }

  private async generateDigestForUser(userId: string, daysAgo: number): Promise<void> {
    // Get user info
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.email) {
      console.log(`User ${userId} not found or has no email`);
      return;
    }

    // Get saved searches with notifications enabled
    const savedSearches = await this.savedSearchRepository.find({
      where: {
        userId,
        notificationsEnabled: true,
      },
    });

    if (savedSearches.length === 0) {
      console.log(`No enabled saved searches for user ${userId}`);
      return;
    }

    // Process each saved search
    for (const savedSearch of savedSearches) {
      const newPosts = await this.getNewPostsForSearch(savedSearch, daysAgo);

      if (newPosts.length === 0) {
        console.log(`No new posts for search "${savedSearch.name}" (user ${userId})`);
        continue;
      }

      // Prepare digest data
      const topPosts: DigestPost[] = newPosts.slice(0, 3).map((post) => ({
        title: post.citation?.title || 'Untitled',
        journal: post.citation?.journal || 'Unknown Journal',
        year: post.citation?.year || new Date().getFullYear(),
        impactFactor: post.citation?.impactFactor,
        url: post.citation?.url || `http://localhost:3000/posts/${post.id}`,
        authors: post.citation?.authors?.join(', ') || 'Unknown Authors',
      }));

      const digestData: DigestData = {
        searchName: savedSearch.name || `Search: ${savedSearch.query}`,
        query: savedSearch.query,
        newPostsCount: newPosts.length,
        topPosts,
        userEmail: user.email,
        userName: user.username || 'Researcher',
      };

      // Send digest email
      await this.emailService.sendWeeklyDigest(digestData);
      console.log(`Sent digest for "${savedSearch.name}" to ${user.email}`);
    }
  }

  private async getNewPostsForSearch(savedSearch: SavedSearch, daysAgo: number): Promise<Post[]> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysAgo);

    const queryBuilder = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.citation', 'citation')
      .leftJoinAndSelect('post.author', 'author')
      .where('post.createdAt > :sinceDate', { sinceDate })
      .orderBy('post.createdAt', 'DESC');

    // Apply search query filter
    if (savedSearch.query) {
      queryBuilder.andWhere('post.content ILIKE :pattern', {
        pattern: `%${savedSearch.query}%`,
      });
    }

    // Apply saved filters if they exist
    if (savedSearch.filters) {
      const filters = savedSearch.filters;

      if (filters.discipline) {
        queryBuilder.andWhere('citation.journal ILIKE :discipline', {
          discipline: `%${filters.discipline}%`,
        });
      }

      if (filters.impactFactorMin !== undefined || filters.impactFactorMax !== undefined) {
        const min = filters.impactFactorMin ?? 0;
        const max = filters.impactFactorMax ?? 999;
        queryBuilder.andWhere('citation.impactFactor BETWEEN :min AND :max', { min, max });
      }

      if (filters.citationCountMin !== undefined) {
        // This would require a citation count on Post entity
        // For now, we skip this filter in digest
      }

      if (filters.openAccess !== undefined) {
        queryBuilder.andWhere('citation.isOpenAccess = :openAccess', {
          openAccess: filters.openAccess,
        });
      }

      if (filters.institutionId) {
        queryBuilder.andWhere('author.institutionId = :institutionId', {
          institutionId: filters.institutionId,
        });
      }
    }

    return queryBuilder.getMany();
  }
}
