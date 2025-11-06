import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto, QueryArticleDto } from './dto';
import { ContentVersionsService } from '../content-versions/content-versions.service';
export declare class ArticlesController {
    private readonly articlesService;
    private readonly contentVersionsService;
    constructor(articlesService: ArticlesService, contentVersionsService: ContentVersionsService);
    create(userId: string, createArticleDto: CreateArticleDto): Promise<any>;
    findAll(queryDto: QueryArticleDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(identifier: string): Promise<any>;
    update(id: string, updateArticleDto: UpdateArticleDto): Promise<any>;
    preview(id: string): Promise<any>;
    autosave(id: string, userId: string): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
