import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('institutional_digests')
export class InstitutionalDigest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  institutionId: string;

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
    comment: 'Hybrid vs Semantic usage breakdown',
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
    comment: 'Moderation statistics',
  })
  moderationStats: {
    totalFlagged: number;
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
    resolvedPercent: number;
    dismissedPercent: number;
    byFlagType: Array<{ flagType: string; count: number }>;
    byEntityType: Array<{ entityType: string; count: number }>;
  };

  @CreateDateColumn()
  createdAt: Date;
}
