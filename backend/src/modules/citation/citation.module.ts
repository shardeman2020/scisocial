import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Citation } from './citation.entity';
import { CitationService } from './citation.service';
import { AiSummarizationService } from './ai-summarization.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Citation]),
    HttpModule,
  ],
  providers: [CitationService, AiSummarizationService],
  exports: [CitationService],
})
export class CitationModule {}
