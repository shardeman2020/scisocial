import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { DigestService } from './digest.service';

@Processor('digest')
export class DigestProcessor {
  constructor(private readonly digestService: DigestService) {}

  @Process('weekly')
  async handleWeeklyDigest(job: Job) {
    console.log('Processing weekly digest job...');
    try {
      await this.digestService.generateWeeklyDigests();
      console.log('Weekly digest job completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Weekly digest job failed:', error);
      throw error;
    }
  }

  @Process('daily')
  async handleDailyDigest(job: Job) {
    console.log('Processing daily digest job...');
    try {
      await this.digestService.generateDailyDigests();
      console.log('Daily digest job completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Daily digest job failed:', error);
      throw error;
    }
  }
}
