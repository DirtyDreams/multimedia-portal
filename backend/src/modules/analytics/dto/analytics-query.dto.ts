import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentType } from '../interfaces/analytics.interface';

export enum TimePeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    enum: TimePeriod,
    description: 'Time period for analytics',
    default: TimePeriod.WEEK,
  })
  @IsEnum(TimePeriod)
  @IsOptional()
  period?: TimePeriod = TimePeriod.WEEK;

  @ApiPropertyOptional({
    enum: ContentType,
    description: 'Filter by content type',
  })
  @IsEnum(ContentType)
  @IsOptional()
  contentType?: ContentType;

  @ApiPropertyOptional({
    description: 'Number of results to return',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Start date for analytics (ISO 8601)',
    example: '2025-01-01',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for analytics (ISO 8601)',
    example: '2025-12-31',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
