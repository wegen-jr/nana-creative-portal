"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  statusCode?: number;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType, statusCode?: number) => void;
  success: (message: string, statusCode?: number) => void;
  error: (message: string, statusCode?: number) => void;
  info: (message: string) => void;
  handleApiError: (err: unknown) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info", statusCode?: number) => {
      const id = "toast-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
      const newToast: ToastItem = { id, type, message, statusCode };
      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        removeToast(id);
      }, 4500);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, statusCode: number = 200) => {
      showToast(message, "success", statusCode);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, statusCode: number = 400) => {
      showToast(message, "error", statusCode);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string) => {
      showToast(message, "info");
    },
    [showToast]
  );

  const handleApiError = useCallback(
    (err: unknown) => {
      const axiosErr = err as {
        response?: {
          status?: number;
          data?: { message?: string | string[]; error?: string };
        };
        message?: string;
      };

      const statusCode = axiosErr.response?.status;
      const rawMsg = axiosErr.response?.data?.message || axiosErr.response?.data?.error || axiosErr.message;
      const message = Array.isArray(rawMsg)
        ? rawMsg.join(", ")
        : rawMsg || "An unexpected error occurred.";

      showToast(message, "error", statusCode);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, handleApiError }}>
      {children}

      {/* Floating Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all ${
                toast.type === "success"
                  ? "bg-white/95 dark:bg-[#1B263B]/95 border-[#8CC63F]/50 text-[#1B263B] dark:text-[#F7F9F8]"
                  : toast.type === "error"
                  ? "bg-white/95 dark:bg-[#1B263B]/95 border-red-500/50 text-[#1B263B] dark:text-[#F7F9F8]"
                  : "bg-white/95 dark:bg-[#1B263B]/95 border-[#0B3B24]/30 dark:border-white/20 text-[#1B263B] dark:text-[#F7F9F8]"
              }`}
            >
              {/* Icon */}
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && (
                  <CheckCircle2 className="w-5 h-5 text-[#8CC63F]" />
                )}
                {toast.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {toast.type === "info" && (
                  <Info className="w-5 h-5 text-[#8CC63F]" />
                )}
              </div>

              {/* Message & Status Code Pill */}
              <div className="flex-1 min-w-0 pr-1">
                {toast.statusCode && (
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                        toast.type === "success"
                          ? "bg-[#0B3B24] text-[#8CC63F]"
                          : "bg-red-500/20 text-red-500 dark:text-red-400"
                      }`}
                    >
                      Status {toast.statusCode}
                    </span>
                  </div>
                )}
                <p className="text-xs font-semibold leading-relaxed break-words">
                  {toast.message}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
