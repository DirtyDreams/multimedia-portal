import { CommentableType } from './create-comment.dto';
export declare class QueryCommentDto {
    page?: number;
    limit?: number;
    contentType?: CommentableType;
    contentId?: string;
    userId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
