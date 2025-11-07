"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanitizeHtml = SanitizeHtml;
exports.SanitizeHtmlStrict = SanitizeHtmlStrict;
exports.StripHtml = StripHtml;
const class_transformer_1 = require("class-transformer");
const isomorphic_dompurify_1 = __importDefault(require("isomorphic-dompurify"));
function SanitizeHtml() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value !== 'string') {
            return value;
        }
        const sanitized = isomorphic_dompurify_1.default.sanitize(value, {
            ALLOWED_TAGS: [
                'p',
                'br',
                'span',
                'div',
                'b',
                'strong',
                'i',
                'em',
                'u',
                's',
                'mark',
                'small',
                'sub',
                'sup',
                'h1',
                'h2',
                'h3',
                'h4',
                'h5',
                'h6',
                'ul',
                'ol',
                'li',
                'a',
                'code',
                'pre',
                'blockquote',
                'q',
                'table',
                'thead',
                'tbody',
                'tr',
                'th',
                'td',
                'img',
                'hr',
            ],
            ALLOWED_ATTR: [
                'href',
                'title',
                'alt',
                'src',
                'width',
                'height',
                'class',
                'id',
                'style',
            ],
            ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
            KEEP_CONTENT: true,
            RETURN_TRUSTED_TYPE: false,
        });
        return sanitized;
    });
}
function SanitizeHtmlStrict() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value !== 'string') {
            return value;
        }
        const sanitized = isomorphic_dompurify_1.default.sanitize(value, {
            ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a'],
            ALLOWED_ATTR: ['href', 'title'],
            ALLOWED_URI_REGEXP: /^https?:\/\//i,
            KEEP_CONTENT: true,
        });
        return sanitized;
    });
}
function StripHtml() {
    return (0, class_transformer_1.Transform)(({ value }) => {
        if (typeof value !== 'string') {
            return value;
        }
        const stripped = isomorphic_dompurify_1.default.sanitize(value, {
            ALLOWED_TAGS: [],
            KEEP_CONTENT: true,
        });
        return stripped.trim();
    });
}
//# sourceMappingURL=sanitize-html.decorator.js.map