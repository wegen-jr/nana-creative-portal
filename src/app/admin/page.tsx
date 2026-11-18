"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Plus,
  RefreshCw,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  Sparkles,
  Inbox,
} from "lucide-react";
import MetricCardsGrid from "@/components/dashboard/MetricCardsGrid";
import BlogDrawer from "@/components/blogs/BlogDrawer";
import { blogService } from "@/services/blogService";
import { userService } from "@/services/userService";
import { contactService } from "@/services/contactService";
import { Post, ContactRequest } from "@/types/api.types";
import { useToast } from "@/contexts/ToastContext";

export default function AdminOverviewPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [usersCount, setUsersCount] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [apiStatus, setApiStatus] = useState<"operational" | "degraded">("operational");

  // Blog creation drawer
  const [blogDrawerOpen, setBlogDrawerOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    const t0 = Date.now();
    try {
      const [fetchedPosts, fetchedUsers, fetchedContacts] = await Promise.all([
        blogService.getAllPosts(),
        userService.getAllUsers().catch(() => []),
        contactService.getAllContacts().catch(() => []),
      ]);

      setPosts(fetchedPosts);
      setUsersCount(fetchedUsers.length > 0 ? fetchedUsers.length : 1);
      setContacts(fetchedContacts);
      setLatencyMs(Date.now() - t0);
      setApiStatus("operational");
    } catch (err: unknown) {
      setApiStatus("degraded");
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDashboardData().then(() => {
      toast.success("Dashboard data refreshed", 200);
    });
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Executive Portal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Command Center
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Real-time overview of editorial publications, user accounts, and creative portal operations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Refresh Dashboard Data"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setBlogDrawerOpen(true)}
            className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Grid of Minimalist Luxury Metric Cards */}
      <MetricCardsGrid
        stats={{
          publishedPosts: posts.length,
          registeredUsers: usersCount,
          contactRequests: contacts.length,
          apiStatus,
          latencyMs,
        }}
        loading={loading}
      />

      {/* Main Two-Column Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Recent Publications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary text-brand-accent flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary tracking-tight">
                    Recent Publications
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Latest editorial articles published to the creative portal
                  </p>
                </div>
              </div>

              <Link
                href="/admin/blogs"
                className="text-xs font-bold text-brand-primary dark:text-brand-accent hover:underline transition-colors flex items-center gap-1 group"
              >
                <span>View All Posts</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Articles List */}
            <div className="space-y-3.5">
              {loading ? (
                <div className="text-center py-12 text-sm text-gray-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
                  <span>Loading recent publications...</span>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12 text-sm text-gray-400">
                  No articles published yet. Click &quot;Create Post&quot; to publish your first entry.
                </div>
              ) : (
                posts.slice(0, 5).map((post) => (
                  <div
                    key={post.id}
                    className="group p-4 rounded-xl border border-border-subtle hover:border-brand-accent/50 hover:bg-border-subtle/30 transition-all duration-200 hover:-translate-y-0.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* Thumbnail */}
                      <div className="relative w-16 h-14 rounded-xl bg-bg-app overflow-hidden shrink-0 border border-border-subtle">
                        {post.signedImageUrl || post.imageUrl ? (
                          <Image
                            src={post.signedImageUrl || post.imageUrl || ""}
                            alt={post.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">
                            No Image
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-primary/10 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-accent">
                            Editorial
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {new Date(post.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-accent truncate transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 font-light">
                          {post.description}
                        </p>
                      </div>
                    </div>

                    <Link
                      href="/admin/blogs"
                      className="px-3.5 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-text-primary hover:bg-bg-app transition-all shrink-0 self-end sm:self-auto"
                    >
                      Manage
                    </Link>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Contact Inquiries Card */}
          <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border-subtle">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary text-brand-accent flex items-center justify-center font-bold">
                  <Inbox className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary tracking-tight">
                    Recent Contact Inquiries
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Latest client requests submitted from the public portal
                  </p>
                </div>
              </div>

              <Link
                href="/admin/contacts"
                className="text-xs font-bold text-brand-primary dark:text-brand-accent hover:underline transition-colors flex items-center gap-1 group"
              >
                <span>View Inbox</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8 text-sm text-gray-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
                  <span>Loading inquiries...</span>
                </div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400">
                  No contact requests received yet.
                </div>
              ) : (
                contacts.slice(0, 3).map((inquiry) => (
                  <Link
                    key={inquiry.id}
                    href="/admin/contacts"
                    className="group p-4 rounded-xl border border-border-subtle hover:border-brand-accent/50 hover:bg-border-subtle/30 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-brand-primary/10 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-accent">
                          {inquiry.service}
                        </span>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {inquiry.phone}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-accent truncate transition-colors">
                        {inquiry.name} • {inquiry.companyName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                        {inquiry.message}
                      </p>
                    </div>

                    <span className="px-3 py-1 rounded-lg border border-border-subtle text-xs font-semibold text-gray-500 dark:text-gray-400 group-hover:text-brand-accent group-hover:border-brand-accent/40 transition-colors shrink-0">
                      Respond
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Column: Quick Actions & Operational Overview */}
        <div className="space-y-6">
          {/* Quick Actions Card */}
          <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-brand-accent" />
                Quick Actions
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-brand-accent bg-brand-primary/20 dark:bg-brand-primary px-2 py-0.5 rounded-full">
                Operations
              </span>
            </div>

            <div className="space-y-2.5">
              <button
                onClick={() => setBlogDrawerOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-brand-accent/40 hover:bg-border-subtle/30 text-left transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-accent flex items-center justify-center">
                    <Plus className="w-4 h-4 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary group-hover:text-brand-accent transition-colors">
                      Create Post
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Draft a new editorial article
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all" />
              </button>

              <Link
                href="/admin/contacts"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-brand-accent/40 hover:bg-border-subtle/30 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-accent flex items-center justify-center">
                    <Inbox className="w-4 h-4 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary group-hover:text-brand-accent transition-colors">
                      Contact Requests
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Client inquiries &amp; outreach
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/admin/users"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-brand-accent/40 hover:bg-border-subtle/30 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-accent flex items-center justify-center">
                    <Users className="w-4 h-4 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary group-hover:text-brand-accent transition-colors">
                      Manage Users
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Team access &amp; accounts
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/admin/blogs"
                className="w-full flex items-center justify-between p-3 rounded-xl border border-border-subtle hover:border-brand-accent/40 hover:bg-border-subtle/30 text-left transition-all duration-200 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-primary/10 text-brand-accent flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-brand-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary group-hover:text-brand-accent transition-colors">
                      Blog Publications
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Edit or remove publications
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-brand-accent group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Operational Security & Status */}
          <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-sm space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-brand-accent" />
                Platform Security
              </span>
              <span className="flex items-center gap-1.5 text-xs font-semibold text-brand-accent bg-brand-primary/20 dark:bg-brand-primary px-2 py-0.5 rounded-full font-mono">
                Protected
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle">
                <span>System Status</span>
                <span className="font-semibold text-brand-accent">
                  Operational
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle">
                <span>Access Control</span>
                <span className="font-semibold text-text-primary">
                  Role-Based (Admin &amp; User)
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-border-subtle">
                <span>Data Security</span>
                <span className="font-semibold text-text-primary">
                  Encrypted Session
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span>Cloud Storage</span>
                <span className="font-semibold text-brand-accent">
                  Connected &amp; Secure
                </span>
              </div>
            </div>
          </div>

          {/* Upcoming Features Preview Capsule */}
          <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-sm space-y-3 transition-colors">
            <div className="flex items-center gap-2 text-xs font-bold text-text-primary uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-brand-accent" />
              <span>Upcoming Modules</span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              New brand operations features currently being finalized:
            </p>

            <div className="space-y-2 text-xs pt-1">
              <div className="p-3 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-between">
                <div>
                  <p className="font-bold text-text-primary">Manage Partners</p>
                  <p className="text-[10px] text-gray-400">Talent &amp; agency roster</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary dark:text-brand-accent">
                  In Development
                </span>
              </div>

              <div className="p-3 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-between">
                <div>
                  <p className="font-bold text-text-primary">TikTok Analytics</p>
                  <p className="text-[10px] text-gray-400">Creator performance hub</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-brand-primary/10 text-brand-primary dark:text-brand-accent">
                  In Development
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right-Side Drawer for Blog Post Creation */}
      <BlogDrawer
        isOpen={blogDrawerOpen}
        onClose={() => setBlogDrawerOpen(false)}
        onSuccess={() => {
          loadDashboardData();
        }}
      />
    </div>
  );
}
