"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Users2,
  TrendingUp,
  FileEdit,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    name: "Overview",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Manage Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Blog Editor",
    href: "/admin/blogs",
    icon: FileEdit,
  },
  {
    name: "Manage Partners",
    href: "/admin/partners",
    icon: Users2,
  },
  {
    name: "TikTok Analytics",
    href: "/admin/analytics",
    icon: TrendingUp,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isRouteActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  const isDark = mounted && theme === "dark";

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "NC";

  const sidebarContent = (isMobileView = false) => (
    <div className="h-full flex flex-col justify-between select-none">
      {/* TOP: Clean Horizontal Nana Creative Logo */}
      <div>
        <div className="h-20 flex items-center justify-between px-5 border-b border-border-subtle">
          <Link
            href="/admin"
            className="flex items-center gap-3 group overflow-hidden"
            onClick={() => setMobileOpen(false)}
          >
            {/* Glowing Logo */}
            <div className="relative w-10 h-10 rounded-full bg-brand-primary border-2 border-brand-accent flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform overflow-hidden p-2">
              <Image
                src="/images/logo.png"
                alt="Nana Creative"
                width={26}
                height={26}
                className="object-contain filter brightness-0 invert"
                priority
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-brand-accent ring-2 ring-bg-surface" />
            </div>

            {(!collapsed || isMobileView) && (
              <div className="min-w-0 transition-opacity duration-200">
                <span className="block font-extrabold tracking-[0.18em] text-sm text-text-primary truncate">
                  NANA CREATIVE
                </span>
                <span className="block text-[10px] font-bold text-brand-accent tracking-widest uppercase truncate font-mono">
                  Internal Portal
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          {!isMobileView && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-gray-400 hover:text-text-primary hover:bg-border-subtle/50 transition-colors cursor-pointer"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
            </button>
          )}

          {/* Mobile Close Button */}
          {isMobileView && (
            <button
              onClick={() => setMobileOpen(false)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-text-primary hover:bg-border-subtle/50 transition-colors cursor-pointer"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* MIDDLE: Decluttered Routing Links */}
        <nav className="px-3 py-6 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isRouteActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed && !isMobileView ? item.name : undefined}
                className={`group flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                  active
                    ? "bg-brand-primary text-white border-l-4 border-brand-accent shadow-md shadow-[#0B3B24]/30"
                    : "text-gray-500 dark:text-gray-300 hover:text-text-primary hover:bg-border-subtle/40 border-l-4 border-transparent hover:-translate-y-0.5"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    active
                      ? "text-brand-accent"
                      : "text-gray-400 group-hover:text-brand-accent"
                  }`}
                />

                {(!collapsed || isMobileView) && (
                  <span className="flex-1 truncate">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* BOTTOM: Theme Toggle & Logout Button */}
      <div className="p-3 border-t border-border-subtle space-y-2">
        {/* User preview on mobile drawer */}
        {isMobileView && user && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-bg-app border border-border-subtle mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-primary text-brand-accent font-bold text-xs flex items-center justify-center ring-1 ring-border-subtle shrink-0">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-text-primary truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-gray-400 font-mono truncate">
                {user.email}
              </p>
            </div>
          </div>
        )}

        {/* Theme Toggle Switch */}
        <div
          className={`flex items-center ${
            collapsed && !isMobileView ? "justify-center" : "justify-between"
          } p-2 rounded-xl bg-bg-app border border-border-subtle`}
        >
          {(!collapsed || isMobileView) && (
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 pl-1">
              Theme
            </span>
          )}

          <button
            onClick={() => setTheme(isDark ? "light" : "dark")}
            className="flex items-center gap-2 p-1.5 rounded-lg text-gray-500 dark:text-gray-300 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors cursor-pointer"
            aria-label="Toggle light/dark theme"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? (
              <>
                <Moon className="w-4 h-4 text-brand-accent" />
                {(!collapsed || isMobileView) && (
                  <span className="text-xs font-bold text-text-primary">
                    Dark
                  </span>
                )}
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                {(!collapsed || isMobileView) && (
                  <span className="text-xs font-bold text-text-primary">
                    Light
                  </span>
                )}
              </>
            )}
          </button>
        </div>

        {/* Prominent Logout Button */}
        <button
          onClick={logout}
          title={collapsed && !isMobileView ? "Logout" : undefined}
          className={`w-full flex items-center ${
            collapsed && !isMobileView ? "justify-center" : "justify-start gap-3"
          } px-3.5 py-3 rounded-xl text-xs sm:text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all duration-200 cursor-pointer group`}
        >
          <LogOut className="w-5 h-5 shrink-0 text-gray-400 group-hover:text-red-500 transition-colors" />
          {(!collapsed || isMobileView) && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Navigation Header */}
      <div className="lg:hidden sticky top-0 left-0 right-0 h-16 bg-bg-surface text-text-primary z-30 px-4 flex items-center justify-between border-b border-border-subtle shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-1 rounded-xl text-text-primary hover:bg-border-subtle/50 transition-colors cursor-pointer"
            aria-label="Open navigation menu"
          >
            <Menu size={22} className="text-text-primary" />
          </button>

          <Link href="/admin" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-primary border border-brand-accent flex items-center justify-center p-1.5 shadow-sm">
              <Image
                src="/images/logo.png"
                alt="Nana"
                width={20}
                height={20}
                className="filter brightness-0 invert"
              />
            </div>
            <span className="font-extrabold text-xs tracking-widest text-text-primary truncate">
              NANA CREATIVE
            </span>
          </Link>
        </div>

        {/* User initials bubble on mobile top bar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-primary text-brand-accent font-bold text-xs flex items-center justify-center ring-1 ring-border-subtle">
            {userInitials}
          </div>
        </div>
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 bottom-0 z-30 bg-bg-surface text-text-primary border-r border-border-subtle flex-col transition-all duration-300 shadow-xl ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent(false)}
      </aside>

      {/* Mobile Animated Slide-Out Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
              onClick={() => setMobileOpen(false)}
            />

            {/* Sliding Panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
              className="relative z-10 w-72 max-w-[85vw] h-full bg-bg-surface text-text-primary shadow-2xl border-r border-border-subtle"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
