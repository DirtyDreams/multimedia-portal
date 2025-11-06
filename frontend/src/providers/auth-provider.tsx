"use client";

import { useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const checkAuth = useAuthStore((state) => state.checkAuth);

  useEffect(() => {
    // Check authentication status on mount
    checkAuth();
  }, [checkAuth]);

  return <>{children}</>;
}
