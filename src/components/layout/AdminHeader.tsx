"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const BREADCRUMB_MAP: Record<string, string> = {
  "/admin": "Overview",
  "/admin/users": "Manage Users",
  "/admin/blogs": "Blog Editor",
  "/admin/partners": "Manage Partners",
  "/admin/analytics": "TikTok Analytics",
  "/admin/settings": "Settings",
};

export default function AdminHeader() {
  const pathname = usePathname();
  const { user } = useAuth();

  const currentSection = BREADCRUMB_MAP[pathname] || "Dashboard";
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NC";

  return (
    <header className="hidden lg:flex sticky top-0 z-20 h-16 bg-bg-surface border-b border-border-subtle px-6 sm:px-8 items-center justify-between transition-colors shadow-sm">
      {/* Dynamic Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs sm:text-sm">
        <span className="font-semibold text-gray-400 dark:text-gray-500">
          Admin
        </span>
        <span className="text-gray-300 dark:text-gray-600 font-light">/</span>
        <span className="font-bold text-text-primary text-sm sm:text-base">
          {currentSection}
        </span>
      </div>

      {/* Active User Profile */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          {/* User Avatar */}
          <div className="w-8 h-8 rounded-full bg-brand-primary text-brand-accent font-bold text-xs flex items-center justify-center ring-1 ring-border-subtle shrink-0">
            {userInitials}
          </div>

          {/* User Name & Role Badge */}
          <div className="text-left hidden sm:block min-w-0">
            <p className="text-xs font-bold text-text-primary leading-tight truncate">
              {user?.name || "Workspace Admin"}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-brand-primary text-brand-accent uppercase tracking-wider">
                {user?.role || "ADMIN"}
              </span>
              <span className="text-[10px] text-gray-400 font-mono truncate max-w-[150px]">
                {user?.email || "admin@nanacreative.com"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
