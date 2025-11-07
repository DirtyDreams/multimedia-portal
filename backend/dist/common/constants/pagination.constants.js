"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PAGE = exports.DEFAULT_LIMIT = exports.MAX_LIMIT = void 0;
exports.enforcePaginationLimit = enforcePaginationLimit;
exports.MAX_LIMIT = 100;
exports.DEFAULT_LIMIT = 10;
exports.DEFAULT_PAGE = 1;
function enforcePaginationLimit(limit) {
    return Math.min(limit, exports.MAX_LIMIT);
}
//# sourceMappingURL=pagination.constants.js.map