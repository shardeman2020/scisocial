import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchAnalytics } from './search-analytics.entity';
import { SearchAnalyticsService } from './search-analytics.service';
import { SearchAnalyticsController } from './search-analytics.controller';
import { InstitutionAnalyticsService } from './institution-analytics.service';
import { InstitutionAnalyticsController } from './institution-analytics.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SearchAnalytics])],
  controllers: [SearchAnalyticsController, InstitutionAnalyticsController],
  providers: [SearchAnalyticsService, InstitutionAnalyticsService],
  exports: [SearchAnalyticsService, InstitutionAnalyticsService],
})
export class SearchAnalyticsModule {}
