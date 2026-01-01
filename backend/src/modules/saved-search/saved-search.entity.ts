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

@Entity('saved_searches')
export class SavedSearch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  query: string;

  @Column({ type: 'jsonb', nullable: true })
  filters: {
    discipline?: string;
    impactFactorMin?: number;
    impactFactorMax?: number;
    citationCountMin?: number;
    openAccess?: boolean;
    institutionId?: string;
  };

  @Column({ nullable: true })
  name: string;

  @Column({ default: true })
  notificationsEnabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
