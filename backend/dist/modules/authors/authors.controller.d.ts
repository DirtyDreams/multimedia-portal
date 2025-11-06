import { AuthorsService } from './authors.service';
import { CreateAuthorDto, UpdateAuthorDto, QueryAuthorDto } from './dto';
import { FileUploadService } from '../gallery-items/file-upload.service';
export declare class AuthorsController {
    private readonly authorsService;
    private readonly fileUploadService;
    constructor(authorsService: AuthorsService, fileUploadService: FileUploadService);
    create(createAuthorDto: CreateAuthorDto): Promise<any>;
    uploadProfileImage(file: Express.Multer.File): Promise<{
        profileImageUrl: string;
        thumbnailUrl: string;
    }>;
    findAll(queryDto: QueryAuthorDto): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(identifier: string): Promise<any>;
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
}
