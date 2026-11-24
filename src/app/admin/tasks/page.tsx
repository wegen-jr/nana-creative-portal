"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  CheckSquare,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building2,
  User,
  Filter,
  Calendar,
  DollarSign,
  Trash2,
  ExternalLink,
  Layers,
  ChevronRight,
} from "lucide-react";
import {
  Company,
  ServiceDepartment,
  ServiceTier,
  Task,
  TaskStatus,
  UserResponseDto,
} from "@/types/api.types";
import taskService from "@/services/taskService";
import companyService from "@/services/companyService";
import serviceDepartmentService from "@/services/serviceDepartmentService";
import userService from "@/services/userService";
import { useToast } from "@/contexts/ToastContext";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import TaskDrawer from "@/components/tasks/TaskDrawer";
import TaskSubmissionDrawer from "@/components/tasks/TaskSubmissionDrawer";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import CompanyDrawer from "@/components/companies/CompanyDrawer";
import ServiceDrawer from "@/components/services/ServiceDrawer";

export default function TasksManagementPage() {
  const toast = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Relational Lookup Maps to guarantee zero raw UUIDs displayed
  const [companiesMap, setCompaniesMap] = useState<Record<string, Company>>({});
  const [servicesMap, setServicesMap] = useState<Record<string, ServiceDepartment>>({});
  const [tiersMap, setTiersMap] = useState<Record<string, ServiceTier>>({});
  const [usersMap, setUsersMap] = useState<Record<string, UserResponseDto>>({});

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [companyFilter, setCompanyFilter] = useState<string>("ALL");
  const [staffFilter, setStaffFilter] = useState<string>("ALL");
  const [urgentOnly, setUrgentOnly] = useState<boolean>(false);

  // Drawer states
  const [isTaskDrawerOpen, setIsTaskDrawerOpen] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null);
  const [isCompanyDrawerOpen, setIsCompanyDrawerOpen] = useState(false);
  const [isServiceDrawerOpen, setIsServiceDrawerOpen] = useState(false);

  // Delete task confirmation modal
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTasksAndLookups = useCallback(async () => {
    try {
      const [tasksData, companiesData, servicesData, usersData] =
        await Promise.all([
          taskService.getAllTasks().catch(() => []),
          companyService.getAllCompanies().catch(() => []),
          serviceDepartmentService.getAllServices(true).catch(() => []),
          userService.getAllUsers().catch(() => []),
        ]);

      setTasks(tasksData);

      // Build instant relational lookup maps
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
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTasksAndLookups();
  }, [fetchTasksAndLookups]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTasksAndLookups();
  };

  const handleToggleUrgent = async (task: Task) => {
    try {
      await taskService.toggleUrgent(task.id);
      toast.success(
        `Task "${task.title}" urgent flag ${task.isUrgent ? "removed" : "enabled"}`,
        200
      );
      fetchTasksAndLookups();
    } catch (err: unknown) {
      toast.handleApiError(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return;
    setIsDeleting(true);
    try {
      await taskService.deleteTask(taskToDelete.id);
      toast.success(`Task "${taskToDelete.title}" deleted`, 200);
      setTaskToDelete(null);
      fetchTasksAndLookups();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Human-readable resolution helper
  const resolveNames = (t: Task) => {
    const comp = t.company || companiesMap[t.companyId];
    const serv = t.service || servicesMap[t.serviceId];
    const tier = t.tier || tiersMap[t.tierId];
    const user = t.assignedTo || usersMap[t.assignedToId];

    return {
      companyName: comp?.companyName || "Client Account",
      serviceName: serv?.name || "Production Service",
      tierName: tier?.name || "Standard Deliverable",
      rateUsd: t.rateLockedUsd ?? tier?.defaultRateUsd ?? 0,
      assigneeName: user?.name || "Assigned Creator",
    };
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const q = searchTerm.toLowerCase();
    const resolved = resolveNames(t);
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      resolved.companyName.toLowerCase().includes(q) ||
      resolved.assigneeName.toLowerCase().includes(q) ||
      resolved.serviceName.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "ALL" || t.status === statusFilter;
    const matchesCompany = companyFilter === "ALL" || t.companyId === companyFilter;
    const matchesStaff = staffFilter === "ALL" || t.assignedToId === staffFilter;
    const matchesUrgent = !urgentOnly || t.isUrgent === true;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesCompany &&
      matchesStaff &&
      matchesUrgent
    );
  });

  // Metrics
  const totalCount = tasks.length;
  const readyForReview = tasks.filter((t) => t.status === "SUBMITTED").length;
  const revisionCount = tasks.filter((t) => t.status === "REVISION").length;
  const approvedPayrollCount = tasks.filter((t) => t.status === "APPROVED").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Production &amp; Calendar Pipeline
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Tasks Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Schedule creator tasks, track delivery deadlines, review submissions, and authorize green-light payouts for the 10th-of-month payroll cycle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 min-h-[44px]"
            title="Refresh tasks"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsTaskDrawerOpen(true)}
            className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Scheduled
            </span>
            <div className="text-2xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={totalCount} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Pipeline deliverables</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-brand-accent flex items-center justify-center">
            <CheckSquare className="w-5 h-5 text-brand-accent" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Ready for Review
            </span>
            <div className="text-2xl font-extrabold text-blue-500 tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={readyForReview} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Submitted deliverables</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              In Revision
            </span>
            <div className="text-2xl font-extrabold text-amber-500 tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={revisionCount} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Feedback requested</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <RotateCcw className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Approved (Payroll)
            </span>
            <div className="text-2xl font-extrabold text-emerald-500 tracking-tight mt-1">
              {loading ? (
                <div className="h-7 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={approvedPayrollCount} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">Locked for 10th cycle</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#0B3B24] text-[#8CC63F] flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-4 shadow-sm transition-colors">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, client, creator..."
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
              <option value="PENDING">Pending</option>
              <option value="SUBMITTED">Ready for Review</option>
              <option value="REVISION">In Revision</option>
              <option value="APPROVED">Approved (Locked)</option>
            </select>
          </div>

          {/* Client Company Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <Building2 className="w-3.5 h-3.5 text-gray-400 ml-2" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text-primary outline-none py-1 px-2 cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">All Clients</option>
              {Object.values(companiesMap).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.companyName}
                </option>
              ))}
            </select>
          </div>

          {/* Staff Member Filter */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <User className="w-3.5 h-3.5 text-gray-400 ml-2" />
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-text-primary outline-none py-1 px-2 cursor-pointer max-w-[150px] truncate"
            >
              <option value="ALL">All Staff</option>
              {Object.values(usersMap).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          {/* Urgent Toggle Button */}
          <button
            onClick={() => setUrgentOnly(!urgentOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
              urgentOnly
                ? "bg-red-500/10 text-red-500 border-red-500/30"
                : "border-border-subtle text-gray-500 hover:text-text-primary bg-bg-app"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Urgent</span>
          </button>
        </div>
      </div>

      {/* Spacious Desktop Table / Mobile Cards */}
      <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden transition-colors">
        {/* Desktop Data Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead className="sticky top-0 bg-bg-surface z-10 border-b border-border-subtle">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                <th className="py-4 px-6">Task Title &amp; Deliverable</th>
                <th className="py-4 px-6">Client Company</th>
                <th className="py-4 px-6">Assigned Creator</th>
                <th className="py-4 px-6">Posting Date / Deadline</th>
                <th className="py-4 px-6">Locked Rate</th>
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
                      <span>Loading live tasks and calendar assignments...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <div className="max-w-sm mx-auto space-y-3">
                      <CheckSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                      <p className="text-sm font-semibold text-text-primary">
                        No tasks scheduled
                      </p>
                      <p className="text-xs text-gray-500">
                        {searchTerm ||
                        statusFilter !== "ALL" ||
                        companyFilter !== "ALL" ||
                        staffFilter !== "ALL" ||
                        urgentOnly
                          ? "No tasks match your selected filters."
                          : "Schedule a task onto the calendar to assign creators and lock in payout rates."}
                      </p>
                      <button
                        onClick={() => setIsTaskDrawerOpen(true)}
                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white hover:bg-brand-accent hover:text-brand-primary font-bold text-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Schedule Task</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => {
                  const resolved = resolveNames(task);

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-border-subtle/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedTaskForReview(task)}
                    >
                      {/* Task Title */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleUrgent(task);
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              task.isUrgent
                                ? "bg-red-500/10 text-red-500"
                                : "text-gray-300 hover:text-gray-500"
                            }`}
                            title={task.isUrgent ? "Urgent task" : "Mark as urgent"}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </button>

                          <div className="min-w-0 max-w-xs">
                            <p className="font-bold text-text-primary group-hover:text-brand-accent transition-colors truncate text-sm">
                              {task.title}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate flex items-center gap-1 mt-0.5">
                              <Layers className="w-3 h-3 text-gray-400" />
                              <span>{resolved.serviceName} • {resolved.tierName}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Company Name */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-semibold text-text-primary">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          <span>{resolved.companyName}</span>
                        </span>
                      </td>

                      {/* Assigned Creator */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 font-medium text-text-primary">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                          <span>{resolved.assigneeName}</span>
                        </span>
                      </td>

                      {/* Posting Date / Deadline */}
                      <td className="py-4 px-6 whitespace-nowrap text-gray-500 dark:text-gray-400">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-mono text-xs text-text-primary font-bold">
                            <Calendar className="w-3.5 h-3.5 text-brand-accent" />
                            <span>{task.postingDate}</span>
                            <span className="text-[11px] font-normal text-gray-400">
                              {task.postingTime}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-sans">
                            Due 1 day prior
                          </p>
                        </div>
                      </td>

                      {/* Locked Rate */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-xs">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{Number(resolved.rateUsd).toFixed(2)}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {task.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#0B3B24] text-[#8CC63F]">
                            <CheckCircle2 className="w-3 h-3" />
                            APPROVED
                          </span>
                        )}
                        {task.status === "SUBMITTED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            <Clock className="w-3 h-3" />
                            SUBMITTED
                          </span>
                        )}
                        {task.status === "REVISION" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                            <RotateCcw className="w-3 h-3" />
                            REVISION
                          </span>
                        )}
                        {task.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-bg-app border border-border-subtle text-gray-500">
                            PENDING
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div
                          className="inline-flex items-center gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => setSelectedTaskForReview(task)}
                            className="px-3 py-1.5 rounded-lg bg-bg-app border border-border-subtle hover:border-brand-accent/50 text-xs font-semibold text-text-primary hover:text-brand-accent transition-colors flex items-center gap-1"
                          >
                            <span>Review</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>

                          {task.status !== "APPROVED" && (
                            <button
                              onClick={() => setTaskToDelete(task)}
                              className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Delete task"
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

        {/* Mobile Stacked Card View */}
        <div className="lg:hidden divide-y divide-border-subtle">
          {loading ? (
            <div className="p-8 text-center text-gray-400">
              <RefreshCw className="w-5 h-5 animate-spin text-brand-accent mx-auto mb-2" />
              <p className="text-xs">Loading live tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="p-8 text-center text-gray-400 space-y-3">
              <CheckSquare className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-xs font-semibold text-text-primary">No tasks found</p>
              <button
                onClick={() => setIsTaskDrawerOpen(true)}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Schedule Task</span>
              </button>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const resolved = resolveNames(task);

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskForReview(task)}
                  className="p-4 sm:p-5 space-y-3 cursor-pointer hover:bg-border-subtle/20 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {task.isUrgent && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                            URGENT
                          </span>
                        )}
                        <span className="text-[11px] font-bold text-brand-primary dark:text-brand-accent truncate">
                          {resolved.companyName}
                        </span>
                      </div>
                      <h3 className="font-bold text-text-primary text-base truncate">
                        {task.title}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3" />
                        <span>{resolved.assigneeName}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg inline-block">
                        ${Number(resolved.rateUsd).toFixed(2)}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono mt-1">
                        {task.postingDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border-subtle/50">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        task.status === "APPROVED"
                          ? "bg-[#0B3B24] text-[#8CC63F]"
                          : task.status === "SUBMITTED"
                          ? "bg-blue-500/10 text-blue-500"
                          : task.status === "REVISION"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-bg-app border border-border-subtle text-gray-400"
                      }`}
                    >
                      {task.status}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTaskForReview(task);
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

      {/* Schedule Task Drawer */}
      <TaskDrawer
        isOpen={isTaskDrawerOpen}
        onClose={() => setIsTaskDrawerOpen(false)}
        onSuccess={() => fetchTasksAndLookups()}
        onRequestCreateCompany={() => setIsCompanyDrawerOpen(true)}
        onRequestCreateService={() => setIsServiceDrawerOpen(true)}
      />

      {/* Task Submissions Review Drawer */}
      <TaskSubmissionDrawer
        isOpen={!!selectedTaskForReview}
        onClose={() => setSelectedTaskForReview(null)}
        task={selectedTaskForReview}
        onSuccess={() => fetchTasksAndLookups()}
        resolvedNames={
          selectedTaskForReview ? resolveNames(selectedTaskForReview) : undefined
        }
      />

      {/* Helper cross-module creation drawers */}
      <CompanyDrawer
        isOpen={isCompanyDrawerOpen}
        onClose={() => setIsCompanyDrawerOpen(false)}
        onSuccess={() => fetchTasksAndLookups()}
        companyToEdit={null}
      />

      <ServiceDrawer
        isOpen={isServiceDrawerOpen}
        onClose={() => setIsServiceDrawerOpen(false)}
        onSuccess={() => fetchTasksAndLookups()}
        serviceToEdit={null}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!taskToDelete}
        onClose={() => setTaskToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task Assignment"
        message={`Are you sure you want to delete task "${taskToDelete?.title}"? This permanently cancels the scheduled task.`}
        warningNote="Only unapproved tasks can be deleted. This action cannot be reversed."
        confirmText="Delete Task"
        confirmVariant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
