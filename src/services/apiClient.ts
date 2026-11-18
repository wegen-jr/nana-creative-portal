import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://nana-backend-2jvy.onrender.com";

export const AUTH_TOKEN_KEY = "nana_auth_token";
export const USER_DATA_KEY = "nana_user_data";

/**
 * Enterprise Axios client configured for Nana Creative Admin Portal.
 * Automatically handles JWT Bearer authentication injection and 401 redirects.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
  },
});

// Request Interceptor: Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token && config.headers && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Global 401 Unauthorized handling
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        // Clear stored session
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);

        // Notify session listeners
        window.dispatchEvent(new Event("nana_auth_unauthorized"));

        // Redirect to /login if not already on login page
        const currentPath = window.location.pathname;
        if (currentPath !== "/login" && currentPath !== "/") {
          window.location.href = `/login?redirect=${encodeURIComponent(
            currentPath
          )}&reason=session_expired`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
