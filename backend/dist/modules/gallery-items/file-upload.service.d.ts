export interface ProcessedImage {
    original: string;
    thumbnail: string;
    medium: string;
    large: string;
    fileType: string;
    mimeType: string;
}
export declare class FileUploadService {
    private readonly uploadDir;
    private readonly sizes;
    processImage(file: Express.Multer.File): Promise<ProcessedImage>;
    private processOriginalImage;
    private resizeImage;
    private saveFile;
    private getPublicUrl;
    deleteFiles(fileUrl: string): Promise<void>;
    validateFileSize(file: Express.Multer.File): void;
    validateImageDimensions(buffer: Buffer): Promise<void>;
}
