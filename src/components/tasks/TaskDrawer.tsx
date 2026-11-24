"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Calendar,
  Clock,
  Building2,
  Briefcase,
  Tags,
  User,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle2,
  FileText,
  AlertCircle,
  Plus,
} from "lucide-react";
import SlidingDrawer from "@/components/common/SlidingDrawer";
import {
  Company,
  CreateTaskDto,
  ServiceDepartment,
  ServiceTier,
  UserResponseDto,
} from "@/types/api.types";
import companyService from "@/services/companyService";
import serviceDepartmentService from "@/services/serviceDepartmentService";
import userService from "@/services/userService";
import taskService from "@/services/taskService";
import { useToast } from "@/contexts/ToastContext";

interface TaskDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onRequestCreateCompany?: () => void;
  onRequestCreateService?: () => void;
}

export default function TaskDrawer({
  isOpen,
  onClose,
  onSuccess,
  onRequestCreateCompany,
  onRequestCreateService,
}: TaskDrawerProps) {
  const toast = useToast();

  // Relational options loaded dynamically from live API
  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<ServiceDepartment[]>([]);
  const [users, setUsers] = useState<UserResponseDto[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [tierId, setTierId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [postingDate, setPostingDate] = useState("");
  const [postingTime, setPostingTime] = useState("14:00");
  const [rawAssetsUrl, setRawAssetsUrl] = useState("");
  const [brief, setBrief] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  // Submission & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setCompanyId("");
      setServiceId("");
      setTierId("");
      setAssignedToId("");
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setPostingDate(tomorrow.toISOString().split("T")[0]);
      setPostingTime("14:00");
      setRawAssetsUrl("");
      setBrief("");
      setIsUrgent(false);
      setFieldErrors({});

      const loadLookups = async () => {
        setLoadingLookups(true);
        try {
          const [comps, servs, staff] = await Promise.all([
            companyService.getAllCompanies(),
            serviceDepartmentService.getAllServices(true),
            userService.getAllUsers().catch(() => []),
          ]);
          setCompanies(comps);
          setServices(servs);
          setUsers(staff);

          if (comps.length > 0) setCompanyId(comps[0].id);
          if (servs.length > 0) {
            setServiceId(servs[0].id);
            const firstTiers = servs[0].tiers || servs[0].pricingTiers || [];
            if (firstTiers.length > 0) setTierId(firstTiers[0].id);
          }
          if (staff.length > 0) setAssignedToId(staff[0].id);
        } catch (err: unknown) {
          toast.handleApiError(err);
        } finally {
          setLoadingLookups(false);
        }
      };

      loadLookups();
    }
  }, [isOpen, toast]);

  // Derived tiers list based on selected service
  const availableTiers: ServiceTier[] = (() => {
    if (!serviceId) return [];
    const found = services.find((s) => s.id === serviceId);
    return found ? found.tiers || found.pricingTiers || [] : [];
  })();

  const handleServiceChange = (newServiceId: string) => {
    setServiceId(newServiceId);
    const found = services.find((s) => s.id === newServiceId);
    const tiers = found ? found.tiers || found.pricingTiers || [] : [];
    if (tiers.length > 0) {
      setTierId(tiers[0].id);
    } else {
      setTierId("");
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!title.trim()) errors.title = "Task title is required.";
    if (!companyId) errors.companyId = "Please select a client company.";
    if (!serviceId) errors.serviceId = "Please select a service department.";
    if (!tierId) errors.tierId = "Please select a deliverable pricing tier.";
    if (!assignedToId) errors.assignedToId = "Please assign a staff member.";
    if (!postingDate) errors.postingDate = "Posting date is required.";
    if (!postingTime) errors.postingTime = "Posting time is required.";

    if (rawAssetsUrl.trim()) {
      try {
        new URL(rawAssetsUrl.trim());
      } catch {
        errors.rawAssetsUrl = "Please provide a valid URL (e.g. Google Drive link).";
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload: CreateTaskDto = {
        title: title.trim(),
        companyId,
        serviceId,
        tierId,
        assignedToId,
        postingDate,
        postingTime,
        rawAssetsUrl: rawAssetsUrl.trim() || undefined,
        brief: brief.trim() || undefined,
        isUrgent,
      };

      await taskService.createTask(payload);
      toast.success(`Task "${title.trim()}" scheduled and rate locked`, 201);
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
      title="Schedule &amp; Assign Task"
      subtitle="Create an operational deliverable, assign staff, and lock compensation rates onto the production calendar."
      widthClass="w-full sm:max-w-xl lg:w-[48vw] lg:max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Loading state indicator */}
        {loadingLookups && (
          <div className="p-3.5 rounded-xl bg-bg-app border border-border-subtle flex items-center gap-2.5 text-xs text-gray-400">
            <Loader2 className="w-4 h-4 animate-spin text-brand-accent" />
            <span>Loading live companies, services, and staff...</span>
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Task Title <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((p) => ({ ...p, title: "" }));
              }}
              placeholder="e.g. Vitamin C Serum Hook Reel, Brand Reveal Motion Graphics"
              className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs font-semibold outline-none bg-bg-app transition-all placeholder:text-gray-400 ${
                fieldErrors.title
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
              }`}
            />
          </div>
          {fieldErrors.title && (
            <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.title}</p>
          )}
        </div>

        {/* Client Company & Assignee Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Client Company */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Client Company <span className="text-red-500">*</span>
              </label>
              {companies.length === 0 && onRequestCreateCompany && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onRequestCreateCompany();
                  }}
                  className="text-[10px] text-brand-accent font-bold hover:underline"
                >
                  + Add Company
                </button>
              )}
            </div>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={companyId}
                onChange={(e) => {
                  setCompanyId(e.target.value);
                  if (fieldErrors.companyId) setFieldErrors((p) => ({ ...p, companyId: "" }));
                }}
                disabled={companies.length === 0}
                className="w-full h-11 pl-10 pr-8 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs font-semibold outline-none bg-bg-app transition-all appearance-none cursor-pointer"
              >
                {companies.length === 0 ? (
                  <option value="">No companies found</option>
                ) : (
                  companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName}
                    </option>
                  ))
                )}
              </select>
            </div>
            {fieldErrors.companyId && (
              <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.companyId}</p>
            )}
          </div>

          {/* Assigned Staff Member */}
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Assigned Staff Member <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={assignedToId}
                onChange={(e) => {
                  setAssignedToId(e.target.value);
                  if (fieldErrors.assignedToId)
                    setFieldErrors((p) => ({ ...p, assignedToId: "" }));
                }}
                disabled={users.length === 0}
                className="w-full h-11 pl-10 pr-8 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs font-semibold outline-none bg-bg-app transition-all appearance-none cursor-pointer"
              >
                {users.length === 0 ? (
                  <option value="">No team members found</option>
                ) : (
                  users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.role?.toUpperCase()})
                    </option>
                  ))
                )}
              </select>
            </div>
            {fieldErrors.assignedToId && (
              <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.assignedToId}</p>
            )}
          </div>
        </div>

        {/* Service Department & Deliverable Pricing Tier */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-bg-app border border-border-subtle">
          {/* Service Department */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Service Department <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={serviceId}
                onChange={(e) => handleServiceChange(e.target.value)}
                disabled={services.length === 0}
                className="w-full h-10 pl-10 pr-8 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs font-semibold outline-none bg-bg-surface transition-all appearance-none cursor-pointer"
              >
                {services.length === 0 ? (
                  <option value="">No services found</option>
                ) : (
                  services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>

          {/* Pricing Tier */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Deliverable Pricing Tier <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Tags className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={tierId}
                onChange={(e) => {
                  setTierId(e.target.value);
                  if (fieldErrors.tierId) setFieldErrors((p) => ({ ...p, tierId: "" }));
                }}
                disabled={availableTiers.length === 0}
                className="w-full h-10 pl-10 pr-8 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs font-semibold outline-none bg-bg-surface transition-all appearance-none cursor-pointer"
              >
                {availableTiers.length === 0 ? (
                  <option value="">No tiers for this service</option>
                ) : (
                  availableTiers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — ${t.defaultRateUsd?.toFixed(2)} USD
                    </option>
                  ))
                )}
              </select>
            </div>
            {fieldErrors.tierId && (
              <p className="text-[11px] text-red-500 mt-1 font-medium">{fieldErrors.tierId}</p>
            )}
          </div>
        </div>

        {/* Posting Date & Time Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Posting Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={postingDate}
                onChange={(e) => {
                  setPostingDate(e.target.value);
                  if (fieldErrors.postingDate) setFieldErrors((p) => ({ ...p, postingDate: "" }));
                }}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs font-semibold outline-none bg-bg-app transition-all"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1">
              Staff deadline is auto-calculated as 1 day prior.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Posting Time (24-hr) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="time"
                value={postingTime}
                onChange={(e) => setPostingTime(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs font-semibold outline-none bg-bg-app transition-all"
              />
            </div>
          </div>
        </div>

        {/* Raw Assets URL */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Raw Assets / Footage Cloud URL
          </label>
          <div className="relative">
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="url"
              value={rawAssetsUrl}
              onChange={(e) => {
                setRawAssetsUrl(e.target.value);
                if (fieldErrors.rawAssetsUrl) setFieldErrors((p) => ({ ...p, rawAssetsUrl: "" }));
              }}
              placeholder="https://drive.google.com/drive/folders/raw-footage"
              className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs font-mono font-medium outline-none bg-bg-app transition-all placeholder:font-sans placeholder:text-gray-400 ${
                fieldErrors.rawAssetsUrl
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
              }`}
            />
          </div>
          {fieldErrors.rawAssetsUrl ? (
            <p className="text-[11px] text-red-500 mt-1 font-medium">{fieldErrors.rawAssetsUrl}</p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1">
              Google Drive, Dropbox, or Frame.io asset folder for the creator.
            </p>
          )}
        </div>

        {/* Brief / Creative Instructions */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Creative Brief &amp; Delivery Instructions
          </label>
          <textarea
            rows={3}
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            placeholder="e.g. Strong 3-second hook with Amharic captions and color grade matched to Brand Guidelines."
            className="w-full p-3.5 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs outline-none bg-bg-app transition-all placeholder:text-gray-400 resize-none"
          />
        </div>

        {/* Urgent Flag Toggle */}
        <div className="p-4 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                isUrgent
                  ? "bg-red-500/10 text-red-500 border border-red-500/20"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-text-primary">Urgent Priority Flag</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Displays high-priority visual indicator on calendar and task feeds.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsUrgent(!isUrgent)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              isUrgent ? "bg-red-500" : "bg-gray-300 dark:bg-gray-700"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isUrgent ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
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
            disabled={isSubmitting || companies.length === 0 || services.length === 0}
            className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scheduling Task...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Schedule Task</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlidingDrawer>
  );
}
