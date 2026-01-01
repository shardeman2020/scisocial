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

@Entity('researcher_onboarding')
export class ResearcherOnboarding {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ default: false, comment: 'Has the user completed their profile setup' })
  completedProfile: boolean;

  @Column({ default: false, comment: 'Has the user performed their first search' })
  firstSearch: boolean;

  @Column({ default: false, comment: 'Has the user saved their first search' })
  firstSavedSearch: boolean;

  @Column({ default: false, comment: 'Has the user followed a topic or journal' })
  firstFollow: boolean;

  @Column({ default: false, comment: 'Has the user created a post or comment' })
  firstPost: boolean;

  @Column({ default: false, comment: 'Has the user set digest preferences' })
  digestPreferencesSet: boolean;

  @Column({ default: false, comment: 'Has the user completed the platform tour' })
  completedTour: boolean;

  @Column({ type: 'timestamp', nullable: true, comment: 'When the onboarding was completed' })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to check if onboarding is complete
  get isComplete(): boolean {
    return (
      this.completedProfile &&
      this.firstSearch &&
      this.firstSavedSearch &&
      this.firstFollow &&
      this.firstPost &&
      this.digestPreferencesSet &&
      this.completedTour
    );
  }

  // Get completion percentage
  get completionPercentage(): number {
    const steps = [
      this.completedProfile,
      this.firstSearch,
      this.firstSavedSearch,
      this.firstFollow,
      this.firstPost,
      this.digestPreferencesSet,
      this.completedTour,
    ];
    const completed = steps.filter((step) => step).length;
    return Math.round((completed / steps.length) * 100);
  }
}
