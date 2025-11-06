import { GalleryItemsService } from './gallery-items.service';
import { CreateGalleryItemDto, UpdateGalleryItemDto, QueryGalleryItemDto } from './dto';
export declare class GalleryItemsController {
    private readonly galleryItemsService;
    constructor(galleryItemsService: GalleryItemsService);
    upload(userId: string, file: Express.Multer.File, createGalleryItemDto: CreateGalleryItemDto): Promise<any>;
    findAll(queryDto: QueryGalleryItemDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(identifier: string): Promise<any>;
    update(id: string, updateGalleryItemDto: UpdateGalleryItemDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
}
