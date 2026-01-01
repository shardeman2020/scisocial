import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('topics')
export class Topic {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: 0 })
  followerCount: number;

  @Column({ default: 0 })
  postCount: number;

  @Column({ type: 'simple-array', nullable: true })
  relatedTopics: string[];

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
