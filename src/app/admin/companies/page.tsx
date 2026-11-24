"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Plus,
  Search,
  RefreshCw,
  Building2,
  Phone,
  User,
  Calendar,
  Layers,
  Tags,
  ExternalLink,
  Edit,
  Trash2,
  FileText,
  Briefcase,
} from "lucide-react";
import { Company, ServiceDepartment, ServiceTier } from "@/types/api.types";
import companyService from "@/services/companyService";
import serviceDepartmentService from "@/services/serviceDepartmentService";
import { useToast } from "@/contexts/ToastContext";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import CompanyDrawer from "@/components/companies/CompanyDrawer";
import ServiceDrawer from "@/components/services/ServiceDrawer";
import TierDrawer from "@/components/tiers/TierDrawer";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function CompaniesManagementPage() {
  const toast = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<ServiceDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState("ALL");

  // Drawer states
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);
  const [isTierDrawerOpen, setIsTierDrawerOpen] = useState(false);

  // Delete confirmation modal state
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCompaniesAndMetadata = useCallback(async () => {
    try {
      const [companiesData, servicesData] = await Promise.all([
        companyService.getAllCompanies(),
        serviceDepartmentService.getAllServices(true),
      ]);
      setCompanies(companiesData);
      setServices(servicesData);
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCompaniesAndMetadata();
  }, [fetchCompaniesAndMetadata]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchCompaniesAndMetadata();
  };

  const handleCreateNew = () => {
    setCompanyToEdit(null);
    setIsCompanyDrawerOpen(true);
  };

  const handleEdit = (company: Company) => {
    setCompanyToEdit(company);
    setIsCompanyDrawerOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      await companyService.deleteCompany(companyToDelete.id);
      toast.success(
        `Company "${companyToDelete.companyName}" deleted successfully`,
        200
      );
      setCompanyToDelete(null);
      fetchCompaniesAndMetadata();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Extract all available tiers across live services
  const allTiers: ServiceTier[] = services.flatMap(
    (s) => s.tiers || s.pricingTiers || []
  );

  // Filter companies
  const filteredCompanies = companies.filter((c) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      c.companyName?.toLowerCase().includes(q) ||
      c.managerName?.toLowerCase().includes(q) ||
      c.managerPhone?.toLowerCase().includes(q);

    const matchesService =
      serviceFilter === "ALL" ||
      c.serviceId === serviceFilter ||
      (c.serviceNames && c.serviceNames.some((sn) => sn.toLowerCase().includes(serviceFilter.toLowerCase())));

    const matchesTier =
      tierFilter === "ALL" ||
      c.tierId === tierFilter ||
      (c.tierName && c.tierName.toLowerCase().includes(tierFilter.toLowerCase()));

    return matchesSearch && matchesService && matchesTier;
  });

  const totalCompanies = companies.length;
  const activeCompanies = companies.filter((c) => !c.isArchived).length;
  const companiesWithDocs = companies.filter((c) => !!c.documentUrl).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Directory &amp; Accounts
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Companies Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Directory of registered brand clients, assigned deliverable tiers, active service department contracts, and official documents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 min-h-[44px]"
            title="Refresh company directory"
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
            <span>Register Company</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Companies
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={totalCompanies} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Directory records</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-brand-accent flex items-center justify-center">
            <Building2 className="w-5 h-5 text-brand-accent" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Client Accounts
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={activeCompanies} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Currently active</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary text-brand-accent flex items-center justify-center">
            <Briefcase className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Documented Registrations
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={companiesWithDocs} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">With cloud attachments</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-bg-app border border-border-subtle text-gray-500 flex items-center justify-center">
            <FileText className="w-5 h-5 text-brand-accent" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-4 shadow-sm transition-colors">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by company, manager, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs text-text-primary outline-none bg-bg-app transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department / Service Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <Layers className="w-3.5 h-3.5 text-gray-400 ml-2" />
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

          {/* Tier Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <Tags className="w-3.5 h-3.5 text-gray-400 ml-2" />
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text-primary outline-none py-1 px-2 cursor-pointer"
            >
              <option value="ALL">All Pricing Tiers</option>
              {allTiers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Directory Table (Desktop) / Cards (Mobile) */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
        {/* Desktop Data Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border-subtle">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-4 px-6">Company Entity</th>
                <th className="py-4 px-6">Management Contact</th>
                <th className="py-4 px-6">Registration Date</th>
                <th className="py-4 px-6">Contract Alignment</th>
                <th className="py-4 px-6">Document</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
                      <span>Loading registered companies from live API...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Building2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-sm font-semibold text-text-primary">
                        No companies found
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchTerm || serviceFilter !== "ALL" || tierFilter !== "ALL"
                          ? "Try adjusting your search terms or filter selections."
                          : "Get started by registering your first client company."}
                      </p>
                      {searchTerm === "" &&
                        serviceFilter === "ALL" &&
                        tierFilter === "ALL" && (
                          <button
                            onClick={handleCreateNew}
                            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-primary font-bold text-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Register Company</span>
                          </button>
                        )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company) => {
                  const monogram = (company.companyName || "C")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  const isImage =
                    company.documentUrl &&
                    (company.documentUrl.endsWith(".png") ||
                      company.documentUrl.endsWith(".jpg") ||
                      company.documentUrl.endsWith(".jpeg") ||
                      company.documentUrl.endsWith(".webp") ||
                      company.documentUrl.endsWith(".svg"));

                  return (
                    <tr
                      key={company.id}
                      className="hover:bg-border-subtle/30 transition-colors group"
                    >
                      {/* Company Name & Monogram Logo */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="relative w-11 h-11 rounded-xl bg-brand-primary text-brand-accent font-extrabold text-sm flex items-center justify-center ring-1 ring-border-subtle overflow-hidden shrink-0 shadow-sm">
                            {isImage && company.documentUrl ? (
                              <Image
                                src={company.documentUrl}
                                alt={company.companyName}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            ) : (
                              <span>{monogram}</span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-text-primary group-hover:text-brand-accent transition-colors truncate text-sm">
                              {company.companyName}
                            </p>
                            <p className="text-[11px] text-gray-400 font-mono truncate">
                              ID: {company.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Management Contact */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-medium text-text-primary">
                            <User className="w-3.5 h-3.5 text-gray-400" />
                            <span>{company.managerName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[11px]">
                            <Phone className="w-3 h-3 text-brand-accent" />
                            <a
                              href={`tel:${company.managerPhone}`}
                              className="hover:text-brand-accent transition-colors"
                            >
                              {company.managerPhone}
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Registration Date */}
                      <td className="py-4 px-6 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          <span>
                            {company.date
                              ? new Date(company.date).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>
                      </td>

                      {/* Contract Alignment (Tier Badge / Service Tag) */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          {company.tierName ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary text-brand-accent shadow-sm">
                              <Tags className="w-3 h-3" />
                              {company.tierName}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-bg-app border border-border-subtle text-gray-400">
                              Standard Client
                            </span>
                          )}

                          {company.serviceNames && company.serviceNames.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {company.serviceNames.slice(0, 2).map((sn, idx) => (
                                <span
                                  key={idx}
                                  className="text-[9px] font-semibold text-brand-primary dark:text-brand-accent"
                                >
                                  • {sn}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Document Attachment */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {company.documentUrl ? (
                          <a
                            href={company.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border-subtle bg-bg-app hover:bg-border-subtle/50 text-[11px] font-bold text-brand-primary dark:text-brand-accent transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Doc</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-[11px] text-gray-400 italic">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleEdit(company)}
                            className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors cursor-pointer"
                            title="Edit Company"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setCompanyToDelete(company)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Company"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card Layout */}
        <div className="lg:hidden divide-y divide-border-subtle">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-accent mx-auto mb-2" />
              <p className="text-xs">Loading live company directory...</p>
            </div>
          ) : filteredCompanies.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-3">
              <Building2 className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-semibold text-text-primary">No companies found</p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register Company</span>
              </button>
            </div>
          ) : (
            filteredCompanies.map((company) => {
              const monogram = (company.companyName || "C")
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2);

              const isImage =
                company.documentUrl &&
                (company.documentUrl.endsWith(".png") ||
                  company.documentUrl.endsWith(".jpg") ||
                  company.documentUrl.endsWith(".jpeg") ||
                  company.documentUrl.endsWith(".webp") ||
                  company.documentUrl.endsWith(".svg"));

              return (
                <div key={company.id} className="p-4 sm:p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12 rounded-xl bg-brand-primary text-brand-accent font-extrabold text-sm flex items-center justify-center ring-1 ring-border-subtle overflow-hidden shrink-0">
                        {isImage && company.documentUrl ? (
                          <Image
                            src={company.documentUrl}
                            alt={company.companyName}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <span>{monogram}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-text-primary text-base truncate">
                          {company.companyName}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          <span>{company.managerName}</span>
                        </p>
                      </div>
                    </div>

                    {company.documentUrl && (
                      <a
                        href={company.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg bg-bg-app border border-border-subtle text-brand-accent"
                        title="View document"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-xl bg-bg-app border border-border-subtle">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                        Manager Phone
                      </span>
                      <a
                        href={`tel:${company.managerPhone}`}
                        className="font-mono font-semibold text-text-primary hover:text-brand-accent mt-0.5 block truncate"
                      >
                        {company.managerPhone}
                      </a>
                    </div>

                    <div className="p-2.5 rounded-xl bg-bg-app border border-border-subtle">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider block">
                        Registered Date
                      </span>
                      <span className="font-semibold text-text-primary mt-0.5 block truncate">
                        {company.date
                          ? new Date(company.date).toLocaleDateString()
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-primary text-brand-accent">
                      {company.tierName || "Standard Client"}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(company)}
                        className="px-3 py-1.5 rounded-lg border border-border-subtle text-xs font-semibold hover:bg-border-subtle/50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setCompanyToDelete(company)}
                        className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Company Drawer */}
      <CompanyDrawer
        isOpen={isCompanyDrawerOpen}
        onClose={() => setIsCompanyDrawerOpen(false)}
        onSuccess={() => fetchCompaniesAndMetadata()}
        companyToEdit={companyToEdit}
        onRequestCreateService={() => setIsServiceDrawerOpen(true)}
        onRequestCreateTier={() => setIsTierDrawerOpen(true)}
      />

      {/* Cross-module creation shortcut drawers */}
      <ServiceDrawer
        isOpen={isServiceDrawerOpen}
        onClose={() => setIsServiceDrawerOpen(false)}
        onSuccess={() => fetchCompaniesAndMetadata()}
        serviceToEdit={null}
      />

      <TierDrawer
        isOpen={isTierDrawerOpen}
        onClose={() => setIsTierDrawerOpen(false)}
        onSuccess={() => fetchCompaniesAndMetadata()}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Company Record"
        message={`Are you sure you want to delete "${companyToDelete?.companyName}"? This action permanently removes the company from the directory.`}
        warningNote="Any production tasks, scheduled calendar events, or documents linked to this company may be permanently orphaned or affected."
        confirmText="Delete Company"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
