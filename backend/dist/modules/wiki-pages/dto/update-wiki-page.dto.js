"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWikiPageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_wiki_page_dto_1 = require("./create-wiki-page.dto");
class UpdateWikiPageDto extends (0, swagger_1.PartialType)(create_wiki_page_dto_1.CreateWikiPageDto) {
}
exports.UpdateWikiPageDto = UpdateWikiPageDto;
//# sourceMappingURL=update-wiki-page.dto.js.map