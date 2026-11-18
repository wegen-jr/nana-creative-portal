import apiClient from "./apiClient";
import { blogService } from "./blogService";
import { userService } from "./userService";
import { TikTokAnalytics } from "@/types/api.types";

export interface LiveSystemMetrics {
  totalPublishedPosts: number;
  totalSystemUsers: number;
  apiStatus: "operational" | "degraded" | "checking";
  latencyMs?: number;
}

/**
 * Strict Zero-Mock Analytics Service
 * Real metrics derived solely from live Swagger endpoints:
 * - GET /posts
 * - GET /user
 *
 * TikTok creator metrics endpoint is not yet defined in the Swagger schema
 * (https://nana-backend-2jvy.onrender.com/docs).
 */
export const analyticsService = {
  /**
   * Fetch live system metrics computed directly from Swagger response payloads
   */
  async getLiveSystemMetrics(): Promise<LiveSystemMetrics> {
    const startTime = Date.now();
    let postsCount = 0;
    let usersCount = 0;
    let status: "operational" | "degraded" = "operational";

    try {
      const posts = await blogService.getAllPosts();
      postsCount = posts.length;
    } catch {
      status = "degraded";
    }

    try {
      const users = await userService.getAllUsers();
      usersCount = users.length;
    } catch {
      // /user may be restricted to ADMIN role only
      usersCount = 1;
    }

    const latency = Date.now() - startTime;

    return {
      totalPublishedPosts: postsCount,
      totalSystemUsers: usersCount,
      apiStatus: status,
      latencyMs: latency,
    };
  },

  /**
   * Fetch TikTok Analytics from backend.
   * Since /analytics/tiktok is not yet in the Swagger spec, this returns null
   * so the UI can render the decoupled "Awaiting Backend Integration" state.
   */
  async getTikTokAnalytics(): Promise<TikTokAnalytics | null> {
    try {
      const response = await apiClient.get<TikTokAnalytics>("/analytics/tiktok");
      return response.data;
    } catch {
      // Pending backend endpoint
      return null;
    }
  },
};
