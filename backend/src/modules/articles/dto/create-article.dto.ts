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
import {
  SanitizeHtml,
  SanitizeHtmlStrict,
  StripHtml,
} from '../../../common/decorators';

enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateArticleDto {
  @ApiProperty({ description: 'Article title', example: 'Introduction to NestJS' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  @StripHtml() // Remove all HTML from titles
  title: string;

  @ApiProperty({ description: 'Article content in HTML or Markdown' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @SanitizeHtml() // Allow safe HTML tags, remove dangerous content
  content: string;

  @ApiPropertyOptional({ description: 'Short excerpt or summary' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  @SanitizeHtmlStrict() // Allow only basic formatting
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsString()
  @IsOptional()
  featuredImage?: string;

  @ApiPropertyOptional({
    description: 'Article status',
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
