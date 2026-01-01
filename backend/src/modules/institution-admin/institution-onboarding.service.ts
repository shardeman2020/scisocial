import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Institution } from '../institution/institution.entity';
import { User, UserRole } from '../user/user.entity';
import { InstitutionSettings } from './institution-settings.entity';
import { UserInvite } from './user-invite.entity';
import { AuditLog, AuditAction } from './audit-log.entity';
import * as crypto from 'crypto';

@Injectable()
export class InstitutionOnboardingService {
  constructor(
    @InjectRepository(Institution)
    private institutionRepository: Repository<Institution>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(InstitutionSettings)
    private settingsRepository: Repository<InstitutionSettings>,
    @InjectRepository(UserInvite)
    private inviteRepository: Repository<UserInvite>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async createInstitution(name: string, slug: string, adminUserId?: string): Promise<Institution> {
    // Check if slug is unique
    const existingInstitution = await this.institutionRepository.findOne({
      where: { slug },
    });

    if (existingInstitution) {
      throw new BadRequestException('Institution slug already exists');
    }

    // Create institution
    const institution = this.institutionRepository.create({
      name,
      slug,
      isVerified: true,
    });

    const savedInstitution = await this.institutionRepository.save(institution);

    // Initialize default settings
    await this.initializeDefaultSettings(savedInstitution.id);

    // Log audit event
    await this.logAudit(
      savedInstitution.id,
      AuditAction.CREATE_INSTITUTION,
      adminUserId,
      { name, slug },
      `Institution "${name}" created`,
    );

    return savedInstitution;
  }

  async assignAdmin(userId: string, institutionId: string, assignedBy?: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    // Update user role and institution
    user.role = UserRole.INSTITUTION_ADMIN;
    user.institutionId = institutionId;

    const updatedUser = await this.userRepository.save(user);

    // Log audit event
    await this.logAudit(
      institutionId,
      AuditAction.ASSIGN_ADMIN,
      assignedBy,
      { userId, email: user.email },
      `User ${user.email} assigned as institution admin`,
    );

    return updatedUser;
  }

  async initializeDefaultSettings(institutionId: string): Promise<InstitutionSettings> {
    const existingSettings = await this.settingsRepository.findOne({
      where: { institutionId },
    });

    if (existingSettings) {
      return existingSettings;
    }

    const settings = this.settingsRepository.create({
      institutionId,
      defaultModel: 'general',
      moderationPolicy: {
        allowedFlagTypes: ['spam', 'inappropriate', 'misinformation'],
        autoFlagRules: {},
      },
      digestPreferences: {
        enabled: true,
        recipients: [],
        frequency: 'weekly',
      },
      searchPreferences: {
        defaultMode: 'hybrid',
        defaultSemanticWeight: 0.5,
        defaultKeywordWeight: 0.5,
        defaultThreshold: 0.7,
      },
      branding: {},
    });

    return await this.settingsRepository.save(settings);
  }

  async inviteUser(
    email: string,
    institutionId: string,
    invitedBy: string,
  ): Promise<UserInvite> {
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });
    if (!institution) {
      throw new NotFoundException('Institution not found');
    }

    // Check if user already exists with this email
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser && existingUser.institutionId === institutionId) {
      throw new BadRequestException('User already belongs to this institution');
    }

    // Check if there's already a pending invite
    const existingInvite = await this.inviteRepository.findOne({
      where: {
        email,
        institutionId,
        accepted: false,
      },
    });

    if (existingInvite && existingInvite.expiresAt > new Date()) {
      throw new BadRequestException('Invite already sent to this email');
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Create invite (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invite = this.inviteRepository.create({
      email,
      token,
      institutionId,
      invitedById: invitedBy,
      expiresAt,
    });

    const savedInvite = await this.inviteRepository.save(invite);

    // Log audit event
    await this.logAudit(
      institutionId,
      AuditAction.INVITE_USER,
      invitedBy,
      { email, inviteId: savedInvite.id },
      `Invite sent to ${email}`,
    );

    return savedInvite;
  }

  async getInstitutionMembers(institutionId: string): Promise<User[]> {
    return await this.userRepository.find({
      where: { institutionId },
      order: { createdAt: 'DESC' },
    });
  }

  async getAuditLogs(institutionId: string, limit: number = 50): Promise<AuditLog[]> {
    return await this.auditLogRepository.find({
      where: { institutionId },
      order: { createdAt: 'DESC' },
      take: limit,
      relations: ['user'],
    });
  }

  async getPendingInvites(institutionId: string): Promise<UserInvite[]> {
    return await this.inviteRepository.find({
      where: {
        institutionId,
        accepted: false,
      },
      order: { createdAt: 'DESC' },
      relations: ['invitedBy'],
    });
  }

  private async logAudit(
    institutionId: string,
    action: AuditAction,
    userId: string | undefined,
    metadata: Record<string, any>,
    description: string,
  ): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      institutionId,
      userId: userId || null,
      action,
      metadata,
      description,
    });

    return await this.auditLogRepository.save(auditLog);
  }
}
