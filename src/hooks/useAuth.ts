"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { LoginDto, UserResponseDto } from "@/types/api.types";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthState = useCallback(async () => {
    try {
      const hasToken = authService.isAuthenticated();
      if (!hasToken) {
        setUser(null);
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      const cached = authService.getStoredUser();
      if (cached) {
        setUser(cached);
      }

      // Re-verify profile with live GET /user/me
      const profile = await authService.getProfile();
      if (profile) {
        setUser(profile);
      }
    } catch {
      // Invalidation or network error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthState();

    const handleAuthChange = () => {
      checkAuthState();
    };

    window.addEventListener("nana_auth_change", handleAuthChange);
    window.addEventListener("nana_auth_unauthorized", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("nana_auth_change", handleAuthChange);
      window.removeEventListener("nana_auth_unauthorized", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, [checkAuthState]);

  const login = async (credentials: LoginDto) => {
    setLoading(true);
    setError(null);
    try {
      const result = await authService.login(credentials);
      setIsAuthenticated(true);
      if (result.user) {
        setUser(result.user);
      }
      return result;
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string | string[]; error?: string };
        };
        message?: string;
      };

      const rawMsg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
        axiosErr.message ||
        "Invalid email or password. Please verify credentials.";

      const errorString = Array.isArray(rawMsg)
        ? rawMsg.join(", ")
        : String(rawMsg);

      setError(errorString);
      throw new Error(errorString);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    refreshUser: checkAuthState,
  };
}
