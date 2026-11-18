"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, TrendingUp } from "lucide-react";
import AwaitingIntegration from "@/components/common/AwaitingIntegration";
import { analyticsService } from "@/services/analyticsService";
import { TikTokAnalytics } from "@/types/api.types";
import { useToast } from "@/contexts/ToastContext";

export default function TikTokAnalyticsPage() {
  const toast = useToast();
  const [analytics, setAnalytics] = useState<TikTokAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPinging, setIsPinging] = useState(false);

  const checkAnalyticsEndpoint = useCallback(async () => {
    setIsPinging(true);
    try {
      const data = await analyticsService.getTikTokAnalytics();
      setAnalytics(data);
      if (data) {
        toast.success("TikTok analytics updated", 200);
      }
    } catch {
      // Pending backend implementation
    } finally {
      setLoading(false);
      setIsPinging(false);
    }
  }, [toast]);

  useEffect(() => {
    checkAnalyticsEndpoint();
  }, [checkAnalyticsEndpoint]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Audience &amp; Reach
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            TikTok Creator Analytics
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Real-time analytics and performance metrics for brand creators and campaigns.
          </p>
        </div>

        <button
          onClick={checkAnalyticsEndpoint}
          disabled={isPinging}
          className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          title="Refresh Analytics"
        >
          <RefreshCw
            className={`w-4 h-4 ${isPinging ? "animate-spin text-brand-accent" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* If live data exists, render metrics; otherwise render clean minimalist empty state */}
      {analytics ? (
        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-sm">
          <p className="text-sm font-bold text-text-primary">Performance Overview</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-bg-app border border-border-subtle">
              <span className="text-xs text-gray-400">Total Views</span>
              <p className="text-xl font-bold text-text-primary mt-1">
                {analytics.totalViews?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg-app border border-border-subtle">
              <span className="text-xs text-gray-400">Total Followers</span>
              <p className="text-xl font-bold text-text-primary mt-1">
                {analytics.totalFollowers?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-bg-app border border-border-subtle">
              <span className="text-xs text-gray-400">Engagement Rate</span>
              <p className="text-xl font-bold text-text-primary mt-1">
                {analytics.engagementRate || 0}%
              </p>
            </div>
          </div>
        </div>
      ) : (
        <AwaitingIntegration
          moduleName="TikTok Creator Analytics"
          description="Audience reach and creator performance analytics are currently in development and will be available in an upcoming release."
          onRefresh={checkAnalyticsEndpoint}
          isRefreshing={isPinging}
        />
      )}
    </div>
  );
}
