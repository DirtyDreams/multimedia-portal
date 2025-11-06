import { PrismaService } from '../../prisma/prisma.service';
import { CreateWikiPageDto, UpdateWikiPageDto, QueryWikiPageDto } from './dto';
export declare class WikiPagesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(userId: string, createWikiPageDto: CreateWikiPageDto): Promise<any>;
    findAll(queryDto: QueryWikiPageDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getTree(): Promise<any[]>;
    getChildren(parentId: string): Promise<any>;
    getBreadcrumbs(id: string): Promise<{
        id: string;
        title: string;
        slug: string;
    }[]>;
    findOne(id: string): Promise<any>;
    findBySlug(slug: string): Promise<any>;
    update(id: string, updateWikiPageDto: UpdateWikiPageDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    private buildTreeRecursive;
    private wouldCreateCircularReference;
    private generateSlug;
    private formatWikiPageResponse;
}
