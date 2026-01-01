import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CommentLike } from './comment-like.entity';
import { Post } from '../post/post.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(CommentLike)
    private commentLikeRepository: Repository<CommentLike>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async create(
    postId: string,
    authorId: string,
    content: string,
    parentCommentId?: string,
  ): Promise<Comment> {
    const comment = this.commentRepository.create({
      postId,
      authorId,
      content,
      parentCommentId,
    });

    const savedComment = await this.commentRepository.save(comment);

    // Only update post comments count for top-level comments
    if (!parentCommentId) {
      const post = await this.postRepository.findOne({ where: { id: postId } });
      if (post) {
        post.commentsCount += 1;
        await this.postRepository.save(post);
      }
    }

    // Reload the comment with the author relation
    return this.commentRepository.findOne({
      where: { id: savedComment.id },
      relations: ['author'],
    });
  }

  async findByPostId(postId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { postId },
      order: { createdAt: 'DESC' },
      relations: ['author'],
    });
  }

  async delete(commentId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (comment) {
      await this.commentRepository.remove(comment);

      // Only update post comments count for top-level comments
      if (!comment.parentCommentId) {
        const post = await this.postRepository.findOne({
          where: { id: comment.postId },
        });
        if (post) {
          post.commentsCount = Math.max(0, post.commentsCount - 1);
          await this.postRepository.save(post);
        }
      }
    }
  }

  async toggleLike(
    userId: string,
    commentId: string,
  ): Promise<{ liked: boolean; likesCount: number }> {
    const existingLike = await this.commentLikeRepository.findOne({
      where: { userId, commentId },
    });

    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });

    if (existingLike) {
      // Unlike
      await this.commentLikeRepository.remove(existingLike);
      comment.likesCount = Math.max(0, comment.likesCount - 1);
      await this.commentRepository.save(comment);
      return { liked: false, likesCount: comment.likesCount };
    } else {
      // Like
      const like = this.commentLikeRepository.create({ userId, commentId });
      await this.commentLikeRepository.save(like);
      comment.likesCount += 1;
      await this.commentRepository.save(comment);
      return { liked: true, likesCount: comment.likesCount };
    }
  }

  async getReplies(parentCommentId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { parentCommentId },
      order: { createdAt: 'ASC' },
      relations: ['author'],
    });
  }
}
