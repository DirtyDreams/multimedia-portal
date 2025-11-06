"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStoryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_story_dto_1 = require("./create-story.dto");
class UpdateStoryDto extends (0, swagger_1.PartialType)(create_story_dto_1.CreateStoryDto) {
}
exports.UpdateStoryDto = UpdateStoryDto;
//# sourceMappingURL=update-story.dto.js.map