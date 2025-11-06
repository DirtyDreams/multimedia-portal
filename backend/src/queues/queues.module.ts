import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailProcessor } from './processors/email.processor';
import { ImageProcessingProcessor } from './processors/image-processing.processor';
import { SearchIndexingProcessor } from './processors/search-indexing.processor';
import { ScheduledPublishProcessor } from './processors/scheduled-publish.processor';
import { QueuesService } from './queues.service';
import { SearchModule } from '../modules/search/search.module';
import { EmailModule } from '../modules/email/email.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 500, // Keep last 500 failed jobs
      },
    }),
    BullModule.registerQueue(
      {
        name: 'email',
      },
      {
        name: 'image-processing',
      },
      {
        name: 'search-indexing',
      },
      {
        name: 'scheduled-publish',
      },
    ),
    SearchModule,
    EmailModule,
    PrismaModule,
  ],
  providers: [
    EmailProcessor,
    ImageProcessingProcessor,
    SearchIndexingProcessor,
    ScheduledPublishProcessor,
    QueuesService,
  ],
  exports: [BullModule, QueuesService],
})
export class QueuesModule {}
