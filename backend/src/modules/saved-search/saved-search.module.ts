import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SavedSearch } from './saved-search.entity';
import { SavedSearchService } from './saved-search.service';
import { SavedSearchController } from './saved-search.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SavedSearch])],
  controllers: [SavedSearchController],
  providers: [SavedSearchService],
  exports: [SavedSearchService],
})
export class SavedSearchModule {}
