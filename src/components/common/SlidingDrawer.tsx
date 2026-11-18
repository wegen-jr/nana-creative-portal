"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface SlidingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  widthClass?: string;
}

export default function SlidingDrawer({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  widthClass = "w-full sm:max-w-xl lg:w-[42vw] lg:max-w-2xl",
}: SlidingDrawerProps) {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
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
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop: translucent dark blurred overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />

          {/* Sliding Panel from Right - 100% width on mobile, 30-50% on desktop */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className={`relative z-10 w-full ${widthClass} h-full bg-bg-surface text-text-primary shadow-2xl flex flex-col justify-between border-l border-border-subtle transition-colors duration-200`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="h-20 px-6 sm:px-8 border-b border-border-subtle flex items-center justify-between bg-bg-surface shrink-0">
              <div className="min-w-0 pr-4">
                <h2 className="text-lg sm:text-xl font-extrabold text-text-primary tracking-tight truncate">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-normal truncate mt-0.5">
                    {subtitle}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl border border-border-subtle flex items-center justify-center text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-all cursor-pointer focus:outline-none shrink-0"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
