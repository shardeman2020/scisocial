import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiSummarizationService {
  private anthropic: Anthropic;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (apiKey && apiKey !== 'your-api-key-here') {
      this.anthropic = new Anthropic({
        apiKey,
      });
    }
  }

  async summarizePaper(title: string, abstract: string, authors: string[]): Promise<string> {
    // If no API key, return a default summary
    if (!this.anthropic) {
      return `${authors[0]} et al. published "${title.substring(0, 80)}..." - A groundbreaking study in their field.`;
    }

    try {
      const prompt = `You are a science communicator creating engaging 1-2 sentence summaries for a social media platform.

Paper Title: ${title}
Authors: ${authors.slice(0, 3).join(', ')}${authors.length > 3 ? ' et al.' : ''}
Abstract: ${abstract || 'Abstract not available'}

Create an engaging, accessible 1-2 sentence summary (max 200 characters) that:
1. Highlights the key discovery or contribution
2. Is exciting and shareable
3. Uses clear language (avoid jargon)
4. Focuses on the "why it matters"

Summary:`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const summary = message.content[0].type === 'text'
        ? message.content[0].text.trim()
        : 'Fascinating research with significant implications.';

      return summary;
    } catch (error) {
      console.error('AI summarization failed:', error.message);
      // Fallback summary
      return `${authors[0]} et al. investigate ${title.toLowerCase().substring(0, 80)}...`;
    }
  }
}
