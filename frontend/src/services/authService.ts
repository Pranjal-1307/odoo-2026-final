import { apiClient } from './api';
import type { User, UserRole } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
  permissions: string[];
}

export interface UserListResponse {
  total: number;
  users: User[];
}

export interface CreateUserData {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  is_active: boolean;
  employee_id?: number;
}

export interface UpdateUserData {
  email?: string;
  username?: string;
  role?: UserRole;
  is_active?: boolean;
  employee_id?: number;
  password?: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', { email, password });
    return response.data;
  },

  async getMe(): Promise<User & { permissions: string[] }> {
    const response = await apiClient.get<User & { permissions: string[] }>('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    }
  },

  async changePassword(old_password: string, new_password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/auth/change-password', {
      old_password,
      new_password,
    });
    return response.data;
  },

  // User Management (Admin only)
  async getUsers(params?: { search?: string; role?: string; is_active?: boolean; skip?: number; limit?: number }): Promise<UserListResponse> {
    const response = await apiClient.get<UserListResponse>('/users', { params });
    return response.data;
  },

  async getUser(id: number): Promise<User> {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  async createUser(data: CreateUserData): Promise<User> {
    const response = await apiClient.post<User>('/users', data);
    return response.data;
  },

  async updateUser(id: number, data: UpdateUserData): Promise<User> {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  async updateUserRole(id: number, role: UserRole): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}/role`, { role });
    return response.data;
  },

  async toggleUserStatus(id: number, is_active: boolean): Promise<User> {
    const response = await apiClient.patch<User>(`/users/${id}/status`, { is_active });
    return response.data;
  },

  async resetPassword(id: number, new_password: string): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(`/users/${id}/reset-password`, {
      new_password,
    });
    return response.data;
  },
};
