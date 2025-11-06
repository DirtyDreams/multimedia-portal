import { PrismaService } from '../../prisma/prisma.service';
import { CreateRatingDto, UpdateRatingDto, QueryRatingDto, RatableType } from './dto';
export declare class RatingsService {
    private prisma;
    constructor(prisma: PrismaService);
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
    remove(id: string, userId: string, isAdmin: boolean): Promise<{
        message: string;
    }>;
    private verifyContentExists;
    private getContentForeignKey;
    private formatRatingResponse;
}
