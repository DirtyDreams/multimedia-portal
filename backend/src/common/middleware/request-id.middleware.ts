import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get request ID from header or generate new one
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();

    // Attach to request for use in services
    (req as any).id = requestId;

    // Send in response header
    res.setHeader('X-Request-ID', requestId);

    next();
  }
}
