"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { ToastContainer } from "@/components/notifications/toast-container";
import { ToastProps, ToastType } from "@/components/notifications/toast";

interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
}

export function ToastProvider({ children, position = "top-right" }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Omit<ToastProps, "onClose">[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const toast = useCallback((options: ToastOptions) => {
    const id = generateId();
    const newToast: Omit<ToastProps, "onClose"> = {
      id,
      type: options.type || "info",
      title: options.title,
      message: options.message,
      duration: options.duration,
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const success = useCallback((message: string, title?: string) => {
    toast({ type: "success", message, title });
  }, [toast]);

  const error = useCallback((message: string, title?: string) => {
    toast({ type: "error", message, title });
  }, [toast]);

  const info = useCallback((message: string, title?: string) => {
    toast({ type: "info", message, title });
  }, [toast]);

  const warning = useCallback((message: string, title?: string) => {
    toast({ type: "warning", message, title });
  }, [toast]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  const value: ToastContextValue = {
    toast,
    success,
    error,
    info,
    warning,
    dismiss,
    dismissAll,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={dismiss} position={position} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
