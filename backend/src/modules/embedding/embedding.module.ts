import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { EmbeddingService } from './embedding.service';
import { EmbeddingProcessor } from './embedding.processor';
import { EmbeddingScheduler } from './embedding.scheduler';
import { Post } from '../post/post.entity';
import { Topic } from '../topic/topic.entity';
import { Journal } from '../journal/journal.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Topic, Journal, User]),
    BullModule.registerQueue({
      name: 'embedding',
    }),
  ],
  providers: [EmbeddingService, EmbeddingProcessor, EmbeddingScheduler],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
