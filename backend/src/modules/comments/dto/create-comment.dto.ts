import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { SanitizeHtmlStrict } from '../../../common/decorators';

export enum CommentableType {
  ARTICLE = 'ARTICLE',
  BLOG_POST = 'BLOG_POST',
  WIKI_PAGE = 'WIKI_PAGE',
  GALLERY_ITEM = 'GALLERY_ITEM',
  STORY = 'STORY',
}

export class CreateCommentDto {
  @ApiProperty({
    description: 'Comment content',
    example: 'Great article! Very informative.',
    minLength: 1,
    maxLength: 5000,
  })
  // Allow only basic HTML formatting (bold, italic) in comments
  @SanitizeHtmlStrict()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(5000)
  content: string;

  @ApiProperty({
    description: 'Type of content being commented on',
    enum: CommentableType,
    example: 'ARTICLE',
  })
  @IsEnum(CommentableType)
  @IsNotEmpty()
  contentType: CommentableType;

  @ApiProperty({
    description: 'ID of the content being commented on',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  contentId: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID for nested replies',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  @IsOptional()
  parentId?: string;
}
