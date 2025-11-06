import { RatableType } from './create-rating.dto';
export declare class QueryRatingDto {
    page?: number;
    limit?: number;
    contentType?: RatableType;
    contentId?: string;
    userId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
