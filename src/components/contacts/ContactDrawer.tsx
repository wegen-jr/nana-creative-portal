"use client";

import React, { useState } from "react";
import {
  Phone,
  Mail,
  Copy,
  Trash2,
  Building2,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Share2,
  Check,
  ExternalLink,
} from "lucide-react";
import SlidingDrawer from "@/components/common/SlidingDrawer";
import { ContactRequest, ContactStatus } from "@/types/api.types";
import { contactService } from "@/services/contactService";
import { useToast } from "@/contexts/ToastContext";

interface ContactDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  contact: ContactRequest | null;
  statusMap?: Record<string, ContactStatus>;
  onStatusChange?: (id: string, status: ContactStatus) => void;
}

export default function ContactDrawer({
  isOpen,
  onClose,
  onSuccess,
  contact,
  statusMap = {},
  onStatusChange,
}: ContactDrawerProps) {
  const toast = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!contact) return null;

  // Extract email if present on contact or inside message text
  const directEmail = contact.email;
  const messageEmailMatch = contact.message?.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  const detectedEmail = directEmail || (messageEmailMatch ? messageEmailMatch[0] : null);

  // Status computation
  const currentStatus: ContactStatus =
    statusMap[contact.id] || contact.status || "pending";

  const initials = contact.name
    ? contact.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CL";

  const formattedDate = contact.createdAt
    ? new Date(contact.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recent";

  const formattedTime = contact.createdAt
    ? new Date(contact.createdAt).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  const handleCopy = async (text: string, label: string, fieldKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      toast.success(`${label} copied to clipboard`, 200);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard", 400);
    }
  };

  const handleCopySummary = async () => {
    const summary = [
      `Client: ${contact.name}`,
      `Company: ${contact.companyName}`,
      `Service Requested: ${contact.service}`,
      `Phone: ${contact.phone}`,
      detectedEmail ? `Email: ${detectedEmail}` : null,
      `Submitted: ${formattedDate} ${formattedTime}`,
      `\nProject Details:\n${contact.message}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(summary);
      setCopiedField("summary");
      toast.success("Inquiry summary copied to clipboard", 200);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Failed to copy summary", 400);
    }
  };

  const handleStatusUpdate = (newStatus: ContactStatus) => {
    if (onStatusChange) {
      onStatusChange(contact.id, newStatus);
    }
    const label =
      newStatus === "resolved"
        ? "Marked as Resolved"
        : newStatus === "contacted"
        ? "Marked as Contacted"
        : "Marked as Pending";
    toast.success(label, 200);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await contactService.deleteContact(contact.id);
      toast.success("Client inquiry removed successfully", 200);
      setShowDeleteConfirm(false);
      onClose();
      onSuccess();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <SlidingDrawer
      isOpen={isOpen}
      onClose={() => {
        setShowDeleteConfirm(false);
        onClose();
      }}
      title="Client Inquiry Details"
      subtitle={`Received on ${formattedDate}${formattedTime ? ` at ${formattedTime}` : ""}`}
      widthClass="w-full sm:max-w-xl lg:w-[42vw] lg:max-w-2xl"
    >
      <div className="space-y-6 pb-6">
        {/* TOP: Client Profile & Status Header Card */}
        <div className="p-5 sm:p-6 rounded-2xl bg-bg-app border border-border-subtle space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-14 h-14 rounded-2xl bg-brand-primary text-brand-accent font-extrabold text-base flex items-center justify-center ring-2 ring-brand-accent/30 shadow-md shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight truncate">
                  {contact.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  <Building2 className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                  <span className="font-semibold text-text-primary truncate">
                    {contact.companyName || "Independent Client"}
                  </span>
                </div>
              </div>
            </div>

            {/* Status Pill */}
            <div className="shrink-0">
              {currentStatus === "resolved" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Resolved
                </span>
              ) : currentStatus === "contacted" ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  Contacted
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Pending
                </span>
              )}
            </div>
          </div>

          {/* Requested Service Pill */}
          <div className="pt-3 border-t border-border-subtle/80 flex items-center justify-between text-xs">
            <span className="text-gray-400 font-medium">Service Requested</span>
            <span className="px-3 py-1 rounded-lg bg-brand-primary text-brand-accent font-bold tracking-wide">
              {contact.service}
            </span>
          </div>
        </div>

        {/* PRIMARY OUTREACH ACTION BUTTONS (CALL & EMAIL) */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Direct Outreach Actions
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Call Client Direct Action */}
            <a
              href={`tel:${contact.phone}`}
              className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-200 group hover:-translate-y-0.5"
            >
              <Phone className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
              <span>Call Client Now</span>
            </a>

            {/* Email Client Direct Action */}
            {detectedEmail ? (
              <a
                href={`mailto:${detectedEmail}?subject=${encodeURIComponent(
                  `Nana Creative - In response to your ${contact.service} inquiry`
                )}`}
                className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-bg-surface hover:bg-border-subtle/40 border border-border-subtle text-text-primary font-bold text-xs tracking-wide shadow-sm hover:shadow-md transition-all duration-200 group hover:-translate-y-0.5"
              >
                <Mail className="w-4 h-4 text-brand-accent group-hover:scale-110 transition-transform" />
                <span>Email Client</span>
              </a>
            ) : (
              <button
                type="button"
                onClick={() =>
                  toast.info(
                    "No email address submitted. Please reach out via phone."
                  )
                }
                className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl bg-bg-surface border border-border-subtle text-gray-400 font-semibold text-xs tracking-wide cursor-not-allowed opacity-75"
              >
                <Mail className="w-4 h-4 text-gray-400" />
                <span>No Email Provided</span>
              </button>
            )}
          </div>
        </div>

        {/* CONTACT INFORMATION CARDS WITH ONE-CLICK COPY */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Contact Information
          </p>

          {/* Phone row with quick copy */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-bg-app border border-border-subtle">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-accent flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Phone Number
                </span>
                <span className="font-mono text-xs font-bold text-text-primary truncate block">
                  {contact.phone}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => handleCopy(contact.phone, "Phone number", "phone")}
                className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors cursor-pointer"
                title="Copy Phone Number"
              >
                {copiedField === "phone" ? (
                  <Check className="w-4 h-4 text-brand-accent" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <a
                href={`tel:${contact.phone}`}
                className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors"
                title="Dial Phone"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Email row with quick copy */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-bg-app border border-border-subtle">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-accent flex items-center justify-center shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Email Address
                </span>
                <span className="font-mono text-xs font-bold text-text-primary truncate block">
                  {detectedEmail || "Not provided in submission"}
                </span>
              </div>
            </div>

            {detectedEmail && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(detectedEmail, "Email address", "email")}
                  className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors cursor-pointer"
                  title="Copy Email Address"
                >
                  {copiedField === "email" ? (
                    <Check className="w-4 h-4 text-brand-accent" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Company details row */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-bg-app border border-border-subtle">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-brand-primary/10 text-brand-accent flex items-center justify-center shrink-0">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                  Organization / Company
                </span>
                <span className="text-xs font-bold text-text-primary truncate block">
                  {contact.companyName}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy(contact.companyName, "Company name", "company")}
              className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors cursor-pointer"
              title="Copy Company Name"
            >
              {copiedField === "company" ? (
                <Check className="w-4 h-4 text-brand-accent" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* FULL INQUIRY MESSAGE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-accent" />
              Project Inquiry &amp; Message
            </p>
            <button
              type="button"
              onClick={() => handleCopy(contact.message, "Client message", "message")}
              className="text-xs font-semibold text-brand-primary dark:text-brand-accent hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedField === "message" ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Message</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-bg-app border border-border-subtle">
            <p className="text-xs sm:text-sm text-text-primary leading-relaxed whitespace-pre-wrap font-normal">
              {contact.message}
            </p>
          </div>
        </div>

        {/* SUBMISSION METADATA & QUICK COPY SUMMARY */}
        <div className="p-4 rounded-xl bg-bg-app border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1 text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand-accent" />
              <span>Received: {formattedDate} {formattedTime}</span>
            </div>
            <div className="text-[11px] text-gray-400 font-mono truncate">
              Reference: {contact.id}
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-lg bg-bg-surface hover:bg-border-subtle/50 border border-border-subtle text-text-primary font-semibold text-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
          >
            {copiedField === "summary" ? (
              <Check className="w-3.5 h-3.5 text-brand-accent" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-brand-accent" />
            )}
            <span>Copy Full Summary</span>
          </button>
        </div>

        {/* WORKFLOW STATUS MANAGEMENT */}
        <div className="space-y-3 pt-2 border-t border-border-subtle">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Update Inquiry Status
          </p>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleStatusUpdate("pending")}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentStatus === "pending"
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/40 shadow-sm"
                  : "bg-bg-app text-gray-400 border-border-subtle hover:text-text-primary"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => handleStatusUpdate("contacted")}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentStatus === "contacted"
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/40 shadow-sm"
                  : "bg-bg-app text-gray-400 border-border-subtle hover:text-text-primary"
              }`}
            >
              Contacted
            </button>
            <button
              type="button"
              onClick={() => handleStatusUpdate("resolved")}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                currentStatus === "resolved"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/40 shadow-sm"
                  : "bg-bg-app text-gray-400 border-border-subtle hover:text-text-primary"
              }`}
            >
              Resolved
            </button>
          </div>
        </div>

        {/* DANGER ZONE: DELETE REQUEST */}
        <div className="pt-4 border-t border-border-subtle">
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Contact Request</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-600 dark:text-red-400">
                    Confirm Permanent Deletion
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Are you sure you want to delete this contact inquiry from{" "}
                    <strong className="text-text-primary">{contact.name}</strong>?
                    This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold text-text-primary hover:bg-bg-app transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Inquiry"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </SlidingDrawer>
  );
}
