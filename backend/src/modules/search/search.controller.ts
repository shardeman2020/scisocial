import { Controller, Get, Query } from '@nestjs/common';
import { SearchService, SearchFilters } from './search.service';
import { SearchAnalyticsService } from '../search-analytics/search-analytics.service';

@Controller('search')
export class SearchController {
  constructor(
    private readonly searchService: SearchService,
    private readonly searchAnalyticsService: SearchAnalyticsService,
  ) {}

  @Get()
  async search(
    @Query('q') query: string,
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('discipline') discipline?: string,
    @Query('impactFactorMin') impactFactorMin?: string,
    @Query('impactFactorMax') impactFactorMax?: string,
    @Query('citationCountMin') citationCountMin?: string,
    @Query('openAccess') openAccess?: string,
    @Query('institutionId') institutionId?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 5;

    const filters: SearchFilters = {
      discipline,
      impactFactorMin: impactFactorMin ? parseFloat(impactFactorMin) : undefined,
      impactFactorMax: impactFactorMax ? parseFloat(impactFactorMax) : undefined,
      citationCountMin: citationCountMin ? parseInt(citationCountMin, 10) : undefined,
      openAccess: openAccess === 'true' ? true : openAccess === 'false' ? false : undefined,
      institutionId,
    };

    const results = await this.searchService.search(query, limitNum, filters);

    // Track analytics if userId is provided
    if (userId) {
      const resultCount =
        results.topics.length +
        results.journals.length +
        results.users.length +
        results.institutions.length +
        results.posts.length;

      // Track asynchronously without blocking the response
      this.searchAnalyticsService
        .trackSearch(userId, query, Object.keys(filters).length > 0 ? filters : null, resultCount)
        .catch(err => console.error('Failed to track search analytics:', err));
    }

    return results;
  }

  @Get('autocomplete')
  async autocomplete(@Query('q') query: string, @Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 5;
    return this.searchService.autocomplete(query, limitNum);
  }
}
