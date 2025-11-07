import { Controller, Get, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../decorators';

/**
 * CSRF Token Controller
 *
 * Provides endpoint to get CSRF token for client-side applications.
 * The token is automatically generated and set as a cookie by the CSRF guard.
 */
@ApiTags('Security')
@Controller('csrf')
export class CsrfController {
  @Public()
  @Get('token')
  @ApiOperation({
    summary: 'Get CSRF token',
    description:
      'Retrieves the CSRF token from the cookie. The token is automatically generated ' +
      'and set as a cookie. Clients should read this cookie and include its value in ' +
      'the X-CSRF-Token header for all state-changing requests (POST, PUT, PATCH, DELETE).',
  })
  @ApiResponse({
    status: 200,
    description: 'CSRF token retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        csrfToken: {
          type: 'string',
          example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        },
      },
    },
  })
  getCsrfToken(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    // Token is automatically generated and set as cookie by CSRF guard
    // This endpoint just retrieves it for the client
    const token = request.cookies?.['csrf-token'];

    if (!token) {
      // If no token exists, generate one manually
      const crypto = require('crypto');
      const newToken = crypto.randomBytes(32).toString('hex');

      response.cookie('csrf-token', newToken, {
        httpOnly: false, // Must be accessible to JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
        path: '/',
      });

      return {
        csrfToken: newToken,
        message:
          'CSRF token generated. Include this token in X-CSRF-Token header for POST, PUT, PATCH, DELETE requests.',
      };
    }

    return {
      csrfToken: token,
      message:
        'CSRF token retrieved from cookie. Include this token in X-CSRF-Token header for POST, PUT, PATCH, DELETE requests.',
    };
  }
}
