import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserPreferences, DigestFrequency, DeliveryMethod } from './user-preferences.entity';

@Injectable()
export class UserPreferencesService {
  constructor(
    @InjectRepository(UserPreferences)
    private userPreferencesRepository: Repository<UserPreferences>,
  ) {}

  async getOrCreate(userId: string): Promise<UserPreferences> {
    let preferences = await this.userPreferencesRepository.findOne({
      where: { userId },
    });

    if (!preferences) {
      preferences = this.userPreferencesRepository.create({
        userId,
        digestFrequency: DigestFrequency.WEEKLY,
        deliveryMethod: DeliveryMethod.EMAIL,
      });
      await this.userPreferencesRepository.save(preferences);
    }

    return preferences;
  }

  async update(
    userId: string,
    updates: Partial<Pick<UserPreferences, 'digestFrequency' | 'deliveryMethod'>>,
  ): Promise<UserPreferences> {
    const preferences = await this.getOrCreate(userId);
    Object.assign(preferences, updates);
    return this.userPreferencesRepository.save(preferences);
  }

  async updateLastDigestSent(userId: string): Promise<void> {
    await this.userPreferencesRepository.update(
      { userId },
      { lastDigestSentAt: new Date() },
    );
  }

  async getUsersForWeeklyDigest(): Promise<UserPreferences[]> {
    return this.userPreferencesRepository
      .createQueryBuilder('prefs')
      .where('prefs.digestFrequency = :frequency', { frequency: DigestFrequency.WEEKLY })
      .andWhere('(prefs.deliveryMethod = :email OR prefs.deliveryMethod = :both)', {
        email: DeliveryMethod.EMAIL,
        both: DeliveryMethod.BOTH,
      })
      .getMany();
  }

  async getUsersForDailyDigest(): Promise<UserPreferences[]> {
    return this.userPreferencesRepository
      .createQueryBuilder('prefs')
      .where('prefs.digestFrequency = :frequency', { frequency: DigestFrequency.DAILY })
      .andWhere('(prefs.deliveryMethod = :email OR prefs.deliveryMethod = :both)', {
        email: DeliveryMethod.EMAIL,
        both: DeliveryMethod.BOTH,
      })
      .getMany();
  }
}
