"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  ClipboardCheck,
  Clock,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  FileText,
  User,
  Building2,
  DollarSign,
  Filter,
  ChevronRight,
  Video,
} from "lucide-react";
import {
  Company,
  ServiceDepartment,
  ServiceTier,
  Task,
  TaskSubmission,
  UserResponseDto,
} from "@/types/api.types";
import taskService from "@/services/taskService";
import taskSubmissionService from "@/services/taskSubmissionService";
import companyService from "@/services/companyService";
import serviceDepartmentService from "@/services/serviceDepartmentService";
import userService from "@/services/userService";
import { useToast } from "@/contexts/ToastContext";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import TaskSubmissionDrawer from "@/components/tasks/TaskSubmissionDrawer";

interface SubmissionWithTask extends TaskSubmission {
  parentTask?: Task;
}

export default function TaskSubmissionsPage() {
  const toast = useToast();

  const [submissionsWithTasks, setSubmissionsWithTasks] = useState<SubmissionWithTask[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Relational Lookups
  const [companiesMap, setCompaniesMap] = useState<Record<string, Company>>({});
  const [servicesMap, setServicesMap] = useState<Record<string, ServiceDepartment>>({});
  const [tiersMap, setTiersMap] = useState<Record<string, ServiceTier>>({});
  const [usersMap, setUsersMap] = useState<Record<string, UserResponseDto>>({});

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "VIDEO" | "FILE">("ALL");

  // Review Drawer state
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null);

  const fetchSubmissionsAndLookups = useCallback(async () => {
    try {
      const [tasksData, companiesData, servicesData, usersData] =
        await Promise.all([
          taskService.getAllTasks().catch(() => []),
          companyService.getAllCompanies().catch(() => []),
          serviceDepartmentService.getAllServices(true).catch(() => []),
          userService.getAllUsers().catch(() => []),
        ]);

      setTasksList(tasksData);

      // Populate lookup maps
      const cMap: Record<string, Company> = {};
      companiesData.forEach((c) => (cMap[c.id] = c));
      setCompaniesMap(cMap);

      const sMap: Record<string, ServiceDepartment> = {};
      const tMap: Record<string, ServiceTier> = {};
      servicesData.forEach((s) => {
        sMap[s.id] = s;
        const tiers = s.tiers || s.pricingTiers || [];
        tiers.forEach((t) => (tMap[t.id] = t));
      });
      setServicesMap(sMap);
      setTiersMap(tMap);

      const uMap: Record<string, UserResponseDto> = {};
      usersData.forEach((u) => (uMap[u.id] = u));
      setUsersMap(uMap);

      // Collect submissions across all tasks
      const allSubmissions: SubmissionWithTask[] = [];

      // Query submissions for each task in parallel
      const submissionPromises = tasksData.map(async (task) => {
        try {
          const subs = await taskSubmissionService.getSubmissionsByTaskId(task.id);
          return subs.map((sub) => ({
            ...sub,
            parentTask: task,
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(submissionPromises);
      results.forEach((subList) => allSubmissions.push(...subList));

      // Sort newest first
      allSubmissions.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setSubmissionsWithTasks(allSubmissions);
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSubmissionsAndLookups();
  }, [fetchSubmissionsAndLookups]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchSubmissionsAndLookups();
  };

  const resolveNames = (t?: Task) => {
    if (!t) {
      return {
        companyName: "Client Account",
        serviceName: "Production Service",
        tierName: "Standard",
        assigneeName: "Assigned Creator",
        rateUsd: 0,
      };
    }
    const comp = t.company || companiesMap[t.companyId];
    const serv = t.service || servicesMap[t.serviceId];
    const tier = t.tier || tiersMap[t.tierId];
    const user = t.assignedTo || usersMap[t.assignedToId];

    return {
      companyName: comp?.companyName || "Client Account",
      serviceName: serv?.name || "Production Service",
      tierName: tier?.name || "Standard Deliverable",
      assigneeName: user?.name || "Assigned Creator",
      rateUsd: t.rateLockedUsd ?? tier?.defaultRateUsd ?? 0,
    };
  };

  // Filtered dataset
  const filteredSubmissions = submissionsWithTasks.filter((item) => {
    const q = searchTerm.toLowerCase();
    const task = item.parentTask;
    const resolved = resolveNames(task);

    const matchesSearch =
      (task?.title && task.title.toLowerCase().includes(q)) ||
      resolved.companyName.toLowerCase().includes(q) ||
      resolved.assigneeName.toLowerCase().includes(q) ||
      (item.notes && item.notes.toLowerCase().includes(q)) ||
      (item.videoUrl && item.videoUrl.toLowerCase().includes(q));

    const currentStatus = task?.status || item.status || "SUBMITTED";
    const matchesStatus =
      statusFilter === "ALL" || currentStatus === statusFilter;

    const isVideo = !!item.videoUrl;
    const isFile = !!item.fileUrl;
    const matchesType =
      typeFilter === "ALL" ||
      (typeFilter === "VIDEO" && isVideo) ||
      (typeFilter === "FILE" && isFile);

    return matchesSearch && matchesStatus && matchesType;
  });

  const totalSubmissions = submissionsWithTasks.length;
  const readyForReview = submissionsWithTasks.filter(
    (s) => s.parentTask?.status === "SUBMITTED"
  ).length;
  const inRevision = submissionsWithTasks.filter(
    (s) => s.parentTask?.status === "REVISION"
  ).length;
  const approvedCount = submissionsWithTasks.filter(
    (s) => s.parentTask?.status === "APPROVED"
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Quality Assurance &amp; Deliverables
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Task Submissions
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Audit creator video cuts and script deliverables, provide revision notes, and grant final sign-off for billing authorization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 min-h-[44px]"
            title="Refresh submissions"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Submissions
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={totalSubmissions} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Versioned deliverables</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-brand-accent flex items-center justify-center">
            <ClipboardCheck className="w-5 h-5 text-brand-accent" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Awaiting Review
            </span>
            <div className="text-2xl font-extrabold text-blue-500 tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={readyForReview} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Needs admin action</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Revision Cycles
            </span>
            <div className="text-2xl font-extrabold text-amber-500 tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={inRevision} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Staff revisions ongoing</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Approved
            </span>
            <div className="text-2xl font-extrabold text-emerald-500 tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={approvedCount} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Greenlit for payroll</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B3B24] text-[#8CC63F] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-4 shadow-sm transition-colors">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search submissions by task, client, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border-subtle focus:border-brand-accent focus:ring-1 focus:ring-brand-accent text-xs text-text-primary outline-none bg-bg-app transition-all placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <Filter className="w-3.5 h-3.5 text-gray-400 ml-2" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text-primary outline-none py-1 px-2 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Ready for Review</option>
              <option value="REVISION">In Revision</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                typeFilter === "ALL"
                  ? "bg-bg-surface text-brand-accent shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setTypeFilter("VIDEO")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                typeFilter === "VIDEO"
                  ? "bg-bg-surface text-brand-accent shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              Video Links
            </button>
            <button
              onClick={() => setTypeFilter("FILE")}
              className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                typeFilter === "FILE"
                  ? "bg-bg-surface text-brand-accent shadow-sm"
                  : "text-gray-400 hover:text-text-primary"
              }`}
            >
              Documents
            </button>
          </div>
        </div>
      </div>

      {/* Spacious Desktop Table / Mobile Cards */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
        {/* Desktop View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border-subtle">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-4 px-6">Task &amp; Client</th>
                <th className="py-4 px-6">Creator / Submitter</th>
                <th className="py-4 px-6">Deliverable Media</th>
                <th className="py-4 px-6">Submission Time</th>
                <th className="py-4 px-6">Rate Locked</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Review Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
                      <span>Loading live submissions feed...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <ClipboardCheck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-sm font-semibold text-text-primary">
                        No submissions found
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
                          ? "No submissions match your query or filters."
                          : "Creators submit video links and script files as they complete scheduled tasks."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const parent = sub.parentTask;
                  const resolved = resolveNames(parent);
                  const status = parent?.status || sub.status || "SUBMITTED";

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-border-subtle/30 transition-colors group cursor-pointer"
                      onClick={() => parent && setSelectedTaskForReview(parent)}
                    >
                      {/* Task & Client */}
                      <td className="py-4 px-6">
                        <div className="min-w-0 max-w-xs">
                          <p className="font-bold text-text-primary group-hover:text-brand-accent transition-colors truncate text-sm">
                            {parent?.title || "Task Deliverable"}
                          </p>
                          <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            <span>{resolved.companyName}</span>
                          </p>
                        </div>
                      </td>

                      {/* Creator */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{resolved.assigneeName}</span>
                        </span>
                      </td>

                      {/* Deliverable Media */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {sub.videoUrl ? (
                          <a
                            href={sub.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold text-xs hover:bg-blue-500/20 transition-colors"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>View Video Cut</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : sub.fileUrl ? (
                          <a
                            href={sub.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-semibold text-xs hover:bg-purple-500/20 transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Download File</span>
                            <ExternalLink className="w-3 h-3 opacity-60" />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Notes only</span>
                        )}
                      </td>

                      {/* Submission Timestamp */}
                      <td className="py-4 px-6 whitespace-nowrap text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                        {new Date(sub.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>

                      {/* Rate */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{Number(resolved.rateUsd).toFixed(2)}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#0B3B24] text-[#8CC63F]">
                            APPROVED
                          </span>
                        )}
                        {status === "SUBMITTED" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            READY FOR REVIEW
                          </span>
                        )}
                        {status === "REVISION" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            IN REVISION
                          </span>
                        )}
                        {status === "PENDING" && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-bg-app border border-border-subtle text-gray-500">
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Review Button */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (parent) setSelectedTaskForReview(parent);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-bg-app border border-border-subtle hover:border-brand-accent/50 text-xs font-semibold text-text-primary hover:text-brand-accent transition-colors inline-flex items-center gap-1"
                        >
                          <span>Review &amp; Approve</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="lg:hidden divide-y divide-border-subtle">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-accent mx-auto mb-2" />
              <p className="text-xs">Loading submissions...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-3">
              <ClipboardCheck className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-semibold text-text-primary">No submissions</p>
            </div>
          ) : (
            filteredSubmissions.map((sub) => {
              const parent = sub.parentTask;
              const resolved = resolveNames(parent);

              return (
                <div
                  key={sub.id}
                  onClick={() => parent && setSelectedTaskForReview(parent)}
                  className="p-4 space-y-3 cursor-pointer hover:bg-border-subtle/20"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-brand-accent uppercase">
                        {resolved.companyName}
                      </p>
                      <h4 className="font-bold text-text-primary text-sm">
                        {parent?.title || "Task Deliverable"}
                      </h4>
                      <p className="text-xs text-gray-400 mt-0.5">
                        By {resolved.assigneeName}
                      </p>
                    </div>

                    <span className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      ${Number(resolved.rateUsd).toFixed(2)}
                    </span>
                  </div>

                  {sub.videoUrl && (
                    <a
                      href={sub.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="block p-2 rounded-lg bg-bg-app border border-border-subtle text-xs font-mono text-blue-500 hover:underline truncate"
                    >
                      {sub.videoUrl}
                    </a>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
                    <span className="text-[10px] font-mono text-gray-400">
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (parent) setSelectedTaskForReview(parent);
                      }}
                      className="text-xs font-bold text-brand-accent flex items-center gap-1"
                    >
                      <span>Review Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Review Drawer */}
      <TaskSubmissionDrawer
        isOpen={!!selectedTaskForReview}
        onClose={() => setSelectedTaskForReview(null)}
        task={selectedTaskForReview}
        onSuccess={() => fetchSubmissionsAndLookups()}
        resolvedNames={
          selectedTaskForReview ? resolveNames(selectedTaskForReview) : undefined
        }
      />
    </div>
  );
}
