import {
  Controller,
  Post,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

class GenerateAltTextDto {
  @IsString()
  @IsNotEmpty()
  imageUrl: string;
}

class GenerateAltTextBatchDto {
  @IsArray()
  @IsNotEmpty()
  imageUrls: string[];
}

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('alt-text')
  async generateAltText(@Body() dto: GenerateAltTextDto) {
    if (!dto.imageUrl) {
      throw new BadRequestException('imageUrl is required');
    }

    const altText = await this.aiService.generateAltText(dto.imageUrl);

    return {
      altText,
      imageUrl: dto.imageUrl,
    };
  }

  @Post('alt-text/batch')
  async generateAltTextBatch(@Body() dto: GenerateAltTextBatchDto) {
    if (!dto.imageUrls || !Array.isArray(dto.imageUrls)) {
      throw new BadRequestException('imageUrls array is required');
    }

    const altTexts = await this.aiService.generateAltTextBatch(dto.imageUrls);

    return {
      results: dto.imageUrls.map((url, index) => ({
        imageUrl: url,
        altText: altTexts[index],
      })),
    };
  }
}
