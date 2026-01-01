import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Institution } from '../institution/institution.entity';

export interface ModerationPolicy {
  allowedFlagTypes: string[];
  autoFlagRules: {
    keywordBlacklist?: string[];
    minReportThreshold?: number;
  };
}

export interface DigestPreferences {
  enabled: boolean;
  recipients: string[];
  frequency: 'weekly' | 'monthly';
}

export interface SearchPreferences {
  defaultMode: 'keyword' | 'semantic' | 'hybrid';
  defaultSemanticWeight: number;
  defaultKeywordWeight: number;
  defaultThreshold: number;
}

export interface Branding {
  logoUrl?: string;
  accentColor?: string;
  customDomain?: string;
  tagline?: string;
  welcomeMessage?: string;
}

@Entity('institution_settings')
export class InstitutionSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Institution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column({ unique: true })
  institutionId: string;

  @Column({
    type: 'enum',
    enum: ['general', 'biomed', 'legal', 'physics'],
    default: 'general',
    comment: 'Default embedding model for institution searches',
  })
  defaultModel: string;

  @Column({
    type: 'jsonb',
    default: {
      allowedFlagTypes: ['spam', 'inappropriate', 'misinformation'],
      autoFlagRules: {},
    },
    comment: 'Moderation policy configuration',
  })
  moderationPolicy: ModerationPolicy;

  @Column({
    type: 'jsonb',
    default: {
      enabled: true,
      recipients: [],
      frequency: 'weekly',
    },
    comment: 'Digest email preferences',
  })
  digestPreferences: DigestPreferences;

  @Column({
    type: 'jsonb',
    default: {
      defaultMode: 'hybrid',
      defaultSemanticWeight: 0.5,
      defaultKeywordWeight: 0.5,
      defaultThreshold: 0.7,
    },
    comment: 'Default search configuration preferences',
  })
  searchPreferences: SearchPreferences;

  @Column({
    type: 'jsonb',
    default: {},
    comment: 'Custom branding configuration',
  })
  branding: Branding;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
