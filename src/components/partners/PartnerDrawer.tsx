"use client";

import { useState, useEffect } from "react";
import { Users2, Mail, Loader2, Sparkles } from "lucide-react";
import SlidingDrawer from "@/components/common/SlidingDrawer";
import {
  CreatePartnerDto,
  Partner,
  PartnerStatus,
  PartnerTier,
} from "@/types/api.types";
import { partnerService } from "@/services/partnerService";
import { useToast } from "@/contexts/ToastContext";

interface PartnerDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partnerToEdit?: Partner | null;
}

export default function PartnerDrawer({
  isOpen,
  onClose,
  onSuccess,
  partnerToEdit,
}: PartnerDrawerProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [tier, setTier] = useState<PartnerTier>("Platinum");
  const [status, setStatus] = useState<PartnerStatus>("Active");
  const [tiktokHandle, setTiktokHandle] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  const [totalViews, setTotalViews] = useState<number>(0);
  const [campaignCount, setCampaignCount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (partnerToEdit) {
      setName(partnerToEdit.name);
      setContactEmail(partnerToEdit.contactEmail);
      setTier(partnerToEdit.tier);
      setStatus(partnerToEdit.status);
      setTiktokHandle(partnerToEdit.tiktokHandle || "");
      setInstagramHandle(partnerToEdit.instagramHandle || "");
      setTotalViews(partnerToEdit.totalViews || 0);
      setCampaignCount(partnerToEdit.campaignCount || 0);
    } else {
      setName("");
      setContactEmail("");
      setTier("Platinum");
      setStatus("Active");
      setTiktokHandle("");
      setInstagramHandle("");
      setTotalViews(0);
      setCampaignCount(0);
    }
    setError(null);
  }, [partnerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !contactEmail.trim()) {
      setError("Please fill in both name and contact email.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: CreatePartnerDto = {
        name,
        contactEmail,
        tier,
        status,
        tiktokHandle: tiktokHandle ? (tiktokHandle.startsWith("@") ? tiktokHandle : `@${tiktokHandle}`) : undefined,
        instagramHandle: instagramHandle ? (instagramHandle.startsWith("@") ? instagramHandle : `@${instagramHandle}`) : undefined,
        totalViews: Number(totalViews) || 0,
        campaignCount: Number(campaignCount) || 0,
      };

      if (partnerToEdit) {
        await partnerService.updatePartner(partnerToEdit.id, payload);
        toast.success("Partner updated successfully", 200);
      } else {
        await partnerService.createPartner(payload);
        toast.success("Partner registered successfully", 201);
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
        "Failed to save partner to API.";
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
      title={partnerToEdit ? "Edit Partner Profile" : "Register Brand Partner"}
      subtitle="Register and manage talent partnerships and brand collaborations"
      widthClass="w-full sm:max-w-xl md:max-w-2xl lg:max-w-[42vw]"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-500">
            {error}
          </div>
        )}

        {/* Partner Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
            Brand or Creator Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Users2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Studio Vanguard"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-sm font-semibold text-text-primary transition-all bg-bg-app"
            />
          </div>
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
            Official Contact Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="partnerships@brand.com"
              className="w-full h-12 pl-11 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none text-sm text-text-primary transition-all bg-bg-app font-mono"
            />
          </div>
        </div>

        {/* Tier & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
              Partnership Tier
            </label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as PartnerTier)}
              className="w-full h-12 px-3 rounded-xl border border-border-subtle focus:border-brand-accent outline-none text-sm font-semibold text-text-primary bg-bg-app cursor-pointer"
            >
              <option value="Platinum">Platinum (Flagship)</option>
              <option value="Gold">Gold (Core)</option>
              <option value="Silver">Silver (Rising)</option>
              <option value="Creator">Creator (Independent)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
              Account Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PartnerStatus)}
              className="w-full h-12 px-3 rounded-xl border border-border-subtle focus:border-brand-accent outline-none text-sm font-semibold text-text-primary bg-bg-app cursor-pointer"
            >
              <option value="Active">Active</option>
              <option value="Pending">Pending Review</option>
              <option value="Review">In Negotiation</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Social Handles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
              TikTok Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                @
              </span>
              <input
                type="text"
                value={tiktokHandle.replace(/^@/, "")}
                onChange={(e) => setTiktokHandle(e.target.value)}
                placeholder="creator_handle"
                className="w-full h-12 pl-9 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent outline-none text-sm text-text-primary bg-bg-app font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-primary mb-2">
              Instagram Handle
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                @
              </span>
              <input
                type="text"
                value={instagramHandle.replace(/^@/, "")}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="studio.official"
                className="w-full h-12 pl-9 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent outline-none text-sm text-text-primary bg-bg-app font-mono"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
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
            className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Partner...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>
                  {partnerToEdit ? "Update Partner" : "Register Partner"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlidingDrawer>
  );
}
