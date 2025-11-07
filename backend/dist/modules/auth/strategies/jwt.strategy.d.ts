import { ConfigService } from '../../../config/config.service';
declare const JwtStrategy_base: new (...args: any) => any;
export declare class JwtStrategy extends JwtStrategy_base {
    private configService;
    constructor(configService: ConfigService);
    validate(payload: any): Promise<{
        userId: any;
        username: any;
        email: any;
        role: any;
    }>;
}
export {};
