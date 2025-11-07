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
exports.AuditLogInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const core_1 = require("@nestjs/core");
let AuditLogInterceptor = class AuditLogInterceptor {
    reflector;
    logger = new common_1.Logger('AuditLog');
    constructor(reflector) {
        this.reflector = reflector;
    }
    intercept(context, next) {
        const request = context.switchToHttp().getRequest();
        const { method, url, ip, user } = request;
        const shouldAudit = this.reflector.get('audit', context.getHandler());
        if (!shouldAudit) {
            return next.handle();
        }
        const now = Date.now();
        const userInfo = user
            ? `${user.email || user.username} (ID: ${user.id})`
            : 'Anonymous';
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const responseTime = Date.now() - now;
                this.logger.log({
                    type: 'ADMIN_ACTION',
                    method,
                    url,
                    user: userInfo,
                    userId: user?.id,
                    ip,
                    responseTime: `${responseTime}ms`,
                    timestamp: new Date().toISOString(),
                    status: 'SUCCESS',
                });
            },
            error: (error) => {
                const responseTime = Date.now() - now;
                this.logger.error({
                    type: 'ADMIN_ACTION_FAILED',
                    method,
                    url,
                    user: userInfo,
                    userId: user?.id,
                    ip,
                    responseTime: `${responseTime}ms`,
                    timestamp: new Date().toISOString(),
                    status: 'FAILED',
                    error: error.message,
                });
            },
        }));
    }
};
exports.AuditLogInterceptor = AuditLogInterceptor;
exports.AuditLogInterceptor = AuditLogInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], AuditLogInterceptor);
//# sourceMappingURL=audit-log.interceptor.js.map