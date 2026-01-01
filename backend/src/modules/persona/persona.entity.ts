import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum EngagementStyle {
  DISCUSSION_DRIVEN = 'discussion_driven',
  CONTENT_CONSUMER = 'content_consumer',
  ACTIVE_SHARER = 'active_sharer',
  CURATOR = 'curator',
}

export enum FeedPreference {
  TOPIC_FEEDS = 'topic_feeds',
  JOURNAL_FEEDS = 'journal_feeds',
  AUTHOR_FEEDS = 'author_feeds',
  HOME_FEED = 'home_feed',
  TRENDING = 'trending',
  INSTITUTIONAL = 'institutional',
}

export enum CredibilitySignal {
  CITATION_COUNTS = 'citation_counts',
  IMPACT_FACTOR = 'impact_factor',
  PEER_REVIEWS = 'peer_reviews',
  OPEN_ACCESS = 'open_access',
  INSTITUTIONAL_AFFILIATION = 'institutional_affiliation',
}

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'simple-array' })
  preferredFields: string[];

  @Column({ type: 'simple-array' })
  feedPreferences: FeedPreference[];

  @Column({ type: 'simple-array' })
  credibilitySignals: CredibilitySignal[];

  @Column({
    type: 'enum',
    enum: EngagementStyle,
    default: EngagementStyle.CONTENT_CONSUMER,
  })
  engagementStyle: EngagementStyle;

  @Column({ type: 'jsonb', nullable: true })
  coldStartDefaults: {
    topics?: string[];
    journals?: string[];
    sortBy?: string;
  };

  @OneToMany(() => User, (user) => user.persona)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
