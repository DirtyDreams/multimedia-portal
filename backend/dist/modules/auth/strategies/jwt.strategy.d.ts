import { ConfigService } from '../../../config/config.service';
import { JwtBlacklistService } from '../jwt-blacklist.service';
import type { Request } from 'express';
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    private jwtBlacklistService;
    constructor(configService: ConfigService, jwtBlacklistService: JwtBlacklistService);
    validate(req: Request, payload: any): Promise<{
        userId: any;
        username: any;
        email: any;
        role: any;
        token: string;
    }>;
}
export {};
