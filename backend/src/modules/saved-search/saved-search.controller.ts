import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SavedSearchService } from './saved-search.service';

@Controller('saved-searches')
export class SavedSearchController {
  constructor(private readonly savedSearchService: SavedSearchService) {}

  @Post()
  async create(
    @Body('userId') userId: string,
    @Body('query') query: string,
    @Body('filters') filters?: any,
    @Body('name') name?: string,
  ) {
    return this.savedSearchService.create(userId, query, filters, name);
  }

  @Get()
  async findByUser(@Query('userId') userId: string) {
    return this.savedSearchService.findByUser(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Query('userId') userId: string) {
    return this.savedSearchService.findOne(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body() updates: {
      query?: string;
      filters?: any;
      name?: string;
      notificationsEnabled?: boolean;
    },
  ) {
    return this.savedSearchService.update(id, userId, updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Query('userId') userId: string) {
    await this.savedSearchService.delete(id, userId);
    return { message: 'Saved search deleted successfully' };
  }

  @Post(':id/toggle-notifications')
  async toggleNotifications(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    return this.savedSearchService.toggleNotifications(id, userId);
  }
}
