import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Clock,
  Plus,
  Search,
  Filter,
  Calendar,
  UserCheck,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  Trash2,
  Edit,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  LogIn,
  LogOut,
  X,
  Eye
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import type { AttendanceQueryParams, AttendanceListResponse } from '../services/attendanceService';
import type { Attendance, AttendanceSummary } from '../types';
import { useAuth } from '../context/AuthContext';

export const AttendancePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canManageHR } = useAuth();


  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [attendanceData, setAttendanceData] = useState<AttendanceListResponse>({
    items: [],
    total: 0,
    page: 1,
    limit: 15,
    total_pages: 1
  });

  const [summary, setSummary] = useState<AttendanceSummary>({
    total_records: 0,
    present_today: 0,
    checked_in_now: 0,
    late_today: 0,
    overtime_today: 0,
    partial_today: 0,
    total_worked_hours: 0,
    total_overtime_hours: 0,
    department_breakdown: []
  });

  // Query Params
  const employeeIdParam = searchParams.get('employee_id');
  const statusParam = searchParams.get('status') || '';
  const searchParam = searchParams.get('search') || '';
  const departmentParam = searchParams.get('department') || '';
  const dateFromParam = searchParams.get('date_from') || '';
  const dateToParam = searchParams.get('date_to') || '';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const timePresetParam = searchParams.get('preset') || 'today';

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [dateFrom, setDateFrom] = useState(dateFromParam);
  const [dateTo, setDateTo] = useState(dateToParam);
  const [activePreset, setActivePreset] = useState<string>(timePresetParam);

  // Delete modal state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Detail preview modal state
  const [viewingRecord, setViewingRecord] = useState<Attendance | null>(null);

  // Quick check-in / check-out action state
  const [quickActionLoading, setQuickActionLoading] = useState<boolean>(false);

  // Compute dates based on preset
  const applyPreset = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', '1');
    newParams.set('preset', preset);

    if (preset === 'today') {
      newParams.set('date_from', todayStr);
      newParams.set('date_to', todayStr);
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'week') {
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(today.setDate(diff));
      const mondayStr = monday.toISOString().split('T')[0];
      newParams.set('date_from', mondayStr);
      newParams.set('date_to', todayStr);
      setDateFrom(mondayStr);
      setDateTo(todayStr);
    } else if (preset === 'month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      newParams.set('date_from', firstDay);
      newParams.set('date_to', todayStr);
      setDateFrom(firstDay);
      setDateTo(todayStr);
    } else if (preset === 'all') {
      newParams.delete('date_from');
      newParams.delete('date_to');
      setDateFrom('');
      setDateTo('');
    }

    setSearchParams(newParams);
  };

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: AttendanceQueryParams = {
        page: pageParam,
        limit: 15,
        sort_by: 'date',
        sort_order: 'desc'
      };

      if (searchParam) params.search = searchParam;
      if (statusParam) params.status = statusParam;
      if (employeeIdParam) params.employee_id = parseInt(employeeIdParam, 10);
      if (departmentParam) params.department = departmentParam;
      if (dateFromParam) params.date_from = dateFromParam;
      if (dateToParam) params.date_to = dateToParam;

      const [listRes, sumRes] = await Promise.all([
        attendanceService.getAttendances(params),
        attendanceService.getSummary({
          date_from: dateFromParam || undefined,
          date_to: dateToParam || undefined,
          department: departmentParam || undefined
        })
      ]);

      setAttendanceData(listRes);
      setSummary(sumRes);
    } catch (err: any) {
      console.error('Error loading attendance:', err);
      setError(err.response?.data?.detail || 'Unable to load attendance records.');
    } finally {
      setLoading(false);
    }
  }, [employeeIdParam, statusParam, searchParam, departmentParam, dateFromParam, dateToParam, pageParam]);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  // Handle Search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchQuery.trim()) {
      newParams.set('search', searchQuery.trim());
    } else {
      newParams.delete('search');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle Status filter change
  const handleStatusChange = (status: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (status) {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle Department filter change
  const handleDepartmentChange = (dept: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (dept) {
      newParams.set('department', dept);
    } else {
      newParams.delete('department');
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle Date range filter
  const handleDateFilterApply = () => {
    const newParams = new URLSearchParams(searchParams);
    if (dateFrom) newParams.set('date_from', dateFrom);
    else newParams.delete('date_from');

    if (dateTo) newParams.set('date_to', dateTo);
    else newParams.delete('date_to');

    newParams.set('preset', 'custom');
    setActivePreset('custom');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Quick Check In
  const handleQuickCheckIn = async () => {
    setQuickActionLoading(true);
    try {
      await attendanceService.checkIn();
      setSuccessMessage('Successfully checked in!');
      setTimeout(() => setSuccessMessage(null), 3500);
      window.dispatchEvent(new CustomEvent('attendance-updated'));
      fetchAttendance();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to check in.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setQuickActionLoading(false);
    }
  };

  // Quick Check Out
  const handleQuickCheckOut = async () => {
    setQuickActionLoading(true);
    try {
      const res = await attendanceService.checkOut();
      setSuccessMessage(`Checked out successfully! Worked: ${formatHours(res.worked_hours)}`);
      setTimeout(() => setSuccessMessage(null), 4000);
      window.dispatchEvent(new CustomEvent('attendance-updated'));
      fetchAttendance();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to check out.');
      setTimeout(() => setError(null), 4000);
    } finally {
      setQuickActionLoading(false);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await attendanceService.deleteAttendance(deletingId);
      setSuccessMessage('Attendance record deleted successfully.');
      setTimeout(() => setSuccessMessage(null), 3000);
      setDeletingId(null);
      fetchAttendance();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete attendance record.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format hours as e.g. "8h 05m"
  const formatHours = (hrs: number) => {
    if (!hrs || hrs <= 0) return '0h 00m';
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  // Format time display "09:02 AM"
  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '—';
    try {
      const dt = new Date(isoString);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  // Format date display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const dt = new Date(dateStr + 'T00:00:00');
      return dt.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  // Status color pill
  const getStatusBadge = (statusVal: string) => {
    switch (statusVal.toLowerCase()) {
      case 'present':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Present
          </span>
        );
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            Checked In
          </span>
        );
      case 'overtime':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Overtime
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Partial Day
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
            Late
          </span>
        );
      case 'absent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Absent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            {statusVal}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-medium text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-medium text-sm">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <span>PeoplePay360</span>
            <span>/</span>
            <span className="text-[#714B67]">Attendance Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-6 h-6 text-[#714B67]" />
            Attendance Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational employee time tracking, schedules, and payroll-authoritative worked hours
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => fetchAttendance()}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleQuickCheckIn}
            disabled={quickActionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Check In</span>
          </button>

          <button
            onClick={handleQuickCheckOut}
            disabled={quickActionLoading}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Check Out</span>
          </button>

          {canManageHR && (
            <button
              onClick={() => navigate('/attendance/new')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#714B67] hover:bg-[#5b3c53] rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Attendance</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-3.5">
        {/* Present Today */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Present Today</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.present_today}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Checked In */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Currently Active</div>
            <div className="text-2xl font-bold text-sky-600 mt-1">{summary.checked_in_now}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Late Arrivals */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Late Arrivals</div>
            <div className="text-2xl font-bold text-orange-600 mt-1">{summary.late_today}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Overtime */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Overtime Count</div>
            <div className="text-2xl font-bold text-purple-600 mt-1">{summary.overtime_today}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Total Hours */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Total Hours Worked</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">{formatHours(summary.total_worked_hours)}</div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Ribbon */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee name, code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] transition-all"
            />
          </form>

          {/* Time Presets */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg self-stretch md:self-auto overflow-x-auto">
            {['today', 'week', 'month', 'all'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => applyPreset(preset)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize whitespace-nowrap cursor-pointer ${
                  activePreset === preset
                    ? 'bg-white text-[#714B67] font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset === 'all' ? 'All Time' : `This ${preset}`}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Status Dropdown */}
          <select
            value={statusParam}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#714B67]"
          >
            <option value="">All Statuses</option>
            <option value="present">Present</option>
            <option value="checked_in">Checked In</option>
            <option value="partial">Partial Day</option>
            <option value="late">Late Arrival</option>
            <option value="overtime">Overtime</option>
            <option value="absent">Absent</option>
          </select>

          {/* Department Dropdown */}
          <select
            value={departmentParam}
            onChange={(e) => handleDepartmentChange(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#714B67]"
          >
            <option value="">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance & Payroll">Finance & Payroll</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
            <option value="Executive / IT">Executive / IT</option>
            <option value="Design">Design</option>
          </select>

          {/* Date Pickers */}
          <div className="flex items-center gap-1.5 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-[#714B67]"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 focus:outline-none focus:border-[#714B67]"
            />
            <button
              onClick={handleDateFilterApply}
              className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md font-medium text-xs transition-colors cursor-pointer"
            >
              Apply
            </button>
          </div>

          {(statusParam || departmentParam || searchParam || employeeIdParam) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSearchParams(new URLSearchParams());
              }}
              className="text-xs text-rose-600 hover:text-rose-700 underline font-medium ml-auto cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* Main Attendance Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Check In</th>
                <th className="py-3 px-4">Check Out</th>
                <th className="py-3 px-4">Worked Hours</th>
                <th className="py-3 px-4">Expected</th>
                <th className="py-3 px-4">Overtime</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#714B67]" />
                    <span>Loading attendance records...</span>
                  </td>
                </tr>
              ) : attendanceData.items.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium text-slate-600">No attendance records found</p>
                    <p className="text-xs text-slate-400 mt-1">Try changing your filters or check in for today.</p>
                  </td>
                </tr>
              ) : (
                attendanceData.items.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Employee info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#714B67]/10 text-[#714B67] font-bold flex items-center justify-center text-xs border border-[#714B67]/20">
                          {record.employee_name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{record.employee_name}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                            {record.employee_code && <span>{record.employee_code}</span>}
                            {record.department && (
                              <>
                                <span>•</span>
                                <span>{record.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {formatDate(record.date)}
                    </td>

                    {/* Check In */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <span>{formatTime(record.check_in)}</span>
                        {record.late_minutes > 0 && (
                          <span className="text-[10px] text-orange-600 bg-orange-50 px-1 rounded border border-orange-200" title={`${record.late_minutes}m late`}>
                            +{record.late_minutes}m
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Check Out */}
                    <td className="py-3 px-4 font-mono font-medium text-slate-700">
                      {formatTime(record.check_out)}
                    </td>

                    {/* Worked Hours */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {formatHours(record.worked_hours)}
                      </span>
                    </td>

                    {/* Expected Hours */}
                    <td className="py-3 px-4 text-slate-500 font-mono">
                      {record.expected_hours}h
                    </td>

                    {/* Overtime */}
                    <td className="py-3 px-4">
                      {record.overtime_hours > 0 ? (
                        <span className="font-mono font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                          +{formatHours(record.overtime_hours)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(record.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingRecord(record)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canManageHR && (
                          <>
                            <button
                              onClick={() => navigate(`/attendance/${record.id}`)}
                              className="p-1.5 text-slate-400 hover:text-[#714B67] hover:bg-purple-50 rounded-md transition-colors cursor-pointer"
                              title="Edit Attendance"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingId(record.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing <span className="font-medium text-slate-900">{attendanceData.items.length}</span> of{' '}
            <span className="font-medium text-slate-900">{attendanceData.total}</span> records
          </div>

          <div className="flex items-center gap-1.5">
            <button
              disabled={attendanceData.page <= 1 || loading}
              onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.set('page', (attendanceData.page - 1).toString());
                setSearchParams(p);
              }}
              className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-1 font-medium text-slate-800">
              Page {attendanceData.page} of {attendanceData.total_pages || 1}
            </span>
            <button
              disabled={attendanceData.page >= attendanceData.total_pages || loading}
              onClick={() => {
                const p = new URLSearchParams(searchParams);
                p.set('page', (attendanceData.page + 1).toString());
                setSearchParams(p);
              }}
              className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center border border-rose-100">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Delete Attendance</h3>
                <p className="text-xs text-slate-500">Are you sure you want to delete this record?</p>
              </div>
            </div>
            <p className="text-xs text-slate-600">
              This action cannot be undone and may affect payroll calculations for this payrun period.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeletingId(null)}
                disabled={isDeleting}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#714B67]" />
                <h3 className="text-base font-bold text-slate-900">Attendance Details</h3>
              </div>
              <button onClick={() => setViewingRecord(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Employee</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{viewingRecord.employee_name}</div>
                <div className="text-slate-500">{viewingRecord.department} • {viewingRecord.employee_code}</div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[11px] text-slate-400 font-medium">Check In</span>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">{formatTime(viewingRecord.check_in)}</div>
                  {viewingRecord.late_minutes > 0 && (
                    <span className="text-[10px] text-orange-600 font-semibold">{viewingRecord.late_minutes} min late</span>
                  )}
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                  <span className="text-[11px] text-slate-400 font-medium">Check Out</span>
                  <div className="text-sm font-mono font-bold text-slate-900 mt-0.5">{formatTime(viewingRecord.check_out)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Worked</div>
                  <div className="text-sm font-mono font-bold text-emerald-700">{formatHours(viewingRecord.worked_hours)}</div>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] text-slate-400 uppercase font-bold">Expected</div>
                  <div className="text-sm font-mono font-bold text-slate-700">{viewingRecord.expected_hours}h</div>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="text-[10px] text-purple-600 uppercase font-bold">Overtime</div>
                  <div className="text-sm font-mono font-bold text-purple-700">+{formatHours(viewingRecord.overtime_hours)}</div>
                </div>
              </div>

              {viewingRecord.notes && (
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 mb-0.5">Notes</div>
                  <p className="text-slate-700">{viewingRecord.notes}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewingRecord(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AttendancePage;
