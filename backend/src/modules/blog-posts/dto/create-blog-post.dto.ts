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

export class CreateBlogPostDto {
  @ApiProperty({ description: 'Blog post title', example: 'Getting Started with React' })
  // Remove all HTML tags from title - titles should be plain text only
  @StripHtml()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiProperty({ description: 'Blog post content in HTML or Markdown' })
  // Allow safe HTML content (paragraphs, bold, italic, links, etc.)
  @SanitizeHtml()
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  content: string;

  @ApiPropertyOptional({ description: 'Short excerpt or summary' })
  // Allow only basic HTML formatting (bold, italic) in excerpts
  @SanitizeHtmlStrict()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsString()
  @IsOptional()
  featuredImage?: string;

  @ApiPropertyOptional({
    description: 'Blog post status',
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
