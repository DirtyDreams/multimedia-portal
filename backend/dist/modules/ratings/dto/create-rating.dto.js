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
exports.CreateRatingDto = exports.RatableType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var RatableType;
(function (RatableType) {
    RatableType["ARTICLE"] = "ARTICLE";
    RatableType["BLOG_POST"] = "BLOG_POST";
    RatableType["WIKI_PAGE"] = "WIKI_PAGE";
    RatableType["GALLERY_ITEM"] = "GALLERY_ITEM";
    RatableType["STORY"] = "STORY";
})(RatableType || (exports.RatableType = RatableType = {}));
class CreateRatingDto {
    value;
    contentType;
    contentId;
}
exports.CreateRatingDto = CreateRatingDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Rating value (1-5 stars)',
        example: 5,
        minimum: 1,
        maximum: 5,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(5),
    __metadata("design:type", Number)
], CreateRatingDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type of content being rated',
        enum: RatableType,
        example: 'ARTICLE',
    }),
    (0, class_validator_1.IsEnum)(RatableType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRatingDto.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID of the content being rated',
        example: '123e4567-e89b-12d3-a456-426614174000',
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRatingDto.prototype, "contentId", void 0);
//# sourceMappingURL=create-rating.dto.js.map