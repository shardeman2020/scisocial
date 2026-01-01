import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModerationEvent } from './moderation-event.entity';

interface FlagContentDto {
  entityType: 'post' | 'topic' | 'journal' | 'user';
  entityId: string;
  flagType: 'misinformation' | 'spam' | 'harassment' | 'low-quality' | 'other';
  description?: string;
  flaggedBy?: string; // null for anonymous
}

interface UpdateStatusDto {
  status: 'reviewed' | 'resolved' | 'dismissed';
  reviewedBy: string;
  reviewNote?: string;
}

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(ModerationEvent)
    private moderationEventRepository: Repository<ModerationEvent>,
  ) {}

  async flagContent(dto: FlagContentDto): Promise<ModerationEvent> {
    const event = this.moderationEventRepository.create({
      entityType: dto.entityType,
      entityId: dto.entityId,
      flagType: dto.flagType,
      description: dto.description,
      flaggedBy: dto.flaggedBy || null,
      status: 'pending',
    });

    const savedEvent = await this.moderationEventRepository.save(event);

    // TODO: In production, trigger notification to moderators
    // await this.notifyModerators(savedEvent);

    return savedEvent;
  }

  async getEvents(options?: {
    status?: string;
    entityType?: string;
    limit?: number;
  }): Promise<ModerationEvent[]> {
    const queryBuilder = this.moderationEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.flagger', 'flagger')
      .leftJoinAndSelect('event.reviewer', 'reviewer')
      .orderBy('event.createdAt', 'DESC');

    if (options?.status) {
      queryBuilder.where('event.status = :status', { status: options.status });
    }

    if (options?.entityType) {
      queryBuilder.andWhere('event.entityType = :entityType', {
        entityType: options.entityType,
      });
    }

    if (options?.limit) {
      queryBuilder.limit(options.limit);
    }

    return queryBuilder.getMany();
  }

  async getEventById(id: string): Promise<ModerationEvent> {
    return this.moderationEventRepository.findOne({
      where: { id },
      relations: ['flagger', 'reviewer'],
    });
  }

  async updateStatus(
    id: string,
    dto: UpdateStatusDto,
  ): Promise<ModerationEvent> {
    const event = await this.moderationEventRepository.findOne({
      where: { id },
    });

    if (!event) {
      throw new Error('Moderation event not found');
    }

    event.status = dto.status;
    event.reviewedBy = dto.reviewedBy;
    event.reviewNote = dto.reviewNote;

    return this.moderationEventRepository.save(event);
  }

  async getTransparencyLog(entityId: string): Promise<ModerationEvent[]> {
    // Public view showing only resolved/dismissed flags for transparency
    return this.moderationEventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.reviewer', 'reviewer')
      .where('event.entityId = :entityId', { entityId })
      .andWhere('event.status IN (:...statuses)', {
        statuses: ['resolved', 'dismissed'],
      })
      .orderBy('event.updatedAt', 'DESC')
      .getMany();
  }

  async getModerationStats(): Promise<{
    total: number;
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
    byFlagType: Array<{ flagType: string; count: number }>;
    byEntityType: Array<{ entityType: string; count: number }>;
  }> {
    const [
      total,
      pending,
      reviewed,
      resolved,
      dismissed,
      byFlagType,
      byEntityType,
    ] = await Promise.all([
      this.moderationEventRepository.count(),
      this.moderationEventRepository.count({ where: { status: 'pending' } }),
      this.moderationEventRepository.count({ where: { status: 'reviewed' } }),
      this.moderationEventRepository.count({ where: { status: 'resolved' } }),
      this.moderationEventRepository.count({ where: { status: 'dismissed' } }),
      this.moderationEventRepository
        .createQueryBuilder('event')
        .select('event.flagType', 'flagType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.flagType')
        .getRawMany(),
      this.moderationEventRepository
        .createQueryBuilder('event')
        .select('event.entityType', 'entityType')
        .addSelect('COUNT(*)', 'count')
        .groupBy('event.entityType')
        .getRawMany(),
    ]);

    return {
      total,
      pending,
      reviewed,
      resolved,
      dismissed,
      byFlagType: byFlagType.map((item) => ({
        flagType: item.flagType,
        count: parseInt(item.count, 10),
      })),
      byEntityType: byEntityType.map((item) => ({
        entityType: item.entityType,
        count: parseInt(item.count, 10),
      })),
    };
  }

  // TODO: Implement in production
  // private async notifyModerators(event: ModerationEvent): Promise<void> {
  //   // Send email or queue notification to moderators
  // }
}
