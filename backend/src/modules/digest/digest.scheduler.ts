import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class DigestScheduler {
  constructor(
    @InjectQueue('digest') private digestQueue: Queue,
  ) {}

  // Run weekly digest every Sunday at midnight
  @Cron(CronExpression.EVERY_WEEK, {
    name: 'weekly-digest',
    timeZone: 'UTC',
  })
  async scheduleWeeklyDigest() {
    console.log('Scheduling weekly digest job...');
    await this.digestQueue.add('weekly', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 minute
      },
    });
  }

  // Run daily digest every day at midnight
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'daily-digest',
    timeZone: 'UTC',
  })
  async scheduleDailyDigest() {
    console.log('Scheduling daily digest job...');
    await this.digestQueue.add('daily', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 minute
      },
    });
  }

  // Manual trigger for testing (can be called via API endpoint if needed)
  async triggerWeeklyDigestNow() {
    console.log('Manually triggering weekly digest...');
    await this.digestQueue.add('weekly', {}, { priority: 1 });
  }

  async triggerDailyDigestNow() {
    console.log('Manually triggering daily digest...');
    await this.digestQueue.add('daily', {}, { priority: 1 });
  }
}
