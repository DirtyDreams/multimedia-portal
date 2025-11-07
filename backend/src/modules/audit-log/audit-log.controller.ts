import { Controller, Get, Query, UseGuards, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { QueryAuditLogsDto } from './dto/query-audit-logs.dto';
import { AuditLogsPageResponseDto } from './dto/audit-log-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Audit Logs')
@ApiBearerAuth('JWT')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieve audit logs with filtering and pagination. Admin only.',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
    type: AuditLogsPageResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getAuditLogs(@Query() query: QueryAuditLogsDto): Promise<AuditLogsPageResponseDto> {
    return this.auditLogService.getAuditLogs(query);
  }

  @Get('resource/:resource/:resourceId')
  @Roles(UserRole.ADMIN, UserRole.MODERATOR)
  @ApiOperation({
    summary: 'Get audit logs for a specific resource',
    description: 'Retrieve audit trail for a specific resource. Admin and Moderator only.',
  })
  @ApiResponse({ status: 200, description: 'Resource audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin/Moderator role required' })
  async getResourceAuditLogs(
    @Param('resource') resource: string,
    @Param('resourceId') resourceId: string,
    @Query('limit') limit?: number,
  ) {
    return this.auditLogService.getResourceAuditLogs(resource, resourceId, limit);
  }

  @Get('user/:userId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get audit logs for a specific user',
    description: 'Retrieve all actions performed by a specific user. Admin only.',
  })
  @ApiResponse({ status: 200, description: 'User audit logs retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async getUserAuditLogs(@Param('userId') userId: string, @Query('limit') limit?: number) {
    return this.auditLogService.getUserAuditLogs(userId, limit);
  }
}
