import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum FollowType {
  TOPIC = 'topic',
  JOURNAL = 'journal',
  USER = 'user',
}

@Entity('follows')
@Unique(['userId', 'entityType', 'entityId'])
export class Follow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: FollowType,
  })
  entityType: FollowType;

  @Column()
  entityId: string;

  @CreateDateColumn()
  createdAt: Date;
}
