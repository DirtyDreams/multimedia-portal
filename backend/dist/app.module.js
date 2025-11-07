"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const throttler_2 = require("@nestjs/throttler");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const csrf_controller_1 = require("./common/controllers/csrf.controller");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const articles_module_1 = require("./modules/articles/articles.module");
const blog_posts_module_1 = require("./modules/blog-posts/blog-posts.module");
const wiki_pages_module_1 = require("./modules/wiki-pages/wiki-pages.module");
const gallery_items_module_1 = require("./modules/gallery-items/gallery-items.module");
const stories_module_1 = require("./modules/stories/stories.module");
const authors_module_1 = require("./modules/authors/authors.module");
const comments_module_1 = require("./modules/comments/comments.module");
const ratings_module_1 = require("./modules/ratings/ratings.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const search_module_1 = require("./modules/search/search.module");
const queues_module_1 = require("./queues/queues.module");
const cache_module_1 = require("./cache/cache.module");
const config_module_1 = require("./config/config.module");
const content_versions_module_1 = require("./modules/content-versions/content-versions.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            prisma_module_1.PrismaModule,
            config_module_1.ConfigModule,
            cache_module_1.CacheModule,
            queues_module_1.QueuesModule,
            auth_module_1.AuthModule,
            articles_module_1.ArticlesModule,
            blog_posts_module_1.BlogPostsModule,
            wiki_pages_module_1.WikiPagesModule,
            gallery_items_module_1.GalleryItemsModule,
            stories_module_1.StoriesModule,
            authors_module_1.AuthorsModule,
            comments_module_1.CommentsModule,
            ratings_module_1.RatingsModule,
            notifications_module_1.NotificationsModule,
            search_module_1.SearchModule,
            content_versions_module_1.ContentVersionsModule,
        ],
        controllers: [app_controller_1.AppController, csrf_controller_1.CsrfController],
        providers: [
            app_service_1.AppService,
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_2.ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map