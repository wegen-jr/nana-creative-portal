"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Tags,
  DollarSign,
  Briefcase,
  AlertCircle,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
} from "lucide-react";
import { ServiceDepartment, ServiceTier } from "@/types/api.types";
import tierService from "@/services/tierService";
import serviceDepartmentService from "@/services/serviceDepartmentService";
import { useToast } from "@/contexts/ToastContext";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import TierDrawer from "@/components/tiers/TierDrawer";
import ServiceDrawer from "@/components/services/ServiceDrawer";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function TiersManagementPage() {
  const toast = useToast();
  const [tiers, setTiers] = useState<ServiceTier[]>([]);
  const [services, setServices] = useState<ServiceDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Drawer states
  const [isTierDrawerOpen, setIsTierDrawerOpen] = useState(false);
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);

  // Deactivate / Delete Confirmation state
  const [tierToDeactivate, setTierToDeactivate] = useState<ServiceTier | null>(null);
  const [isConfirmingDeactivation, setIsConfirmingDeactivation] = useState(false);

  const fetchTiersAndServices = useCallback(async () => {
    try {
      const [tiersData, servicesData] = await Promise.all([
        tierService.getAllTiers(true),
        serviceDepartmentService.getAllServices(true),
      ]);
      setTiers(tiersData);
      setServices(servicesData);
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTiersAndServices();
  }, [fetchTiersAndServices]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTiersAndServices();
  };

  const handleToggleStatus = async (tier: ServiceTier) => {
    const nextStatus = !tier.isActive;
    try {
      await tierService.toggleTierStatus(tier.id, nextStatus);
      toast.success(
        `Tier "${tier.name}" ${nextStatus ? "activated" : "deactivated"} successfully`,
        200
      );
      fetchTiersAndServices();
    } catch (err: unknown) {
      toast.handleApiError(err);
    }
  };

  const handleConfirmDeactivation = async () => {
    if (!tierToDeactivate) return;
    setIsConfirmingDeactivation(true);
    try {
      await tierService.toggleTierStatus(tierToDeactivate.id, false);
      toast.success(`Tier "${tierToDeactivate.name}" deactivated`, 200);
      setTierToDeactivate(null);
      fetchTiersAndServices();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsConfirmingDeactivation(false);
    }
  };

  // Filtered dataset
  const filteredTiers = tiers.filter((t) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      t.name.toLowerCase().includes(q) ||
      (t.serviceName && t.serviceName.toLowerCase().includes(q)) ||
      (t.serviceCode && t.serviceCode.toLowerCase().includes(q));

    const matchesService =
      serviceFilter === "ALL" || t.serviceId === serviceFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && t.isActive) ||
      (statusFilter === "INACTIVE" && !t.isActive);

    return matchesSearch && matchesService && matchesStatus;
  });

  // Metric stats
  const totalTiers = tiers.length;
  const activeTiers = tiers.filter((t) => t.isActive).length;
  const avgRateUsd =
    totalTiers > 0
      ? tiers.reduce((acc, curr) => acc + (curr.defaultRateUsd || 0), 0) / totalTiers
      : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Deliverables &amp; Compensation
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Pricing Tiers Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Configure deliverable complexity tiers and lock standard creator compensation rates locked on task scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 min-h-[44px]"
            title="Refresh pricing tiers"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsTierDrawerOpen(true)}
            className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Pricing Tier</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Pricing Tiers
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={totalTiers} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Across all departments</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-brand-accent flex items-center justify-center">
            <Tags className="w-5 h-5 text-brand-accent" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Tiers
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={activeTiers} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Available for task creation</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-brand-accent flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Average Rate
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-20 bg-border-subtle animate-pulse rounded" />
              ) : (
                `$${avgRateUsd.toFixed(2)}`
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Standard USD payout</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle text-gray-500 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-brand-accent" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-4 shadow-sm transition-colors">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tiers by name or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs text-text-primary outline-none bg-bg-app transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <Briefcase className="w-3.5 h-3.5 text-gray-400 ml-2" />
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text-primary outline-none py-1 px-2 cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Buttons */}
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
      </div>

      {/* Responsive View: Desktop Table + Mobile Stacked Cards */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
        {/* Desktop Data Table (hidden on mobile) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border-subtle">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-4 px-6">Pricing Tier Name</th>
                <th className="py-4 px-6">Parent Service Department</th>
                <th className="py-4 px-6">Default Rate (USD)</th>
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
                      <span>Loading pricing tiers from live API...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTiers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-gray-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Tags className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-sm font-semibold text-text-primary">
                        No pricing tiers found
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchTerm || serviceFilter !== "ALL" || statusFilter !== "ALL"
                          ? "No tiers match your filter criteria."
                          : "Get started by adding your first deliverable pricing tier."}
                      </p>
                      {searchTerm === "" &&
                        serviceFilter === "ALL" &&
                        statusFilter === "ALL" && (
                          <button
                            onClick={() => setIsTierDrawerOpen(true)}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-primary font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add Pricing Tier</span>
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTiers.map((tier) => (
                  <tr
                    key={tier.id}
                    className="hover:bg-border-subtle/30 transition-colors group"
                  >
                    {/* Tier Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-accent flex items-center justify-center shrink-0">
                          <Tags className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-text-primary group-hover:text-brand-accent transition-colors truncate text-sm">
                            {tier.name}
                          </p>
                          <p className="text-[11px] text-gray-400 font-mono truncate">
                            ID: {tier.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Service Badge */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {tier.serviceName ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-bg-app border border-border-subtle text-text-primary">
                          <Briefcase className="w-3 h-3 text-brand-accent" />
                          <span>{tier.serviceName}</span>
                          {tier.serviceCode && (
                            <span className="text-[10px] text-gray-400 font-mono">
                              ({tier.serviceCode})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unassigned</span>
                      )}
                    </td>

                    {/* Default Rate */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{tier.defaultRateUsd?.toFixed(2) || "0.00"}</span>
                      </div>
                    </td>

                    {/* Status Badge & Toggle */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(tier)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all hover:scale-105 ${
                          tier.isActive
                            ? "bg-brand-primary text-brand-accent shadow-sm"
                            : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                        }`}
                        title="Click to toggle active status"
                      >
                        {tier.isActive ? (
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
                        {tier.isActive && (
                          <button
                            onClick={() => setTierToDeactivate(tier)}
                            className="p-2 rounded-lg text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Deactivate tier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Card View (shown only on small screens) */}
        <div className="sm:hidden divide-y divide-border-subtle">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-accent mx-auto mb-2" />
              <p className="text-xs">Loading live pricing tiers...</p>
            </div>
          ) : filteredTiers.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-3">
              <Tags className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-semibold text-text-primary">No tiers found</p>
              <button
                onClick={() => setIsTierDrawerOpen(true)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tier</span>
              </button>
            </div>
          ) : (
            filteredTiers.map((tier) => (
              <div key={tier.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-accent flex items-center justify-center shrink-0">
                      <Tags className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-text-primary text-sm">{tier.name}</p>
                      <p className="text-[11px] text-gray-400">
                        {tier.serviceName || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                    ${tier.defaultRateUsd?.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
                  <button
                    onClick={() => handleToggleStatus(tier)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
                      tier.isActive
                        ? "bg-brand-primary text-brand-accent"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-500"
                    }`}
                  >
                    {tier.isActive ? "ACTIVE" : "INACTIVE"}
                  </button>

                  {tier.isActive && (
                    <button
                      onClick={() => setTierToDeactivate(tier)}
                      className="text-xs text-amber-500 font-semibold p-2"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Tier Drawer */}
      <TierDrawer
        isOpen={isTierDrawerOpen}
        onClose={() => setIsTierDrawerOpen(false)}
        onSuccess={() => fetchTiersAndServices()}
        onRequestCreateService={() => setIsServiceDrawerOpen(true)}
      />

      {/* Service Drawer shortcut */}
      <ServiceDrawer
        isOpen={isServiceDrawerOpen}
        onClose={() => setIsServiceDrawerOpen(false)}
        onSuccess={() => fetchTiersAndServices()}
        serviceToEdit={null}
      />

      {/* Deactivate Tier Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!tierToDeactivate}
        onClose={() => setTierToDeactivate(null)}
        onConfirm={handleConfirmDeactivation}
        title="Deactivate Pricing Tier"
        message={`Are you sure you want to deactivate "${tierToDeactivate?.name}"? New calendar tasks will no longer be able to select this tier.`}
        warningNote="Active tasks currently scheduled with this tier will retain their locked rate."
        confirmText="Deactivate Tier"
        confirmVariant="warning"
        isLoading={isConfirmingDeactivation}
      />
    </div>
  );
}
