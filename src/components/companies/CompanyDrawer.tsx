"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Loader2,
  Building2,
  User,
  Phone,
  Calendar,
  UploadCloud,
  X,
  FileText,
  AlertCircle,
  Plus,
  CheckCircle2,
  Briefcase,
  Layers,
} from "lucide-react";
import SlidingDrawer from "@/components/common/SlidingDrawer";
import { Company, ServiceDepartment, ServiceTier } from "@/types/api.types";
import companyService from "@/services/companyService";
import serviceDepartmentService from "@/services/serviceDepartmentService";
import { useToast } from "@/contexts/ToastContext";

interface CompanyDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  companyToEdit: Company | null;
  onRequestCreateService?: () => void;
  onRequestCreateTier?: () => void;
}

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export default function CompanyDrawer({
  isOpen,
  onClose,
  onSuccess,
  companyToEdit,
  onRequestCreateService,
  onRequestCreateTier,
}: CompanyDrawerProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [companyName, setCompanyName] = useState("");
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");

  // Relational selector states (dynamically loaded from live backend)
  const [services, setServices] = useState<ServiceDepartment[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedTierId, setSelectedTierId] = useState("");
  const [loadingRelationalData, setLoadingRelationalData] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [existingDocUrl, setExistingDocUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Submission & Validation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (companyToEdit) {
        setCompanyName(companyToEdit.companyName || "");
        setManagerName(companyToEdit.managerName || "");
        setManagerPhone(companyToEdit.managerPhone || "");
        setRegistrationDate(
          companyToEdit.date
            ? new Date(companyToEdit.date).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0]
        );
        setExistingDocUrl(companyToEdit.documentUrl || null);
        setSelectedServiceId(companyToEdit.serviceId || "");
        setSelectedTierId(companyToEdit.tierId || "");
      } else {
        setCompanyName("");
        setManagerName("");
        setManagerPhone("");
        setRegistrationDate(new Date().toISOString().split("T")[0]);
        setExistingDocUrl(null);
        setSelectedServiceId("");
        setSelectedTierId("");
      }

      setSelectedFile(null);
      setPreviewUrl(null);
      setFieldErrors({});

      // Load live services and nested tiers
      const loadRelationalServices = async () => {
        setLoadingRelationalData(true);
        try {
          const liveServices = await serviceDepartmentService.getAllServices(true);
          setServices(liveServices);
        } catch {
          // Handled gracefully without breaking UI
        } finally {
          setLoadingRelationalData(false);
        }
      };

      loadRelationalServices();
    }
  }, [companyToEdit, isOpen]);

  // Clean up blob object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Derive available tiers based on selected service
  const availableTiers: ServiceTier[] = (() => {
    if (!selectedServiceId) {
      // Return all tiers from all services if no service filtered
      return services.flatMap((s) => s.tiers || s.pricingTiers || []);
    }
    const found = services.find((s) => s.id === selectedServiceId);
    return found ? found.tiers || found.pricingTiers || [] : [];
  })();

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast.error(
        "Invalid file format. Please upload PNG, JPG, WEBP, SVG, or PDF.",
        400
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("File exceeds safe 5MB limit. Please select a smaller file.", 400);
      return;
    }

    setSelectedFile(file);
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null); // PDF or doc
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExistingDocUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    const trimmedName = companyName.trim();
    const trimmedManager = managerName.trim();
    const trimmedPhone = managerPhone.trim();

    if (!trimmedName) {
      errors.companyName = "Registered company name is required.";
    } else if (trimmedName.length < 2) {
      errors.companyName = "Company name must be at least 2 characters.";
    }

    if (!trimmedManager) {
      errors.managerName = "Manager name is required.";
    } else if (trimmedManager.length < 2) {
      errors.managerName = "Manager name must be at least 2 characters.";
    }

    if (!trimmedPhone) {
      errors.managerPhone = "Contact phone number is required.";
    } else if (trimmedPhone.length < 7) {
      errors.managerPhone = "Please provide a valid phone number.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("companyName", companyName.trim());
      formData.append("managerName", managerName.trim());
      formData.append("managerPhone", managerPhone.trim());
      if (registrationDate) {
        formData.append("date", new Date(registrationDate).toISOString());
      }
      if (selectedFile) {
        formData.append("document", selectedFile);
      }

      if (companyToEdit) {
        await companyService.updateCompany(companyToEdit.id, formData);
        toast.success(`Company "${companyName.trim()}" updated successfully`, 200);
      } else {
        await companyService.createCompany(formData);
        toast.success(`Company "${companyName.trim()}" registered successfully`, 201);
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
      title={companyToEdit ? "Edit Company Directory Record" : "Register New Company"}
      subtitle={
        companyToEdit
          ? "Update organization details, management contacts, and registered document."
          : "Register a brand client and associate service departments and deliverable tiers."
      }
      widthClass="w-full sm:max-w-xl lg:w-[48vw] lg:max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Company / Organization Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={companyName}
              onChange={(e) => {
                setCompanyName(e.target.value);
                if (fieldErrors.companyName) setFieldErrors((p) => ({ ...p, companyName: "" }));
              }}
              placeholder="e.g. Nana Creatives, Safaricom Ethiopia"
              className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs font-semibold outline-none bg-bg-app transition-all placeholder:text-gray-400 ${
                fieldErrors.companyName
                  ? "border-red-500 focus:ring-1 focus:ring-red-500"
                  : "border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
              }`}
            />
          </div>
          {fieldErrors.companyName ? (
            <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.companyName}</p>
          ) : (
            <p className="text-[11px] text-gray-400 mt-1.5">Official registered entity name.</p>
          )}
        </div>

        {/* Manager Name & Phone Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Manager Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={managerName}
                onChange={(e) => {
                  setManagerName(e.target.value);
                  if (fieldErrors.managerName) setFieldErrors((p) => ({ ...p, managerName: "" }));
                }}
                placeholder="e.g. Nahom Ketema"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs font-semibold outline-none bg-bg-app transition-all placeholder:text-gray-400 ${
                  fieldErrors.managerName
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
                }`}
              />
            </div>
            {fieldErrors.managerName && (
              <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.managerName}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
              Manager Phone <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="tel"
                value={managerPhone}
                onChange={(e) => {
                  setManagerPhone(e.target.value);
                  if (fieldErrors.managerPhone) setFieldErrors((p) => ({ ...p, managerPhone: "" }));
                }}
                placeholder="e.g. +251911223344"
                className={`w-full h-11 pl-10 pr-4 rounded-xl border text-xs font-semibold outline-none bg-bg-app transition-all placeholder:text-gray-400 ${
                  fieldErrors.managerPhone
                    ? "border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
                }`}
              />
            </div>
            {fieldErrors.managerPhone && (
              <p className="text-[11px] text-red-500 mt-1.5 font-medium">{fieldErrors.managerPhone}</p>
            )}
          </div>
        </div>

        {/* Registration Date */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Registration Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={registrationDate}
              onChange={(e) => setRegistrationDate(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs font-semibold outline-none bg-bg-app transition-all"
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Defaults to current date if omitted.
          </p>
        </div>

        {/* Dynamic Relational Department & Tier Association Section */}
        <div className="p-4 rounded-2xl bg-bg-app border border-border-subtle space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-accent" />
              <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Service &amp; Tier Assignment
              </span>
            </div>
            {loadingRelationalData && (
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-accent" />
                <span>Loading live services...</span>
              </div>
            )}
          </div>

          {!loadingRelationalData && services.length === 0 ? (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed">
                  No services or pricing tiers currently exist in the database.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {onRequestCreateService && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestCreateService();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-primary text-[11px] font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Service</span>
                  </button>
                )}
                {onRequestCreateTier && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestCreateTier();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border-subtle bg-bg-surface text-text-primary text-[11px] font-bold hover:bg-border-subtle/50 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Create Tier</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Service Department Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Assigned Department
                </label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedServiceId}
                    onChange={(e) => {
                      setSelectedServiceId(e.target.value);
                      setSelectedTierId(""); // Reset tier when service changes
                    }}
                    className="w-full h-10 pl-9 pr-6 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs font-semibold outline-none bg-bg-surface transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All / Unassigned Department</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Tier Selector */}
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                  Deliverable Tier
                </label>
                <div className="relative">
                  <select
                    value={selectedTierId}
                    onChange={(e) => setSelectedTierId(e.target.value)}
                    disabled={availableTiers.length === 0}
                    className="w-full h-10 px-3 pr-6 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs font-semibold outline-none bg-bg-surface transition-all appearance-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="">
                      {availableTiers.length === 0
                        ? "No tiers for selected service"
                        : "Select deliverable tier..."}
                    </option>
                    {availableTiers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (${t.defaultRateUsd?.toFixed(2) || "0.00"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Company Logo / Registration Document Upload */}
        <div>
          <label className="block text-xs font-bold text-text-primary uppercase tracking-wider mb-2">
            Company Logo / Registration Document
          </label>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
            className="hidden"
          />

          {/* Active preview (new file or existing doc) */}
          {previewUrl || existingDocUrl ? (
            <div className="relative p-4 rounded-2xl bg-bg-app border border-border-subtle flex items-center gap-4">
              {previewUrl ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-border-subtle bg-bg-surface shrink-0 relative flex items-center justify-center">
                  <Image
                    src={previewUrl}
                    alt="Upload Preview"
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </div>
              ) : existingDocUrl && (existingDocUrl.endsWith(".png") || existingDocUrl.endsWith(".jpg") || existingDocUrl.endsWith(".jpeg") || existingDocUrl.endsWith(".webp") || existingDocUrl.endsWith(".svg")) ? (
                <div className="w-16 h-16 rounded-xl overflow-hidden border border-border-subtle bg-bg-surface shrink-0 relative flex items-center justify-center">
                  <Image
                    src={existingDocUrl}
                    alt="Company Document"
                    fill
                    sizes="64px"
                    className="object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-brand-accent flex items-center justify-center shrink-0">
                  <FileText className="w-8 h-8" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text-primary truncate">
                  {selectedFile ? selectedFile.name : "Registered Document"}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  {selectedFile
                    ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                    : "File stored in cloud storage"}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] font-bold text-brand-primary dark:text-brand-accent hover:underline cursor-pointer"
                  >
                    Replace Document
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-[11px] font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-500 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Drag and Drop Box */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
                isDragOver
                  ? "border-brand-accent bg-brand-accent/5"
                  : "border-border-subtle hover:border-brand-accent/50 bg-bg-app hover:bg-border-subtle/20"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-accent flex items-center justify-center mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-text-primary">
                Click to browse or drag &amp; drop document
              </p>
              <p className="text-[11px] text-gray-400 mt-1">
                Supported formats: PNG, JPG, WEBP, SVG, PDF (Max 5MB)
              </p>
            </div>
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
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Company...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>{companyToEdit ? "Save Changes" : "Register Company"}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </SlidingDrawer>
  );
}
