import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Column,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Comment } from './comment.entity';

@Entity('comment_likes')
@Unique(['userId', 'commentId'])
export class CommentLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Comment)
  @JoinColumn({ name: 'commentId' })
  comment: Comment;

  @Column()
  commentId: string;

  @CreateDateColumn()
  createdAt: Date;
}
