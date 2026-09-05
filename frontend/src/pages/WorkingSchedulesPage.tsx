import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  Plus, 
  Search, 
  Building2, 
  Globe, 
  Users, 
  FileText, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  Edit,
  Power,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { WorkingSchedule } from '../types';

export const WorkingSchedulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { canManageHR, isAdmin } = useAuth();

  const [schedules, setSchedules] = useState<WorkingSchedule[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<string>('asc');

  // Deletion modal state
  const [deletingSchedule, setDeletingSchedule] = useState<WorkingSchedule | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const fetchSchedules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = {
        page: 1,
        size: 50,
        sort_by: sortBy,
        sort_order: sortOrder
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (companyFilter !== 'all') params.company = companyFilter;

      const res = await apiClient.get('/working-schedules', { params });
      setSchedules(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err: any) {
      console.error('Failed to fetch working schedules:', err);
      setError(err.response?.data?.detail || 'Failed to load working schedules.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [search, statusFilter, companyFilter, sortBy, sortOrder]);

  const handleToggleStatus = async (schedule: WorkingSchedule, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.patch(`/working-schedules/${schedule.id}/status`);
      fetchSchedules();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle status.');
    }
  };

  const handleDelete = async () => {
    if (!deletingSchedule) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await apiClient.delete(`/working-schedules/${deletingSchedule.id}`);
      setDeletingSchedule(null);
      fetchSchedules();
    } catch (err: any) {
      setDeleteError(err.response?.data?.detail || 'Failed to delete schedule.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Compute summary stats
  const activeCount = schedules.filter(s => s.status === 'active').length;
  const avgHours = schedules.length > 0 
    ? (schedules.reduce((acc, s) => acc + s.hours_per_week, 0) / schedules.length).toFixed(1)
    : '0';
  const totalAssignedStaff = schedules.reduce((acc, s) => acc + (s.employee_count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-50 text-odoo-purple">
              <Clock className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Working Schedules</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Standardize expected shift timings, break durations, weekly working hours, and attendance baseline.
          </p>
        </div>

        {canManageHR && (
          <button
            onClick={() => navigate('/working-schedules/new')}
            className="odoo-btn-primary cursor-pointer text-sm shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New Schedule</span>
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="odoo-card p-4">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Schedules</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{total}</div>
          <div className="text-xs text-slate-500 mt-1">Configured company templates</div>
        </div>

        <div className="odoo-card p-4">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Shifts</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-2">{activeCount}</div>
          <div className="text-xs text-emerald-600 mt-1">Available for new contracts</div>
        </div>

        <div className="odoo-card p-4">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Weekly Hours</span>
            <Clock className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{avgHours}h</div>
          <div className="text-xs text-slate-500 mt-1">Standard baseline duration</div>
        </div>

        <div className="odoo-card p-4">
          <div className="flex justify-between items-center text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Assigned Staff</span>
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-800 mt-2">{totalAssignedStaff}</div>
          <div className="text-xs text-slate-500 mt-1">Across active contracts</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by schedule or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 focus:border-odoo-purple transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status filter tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-odoo-purple font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-emerald-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter('inactive')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                statusFilter === 'inactive'
                  ? 'bg-white text-slate-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive
            </button>
          </div>
          {/* Company filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg px-2.5 py-2 bg-white">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="bg-transparent border-none text-xs focus:outline-none text-slate-700 cursor-pointer"
            >
              <option value="all">All Companies</option>
              <option value="PeoplePay360 Inc.">PeoplePay360 Inc.</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg px-2.5 py-2 bg-white">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
              }}
              className="bg-transparent border-none text-xs focus:outline-none text-slate-700 cursor-pointer"
            >
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="hours_per_week-desc">Hours (High to Low)</option>
              <option value="hours_per_week-asc">Hours (Low to High)</option>
              <option value="days_per_week-desc">Days (High to Low)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schedules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-8 h-8 border-2 border-odoo-purple border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm">Loading working schedules...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : schedules.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Clock className="w-10 h-10 mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700">No working schedules found</h3>
            <p className="text-xs text-slate-500 mt-1">Try adjusting your search or filters, or create a new schedule.</p>
            {canManageHR && (
              <button
                onClick={() => navigate('/working-schedules/new')}
                className="odoo-btn-primary mt-4 mx-auto text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Schedule</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Schedule Name</th>
                  <th className="py-3 px-4">Days / Week</th>
                  <th className="py-3 px-4">Hours / Week</th>
                  <th className="py-3 px-4">Weekly Shift Preview</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schedules.map((schedule) => {
                  return (
                    <tr
                      key={schedule.id}
                      onClick={() => navigate(`/working-schedules/${schedule.id}`)}
                      className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                    >
                      {/* Name & Company */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 group-hover:text-odoo-purple transition-colors">
                          {schedule.name}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {schedule.company}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {schedule.timezone}
                          </span>
                        </div>
                      </td>

                      {/* Days / Week */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {schedule.days_per_week} days
                        </span>
                      </td>

                      {/* Hours / Week */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-odoo-purple border border-purple-200">
                          {schedule.hours_per_week} hrs / wk
                        </span>
                      </td>

                      {/* Day list preview */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-[11px]">
                          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((dayAbbr) => {
                            const fullDays: Record<string, string> = {
                              'Mon': 'Monday', 'Tue': 'Tuesday', 'Wed': 'Wednesday',
                              'Thu': 'Thursday', 'Fri': 'Friday', 'Sat': 'Saturday', 'Sun': 'Sunday'
                            };
                            const isWorking = schedule.days?.some(d => d.day_of_week.toLowerCase() === fullDays[dayAbbr].toLowerCase());
                            return (
                              <span
                                key={dayAbbr}
                                title={isWorking ? `${fullDays[dayAbbr]}: Working Day` : `${fullDays[dayAbbr]}: Off`}
                                className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[10px] ${
                                  isWorking
                                    ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-200'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {dayAbbr[0]}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      {/* Assigned Contracts & Employees */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3 text-xs text-slate-600">
                          <span className="flex items-center gap-1" title="Assigned Employees">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {schedule.employee_count || 0}
                          </span>
                          <span className="flex items-center gap-1" title="Assigned Contracts">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            {schedule.contract_count || 0}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {schedule.status === 'active' ? (
                          <span className="odoo-badge-green">Active</span>
                        ) : (
                          <span className="odoo-badge-gray">Inactive</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {canManageHR && (
                            <button
                              onClick={(e) => handleToggleStatus(schedule, e)}
                              className="p-1.5 text-slate-400 hover:text-odoo-purple hover:bg-purple-50 rounded transition-colors"
                              title={schedule.status === 'active' ? 'Deactivate Schedule' : 'Activate Schedule'}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(`/working-schedules/${schedule.id}`)}
                            className="p-1.5 text-slate-400 hover:text-odoo-purple hover:bg-purple-50 rounded transition-colors"
                            title="Edit Schedule"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setDeletingSchedule(schedule);
                                setDeleteError(null);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Delete Schedule"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingSchedule && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2.5 rounded-full bg-rose-50">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-slate-800">Delete Working Schedule</h3>
            </div>

            <p className="text-sm text-slate-600 mb-4">
              Are you sure you want to delete <span className="font-semibold text-slate-800">"{deletingSchedule.name}"</span>?
            </p>

            {deleteError && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-700 mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingSchedule(null)}
                disabled={isDeleting}
                className="odoo-btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs px-4 py-2 rounded-md shadow-sm transition-all"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
