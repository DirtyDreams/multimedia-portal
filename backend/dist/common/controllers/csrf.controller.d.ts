import type { Request, Response } from 'express';
export declare class CsrfController {
    getCsrfToken(request: Request, response: Response): {
        csrfToken: any;
        message: string;
    };
}
