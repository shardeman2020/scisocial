import { Controller, Get, Put, Body, Query } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';
import { DigestFrequency, DeliveryMethod } from './user-preferences.entity';

@Controller('user-preferences')
export class UserPreferencesController {
  constructor(private readonly userPreferencesService: UserPreferencesService) {}

  @Get()
  async getPreferences(@Query('userId') userId: string) {
    return this.userPreferencesService.getOrCreate(userId);
  }

  @Put()
  async updatePreferences(
    @Query('userId') userId: string,
    @Body('digestFrequency') digestFrequency?: DigestFrequency,
    @Body('deliveryMethod') deliveryMethod?: DeliveryMethod,
  ) {
    const updates: any = {};
    if (digestFrequency) updates.digestFrequency = digestFrequency;
    if (deliveryMethod) updates.deliveryMethod = deliveryMethod;

    return this.userPreferencesService.update(userId, updates);
  }
}
