import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';

export enum VersionableType {
  ARTICLE = 'ARTICLE',
  BLOG_POST = 'BLOG_POST',
  WIKI_PAGE = 'WIKI_PAGE',
  GALLERY_ITEM = 'GALLERY_ITEM',
  STORY = 'STORY',
}

export class CreateContentVersionDto {
  @ApiProperty({ enum: VersionableType, description: 'Type of content being versioned' })
  @IsEnum(VersionableType)
  @IsNotEmpty()
  contentType: VersionableType;

  @ApiProperty({ description: 'ID of the content being versioned' })
  @IsString()
  @IsNotEmpty()
  contentId: string;

  @ApiProperty({ description: 'Version number (auto-incremented if not provided)' })
  @IsNotEmpty()
  versionNumber: number;

  @ApiProperty({ description: 'Content title at this version' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Content body at this version' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ description: 'Excerpt at this version' })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiPropertyOptional({ description: 'Additional metadata as JSON' })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Note explaining this version change' })
  @IsString()
  @IsOptional()
  changeNote?: string;
}
