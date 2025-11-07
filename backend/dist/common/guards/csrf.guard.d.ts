import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare class CsrfGuard implements CanActivate {
    private reflector;
    private static readonly CSRF_COOKIE_NAME;
    private static readonly CSRF_HEADER_NAME;
    private static readonly CSRF_TOKEN_LENGTH;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private isSafeMethod;
    private generateAndSetToken;
    private validateCsrfToken;
    private secureCompare;
}
