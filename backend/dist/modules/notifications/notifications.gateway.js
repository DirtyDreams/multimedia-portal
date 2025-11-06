"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotificationsGateway = NotificationsGateway_1 = class NotificationsGateway {
    jwtService;
    prisma;
    server;
    logger = new common_1.Logger(NotificationsGateway_1.name);
    userSockets = new Map();
    constructor(jwtService, prisma) {
        this.jwtService = jwtService;
        this.prisma = prisma;
    }
    async handleConnection(client) {
        try {
            const token = this.extractTokenFromHandshake(client);
            if (!token) {
                this.logger.warn(`Client ${client.id} disconnected: No token provided`);
                client.disconnect();
                return;
            }
            const payload = await this.verifyToken(token);
            if (!payload) {
                this.logger.warn(`Client ${client.id} disconnected: Invalid token`);
                client.disconnect();
                return;
            }
            const userId = payload.sub;
            client.data.userId = userId;
            if (!this.userSockets.has(userId)) {
                this.userSockets.set(userId, []);
            }
            this.userSockets.get(userId)?.push(client.id);
            this.logger.log(`Client ${client.id} connected for user ${userId}`);
            client.emit('connected', {
                message: 'Successfully connected to notifications',
                userId,
            });
        }
        catch (error) {
            this.logger.error('Error during connection:', error);
            client.disconnect();
        }
    }
    handleDisconnect(client) {
        const userId = client.data.userId;
        if (userId) {
            const sockets = this.userSockets.get(userId);
            if (sockets) {
                const index = sockets.indexOf(client.id);
                if (index > -1) {
                    sockets.splice(index, 1);
                }
                if (sockets.length === 0) {
                    this.userSockets.delete(userId);
                }
            }
        }
        this.logger.log(`Client ${client.id} disconnected`);
    }
    handleJoinContent(client, data) {
        const room = this.getContentRoom(data.contentType, data.contentId);
        client.join(room);
        this.logger.log(`Client ${client.id} joined room: ${room}`);
        return { event: 'joined-content', room };
    }
    handleLeaveContent(client, data) {
        const room = this.getContentRoom(data.contentType, data.contentId);
        client.leave(room);
        this.logger.log(`Client ${client.id} left room: ${room}`);
        return { event: 'left-content', room };
    }
    emitNewComment(contentType, contentId, comment) {
        const room = this.getContentRoom(contentType, contentId);
        this.server.to(room).emit('new-comment', {
            contentType,
            contentId,
            comment,
        });
        this.logger.log(`Emitted new-comment to room: ${room}`);
    }
    emitNewRating(contentType, contentId, rating) {
        const room = this.getContentRoom(contentType, contentId);
        this.server.to(room).emit('new-rating', {
            contentType,
            contentId,
            rating,
        });
        this.logger.log(`Emitted new-rating to room: ${room}`);
    }
    emitContentUpdate(contentType, contentId, updateType, data) {
        const room = this.getContentRoom(contentType, contentId);
        this.server.to(room).emit('content-update', {
            contentType,
            contentId,
            updateType,
            data,
        });
        this.logger.log(`Emitted content-update to room: ${room}`);
    }
    emitUserNotification(userId, notification) {
        const sockets = this.userSockets.get(userId);
        if (sockets && sockets.length > 0) {
            sockets.forEach((socketId) => {
                this.server.to(socketId).emit('user-notification', notification);
            });
            this.logger.log(`Emitted user-notification to user: ${userId}`);
        }
    }
    extractTokenFromHandshake(client) {
        const token = client.handshake.auth?.token ||
            client.handshake.headers?.authorization?.replace('Bearer ', '');
        return token || null;
    }
    async verifyToken(token) {
        try {
            const payload = await this.jwtService.verifyAsync(token);
            return payload;
        }
        catch (error) {
            this.logger.error('Token verification failed:', error);
            return null;
        }
    }
    getContentRoom(contentType, contentId) {
        return `${contentType}:${contentId}`;
    }
};
exports.NotificationsGateway = NotificationsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificationsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join-content'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleJoinContent", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave-content'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], NotificationsGateway.prototype, "handleLeaveContent", null);
exports.NotificationsGateway = NotificationsGateway = NotificationsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3000',
            credentials: true,
        },
        namespace: '/notifications',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        prisma_service_1.PrismaService])
], NotificationsGateway);
//# sourceMappingURL=notifications.gateway.js.map