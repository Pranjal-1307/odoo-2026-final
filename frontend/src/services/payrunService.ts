import { apiClient } from './api';
import type {
  Payrun,
  PayrunEmployee,
  PayrunEligibilityResponse,
  PayrunValidationResponse,
  PayrunStatusResponse,
} from '../types';

export interface PayrunListParams {
  company?: string;
  status?: string;
  search?: string;
  skip?: number;
  limit?: number;
}

export interface PayrunListResult {
  items: Payrun[];
  total: number;
}

export interface PayrunCreatePayload {
  name: string;
  company?: string;
  period_start: string;
  period_end: string;
  employee_type?: string;
  salary_structure_id?: number;
  selected_employee_ids?: number[];
}

export interface PayrunUpdatePayload {
  name?: string;
  period_start?: string;
  period_end?: string;
  employee_type?: string;
}

export const payrunService = {
  // 1. List Payruns
  listPayruns: async (params?: PayrunListParams): Promise<PayrunListResult> => {
    const res = await apiClient.get<PayrunListResult>('/payroll/payruns', { params });
    return res.data;
  },

  // 2. Get Payrun Detail
  getPayrun: async (id: number): Promise<Payrun> => {
    const res = await apiClient.get<Payrun>(`/payroll/payruns/${id}`);
    return res.data;
  },

  // 3. Create Payrun (Draft)
  createPayrun: async (payload: PayrunCreatePayload): Promise<Payrun> => {
    const res = await apiClient.post<Payrun>('/payroll/payruns', payload);
    return res.data;
  },

  // 4. Update Draft Payrun Metadata
  updateDraftPayrun: async (id: number, payload: PayrunUpdatePayload): Promise<Payrun> => {
    const res = await apiClient.put<Payrun>(`/payroll/payruns/${id}`, payload);
    return res.data;
  },

  // 5. Query Eligible Employees for Wizard
  getEligibleEmployees: async (
    company: string,
    period_start: string,
    period_end: string,
    employee_type: string = 'All',
    salary_structure_id?: number
  ): Promise<PayrunEligibilityResponse> => {
    const res = await apiClient.get<PayrunEligibilityResponse>('/payroll/payruns/eligible-employees', {
      params: {
        company,
        period_start,
        period_end,
        employee_type,
        salary_structure_id,
      },
    });
    return res.data;
  },

  // 6. Update Employee Selection / Exclusions
  updateEmployeeSelection: async (
    id: number,
    employee_ids: number[],
    exclusion_reasons?: Record<number, string>
  ): Promise<Payrun> => {
    const res = await apiClient.post<Payrun>(`/payroll/payruns/${id}/employees`, {
      employee_ids,
      exclusion_reasons,
    });
    return res.data;
  },

  // 7. Pre-processing Validation
  validatePayrun: async (id: number): Promise<PayrunValidationResponse> => {
    const res = await apiClient.post<PayrunValidationResponse>(`/payroll/payruns/${id}/validate`);
    return res.data;
  },

  // 8. Process Payroll (Batch calculation)
  processPayrun: async (id: number): Promise<Payrun> => {
    const res = await apiClient.post<Payrun>(`/payroll/payruns/${id}/process`);
    return res.data;
  },

  // 9. Get Processing Status
  getPayrunStatus: async (id: number): Promise<PayrunStatusResponse> => {
    const res = await apiClient.get<PayrunStatusResponse>(`/payroll/payruns/${id}/status`);
    return res.data;
  },

  // 10. Recalculate Single Employee
  recalculateEmployee: async (id: number, employee_id: number): Promise<any> => {
    const res = await apiClient.post(`/payroll/payruns/${id}/employees/${employee_id}/recalculate`);
    return res.data;
  },

  // 11. Get Single Employee Calculation Trace & Details
  getEmployeeCalculationDetail: async (id: number, employee_id: number): Promise<PayrunEmployee> => {
    const res = await apiClient.get<PayrunEmployee>(`/payroll/payruns/${id}/employees/${employee_id}`);
    return res.data;
  },

  // 12. Finalize Payrun (Generate Payslips & Lock)
  finalizePayrun: async (id: number): Promise<Payrun> => {
    const res = await apiClient.post<Payrun>(`/payroll/payruns/${id}/finalize`);
    return res.data;
  },

  // 13. Cancel Payrun
  cancelPayrun: async (id: number): Promise<Payrun> => {
    const res = await apiClient.post<Payrun>(`/payroll/payruns/${id}/cancel`);
    return res.data;
  },

  // 14. Delete Draft Payrun
  deletePayrun: async (id: number): Promise<void> => {
    await apiClient.delete(`/payroll/payruns/${id}`);
  },
};

export default payrunService;
