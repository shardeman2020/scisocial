import { Controller, Post, Param, Get, Query } from '@nestjs/common';
import { LikeService } from './like.service';

@Controller('likes')
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  @Post(':postId/toggle')
  async toggleLike(
    @Param('postId') postId: string,
    @Query('userId') userId: string,
  ) {
    return this.likeService.toggleLike(userId, postId);
  }

  @Get(':postId/check')
  async checkLike(
    @Param('postId') postId: string,
    @Query('userId') userId: string,
  ): Promise<{ liked: boolean }> {
    const liked = await this.likeService.hasUserLikedPost(userId, postId);
    return { liked };
  }

  @Get(':postId')
  async getPostLikes(@Param('postId') postId: string) {
    return this.likeService.getPostLikes(postId);
  }
}
