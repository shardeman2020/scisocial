import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Post } from '../post/post.entity';
import { Institution } from '../institution/institution.entity';
import { Persona } from '../persona/persona.entity';

export enum BadgeType {
  VERIFIED_RESEARCHER = 'verified_researcher',
  UNIVERSITY_STUDENT = 'university_student',
  UNIVERSITY_FACULTY = 'university_faculty',
  SME_CONTRIBUTOR = 'sme_contributor',
  NONE = 'none',
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  INSTITUTION_ADMIN = 'institution_admin',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  username: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: true })
  bio: string;

  @Column('simple-array', { nullable: true })
  expertiseTags: string[];

  @Column({
    type: 'enum',
    enum: BadgeType,
    default: BadgeType.NONE,
  })
  badgeType: BadgeType;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
    comment: 'User role for access control: user, moderator, or admin',
  })
  role: UserRole;

  @Column({ nullable: true })
  orcidId: string;

  @Column({ default: false })
  isOrcidVerified: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ default: false })
  isInstitutionVerified: boolean;

  @ManyToOne(() => Institution, (institution) => institution.users, {
    nullable: true,
  })
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column({ nullable: true })
  institutionId: string;

  @Column({
    type: 'enum',
    enum: ['general', 'biomed', 'legal', 'physics'],
    nullable: true,
    comment: 'Preferred embedding model for searches',
  })
  preferredModel: string;

  @Column({ default: true, comment: 'Opt-in for digest emails' })
  digestOptIn: boolean;

  @Column('simple-array', { nullable: true, comment: 'Research interests and topics' })
  researchInterests: string[];

  @ManyToOne(() => Persona, (persona) => persona.users, { nullable: true })
  @JoinColumn({ name: 'personaId' })
  persona: Persona;

  @Column({ nullable: true })
  personaId: string;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];

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
