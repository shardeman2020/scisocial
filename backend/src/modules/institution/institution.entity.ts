import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum InstitutionType {
  UNIVERSITY = 'university',
  SME = 'sme',
  RESEARCH_INSTITUTE = 'research_institute',
  GOVERNMENT = 'government',
  NON_PROFIT = 'non_profit',
}

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'simple-array' })
  domains: string[];

  @Column({
    type: 'enum',
    enum: InstitutionType,
    default: InstitutionType.UNIVERSITY,
  })
  type: InstitutionType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  location: string;

  @Column({ nullable: true })
  website: string;

  @Column({ nullable: true })
  logoUrl: string;

  @Column({ default: 0 })
  verifiedUserCount: number;

  @Column({ default: 0 })
  postCount: number;

  @Column({ default: false })
  isVerified: boolean;

  @OneToMany(() => User, (user) => user.institution)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
