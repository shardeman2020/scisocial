import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../user/user.entity';

export enum DigestFrequency {
  WEEKLY = 'weekly',
  DAILY = 'daily',
  DISABLED = 'disabled',
}

export enum DeliveryMethod {
  EMAIL = 'email',
  IN_APP = 'in_app',
  BOTH = 'both',
}

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({
    type: 'enum',
    enum: DigestFrequency,
    default: DigestFrequency.WEEKLY,
  })
  digestFrequency: DigestFrequency;

  @Column({
    type: 'enum',
    enum: DeliveryMethod,
    default: DeliveryMethod.EMAIL,
  })
  deliveryMethod: DeliveryMethod;

  @Column({ type: 'timestamp', nullable: true })
  lastDigestSentAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
