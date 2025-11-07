import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import * as crypto from 'crypto';

/**
 * CSRF Protection Guard using Double Submit Cookie pattern
 *
 * This guard implements CSRF protection for state-changing operations (POST, PUT, PATCH, DELETE).
 * It uses the Double Submit Cookie pattern where:
 * 1. Server generates a random token and sends it as a cookie
 * 2. Client must include the same token in a request header
 * 3. Server validates that both tokens match
 *
 * This protects against CSRF attacks because attackers cannot read cookies from other domains
 * due to Same-Origin Policy.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private static readonly CSRF_COOKIE_NAME = 'csrf-token';
  private static readonly CSRF_HEADER_NAME = 'x-csrf-token';
  private static readonly CSRF_TOKEN_LENGTH = 32;

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Skip CSRF protection for safe methods (GET, HEAD, OPTIONS)
    if (this.isSafeMethod(request.method)) {
      // Generate and set CSRF token for safe methods (for subsequent mutations)
      this.generateAndSetToken(request, response);
      return true;
    }

    // For unsafe methods (POST, PUT, PATCH, DELETE), validate CSRF token
    return this.validateCsrfToken(request);
  }

  /**
   * Check if the HTTP method is considered safe (doesn't modify data)
   */
  private isSafeMethod(method: string): boolean {
    return ['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase());
  }

  /**
   * Generate a new CSRF token and set it as a cookie
   */
  private generateAndSetToken(request: Request, response: Response): void {
    // Check if token already exists in cookie
    let token = request.cookies?.[CsrfGuard.CSRF_COOKIE_NAME];

    // If no token exists, generate a new one
    if (!token) {
      token = crypto.randomBytes(CsrfGuard.CSRF_TOKEN_LENGTH).toString('hex');

      // Set cookie with security flags
      response.cookie(CsrfGuard.CSRF_COOKIE_NAME, token, {
        httpOnly: false, // Must be accessible to JavaScript for client to read and send in header
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'strict', // Strict same-site policy
        maxAge: 3600000, // 1 hour
        path: '/',
      });
    }
  }

  /**
   * Validate CSRF token from request header against cookie
   */
  private validateCsrfToken(request: Request): boolean {
    const cookieToken = request.cookies?.[CsrfGuard.CSRF_COOKIE_NAME];
    const headerToken = request.headers[CsrfGuard.CSRF_HEADER_NAME] as string;

    // Check if both tokens exist
    if (!cookieToken || !headerToken) {
      throw new ForbiddenException(
        'CSRF token missing. Include X-CSRF-Token header with the token from csrf-token cookie.',
      );
    }

    // Compare tokens using constant-time comparison to prevent timing attacks
    if (!this.secureCompare(cookieToken, headerToken)) {
      throw new ForbiddenException('CSRF token mismatch. Invalid or expired token.');
    }

    return true;
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    // Use crypto.timingSafeEqual for constant-time comparison
    const bufferA = Buffer.from(a);
    const bufferB = Buffer.from(b);

    try {
      return crypto.timingSafeEqual(bufferA, bufferB);
    } catch {
      return false;
    }
  }
}
