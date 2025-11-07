import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType, ContentType } from '../analytics.entity';

export class TrackPageViewDto {
  @ApiProperty({
    description: 'Page path (e.g., /articles/my-article)',
    example: '/articles/introduction-to-nestjs',
  })
  @IsString()
  path: string;

  @ApiPropertyOptional({
    description: 'Referrer URL',
    example: 'https://google.com',
  })
  @IsString()
  @IsOptional()
  referrer?: string;

  @ApiPropertyOptional({
    description: 'Time spent on page in seconds',
    example: 45,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(7200) // Max 2 hours
  duration?: number;
}

export class TrackContentViewDto {
  @ApiProperty({
    description: 'Content type',
    enum: ContentType,
    example: ContentType.ARTICLE,
  })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({
    description: 'Content ID',
    example: 'article-123',
  })
  @IsString()
  contentId: string;

  @ApiPropertyOptional({
    description: 'Time spent viewing content in seconds',
    example: 120,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(7200)
  duration?: number;
}

export class TrackSearchDto {
  @ApiProperty({
    description: 'Search query',
    example: 'nestjs tutorial',
  })
  @IsString()
  query: string;

  @ApiProperty({
    description: 'Number of results returned',
    example: 42,
  })
  @IsNumber()
  @Min(0)
  resultsCount: number;
}

export class TrackEngagementDto {
  @ApiProperty({
    description: 'Engagement event name',
    example: 'comment',
    enum: ['comment', 'rating', 'share', 'like', 'bookmark'],
  })
  @IsString()
  eventName: string;

  @ApiProperty({
    description: 'Content type',
    enum: ContentType,
    example: ContentType.ARTICLE,
  })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiProperty({
    description: 'Content ID',
    example: 'article-123',
  })
  @IsString()
  contentId: string;
}
