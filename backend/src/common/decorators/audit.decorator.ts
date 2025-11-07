import { SetMetadata } from '@nestjs/common';

/**
 * Audit Decorator
 * Mark routes that should be audited for security purposes
 *
 * Usage:
 * @Audit()
 * @Delete(':id')
 * async deleteUser(@Param('id') id: string) {
 *   // This action will be logged
 * }
 */
export const Audit = () => SetMetadata('audit', true);
