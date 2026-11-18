"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Users,
  Shield,
  UserCheck,
  Edit,
  Trash2,
  Filter,
} from "lucide-react";
import UserDrawer from "@/components/users/UserDrawer";
import { userService } from "@/services/userService";
import { UserResponseDto } from "@/types/api.types";
import { useToast } from "@/contexts/ToastContext";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";

export default function UserManagementPage() {
  const toast = useToast();
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "ADMIN" | "USER">("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserResponseDto | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchUsers();
  };

  const handleCreateNew = () => {
    setUserToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (user: UserResponseDto) => {
    setUserToEdit(user);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (user: UserResponseDto) => {
    if (confirm(`Are you sure you want to remove user "${user.name}"? This action cannot be undone.`)) {
      try {
        await userService.deleteUser(user.id);
        toast.success(`User "${user.name}" removed successfully`, 200);
        fetchUsers();
      } catch (err: unknown) {
        toast.handleApiError(err);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);

    const normalizedRole = u.role?.toUpperCase();
    const matchesRole =
      roleFilter === "ALL" ||
      (roleFilter === "ADMIN" && normalizedRole === "ADMIN") ||
      (roleFilter === "USER" && normalizedRole !== "ADMIN");

    return matchesSearch && matchesRole;
  });

  const adminCount = users.filter(
    (u) => u.role?.toUpperCase() === "ADMIN"
  ).length;
  const standardCount = users.length - adminCount;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Access &amp; Permissions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            User Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Create, manage, and assign roles for administrators and team members across the workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Refresh Users"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Metric Cards for User Management */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Accounts
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={users.length} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Workspace team</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-brand-accent flex items-center justify-center">
            <Users className="w-5 h-5 text-brand-accent" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Administrators
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={adminCount} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Full control access</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-brand-accent flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Standard Users
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={standardCount} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Staff &amp; contributors</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle text-gray-500 flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-brand-accent" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-4 shadow-sm transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs text-text-primary outline-none bg-bg-app transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-2" />
            <button
              onClick={() => setRoleFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                roleFilter === "ALL"
                  ? "bg-bg-surface text-brand-accent shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setRoleFilter("ADMIN")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                roleFilter === "ADMIN"
                  ? "bg-bg-surface text-brand-accent shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              Admins
            </button>
            <button
              onClick={() => setRoleFilter("USER")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                roleFilter === "USER"
                  ? "bg-bg-surface text-brand-accent shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              Users
            </button>
          </div>
        </div>
      </div>

      {/* Responsive Data Table */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border-subtle">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-4 px-6">User Account</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Date Registered</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
                      <span>Loading user accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-sm font-semibold text-text-primary">
                        No users found
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchTerm || roleFilter !== "ALL"
                          ? "Try adjusting your search or filters."
                          : "Get started by creating your first user account."}
                      </p>
                      {searchTerm === "" && roleFilter === "ALL" && (
                        <button
                          onClick={handleCreateNew}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-primary font-bold text-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create User</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isAdmin = user.role?.toUpperCase() === "ADMIN";
                  const initials = user.name
                    ? user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "U";

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-border-subtle/30 transition-colors group"
                    >
                      {/* User Account */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-brand-primary text-brand-accent font-bold text-xs flex items-center justify-center ring-2 ring-border-subtle shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-text-primary group-hover:text-brand-accent transition-colors truncate text-sm">
                              {user.name}
                            </p>
                            <p className="text-gray-400 font-mono text-[11px] truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-primary text-brand-accent shadow-sm">
                            <Shield className="w-3 h-3" />
                            ADMIN
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-bg-app border border-border-subtle text-gray-500 dark:text-gray-300">
                            <UserCheck className="w-3 h-3 text-brand-accent" />
                            USER
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors cursor-pointer"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(user)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Creation & Edit Drawer */}
      <UserDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          fetchUsers();
        }}
        userToEdit={userToEdit}
      />
    </div>
  );
}
