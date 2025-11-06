/**
 * API Error Handling Utilities
 *
 * Provides utilities for handling API errors, retries, and error parsing
 */

import { errorLogger, ErrorSeverity, createError } from './error-logger';

export class APIError extends Error {
  statusCode: number;
  endpoint: string;
  responseData?: any;

  constructor(
    message: string,
    statusCode: number,
    endpoint: string,
    responseData?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.responseData = responseData;
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class ValidationError extends Error {
  errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatusCodes: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

/**
 * Parse error response from API
 */
export async function parseAPIError(
  response: Response,
  endpoint: string
): Promise<APIError> {
  let errorMessage = `Request failed with status ${response.status}`;
  let responseData: any;

  try {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      responseData = await response.json();
      errorMessage = responseData.message || responseData.error || errorMessage;
    } else {
      const text = await response.text();
      errorMessage = text || errorMessage;
    }
  } catch (parseError) {
    // If we can't parse the error, use the default message
    console.error('Failed to parse error response:', parseError);
  }

  return new APIError(errorMessage, response.status, endpoint, responseData);
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown, statusCode?: number): boolean {
  // Network errors are retryable
  if (error instanceof NetworkError || (error as any).name === 'NetworkError') {
    return true;
  }

  // Certain status codes are retryable
  if (statusCode && DEFAULT_RETRY_CONFIG.retryableStatusCodes.includes(statusCode)) {
    return true;
  }

  return false;
}

/**
 * Calculate delay for retry with exponential backoff
 */
function calculateRetryDelay(
  attemptNumber: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attemptNumber - 1),
    config.maxDelay
  );

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  return delay + jitter;
}

/**
 * Wait for a specified duration
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic and error handling
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  config: Partial<RetryConfig> = {}
): Promise<Response> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If response is ok, return it
      if (response.ok) {
        return response;
      }

      // Parse the error
      const apiError = await parseAPIError(response, url);

      // Check if we should retry
      if (
        attempt < retryConfig.maxRetries &&
        isRetryableError(apiError, apiError.statusCode)
      ) {
        const delay = calculateRetryDelay(attempt + 1, retryConfig);

        errorLogger.logNetworkError(
          apiError,
          url,
          options.method || 'GET',
          apiError.statusCode,
          attempt + 1
        );

        await wait(delay);
        continue;
      }

      // Log the API error
      errorLogger.logAPIError(
        apiError,
        url,
        apiError.statusCode,
        apiError.responseData
      );

      throw apiError;
    } catch (error) {
      lastError = createError(error);

      // Network error (no response)
      if (!navigator.onLine) {
        lastError = new NetworkError('No internet connection');
      } else if (
        (error as any).name === 'TypeError' &&
        (error as Error).message.includes('fetch')
      ) {
        lastError = new NetworkError('Network request failed');
      }

      // If this is the last attempt or error is not retryable, throw
      if (attempt >= retryConfig.maxRetries || !isRetryableError(lastError)) {
        errorLogger.logNetworkError(
          lastError,
          url,
          options.method || 'GET',
          undefined,
          attempt + 1
        );

        throw lastError;
      }

      // Wait before retrying
      const delay = calculateRetryDelay(attempt + 1, retryConfig);
      await wait(delay);
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: unknown): never {
  const authError =
    error instanceof AuthenticationError
      ? error
      : new AuthenticationError('Session expired. Please log in again.');

  errorLogger.logAuthError(authError, 'session_expired');

  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
  }

  throw authError;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof AuthenticationError) {
    return true;
  }

  if (error instanceof APIError) {
    return error.statusCode === 401 || error.statusCode === 403;
  }

  return false;
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ValidationError) {
    return error.message || 'Please check your input and try again.';
  }

  if (error instanceof AuthenticationError) {
    return 'Your session has expired. Please log in again.';
  }

  if (error instanceof NetworkError) {
    return 'Unable to connect to the server. Please check your internet connection.';
  }

  if (error instanceof APIError) {
    if (error.statusCode === 404) {
      return 'The requested resource was not found.';
    }
    if (error.statusCode === 429) {
      return 'Too many requests. Please try again later.';
    }
    if (error.statusCode >= 500) {
      return 'Server error. Our team has been notified. Please try again later.';
    }
    return error.message || 'An unexpected error occurred.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Create a fetch wrapper with error handling
 */
export function createAPIClient(baseURL: string) {
  return {
    async get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      const url = `${baseURL}${endpoint}`;
      const response = await fetchWithRetry(url, {
        ...options,
        method: 'GET',
      });
      return response.json();
    },

    async post<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
      const url = `${baseURL}${endpoint}`;
      const response = await fetchWithRetry(url, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return response.json();
    },

    async put<T>(endpoint: string, data?: any, options: RequestInit = {}): Promise<T> {
      const url = `${baseURL}${endpoint}`;
      const response = await fetchWithRetry(url, {
        ...options,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
      });
      return response.json();
    },

    async delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
      const url = `${baseURL}${endpoint}`;
      const response = await fetchWithRetry(url, {
        ...options,
        method: 'DELETE',
      });

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    },
  };
}
