"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEnhancedModule = void 0;
const common_1 = require("@nestjs/common");
const cache_manager_1 = require("@nestjs/cache-manager");
const throttler_1 = require("@nestjs/throttler");
const search_controller_1 = require("./search.controller");
const search_enhanced_controller_1 = require("./search-enhanced.controller");
const search_service_1 = require("./search.service");
const search_enhanced_service_1 = require("./search-enhanced.service");
const search_analytics_service_1 = require("./search-analytics.service");
const prisma_module_1 = require("../../prisma/prisma.module");
let SearchEnhancedModule = class SearchEnhancedModule {
};
exports.SearchEnhancedModule = SearchEnhancedModule;
exports.SearchEnhancedModule = SearchEnhancedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            cache_manager_1.CacheModule.register({
                ttl: 300000,
                max: 100,
            }),
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 20,
                }]),
        ],
        controllers: [search_controller_1.SearchController, search_enhanced_controller_1.SearchEnhancedController],
        providers: [search_service_1.SearchService, search_enhanced_service_1.SearchEnhancedService, search_analytics_service_1.SearchAnalyticsService],
        exports: [search_service_1.SearchService, search_enhanced_service_1.SearchEnhancedService, search_analytics_service_1.SearchAnalyticsService],
    })
], SearchEnhancedModule);
//# sourceMappingURL=search-enhanced.module.js.map