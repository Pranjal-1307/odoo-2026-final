import { apiClient } from './api';
import type {
  DashboardData,
  EmployeeDashboardData,
  PendingAlertItem,
  PayrollTrendItem,
  DepartmentPayrollItem
} from '../types';

export interface DashboardFilterParams {
  period?: string;
  department?: string;
}

export const dashboardService = {
  // 1. Get Aggregated Company Operations & Payroll Dashboard
  getDashboard: async (params?: DashboardFilterParams): Promise<DashboardData> => {
    const res = await apiClient.get<DashboardData>('/dashboard', { params });
    return res.data;
  },

  // 2. Get Employee Self-Service Personal Dashboard
  getEmployeeDashboard: async (): Promise<EmployeeDashboardData> => {
    const res = await apiClient.get<EmployeeDashboardData>('/dashboard/employee');
    return res.data;
  },

  // 3. Get Available Periods for Filtering
  getAvailablePeriods: async (): Promise<string[]> => {
    const res = await apiClient.get<string[]>('/dashboard/periods');
    return res.data;
  },

  // 4. Get Pending Actionable Alerts
  getAlerts: async (): Promise<PendingAlertItem[]> => {
    const res = await apiClient.get<PendingAlertItem[]>('/dashboard/alerts');
    return res.data;
  },

  // 5. Get 6-Month Historical Trend
  getPayrollTrend: async (): Promise<PayrollTrendItem[]> => {
    const res = await apiClient.get<PayrollTrendItem[]>('/dashboard/payroll-trend');
    return res.data;
  },

  // 6. Get Department Distribution
  getDepartmentDistribution: async (): Promise<DepartmentPayrollItem[]> => {
    const res = await apiClient.get<DepartmentPayrollItem[]>('/dashboard/department-distribution');
    return res.data;
  }
};
