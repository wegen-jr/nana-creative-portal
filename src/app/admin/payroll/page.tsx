"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Building2,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  History,
  AlertCircle,
  FileCheck,
  ChevronDown,
} from "lucide-react";
import {
  Company,
  CurrentPayrollCycleResponse,
  PayrollCycle,
  Task,
  UserResponseDto,
} from "@/types/api.types";
import payrollService from "@/services/payrollService";
import taskService from "@/services/taskService";
import companyService from "@/services/companyService";
import userService from "@/services/userService";
import { useToast } from "@/contexts/ToastContext";
import AnimatedCounter from "@/components/dashboard/AnimatedCounter";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function PayrollPage() {
  const toast = useToast();

  const [currentPayroll, setCurrentPayroll] = useState<CurrentPayrollCycleResponse | null>(null);
  const [approvedTasks, setApprovedTasks] = useState<Task[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<PayrollCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Exchange rate setting (defaults to 130 as per Swagger spec)
  const [etbRate, setEtbRate] = useState<number>(130);

  // Tab: Current Cycle vs Closed Cycles History
  const [activeTab, setActiveTab] = useState<"CURRENT" | "HISTORY">("CURRENT");

  // Relational Lookups
  const [companiesMap, setCompaniesMap] = useState<Record<string, Company>>({});
  const [usersMap, setUsersMap] = useState<Record<string, UserResponseDto>>({});

  // Close Cycle Modal
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosingCycle, setIsClosingCycle] = useState(false);
  const [closePeriodLabel, setClosePeriodLabel] = useState("");

  const fetchPayrollData = useCallback(async () => {
    try {
      const [currentRes, approvedData, historyData, companiesData, usersData] =
        await Promise.all([
          payrollService.getCurrentCycle(etbRate).catch((err) => {
            return {
              message: err?.response?.data?.message || "Active cycle open. Awaiting unbilled approved deliverables.",
              etbRate,
              totalUsd: 0,
              totalEtb: 0,
            } as CurrentPayrollCycleResponse;
          }),
          taskService.getAllTasks({ status: "APPROVED" }).catch(() => []),
          payrollService.getPayrollHistory().catch(() => []),
          companyService.getAllCompanies().catch(() => []),
          userService.getAllUsers().catch(() => []),
        ]);

      setCurrentPayroll(currentRes);
      setApprovedTasks(approvedData);
      setPayrollHistory(historyData);

      const cMap: Record<string, Company> = {};
      companiesData.forEach((c) => (cMap[c.id] = c));
      setCompaniesMap(cMap);

      const uMap: Record<string, UserResponseDto> = {};
      usersData.forEach((u) => (uMap[u.id] = u));
      setUsersMap(uMap);

      // Default label for closing period
      const today = new Date();
      const monthNames = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];
      const curMonth = monthNames[today.getMonth()];
      const nextMonth = monthNames[(today.getMonth() + 1) % 12];
      setClosePeriodLabel(`${curMonth} 10, ${today.getFullYear()} – ${nextMonth} 9, ${today.getFullYear()}`);
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [etbRate, toast]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPayrollData();
  };

  const handleCloseCycle = async () => {
    setIsClosingCycle(true);
    try {
      await payrollService.closeCycle({
        periodLabel: closePeriodLabel,
        etbRate,
        paidOn: new Date().toISOString().split("T")[0],
      });
      toast.success(
        `Payroll cycle "${closePeriodLabel}" marked paid and archived`,
        201
      );
      setIsCloseModalOpen(false);
      fetchPayrollData();
    } catch (err: unknown) {
      toast.handleApiError(err);
    } finally {
      setIsClosingCycle(false);
    }
  };

  // Derive itemized financial totals from approved tasks if not pre-aggregated by backend
  const calculatedTotalUsd =
    currentPayroll?.totalUsd && currentPayroll.totalUsd > 0
      ? currentPayroll.totalUsd
      : approvedTasks.reduce(
          (sum, t) => sum + (t.rateLockedUsd ?? t.defaultRateUsd ?? 0),
          0
        );

  const calculatedTotalEtb =
    currentPayroll?.totalEtb && currentPayroll.totalEtb > 0
      ? currentPayroll.totalEtb
      : calculatedTotalUsd * etbRate;

  // Group approved tasks by assigned staff creator
  const staffBreakdown = approvedTasks.reduce<
    Record<
      string,
      {
        staffName: string;
        staffEmail: string;
        tasks: Task[];
        totalUsd: number;
        totalEtb: number;
      }
    >
  >((acc, task) => {
    const staffId = task.assignedToId || "unassigned";
    const user = task.assignedTo || usersMap[staffId];
    const staffName = user?.name || "Assigned Creator";
    const staffEmail = user?.email || "";
    const rate = task.rateLockedUsd ?? task.defaultRateUsd ?? 0;

    if (!acc[staffId]) {
      acc[staffId] = {
        staffName,
        staffEmail,
        tasks: [],
        totalUsd: 0,
        totalEtb: 0,
      };
    }

    acc[staffId].tasks.push(task);
    acc[staffId].totalUsd += rate;
    acc[staffId].totalEtb += rate * etbRate;

    return acc;
  }, {});

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-sm transition-colors">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="text-xs font-bold text-brand-primary dark:text-brand-accent uppercase tracking-wider">
              Financial Disbursements &amp; 10th-of-Month Cycle
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
            Payroll Management
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
            Live compensation totals strictly derived from approved task deliverables locked into the current 10th-of-the-month billing cycle.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* ETB Rate Control */}
          <div className="flex items-center gap-2 p-2 rounded-xl bg-bg-app border border-border-subtle text-xs">
            <span className="font-bold text-gray-400 uppercase text-[10px]">
              1 USD =
            </span>
            <input
              type="number"
              min="1"
              value={etbRate}
              onChange={(e) => setEtbRate(parseFloat(e.target.value) || 130)}
              className="w-16 h-7 px-2 font-mono font-bold text-text-primary rounded-lg bg-bg-surface border border-border-subtle outline-none text-xs text-center"
              title="Exchange Rate USD to ETB"
            />
            <span className="font-bold text-text-primary text-xs">ETB</span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-3 rounded-xl border border-border-subtle text-gray-500 hover:text-text-primary hover:bg-border-subtle/50 transition-colors flex items-center gap-2 text-xs font-bold cursor-pointer disabled:opacity-50 min-h-[44px]"
            title="Refresh live payroll"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand-accent" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {calculatedTotalUsd > 0 && (
            <button
              onClick={() => setIsCloseModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-brand-primary hover:bg-brand-accent text-white hover:text-brand-primary font-bold text-xs tracking-wide shadow-md transition-all flex items-center gap-2 cursor-pointer min-h-[44px]"
            >
              <Lock className="w-4 h-4" />
              <span>Close &amp; Mark Paid</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Backend Message Status Banner */}
      {currentPayroll?.message && (
        <div className="p-4 rounded-2xl bg-bg-surface border border-border-subtle shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary dark:text-brand-accent flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-brand-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-mono">
              Cycle Status Message
            </span>
            <p className="text-xs sm:text-sm font-semibold text-text-primary leading-relaxed truncate">
              {currentPayroll.message}
            </p>
          </div>
        </div>
      )}

      {/* Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total USD Payout
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight mt-1 font-mono">
              {loading ? (
                <div className="h-9 w-24 bg-border-subtle animate-pulse rounded" />
              ) : (
                `$${calculatedTotalUsd.toFixed(2)}`
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Open 10th-of-month cycle</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Equivalent in ETB
            </span>
            <div className="text-3xl font-extrabold text-text-primary tracking-tight mt-1 font-mono">
              {loading ? (
                <div className="h-9 w-32 bg-border-subtle animate-pulse rounded" />
              ) : (
                `${calculatedTotalEtb.toLocaleString(undefined, { maximumFractionDigits: 2 })} ETB`
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Applied rate: 1 USD = {etbRate} ETB</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-brand-primary text-brand-accent flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-bg-surface rounded-2xl border border-border-subtle p-6 shadow-sm flex items-center justify-between hover:-translate-y-0.5 transition-all">
          <div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Approved Deliverables
            </span>
            <div className="text-3xl font-extrabold text-text-primary tracking-tight mt-1">
              {loading ? (
                <div className="h-9 w-12 bg-border-subtle animate-pulse rounded" />
              ) : (
                <AnimatedCounter value={approvedTasks.length} />
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Greenlit for billing</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-bg-app border border-border-subtle text-gray-500 flex items-center justify-center">
            <FileCheck className="w-6 h-6 text-brand-accent" />
          </div>
        </div>
      </div>

      {/* Tabs: Active Cycle Breakdown vs Archived History */}
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        <button
          onClick={() => setActiveTab("CURRENT")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "CURRENT"
              ? "bg-brand-primary text-white shadow-sm"
              : "text-gray-400 hover:text-text-primary hover:bg-border-subtle/50"
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Active Cycle Breakdown ({approvedTasks.length} Deliverables)</span>
        </button>

        <button
          onClick={() => setActiveTab("HISTORY")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === "HISTORY"
              ? "bg-brand-primary text-white shadow-sm"
              : "text-gray-400 hover:text-text-primary hover:bg-border-subtle/50"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Archived Payroll Cycles ({payrollHistory.length})</span>
        </button>
      </div>

      {/* Active Tab View: Current Cycle Itemized & Staff Breakdown */}
      {activeTab === "CURRENT" && (
        <div className="space-y-6">
          {/* Creator Payout Summaries Card */}
          <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
              <div>
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  Staff Payout Summaries
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Earnings grouped by creator based on locked task rates.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-gray-400">
                {Object.keys(staffBreakdown).length} Creators
              </span>
            </div>

            {Object.keys(staffBreakdown).length === 0 ? (
              <div className="py-12 text-center text-gray-400 space-y-2">
                <Wallet className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
                <p className="text-sm font-semibold text-text-primary">
                  No approved tasks in active cycle
                </p>
                <p className="text-xs text-gray-500">
                  When tasks are approved by admin, their locked payout rates automatically populate here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(staffBreakdown).map(([staffId, s]) => (
                  <div
                    key={staffId}
                    className="p-4 rounded-xl bg-bg-app border border-border-subtle space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-primary text-brand-accent font-bold text-xs flex items-center justify-center shrink-0">
                        {s.staffName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-text-primary text-sm truncate">
                          {s.staffName}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate font-mono">
                          {s.staffEmail || "Staff Creator"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border-subtle/50 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase block">
                          Tasks
                        </span>
                        <span className="text-xs font-bold text-text-primary">
                          {s.tasks.length} Approved
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 block">
                          ${s.totalUsd.toFixed(2)} USD
                        </span>
                        <span className="text-[10px] text-gray-400 font-mono block">
                          {s.totalEtb.toLocaleString()} ETB
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Itemized Tasks Table */}
          <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text-primary tracking-tight">
                  Itemized Task Deliverables
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Single source of truth linking every payout back to its source task deliverable.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-gray-400">
                {approvedTasks.length} Items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead className="bg-bg-surface border-b border-border-subtle text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <tr>
                    <th className="py-3.5 px-6">Task Title</th>
                    <th className="py-3.5 px-6">Client Company</th>
                    <th className="py-3.5 px-6">Creator</th>
                    <th className="py-3.5 px-6">Posting Date</th>
                    <th className="py-3.5 px-6 text-right">Locked Rate (USD)</th>
                    <th className="py-3.5 px-6 text-right">Equivalent (ETB)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-xs">
                  {approvedTasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                        No approved tasks in the current billing cycle.
                      </td>
                    </tr>
                  ) : (
                    approvedTasks.map((t) => {
                      const comp = t.company || companiesMap[t.companyId];
                      const user = t.assignedTo || usersMap[t.assignedToId];
                      const rate = t.rateLockedUsd ?? t.defaultRateUsd ?? 0;

                      return (
                        <tr key={t.id} className="hover:bg-border-subtle/30 transition-colors">
                          <td className="py-3.5 px-6 font-bold text-text-primary">
                            {t.title}
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap text-gray-500">
                            {comp?.companyName || "Client"}
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap text-text-primary font-medium">
                            {user?.name || "Creator"}
                          </td>
                          <td className="py-3.5 px-6 whitespace-nowrap font-mono text-gray-400">
                            {t.postingDate}
                          </td>
                          <td className="py-3.5 px-6 text-right whitespace-nowrap font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ${Number(rate).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-6 text-right whitespace-nowrap font-mono text-text-primary">
                            {(rate * etbRate).toLocaleString()} ETB
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* History Tab: Archived Closed Cycles */}
      {activeTab === "HISTORY" && (
        <div className="bg-bg-surface rounded-2xl border border-border-subtle shadow-sm overflow-hidden p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between pb-4 border-b border-border-subtle">
            <div>
              <h3 className="text-base font-bold text-text-primary tracking-tight">
                Paid &amp; Archived Payroll Cycles
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Permanent records of closed billing periods and disbursement history.
              </p>
            </div>
          </div>

          {payrollHistory.length === 0 ? (
            <div className="py-12 text-center text-gray-400 space-y-2">
              <History className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-sm font-semibold text-text-primary">
                No archived cycles yet
              </p>
              <p className="text-xs text-gray-500">
                When you close and mark the active cycle paid, it will be archived here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {payrollHistory.map((cycle) => (
                <div
                  key={cycle.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <p className="font-bold text-text-primary text-sm">
                      {cycle.periodLabel}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                      <span>Paid On: {cycle.paidOn}</span>
                      <span>•</span>
                      <span>Rate: 1 USD = {cycle.etbRate} ETB</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400 block">
                      ${Number(cycle.totalUsd).toFixed(2)} USD
                    </span>
                    <span className="font-mono text-xs text-gray-400 block">
                      {Number(cycle.totalEtb).toLocaleString()} ETB
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Close Cycle Confirmation Modal */}
      <ConfirmationModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        onConfirm={handleCloseCycle}
        title="Close &amp; Mark Payroll Cycle Paid"
        message={`Are you ready to mark cycle "${closePeriodLabel}" paid for $${calculatedTotalUsd.toFixed(2)} USD (${calculatedTotalEtb.toLocaleString()} ETB)? This locks all ${approvedTasks.length} approved deliverables and resets the active payout to $0.`}
        warningNote="Closed cycles are permanently archived and cannot be reopened."
        confirmText="Confirm & Archive Cycle"
        confirmVariant="warning"
        isLoading={isClosingCycle}
      />
    </div>
  );
}
