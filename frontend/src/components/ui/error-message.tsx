import { AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  title?: string;
  message: string;
  variant?: "error" | "warning";
  className?: string;
}

export function ErrorMessage({
  title,
  message,
  variant = "error",
  className,
}: ErrorMessageProps) {
  const Icon = variant === "error" ? XCircle : AlertTriangle;
  const colorClasses =
    variant === "error"
      ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950"
      : "border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950";
  const iconColorClasses =
    variant === "error"
      ? "text-red-500 dark:text-red-400"
      : "text-yellow-500 dark:text-yellow-400";
  const textColorClasses =
    variant === "error"
      ? "text-red-900 dark:text-red-100"
      : "text-yellow-900 dark:text-yellow-100";

  return (
    <div
      className={cn(
        "flex items-start space-x-3 rounded-lg border p-4",
        colorClasses,
        className
      )}
      role="alert"
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconColorClasses)} />
      <div className="flex-1 space-y-1">
        {title && (
          <p className={cn("font-semibold text-sm", textColorClasses)}>{title}</p>
        )}
        <p className={cn("text-sm", textColorClasses)}>{message}</p>
      </div>
    </div>
  );
}
