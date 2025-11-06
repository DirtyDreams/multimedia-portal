import { io, Socket } from "socket.io-client";

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(userId?: string): Socket {
    if (this.socket?.connected) {
      return this.socket;
    }

    // TODO: Replace with actual backend URL
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

    this.socket = io(socketUrl, {
      auth: {
        userId,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: this.maxReconnectAttempts,
      transports: ["websocket", "polling"],
    });

    this.setupEventListeners();

    return this.socket;
  }

  private setupEventListeners() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[Socket] Connected to server");
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[Socket] Connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error("[Socket] Max reconnection attempts reached");
        this.disconnect();
      }
    });

    this.socket.on("reconnect_attempt", (attemptNumber) => {
      console.log(`[Socket] Reconnection attempt ${attemptNumber}`);
    });

    this.socket.on("reconnect", (attemptNumber) => {
      console.log(`[Socket] Reconnected after ${attemptNumber} attempts`);
      this.reconnectAttempts = 0;
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event: string, callback: (...args: any[]) => void) {
    this.socket?.on(event, callback);
  }

  off(event: string, callback?: (...args: any[]) => void) {
    if (callback) {
      this.socket?.off(event, callback);
    } else {
      this.socket?.off(event);
    }
  }

  emit(event: string, ...args: any[]) {
    this.socket?.emit(event, ...args);
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
