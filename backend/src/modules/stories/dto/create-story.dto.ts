import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateStoryDto {
  @ApiProperty({ description: 'Story title', example: 'The Dragon Quest - Part 1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Story content in HTML or Markdown' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({ description: 'Short excerpt or summary' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsString()
  @IsOptional()
  featuredImage?: string;

  @ApiPropertyOptional({ description: 'Series name for grouping related stories' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  series?: string;

  @ApiPropertyOptional({
    description: 'Story status',
    enum: ContentStatus,
    default: ContentStatus.DRAFT,
  })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiProperty({ description: 'Author ID' })
  @IsUUID()
  @IsNotEmpty()
  authorId: string;

  @ApiPropertyOptional({ description: 'Category IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];

  @ApiPropertyOptional({ description: 'Tag IDs', type: [String] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  tagIds?: string[];
}
