import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users as UsersIcon, 
  Search, 
  Plus, 
  ShieldCheck, 
  KeyRound, 
  UserCheck, 
  UserX, 
  Edit2, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import type { CreateUserData, UpdateUserData } from '../services/authService';
import type { User, UserRole } from '../types';

const ROLES: UserRole[] = [
  'Admin',
  'HR Payroll Manager',
  'HR Payroll User',
  'HR Manager',
  'Employee',
];

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState<CreateUserData>({
    email: '',
    username: '',
    password: '',
    role: 'Employee',
    is_active: true,
  });

  const [editForm, setEditForm] = useState<UpdateUserData>({
    email: '',
    username: '',
    role: 'Employee',
    is_active: true,
  });

  const [targetRole, setTargetRole] = useState<UserRole>('Employee');
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await authService.getUsers({
        search: search || undefined,
        role: roleFilter || undefined,
        is_active: statusFilter === '' ? undefined : statusFilter === 'true',
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch (err: any) {
      console.error('Failed to fetch users:', err);
      setFeedback({ type: 'error', message: 'Failed to load user records.' });
    } finally {
      setIsLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Create User
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.createUser(createForm);
      setFeedback({ type: 'success', message: `User account '${createForm.email}' created successfully.` });
      setIsCreateModalOpen(false);
      setCreateForm({ email: '', username: '', password: '', role: 'Employee', is_active: true });
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to create user.';
      setFeedback({ type: 'error', message: detail });
    }
  };

  // Handle Edit User
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await authService.updateUser(selectedUser.id, editForm);
      setFeedback({ type: 'success', message: `User '${selectedUser.email}' updated successfully.` });
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to update user.';
      setFeedback({ type: 'error', message: detail });
    }
  };

  // Handle Role Change
  const handleRoleChangeSubmit = async () => {
    if (!selectedUser) return;
    try {
      await authService.updateUserRole(selectedUser.id, targetRole);
      setFeedback({ 
        type: 'success', 
        message: `Role for '${selectedUser.username}' updated to '${targetRole}'.` 
      });
      setIsRoleModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to update user role.';
      setFeedback({ type: 'error', message: detail });
    }
  };

  // Handle Status Toggle
  const handleStatusToggleSubmit = async () => {
    if (!selectedUser) return;
    const nextStatus = !selectedUser.is_active;
    try {
      await authService.toggleUserStatus(selectedUser.id, nextStatus);
      setFeedback({ 
        type: 'success', 
        message: `User '${selectedUser.username}' has been ${nextStatus ? 'activated' : 'deactivated'}.` 
      });
      setIsStatusModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to change user status.';
      setFeedback({ type: 'error', message: detail });
    }
  };

  // Handle Password Reset
  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await authService.resetPassword(selectedUser.id, newPassword);
      setFeedback({ type: 'success', message: `Password reset for '${selectedUser.email}'.` });
      setIsPasswordModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Failed to reset password.';
      setFeedback({ type: 'error', message: detail });
    }
  };

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setEditForm({
      email: u.email,
      username: u.username,
      role: u.role,
      is_active: u.is_active,
    });
    setIsEditModalOpen(true);
  };

  const openRoleModal = (u: User) => {
    setSelectedUser(u);
    setTargetRole(u.role);
    setIsRoleModalOpen(true);
  };

  const openStatusModal = (u: User) => {
    setSelectedUser(u);
    setIsStatusModalOpen(true);
  };

  const openPasswordModal = (u: User) => {
    setSelectedUser(u);
    setNewPassword('');
    setIsPasswordModalOpen(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'HR Payroll Manager':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'HR Payroll User':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'HR Manager':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Control Panel / Top Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Settings</span>
            <span>/</span>
            <span className="text-odoo-purple">Users & Roles</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
            <UsersIcon className="w-6 h-6 text-odoo-purple" />
            User Management
          </h1>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex-1 md:flex-none px-4 py-2 bg-odoo-purple hover:bg-[#5e3d55] text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New User</span>
          </button>
          
          <button
            onClick={fetchUsers}
            className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2.5 font-medium">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, role..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
          >
            <option value="">All Roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Linked Employee</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-odoo-purple border-t-transparent rounded-full animate-spin" />
                      <span>Loading user accounts...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="font-medium">No users found matching current filters.</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing your search query or role filter.</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 text-odoo-purple font-bold flex items-center justify-center text-xs shadow-inner">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isSelf && (
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">ID #{u.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-600 font-mono text-xs">
                        {u.email}
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {u.employee_name || (
                          <span className="text-slate-400 italic text-xs">Not linked</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadge(u.role)}`}>
                          <ShieldCheck className="w-3 h-3" />
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-xs text-slate-500">
                        {u.last_login_at
                          ? new Date(u.last_login_at).toLocaleString()
                          : 'Never logged in'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-1.5 text-slate-500 hover:text-odoo-purple hover:bg-purple-50 rounded-md transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openRoleModal(u)}
                            className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                            title="Assign Role"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => openPasswordModal(u)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-md transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {!isSelf && (
                            <button
                              onClick={() => openStatusModal(u)}
                              className={`p-1.5 rounded-md transition-colors ${
                                u.is_active 
                                  ? 'text-slate-500 hover:text-rose-600 hover:bg-rose-50' 
                                  : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={u.is_active ? 'Deactivate User' : 'Activate User'}
                            >
                              {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / Summary */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Showing {users.length} of {total} registered users</span>
          <span>Role-Based Access Control Active</span>
        </div>
      </div>

      {/* ================= MODAL: CREATE USER ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative animate-scaleIn">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-odoo-purple" />
                Create New User
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name / Username *
                </label>
                <input
                  type="text"
                  required
                  value={createForm.username}
                  onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Login Email *
                </label>
                <input
                  type="email"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="john@peoplepay360.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Application Role *
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="create_is_active"
                  checked={createForm.is_active}
                  onChange={(e) => setCreateForm({ ...createForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-odoo-purple rounded border-slate-300 focus:ring-odoo-purple"
                />
                <label htmlFor="create_is_active" className="text-xs font-medium text-slate-700">
                  User is active and allowed to log in
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-odoo-purple hover:bg-[#5e3d55] text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT USER ================= */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative animate-scaleIn">
            <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-odoo-purple" />
                Edit User: {selectedUser.username}
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Full Name / Username
                </label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Login Email
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="edit_is_active"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-4 h-4 text-odoo-purple rounded border-slate-300 focus:ring-odoo-purple"
                />
                <label htmlFor="edit_is_active" className="text-xs font-medium text-slate-700">
                  User is active and allowed to log in
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-odoo-purple hover:bg-[#5e3d55] text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ROLE CHANGE CONFIRMATION ================= */}
      {isRoleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative animate-scaleIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-odoo-purple" />
                Change User Role
              </h2>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Select the new security role for <strong className="text-slate-900">{selectedUser.username}</strong> ({selectedUser.email}):
            </p>

            <div className="space-y-2 mb-6">
              {ROLES.map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                    targetRole === r
                      ? 'border-odoo-purple bg-purple-50/70 font-semibold text-odoo-purple'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="targetRole"
                      value={r}
                      checked={targetRole === r}
                      onChange={() => setTargetRole(r)}
                      className="text-odoo-purple focus:ring-odoo-purple"
                    />
                    <span>{r}</span>
                  </div>
                  {selectedUser.role === r && (
                    <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded text-slate-700 font-bold uppercase">
                      Current
                    </span>
                  )}
                </label>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-5">
              <strong>Security Notice:</strong> Changing a user&apos;s role immediately adjusts their system permissions and module access upon their next request.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsRoleModalOpen(false)}
                className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleChangeSubmit}
                className="flex-1 py-2 px-4 bg-odoo-purple hover:bg-[#5e3d55] text-white font-semibold rounded-lg shadow-sm transition-colors"
              >
                Confirm Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: STATUS TOGGLE CONFIRMATION ================= */}
      {isStatusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative animate-scaleIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {selectedUser.is_active ? (
                  <UserX className="w-5 h-5 text-rose-600" />
                ) : (
                  <UserCheck className="w-5 h-5 text-emerald-600" />
                )}
                {selectedUser.is_active ? 'Deactivate User Account' : 'Activate User Account'}
              </h2>
              <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to {selectedUser.is_active ? 'deactivate' : 'activate'}{' '}
              <strong className="text-slate-900">{selectedUser.username}</strong> ({selectedUser.email})?
            </p>

            {selectedUser.is_active ? (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-800 mb-6">
                <p className="font-semibold mb-1">Account Deactivation Effect:</p>
                <ul className="list-disc list-inside space-y-0.5 text-rose-700">
                  <li>The user will immediately be blocked from logging in.</li>
                  <li>Any active sessions will be rejected.</li>
                  <li><strong>Historical data preservation:</strong> Linked employee, attendance, leave, and payslip records will remain intact.</li>
                </ul>
              </div>
            ) : (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-800 mb-6">
                This user will regain access to PeoplePay360 with their configured role ({selectedUser.role}).
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStatusToggleSubmit}
                className={`flex-1 py-2 px-4 font-semibold rounded-lg shadow-sm transition-colors text-white ${
                  selectedUser.is_active
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedUser.is_active ? 'Deactivate User' : 'Activate User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: RESET PASSWORD ================= */}
      {isPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative animate-scaleIn">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-600" />
                Reset Password
              </h2>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Enter a new password for <strong className="text-slate-900">{selectedUser.username}</strong>:
            </p>

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 4 characters"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple"
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="flex-1 py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-odoo-purple hover:bg-[#5e3d55] text-white font-semibold rounded-lg shadow-sm transition-colors"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
