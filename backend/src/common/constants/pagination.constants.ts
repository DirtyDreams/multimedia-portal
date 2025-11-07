/**
 * Pagination constants for security and performance
 */
export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 10;
export const DEFAULT_PAGE = 1;

/**
 * Enforce maximum limit on pagination to prevent abuse
 */
export function enforcePaginationLimit(limit: number): number {
  return Math.min(limit, MAX_LIMIT);
}
