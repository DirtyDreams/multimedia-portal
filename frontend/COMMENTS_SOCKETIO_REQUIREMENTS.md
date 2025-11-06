# Socket.io Real-time Comments Implementation Guide

## Overview
This document outlines the requirements and implementation steps for adding real-time comment updates using Socket.io to the multimedia portal comment system.

## Current State
The comment system is fully functional with:
- ✅ Nested comment display (3 levels deep)
- ✅ Add/Edit/Delete functionality
- ✅ Reply to comments
- ✅ Role-based permissions
- ✅ Pagination
- ✅ Comment moderation dashboard
- ⏳ Real-time updates (uses React Query polling - needs Socket.io)

## Backend Requirements

### 1. Install Dependencies
```bash
cd backend
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### 2. Create WebSocket Gateway

Create `backend/src/modules/comments/comments.gateway.ts`:

```typescript
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/comments',
})
export class CommentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // Emit new comment to all clients watching this content
  notifyNewComment(contentType: string, contentId: string, comment: any) {
    this.server.emit(`comment:new:${contentType}:${contentId}`, comment);
  }

  // Emit comment update
  notifyCommentUpdated(contentType: string, contentId: string, comment: any) {
    this.server.emit(`comment:updated:${contentType}:${contentId}`, comment);
  }

  // Emit comment deletion
  notifyCommentDeleted(contentType: string, contentId: string, commentId: string) {
    this.server.emit(`comment:deleted:${contentType}:${contentId}`, commentId);
  }

  @SubscribeMessage('join:content')
  handleJoinContent(client: Socket, payload: { contentType: string; contentId: string }) {
    const room = `${payload.contentType}:${payload.contentId}`;
    client.join(room);
    console.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leave:content')
  handleLeaveContent(client: Socket, payload: { contentType: string; contentId: string }) {
    const room = `${payload.contentType}:${payload.contentId}`;
    client.leave(room);
    console.log(`Client ${client.id} left room ${room}`);
  }
}
```

### 3. Update Comments Module

Update `backend/src/modules/comments/comments.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsGateway } from './comments.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsGateway],
  exports: [CommentsService, CommentsGateway],
})
export class CommentsModule {}
```

### 4. Update Comments Service

Inject the gateway and emit events:

```typescript
import { Injectable } from '@nestjs/common';
import { CommentsGateway } from './comments.gateway';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private commentsGateway: CommentsGateway, // Add this
  ) {}

  async create(userId: string, createCommentDto: CreateCommentDto) {
    // ... existing creation logic ...

    // Emit socket event after creating comment
    this.commentsGateway.notifyNewComment(
      comment.contentType,
      comment.contentId,
      this.formatCommentResponse(comment),
    );

    return this.formatCommentResponse(comment);
  }

  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto) {
    // ... existing update logic ...

    // Emit socket event after updating
    this.commentsGateway.notifyCommentUpdated(
      comment.contentType,
      comment.contentId,
      this.formatCommentResponse(comment),
    );

    return this.formatCommentResponse(comment);
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });

    // ... existing deletion logic ...

    // Emit socket event after deleting
    this.commentsGateway.notifyCommentDeleted(
      comment.contentType,
      comment.contentId,
      id,
    );

    return { message: 'Comment deleted successfully' };
  }
}
```

### 5. Update App Module

Ensure WebSocket gateway is enabled in `backend/src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { CommentsModule } from './modules/comments/comments.module';

@Module({
  imports: [
    // ... other modules
    CommentsModule,
  ],
})
export class AppModule {}
```

## Frontend Requirements

### 1. Install Dependencies

```bash
cd frontend
npm install socket.io-client
```

### 2. Create Socket Context

Create `frontend/src/contexts/socket-context.tsx`:

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
});

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const socketInstance = io(`${API_URL}/comments`, {
      transports: ["websocket", "polling"],
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Socket disconnected");
      setIsConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
```

### 3. Update Root Layout

Wrap app with SocketProvider in `frontend/src/app/layout.tsx`:

```typescript
import { SocketProvider } from "@/contexts/socket-context";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <QueryClientProvider>
          <SocketProvider>
            {children}
          </SocketProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### 4. Update CommentList Component

Add Socket.io listeners in `frontend/src/components/comments/comment-list.tsx`:

```typescript
import { useSocket } from "@/contexts/socket-context";

export function CommentList({ contentType, contentId }: CommentListProps) {
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join room for this content
    socket.emit("join:content", { contentType, contentId });

    // Listen for new comments
    socket.on(`comment:new:${contentType}:${contentId}`, (newComment) => {
      queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
    });

    // Listen for updated comments
    socket.on(`comment:updated:${contentType}:${contentId}`, (updatedComment) => {
      queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
    });

    // Listen for deleted comments
    socket.on(`comment:deleted:${contentType}:${contentId}`, (commentId) => {
      queryClient.invalidateQueries({ queryKey: ["comments", contentType, contentId] });
    });

    return () => {
      // Clean up listeners
      socket.emit("leave:content", { contentType, contentId });
      socket.off(`comment:new:${contentType}:${contentId}`);
      socket.off(`comment:updated:${contentType}:${contentId}`);
      socket.off(`comment:deleted:${contentType}:${contentId}`);
    };
  }, [socket, isConnected, contentType, contentId, queryClient]);

  // ... rest of component
}
```

## Testing

### Backend
1. Start backend: `npm run start:dev`
2. Check WebSocket connection: `ws://localhost:4000/comments`
3. Monitor console for connection logs

### Frontend
1. Start frontend: `npm run dev`
2. Open browser console
3. Navigate to content with comments
4. Check for "Socket connected" message
5. Open multiple browser tabs to test real-time updates

### Manual Testing
1. Open article in two browser tabs
2. Add comment in tab 1
3. Verify comment appears in tab 2 without refresh
4. Edit comment in tab 1
5. Verify update appears in tab 2
6. Delete comment in tab 1
7. Verify removal in tab 2

## Security Considerations

1. **Authentication**: Add JWT validation to WebSocket connections
2. **Rate Limiting**: Limit comment creation frequency per user
3. **Room Authorization**: Verify user has access to content before joining room
4. **Input Validation**: Validate all socket messages
5. **CORS**: Restrict origins in production

## Performance Optimization

1. **Room-based Broadcasting**: Only emit to users watching specific content
2. **Throttling**: Debounce rapid updates
3. **Connection Pooling**: Reuse connections across components
4. **Fallback Strategy**: React Query polling as fallback if WebSocket fails

## Environment Variables

Add to `.env`:

```env
# Backend
SOCKET_IO_PORT=4000
CORS_ORIGIN=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_WS_URL=ws://localhost:4000
```

## Deployment Notes

- **Production WebSocket**: Ensure load balancer supports WebSocket (sticky sessions)
- **SSL**: Use `wss://` in production
- **Scaling**: Consider Redis adapter for multi-instance deployments

## References

- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Query WebSocket Integration](https://tanstack.com/query/latest/docs/react/guides/window-focus-refetching)
