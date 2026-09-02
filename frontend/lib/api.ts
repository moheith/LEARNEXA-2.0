/**
 * API Client Utility
 * Centralized API communication with error handling and token management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:5000/api";

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  ok: boolean;
}

/**
 * Get stored JWT token from localStorage
 */
function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

/**
 * Make API request with built-in error handling and auth
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers instanceof Headers
        ? Object.fromEntries(options.headers.entries())
        : typeof options.headers === "object" && options.headers
          ? (options.headers as Record<string, string>)
          : {}),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        ok: false,
        error: data.error || `HTTP ${response.status}`,
        data: undefined,
      };
    }

    return {
      ok: true,
      data,
      error: undefined,
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
      data: undefined,
    };
  }
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "GET" });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  body: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  body: any
): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
  return apiRequest<T>(endpoint, { method: "DELETE" });
}

/**
 * Clear stored token and redirect to login
 */
export function clearAuth(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }
}
