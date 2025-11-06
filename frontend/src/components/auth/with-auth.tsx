"use client";

import { ComponentType } from "react";
import { ProtectedRoute } from "./protected-route";
import type { UserRole } from "@/stores/auth-store";

/**
 * Higher-Order Component (HOC) for protecting pages with authentication
 * @param Component - The component to protect
 * @param requiredRole - Optional role requirement
 */
export function withAuth<P extends object>(
  Component: ComponentType<P>,
  requiredRole?: UserRole
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requiredRole={requiredRole}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
