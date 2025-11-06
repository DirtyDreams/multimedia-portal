import { ArticlesService } from './articles.service';
import { CreateArticleDto, UpdateArticleDto, QueryArticleDto } from './dto';
export declare class ArticlesController {
    private readonly articlesService;
    constructor(articlesService: ArticlesService);
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
    remove(id: string): Promise<{
        message: string;
    }>;
}
