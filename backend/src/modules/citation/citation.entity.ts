import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Post } from '../post/post.entity';

@Entity('citations')
export class Citation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  doi: string;

  @Column()
  title: string;

  @Column('simple-array', { nullable: true })
  authors: string[];

  @Column({ nullable: true })
  journal: string;

  @Column({ nullable: true })
  year: number;

  @Column({ nullable: true })
  publisher: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  impactFactor: number;

  @Column({ default: 0 })
  citationCount: number;

  @Column({ type: 'text', nullable: true })
  abstract: string;

  @Column({ type: 'text', nullable: true })
  aiSummary: string;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  url: string;

  @Column({ default: false })
  isOpenAccess: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @OneToMany(() => Post, (post) => post.citation)
  posts: Post[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
