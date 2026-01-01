import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('researchers/:userId/profile')
  async initializeProfile(
    @Param('userId') userId: string,
    @Body()
    body: {
      researchInterests: string[];
      preferredModel?: string;
      digestOptIn?: boolean;
    },
  ) {
    return await this.onboardingService.initializeResearcherProfile(
      userId,
      body.researchInterests,
      body.preferredModel,
      body.digestOptIn,
    );
  }

  @Get('researchers/:userId/checklist')
  async getChecklist(@Param('userId') userId: string) {
    return await this.onboardingService.getChecklistProgress(userId);
  }

  @Patch('researchers/:userId/checklist')
  async updateChecklistStep(
    @Param('userId') userId: string,
    @Body() body: { step: string; value: boolean },
  ) {
    const validSteps = [
      'completedProfile',
      'firstSearch',
      'firstSavedSearch',
      'firstFollow',
      'firstPost',
      'digestPreferencesSet',
      'completedTour',
    ];

    if (!validSteps.includes(body.step)) {
      throw new NotFoundException('Invalid checklist step');
    }

    return await this.onboardingService.updateChecklistStep(
      userId,
      body.step as any,
      body.value,
    );
  }

  @Post('researchers/:userId/complete')
  async completeOnboarding(@Param('userId') userId: string) {
    return await this.onboardingService.completeOnboarding(userId);
  }
}
