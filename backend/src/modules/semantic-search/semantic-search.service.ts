import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../post/post.entity';
import { Topic } from '../topic/topic.entity';
import { Journal } from '../journal/journal.entity';
import { User } from '../user/user.entity';
import { EmbeddingService } from '../embedding/embedding.service';
import { ModelDomain } from '../embedding/model-registry';

export interface SemanticSearchResult {
  posts: Array<{ post: Post; similarity: number; keywordScore?: number; combinedScore?: number }>;
  topics: Array<{ topic: Topic; similarity: number; keywordScore?: number; combinedScore?: number }>;
  journals: Array<{ journal: Journal; similarity: number; keywordScore?: number; combinedScore?: number }>;
  users: Array<{ user: User; similarity: number; keywordScore?: number; combinedScore?: number }>;
}

export interface EntityLimits {
  posts?: number;
  topics?: number;
  journals?: number;
  users?: number;
}

export interface HybridSearchOptions {
  enabled: boolean;
  semanticWeight: number;
  keywordWeight: number;
}

interface KeywordMatchScore {
  score: number;
  matchedFields: string[];
}

@Injectable()
export class SemanticSearchService {
  // Entity-specific default limits
  private readonly DEFAULT_LIMITS = {
    posts: 10,
    topics: 5,
    journals: 5,
    users: 3,
  };

  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Topic)
    private topicRepository: Repository<Topic>,
    @InjectRepository(Journal)
    private journalRepository: Repository<Journal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private embeddingService: EmbeddingService,
  ) {}

  async search(
    query: string,
    entityLimits?: EntityLimits,
    threshold: number = 0.0,
    hybridOptions?: HybridSearchOptions,
    modelDomain: ModelDomain = 'general',
  ): Promise<SemanticSearchResult> {
    // Use entity-specific limits or defaults
    const postsLimit = entityLimits?.posts ?? this.DEFAULT_LIMITS.posts;
    const topicsLimit = entityLimits?.topics ?? this.DEFAULT_LIMITS.topics;
    const journalsLimit = entityLimits?.journals ?? this.DEFAULT_LIMITS.journals;
    const usersLimit = entityLimits?.users ?? this.DEFAULT_LIMITS.users;

    // Get the column name for the specified model
    const embeddingColumn = this.embeddingService.getColumnName(modelDomain);

    // If hybrid search is enabled, use hybrid search logic
    if (hybridOptions?.enabled) {
      return this.hybridSearch(
        query,
        { posts: postsLimit, topics: topicsLimit, journals: journalsLimit, users: usersLimit },
        threshold,
        hybridOptions,
        modelDomain,
      );
    }

    // Otherwise, use pure semantic search
    const queryEmbedding = await this.embeddingService.generateEmbedding(query, modelDomain);
    const embeddingStr = this.embeddingService.formatEmbeddingForDB(queryEmbedding);

    // Search across all entities in parallel
    const [posts, topics, journals, users] = await Promise.all([
      this.searchPosts(embeddingStr, postsLimit, threshold, embeddingColumn),
      this.searchTopics(embeddingStr, topicsLimit, threshold, embeddingColumn),
      this.searchJournals(embeddingStr, journalsLimit, threshold, embeddingColumn),
      this.searchUsers(embeddingStr, usersLimit, threshold, embeddingColumn),
    ]);

    return {
      posts,
      topics,
      journals,
      users,
    };
  }

  private async hybridSearch(
    query: string,
    limits: Required<EntityLimits>,
    threshold: number,
    hybridOptions: HybridSearchOptions,
    modelDomain: ModelDomain,
  ): Promise<SemanticSearchResult> {
    // Generate embedding for semantic search
    const queryEmbedding = await this.embeddingService.generateEmbedding(query, modelDomain);
    const embeddingStr = this.embeddingService.formatEmbeddingForDB(queryEmbedding);

    // Get the column name for the specified model
    const embeddingColumn = this.embeddingService.getColumnName(modelDomain);

    // Increase limits for initial searches (to have more candidates for merging)
    const expandedLimit = (limit: number) => Math.min(limit * 3, 50);

    // Execute semantic and keyword searches in parallel
    const [
      semanticPosts,
      semanticTopics,
      semanticJournals,
      semanticUsers,
      keywordPosts,
      keywordTopics,
      keywordJournals,
      keywordUsers,
    ] = await Promise.all([
      this.searchPosts(embeddingStr, expandedLimit(limits.posts), 0, embeddingColumn),
      this.searchTopics(embeddingStr, expandedLimit(limits.topics), 0, embeddingColumn),
      this.searchJournals(embeddingStr, expandedLimit(limits.journals), 0, embeddingColumn),
      this.searchUsers(embeddingStr, expandedLimit(limits.users), 0, embeddingColumn),
      this.keywordSearchPosts(query, expandedLimit(limits.posts)),
      this.keywordSearchTopics(query, expandedLimit(limits.topics)),
      this.keywordSearchJournals(query, expandedLimit(limits.journals)),
      this.keywordSearchUsers(query, expandedLimit(limits.users)),
    ]);

    // Merge and re-rank results
    const posts = this.mergeResults(
      semanticPosts,
      keywordPosts,
      (item) => item.post.id,
      hybridOptions,
      limits.posts,
      threshold,
    );

    const topics = this.mergeResults(
      semanticTopics,
      keywordTopics,
      (item) => item.topic.id,
      hybridOptions,
      limits.topics,
      threshold,
    );

    const journals = this.mergeResults(
      semanticJournals,
      keywordJournals,
      (item) => item.journal.id,
      hybridOptions,
      limits.journals,
      threshold,
    );

    const users = this.mergeResults(
      semanticUsers,
      keywordUsers,
      (item) => item.user.id,
      hybridOptions,
      limits.users,
      threshold,
    );

    return { posts, topics, journals, users };
  }

  private mergeResults<T>(
    semanticResults: Array<T & { similarity: number }>,
    keywordResults: Array<T & { keywordScore: number }>,
    getIdFn: (item: T) => string,
    hybridOptions: HybridSearchOptions,
    limit: number,
    threshold: number,
  ): Array<T & { similarity: number; keywordScore?: number; combinedScore?: number }> {
    const resultMap = new Map<string, T & { similarity: number; keywordScore?: number; combinedScore?: number }>();

    // Add semantic results
    semanticResults.forEach((item) => {
      const id = getIdFn(item);
      resultMap.set(id, {
        ...item,
        similarity: item.similarity,
        keywordScore: 0,
        combinedScore: item.similarity * hybridOptions.semanticWeight,
      });
    });

    // Merge keyword results
    keywordResults.forEach((item) => {
      const id = getIdFn(item);
      const existing = resultMap.get(id);

      if (existing) {
        // Entity found in both searches - combine scores
        existing.keywordScore = item.keywordScore;
        existing.combinedScore =
          existing.similarity * hybridOptions.semanticWeight +
          item.keywordScore * hybridOptions.keywordWeight;
      } else {
        // Entity only in keyword search
        resultMap.set(id, {
          ...item,
          similarity: 0,
          keywordScore: item.keywordScore,
          combinedScore: item.keywordScore * hybridOptions.keywordWeight,
        });
      }
    });

    // Convert to array, filter by threshold, sort by combined score, and apply limit
    return Array.from(resultMap.values())
      .filter((item) => (item.combinedScore ?? 0) >= threshold)
      .sort((a, b) => (b.combinedScore ?? 0) - (a.combinedScore ?? 0))
      .slice(0, limit);
  }

  private async searchPosts(
    queryEmbedding: string,
    limit: number,
    threshold: number,
    embeddingColumn: string,
  ): Promise<Array<{ post: Post; similarity: number }>> {
    const results = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.citation', 'citation')
      .select([
        'post',
        'author',
        'citation',
        `1 - (post.${embeddingColumn} <=> :queryEmbedding) as similarity`,
      ])
      .where(`post.${embeddingColumn} IS NOT NULL`)
      .setParameter('queryEmbedding', queryEmbedding)
      .orderBy(`post.${embeddingColumn} <=> :queryEmbedding`, 'ASC')
      .limit(limit)
      .getRawAndEntities();

    const mapped = results.entities.map((post, index) => ({
      post,
      similarity: parseFloat(results.raw[index].similarity),
    }));

    // Filter by threshold
    return mapped.filter((item) => item.similarity >= threshold);
  }

  private async searchTopics(
    queryEmbedding: string,
    limit: number,
    threshold: number,
    embeddingColumn: string,
  ): Promise<Array<{ topic: Topic; similarity: number }>> {
    const results = await this.topicRepository
      .createQueryBuilder('topic')
      .select([
        'topic',
        `1 - (topic.${embeddingColumn} <=> :queryEmbedding) as similarity`,
      ])
      .where(`topic.${embeddingColumn} IS NOT NULL`)
      .setParameter('queryEmbedding', queryEmbedding)
      .orderBy(`topic.${embeddingColumn} <=> :queryEmbedding`, 'ASC')
      .limit(limit)
      .getRawAndEntities();

    const mapped = results.entities.map((topic, index) => ({
      topic,
      similarity: parseFloat(results.raw[index].similarity),
    }));

    // Filter by threshold
    return mapped.filter((item) => item.similarity >= threshold);
  }

  private async searchJournals(
    queryEmbedding: string,
    limit: number,
    threshold: number,
    embeddingColumn: string,
  ): Promise<Array<{ journal: Journal; similarity: number }>> {
    const results = await this.journalRepository
      .createQueryBuilder('journal')
      .select([
        'journal',
        `1 - (journal.${embeddingColumn} <=> :queryEmbedding) as similarity`,
      ])
      .where(`journal.${embeddingColumn} IS NOT NULL`)
      .setParameter('queryEmbedding', queryEmbedding)
      .orderBy(`journal.${embeddingColumn} <=> :queryEmbedding`, 'ASC')
      .limit(limit)
      .getRawAndEntities();

    const mapped = results.entities.map((journal, index) => ({
      journal,
      similarity: parseFloat(results.raw[index].similarity),
    }));

    // Filter by threshold
    return mapped.filter((item) => item.similarity >= threshold);
  }

  private async searchUsers(
    queryEmbedding: string,
    limit: number,
    threshold: number,
    embeddingColumn: string,
  ): Promise<Array<{ user: User; similarity: number }>> {
    const results = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.institution', 'institution')
      .leftJoinAndSelect('user.persona', 'persona')
      .select([
        'user',
        'institution',
        'persona',
        `1 - (user.${embeddingColumn} <=> :queryEmbedding) as similarity`,
      ])
      .where(`user.${embeddingColumn} IS NOT NULL`)
      .setParameter('queryEmbedding', queryEmbedding)
      .orderBy(`user.${embeddingColumn} <=> :queryEmbedding`, 'ASC')
      .limit(limit)
      .getRawAndEntities();

    const mapped = results.entities.map((user, index) => ({
      user,
      similarity: parseFloat(results.raw[index].similarity),
    }));

    // Filter by threshold
    return mapped.filter((item) => item.similarity >= threshold);
  }

  // ========== KEYWORD SEARCH METHODS ==========

  private async keywordSearchPosts(
    query: string,
    limit: number,
  ): Promise<Array<{ post: Post; similarity: number; keywordScore: number }>> {
    const searchTerm = `%${query.toLowerCase()}%`;

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.citation', 'citation')
      .where('LOWER(post.content) LIKE :search', { search: searchTerm })
      .orWhere('LOWER(citation.title) LIKE :search', { search: searchTerm })
      .limit(limit * 2) // Get more to score and rank
      .getMany();

    // Score each post based on keyword matches
    const scored = posts.map((post) => ({
      post,
      similarity: 0,
      keywordScore: this.calculatePostKeywordScore(post, query),
    }));

    // Sort by keyword score and limit
    return scored
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, limit);
  }

  private calculatePostKeywordScore(post: Post, query: string): number {
    const queryLower = query.toLowerCase();
    const content = post.content?.toLowerCase() || '';
    const citationTitle = post.citation?.title?.toLowerCase() || '';

    let score = 0;
    const matchedFields: string[] = [];

    // Primary field: content (exact match = 1.0, partial = 0.7)
    if (content === queryLower) {
      score += 1.0;
      matchedFields.push('content-exact');
    } else if (content.includes(queryLower)) {
      score += 0.7;
      matchedFields.push('content-partial');
    }

    // Tertiary field: citation title (0.3)
    if (citationTitle.includes(queryLower)) {
      score += 0.3;
      matchedFields.push('citation');
    }

    // Normalize to 0-1 range (max possible is 1.3)
    return Math.min(score / 1.3, 1.0);
  }

  private async keywordSearchTopics(
    query: string,
    limit: number,
  ): Promise<Array<{ topic: Topic; similarity: number; keywordScore: number }>> {
    const searchTerm = `%${query.toLowerCase()}%`;

    const topics = await this.topicRepository
      .createQueryBuilder('topic')
      .where('LOWER(topic.name) LIKE :search', { search: searchTerm })
      .orWhere('LOWER(topic.description) LIKE :search', { search: searchTerm })
      .limit(limit * 2)
      .getMany();

    const scored = topics.map((topic) => ({
      topic,
      similarity: 0,
      keywordScore: this.calculateTopicKeywordScore(topic, query),
    }));

    return scored
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, limit);
  }

  private calculateTopicKeywordScore(topic: Topic, query: string): number {
    const queryLower = query.toLowerCase();
    const name = topic.name?.toLowerCase() || '';
    const description = topic.description?.toLowerCase() || '';

    let score = 0;

    // Primary field: name (exact = 1.0, partial = 0.7)
    if (name === queryLower) {
      score += 1.0;
    } else if (name.includes(queryLower)) {
      score += 0.7;
    }

    // Secondary field: description (0.5)
    if (description.includes(queryLower)) {
      score += 0.5;
    }

    // Normalize to 0-1 range (max possible is 1.5)
    return Math.min(score / 1.5, 1.0);
  }

  private async keywordSearchJournals(
    query: string,
    limit: number,
  ): Promise<Array<{ journal: Journal; similarity: number; keywordScore: number }>> {
    const searchTerm = `%${query.toLowerCase()}%`;

    const journals = await this.journalRepository
      .createQueryBuilder('journal')
      .where('LOWER(journal.name) LIKE :search', { search: searchTerm })
      .orWhere('LOWER(journal.description) LIKE :search', { search: searchTerm })
      .orWhere('LOWER(journal.publisher) LIKE :search', { search: searchTerm })
      .limit(limit * 2)
      .getMany();

    const scored = journals.map((journal) => ({
      journal,
      similarity: 0,
      keywordScore: this.calculateJournalKeywordScore(journal, query),
    }));

    return scored
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, limit);
  }

  private calculateJournalKeywordScore(journal: Journal, query: string): number {
    const queryLower = query.toLowerCase();
    const name = journal.name?.toLowerCase() || '';
    const description = journal.description?.toLowerCase() || '';
    const publisher = journal.publisher?.toLowerCase() || '';

    let score = 0;

    // Primary field: name (exact = 1.0, partial = 0.7)
    if (name === queryLower) {
      score += 1.0;
    } else if (name.includes(queryLower)) {
      score += 0.7;
    }

    // Secondary field: description (0.5)
    if (description.includes(queryLower)) {
      score += 0.5;
    }

    // Tertiary field: publisher (0.3)
    if (publisher.includes(queryLower)) {
      score += 0.3;
    }

    // Normalize to 0-1 range (max possible is 1.8)
    return Math.min(score / 1.8, 1.0);
  }

  private async keywordSearchUsers(
    query: string,
    limit: number,
  ): Promise<Array<{ user: User; similarity: number; keywordScore: number }>> {
    const searchTerm = `%${query.toLowerCase()}%`;

    const users = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.institution', 'institution')
      .leftJoinAndSelect('user.persona', 'persona')
      .where('LOWER(user.username) LIKE :search', { search: searchTerm })
      .orWhere('LOWER(user.bio) LIKE :search', { search: searchTerm })
      .limit(limit * 2)
      .getMany();

    const scored = users.map((user) => ({
      user,
      similarity: 0,
      keywordScore: this.calculateUserKeywordScore(user, query),
    }));

    return scored
      .sort((a, b) => b.keywordScore - a.keywordScore)
      .slice(0, limit);
  }

  private calculateUserKeywordScore(user: User, query: string): number {
    const queryLower = query.toLowerCase();
    const username = user.username?.toLowerCase() || '';
    const bio = user.bio?.toLowerCase() || '';
    const expertiseTags = user.expertiseTags?.map((tag) => tag.toLowerCase()) || [];

    let score = 0;

    // Primary field: username (exact = 1.0, partial = 0.7)
    if (username === queryLower) {
      score += 1.0;
    } else if (username.includes(queryLower)) {
      score += 0.7;
    }

    // Secondary field: bio (0.5)
    if (bio.includes(queryLower)) {
      score += 0.5;
    }

    // Tertiary field: expertiseTags (0.3)
    if (expertiseTags.some((tag) => tag.includes(queryLower))) {
      score += 0.3;
    }

    // Normalize to 0-1 range (max possible is 1.8)
    return Math.min(score / 1.8, 1.0);
  }
}
