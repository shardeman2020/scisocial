import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InstitutionAdminController } from './institution-admin.controller';
import { InstitutionOnboardingService } from './institution-onboarding.service';
import { InstitutionSettings } from './institution-settings.entity';
import { AuditLog } from './audit-log.entity';
import { UserInvite } from './user-invite.entity';
import { Institution } from '../institution/institution.entity';
import { User } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Institution,
      User,
      InstitutionSettings,
      AuditLog,
      UserInvite,
    ]),
  ],
  controllers: [InstitutionAdminController],
  providers: [InstitutionOnboardingService],
  exports: [InstitutionOnboardingService],
})
export class InstitutionAdminModule {}
