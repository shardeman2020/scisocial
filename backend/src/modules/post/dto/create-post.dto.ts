import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value || 'AI-generated summary')
  content: string;

  @IsString()
  @IsNotEmpty()
  doi: string;

  @IsArray()
  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return [];
  })
  images?: { url: string; altText?: string | null }[];
}
