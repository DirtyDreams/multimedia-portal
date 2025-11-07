import { AuditAction } from '@prisma/client';

/**
 * AuditLog Entity
 * Tracks all administrative actions and important system events
 */
export interface AuditLog {
  id: string;
  action: AuditAction;
  resource: string; // Resource type: 'Article', 'User', 'BlogPost', etc.
  resourceId: string | null; // ID of the affected resource
  oldValues: Record<string, any> | null; // Previous state for UPDATE/DELETE
  newValues: Record<string, any> | null; // New state for CREATE/UPDATE
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  userId: string | null; // User who performed the action
}

/**
 * AuditLog creation data
 */
export interface CreateAuditLogData {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
}
