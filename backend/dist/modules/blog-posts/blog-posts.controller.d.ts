import { BlogPostsService } from './blog-posts.service';
import { CreateBlogPostDto, UpdateBlogPostDto, QueryBlogPostDto } from './dto';
export declare class BlogPostsController {
    private readonly blogPostsService;
    constructor(blogPostsService: BlogPostsService);
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
    findOne(identifier: string): Promise<any>;
    update(id: string, updateBlogPostDto: UpdateBlogPostDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
