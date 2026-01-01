import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('journals')
export class Journal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  impactFactor: number;

  @Column({ nullable: true })
  publisher: string;

  @Column({ default: 0 })
  followerCount: number;

  @Column({ default: 0 })
  articleCount: number;

  @Column({ type: 'simple-array', nullable: true })
  disciplines: string[];

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
