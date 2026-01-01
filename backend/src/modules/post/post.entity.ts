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
import { Citation } from '../citation/citation.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: [],
    comment: 'Array of image objects with url and altText'
  })
  images: { url: string; altText: string | null }[];

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  commentsCount: number;

  @Column('simple-array', { nullable: true })
  topics: string[];

  @ManyToOne(() => User, (user) => user.posts, { eager: true })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @ManyToOne(() => Citation, (citation) => citation.posts, { eager: true })
  @JoinColumn({ name: 'citationId' })
  citation: Citation;

  @Column()
  citationId: string;

  @Column({ type: 'vector', nullable: true, length: 384 })
  embedding: string;

  @Column({ type: 'vector', nullable: true, length: 768 })
  embedding_biomed: string;

  @Column({ type: 'vector', nullable: true, length: 768 })
  embedding_legal: string;

  @Column({ type: 'vector', nullable: true, length: 768 })
  embedding_physics: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
