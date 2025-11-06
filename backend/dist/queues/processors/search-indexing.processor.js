"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SearchIndexingProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchIndexingProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const search_service_1 = require("../../modules/search/search.service");
let SearchIndexingProcessor = SearchIndexingProcessor_1 = class SearchIndexingProcessor {
    searchService;
    logger = new common_1.Logger(SearchIndexingProcessor_1.name);
    constructor(searchService) {
        this.searchService = searchService;
    }
    async handleIndexContent(job) {
        this.logger.log(`Processing search indexing job ${job.id}`);
        const { contentType, contentId, operation } = job.data;
        try {
            await job.progress(10);
            if (operation === 'delete') {
                await this.searchService.deleteDocument(contentId);
                this.logger.log(`Deleted document ${contentId} from search index`);
            }
            else {
                switch (contentType) {
                    case 'article':
                        await this.searchService.indexArticle(contentId);
                        break;
                    case 'blogPost':
                        await this.searchService.indexBlogPost(contentId);
                        break;
                    default:
                        this.logger.warn(`Indexing for ${contentType} not yet implemented, will be indexed in bulk reindex`);
                }
                this.logger.log(`Indexed ${contentType} ${contentId} successfully`);
            }
            await job.progress(100);
            return {
                success: true,
                contentType,
                contentId,
                operation,
                indexedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error(`Failed to ${operation} ${contentType} ${contentId}:`, error);
            throw error;
        }
    }
    async handleReindexAll(job) {
        this.logger.log(`Processing full reindex job ${job.id}`);
        try {
            await job.progress(10);
            this.logger.log('Starting full content reindex...');
            const result = await this.searchService.indexAllContent();
            await job.progress(100);
            this.logger.log(`Full reindex completed: ${result.indexed} documents indexed`);
            return {
                success: true,
                ...result,
                reindexedAt: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Failed to reindex all content:', error);
            throw error;
        }
    }
};
exports.SearchIndexingProcessor = SearchIndexingProcessor;
__decorate([
    (0, bull_1.Process)('index-content'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SearchIndexingProcessor.prototype, "handleIndexContent", null);
__decorate([
    (0, bull_1.Process)('reindex-all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SearchIndexingProcessor.prototype, "handleReindexAll", null);
exports.SearchIndexingProcessor = SearchIndexingProcessor = SearchIndexingProcessor_1 = __decorate([
    (0, bull_1.Processor)('search-indexing'),
    __metadata("design:paramtypes", [search_service_1.SearchService])
], SearchIndexingProcessor);
//# sourceMappingURL=search-indexing.processor.js.map