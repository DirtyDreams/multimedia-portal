"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastProps {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (duration === 0) return; // 0 means persistent toast

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match animation duration
  };

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  };

  const colors = {
    success: "border-green-500/20 bg-green-50 dark:bg-green-950",
    error: "border-red-500/20 bg-red-50 dark:bg-red-950",
    info: "border-blue-500/20 bg-blue-50 dark:bg-blue-950",
    warning: "border-yellow-500/20 bg-yellow-50 dark:bg-yellow-950",
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${colors[type]}
        ${isExiting ? "animate-toast-exit" : "animate-toast-enter"}
        max-w-md w-full pointer-events-auto
      `}
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{icons[type]}</div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <h4 className="font-semibold text-sm mb-1">{title}</h4>}
        <p className="text-sm text-foreground/90">{message}</p>
      </div>

      {/* Close Button */}
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-1 hover:bg-background/50 rounded transition"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
