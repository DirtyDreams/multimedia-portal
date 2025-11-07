import { ApiProperty } from '@nestjs/swagger';
import { PopularContentItem, TrendData } from '../analytics.entity';

export class DashboardStatsDto {
  @ApiProperty({
    description: 'Total page views (today)',
    example: 1234,
  })
  totalPageViews: number;

  @ApiProperty({
    description: 'Unique sessions (today)',
    example: 567,
  })
  uniqueSessions: number;

  @ApiProperty({
    description: 'Total content views (today)',
    example: 890,
  })
  totalContentViews: number;

  @ApiProperty({
    description: 'Average time spent on pages (seconds)',
    example: 125,
  })
  averageDuration: number;

  @ApiProperty({
    description: 'Page views growth compared to yesterday (%)',
    example: 15.5,
  })
  pageViewsGrowth: number;

  @ApiProperty({
    description: 'Sessions growth compared to yesterday (%)',
    example: -5.2,
  })
  sessionsGrowth: number;

  @ApiProperty({
    description: 'Most popular paths today',
    example: {
      '/articles': 123,
      '/blog': 89,
      '/wiki': 67,
    },
  })
  popularPaths: Record<string, number>;

  @ApiProperty({
    description: 'Top search queries today',
    example: {
      'nestjs': 45,
      'typescript': 32,
      'react': 28,
    },
  })
  topSearches: Record<string, number>;
}

export class PopularContentDto {
  @ApiProperty({
    description: 'Popular content items',
    type: [Object],
    example: [
      {
        contentType: 'article',
        contentId: 'article-123',
        title: 'Introduction to NestJS',
        views: 456,
        averageDuration: 180,
        engagements: 34,
      },
    ],
  })
  items: PopularContentItem[];

  @ApiProperty({
    description: 'Time period for data',
    example: 'last_7_days',
  })
  period: string;

  @ApiProperty({
    description: 'Total items count',
    example: 50,
  })
  totalCount: number;
}

export class TrendsDto {
  @ApiProperty({
    description: 'Trend data points',
    type: [Object],
    example: [
      {
        period: 'daily',
        label: '2025-01-15',
        pageViews: 1234,
        uniqueSessions: 567,
        contentViews: 890,
        averageDuration: 125,
      },
    ],
  })
  trends: TrendData[];

  @ApiProperty({
    description: 'Period type',
    enum: ['daily', 'weekly', 'monthly'],
    example: 'daily',
  })
  period: 'daily' | 'weekly' | 'monthly';

  @ApiProperty({
    description: 'Number of data points',
    example: 30,
  })
  dataPoints: number;
}

export class UserPathDto {
  @ApiProperty({
    description: 'Common user navigation paths',
    example: [
      {
        path: ['/blog', '/articles', '/articles/123'],
        count: 45,
        averageDuration: 300,
      },
    ],
  })
  paths: Array<{
    path: string[];
    count: number;
    averageDuration: number;
  }>;

  @ApiProperty({
    description: 'Entry pages (where users start)',
    example: {
      '/': 234,
      '/articles': 123,
      '/blog': 89,
    },
  })
  entryPages: Record<string, number>;

  @ApiProperty({
    description: 'Exit pages (where users leave)',
    example: {
      '/articles/123': 45,
      '/blog/456': 32,
    },
  })
  exitPages: Record<string, number>;
}
