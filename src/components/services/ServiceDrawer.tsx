"use client";

import { useState, useEffect } from "react";
import { Loader2, Briefcase, Tag, CheckCircle2 } from "lucide-react";
import SlidingDrawer from "@/components/common/SlidingDrawer";
import { ServiceDepartment } from "@/types/api.types";
import serviceDepartmentService from "@/services/serviceDepartmentService";
import { useToast } from "@/contexts/ToastContext";

interface ServiceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  serviceToEdit: ServiceDepartment | null;
}

export default function ServiceDrawer({
  isOpen,
  onClose,
  onSuccess,
  serviceToEdit,
}: ServiceDrawerProps) {
  const toast = useToast();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (serviceToEdit) {
      setCode(serviceToEdit.code || "");
      setName(serviceToEdit.name || "");
      setIsActive(serviceToEdit.isActive ?? true);
    } else {
      setCode("");
      setName("");
      setIsActive(true);
    }
    setFieldErrors({});
  }, [serviceToEdit, isOpen]);

  const validate = () => {
    const errors: Record<string, string> = {};
    const trimmedCode = code.trim();
    const trimmedName = name.trim();

    if (!trimmedCode) {
      errors.code = "Service code is required.";
    } else if (!/^[A-Z0-9_]+$/.test(trimmedCode)) {
      errors.code = "Code must contain only uppercase letters, numbers, and underscores.";
    } else if (trimmedCode.length < 2) {
      errors.code = "Code must be at least 2 characters.";
    }

    if (!trimmedName) {
      errors.name = "Service display name is required.";
    } else if (trimmedName.length < 2) {
      errors.name = "Name must be at least 2 characters.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (serviceToEdit) {
        await serviceDepartmentService.updateService(serviceToEdit.id, {
          code: code.trim().toUpperCase(),
          name: name.trim(),
          isActive,
        });
        toast.success(`Service "${name.trim()}" updated successfully`, 200);
      } else {
        await serviceDepartmentService.createService({
          code: code.trim().toUpperCase(),
          name: name.trim(),
        });
        toast.success(`Service department "${name.trim()}" created`, 201);
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SlidingDrawer
      isOpen={isOpen}
      onClose={onClose}
      title={serviceToEdit ? "Edit Service Department" : "Create Service Department"}
      subtitle={
        serviceToEdit
          ? "Update department parameters and assignment availability."
          : "Register a new service department for client task workflows."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service Code Field */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Service Code <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/\s+/g, "_"));
                if (fieldErrors.code) setFieldErrors((prev) => ({ ...prev, code: "" }));
              }}
              placeholder="e.g. VIDEO_EDITING"
              className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs font-mono font-semibold uppercase tracking-wider outline-none bg-bg-app transition-all placeholder:font-sans placeholder:normal-case placeholder:text-gray-400 ${
                fieldErrors.code
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
              }`}
            />
          </div>
          {fieldErrors.code ? (
            <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.code}</p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1.5">
              Unique uppercase machine identifier for routing and task creation.
            </p>
          )}
        </div>

        {/* Service Display Name Field */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Service Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="e.g. Video Editing"
              className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs font-semibold outline-none bg-bg-app transition-all placeholder:text-gray-400 ${
                fieldErrors.name
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
              }`}
            />
          </div>
          {fieldErrors.name ? (
            <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.name}</p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1.5">
              Customer and staff facing department title in English.
            </p>
          )}
        </div>

        {/* Status Toggle (For Edit Mode) */}
        {serviceToEdit && (
          <div className="p-4 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-text-primary">Department Status</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Active services can be selected when assigning new calendar tasks.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isActive ? "bg-brand-primary" : "bg-gray-300 dark:bg-gray-700"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  isActive ? "translate-x-5 bg-brand-accent" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-6 border-t border-border-subtle flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{serviceToEdit ? "Save Changes" : "Create Service"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlidingDrawer>
  );
}
