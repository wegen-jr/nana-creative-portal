"use client";

import { useState, useEffect } from "react";
import { Loader2, DollarSign, Tag, Briefcase, Plus, AlertCircle, CheckCircle2 } from "lucide-react";
import SlidingDrawer from "@/components/common/SlidingDrawer";
import { ServiceDepartment } from "@/types/api.types";
import serviceDepartmentService from "@/services/serviceDepartmentService";
import tierService from "@/services/tierService";
import { useToast } from "@/contexts/ToastContext";

interface TierDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedServiceId?: string;
  onRequestCreateService?: () => void;
}

export default function TierDrawer({
  isOpen,
  onClose,
  onSuccess,
  preselectedServiceId,
  onRequestCreateService,
}: TierDrawerProps) {
  const toast = useToast();
  const [services, setServices] = useState<ServiceDepartment[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [serviceId, setServiceId] = useState("");
  const [name, setName] = useState("");
  const [defaultRateUsd, setDefaultRateUsd] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setName("");
      setDefaultRateUsd("");
      setServiceId(preselectedServiceId || "");
      setFieldErrors({});

      const fetchServices = async () => {
        setLoadingServices(true);
        try {
          const list = await serviceDepartmentService.getAllServices(true);
          setServices(list);
          if (!preselectedServiceId && list.length > 0) {
            setServiceId(list[0].id);
          }
        } catch (err: unknown) {
          toast.handleApiError(err);
        } finally {
          setLoadingServices(false);
        }
      };

      fetchServices();
    }
  }, [isOpen, preselectedServiceId, toast]);

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!serviceId) {
      errors.serviceId = "Please select a parent service department.";
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = "Tier name is required.";
    } else if (trimmedName.length < 2) {
      errors.name = "Tier name must be at least 2 characters.";
    }

    const rateNum = parseFloat(defaultRateUsd);
    if (!defaultRateUsd || isNaN(rateNum) || rateNum <= 0) {
      errors.defaultRateUsd = "Please provide a valid default rate in USD (> 0).";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await tierService.createTier(serviceId, {
        name: name.trim(),
        defaultRateUsd: parseFloat(defaultRateUsd),
      });
      toast.success(`Pricing tier "${name.trim()}" added successfully`, 201);
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
      title="Add Pricing Tier"
      subtitle="Bind a complexity deliverable tier and lock in its baseline payout rate."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* If no services exist */}
        {!loadingServices && services.length === 0 ? (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold">No Service Departments Found</p>
                <p className="text-[11px] mt-0.5 leading-relaxed">
                  Tiers must belong to a parent service department. You need to create a service first before defining pricing tiers.
                </p>
              </div>
            </div>
            {onRequestCreateService && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRequestCreateService();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-primary text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Service Now</span>
              </button>
            )}
          </div>
        ) : (
          /* Parent Service Selector */
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Parent Service Department <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={serviceId}
                onChange={(e) => {
                  setServiceId(e.target.value);
                  if (fieldErrors.serviceId) setFieldErrors((prev) => ({ ...prev, serviceId: "" }));
                }}
                disabled={loadingServices}
                className={`w-full h-11 pl-10 pr-8 rounded-xl border text-xs font-semibold outline-none bg-bg-app transition-all appearance-none cursor-pointer ${
                  fieldErrors.serviceId
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
                }`}
              >
                {loadingServices ? (
                  <option value="">Loading live services...</option>
                ) : (
                  <>
                    <option value="" disabled>
                      Select department...
                    </option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code}) {!s.isActive ? "— [Inactive]" : ""}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            {fieldErrors.serviceId ? (
              <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.serviceId}</p>
            ) : (
              <p className="text-[11px] text-gray-400 mt-1.5">
                The service department that offers this deliverable tier.
              </p>
            )}
          </div>
        )}

        {/* Tier Name */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Tier Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: "" }));
              }}
              placeholder="e.g. Standard Reel, Hook Reel, 4K Master"
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
              Deliverable complexity title (e.g. Standard Reel, Motion Graphics).
            </p>
          )}
        </div>

        {/* Default Rate (USD) */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Default Payout Rate (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              step="0.01"
              min="0"
              value={defaultRateUsd}
              onChange={(e) => {
                setDefaultRateUsd(e.target.value);
                if (fieldErrors.defaultRateUsd) setFieldErrors((prev) => ({ ...prev, defaultRateUsd: "" }));
              }}
              placeholder="e.g. 15.00"
              className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs font-mono font-bold outline-none bg-bg-app transition-all placeholder:font-sans placeholder:font-normal placeholder:text-gray-400 ${
                fieldErrors.defaultRateUsd
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
              }`}
            />
          </div>
          {fieldErrors.defaultRateUsd ? (
            <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.defaultRateUsd}</p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1.5">
              Baseline creator/editor payout rate in USD locked onto tasks at creation.
            </p>
          )}
        </div>

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
            disabled={isSubmitting || services.length === 0}
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
                <span>Add Pricing Tier</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlidingDrawer>
  );
}
