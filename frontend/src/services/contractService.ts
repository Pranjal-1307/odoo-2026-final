import { apiClient } from './api';
import type { Contract } from '../types';

export interface ContractFilters {
  search?: string;
  employee_id?: number;
  department?: string;
  status?: string;
  working_schedule_id?: number;
  salary_structure_id?: number;
  start_date?: string;
  end_date?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ContractListResponse {
  items: Contract[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  running_count: number;
  draft_count: number;
  expired_count: number;
  terminated_count: number;
}

export interface ContractOptionEmployee {
  id: number;
  name: string;
  employee_code: string;
  department: string;
  job_position: string;
  working_schedule_id?: number;
}

export interface ContractOptionStructure {
  id: number;
  name: string;
  code: string;
}

export interface ContractOptionSchedule {
  id: number;
  name: string;
  hours_per_week: number;
}

export interface ContractOptionsResponse {
  employees: ContractOptionEmployee[];
  salary_structures: ContractOptionStructure[];
  working_schedules: ContractOptionSchedule[];
  departments: string[];
  job_positions: string[];
}

export interface CreateContractPayload {
  contract_code?: string;
  name: string;
  employee_id: number;
  department?: string;
  job_position?: string;
  start_date: string;
  end_date?: string | null;
  wage_per_month: number;
  status?: string;
  working_schedule_id?: number | null;
  salary_structure_id: number;
  notes?: string;
}

export interface UpdateContractPayload {
  name?: string;
  employee_id?: number;
  department?: string;
  job_position?: string;
  start_date?: string;
  end_date?: string | null;
  wage_per_month?: number;
  status?: string;
  working_schedule_id?: number | null;
  salary_structure_id?: number;
  notes?: string;
}

export interface ApplicableContractResult {
  has_applicable_contract: boolean;
  contract: Contract | null;
  warning_type: string | null;
  message: string | null;
}

export const contractService = {
  // List contracts with filters and pagination
  getContracts: async (params?: ContractFilters): Promise<ContractListResponse> => {
    const response = await apiClient.get<ContractListResponse>('/contracts', { params });
    return response.data;
  },

  // Get single contract details
  getContract: async (id: number): Promise<Contract> => {
    const response = await apiClient.get<Contract>(`/contracts/${id}`);
    return response.data;
  },

  // Create contract
  createContract: async (payload: CreateContractPayload): Promise<Contract> => {
    const response = await apiClient.post<Contract>('/contracts', payload);
    return response.data;
  },

  // Update contract
  updateContract: async (id: number, payload: UpdateContractPayload): Promise<Contract> => {
    const response = await apiClient.put<Contract>(`/contracts/${id}`, payload);
    return response.data;
  },

  // Delete contract
  deleteContract: async (id: number): Promise<void> => {
    await apiClient.delete(`/contracts/${id}`);
  },

  // Activate draft contract
  activateContract: async (id: number): Promise<Contract> => {
    const response = await apiClient.post<Contract>(`/contracts/${id}/activate`);
    return response.data;
  },

  // Cancel running contract
  cancelContract: async (id: number): Promise<Contract> => {
    const response = await apiClient.post<Contract>(`/contracts/${id}/cancel`);
    return response.data;
  },

  // Get dropdown options
  getContractOptions: async (): Promise<ContractOptionsResponse> => {
    const response = await apiClient.get<ContractOptionsResponse>('/contracts/options');
    return response.data;
  },

  // Lookup applicable contract for payroll period
  getApplicableContract: async (
    employeeId: number,
    periodStart: string,
    periodEnd: string
  ): Promise<ApplicableContractResult> => {
    const response = await apiClient.get<ApplicableContractResult>('/contracts/applicable', {
      params: {
        employee_id: employeeId,
        period_start: periodStart,
        period_end: periodEnd,
      },
    });
    return response.data;
  },
};
