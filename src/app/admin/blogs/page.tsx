"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  BookOpen,
  X,
} from "lucide-react";
import BlogDrawer from "@/components/blogs/BlogDrawer";
import { blogService } from "@/services/blogService";
import { Post } from "@/types/api.types";
import { useToast } from "@/contexts/ToastContext";

export default function BlogEditorPage() {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [postToEdit, setPostToEdit] = useState<Post | null>(null);

  // Preview modal state
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const fetchPosts = useCallback(async () => {
    try {
      const data = await blogService.getAllPosts();
      setPosts(data);
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPosts();
  };

  const handleCreateNew = () => {
    setPostToEdit(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (post: Post) => {
    setPostToEdit(post);
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this blog post? This action cannot be undone.")) {
      try {
        await blogService.deletePost(id);
        toast.success("Blog post deleted successfully", 200);
        fetchPosts();
      } catch (err: unknown) {
        toast.handleApiError(err);
      }
    }
  };

  const filteredPosts = posts.filter((post) => {
    const q = searchTerm.toLowerCase();
    return (
      post.title?.toLowerCase().includes(q) ||
      post.description?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Editorial Content
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Blog Publications
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Create, edit, and curate editorial articles published to the Nana Creative portal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Refresh Publications"
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
            <span>Create Post</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-4 shadow-sm transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs text-text-primary outline-none bg-bg-app transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>Total:</span>
          <span className="font-bold text-text-primary px-2.5 py-1 rounded-lg bg-bg-app border border-border-subtle">
            {posts.length} {posts.length === 1 ? "Post" : "Posts"}
          </span>
        </div>
      </div>

      {/* Responsive Data Table */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border-subtle">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-4 px-6">Post Details</th>
                <th className="py-4 px-6">Published Date</th>
                <th className="py-4 px-6">Cover Image</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
                      <span>Loading publications...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-gray-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <BookOpen className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-sm font-semibold text-text-primary">
                        No articles found
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchTerm
                          ? "Try adjusting your search criteria."
                          : "Get started by creating your first editorial post."}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={handleCreateNew}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-primary font-bold text-xs transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Create Post</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-border-subtle/30 transition-colors group"
                  >
                    {/* Post Details (Thumbnail + Title + Excerpt) */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3.5">
                        <div className="relative w-14 h-12 rounded-xl bg-bg-app overflow-hidden shrink-0 border border-border-subtle">
                          {post.signedImageUrl || post.imageUrl ? (
                            <Image
                              src={post.signedImageUrl || post.imageUrl || ""}
                              alt={post.title}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-[9px]">
                              No Image
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 max-w-md">
                          <h3 className="font-bold text-text-primary group-hover:text-brand-accent transition-colors truncate text-sm">
                            {post.title}
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 font-light">
                            {post.description}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Cover Status */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {post.signedImageUrl || post.imageUrl ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-primary/10 dark:bg-brand-primary/30 text-brand-primary dark:text-brand-accent">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                          Attached
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-bg-app text-gray-400 border border-border-subtle">
                          None
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => setPreviewPost(post)}
                          className="p-2 rounded-lg text-gray-400 hover:text-text-primary hover:bg-border-subtle/50 transition-colors cursor-pointer"
                          title="Preview Post"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors cursor-pointer"
                          title="Edit Post"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete Post"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Blog Creation & Edit Drawer */}
      <BlogDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          fetchPosts();
        }}
        postToEdit={postToEdit}
      />

      {/* Post Preview Modal */}
      {previewPost && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewPost(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-bg-surface rounded-3xl border border-border-subtle shadow-2xl p-6 sm:p-8 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewPost(null)}
              className="absolute right-5 top-5 p-2 rounded-xl text-gray-400 hover:text-text-primary hover:bg-border-subtle/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {previewPost.signedImageUrl || previewPost.imageUrl ? (
              <div className="relative w-full h-64 rounded-2xl overflow-hidden mb-6 border border-border-subtle">
                <Image
                  src={previewPost.signedImageUrl || previewPost.imageUrl || ""}
                  alt={previewPost.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : null}

            <span className="text-[11px] font-semibold text-brand-primary dark:text-brand-accent px-2.5 py-0.5 rounded-md bg-brand-primary/10 dark:bg-brand-primary/30 uppercase">
              Editorial Article
            </span>

            <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary mt-2">
              {previewPost.title}
            </h2>

            <p className="text-xs text-gray-400 mt-1 mb-6">
              Published on{" "}
              {new Date(previewPost.createdAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            <div className="prose-editorial text-sm whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300 border-t border-border-subtle pt-4">
              {previewPost.description}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
