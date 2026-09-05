import { apiClient } from './api';

export interface AuditLogItem {
  id: number;
  company: string;
  actor_id?: number | null;
  actor_name?: string | null;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  entity_code?: string | null;
  old_value?: Record<string, any> | null;
  new_value?: Record<string, any> | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}

export interface AuditLogListResponse {
  total: number;
  items: AuditLogItem[];
  actions: string[];
  entity_types: string[];
}

export interface IntegrationIssue {
  category: string;
  severity: 'blocking_error' | 'warning' | 'info';
  code: string;
  title: string;
  message: string;
  entity_type: string;
  entity_id?: number | null;
  entity_name?: string | null;
  suggested_action: string;
}

export interface IntegrationHealthResponse {
  company: string;
  checked_at: string;
  status: 'healthy' | 'warnings' | 'critical';
  total_checks: number;
  passed_checks: number;
  failed_checks: number;
  issues: IntegrationIssue[];
  summary: {
    active_employees: number;
    active_structures: number;
    active_payruns: number;
    issues_count: number;
  };
}

export interface AuditLogQueryParams {
  company?: string;
  action?: string;
  entity_type?: string;
  entity_id?: number;
  actor_id?: number;
  search?: string;
  start_date?: string;
  end_date?: string;
  skip?: number;
  limit?: number;
}

export const auditService = {
  async getAuditLogs(params?: AuditLogQueryParams): Promise<AuditLogListResponse> {
    const res = await apiClient.get<AuditLogListResponse>('/audit-logs', { params });
    return res.data;
  },

  async getIntegrationHealth(company: string = 'PeoplePay360 Inc.'): Promise<IntegrationHealthResponse> {
    const res = await apiClient.get<IntegrationHealthResponse>('/integration/health-check', {
      params: { company },
    });
    return res.data;
  },
};
