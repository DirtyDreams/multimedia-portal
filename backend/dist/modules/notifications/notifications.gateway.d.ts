import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
export declare class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private prisma;
    server: Server;
    private readonly logger;
    private userSockets;
    constructor(jwtService: JwtService, prisma: PrismaService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleJoinContent(client: Socket, data: {
        contentType: string;
        contentId: string;
    }): {
        event: string;
        room: string;
    };
    handleLeaveContent(client: Socket, data: {
        contentType: string;
        contentId: string;
    }): {
        event: string;
        room: string;
    };
    emitNewComment(contentType: string, contentId: string, comment: any): void;
    emitNewRating(contentType: string, contentId: string, rating: any): void;
    emitContentUpdate(contentType: string, contentId: string, updateType: string, data: any): void;
    emitUserNotification(userId: string, notification: any): void;
    private extractTokenFromHandshake;
    private verifyToken;
    private getContentRoom;
}
