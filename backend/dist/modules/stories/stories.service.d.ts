import { PrismaService } from '../../prisma/prisma.service';
import { CreateStoryDto, UpdateStoryDto, QueryStoryDto } from './dto';
export declare class StoriesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createStoryDto: CreateStoryDto): Promise<any>;
    findAll(queryDto: QueryStoryDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getSeries(): Promise<any>;
    findOne(id: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    update(id: string, updateStoryDto: UpdateStoryDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    private generateSlug;
    private formatStoryResponse;
}
