import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('researcher_digests')
export class ResearcherDigest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'date' })
  weekStart: Date;

  @Column({ type: 'date' })
  weekEnd: Date;

  @Column({ type: 'json', comment: 'Top 5 queries with counts' })
  topQueries: Array<{ query: string; count: number; percent: number }>;

  @Column({
    type: 'json',
    comment: 'Model usage distribution (general, biomed, legal, physics)',
  })
  modelUsage: {
    total: number;
    general: number;
    biomed: number;
    legal: number;
    physics: number;
    generalPercent: number;
    biomedPercent: number;
    legalPercent: number;
    physicsPercent: number;
  };

  @Column({
    type: 'json',
    comment: 'Search mode usage breakdown',
  })
  searchModeUsage: {
    total: number;
    keywordCount: number;
    semanticCount: number;
    hybridCount: number;
    keywordPercent: number;
    semanticPercent: number;
    hybridPercent: number;
  };

  @Column({
    type: 'json',
    comment: 'Performance metrics (avg, p50, p95, p99)',
  })
  performanceMetrics: {
    avgExecutionTime: number;
    p50: number;
    p95: number;
    p99: number;
  };

  @Column({
    type: 'json',
    comment: 'Moderation activity stats',
  })
  moderationActivity: {
    totalFlagged: number;
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
    byFlagType: Array<{ flagType: string; count: number }>;
    byEntityType: Array<{ entityType: string; count: number }>;
  };

  @CreateDateColumn()
  createdAt: Date;
}
