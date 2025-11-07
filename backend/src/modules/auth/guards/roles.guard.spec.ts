import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../../../types/prisma.types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { userId: 'user-123', role: UserRole.USER },
          }),
        }),
      } as any;
    });

    it('should allow access when no roles are required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has the required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER]);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should deny access when user does not have the required role', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { userId: 'user-123', role: UserRole.USER },
        }),
      });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should deny access when user is not authenticated', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: null,
        }),
      });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should allow ADMIN role when ADMIN is required', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { userId: 'admin-123', role: UserRole.ADMIN },
        }),
      });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow MODERATOR role when MODERATOR is required', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.MODERATOR]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { userId: 'mod-123', role: UserRole.MODERATOR },
        }),
      });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should allow access when user has one of multiple required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN, UserRole.MODERATOR]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { userId: 'mod-123', role: UserRole.MODERATOR },
        }),
      });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it('should deny access when user does not have any of the required roles', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.ADMIN, UserRole.MODERATOR]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { userId: 'user-123', role: UserRole.USER },
        }),
      });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should check both handler and class for roles metadata', () => {
      const handler = jest.fn();
      const classRef = jest.fn();

      mockContext = {
        getHandler: jest.fn().mockReturnValue(handler),
        getClass: jest.fn().mockReturnValue(classRef),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { userId: 'user-123', role: UserRole.USER },
          }),
        }),
      } as any;

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER]);

      guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('roles', [
        handler,
        classRef,
      ]);
    });

    it('should handle missing user object gracefully', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({}),
      });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });

    it('should handle undefined user gracefully', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: undefined,
        }),
      });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(false);
    });
  });

  describe('role hierarchy scenarios', () => {
    let mockContext: ExecutionContext;

    beforeEach(() => {
      mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn(),
      } as any;
    });

    it('should not automatically grant access to ADMIN for USER-only routes', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { userId: 'admin-123', role: UserRole.ADMIN },
        }),
      });

      const result = guard.canActivate(mockContext);

      // This should be false because the guard checks exact role match
      // If you want role hierarchy, you need to specify multiple roles
      expect(result).toBe(false);
    });

    it('should allow when all roles are explicitly listed', () => {
      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER, UserRole.ADMIN, UserRole.MODERATOR]);

      mockContext.switchToHttp = jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          user: { userId: 'admin-123', role: UserRole.ADMIN },
        }),
      });

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe('integration with @Roles decorator', () => {
    it('should use roles metadata key', () => {
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue({
            user: { userId: 'user-123', role: UserRole.USER },
          }),
        }),
      } as any;

      jest
        .spyOn(reflector, 'getAllAndOverride')
        .mockReturnValue([UserRole.USER]);

      guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'roles',
        expect.any(Array),
      );
    });
  });
});
