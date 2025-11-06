import { RatingsService } from './ratings.service';
import { CreateRatingDto, UpdateRatingDto, QueryRatingDto, RatableType } from './dto';
import { UserRole } from '../../types/prisma.types';
export declare class RatingsController {
    private readonly ratingsService;
    constructor(ratingsService: RatingsService);
    create(userId: string, createRatingDto: CreateRatingDto): Promise<any>;
    findAll(queryDto: QueryRatingDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getContentRatings(contentType: RatableType, contentId: string): Promise<any>;
    getAverageRating(contentType: RatableType, contentId: string): Promise<{
        average: any;
        count: any;
    }>;
    getUserRating(userId: string, contentType: RatableType, contentId: string): Promise<any>;
    findOne(id: string): Promise<any>;
    update(id: string, userId: string, updateRatingDto: UpdateRatingDto): Promise<any>;
    remove(id: string, userId: string, userRole: UserRole): Promise<{
        message: string;
    }>;
}
