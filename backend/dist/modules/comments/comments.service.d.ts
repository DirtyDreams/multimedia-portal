import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto, UpdateCommentDto, QueryCommentDto, CommentableType } from './dto';
export declare class CommentsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createCommentDto: CreateCommentDto): Promise<any>;
    findAll(queryDto: QueryCommentDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getContentComments(contentType: CommentableType, contentId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, userId: string, updateCommentDto: UpdateCommentDto): Promise<any>;
    remove(id: string, userId: string, isAdmin: boolean): Promise<{
        message: string;
    }>;
    getCommentCount(contentType: CommentableType, contentId: string): Promise<{
        count: any;
    }>;
    private verifyContentExists;
    private getContentForeignKey;
    private formatCommentResponse;
}
