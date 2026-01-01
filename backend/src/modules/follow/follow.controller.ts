import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common';
import { FollowService } from './follow.service';
import { FollowType } from './follow.entity';
import { TopicService } from '../topic/topic.service';
import { JournalService } from '../journal/journal.service';

@Controller('follows')
export class FollowController {
  constructor(
    private readonly followService: FollowService,
    private readonly topicService: TopicService,
    private readonly journalService: JournalService,
  ) {}

  @Post()
  async follow(
    @Body()
    body: {
      userId: string;
      entityType: FollowType;
      entityId: string;
    },
  ) {
    const follow = await this.followService.follow(
      body.userId,
      body.entityType,
      body.entityId,
    );

    // Update follower counts
    if (body.entityType === FollowType.TOPIC) {
      await this.topicService.incrementFollowerCount(body.entityId);
    } else if (body.entityType === FollowType.JOURNAL) {
      await this.journalService.incrementFollowerCount(body.entityId);
    }

    return follow;
  }

  @Delete()
  async unfollow(
    @Body()
    body: {
      userId: string;
      entityType: FollowType;
      entityId: string;
    },
  ) {
    await this.followService.unfollow(
      body.userId,
      body.entityType,
      body.entityId,
    );

    // Update follower counts
    if (body.entityType === FollowType.TOPIC) {
      await this.topicService.decrementFollowerCount(body.entityId);
    } else if (body.entityType === FollowType.JOURNAL) {
      await this.journalService.decrementFollowerCount(body.entityId);
    }

    return { success: true };
  }

  @Get('check/:userId/:entityType/:entityId')
  async isFollowing(
    @Param('userId') userId: string,
    @Param('entityType') entityType: FollowType,
    @Param('entityId') entityId: string,
  ) {
    const isFollowing = await this.followService.isFollowing(
      userId,
      entityType,
      entityId,
    );
    return { isFollowing };
  }

  @Get('user/:userId')
  async getUserFollows(@Param('userId') userId: string) {
    return this.followService.getUserFollows(userId);
  }

  @Get('user/:userId/:entityType')
  async getUserFollowsByType(
    @Param('userId') userId: string,
    @Param('entityType') entityType: FollowType,
  ) {
    return this.followService.getUserFollows(userId, entityType);
  }
}
