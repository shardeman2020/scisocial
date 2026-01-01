import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Follow } from './follow.entity';
import { FollowService } from './follow.service';
import { FollowController } from './follow.controller';
import { TopicModule } from '../topic/topic.module';
import { JournalModule } from '../journal/journal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Follow]),
    TopicModule,
    JournalModule,
  ],
  providers: [FollowService],
  controllers: [FollowController],
  exports: [FollowService],
})
export class FollowModule {}
