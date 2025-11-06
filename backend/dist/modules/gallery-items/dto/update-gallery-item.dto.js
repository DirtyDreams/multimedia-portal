"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGalleryItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_gallery_item_dto_1 = require("./create-gallery-item.dto");
class UpdateGalleryItemDto extends (0, swagger_1.PartialType)(create_gallery_item_dto_1.CreateGalleryItemDto) {
}
exports.UpdateGalleryItemDto = UpdateGalleryItemDto;
//# sourceMappingURL=update-gallery-item.dto.js.map