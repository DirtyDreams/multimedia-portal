"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { LoadingPage } from "@/components/ui/loading-spinner";
import type { UserRole } from "@/stores/auth-store";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }

    // If authenticated but doesn't have required role, redirect to home
    if (!isLoading && isAuthenticated && requiredRole && user) {
      const roleHierarchy: Record<UserRole, number> = {
        user: 1,
        moderator: 2,
        admin: 3,
      };

      const userRoleLevel = roleHierarchy[user.role];
      const requiredRoleLevel = roleHierarchy[requiredRole];

      if (userRoleLevel < requiredRoleLevel) {
        router.push("/");
      }
    }
  }, [isAuthenticated, isLoading, requiredRole, user, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingPage />;
  }

  // If not authenticated, show nothing (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  // If role check fails, show nothing (will redirect)
  if (requiredRole && user) {
    const roleHierarchy: Record<UserRole, number> = {
      user: 1,
      moderator: 2,
      admin: 3,
    };

    const userRoleLevel = roleHierarchy[user.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return null;
    }
  }

  return <>{children}</>;
}
