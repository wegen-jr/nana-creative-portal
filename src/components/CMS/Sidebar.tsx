"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  BriefcaseBusiness,
  UserRound,
} from "lucide-react";
import Image from "next/image";
const navigation = [
  {
    title: "OVERVIEW",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { name: "Projects", href: "/projects", icon: FolderKanban },
      { name: "Tasks", href: "/tasks", icon: CheckSquare },
      { name: "Employees", href: "/employees", icon: Users },
      { name: "Clients", href: "/clients", icon: UserRound },
    ],
  },
  {
    title: "CONTENT",
    items: [
      { name: "Content Manager", href: "/content", icon: FileText },
    ],
  },
  {
    title: "SYSTEM",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-white/10 bg-brand-accent-glow">
        <Link href="/dashboard" className="flex items-center gap-3 ">
          <div className="flex items-center justify-center  ">
                      <Image
                      src="/images/logo.png"
                      alt="Nana Creative"
                      width={50}
                      height={50}
                      priority
                      className="h-30 w-auto object-contain rounded-lg"/>
            </div>

          {!collapsed && (
            <div className="bg-brand-accent-glow text-black px-2 rounded-lg">
              <h1 className="font-bold tracking-wider text-sm  px-2 py-1 ">
                NANA CREATIVE
              </h1>
              <p className="text-[10px] text-gray-500 tracking-widest">
                MANAGEMENT
              </p>
            </div>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:block text-gray-500 hover:text-white"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-gray-400 hover:text-white"
          aria-label="Close sidebar"
        >
          <X size={21} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-7 bg-brand-dark">
        {navigation.map((section) => (
          <div key={section.title}>
            {!collapsed && (
              <p className="text-[10px] font-semibold tracking-[2px] text-canvas-surface px-3 mb-3">
                {section.title}
              </p>
            )}

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                const active =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? item.name : undefined}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-[#d4a853]/15 text-[#d4a853]"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={19} className="shrink-0" />

                    {!collapsed && <span>{item.name}</span>}

                    {active && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#d4a853]" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User profile and logout */}
      <div className="border-t border-white/10 bg-brand-accent-glow ">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full text-black flex items-center justify-center">
              <BriefcaseBusiness size={17} />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs">Administrator</p>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            // Connect your logout function here
          }}
          className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-black text-sm  hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <LogOut size={19} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 h-16 bg-[#101013] border-b border-white/10 flex items-center justify-between px-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#d4a853] text-black flex items-center justify-center font-black">
            N
          </div>
          <span className="font-bold text-sm tracking-wider">
            NANA CREATIVE
          </span>
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="text-white"
          aria-label="Open sidebar"
        >
          <Menu size={24} />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed top-0 left-0 h-screen bg-[#101013] border-r border-white/10 flex-col transition-all duration-300 z-40 ${
          collapsed ? "w-20" : "w-64"
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 h-screen w-72 bg-[#101013] border-r border-white/10 flex flex-col z-50 transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
