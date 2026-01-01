import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { DigestService } from './digest.service';
import { DigestProcessor } from './digest.processor';
import { DigestScheduler } from './digest.scheduler';
import { InstitutionalDigest } from './institutional-digest.entity';
import { InstitutionalDigestService } from './institutional-digest.service';
import { InstitutionalDigestController } from './institutional-digest.controller';
import { ResearcherDigest } from './researcher-digest.entity';
import { ResearcherDigestService } from './researcher-digest.service';
import { ResearcherDigestController } from './researcher-digest.controller';
import { BenchmarkingService } from './benchmarking.service';
import { BenchmarkingController } from './benchmarking.controller';
import { SavedSearch } from '../saved-search/saved-search.entity';
import { Post } from '../post/post.entity';
import { User } from '../user/user.entity';
import { SearchAnalytics } from '../search-analytics/search-analytics.entity';
import { ModerationEvent } from '../moderation/moderation-event.entity';
import { EmailModule } from '../email/email.module';
import { UserPreferencesModule } from '../user-preferences/user-preferences.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SavedSearch,
      Post,
      User,
      InstitutionalDigest,
      ResearcherDigest,
      SearchAnalytics,
      ModerationEvent,
    ]),
    BullModule.registerQueue({
      name: 'digest',
    }),
    ScheduleModule.forRoot(),
    EmailModule,
    UserPreferencesModule,
  ],
  controllers: [
    InstitutionalDigestController,
    ResearcherDigestController,
    BenchmarkingController,
  ],
  providers: [
    DigestService,
    DigestProcessor,
    DigestScheduler,
    InstitutionalDigestService,
    ResearcherDigestService,
    BenchmarkingService,
  ],
  exports: [
    DigestService,
    InstitutionalDigestService,
    ResearcherDigestService,
    BenchmarkingService,
  ],
})
export class DigestModule {}
