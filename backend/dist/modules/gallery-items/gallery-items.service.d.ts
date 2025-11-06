import { PrismaService } from '../../prisma/prisma.service';
import { FileUploadService } from './file-upload.service';
import { CreateGalleryItemDto, UpdateGalleryItemDto, QueryGalleryItemDto } from './dto';
export declare class GalleryItemsService {
    private prisma;
    private fileUploadService;
    constructor(prisma: PrismaService, fileUploadService: FileUploadService);
    create(userId: string, createGalleryItemDto: CreateGalleryItemDto, file: Express.Multer.File): Promise<any>;
    findAll(queryDto: QueryGalleryItemDto): Promise<{
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
    update(id: string, updateGalleryItemDto: UpdateGalleryItemDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    private generateSlug;
    private formatGalleryItemResponse;
}
