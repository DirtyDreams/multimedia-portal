import { PrismaService } from '../../prisma/prisma.service';
import { CreateAuthorDto, UpdateAuthorDto, QueryAuthorDto } from './dto';
export declare class AuthorsService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createAuthorDto: CreateAuthorDto): Promise<any>;
    findAll(queryDto: QueryAuthorDto): Promise<{
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
    getAuthorContent(id: string, contentType: string, page?: number, limit?: number): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    private generateSlug;
    private formatAuthorResponse;
}
