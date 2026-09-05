import { apiClient } from './api';
import type {
  Payslip,
  PayslipDocument,
  PayslipEmailLog,
  SendPayslipEmailResponse,
  BulkEmailPayrunResult,
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

export interface SendPayslipEmailPayload {
  recipient_email?: string;
  subject?: string;
  custom_message?: string;
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

  // ==========================================
  // MODULE 11: PDF GENERATION & DOWNLOAD
  // ==========================================

  // 10. Generate / Regenerate Official PDF Document
  generatePdf: async (id: number, forceRegenerate: boolean = false): Promise<PayslipDocument> => {
    const res = await apiClient.post<PayslipDocument>(
      `/payroll/payslips/${id}/generate-pdf`,
      null,
      { params: { force_regenerate: forceRegenerate } }
    );
    return res.data;
  },

  // 11. Fetch PDF Blob for Preview or Download
  getPdfBlob: async (id: number): Promise<Blob> => {
    const res = await apiClient.get(`/payroll/payslips/${id}/pdf`, {
      responseType: 'blob',
    });
    return res.data;
  },

  // 12. Trigger browser download of PDF
  downloadPdfFile: async (id: number, filename?: string): Promise<void> => {
    const blob = await payslipService.getPdfBlob(id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `Payslip_${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // ==========================================
  // MODULE 11: EMAIL DELIVERY & HISTORY
  // ==========================================

  // 13. Send Payslip Email
  sendEmail: async (
    id: number,
    payload?: SendPayslipEmailPayload
  ): Promise<SendPayslipEmailResponse> => {
    const res = await apiClient.post<SendPayslipEmailResponse>(
      `/payroll/payslips/${id}/email`,
      payload || {}
    );
    return res.data;
  },

  // 14. Resend Payslip Email
  resendEmail: async (id: number): Promise<SendPayslipEmailResponse> => {
    const res = await apiClient.post<SendPayslipEmailResponse>(
      `/payroll/payslips/${id}/resend-email`
    );
    return res.data;
  },

  // 15. Get Email Delivery History Audit Trail
  getEmailHistory: async (id: number): Promise<PayslipEmailLog[]> => {
    const res = await apiClient.get<PayslipEmailLog[]>(
      `/payroll/payslips/${id}/email-history`
    );
    return res.data;
  },

  // 16. Bulk Send Payslip Emails for an Entire Payrun
  bulkEmailPayrun: async (payrunId: number): Promise<BulkEmailPayrunResult> => {
    const res = await apiClient.post<BulkEmailPayrunResult>(
      `/payroll/payruns/${payrunId}/send-all-payslips`
    );
    return res.data;
  },
};
