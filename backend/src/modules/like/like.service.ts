import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './like.entity';
import { Post } from '../post/post.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async toggleLike(userId: string, postId: string): Promise<{ liked: boolean; likesCount: number }> {
    const existingLike = await this.likeRepository.findOne({
      where: { userId, postId },
    });

    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (existingLike) {
      // Unlike
      await this.likeRepository.remove(existingLike);
      post.likesCount = Math.max(0, post.likesCount - 1);
      await this.postRepository.save(post);
      return { liked: false, likesCount: post.likesCount };
    } else {
      // Like
      const like = this.likeRepository.create({ userId, postId });
      await this.likeRepository.save(like);
      post.likesCount += 1;
      await this.postRepository.save(post);
      return { liked: true, likesCount: post.likesCount };
    }
  }

  async hasUserLikedPost(userId: string, postId: string): Promise<boolean> {
    const like = await this.likeRepository.findOne({
      where: { userId, postId },
    });
    return !!like;
  }

  async getPostLikes(postId: string): Promise<Like[]> {
    return this.likeRepository.find({
      where: { postId },
      relations: ['user'],
    });
  }
}
