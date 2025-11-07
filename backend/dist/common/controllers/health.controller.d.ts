import { PrismaService } from '../../prisma/prisma.service';
export declare class HealthController {
    private prisma;
    constructor(prisma: PrismaService);
    check(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        environment: string;
        services: {
            database: string;
        };
    }>;
    readiness(): Promise<{
        status: string;
        timestamp: string;
    }>;
    liveness(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
    }>;
}
