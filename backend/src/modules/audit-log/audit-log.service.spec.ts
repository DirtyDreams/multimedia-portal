import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

describe('AuditLogService', () => {
  let service: AuditLogService;
  let prisma: PrismaService;

  const mockPrismaService = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logAction', () => {
    it('should create an audit log entry', async () => {
      const mockAuditLog = {
        id: 'log-123',
        action: AuditAction.CREATE,
        resource: 'Article',
        resourceId: 'article-123',
        oldValues: null,
        newValues: { title: 'Test Article' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        userId: 'user-123',
        createdAt: new Date(),
      };

      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.logAction({
        action: AuditAction.CREATE,
        resource: 'Article',
        resourceId: 'article-123',
        newValues: { title: 'Test Article' },
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        userId: 'user-123',
      });

      expect(result).toEqual(mockAuditLog);
      expect(mockPrismaService.auditLog.create).toHaveBeenCalledWith({
        data: {
          action: AuditAction.CREATE,
          resource: 'Article',
          resourceId: 'article-123',
          oldValues: null,
          newValues: { title: 'Test Article' },
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          userId: 'user-123',
        },
      });
    });

    it('should handle system actions without userId', async () => {
      const mockAuditLog = {
        id: 'log-124',
        action: AuditAction.UPDATE,
        resource: 'System',
        resourceId: null,
        oldValues: null,
        newValues: { maintenance: true },
        ipAddress: null,
        userAgent: null,
        userId: null,
        createdAt: new Date(),
      };

      mockPrismaService.auditLog.create.mockResolvedValue(mockAuditLog);

      const result = await service.logAction({
        action: AuditAction.UPDATE,
        resource: 'System',
        newValues: { maintenance: true },
      });

      expect(result).toEqual(mockAuditLog);
      expect(result.userId).toBeNull();
    });

    it('should throw error if logging fails', async () => {
      mockPrismaService.auditLog.create.mockRejectedValue(new Error('Database error'));

      await expect(
        service.logAction({
          action: AuditAction.CREATE,
          resource: 'Article',
          userId: 'user-123',
        }),
      ).rejects.toThrow('Database error');
    });
  });

  describe('getAuditLogs', () => {
    it('should return paginated audit logs', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: AuditAction.CREATE,
          resource: 'Article',
          resourceId: 'article-1',
          oldValues: null,
          newValues: { title: 'Article 1' },
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          userId: 'user-1',
          createdAt: new Date(),
          user: { id: 'user-1', username: 'admin', email: 'admin@test.com' },
        },
      ];

      mockPrismaService.auditLog.count.mockResolvedValue(1);
      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getAuditLogs({ page: 1, limit: 50 });

      expect(result).toEqual({
        data: mockLogs,
        meta: {
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        },
      });
    });

    it('should filter by userId', async () => {
      mockPrismaService.auditLog.count.mockResolvedValue(5);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      await service.getAuditLogs({ userId: 'user-123', page: 1, limit: 50 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
      });
    });

    it('should filter by action', async () => {
      mockPrismaService.auditLog.count.mockResolvedValue(3);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      await service.getAuditLogs({ action: AuditAction.DELETE, page: 1, limit: 50 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { action: AuditAction.DELETE },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
      });
    });

    it('should filter by date range', async () => {
      const startDate = '2025-01-01T00:00:00.000Z';
      const endDate = '2025-01-31T23:59:59.999Z';

      mockPrismaService.auditLog.count.mockResolvedValue(10);
      mockPrismaService.auditLog.findMany.mockResolvedValue([]);

      await service.getAuditLogs({ startDate, endDate, page: 1, limit: 50 });

      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        skip: 0,
        take: 50,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
      });
    });
  });

  describe('getResourceAuditLogs', () => {
    it('should return audit logs for a specific resource', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: AuditAction.UPDATE,
          resource: 'Article',
          resourceId: 'article-123',
          createdAt: new Date(),
          user: { id: 'user-1', username: 'admin', email: 'admin@test.com' },
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getResourceAuditLogs('Article', 'article-123');

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          resource: 'Article',
          resourceId: 'article-123',
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, email: true },
          },
        },
      });
    });
  });

  describe('getUserAuditLogs', () => {
    it('should return audit logs for a specific user', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: AuditAction.LOGIN,
          resource: 'User',
          resourceId: 'user-123',
          userId: 'user-123',
          createdAt: new Date(),
        },
      ];

      mockPrismaService.auditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getUserAuditLogs('user-123');

      expect(result).toEqual(mockLogs);
      expect(mockPrismaService.auditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-123' },
        take: 50,
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('cleanupOldLogs', () => {
    it('should delete logs older than specified days', async () => {
      const daysToKeep = 90;
      mockPrismaService.auditLog.deleteMany.mockResolvedValue({ count: 150 });

      const result = await service.cleanupOldLogs(daysToKeep);

      expect(result).toBe(150);
      expect(mockPrismaService.auditLog.deleteMany).toHaveBeenCalled();

      const callArgs = mockPrismaService.auditLog.deleteMany.mock.calls[0][0];
      expect(callArgs.where.createdAt.lt).toBeInstanceOf(Date);
    });

    it('should use default retention of 365 days', async () => {
      mockPrismaService.auditLog.deleteMany.mockResolvedValue({ count: 100 });

      await service.cleanupOldLogs();

      expect(mockPrismaService.auditLog.deleteMany).toHaveBeenCalled();
    });
  });
});
