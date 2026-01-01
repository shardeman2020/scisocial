import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { Institution } from '../institution/institution.entity';

export enum AuditAction {
  CREATE_INSTITUTION = 'create_institution',
  UPDATE_SETTINGS = 'update_settings',
  ASSIGN_ADMIN = 'assign_admin',
  REMOVE_ADMIN = 'remove_admin',
  INVITE_USER = 'invite_user',
  UPDATE_USER_ROLE = 'update_user_role',
  UPDATE_BRANDING = 'update_branding',
  UPDATE_MODERATION_POLICY = 'update_moderation_policy',
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Institution, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column()
  institutionId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  userId: string;

  @Column({
    type: 'enum',
    enum: AuditAction,
  })
  action: AuditAction;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;
}
