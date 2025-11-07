import { ApiProperty } from '@nestjs/swagger';
import { AuditAction } from '@prisma/client';

export class AuditLogResponseDto {
  @ApiProperty({ description: 'Audit log ID' })
  id: string;

  @ApiProperty({ enum: AuditAction, description: 'Action performed' })
  action: AuditAction;

  @ApiProperty({ description: 'Resource type (e.g., Article, User, BlogPost)' })
  resource: string;

  @ApiProperty({ description: 'Resource ID', nullable: true })
  resourceId: string | null;

  @ApiProperty({ description: 'Previous values (for UPDATE/DELETE)', nullable: true, type: 'object' })
  oldValues: Record<string, any> | null;

  @ApiProperty({ description: 'New values (for CREATE/UPDATE)', nullable: true, type: 'object' })
  newValues: Record<string, any> | null;

  @ApiProperty({ description: 'IP address of the user', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'User agent string', nullable: true })
  userAgent: string | null;

  @ApiProperty({ description: 'Timestamp of the action' })
  createdAt: Date;

  @ApiProperty({ description: 'User ID who performed the action', nullable: true })
  userId: string | null;

  @ApiProperty({ description: 'User details', nullable: true, type: 'object' })
  user?: {
    id: string;
    username: string;
    email: string;
  } | null;
}

export class AuditLogsPageResponseDto {
  @ApiProperty({ type: [AuditLogResponseDto] })
  data: AuditLogResponseDto[];

  @ApiProperty({ description: 'Pagination metadata' })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
