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
  SanitizeHtmlStrict,
  StripHtml,
} from '../../../common/decorators';

enum ContentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export class CreateGalleryItemDto {
  @ApiProperty({ description: 'Gallery item title', example: 'Sunset Beach Photo' })
  // Remove all HTML tags from title - titles should be plain text only
  @StripHtml()
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Gallery item description' })
  // Allow only basic HTML formatting (bold, italic) in descriptions
  @SanitizeHtmlStrict()
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Gallery item status',
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
