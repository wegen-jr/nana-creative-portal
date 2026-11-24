"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Loader2, X } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  warningNote?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "danger" | "warning";
  isLoading?: boolean;
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  warningNote,
  confirmText = "Confirm Action",
  cancelText = "Cancel",
  confirmVariant = "danger",
  isLoading = false,
}: ConfirmationModalProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={() => {
              if (!isLoading) onClose();
            }}
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-md bg-bg-surface text-text-primary rounded-2xl border border-border-subtle shadow-2xl p-6 sm:p-7 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => {
                if (!isLoading) onClose();
              }}
              disabled={isLoading}
              className="absolute top-5 right-5 text-gray-400 hover:text-text-primary transition-colors disabled:opacity-50 cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              {/* Warning Icon Badge */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmVariant === "danger"
                    ? "bg-red-500/10 text-red-500 border border-red-500/20"
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}
              >
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="min-w-0 flex-1 pr-4">
                <h3 className="text-lg font-extrabold text-text-primary tracking-tight">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  {message}
                </p>

                {warningNote && (
                  <div className="mt-3.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-medium leading-relaxed">
                    <span className="font-bold">Caution: </span>
                    {warningNote}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 sm:mt-7 flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2.5 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
              >
                {cancelText}
              </button>

              <button
                type="button"
                onClick={onConfirm}
                disabled={isLoading}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px] ${
                  confirmVariant === "danger"
                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20"
                    : "bg-brand-primary hover:bg-brand-accent hover:text-brand-primary"
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
