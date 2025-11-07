import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { EventType, ContentType } from '../interfaces/analytics.interface';

export class TrackEventDto {
  @ApiProperty({
    enum: EventType,
    description: 'Type of analytics event',
    example: EventType.CONTENT_VIEW,
  })
  @IsEnum(EventType)
  type: EventType;

  @ApiPropertyOptional({
    enum: ContentType,
    description: 'Type of content being tracked',
    example: ContentType.ARTICLE,
  })
  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @ApiPropertyOptional({
    description: 'ID of the content being tracked',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  contentId?: string;

  @ApiPropertyOptional({
    description: 'Page path',
    example: '/articles/introduction-to-nestjs',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  path?: string;

  @ApiPropertyOptional({
    description: 'Referrer URL',
    example: 'https://google.com',
  })
  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  referrer?: string;

  @ApiPropertyOptional({
    description: 'Session ID for tracking user journey',
    example: 'session_abc123',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  sessionId?: string;
}
