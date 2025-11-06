import { PrismaService } from '../../prisma/prisma.service';
import { CreateArticleDto, UpdateArticleDto, QueryArticleDto } from './dto';
export declare class ArticlesService {
    private prisma;
    constructor(prisma: PrismaService);
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
    findOne(id: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    update(id: string, updateArticleDto: UpdateArticleDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    private generateSlug;
    private formatArticleResponse;
}
