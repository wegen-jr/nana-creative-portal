"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Upload,
  Loader2,
  Eye,
  FileText,
  Sparkles,
  X,
  ImageIcon,
} from "lucide-react";
import SlidingDrawer from "@/components/common/SlidingDrawer";
import { Post } from "@/types/api.types";
import { blogService } from "@/services/blogService";
import { useToast } from "@/contexts/ToastContext";

interface BlogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  postToEdit?: Post | null;
}

export default function BlogDrawer({
  isOpen,
  onClose,
  onSuccess,
  postToEdit,
}: BlogDrawerProps) {
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (postToEdit) {
      setTitle(postToEdit.title);
      setDescription(postToEdit.description);
      setPreviewUrl(postToEdit.signedImageUrl || postToEdit.imageUrl || null);
      setSelectedFile(null);
    } else {
      setTitle("");
      setDescription("");
      setSelectedFile(null);
      setPreviewUrl(null);
    }
    setActiveTab("edit");
    setError(null);
  }, [postToEdit, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError("Please provide both an article headline and content.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      if (selectedFile) {
        formData.append("file", selectedFile);
      }

      if (postToEdit) {
        await blogService.updatePost(postToEdit.id, formData);
        toast.success("Blog post updated successfully", 200);
      } else {
        await blogService.createPost(formData);
        toast.success("Blog post published successfully", 201);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string | string[]; error?: string };
        };
        message?: string;
      };
      const statusCode = axiosErr.response?.status || 400;
      const rawMsg =
        axiosErr.response?.data?.message ||
        axiosErr.response?.data?.error ||
        axiosErr.message ||
        "Failed to save blog post. Please verify all fields.";
      const errorString = Array.isArray(rawMsg) ? rawMsg.join(", ") : String(rawMsg);
      setError(errorString);
      toast.error(errorString, statusCode);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SlidingDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={postToEdit ? "Edit Post" : "Create Post"}
      subtitle="Draft, edit, and publish editorial articles with featured imagery"
      widthClass="w-full sm:max-w-xl md:max-w-2xl lg:max-w-[45vw]"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Title Input */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
            Article Headline <span className="text-brand-accent">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Modern Aesthetics in Digital Luxury Branding"
            className="w-full h-12 px-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-sm font-semibold text-text-primary transition-all bg-bg-app placeholder:text-gray-400"
          />
        </div>

        {/* Cover Image Upload */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
            Cover Image
          </label>

          {previewUrl ? (
            <div className="relative rounded-2xl overflow-hidden border border-border-subtle bg-bg-app h-56 group">
              <Image
                src={previewUrl}
                alt="Post Preview"
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="px-4 py-2 rounded-xl bg-white text-xs font-bold text-[#0B3B24] cursor-pointer hover:bg-brand-accent transition-colors shadow-md">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  className="p-2 rounded-xl bg-white text-red-600 hover:bg-red-50 transition-colors shadow-md cursor-pointer"
                  title="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-44 rounded-2xl border-2 border-dashed border-border-subtle hover:border-brand-accent bg-bg-app hover:bg-border-subtle/30 transition-all cursor-pointer p-6 text-center group">
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 group-hover:bg-brand-accent/20 flex items-center justify-center text-brand-accent mb-3 transition-colors">
                <ImageIcon className="w-5 h-5 text-brand-accent" />
              </div>
              <p className="text-xs font-bold text-text-primary">
                Click or drag &amp; drop cover image
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                PNG, JPG or WebP up to 10MB
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Tab Header: Editor vs Live Preview */}
        <div>
          <div className="flex items-center justify-between border-b border-border-subtle pb-2 mb-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-text-primary">
              Article Content <span className="text-brand-accent">*</span>
            </label>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-app border border-border-subtle">
              <button
                type="button"
                onClick={() => setActiveTab("edit")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "edit"
                    ? "bg-bg-surface text-brand-accent shadow-sm"
                    : "text-gray-400 hover:text-text-primary"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Editor</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === "preview"
                    ? "bg-bg-surface text-brand-accent shadow-sm"
                    : "text-gray-400 hover:text-text-primary"
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-brand-accent" />
                <span>Preview</span>
              </button>
            </div>
          </div>

          {activeTab === "edit" ? (
            <textarea
              required
              rows={9}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write the full post description or article content here..."
              className="w-full p-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-sm text-text-primary leading-relaxed bg-bg-app transition-all placeholder:text-gray-400"
            />
          ) : (
            <div className="min-h-[220px] p-6 rounded-2xl border border-border-subtle bg-bg-app overflow-y-auto max-h-96">
              <div className="space-y-4">
                <h1 className="text-xl font-bold text-text-primary">
                  {title || "Untitled Article"}
                </h1>
                {description ? (
                  description.split("\n\n").map((paragraph, idx) => (
                    <p key={idx} className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                      {paragraph}
                    </p>
                  ))
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    Enter text in the editor to view preview.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Actions */}
        <div className="pt-4 border-t border-border-subtle flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-border-subtle text-xs font-bold text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{postToEdit ? "Update Post" : "Create Post"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlidingDrawer>
  );
}
