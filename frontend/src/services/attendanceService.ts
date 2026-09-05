import { apiClient } from './api';
import type { Attendance, AttendanceCurrentStatus, AttendanceSummary } from '../types';


export interface AttendanceQueryParams {
  employee_id?: number;
  department?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface AttendanceListResponse {
  items: Attendance[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export const attendanceService = {
  getAttendances: async (params?: AttendanceQueryParams): Promise<AttendanceListResponse> => {
    const response = await apiClient.get('/attendance', { params });
    return response.data;
  },

  getAttendance: async (id: number): Promise<Attendance> => {
    const response = await apiClient.get(`/attendance/${id}`);
    return response.data;
  },

  getMyStatus: async (employeeId?: number): Promise<AttendanceCurrentStatus> => {
    const response = await apiClient.get('/attendance/my-status', {
      params: employeeId ? { employee_id: employeeId } : undefined
    });
    return response.data;
  },

  getSummary: async (params?: { date_from?: string; date_to?: string; department?: string }): Promise<AttendanceSummary> => {
    const response = await apiClient.get('/attendance/summary', { params });
    return response.data;
  },

  checkIn: async (data?: { employee_id?: number; check_in?: string; notes?: string }): Promise<Attendance> => {
    const response = await apiClient.post('/attendance/check-in', data || {});
    return response.data;
  },

  checkOut: async (data?: { employee_id?: number; check_out?: string; notes?: string }): Promise<Attendance> => {
    const response = await apiClient.post('/attendance/check-out', data || {});
    return response.data;
  },

  createAttendance: async (data: {
    employee_id: number;
    date?: string;
    check_in?: string;
    check_out?: string;
    notes?: string;
  }): Promise<Attendance> => {
    const response = await apiClient.post('/attendance', data);
    return response.data;
  },

  updateAttendance: async (
    id: number,
    data: {
      date?: string;
      check_in?: string;
      check_out?: string;
      status?: string;
      notes?: string;
    }
  ): Promise<Attendance> => {
    const response = await apiClient.put(`/attendance/${id}`, data);
    return response.data;
  },

  deleteAttendance: async (id: number): Promise<void> => {
    await apiClient.delete(`/attendance/${id}`);
  }
};
