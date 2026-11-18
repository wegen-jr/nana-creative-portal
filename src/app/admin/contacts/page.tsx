"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Inbox,
  Search,
  RefreshCw,
  Phone,
  Trash2,
  Filter,
  Eye,
  Calendar,
  Building2,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import ContactDrawer from "@/components/contacts/ContactDrawer";
import { contactService } from "@/services/contactService";
import { ContactRequest, ContactStatus } from "@/types/api.types";
import { useToast } from "@/contexts/ToastContext";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";

const STATUS_STORAGE_KEY = "nana_contact_status_map";

export default function ContactRequestsPage() {
  const toast = useToast();
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceFilter, setServiceFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | ContactStatus>("ALL");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Status mapping stored locally to augment inquiries
  const [statusMap, setStatusMap] = useState<Record<string, ContactStatus>>({});

  // Slide-over Drawer states
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRequest | null>(null);

  // Load status map from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STATUS_STORAGE_KEY);
      if (saved) {
        setStatusMap(JSON.parse(saved));
      }
    } catch {
      // ignore JSON parse error
    }
  }, []);

  const handleStatusChange = (id: string, newStatus: ContactStatus) => {
    setStatusMap((prev) => {
      const updated = { ...prev, [id]: newStatus };
      try {
        localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
      return updated;
    });
  };

  const fetchContacts = useCallback(async () => {
    try {
      const data = await contactService.getAllContacts();
      setContacts(data);
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchContacts().then(() => {
      toast.success("Contact requests updated", 200);
    });
  };

  const handleOpenDrawer = (contact: ContactRequest) => {
    setSelectedContact(contact);
    setIsDrawerOpen(true);
  };

  const handleDeleteDirect = async (contact: ContactRequest, e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      confirm(
        `Are you sure you want to delete the contact request from "${contact.name}"? This action cannot be undone.`
      )
    ) {
      try {
        await contactService.deleteContact(contact.id);
        toast.success(`Contact request from "${contact.name}" removed`, 200);
        fetchContacts();
      } catch (err: unknown) {
        toast.handleApiError(err);
      }
    }
  };

  // Derive unique service list for filter dropdown
  const uniqueServices = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.service) set.add(c.service);
    });
    return Array.from(set);
  }, [contacts]);

  // Filter contacts based on search query, service filter, and status filter
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        c.name?.toLowerCase().includes(q) ||
        c.companyName?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.service?.toLowerCase().includes(q) ||
        c.message?.toLowerCase().includes(q);

      const matchesService =
        serviceFilter === "ALL" || c.service === serviceFilter;

      const currentStatus: ContactStatus =
        statusMap[c.id] || c.status || "pending";
      const matchesStatus =
        statusFilter === "ALL" || currentStatus === statusFilter;

      return matchesSearch && matchesService && matchesStatus;
    });
  }, [contacts, searchTerm, serviceFilter, statusFilter, statusMap]);

  // Aggregate metrics
  const totalCount = contacts.length;
  const pendingCount = contacts.filter(
    (c) => (statusMap[c.id] || c.status || "pending") === "pending"
  ).length;
  const contactedCount = contacts.filter(
    (c) => (statusMap[c.id] || c.status) === "contacted"
  ).length;
  const resolvedCount = contacts.filter(
    (c) => (statusMap[c.id] || c.status) === "resolved"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Client Communications
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Contact Requests Inbox
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            View and respond to client project inquiries and service requests submitted from the public website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50"
            title="Refresh Inquiries"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Total Inquiries */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Total Requests
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-text-primary">
            {loading ? (
              <div className="h-8 w-14 bg-border-subtle animate-pulse rounded" />
            ) : (
              <AnimatedCounter value={totalCount} />
            )}
          </div>
          <span className="mt-2 text-[11px] text-gray-400">All submitted inquiries</span>
        </div>

        {/* Pending Requests */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Needs Attention
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-text-primary">
            {loading ? (
              <div className="h-8 w-14 bg-border-subtle animate-pulse rounded" />
            ) : (
              <AnimatedCounter value={pendingCount} />
            )}
          </div>
          <span className="mt-2 text-[11px] text-gray-400">Awaiting contact</span>
        </div>

        {/* Contacted */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-blue-500 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Contacted
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-text-primary">
            {loading ? (
              <div className="h-8 w-14 bg-border-subtle animate-pulse rounded" />
            ) : (
              <AnimatedCounter value={contactedCount} />
            )}
          </div>
          <span className="mt-2 text-[11px] text-gray-400">Outreach in progress</span>
        </div>

        {/* Resolved */}
        <div className="p-5 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm flex flex-col justify-between">
          <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Resolved
          </span>
          <div className="mt-2 text-2xl sm:text-3xl font-extrabold text-text-primary">
            {loading ? (
              <div className="h-8 w-14 bg-border-subtle animate-pulse rounded" />
            ) : (
              <AnimatedCounter value={resolvedCount} />
            )}
          </div>
          <span className="mt-2 text-[11px] text-gray-400">Completed consultations</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 bg-bg-surface p-4 rounded-2xl border border-border-subtle shadow-sm transition-colors">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search inquiries by client name, company, phone, service, or message..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs text-text-primary outline-none bg-bg-app transition-all placeholder:text-gray-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-1.5" />
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-bg-surface text-brand-accent shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter("pending")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-bg-surface text-amber-500 shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter("contacted")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "contacted"
                  ? "bg-bg-surface text-blue-500 shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              Contacted
            </button>
            <button
              onClick={() => setStatusFilter("resolved")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                statusFilter === "resolved"
                  ? "bg-bg-surface text-emerald-500 shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              Resolved
            </button>
          </div>

          {/* Service filter dropdown */}
          {uniqueServices.length > 0 && (
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-border-subtle bg-bg-app text-xs font-semibold text-text-primary focus:border-brand-accent outline-none cursor-pointer"
            >
              <option value="ALL">All Services</option>
              {uniqueServices.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* DESKTOP VIEW: Spacious Data Table (hidden on small screens, shown lg and up) */}
      <div className="hidden lg:block bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border-subtle">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-4 px-6">Client &amp; Company</th>
                <th className="py-4 px-6">Service</th>
                <th className="py-4 px-6">Phone Number</th>
                <th className="py-4 px-6">Inquiry Preview</th>
                <th className="py-4 px-6">Received</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
                      <span>Loading contact requests...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-sm font-semibold text-text-primary">
                        No contact requests found
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchTerm || serviceFilter !== "ALL" || statusFilter !== "ALL"
                          ? "No inquiries matched your current filter criteria."
                          : "New inquiries submitted from the public site will appear here."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const currentStatus =
                    statusMap[contact.id] || contact.status || "pending";
                  const initials = contact.name
                    ? contact.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "CL";

                  return (
                    <tr
                      key={contact.id}
                      onClick={() => handleOpenDrawer(contact)}
                      className="hover:bg-border-subtle/30 transition-colors group cursor-pointer"
                    >
                      {/* Client Name & Company */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-brand-primary text-brand-accent font-bold text-xs flex items-center justify-center ring-2 ring-border-subtle shrink-0">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-text-primary group-hover:text-brand-accent transition-colors truncate text-sm">
                              {contact.name}
                            </p>
                            <p className="text-gray-400 text-[11px] truncate flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3 text-brand-accent" />
                              <span>{contact.companyName || "Individual Client"}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Service Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold bg-brand-primary/10 dark:bg-brand-primary/40 text-brand-primary dark:text-brand-accent border border-brand-accent/20">
                          {contact.service}
                        </span>
                      </td>

                      {/* Phone */}
                      <td className="py-4 px-6 whitespace-nowrap font-mono text-[11px] font-semibold text-text-primary">
                        {contact.phone}
                      </td>

                      {/* Message Preview */}
                      <td className="py-4 px-6 max-w-xs">
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                          {contact.message}
                        </p>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-6 whitespace-nowrap text-gray-400 text-[11px]">
                        {contact.createdAt
                          ? new Date(contact.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {currentStatus === "resolved" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Resolved
                          </span>
                        ) : currentStatus === "contacted" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            <Sparkles className="w-3 h-3" />
                            Contacted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Call shortcut */}
                          <a
                            href={`tel:${contact.phone}`}
                            className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors"
                            title="Call Client"
                          >
                            <Phone className="w-4 h-4" />
                          </a>

                          {/* View details drawer */}
                          <button
                            onClick={() => handleOpenDrawer(contact)}
                            className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-border-subtle/50 transition-colors cursor-pointer"
                            title="View Inquiry Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={(e) => handleDeleteDirect(contact, e)}
                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Delete Contact Request"
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
      </div>

      {/* MOBILE VIEW: Stacked Responsive Cards (shown below lg, hidden on lg and up) */}
      <div className="block lg:hidden space-y-4">
        {loading ? (
          <div className="p-8 rounded-2xl bg-bg-surface border border-border-subtle text-center text-gray-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
            <span className="text-xs">Loading contact requests...</span>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-bg-surface border border-border-subtle text-center text-gray-400 space-y-2">
            <Inbox className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
            <p className="text-sm font-semibold text-text-primary">
              No contact requests found
            </p>
            <p className="text-xs text-gray-500">
              {searchTerm || serviceFilter !== "ALL" || statusFilter !== "ALL"
                ? "Try adjusting your search query or filters."
                : "Incoming client inquiries will appear here."}
            </p>
          </div>
        ) : (
          filteredContacts.map((contact) => {
            const currentStatus =
              statusMap[contact.id] || contact.status || "pending";
            const initials = contact.name
              ? contact.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : "CL";

            return (
              <div
                key={contact.id}
                onClick={() => handleOpenDrawer(contact)}
                className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm space-y-4 hover:border-brand-accent/40 transition-all cursor-pointer active:scale-[0.99]"
              >
                {/* Card Top: Client avatar, name, company & status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-full bg-brand-primary text-brand-accent font-bold text-xs flex items-center justify-center ring-2 ring-border-subtle shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-text-primary truncate">
                        {contact.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-brand-accent shrink-0" />
                        <span className="truncate">{contact.companyName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status badge */}
                  <div className="shrink-0">
                    {currentStatus === "resolved" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" />
                        Resolved
                      </span>
                    ) : currentStatus === "contacted" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        <Sparkles className="w-3 h-3" />
                        Contacted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Service & Date Row */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-border-subtle/60">
                  <span className="px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-brand-primary/10 text-brand-primary dark:text-brand-accent border border-brand-accent/20">
                    {contact.service}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {contact.createdAt
                      ? new Date(contact.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "Recent"}
                  </span>
                </div>

                {/* Message preview */}
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 bg-bg-app p-3 rounded-xl border border-border-subtle/50">
                  {contact.message}
                </p>

                {/* Card Actions Footer */}
                <div
                  className="flex items-center justify-between pt-2 border-t border-border-subtle"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${contact.phone}`}
                      className="px-3 py-1.5 rounded-lg bg-brand-primary text-brand-accent font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call</span>
                    </a>

                    <button
                      onClick={() => handleOpenDrawer(contact)}
                      className="px-3 py-1.5 rounded-lg bg-bg-app hover:bg-border-subtle text-text-primary font-semibold text-xs border border-border-subtle flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-brand-accent" />
                      <span>Details</span>
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleDeleteDirect(contact, e)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Delete Request"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Slide-over Detail Drawer */}
      <ContactDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSuccess={() => {
          fetchContacts();
        }}
        contact={selectedContact}
        statusMap={statusMap}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
