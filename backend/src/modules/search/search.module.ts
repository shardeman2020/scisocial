import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';
import { Topic } from '../topic/topic.entity';
import { Journal } from '../journal/journal.entity';
import { User } from '../user/user.entity';
import { Institution } from '../institution/institution.entity';
import { Post } from '../post/post.entity';
import { SearchAnalyticsModule } from '../search-analytics/search-analytics.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Topic, Journal, User, Institution, Post]),
    SearchAnalyticsModule,
  ],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
