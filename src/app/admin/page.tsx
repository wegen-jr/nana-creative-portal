"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  RefreshCw,
  CheckSquare,
  Clock,
  Building2,
  Inbox,
  ArrowRight,
  DollarSign,
  Wallet,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  User,
  Calendar,
} from "lucide-react";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import {
  Company,
  ContactRequest,
  CurrentPayrollCycleResponse,
  Task,
  UserResponseDto,
} from "@/types/api.types";
import taskService from "@/services/taskService";
import companyService from "@/services/companyService";
import contactService from "@/services/contactService";
import payrollService from "@/services/payrollService";
import userService from "@/services/userService";
import { useToast } from "@/contexts/ToastContext";
import TaskDrawer from "@/components/tasks/TaskDrawer";
import TaskSubmissionDrawer from "@/components/tasks/TaskSubmissionDrawer";

export default function AdminOverviewPage() {
  const toast = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<ContactRequest[]>([]);
  const [payroll, setPayroll] = useState<CurrentPayrollCycleResponse | null>(null);
  const [usersMap, setUsersMap] = useState<Record<string, UserResponseDto>>({});
  const [companiesMap, setCompaniesMap] = useState<Record<string, Company>>({});

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Action Drawer
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [selectedTaskForReview, setSelectedTaskForReview] = useState<Task | null>(null);

  const loadExecutiveData = useCallback(async () => {
    try {
      const [
        fetchedTasks,
        fetchedCompanies,
        fetchedContacts,
        fetchedPayroll,
        fetchedUsers,
      ] = await Promise.all([
        taskService.getAllTasks().catch(() => []),
        companyService.getAllCompanies().catch(() => []),
        contactService.getAllContacts().catch(() => []),
        payrollService.getCurrentCycle(130).catch(() => ({
          message: "Current open payroll cycle",
          etbRate: 130,
          totalUsd: 0,
          totalEtb: 0,
        })),
        userService.getAllUsers().catch(() => []),
      ]);

      setTasks(fetchedTasks);
      setCompanies(fetchedCompanies);
      setContacts(fetchedContacts);
      setPayroll(fetchedPayroll);

      const uMap: Record<string, UserResponseDto> = {};
      fetchedUsers.forEach((u) => (uMap[u.id] = u));
      setUsersMap(uMap);

      const cMap: Record<string, Company> = {};
      fetchedCompanies.forEach((c) => (cMap[c.id] = c));
      setCompaniesMap(cMap);
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    loadExecutiveData();
  }, [loadExecutiveData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadExecutiveData().then(() => {
      toast.success("Executive dashboard updated", 200);
    });
  };

  // Resolved relation helper
  const resolveNames = (t: Task) => {
    const comp = t.company || companiesMap[t.companyId];
    const user = t.assignedTo || usersMap[t.assignedToId];

    return {
      companyName: comp?.companyName || "Client Account",
      assigneeName: user?.name || "Assigned Creator",
      rateUsd: t.rateLockedUsd ?? t.defaultRateUsd ?? 0,
    };
  };

  // Metrics
  const activeTasksCount = tasks.filter((t) => t.status !== "APPROVED").length;
  const readyForReviewCount = tasks.filter((t) => t.status === "SUBMITTED").length;
  const companiesCount = companies.length;
  const pendingInquiriesCount = contacts.length;

  const payrollUsd =
    payroll?.totalUsd && payroll.totalUsd > 0
      ? payroll.totalUsd
      : tasks
          .filter((t) => t.status === "APPROVED")
          .reduce((sum, t) => sum + (t.rateLockedUsd ?? t.defaultRateUsd ?? 0), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
      {/* Top Header: Clean, Minimal Executive Command Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-[11px] font-bold tracking-widest uppercase text-brand-primary dark:text-brand-accent font-mono">
              Executive Command Center
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Operations &amp; Agency Overview
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Live pulse across active production tasks, deliverable submissions, partner accounts, and financial payroll status.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-2xl border border-border-subtle bg-bg-surface text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-all flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 min-h-[44px] shadow-sm"
            title="Refresh live metrics"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateTaskOpen(true)}
            className="px-5 py-3 rounded-2xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer hover:-translate-y-0.5 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Task</span>
          </button>
        </div>
      </div>

      {/* Tier 1 — Airy Executive KPI Strip (4 Spacious Cards) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6"
      >
        {/* Card 1: Active Tasks */}
        <motion.div
          variants={itemVariants}
          className="group relative bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(27,38,59,0.05)] hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Active Tasks
              </span>
              <div className="w-10 h-10 rounded-xl bg-surface-mint dark:bg-brand-primary text-brand-accent flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl font-semibold tracking-tight tabular-nums text-text-primary">
              {loading ? (
                <div className="h-9 w-20 bg-border-subtle animate-pulse rounded-lg" />
              ) : (
                <AnimatedCounter value={activeTasksCount} />
              )}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-gray-400 text-xs">Scheduled in pipeline</span>
            <Link
              href="/admin/tasks"
              className="text-[11px] font-bold text-brand-primary dark:text-brand-accent hover:underline flex items-center gap-1"
            >
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* Card 2: Ready for Review */}
        <motion.div
          variants={itemVariants}
          className="group relative bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(27,38,59,0.05)] hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Ready for Review
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl font-semibold tracking-tight tabular-nums text-blue-500">
              {loading ? (
                <div className="h-9 w-20 bg-border-subtle animate-pulse rounded-lg" />
              ) : (
                <AnimatedCounter value={readyForReviewCount} />
              )}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-gray-400 text-xs">Pending approval</span>
            <Link
              href="/admin/task-submissions"
              className="text-[11px] font-bold text-blue-500 hover:underline flex items-center gap-1"
            >
              <span>Audit Submissions</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* Card 3: Partner Companies */}
        <motion.div
          variants={itemVariants}
          className="group relative bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(27,38,59,0.05)] hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Client Companies
              </span>
              <div className="w-10 h-10 rounded-xl bg-surface-mint dark:bg-brand-primary text-brand-accent flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <Building2 className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl font-semibold tracking-tight tabular-nums text-text-primary">
              {loading ? (
                <div className="h-9 w-20 bg-border-subtle animate-pulse rounded-lg" />
              ) : (
                <AnimatedCounter value={companiesCount} />
              )}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-gray-400 text-xs">Registered directory</span>
            <Link
              href="/admin/companies"
              className="text-[11px] font-bold text-brand-primary dark:text-brand-accent hover:underline flex items-center gap-1"
            >
              <span>Directory</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>

        {/* Card 4: Client Inquiries */}
        <motion.div
          variants={itemVariants}
          className="group relative bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(27,38,59,0.05)] hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Contact Inquiries
              </span>
              <div className="w-10 h-10 rounded-xl bg-surface-mint dark:bg-brand-primary text-brand-accent flex items-center justify-center transition-transform group-hover:scale-105 duration-200">
                <Inbox className="w-5 h-5" />
              </div>
            </div>

            <div className="text-3xl font-semibold tracking-tight tabular-nums text-text-primary">
              {loading ? (
                <div className="h-9 w-20 bg-border-subtle animate-pulse rounded-lg" />
              ) : (
                <AnimatedCounter value={pendingInquiriesCount} />
              )}
            </div>
          </div>

          <div className="mt-5 pt-3.5 border-t border-border-subtle flex items-center justify-between text-xs">
            <span className="text-gray-400 text-xs">From public portal</span>
            <Link
              href="/admin/contacts"
              className="text-[11px] font-bold text-brand-primary dark:text-brand-accent hover:underline flex items-center gap-1"
            >
              <span>View Inbox</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </motion.div>
      </motion.div>

      {/* Tier 2 — Balanced 12-Column Operational Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Primary Panel (col-span-7 / col-span-8): Recent Tasks & Submissions Feed */}
        <div className="lg:col-span-7 xl:col-span-8 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(27,38,59,0.05)] space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div>
              <h2 className="text-lg font-bold text-text-primary tracking-tight">
                Live Production Pipeline
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Latest scheduled tasks, submission deliveries, and reviewer milestones.
              </p>
            </div>

            <Link
              href="/admin/tasks"
              className="text-xs font-bold text-brand-primary dark:text-brand-accent hover:underline transition-colors flex items-center gap-1 group"
            >
              <span>View All Tasks</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Tasks Feed Rows */}
          <div className="divide-y divide-border-subtle">
            {loading ? (
              <div className="py-16 text-center text-gray-400 flex items-center justify-center gap-2 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-brand-accent" />
                <span>Loading live operational tasks...</span>
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-16 text-center text-gray-400 space-y-3">
                <CheckSquare className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="text-sm font-semibold text-text-primary">
                  No tasks scheduled yet
                </p>
                <p className="text-xs text-gray-500">
                  Assign tasks to team members to start tracking deliverables on the calendar.
                </p>
                <button
                  onClick={() => setIsCreateTaskOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Schedule Task</span>
                </button>
              </div>
            ) : (
              tasks.slice(0, 6).map((task) => {
                const resolved = resolveNames(task);

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskForReview(task)}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer hover:bg-border-subtle/20 -mx-2 px-2 rounded-xl transition-all"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-center text-text-primary shrink-0 mt-0.5">
                        <CheckSquare className="w-4 h-4 text-brand-accent" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] font-bold text-brand-accent truncate">
                            {resolved.companyName}
                          </span>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            Due {task.postingDate}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-text-primary group-hover:text-brand-accent transition-colors truncate">
                          {task.title}
                        </h3>

                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <User className="w-3 h-3" />
                          <span>{resolved.assigneeName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg inline-block">
                          ${Number(resolved.rateUsd).toFixed(2)}
                        </span>
                      </div>

                      {task.status === "APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0B3B24] text-[#8CC63F]">
                          <CheckCircle2 className="w-3 h-3" />
                          APPROVED
                        </span>
                      )}
                      {task.status === "SUBMITTED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                          <Clock className="w-3 h-3" />
                          SUBMITTED
                        </span>
                      )}
                      {task.status === "REVISION" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                          <RotateCcw className="w-3 h-3" />
                          REVISION
                        </span>
                      )}
                      {task.status === "PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-bg-app border border-border-subtle text-gray-500">
                          PENDING
                        </span>
                      )}

                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Secondary Panel (col-span-5 / col-span-4): Payroll Summary & Recent Client Inquiries */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Payroll Open Cycle Card */}
          <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(27,38,59,0.05)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#0B3B24] text-[#8CC63F] flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight">
                    Payroll (10th-of-Month)
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Live open payout summary
                  </p>
                </div>
              </div>

              <Link
                href="/admin/payroll"
                className="text-xs font-bold text-brand-primary dark:text-brand-accent hover:underline flex items-center gap-1"
              >
                <span>Details</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-bg-app border border-border-subtle flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                    Active Approved Total
                  </span>
                  <span className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    ${payrollUsd.toFixed(2)} USD
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider block font-bold">
                    Exchange (ETB)
                  </span>
                  <span className="text-sm font-bold font-mono text-text-primary mt-0.5 block">
                    {(payrollUsd * 130).toLocaleString()} ETB
                  </span>
                </div>
              </div>

              {payroll?.message && (
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed italic px-1">
                  &ldquo;{payroll.message}&rdquo;
                </p>
              )}
            </div>
          </div>

          {/* Recent Client Inquiries Card */}
          <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-7 shadow-[0_4px_20px_-4px_rgba(27,38,59,0.05)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-surface-mint dark:bg-brand-primary text-brand-accent flex items-center justify-center">
                  <Inbox className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary tracking-tight">
                    Client Inquiries
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    Latest leads from website
                  </p>
                </div>
              </div>

              <Link
                href="/admin/contacts"
                className="text-xs font-bold text-brand-primary dark:text-brand-accent hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="divide-y divide-border-subtle">
              {loading ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  Loading inquiries...
                </div>
              ) : contacts.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs">
                  No client inquiries received yet.
                </div>
              ) : (
                contacts.slice(0, 4).map((c) => (
                  <div key={c.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-text-primary">
                        {c.name}
                      </span>
                      <span className="text-[10px] font-mono text-gray-400">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {c.companyName} • {c.service}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Creation Drawer */}
      <TaskDrawer
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        onSuccess={() => loadExecutiveData()}
      />

      {/* Task Submissions Review Drawer */}
      <TaskSubmissionDrawer
        isOpen={!!selectedTaskForReview}
        onClose={() => setSelectedTaskForReview(null)}
        task={selectedTaskForReview}
        onSuccess={() => loadExecutiveData()}
        resolvedNames={
          selectedTaskForReview ? resolveNames(selectedTaskForReview) : undefined
        }
      />
    </div>
  );
}
