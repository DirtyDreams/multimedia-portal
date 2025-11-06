"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueuesModule = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const email_processor_1 = require("./processors/email.processor");
const image_processing_processor_1 = require("./processors/image-processing.processor");
const search_indexing_processor_1 = require("./processors/search-indexing.processor");
const scheduled_publish_processor_1 = require("./processors/scheduled-publish.processor");
const queues_service_1 = require("./queues.service");
const search_module_1 = require("../modules/search/search.module");
const email_module_1 = require("../modules/email/email.module");
const prisma_module_1 = require("../prisma/prisma.module");
let QueuesModule = class QueuesModule {
};
exports.QueuesModule = QueuesModule;
exports.QueuesModule = QueuesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bull_1.BullModule.forRoot({
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
                    removeOnComplete: 100,
                    removeOnFail: 500,
                },
            }),
            bull_1.BullModule.registerQueue({
                name: 'email',
            }, {
                name: 'image-processing',
            }, {
                name: 'search-indexing',
            }, {
                name: 'scheduled-publish',
            }),
            search_module_1.SearchModule,
            email_module_1.EmailModule,
            prisma_module_1.PrismaModule,
        ],
        providers: [
            email_processor_1.EmailProcessor,
            image_processing_processor_1.ImageProcessingProcessor,
            search_indexing_processor_1.SearchIndexingProcessor,
            scheduled_publish_processor_1.ScheduledPublishProcessor,
            queues_service_1.QueuesService,
        ],
        exports: [bull_1.BullModule, queues_service_1.QueuesService],
    })
], QueuesModule);
//# sourceMappingURL=queues.module.js.map