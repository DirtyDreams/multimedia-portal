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
exports.CreateCommentDto = exports.CommentableType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const decorators_1 = require("../../../common/decorators");
var CommentableType;
(function (CommentableType) {
    CommentableType["ARTICLE"] = "ARTICLE";
    CommentableType["BLOG_POST"] = "BLOG_POST";
    CommentableType["WIKI_PAGE"] = "WIKI_PAGE";
    CommentableType["GALLERY_ITEM"] = "GALLERY_ITEM";
    CommentableType["STORY"] = "STORY";
})(CommentableType || (exports.CommentableType = CommentableType = {}));
class CreateCommentDto {
    content;
    contentType;
    contentId;
    parentId;
}
exports.CreateCommentDto = CreateCommentDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Comment content',
        example: 'Great article! Very informative.',
        minLength: 1,
        maxLength: 5000,
    }),
    (0, decorators_1.SanitizeHtmlStrict)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(5000),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of content being commented on',
        enum: CommentableType,
        example: 'ARTICLE',
    }),
    (0, class_validator_1.IsEnum)(CommentableType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the content being commented on',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "contentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Parent comment ID for nested replies',
        example: '123e4567-e89b-12d3-a456-426614174001',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateCommentDto.prototype, "parentId", void 0);
//# sourceMappingURL=create-comment.dto.js.map