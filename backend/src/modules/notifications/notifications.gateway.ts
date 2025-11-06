import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  private userSockets = new Map<string, string[]>(); // userId -> socketIds[]

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake
      const token = this.extractTokenFromHandshake(client);

      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.verifyToken(token);
      if (!payload) {
        this.logger.warn(`Client ${client.id} disconnected: Invalid token`);
        client.disconnect();
        return;
      }

      // Store user connection
      const userId = payload.sub;
      client.data.userId = userId;

      // Track socket for this user
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, []);
      }
      this.userSockets.get(userId)?.push(client.id);

      this.logger.log(`Client ${client.id} connected for user ${userId}`);

      // Emit connection success
      client.emit('connected', {
        message: 'Successfully connected to notifications',
        userId,
      });
    } catch (error) {
      this.logger.error('Error during connection:', error);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;

    if (userId) {
      // Remove socket from user's socket list
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

  /**
   * Subscribe to content room for updates
   */
  @SubscribeMessage('join-content')
  handleJoinContent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contentType: string; contentId: string },
  ) {
    const room = this.getContentRoom(data.contentType, data.contentId);
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
    return { event: 'joined-content', room };
  }

  /**
   * Unsubscribe from content room
   */
  @SubscribeMessage('leave-content')
  handleLeaveContent(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contentType: string; contentId: string },
  ) {
    const room = this.getContentRoom(data.contentType, data.contentId);
    client.leave(room);
    this.logger.log(`Client ${client.id} left room: ${room}`);
    return { event: 'left-content', room };
  }

  /**
   * Emit new comment notification
   */
  emitNewComment(
    contentType: string,
    contentId: string,
    comment: any,
  ) {
    const room = this.getContentRoom(contentType, contentId);
    this.server.to(room).emit('new-comment', {
      contentType,
      contentId,
      comment,
    });
    this.logger.log(`Emitted new-comment to room: ${room}`);
  }

  /**
   * Emit new rating notification
   */
  emitNewRating(
    contentType: string,
    contentId: string,
    rating: any,
  ) {
    const room = this.getContentRoom(contentType, contentId);
    this.server.to(room).emit('new-rating', {
      contentType,
      contentId,
      rating,
    });
    this.logger.log(`Emitted new-rating to room: ${room}`);
  }

  /**
   * Emit content update notification
   */
  emitContentUpdate(
    contentType: string,
    contentId: string,
    updateType: string,
    data: any,
  ) {
    const room = this.getContentRoom(contentType, contentId);
    this.server.to(room).emit('content-update', {
      contentType,
      contentId,
      updateType,
      data,
    });
    this.logger.log(`Emitted content-update to room: ${room}`);
  }

  /**
   * Send notification to specific user
   */
  emitUserNotification(userId: string, notification: any) {
    const sockets = this.userSockets.get(userId);
    if (sockets && sockets.length > 0) {
      sockets.forEach((socketId) => {
        this.server.to(socketId).emit('user-notification', notification);
      });
      this.logger.log(`Emitted user-notification to user: ${userId}`);
    }
  }

  /**
   * Extract JWT token from handshake
   */
  private extractTokenFromHandshake(client: Socket): string | null {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');
    return token || null;
  }

  /**
   * Verify JWT token
   */
  private async verifyToken(token: string): Promise<any> {
    try {
      const payload = await this.jwtService.verifyAsync(token);
      return payload;
    } catch (error) {
      this.logger.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Generate room name for content
   */
  private getContentRoom(contentType: string, contentId: string): string {
    return `${contentType}:${contentId}`;
  }
}
