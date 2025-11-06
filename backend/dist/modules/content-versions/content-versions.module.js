"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentVersionsModule = void 0;
const common_1 = require("@nestjs/common");
const content_versions_controller_1 = require("./content-versions.controller");
const content_versions_service_1 = require("./content-versions.service");
const prisma_module_1 = require("../../prisma/prisma.module");
let ContentVersionsModule = class ContentVersionsModule {
};
exports.ContentVersionsModule = ContentVersionsModule;
exports.ContentVersionsModule = ContentVersionsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [content_versions_controller_1.ContentVersionsController],
        providers: [content_versions_service_1.ContentVersionsService],
        exports: [content_versions_service_1.ContentVersionsService],
    })
], ContentVersionsModule);
//# sourceMappingURL=content-versions.module.js.map