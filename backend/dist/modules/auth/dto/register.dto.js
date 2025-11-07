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
exports.RegisterDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../../../common/decorators");
class RegisterDto {
    email;
    username;
    password;
    name;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'john.doe@example.com',
        description: 'User email address',
    }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'johndoe',
        description: 'Unique username',
        minLength: 3,
        maxLength: 30,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(30),
    (0, decorators_1.StripHtml)(),
    (0, class_validator_1.Matches)(/^[a-zA-Z0-9_-]+$/, {
        message: 'Username can only contain letters, numbers, hyphens and underscores',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "username", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'SecurePassword123!',
        description: 'User password (8-128 characters, must include uppercase, lowercase, number, and special character)',
        minLength: 8,
        maxLength: 128,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8, {
        message: 'Password must be at least 8 characters long',
    }),
    (0, class_validator_1.MaxLength)(128, {
        message: 'Password must not exceed 128 characters',
    }),
    (0, class_validator_1.Matches)(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
        message: 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character (@$!%*?&)',
    }),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'John Doe',
        description: 'User full name',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    (0, decorators_1.StripHtml)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
//# sourceMappingURL=register.dto.js.map