import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ResearcherOnboarding } from './researcher-onboarding.entity';
import { User } from '../user/user.entity';
import { InstitutionSettings } from '../institution-admin/institution-settings.entity';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(ResearcherOnboarding)
    private onboardingRepository: Repository<ResearcherOnboarding>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(InstitutionSettings)
    private settingsRepository: Repository<InstitutionSettings>,
  ) {}

  async initializeResearcherProfile(
    userId: string,
    researchInterests: string[],
    preferredModel?: string,
    digestOptIn?: boolean,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['institution'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get institution settings if user has an institution
    let institutionSettings = null;
    if (user.institutionId) {
      institutionSettings = await this.settingsRepository.findOne({
        where: { institutionId: user.institutionId },
      });
    }

    // Update user with researcher profile data
    user.expertiseTags = researchInterests;
    user.preferredModel = preferredModel || institutionSettings?.defaultModel || 'general';
    user.digestOptIn = digestOptIn !== undefined ? digestOptIn : institutionSettings?.digestPreferences?.enabled ?? true;

    const updatedUser = await this.userRepository.save(user);

    // Create or update onboarding checklist
    await this.updateChecklistStep(userId, 'completedProfile', true);

    return updatedUser;
  }

  async getOrCreateChecklist(userId: string): Promise<ResearcherOnboarding> {
    let checklist = await this.onboardingRepository.findOne({
      where: { userId },
      relations: ['user'],
    });

    if (!checklist) {
      checklist = this.onboardingRepository.create({
        userId,
      });
      await this.onboardingRepository.save(checklist);
    }

    return checklist;
  }

  async updateChecklistStep(
    userId: string,
    step: keyof Omit<ResearcherOnboarding, 'id' | 'userId' | 'user' | 'createdAt' | 'updatedAt' | 'completedAt' | 'isComplete' | 'completionPercentage'>,
    value: boolean,
  ): Promise<ResearcherOnboarding> {
    const checklist = await this.getOrCreateChecklist(userId);

    checklist[step] = value;

    // Check if all steps are complete
    if (
      checklist.completedProfile &&
      checklist.firstSearch &&
      checklist.firstSavedSearch &&
      checklist.firstFollow &&
      checklist.firstPost &&
      checklist.digestPreferencesSet &&
      checklist.completedTour
    ) {
      checklist.completedAt = new Date();
    }

    return await this.onboardingRepository.save(checklist);
  }

  async getChecklistProgress(userId: string): Promise<{
    checklist: ResearcherOnboarding;
    completionPercentage: number;
    isComplete: boolean;
  }> {
    const checklist = await this.getOrCreateChecklist(userId);

    const steps = [
      checklist.completedProfile,
      checklist.firstSearch,
      checklist.firstSavedSearch,
      checklist.firstFollow,
      checklist.firstPost,
      checklist.digestPreferencesSet,
      checklist.completedTour,
    ];

    const completed = steps.filter((step) => step).length;
    const completionPercentage = Math.round((completed / steps.length) * 100);
    const isComplete = completed === steps.length;

    return {
      checklist,
      completionPercentage,
      isComplete,
    };
  }

  async completeOnboarding(userId: string): Promise<ResearcherOnboarding> {
    const checklist = await this.getOrCreateChecklist(userId);

    checklist.completedTour = true;

    if (
      checklist.completedProfile &&
      checklist.firstSearch &&
      checklist.firstSavedSearch &&
      checklist.firstFollow &&
      checklist.firstPost &&
      checklist.digestPreferencesSet
    ) {
      checklist.completedAt = new Date();
    }

    return await this.onboardingRepository.save(checklist);
  }
}
