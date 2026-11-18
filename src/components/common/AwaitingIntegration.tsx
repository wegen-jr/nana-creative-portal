"use client";

import React from "react";
import { Sparkles, Layers, RefreshCw } from "lucide-react";

interface AwaitingIntegrationProps {
  moduleName: string;
  expectedEndpoint?: string;
  httpMethod?: "GET" | "POST" | "PATCH" | "DELETE";
  description?: string;
  sampleContract?: Record<string, unknown>;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function AwaitingIntegration({
  moduleName,
  description = "This module is currently in development and will be available in an upcoming release.",
  onRefresh,
  isRefreshing = false,
}: AwaitingIntegrationProps) {
  return (
    <div className="w-full rounded-2xl bg-bg-surface border border-border-subtle p-8 sm:p-14 shadow-sm text-center max-w-3xl mx-auto my-6 transition-all">
      {/* Refined Centerpiece Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-primary/10 dark:bg-brand-primary/30 border border-brand-accent/30 text-brand-primary dark:text-brand-accent text-xs font-semibold uppercase tracking-wider mb-6">
        <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
        <span>Feature in Development</span>
      </div>

      {/* Decorative Icon */}
      <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-bg-app border border-border-subtle flex items-center justify-center text-brand-accent shadow-inner">
        <Layers className="w-8 h-8 text-brand-accent" />
      </div>

      {/* Title */}
      <h2 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
        {moduleName}
      </h2>

      {/* Clean Description */}
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto leading-relaxed">
        {description}
      </p>

      {/* Luxury Status Indicators */}
      <div className="mt-8 p-5 rounded-xl bg-bg-app border border-border-subtle max-w-md mx-auto flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-accent" />
          <span className="font-medium">Status</span>
        </div>
        <span className="font-semibold text-brand-primary dark:text-brand-accent px-2.5 py-0.5 rounded-full bg-brand-accent/10 border border-brand-accent/20">
          Planned Release
        </span>
      </div>

      {/* Optional Refresh / Check Action */}
      {onRefresh && (
        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border-subtle text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-text-primary hover:bg-border-subtle/50 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`} />
            <span>Check Availability</span>
          </button>
        </div>
      )}
    </div>
  );
}
