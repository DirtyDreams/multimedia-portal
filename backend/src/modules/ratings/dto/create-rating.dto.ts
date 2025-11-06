import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  Min,
  Max,
} from 'class-validator';

export enum RatableType {
  ARTICLE = 'ARTICLE',
  BLOG_POST = 'BLOG_POST',
  WIKI_PAGE = 'WIKI_PAGE',
  GALLERY_ITEM = 'GALLERY_ITEM',
  STORY = 'STORY',
}

export class CreateRatingDto {
  @ApiProperty({
    description: 'Rating value (1-5 stars)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  @Max(5)
  value: number;

  @ApiProperty({
    description: 'Type of content being rated',
    enum: RatableType,
    example: 'ARTICLE',
  })
  @IsEnum(RatableType)
  @IsNotEmpty()
  contentType: RatableType;

  @ApiProperty({
    description: 'ID of the content being rated',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  contentId: string;
}
