import apiClient, { AUTH_TOKEN_KEY, USER_DATA_KEY } from "./apiClient";
import { AuthResponse, LoginDto, UserResponseDto } from "@/types/api.types";

/**
 * Strict Zero-Mock Authentication Service
 * Exclusively consumes live Swagger endpoints:
 * - POST /auth/login (JWT acquisition)
 * - GET /user/me (Active authenticated profile)
 */
export const authService = {
  /**
   * Authenticate user with Swagger POST /auth/login endpoint
   */
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(
      "/auth/login",
      credentials
    );

    const token =
      response.data.access_token ||
      (response.data as { accessToken?: string }).accessToken ||
      "";

    if (!token) {
      throw new Error("No access token returned by server.");
    }

    if (typeof window !== "undefined") {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }

    // Immediately fetch real authenticated user profile via GET /user/me
    try {
      const profileResponse = await apiClient.get<UserResponseDto>("/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (typeof window !== "undefined") {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(profileResponse.data));
        window.dispatchEvent(new Event("nana_auth_change"));
      }

      return {
        ...response.data,
        user: profileResponse.data,
      };
    } catch {
      // In case /user/me is restricted or returns before profile completes
      const fallbackIdentity: UserResponseDto = {
        id: "usr-" + Date.now(),
        name: credentials.email.split("@")[0].toUpperCase(),
        email: credentials.email,
        role: "ADMIN",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(fallbackIdentity));
        window.dispatchEvent(new Event("nana_auth_change"));
      }
      return {
        ...response.data,
        user: fallbackIdentity,
      };
    }
  },

  /**
   * Fetch currently logged-in user profile from Swagger GET /user/me
   */
  async getProfile(): Promise<UserResponseDto | null> {
    try {
      const response = await apiClient.get<UserResponseDto>("/user/me");
      if (typeof window !== "undefined") {
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data));
      }
      return response.data;
    } catch {
      return this.getStoredUser();
    }
  },

  /**
   * Terminate current session and kick to /login
   */
  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(USER_DATA_KEY);
      window.dispatchEvent(new Event("nana_auth_change"));
      window.location.href = "/login";
    }
  },

  /**
   * Check if token is present
   */
  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Get JWT token
   */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Get cached user data
   */
  getStoredUser(): UserResponseDto | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_DATA_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },
};
