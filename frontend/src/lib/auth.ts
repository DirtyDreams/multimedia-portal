import { jwtDecode } from "jwt-decode";

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

interface JWTPayload {
  sub: string;
  email: string;
  name?: string;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Store authentication token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

/**
 * Get authentication token from localStorage
 */
export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
}

/**
 * Remove authentication token from localStorage
 */
export function removeToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/**
 * Store refresh token in localStorage
 */
export function setRefreshToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
}

/**
 * Decode JWT token and return payload
 */
export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token);
  if (!decoded) return true;

  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
}

/**
 * Validate token and check if it's still valid
 */
export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;

  return !isTokenExpired(token);
}

/**
 * Get user data from token
 */
export function getUserFromToken(): {
  id: string;
  email: string;
  name?: string;
  role: "user" | "moderator" | "admin";
} | null {
  const token = getToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    id: decoded.sub,
    email: decoded.email,
    name: decoded.name,
    role: decoded.role as "user" | "moderator" | "admin",
  };
}

/**
 * Check if token needs refresh (expires in less than 5 minutes)
 */
export function shouldRefreshToken(): boolean {
  const token = getToken();
  if (!token) return false;

  const decoded = decodeToken(token);
  if (!decoded) return false;

  const currentTime = Date.now() / 1000;
  const timeUntilExpiry = decoded.exp - currentTime;

  // Refresh if token expires in less than 5 minutes
  return timeUntilExpiry < 300;
}
