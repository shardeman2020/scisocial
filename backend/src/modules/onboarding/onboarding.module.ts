import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { ResearcherOnboarding } from './researcher-onboarding.entity';
import { User } from '../user/user.entity';
import { InstitutionSettings } from '../institution-admin/institution-settings.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ResearcherOnboarding,
      User,
      InstitutionSettings,
    ]),
  ],
  controllers: [OnboardingController],
  providers: [OnboardingService],
  exports: [OnboardingService],
})
export class OnboardingModule {}
