import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InstitutionOnboardingService } from './institution-onboarding.service';
import { InstitutionSettings } from './institution-settings.entity';
import { UserRole, User } from '../user/user.entity';
import { AuditLog, AuditAction } from './audit-log.entity';

@Controller('institutions')
export class InstitutionAdminController {
  constructor(
    private readonly onboardingService: InstitutionOnboardingService,
    @InjectRepository(InstitutionSettings)
    private settingsRepository: Repository<InstitutionSettings>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  @Post()
  async createInstitution(
    @Body() body: { name: string; slug: string; adminUserId?: string },
  ) {
    return await this.onboardingService.createInstitution(
      body.name,
      body.slug,
      body.adminUserId,
    );
  }

  @Post(':id/admins')
  async assignAdmin(
    @Param('id') institutionId: string,
    @Body() body: { userId: string; assignedBy?: string },
  ) {
    return await this.onboardingService.assignAdmin(
      body.userId,
      institutionId,
      body.assignedBy,
    );
  }

  @Post(':id/invite')
  async inviteUser(
    @Param('id') institutionId: string,
    @Body() body: { email: string; invitedBy: string },
  ) {
    return await this.onboardingService.inviteUser(
      body.email,
      institutionId,
      body.invitedBy,
    );
  }

  @Get(':id/settings')
  async getSettings(@Param('id') institutionId: string) {
    const settings = await this.settingsRepository.findOne({
      where: { institutionId },
    });

    if (!settings) {
      // Initialize settings if they don't exist
      return await this.onboardingService.initializeDefaultSettings(institutionId);
    }

    return settings;
  }

  @Patch(':id/settings')
  async updateSettings(
    @Param('id') institutionId: string,
    @Body()
    body: {
      defaultModel?: string;
      moderationPolicy?: any;
      digestPreferences?: any;
      searchPreferences?: any;
      branding?: any;
      updatedBy?: string;
    },
  ) {
    const settings = await this.settingsRepository.findOne({
      where: { institutionId },
    });

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    // Update fields if provided
    if (body.defaultModel) settings.defaultModel = body.defaultModel;
    if (body.moderationPolicy) settings.moderationPolicy = body.moderationPolicy;
    if (body.digestPreferences) settings.digestPreferences = body.digestPreferences;
    if (body.searchPreferences) settings.searchPreferences = body.searchPreferences;
    if (body.branding) settings.branding = body.branding;

    const updatedSettings = await this.settingsRepository.save(settings);

    // Log audit event
    const auditLog = this.auditLogRepository.create({
      institutionId,
      userId: body.updatedBy || null,
      action: AuditAction.UPDATE_SETTINGS,
      metadata: body,
      description: 'Institution settings updated',
    });
    await this.auditLogRepository.save(auditLog);

    return updatedSettings;
  }

  @Get(':id/members')
  async getMembers(@Param('id') institutionId: string) {
    return await this.onboardingService.getInstitutionMembers(institutionId);
  }

  @Get(':id/audit-logs')
  async getAuditLogs(
    @Param('id') institutionId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.onboardingService.getAuditLogs(institutionId, limitNum);
  }

  @Get(':id/pending-invites')
  async getPendingInvites(@Param('id') institutionId: string) {
    return await this.onboardingService.getPendingInvites(institutionId);
  }

  @Patch(':id/users/:userId/role')
  async updateUserRole(
    @Param('id') institutionId: string,
    @Param('userId') userId: string,
    @Body() body: { role: UserRole; updatedBy?: string },
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || user.institutionId !== institutionId) {
      throw new NotFoundException('User not found in this institution');
    }

    user.role = body.role;
    const updatedUser = await this.userRepository.save(user);

    // Log audit event
    const auditLog = this.auditLogRepository.create({
      institutionId,
      userId: body.updatedBy || null,
      action: AuditAction.UPDATE_USER_ROLE,
      metadata: { targetUserId: userId, newRole: body.role },
      description: `User role updated to ${body.role}`,
    });
    await this.auditLogRepository.save(auditLog);

    return updatedUser;
  }

  @Get(':id/branding')
  async getBranding(@Param('id') institutionId: string) {
    const settings = await this.settingsRepository.findOne({
      where: { institutionId },
    });

    if (!settings) {
      // Return default branding
      return {
        logoUrl: null,
        accentColor: '#9333ea',
        tagline: 'Citation-Backed Scientific Discourse',
        welcomeMessage: 'Welcome to SciSocial',
      };
    }

    return {
      logoUrl: settings.branding?.logoUrl || null,
      accentColor: settings.branding?.accentColor || '#9333ea',
      tagline: settings.branding?.tagline || 'Citation-Backed Scientific Discourse',
      welcomeMessage: settings.branding?.welcomeMessage || 'Welcome to SciSocial',
    };
  }
}
