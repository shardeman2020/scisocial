import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow, FollowType } from './follow.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private followRepository: Repository<Follow>,
  ) {}

  async follow(
    userId: string,
    entityType: FollowType,
    entityId: string,
  ): Promise<Follow> {
    const existingFollow = await this.followRepository.findOne({
      where: { userId, entityType, entityId },
    });

    if (existingFollow) {
      return existingFollow;
    }

    const follow = this.followRepository.create({
      userId,
      entityType,
      entityId,
    });
    return this.followRepository.save(follow);
  }

  async unfollow(
    userId: string,
    entityType: FollowType,
    entityId: string,
  ): Promise<void> {
    await this.followRepository.delete({
      userId,
      entityType,
      entityId,
    });
  }

  async isFollowing(
    userId: string,
    entityType: FollowType,
    entityId: string,
  ): Promise<boolean> {
    const follow = await this.followRepository.findOne({
      where: { userId, entityType, entityId },
    });
    return !!follow;
  }

  async getUserFollows(
    userId: string,
    entityType?: FollowType,
  ): Promise<Follow[]> {
    const where: any = { userId };
    if (entityType) {
      where.entityType = entityType;
    }
    return this.followRepository.find({ where });
  }

  async getFollowerCount(
    entityType: FollowType,
    entityId: string,
  ): Promise<number> {
    return this.followRepository.count({
      where: { entityType, entityId },
    });
  }
}
