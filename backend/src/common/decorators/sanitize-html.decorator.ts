import { Transform } from 'class-transformer';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize HTML content to prevent XSS attacks
 * Allows safe HTML tags while removing potentially dangerous content
 */
export function SanitizeHtml() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // Configure allowed tags and attributes
    const sanitized = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [
        // Text formatting
        'p',
        'br',
        'span',
        'div',
        // Text styling
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
        // Headings
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        // Lists
        'ul',
        'ol',
        'li',
        // Links
        'a',
        // Code
        'code',
        'pre',
        // Quotes
        'blockquote',
        'q',
        // Tables
        'table',
        'thead',
        'tbody',
        'tr',
        'th',
        'td',
        // Media (images only, no scripts)
        'img',
        // Other
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
        'style', // Limited style attributes
      ],
      ALLOWED_URI_REGEXP:
        /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
      KEEP_CONTENT: true,
      RETURN_TRUSTED_TYPE: false,
    });

    return sanitized;
  });
}

/**
 * Strict HTML sanitization - only basic text formatting allowed
 * Use for user comments, descriptions, etc.
 */
export function SanitizeHtmlStrict() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    const sanitized = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'a'],
      ALLOWED_ATTR: ['href', 'title'],
      ALLOWED_URI_REGEXP: /^https?:\/\//i,
      KEEP_CONTENT: true,
    });

    return sanitized;
  });
}

/**
 * Plain text only - strips all HTML
 * Use for titles, names, usernames, etc.
 */
export function StripHtml() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') {
      return value;
    }

    // Remove all HTML tags
    const stripped = DOMPurify.sanitize(value, {
      ALLOWED_TAGS: [],
      KEEP_CONTENT: true,
    });

    return stripped.trim();
  });
}
