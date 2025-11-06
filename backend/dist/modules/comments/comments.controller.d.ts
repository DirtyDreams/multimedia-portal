import { CommentsService } from './comments.service';
import { CreateCommentDto, UpdateCommentDto, QueryCommentDto, CommentableType } from './dto';
import { UserRole } from '../../types/prisma.types';
export declare class CommentsController {
    private readonly commentsService;
    constructor(commentsService: CommentsService);
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
    getCommentCount(contentType: CommentableType, contentId: string): Promise<{
        count: any;
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, userId: string, updateCommentDto: UpdateCommentDto): Promise<any>;
    remove(id: string, userId: string, userRole: UserRole): Promise<{
        message: string;
    }>;
}
