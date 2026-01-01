import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { getDatabaseConfig } from './config/database.config';
import { CitationModule } from './modules/citation/citation.module';
import { PostModule } from './modules/post/post.module';
import { UserModule } from './modules/user/user.module';
import { LikeModule } from './modules/like/like.module';
import { CommentModule } from './modules/comment/comment.module';
import { TopicModule } from './modules/topic/topic.module';
import { JournalModule } from './modules/journal/journal.module';
import { FollowModule } from './modules/follow/follow.module';
import { InstitutionModule } from './modules/institution/institution.module';
import { PersonaModule } from './modules/persona/persona.module';
import { SearchModule } from './modules/search/search.module';
import { SavedSearchModule } from './modules/saved-search/saved-search.module';
import { SearchAnalyticsModule } from './modules/search-analytics/search-analytics.module';
import { UserPreferencesModule } from './modules/user-preferences/user-preferences.module';
import { EmailModule } from './modules/email/email.module';
import { DigestModule } from './modules/digest/digest.module';
import { EmbeddingModule } from './modules/embedding/embedding.module';
import { SemanticSearchModule } from './modules/semantic-search/semantic-search.module';
import { ModerationModule } from './modules/moderation/moderation.module';
import { InstitutionAdminModule } from './modules/institution-admin/institution-admin.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { AiModule } from './modules/ai/ai.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    }),
    CitationModule,
    PostModule,
    UserModule,
    LikeModule,
    CommentModule,
    TopicModule,
    JournalModule,
    FollowModule,
    InstitutionModule,
    PersonaModule,
    SearchModule,
    SavedSearchModule,
    SearchAnalyticsModule,
    UserPreferencesModule,
    EmailModule,
    DigestModule,
    EmbeddingModule,
    SemanticSearchModule,
    ModerationModule,
    InstitutionAdminModule,
    OnboardingModule,
    AiModule,
    HealthModule,
  ],
})
export class AppModule {}
