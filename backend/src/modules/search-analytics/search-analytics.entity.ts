import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

@Entity('search_analytics')
export class SearchAnalytics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  institutionId: string;

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

  @Column({ type: 'int', default: 0 })
  resultCount: number;

  @Column({ type: 'varchar', nullable: true })
  mode: 'keyword' | 'semantic' | 'hybrid';

  @Column({ type: 'varchar', nullable: true })
  model: string;

  @Column({ type: 'float', nullable: true })
  semanticWeight: number;

  @Column({ type: 'float', nullable: true })
  keywordWeight: number;

  @Column({ type: 'float', nullable: true })
  threshold: number;

  @Column({ type: 'float', nullable: true })
  executionTime: number;

  @CreateDateColumn()
  timestamp: Date;
}
