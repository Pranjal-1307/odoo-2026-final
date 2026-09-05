import api from './api';
import type { Employee } from '../types';

export interface EmployeeListParams {
  search?: string;
  status?: string;
  department?: string;
  job_position?: string;
  company?: string;
  working_schedule_id?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  skip?: number;
  limit?: number;
}

export interface EmployeeListResponse {
  total: number;
  active_count: number;
  inactive_count: number;
  items: Employee[];
}

export interface EmployeeOptions {
  managers: Array<{
    id: number;
    name: string;
    employee_code?: string;
    department?: string;
    job_position?: string;
  }>;
  departments: string[];
  job_positions: string[];
  companies: string[];
  working_schedules: Array<{
    id: number;
    name: string;
    hours_per_week: number;
  }>;
}

export const employeeService = {
  // 1. Get employees list with search, filter, pagination
  getEmployees: async (params?: EmployeeListParams): Promise<EmployeeListResponse> => {
    const response = await api.get<EmployeeListResponse>('/employees', { params });
    return response.data;
  },

  // 2. Get detailed employee by ID with smart button counts
  getEmployee: async (id: number): Promise<Employee> => {
    const response = await api.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  // 3. Create new employee
  createEmployee: async (data: Partial<Employee>): Promise<Employee> => {
    const response = await api.post<Employee>('/employees', data);
    return response.data;
  },

  // 4. Update employee
  updateEmployee: async (id: number, data: Partial<Employee>): Promise<Employee> => {
    const response = await api.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  // 5. Soft-activate or deactivate employee
  updateEmployeeStatus: async (id: number, status: 'active' | 'inactive'): Promise<Employee> => {
    const response = await api.patch<Employee>(`/employees/${id}/status`, { status });
    return response.data;
  },

  // 6. Delete employee (or returns dependency protection error)
  deleteEmployee: async (id: number): Promise<{ message: string }> => {
    const response = await api.delete<{ message: string }>(`/employees/${id}`);
    return response.data;
  },

  // 7. Get dropdown options for forms
  getOptions: async (): Promise<EmployeeOptions> => {
    const response = await api.get<EmployeeOptions>('/employees/options');
    return response.data;
  }
};
