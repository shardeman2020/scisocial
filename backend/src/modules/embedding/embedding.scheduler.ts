import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EmbeddingScheduler {
  constructor(
    @InjectQueue('embedding') private embeddingQueue: Queue,
  ) {}

  // Run embedding generation every hour
  @Cron(CronExpression.EVERY_HOUR, {
    name: 'generate-embeddings',
    timeZone: 'UTC',
  })
  async scheduleEmbeddingGeneration() {
    console.log('Scheduling embedding generation job...');
    await this.embeddingQueue.add('generate-all', {}, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000, // 1 minute
      },
    });
  }

  // Manual trigger for immediate embedding generation
  async triggerEmbeddingGenerationNow() {
    console.log('Manually triggering embedding generation...');
    await this.embeddingQueue.add('generate-all', {}, { priority: 1 });
  }

  // Trigger only post embeddings
  async triggerPostEmbeddingsNow() {
    console.log('Manually triggering post embedding generation...');
    await this.embeddingQueue.add('generate-posts', {}, { priority: 1 });
  }
}
