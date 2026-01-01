import { Controller, Get, Query } from '@nestjs/common';
import { SemanticSearchService, EntityLimits, HybridSearchOptions } from './semantic-search.service';
import { SearchAnalyticsService } from '../search-analytics/search-analytics.service';
import { ModelDomain, isValidModelDomain } from '../embedding/model-registry';

@Controller('semantic-search')
export class SemanticSearchController {
  constructor(
    private readonly semanticSearchService: SemanticSearchService,
    private readonly searchAnalyticsService: SearchAnalyticsService,
  ) {}

  @Get()
  async search(
    @Query('q') query: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
    @Query('postsLimit') postsLimit?: string,
    @Query('topicsLimit') topicsLimit?: string,
    @Query('journalsLimit') journalsLimit?: string,
    @Query('usersLimit') usersLimit?: string,
    @Query('threshold') threshold?: string,
    @Query('hybrid') hybrid?: string,
    @Query('semanticWeight') semanticWeight?: string,
    @Query('keywordWeight') keywordWeight?: string,
    @Query('model') model?: string,
  ) {
    if (!query) {
      return {
        posts: [],
        topics: [],
        journals: [],
        users: [],
      };
    }

    const thresholdNum = threshold ? parseFloat(threshold) : 0.0;

    // Parse and validate model domain
    let modelDomain: ModelDomain = 'general';
    if (model && isValidModelDomain(model)) {
      modelDomain = model as ModelDomain;
    }

    // Build entity-specific limits object
    const entityLimits: EntityLimits = {};

    // If global limit is provided, apply to all entities that don't have specific limits
    const globalLimit = limit ? parseInt(limit, 10) : undefined;

    if (postsLimit) {
      entityLimits.posts = parseInt(postsLimit, 10);
    } else if (globalLimit) {
      entityLimits.posts = globalLimit;
    }

    if (topicsLimit) {
      entityLimits.topics = parseInt(topicsLimit, 10);
    } else if (globalLimit) {
      entityLimits.topics = globalLimit;
    }

    if (journalsLimit) {
      entityLimits.journals = parseInt(journalsLimit, 10);
    } else if (globalLimit) {
      entityLimits.journals = globalLimit;
    }

    if (usersLimit) {
      entityLimits.users = parseInt(usersLimit, 10);
    } else if (globalLimit) {
      entityLimits.users = globalLimit;
    }

    // Build hybrid search options
    const hybridEnabled = hybrid === 'true' || hybrid === '1';
    let hybridOptions: HybridSearchOptions | undefined;

    if (hybridEnabled) {
      const semWeight = semanticWeight ? parseFloat(semanticWeight) : 0.7;
      const kwWeight = keywordWeight ? parseFloat(keywordWeight) : 0.3;

      // Normalize weights to sum to 1.0
      const total = semWeight + kwWeight;
      hybridOptions = {
        enabled: true,
        semanticWeight: semWeight / total,
        keywordWeight: kwWeight / total,
      };
    }

    // Execute search and measure execution time
    const startTime = performance.now();
    const results = await this.semanticSearchService.search(
      query,
      Object.keys(entityLimits).length > 0 ? entityLimits : undefined,
      thresholdNum,
      hybridOptions,
      modelDomain,
    );
    const executionTime = performance.now() - startTime;

    // Track analytics
    const totalResults =
      results.posts.length +
      results.topics.length +
      results.journals.length +
      results.users.length;

    const mode = hybridEnabled ? 'hybrid' : 'semantic';

    // Track search asynchronously (don't await to avoid slowing down response)
    this.searchAnalyticsService
      .trackSearch(
        userId || 'anonymous',
        query,
        null, // filters (not currently used in semantic search)
        totalResults,
        mode,
        hybridOptions?.semanticWeight,
        hybridOptions?.keywordWeight,
        thresholdNum > 0 ? thresholdNum : undefined,
        executionTime,
        modelDomain,
      )
      .catch((err) => console.error('Failed to track search analytics:', err));

    return results;
  }
}
