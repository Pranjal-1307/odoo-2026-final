import { apiClient } from './api';
import type {
  TimeOffType,
  TimeOffTypeCreate,
  TimeOffTypeUpdate,
  TimeOffAllocation,
  TimeOffAllocationCreate,
  TimeOffAllocationUpdate,
  TimeOffRequest,
  TimeOffRequestCreate,
  TimeOffRequestUpdate,
  DurationCalculateRequest,
  DurationCalculateResponse,
  EmployeeLeaveBalancesResponse,
  TimeOffOverview
} from '../types';

export interface TimeOffRequestQueryParams {
  employee_id?: number;
  type_id?: number;
  status_filter?: string;
  date_from?: string;
  date_to?: string;
  department?: string;
  search?: string;
  my_requests_only?: boolean;
}

export interface TimeOffAllocationQueryParams {
  employee_id?: number;
  type_id?: number;
  status_filter?: string;
}

export const timeOffService = {
  // --- Overview & Dashboard ---
  getOverview: async (): Promise<TimeOffOverview> => {
    const response = await apiClient.get('/time-off/overview');
    return response.data;
  },

  // --- Types ---
  getTypes: async (activeOnly: boolean = false): Promise<TimeOffType[]> => {
    const response = await apiClient.get('/time-off/types', {
      params: { active_only: activeOnly }
    });
    return response.data;
  },

  getType: async (id: number): Promise<TimeOffType> => {
    const response = await apiClient.get(`/time-off/types/${id}`);
    return response.data;
  },

  createType: async (data: TimeOffTypeCreate): Promise<TimeOffType> => {
    const response = await apiClient.post('/time-off/types', data);
    return response.data;
  },

  updateType: async (id: number, data: TimeOffTypeUpdate): Promise<TimeOffType> => {
    const response = await apiClient.put(`/time-off/types/${id}`, data);
    return response.data;
  },

  toggleTypeActive: async (id: number): Promise<TimeOffType> => {
    const response = await apiClient.patch(`/time-off/types/${id}/toggle-active`);
    return response.data;
  },

  // --- Allocations ---
  getAllocations: async (params?: TimeOffAllocationQueryParams): Promise<TimeOffAllocation[]> => {
    const response = await apiClient.get('/time-off/allocations', { params });
    return response.data;
  },

  getAllocation: async (id: number): Promise<TimeOffAllocation> => {
    const response = await apiClient.get(`/time-off/allocations/${id}`);
    return response.data;
  },

  createAllocation: async (data: TimeOffAllocationCreate): Promise<TimeOffAllocation> => {
    const response = await apiClient.post('/time-off/allocations', data);
    return response.data;
  },

  updateAllocation: async (id: number, data: TimeOffAllocationUpdate): Promise<TimeOffAllocation> => {
    const response = await apiClient.put(`/time-off/allocations/${id}`, data);
    return response.data;
  },

  approveAllocation: async (id: number): Promise<TimeOffAllocation> => {
    const response = await apiClient.post(`/time-off/allocations/${id}/approve`);
    return response.data;
  },

  refuseAllocation: async (id: number): Promise<TimeOffAllocation> => {
    const response = await apiClient.post(`/time-off/allocations/${id}/refuse`);
    return response.data;
  },

  // --- Requests ---
  getRequests: async (params?: TimeOffRequestQueryParams): Promise<TimeOffRequest[]> => {
    const response = await apiClient.get('/time-off/requests', { params });
    return response.data;
  },

  getRequest: async (id: number): Promise<TimeOffRequest> => {
    const response = await apiClient.get(`/time-off/requests/${id}`);
    return response.data;
  },

  createRequest: async (data: TimeOffRequestCreate): Promise<TimeOffRequest> => {
    const response = await apiClient.post('/time-off/requests', data);
    return response.data;
  },

  updateRequest: async (id: number, data: TimeOffRequestUpdate): Promise<TimeOffRequest> => {
    const response = await apiClient.put(`/time-off/requests/${id}`, data);
    return response.data;
  },

  approveRequest: async (id: number, approvalReason?: string): Promise<TimeOffRequest> => {
    const response = await apiClient.post(`/time-off/requests/${id}/approve`, {
      approval_reason: approvalReason
    });
    return response.data;
  },

  refuseRequest: async (id: number, refusalReason?: string): Promise<TimeOffRequest> => {
    const response = await apiClient.post(`/time-off/requests/${id}/refuse`, {
      refusal_reason: refusalReason
    });
    return response.data;
  },

  cancelRequest: async (id: number): Promise<TimeOffRequest> => {
    const response = await apiClient.post(`/time-off/requests/${id}/cancel`);
    return response.data;
  },

  calculateDuration: async (data: DurationCalculateRequest): Promise<DurationCalculateResponse> => {
    const response = await apiClient.post('/time-off/requests/calculate-duration', data);
    return response.data;
  },

  // --- Balances ---
  getBalances: async (employeeId?: number): Promise<EmployeeLeaveBalancesResponse> => {
    const response = await apiClient.get('/time-off/balances', {
      params: employeeId ? { employee_id: employeeId } : undefined
    });
    return response.data;
  }
};
