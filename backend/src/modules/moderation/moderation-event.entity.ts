import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('moderation_events')
export class ModerationEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    comment: 'Type of entity being flagged: post, topic, journal, or user',
  })
  entityType: 'post' | 'topic' | 'journal' | 'user';

  @Column({ comment: 'ID of the entity being flagged' })
  entityId: string;

  @Column({
    type: 'varchar',
    comment: 'Type of flag: misinformation, spam, harassment, low-quality, other',
  })
  flagType: 'misinformation' | 'spam' | 'harassment' | 'low-quality' | 'other';

  @Column({ nullable: true, comment: 'Optional description of the issue' })
  description: string;

  @Column({ nullable: true, comment: 'User who flagged the content (null for anonymous)' })
  flaggedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'flaggedBy' })
  flagger: User;

  @Column({
    type: 'varchar',
    default: 'pending',
    comment: 'Status: pending, reviewed, resolved, or dismissed',
  })
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';

  @Column({ nullable: true, comment: 'Moderator who reviewed the flag' })
  reviewedBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer: User;

  @Column({ nullable: true, comment: 'Action taken or reason for dismissal' })
  reviewNote: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
