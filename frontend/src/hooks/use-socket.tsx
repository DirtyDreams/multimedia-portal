"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Socket } from "socket.io-client";
import { socketService } from "@/lib/socket";
import { useAuth } from "./use-auth";

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  emit: (event: string, ...args: any[]) => void;
  on: (event: string, callback: (...args: any[]) => void) => void;
  off: (event: string, callback?: (...args: any[]) => void) => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

interface SocketProviderProps {
  children: ReactNode;
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      // Disconnect socket if user logs out
      if (socket) {
        socketService.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Connect socket when user is authenticated
    const newSocket = socketService.connect(user.id);
    setSocket(newSocket);

    // Update connection status
    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    newSocket.on("connect", handleConnect);
    newSocket.on("disconnect", handleDisconnect);

    // Set initial connection status
    setIsConnected(newSocket.connected);

    return () => {
      newSocket.off("connect", handleConnect);
      newSocket.off("disconnect", handleDisconnect);
    };
  }, [user?.id]);

  const value: SocketContextValue = {
    socket,
    isConnected,
    emit: (event: string, ...args: any[]) => socketService.emit(event, ...args),
    on: (event: string, callback: (...args: any[]) => void) => socketService.on(event, callback),
    off: (event: string, callback?: (...args: any[]) => void) => socketService.off(event, callback),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
}
