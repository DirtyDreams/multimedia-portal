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
exports.CreateWikiPageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../../common/decorators");
var ContentStatus;
(function (ContentStatus) {
    ContentStatus["DRAFT"] = "DRAFT";
    ContentStatus["PUBLISHED"] = "PUBLISHED";
    ContentStatus["ARCHIVED"] = "ARCHIVED";
})(ContentStatus || (ContentStatus = {}));
class CreateWikiPageDto {
    title;
    content;
    status;
    authorId;
    parentId;
    categoryIds;
    tagIds;
}
exports.CreateWikiPageDto = CreateWikiPageDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wiki page title', example: 'Getting Started Guide' }),
    (0, decorators_1.StripHtml)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], CreateWikiPageDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wiki page content in HTML or Markdown' }),
    (0, decorators_1.SanitizeHtml)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(10),
    __metadata("design:type", String)
], CreateWikiPageDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Wiki page status',
        enum: ContentStatus,
        default: ContentStatus.DRAFT,
    }),
    (0, class_validator_1.IsEnum)(ContentStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWikiPageDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Author ID' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateWikiPageDto.prototype, "authorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Parent wiki page ID for hierarchical structure' }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateWikiPageDto.prototype, "parentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Category IDs', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateWikiPageDto.prototype, "categoryIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Tag IDs', type: [String] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateWikiPageDto.prototype, "tagIds", void 0);
//# sourceMappingURL=create-wiki-page.dto.js.map