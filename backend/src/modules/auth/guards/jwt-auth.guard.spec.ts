import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
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
            headers: { authorization: 'Bearer valid_token' },
          }),
        }),
      } as any;
    });

    it('should allow access to public routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
    });

    it('should check JWT authentication for non-public routes', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      // Mock the parent canActivate method
      const superCanActivateSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockReturnValue(true);

      const result = guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockContext.getHandler(),
        mockContext.getClass(),
      ]);
      expect(superCanActivateSpy).toHaveBeenCalledWith(mockContext);

      superCanActivateSpy.mockRestore();
    });

    it('should delegate to parent AuthGuard when route is not public', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

      const superCanActivateSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockReturnValue(true);

      guard.canActivate(mockContext);

      expect(superCanActivateSpy).toHaveBeenCalled();

      superCanActivateSpy.mockRestore();
    });

    it('should bypass authentication when isPublic is true', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const superCanActivateSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockReturnValue(false);

      const result = guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(superCanActivateSpy).not.toHaveBeenCalled();

      superCanActivateSpy.mockRestore();
    });

    it('should check both handler and class for public metadata', () => {
      const handler = jest.fn();
      const classRef = jest.fn();

      mockContext = {
        getHandler: jest.fn().mockReturnValue(handler),
        getClass: jest.fn().mockReturnValue(classRef),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn(),
        }),
      } as any;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

      const superCanActivateSpy = jest
        .spyOn(Object.getPrototypeOf(Object.getPrototypeOf(guard)), 'canActivate')
        .mockReturnValue(true);

      guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        handler,
        classRef,
      ]);

      superCanActivateSpy.mockRestore();
    });
  });

  describe('integration with @Public decorator', () => {
    it('should recognize isPublic metadata key', () => {
      const mockContext = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as any;

      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = guard.canActivate(mockContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'isPublic',
        expect.any(Array),
      );
      expect(result).toBe(true);
    });
  });
});
