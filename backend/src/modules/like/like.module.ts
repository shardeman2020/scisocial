import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Like } from './like.entity';
import { Post } from '../post/post.entity';
import { LikeService } from './like.service';
import { LikeController } from './like.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Post])],
  providers: [LikeService],
  controllers: [LikeController],
  exports: [LikeService],
})
export class LikeModule {}
