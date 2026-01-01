import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SemanticSearchService } from './semantic-search.service';
import { SemanticSearchController } from './semantic-search.controller';
import { Post } from '../post/post.entity';
import { Topic } from '../topic/topic.entity';
import { Journal } from '../journal/journal.entity';
import { User } from '../user/user.entity';
import { EmbeddingModule } from '../embedding/embedding.module';
import { SearchAnalyticsModule } from '../search-analytics/search-analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Topic, Journal, User]),
    EmbeddingModule,
    SearchAnalyticsModule,
  ],
  controllers: [SemanticSearchController],
  providers: [SemanticSearchService],
  exports: [SemanticSearchService],
})
export class SemanticSearchModule {}
