import { apiClient } from './api';
import type {
  SalaryStructure,
  SalaryStructureCreatePayload,
  SalaryStructureUpdatePayload,
  SalaryStructureListResponse,
  SalaryRule,
  SalaryRuleCreatePayload,
  SalaryRuleUpdatePayload,
  SalaryRuleListResponse,
  SalaryPreviewRequest,
  SalaryPreviewResponse,
  LiveComputationRequest,
} from '../types/salaryStructure';

export const salaryStructureService = {
  // Structures
  listStructures: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    active?: boolean;
    pay_frequency?: string;
  }): Promise<SalaryStructureListResponse> => {
    const response = await apiClient.get('/payroll/salary-structures', { params });
    return response.data;
  },

  getStructure: async (id: number): Promise<SalaryStructure> => {
    const response = await apiClient.get(`/payroll/salary-structures/${id}`);
    return response.data;
  },

  createStructure: async (payload: SalaryStructureCreatePayload): Promise<SalaryStructure> => {
    const response = await apiClient.post('/payroll/salary-structures', payload);
    return response.data;
  },

  updateStructure: async (id: number, payload: SalaryStructureUpdatePayload): Promise<SalaryStructure> => {
    const response = await apiClient.put(`/payroll/salary-structures/${id}`, payload);
    return response.data;
  },

  toggleStructureStatus: async (id: number, active: boolean): Promise<SalaryStructure> => {
    const response = await apiClient.patch(`/payroll/salary-structures/${id}/status`, { active });
    return response.data;
  },

  deleteStructure: async (id: number): Promise<void> => {
    await apiClient.delete(`/payroll/salary-structures/${id}`);
  },

  // Preview simulation
  previewStructure: async (id: number, payload: SalaryPreviewRequest): Promise<SalaryPreviewResponse> => {
    const response = await apiClient.post(`/payroll/salary-structures/${id}/preview`, payload);
    return response.data;
  },

  previewLiveComputation: async (payload: LiveComputationRequest): Promise<SalaryPreviewResponse> => {
    const response = await apiClient.post('/payroll/salary-structures/preview-computation', payload);
    return response.data;
  },

  // Rules
  listRules: async (params?: {
    page?: number;
    limit?: number;
    structure_id?: number;
    category?: string;
    computation_type?: string;
    search?: string;
    active?: boolean;
  }): Promise<SalaryRuleListResponse> => {
    const response = await apiClient.get('/payroll/salary-rules', { params });
    return response.data;
  },

  getRule: async (id: number): Promise<SalaryRule> => {
    const response = await apiClient.get(`/payroll/salary-rules/${id}`);
    return response.data;
  },

  createRule: async (payload: SalaryRuleCreatePayload): Promise<SalaryRule> => {
    const response = await apiClient.post('/payroll/salary-rules', payload);
    return response.data;
  },

  updateRule: async (id: number, payload: SalaryRuleUpdatePayload): Promise<SalaryRule> => {
    const response = await apiClient.put(`/payroll/salary-rules/${id}`, payload);
    return response.data;
  },

  toggleRuleStatus: async (id: number): Promise<SalaryRule> => {
    const response = await apiClient.patch(`/payroll/salary-rules/${id}/status`);
    return response.data;
  },

  deleteRule: async (id: number): Promise<void> => {
    await apiClient.delete(`/payroll/salary-rules/${id}`);
  },

  reorderRules: async (rules: { id: number; sequence: number }[]): Promise<void> => {
    await apiClient.post('/payroll/salary-rules/reorder', { rules });
  },
};
