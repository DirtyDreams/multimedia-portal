import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authAPI } from "@/lib/api";
import { setToken, setRefreshToken, removeToken, getUserFromToken } from "@/lib/auth";

export type UserRole = "user" | "moderator" | "admin";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authAPI.login(email, password);
          const { accessToken, refreshToken, user } = response;

          setToken(accessToken);
          if (refreshToken) {
            setRefreshToken(refreshToken);
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Login failed";
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      register: async (name: string, email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authAPI.register(name, email, password);
          const { accessToken, refreshToken, user } = response;

          setToken(accessToken);
          if (refreshToken) {
            setRefreshToken(refreshToken);
          }

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Registration failed";
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          await authAPI.logout();
        } catch (error) {
          console.error("Logout error:", error);
        } finally {
          removeToken();
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });

          // Redirect to home page
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }
      },

      checkAuth: () => {
        const user = getUserFromToken();

        if (user) {
          set({
            user,
            isAuthenticated: true,
          });
        } else {
          set({
            user: null,
            isAuthenticated: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
