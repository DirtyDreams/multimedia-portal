import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsArray,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ContentTypeFilter {
  ARTICLE = 'article',
  BLOG_POST = 'blogPost',
  WIKI_PAGE = 'wikiPage',
  GALLERY_ITEM = 'galleryItem',
  STORY = 'story',
}

export class SearchQueryDto {
  @ApiProperty({
    description: 'Search query string',
    example: 'javascript tutorial',
  })
  @IsString()
  q: string;

  @ApiPropertyOptional({
    description: 'Content types to search in',
    type: [String],
    enum: ContentTypeFilter,
    example: ['article', 'blogPost'],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(ContentTypeFilter, { each: true })
  contentTypes?: ContentTypeFilter[];

  @ApiPropertyOptional({
    description: 'Number of results per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Offset for pagination',
    default: 0,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Attributes to retrieve',
    type: [String],
    example: ['id', 'title', 'excerpt'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attributesToRetrieve?: string[];

  @ApiPropertyOptional({
    description: 'Facets to compute',
    type: [String],
    example: ['contentType', 'status', 'authorId'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  facets?: string[];

  @ApiPropertyOptional({
    description: 'Filter expression',
    example: 'status = PUBLISHED AND authorId = "abc123"',
  })
  @IsOptional()
  @IsString()
  filter?: string;
}
