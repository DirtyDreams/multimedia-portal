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
exports.CreateContentVersionDto = exports.VersionableType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var VersionableType;
(function (VersionableType) {
    VersionableType["ARTICLE"] = "ARTICLE";
    VersionableType["BLOG_POST"] = "BLOG_POST";
    VersionableType["WIKI_PAGE"] = "WIKI_PAGE";
    VersionableType["GALLERY_ITEM"] = "GALLERY_ITEM";
    VersionableType["STORY"] = "STORY";
})(VersionableType || (exports.VersionableType = VersionableType = {}));
class CreateContentVersionDto {
    contentType;
    contentId;
    versionNumber;
    title;
    content;
    excerpt;
    metadata;
    changeNote;
}
exports.CreateContentVersionDto = CreateContentVersionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: VersionableType, description: 'Type of content being versioned' }),
    (0, class_validator_1.IsEnum)(VersionableType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateContentVersionDto.prototype, "contentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID of the content being versioned' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateContentVersionDto.prototype, "contentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Version number (auto-incremented if not provided)' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], CreateContentVersionDto.prototype, "versionNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Content title at this version' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateContentVersionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Content body at this version' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateContentVersionDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Excerpt at this version' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContentVersionDto.prototype, "excerpt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata as JSON' }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateContentVersionDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Note explaining this version change' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CreateContentVersionDto.prototype, "changeNote", void 0);
//# sourceMappingURL=create-content-version.dto.js.map