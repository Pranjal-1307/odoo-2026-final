import { apiClient } from './api';
import type {
   Payslip,
   PayslipSummaryMetrics,
 } from '../types';

export interface PayslipListParams {
  employee_id?: number;
  period_start?: string;
  period_end?: string;
  status?: string;
  payrun_id?: number;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface PayslipListResult {
  items: Payslip[];
  total: number;
  skip: number;
  limit: number;
}

export interface PayslipCreatePayload {
  employee_id: number;
  payrun_id?: number;
  contract_id?: number;
  period_start: string;
  period_end: string;
  auto_compute?: boolean;
}

export const payslipService = {
  // 1. List Payslips with filtering & search
  listPayslips: async (params?: PayslipListParams): Promise<PayslipListResult> => {
    const res = await apiClient.get<PayslipListResult>('/payroll/payslips', { params });
    return res.data;
  },

  // 2. Get Employee's own finalized payslips (Self-service)
  getMyPayslips: async (): Promise<Payslip[]> => {
    const res = await apiClient.get<Payslip[]>('/payroll/payslips/my-payslips');
    return res.data;
  },

  // 3. Get Payslip Detail
  getPayslip: async (id: number): Promise<Payslip> => {
    const res = await apiClient.get<Payslip>(`/payroll/payslips/${id}`);
    return res.data;
  },

  // 4. Create Standalone / Manual Payslip
  createPayslip: async (payload: PayslipCreatePayload): Promise<Payslip> => {
    const res = await apiClient.post<Payslip>('/payroll/payslips', payload);
    return res.data;
  },

  // 5. Compute Payslip
  computePayslip: async (id: number): Promise<Payslip> => {
    const res = await apiClient.post<Payslip>(`/payroll/payslips/${id}/compute`);
    return res.data;
  },

  // 6. Recompute Payslip
  recomputePayslip: async (id: number): Promise<Payslip> => {
    const res = await apiClient.post<Payslip>(`/payroll/payslips/${id}/recompute`);
    return res.data;
  },

  // 7. Finalize & Lock Payslip
  finalizePayslip: async (id: number): Promise<Payslip> => {
    const res = await apiClient.post<Payslip>(`/payroll/payslips/${id}/finalize`);
    return res.data;
  },

  // 8. Cancel Payslip
  cancelPayslip: async (id: number): Promise<Payslip> => {
    const res = await apiClient.post<Payslip>(`/payroll/payslips/${id}/cancel`);
    return res.data;
  },

  // 9. Get Summary Metrics for Dashboard / Header Cards
  getSummaryMetrics: async (): Promise<PayslipSummaryMetrics> => {
    const res = await apiClient.get<PayslipSummaryMetrics>('/payroll/payslips/summary');
    return res.data;
  },
};
