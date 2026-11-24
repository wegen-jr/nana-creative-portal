"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Briefcase,
  Layers,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Filter,
  Tag,
} from "lucide-react";
import { ServiceDepartment } from "@/types/api.types";
import serviceDepartmentService from "@/services/serviceDepartmentService";
import { useToast } from "@/contexts/ToastContext";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import ServiceDrawer from "@/components/services/ServiceDrawer";
import TierDrawer from "@/components/tiers/TierDrawer";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function ServicesManagementPage() {
  const toast = useToast();
  const [services, setServices] = useState<ServiceDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Drawers
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<ServiceDepartment | null>(null);

  // Quick Add Tier for a specific service
  const [isTierDrawerOpen, setIsTierDrawerOpen] = useState(false);
  const [selectedServiceIdForTier, setSelectedServiceIdForTier] = useState<string | undefined>(undefined);

  // Deactivate Confirmation state
  const [serviceToDeactivate, setServiceToDeactivate] = useState<ServiceDepartment | null>(null);
  const [isConfirmingDeactivation, setIsConfirmingDeactivation] = useState(false);

  const fetchServices = useCallback(async () => {
    try {
      const data = await serviceDepartmentService.getAllServices(true);
      setServices(data);
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchServices();
  };

  const handleCreateNew = () => {
    setServiceToEdit(null);
    setIsServiceDrawerOpen(true);
  };

  const handleEdit = (service: ServiceDepartment) => {
    setServiceToEdit(service);
    setIsServiceDrawerOpen(true);
  };

  const handleQuickAddTier = (service: ServiceDepartment) => {
    setSelectedServiceIdForTier(service.id);
    setIsTierDrawerOpen(true);
  };

  const handleToggleActive = async (service: ServiceDepartment) => {
    const nextStatus = !service.isActive;
    try {
      await serviceDepartmentService.updateService(service.id, { isActive: nextStatus });
      toast.success(
        `Department "${service.name}" ${nextStatus ? "activated" : "deactivated"}`,
        200
      );
      fetchServices();
    } catch (err: unknown) {
      toast.handleApiError(err);
    }
  };

  const handleConfirmDeactivation = async () => {
    if (!serviceToDeactivate) return;
    setIsConfirmingDeactivation(true);
    try {
      await serviceDepartmentService.deactivateService(serviceToDeactivate.id);
      toast.success(`Service department "${serviceToDeactivate.name}" deactivated`, 200);
      setServiceToDeactivate(null);
      fetchServices();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsConfirmingDeactivation(false);
    }
  };

  // Filter dataset
  const filteredServices = services.filter((s) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && s.isActive) ||
      (statusFilter === "INACTIVE" && !s.isActive);

    return matchesSearch && matchesStatus;
  });

  const totalServices = services.length;
  const activeServices = services.filter((s) => s.isActive).length;
  const totalTiersCount = services.reduce(
    (acc, curr) => acc + (curr.tiers?.length || curr.pricingTiers?.length || 0),
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Departments &amp; Capabilities
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Services Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Configure creative agency service departments, manage capability routing codes, and govern nested deliverable pricing tiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 min-h-[44px]"
            title="Refresh services"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Departments
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={totalServices} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Service offerings</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-brand-accent flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-brand-accent" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Services
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={activeServices} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Accepting assignments</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-brand-accent flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Pricing Tiers
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={totalTiersCount} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Deliverable complexities</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle text-gray-500 flex items-center justify-center">
            <Layers className="w-5 h-5 text-brand-accent" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-4 shadow-sm transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by code or department title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs text-text-primary outline-none bg-bg-app transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
          <Filter className="w-3.5 h-3.5 text-gray-400 ml-2" />
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-bg-surface text-brand-accent shadow-sm"
                : "text-gray-400 hover:text-text-primary"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter("ACTIVE")}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === "ACTIVE"
                ? "bg-bg-surface text-brand-accent shadow-sm"
                : "text-gray-400 hover:text-text-primary"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setStatusFilter("INACTIVE")}
            className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              statusFilter === "INACTIVE"
                ? "bg-bg-surface text-brand-accent shadow-sm"
                : "text-gray-400 hover:text-text-primary"
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      {/* Data Table / Card Grid View */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border-subtle">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-4 px-6">Department Name</th>
                <th className="py-4 px-6">Code Identifier</th>
                <th className="py-4 px-6">Deliverable Tiers</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
                      <span>Loading live service departments...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-sm font-semibold text-text-primary">
                        No service departments found
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchTerm || statusFilter !== "ALL"
                          ? "Try adjusting your search query or filters."
                          : "Define your first service department to start onboarding clients and tasks."}
                      </p>
                      {searchTerm === "" && statusFilter === "ALL" && (
                        <button
                          onClick={handleCreateNew}
                          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-primary font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Service</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => {
                  const tiersList = service.tiers || service.pricingTiers || [];

                  return (
                    <tr
                      key={service.id}
                      className="hover:bg-border-subtle/30 transition-colors group"
                    >
                      {/* Name */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-brand-primary text-brand-accent font-bold text-xs flex items-center justify-center shrink-0">
                            <Briefcase className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-text-primary group-hover:text-brand-accent transition-colors truncate text-sm">
                              {service.name}
                            </p>
                            <p className="text-gray-400 text-[11px] truncate font-mono">
                              ID: {service.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Code Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono font-bold bg-bg-app border border-border-subtle text-text-primary uppercase">
                          <Tag className="w-3 h-3 text-brand-accent" />
                          {service.code}
                        </span>
                      </td>

                      {/* Nested Tiers preview */}
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                          {tiersList.length === 0 ? (
                            <span className="text-[11px] text-gray-400 italic">
                              No tiers defined
                            </span>
                          ) : (
                            tiersList.slice(0, 3).map((t) => (
                              <span
                                key={t.id}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-brand-primary/10 text-brand-primary dark:text-brand-accent truncate max-w-[120px]"
                                title={`${t.name} ($${t.defaultRateUsd})`}
                              >
                                {t.name}
                              </span>
                            ))
                          )}
                          {tiersList.length > 3 && (
                            <span className="text-[10px] font-bold text-gray-400">
                              +{tiersList.length - 3} more
                            </span>
                          )}
                          <button
                            onClick={() => handleQuickAddTier(service)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-brand-accent hover:underline ml-1 cursor-pointer"
                            title="Add tier to this service"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(service)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:scale-105 ${
                            service.isActive
                              ? "bg-brand-primary text-brand-accent shadow-sm"
                              : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {service.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-brand-accent" />
                              <span>ACTIVE</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-gray-400" />
                              <span>INACTIVE</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(service)}
                            className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors cursor-pointer"
                            title="Edit service details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {service.isActive && (
                            <button
                              onClick={() => setServiceToDeactivate(service)}
                              className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                              title="Deactivate service"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden divide-y divide-border-subtle">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-accent mx-auto mb-2" />
              <p className="text-xs">Loading live services...</p>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-3">
              <Briefcase className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-semibold text-text-primary">No departments found</p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Service</span>
              </button>
            </div>
          ) : (
            filteredServices.map((service) => {
              const tiersList = service.tiers || service.pricingTiers || [];

              return (
                <div key={service.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-text-primary text-sm">{service.name}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-bg-app border border-border-subtle text-text-primary">
                        {service.code}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        service.isActive
                          ? "bg-brand-primary text-brand-accent"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                      }`}
                    >
                      {service.isActive ? "ACTIVE" : "INACTIVE"}
                    </button>
                  </div>

                  {/* Tiers preview */}
                  <div className="text-xs text-gray-400">
                    <span className="font-semibold text-text-primary">Tiers ({tiersList.length}): </span>
                    {tiersList.length === 0 ? "None" : tiersList.map((t) => t.name).join(", ")}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
                    <button
                      onClick={() => handleQuickAddTier(service)}
                      className="text-xs font-bold text-brand-accent inline-flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Tier</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-xs font-semibold text-gray-400 hover:text-text-primary p-1.5"
                      >
                        Edit
                      </button>
                      {service.isActive && (
                        <button
                          onClick={() => setServiceToDeactivate(service)}
                          className="text-xs font-semibold text-amber-500 p-1.5"
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Service Drawer */}
      <ServiceDrawer
        isOpen={isServiceDrawerOpen}
        onClose={() => setIsServiceDrawerOpen(false)}
        onSuccess={() => fetchServices()}
        serviceToEdit={serviceToEdit}
      />

      {/* Quick Add Tier Drawer */}
      <TierDrawer
        isOpen={isTierDrawerOpen}
        onClose={() => setIsTierDrawerOpen(false)}
        onSuccess={() => fetchServices()}
        preselectedServiceId={selectedServiceIdForTier}
      />

      {/* Deactivate Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!serviceToDeactivate}
        onClose={() => setServiceToDeactivate(null)}
        onConfirm={handleConfirmDeactivation}
        title="Deactivate Service Department"
        message={`Are you sure you want to deactivate "${serviceToDeactivate?.name}" (${serviceToDeactivate?.code})?`}
        warningNote="Deactivating this department will hide it from new task assignments on the production calendar."
        confirmText="Deactivate Department"
        confirmVariant="warning"
        isLoading={isConfirmingDeactivation}
      />
    </div>
  );
}
