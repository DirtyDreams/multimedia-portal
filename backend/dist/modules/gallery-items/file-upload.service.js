"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const common_1 = require("@nestjs/common");
const sharp_1 = __importDefault(require("sharp"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
let FileUploadService = class FileUploadService {
    uploadDir = path.join(process.cwd(), 'uploads', 'gallery');
    sizes = {
        thumbnail: { width: 200, height: 200 },
        medium: { width: 800, height: 600 },
        large: { width: 1920, height: 1080 },
    };
    async processImage(file) {
        try {
            if (!file.mimetype.startsWith('image/')) {
                throw new common_1.BadRequestException('File must be an image');
            }
            const uniqueId = (0, uuid_1.v4)();
            const baseFilename = `${uniqueId}`;
            const originalBuffer = await this.processOriginalImage(file.buffer);
            const originalPath = await this.saveFile(originalBuffer, 'original', `${baseFilename}.webp`);
            const thumbnailBuffer = await this.resizeImage(file.buffer, this.sizes.thumbnail.width, this.sizes.thumbnail.height, true);
            const thumbnailPath = await this.saveFile(thumbnailBuffer, 'thumbnail', `${baseFilename}.webp`);
            const mediumBuffer = await this.resizeImage(file.buffer, this.sizes.medium.width, this.sizes.medium.height, false);
            const mediumPath = await this.saveFile(mediumBuffer, 'medium', `${baseFilename}.webp`);
            const largeBuffer = await this.resizeImage(file.buffer, this.sizes.large.width, this.sizes.large.height, false);
            const largePath = await this.saveFile(largeBuffer, 'large', `${baseFilename}.webp`);
            return {
                original: this.getPublicUrl(originalPath),
                thumbnail: this.getPublicUrl(thumbnailPath),
                medium: this.getPublicUrl(mediumPath),
                large: this.getPublicUrl(largePath),
                fileType: 'image',
                mimeType: 'image/webp',
            };
        }
        catch (error) {
            throw new common_1.BadRequestException(`Failed to process image: ${error.message}`);
        }
    }
    async processOriginalImage(buffer) {
        return (0, sharp_1.default)(buffer)
            .rotate()
            .webp({ quality: 90 })
            .toBuffer();
    }
    async resizeImage(buffer, width, height, crop = false) {
        const sharpInstance = (0, sharp_1.default)(buffer)
            .rotate();
        if (crop) {
            return sharpInstance
                .resize(width, height, {
                fit: 'cover',
                position: 'center',
            })
                .webp({ quality: 85 })
                .toBuffer();
        }
        else {
            return sharpInstance
                .resize(width, height, {
                fit: 'inside',
                withoutEnlargement: true,
            })
                .webp({ quality: 85 })
                .toBuffer();
        }
    }
    async saveFile(buffer, sizeDir, filename) {
        const dirPath = path.join(this.uploadDir, sizeDir);
        const filePath = path.join(dirPath, filename);
        await fs.mkdir(dirPath, { recursive: true });
        await fs.writeFile(filePath, buffer);
        return filePath;
    }
    getPublicUrl(filePath) {
        const relativePath = filePath.replace(process.cwd(), '');
        return relativePath.replace(/\\/g, '/');
    }
    async deleteFiles(fileUrl) {
        try {
            const filename = path.basename(fileUrl);
            const sizes = ['original', 'thumbnail', 'medium', 'large'];
            await Promise.all(sizes.map(async (size) => {
                const filePath = path.join(this.uploadDir, size, filename);
                try {
                    await fs.unlink(filePath);
                }
                catch (error) {
                }
            }));
        }
        catch (error) {
            console.error(`Failed to delete files: ${error.message}`);
        }
    }
    validateFileSize(file) {
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new common_1.BadRequestException(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
        }
    }
    async validateImageDimensions(buffer) {
        const metadata = await (0, sharp_1.default)(buffer).metadata();
        if (!metadata.width || !metadata.height) {
            throw new common_1.BadRequestException('Invalid image file');
        }
        if (metadata.width < 200 || metadata.height < 200) {
            throw new common_1.BadRequestException('Image dimensions too small (minimum 200x200px)');
        }
        if (metadata.width > 10000 || metadata.height > 10000) {
            throw new common_1.BadRequestException('Image dimensions too large (maximum 10000x10000px)');
        }
    }
};
exports.FileUploadService = FileUploadService;
exports.FileUploadService = FileUploadService = __decorate([
    (0, common_1.Injectable)()
], FileUploadService);
//# sourceMappingURL=file-upload.service.js.map