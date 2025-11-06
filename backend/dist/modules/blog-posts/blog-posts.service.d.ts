import { PrismaService } from '../../prisma/prisma.service';
import { CreateBlogPostDto, UpdateBlogPostDto, QueryBlogPostDto } from './dto';
export declare class BlogPostsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createBlogPostDto: CreateBlogPostDto): Promise<any>;
    findAll(queryDto: QueryBlogPostDto): Promise<{
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
    update(id: string, updateBlogPostDto: UpdateBlogPostDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    private generateSlug;
    private formatBlogPostResponse;
}
