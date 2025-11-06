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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchQueryDto = exports.ContentTypeFilter = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var ContentTypeFilter;
(function (ContentTypeFilter) {
    ContentTypeFilter["ARTICLE"] = "article";
    ContentTypeFilter["BLOG_POST"] = "blogPost";
    ContentTypeFilter["WIKI_PAGE"] = "wikiPage";
    ContentTypeFilter["GALLERY_ITEM"] = "galleryItem";
    ContentTypeFilter["STORY"] = "story";
})(ContentTypeFilter || (exports.ContentTypeFilter = ContentTypeFilter = {}));
class SearchQueryDto {
    q;
    contentTypes;
    limit = 20;
    offset = 0;
    attributesToRetrieve;
    facets;
    filter;
}
exports.SearchQueryDto = SearchQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Search query string',
        example: 'javascript tutorial',
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "q", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Content types to search in',
        type: [String],
        enum: ContentTypeFilter,
        example: ['article', 'blogPost'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(ContentTypeFilter, { each: true }),
    __metadata("design:type", Array)
], SearchQueryDto.prototype, "contentTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Number of results per page',
        default: 20,
        minimum: 1,
        maximum: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Offset for pagination',
        default: 0,
        minimum: 0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SearchQueryDto.prototype, "offset", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Attributes to retrieve',
        type: [String],
        example: ['id', 'title', 'excerpt'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SearchQueryDto.prototype, "attributesToRetrieve", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Facets to compute',
        type: [String],
        example: ['contentType', 'status', 'authorId'],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SearchQueryDto.prototype, "facets", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Filter expression',
        example: 'status = PUBLISHED AND authorId = "abc123"',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SearchQueryDto.prototype, "filter", void 0);
//# sourceMappingURL=search-query.dto.js.map