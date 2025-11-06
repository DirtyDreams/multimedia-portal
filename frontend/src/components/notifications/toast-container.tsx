"use client";

import { Toast, ToastProps } from "./toast";

interface ToastContainerProps {
  toasts: Omit<ToastProps, "onClose">[];
  onClose: (id: string) => void;
  position?: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
}

export function ToastContainer({ toasts, onClose, position = "top-right" }: ToastContainerProps) {
  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-left": "bottom-4 left-4",
  };

  return (
    <div
      className={`
        fixed z-[9999] flex flex-col gap-3 pointer-events-none
        ${positionClasses[position]}
      `}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={onClose} />
      ))}
    </div>
  );
}
