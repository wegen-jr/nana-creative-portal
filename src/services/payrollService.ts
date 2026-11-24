import apiClient from "./apiClient";
import {
  ClosePayrollCycleDto,
  CurrentPayrollCycleResponse,
  PayrollCycle,
} from "@/types/api.types";

/**
 * Payroll Service strictly consuming Swagger /payroll endpoints:
 * - GET /payroll/current (live open cycle summary with staff & client totals)
 * - POST /payroll/close (mark cycle paid, lock tasks, reset payout to $0)
 * - GET /payroll/history (list all archived/paid payroll cycles)
 * - GET /payroll/{id} (get itemized archive cycle by ID)
 */
export const payrollService = {
  /**
   * Get current open cycle payout summary
   */
  async getCurrentCycle(etbRate?: number): Promise<CurrentPayrollCycleResponse> {
    const response = await apiClient.get<CurrentPayrollCycleResponse>(
      "/payroll/current",
      {
        params: etbRate ? { etbRate } : undefined,
      }
    );
    return response.data;
  },

  /**
   * Close current payroll cycle (Admin only)
   */
  async closeCycle(dto: ClosePayrollCycleDto): Promise<PayrollCycle> {
    const response = await apiClient.post<PayrollCycle>("/payroll/close", dto);
    return response.data;
  },

  /**
   * Get all archived payroll cycles (Admin only)
   */
  async getPayrollHistory(): Promise<PayrollCycle[]> {
    const response = await apiClient.get<PayrollCycle[]>("/payroll/history");
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Get specific archived payroll cycle with itemized tasks (Admin only)
   */
  async getCycleById(id: string): Promise<PayrollCycle> {
    const response = await apiClient.get<PayrollCycle>(`/payroll/${id}`);
    return response.data;
  },
};

export default payrollService;
