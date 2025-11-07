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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsrfController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const decorators_1 = require("../decorators");
let CsrfController = class CsrfController {
    getCsrfToken(request, response) {
        const token = request.cookies?.['csrf-token'];
        if (!token) {
            const crypto = require('crypto');
            const newToken = crypto.randomBytes(32).toString('hex');
            response.cookie('csrf-token', newToken, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 3600000,
                path: '/',
            });
            return {
                csrfToken: newToken,
                message: 'CSRF token generated. Include this token in X-CSRF-Token header for POST, PUT, PATCH, DELETE requests.',
            };
        }
        return {
            csrfToken: token,
            message: 'CSRF token retrieved from cookie. Include this token in X-CSRF-Token header for POST, PUT, PATCH, DELETE requests.',
        };
    }
};
exports.CsrfController = CsrfController;
__decorate([
    (0, decorators_1.Public)(),
    (0, common_1.Get)('token'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get CSRF token',
        description: 'Retrieves the CSRF token from the cookie. The token is automatically generated ' +
            'and set as a cookie. Clients should read this cookie and include its value in ' +
            'the X-CSRF-Token header for all state-changing requests (POST, PUT, PATCH, DELETE).',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'CSRF token retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                csrfToken: {
                    type: 'string',
                    example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
                },
            },
        },
    }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], CsrfController.prototype, "getCsrfToken", null);
exports.CsrfController = CsrfController = __decorate([
    (0, swagger_1.ApiTags)('Security'),
    (0, common_1.Controller)('csrf')
], CsrfController);
//# sourceMappingURL=csrf.controller.js.map