import { Controller, Post, Get, Delete, Param, Body, Query } from '@nestjs/common';
import { CommentService } from './comment.service';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  async create(
    @Body()
    body: {
      postId: string;
      authorId: string;
      content: string;
      parentCommentId?: string;
    },
  ) {
    return this.commentService.create(
      body.postId,
      body.authorId,
      body.content,
      body.parentCommentId,
    );
  }

  @Post(':id/like')
  async toggleLike(@Param('id') commentId: string, @Body() body: { userId: string }) {
    return this.commentService.toggleLike(body.userId, commentId);
  }

  @Get(':id/replies')
  async getReplies(@Param('id') commentId: string) {
    return this.commentService.getReplies(commentId);
  }

  @Get()
  async getComments(@Query('postId') postId: string) {
    return this.commentService.findByPostId(postId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.commentService.delete(id);
    return { message: 'Comment deleted successfully' };
  }
}
