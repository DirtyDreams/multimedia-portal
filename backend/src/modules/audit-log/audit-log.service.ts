import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';
import { CreateAuditLogData } from './audit-log.entity';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditLogsPageResponseDto } from './dto/audit-log-response.dto';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log an action to the audit trail
   * @param data - Audit log data
   * @returns Created audit log entry
   */
  async logAction(data: CreateAuditLogData) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          action: data.action,
          resource: data.resource,
          resourceId: data.resourceId,
          oldValues: data.oldValues || null,
          newValues: data.newValues || null,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          userId: data.userId,
        },
      });

      this.logger.log(
        `Audit: ${data.action} on ${data.resource}${data.resourceId ? ` (${data.resourceId})` : ''} by user ${data.userId || 'system'}`,
      );

      return auditLog;
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Retrieve audit logs with filtering and pagination
   * @param query - Query parameters for filtering
   * @returns Paginated audit logs
   */
  async getAuditLogs(query: QueryAuditLogsDto): Promise<AuditLogsPageResponseDto> {
    const { userId, action, resource, resourceId, startDate, endDate, page = 1, limit = 50 } = query;

    // Build where clause
    const where: Prisma.AuditLogWhereInput = {};

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Count total matching records
    const total = await this.prisma.auditLog.count({ where });

    // Fetch paginated data
    const skip = (page - 1) * limit;
    const auditLogs = await this.prisma.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return {
      data: auditLogs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit logs for a specific resource
   * @param resource - Resource type
   * @param resourceId - Resource ID
   * @param limit - Maximum number of logs to retrieve
   * @returns Recent audit logs for the resource
   */
  async getResourceAuditLogs(resource: string, resourceId: string, limit = 20) {
    return this.prisma.auditLog.findMany({
      where: {
        resource,
        resourceId,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Get audit logs for a specific user
   * @param userId - User ID
   * @param limit - Maximum number of logs to retrieve
   * @returns Recent audit logs for the user
   */
  async getUserAuditLogs(userId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Clean up old audit logs (for data retention policies)
   * @param daysToKeep - Number of days to retain logs
   * @returns Number of deleted logs
   */
  async cleanupOldLogs(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleaned up ${result.count} audit logs older than ${daysToKeep} days`);
    return result.count;
  }
}
