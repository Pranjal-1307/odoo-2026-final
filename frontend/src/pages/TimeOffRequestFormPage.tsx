import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Calendar,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Ban,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { timeOffService } from '../services/timeOffService';
import { employeeService } from '../services/employeeService';
import type { TimeOffRequest, TimeOffType, Employee, LeaveBalanceItem, DurationCalculateResponse } from '../types';
import { useAuth } from '../context/AuthContext';

export const TimeOffRequestFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, canManageHR } = useAuth();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [balances, setBalances] = useState<LeaveBalanceItem[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  // Loaded request object if viewing existing
  const [existingRequest, setExistingRequest] = useState<TimeOffRequest | null>(null);

  // Duration preview state
  const [durationPreview, setDurationPreview] = useState<DurationCalculateResponse | null>(null);
  const [calculatingDuration, setCalculatingDuration] = useState<boolean>(false);

  // Modals for actions
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showRefuseModal, setShowRefuseModal] = useState<boolean>(false);
  const [approvalReason, setApprovalReason] = useState<string>('');
  const [refusalReason, setRefusalReason] = useState<string>('');

  // Initial Data Fetch
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [typesData, empData] = await Promise.all([
          timeOffService.getTypes(),
          employeeService.getEmployees({ limit: 100 })
        ]);

        setTypes(typesData);
        setEmployees(empData.items);

        if (isEditing && id) {
          const req = await timeOffService.getRequest(parseInt(id, 10));
          setExistingRequest(req);
          setSelectedEmployeeId(req.employee_id);
          setSelectedTypeId(req.time_off_type_id);
          setStartDate(req.start_date);
          setEndDate(req.end_date);
          setStartTime(req.start_time || '');
          setEndTime(req.end_time || '');
          setReason(req.reason || '');

          // Load employee balances
          const bData = await timeOffService.getBalances(req.employee_id);
          setBalances(bData.balances);
        } else {
          // Defaults for new request
          const defaultEmpId = user?.employee_id || (empData.items.length > 0 ? empData.items[0].id : '');
          setSelectedEmployeeId(defaultEmpId);

          if (typesData.length > 0) {
            setSelectedTypeId(typesData[0].id);
          }

          if (defaultEmpId) {
            const bData = await timeOffService.getBalances(Number(defaultEmpId));
            setBalances(bData.balances);
          }
        }
      } catch (err: any) {
        console.error('Error loading request form data:', err);
        setError(err.response?.data?.detail || 'Failed to initialize request form.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEditing, user]);

  // Recalculate duration whenever employee, type, or dates change
  useEffect(() => {
    if (!selectedEmployeeId || !selectedTypeId || !startDate || !endDate) {
      setDurationPreview(null);
      return;
    }

    const computeDuration = async () => {
      try {
        setCalculatingDuration(true);
        const res = await timeOffService.calculateDuration({
          employee_id: Number(selectedEmployeeId),
          time_off_type_id: Number(selectedTypeId),
          start_date: startDate,
          end_date: endDate,
          start_time: startTime || undefined,
          end_time: endTime || undefined
        });
        setDurationPreview(res);
      } catch (err: any) {
        // Silently capture invalid date range in preview
        setDurationPreview(null);
      } finally {
        setCalculatingDuration(false);
      }
    };

    computeDuration();
  }, [selectedEmployeeId, selectedTypeId, startDate, endDate, startTime, endTime]);

  // When selected employee changes, update their balances
  const handleEmployeeChange = async (empId: number) => {
    setSelectedEmployeeId(empId);
    try {
      const bData = await timeOffService.getBalances(empId);
      setBalances(bData.balances);
    } catch (err) {
      console.error('Failed to load employee balances:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedTypeId || !startDate || !endDate) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isEditing && existingRequest) {
        await timeOffService.updateRequest(existingRequest.id, {
          time_off_type_id: Number(selectedTypeId),
          start_date: startDate,
          end_date: endDate,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          reason: reason || undefined
        });
        setSuccessMessage('Time off request updated successfully.');
        setTimeout(() => navigate('/time-off/requests'), 1200);
      } else {
        const created = await timeOffService.createRequest({
          employee_id: Number(selectedEmployeeId),
          time_off_type_id: Number(selectedTypeId),
          start_date: startDate,
          end_date: endDate,
          start_time: startTime || undefined,
          end_time: endTime || undefined,
          reason: reason || undefined
        });
        setSuccessMessage('Time off request submitted successfully.');
        setTimeout(() => navigate(`/time-off/requests/${created.id}`), 1000);
      }
    } catch (err: any) {
      console.error('Error saving request:', err);
      setError(err.response?.data?.detail || 'Failed to save time off request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async () => {
    if (!existingRequest) return;
    try {
      setSubmitting(true);
      setError(null);
      const updated = await timeOffService.approveRequest(existingRequest.id, approvalReason);
      setExistingRequest(updated);
      setShowApproveModal(false);
      setSuccessMessage('Request approved successfully! Allocation balance updated.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Approval failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefuse = async () => {
    if (!existingRequest) return;
    try {
      setSubmitting(true);
      setError(null);
      const updated = await timeOffService.refuseRequest(existingRequest.id, refusalReason);
      setExistingRequest(updated);
      setShowRefuseModal(false);
      setSuccessMessage('Request marked as refused.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Refusal failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!existingRequest) return;
    if (!window.confirm('Are you sure you want to cancel this request? Consumed balances will be restored.')) {
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      const updated = await timeOffService.cancelRequest(existingRequest.id);
      setExistingRequest(updated);
      setSuccessMessage('Request cancelled and allocation balances restored.');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Cancellation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeObj = types.find((t) => t.id === Number(selectedTypeId));
  const currentBalance = balances.find((b) => b.type_id === Number(selectedTypeId));

  const isPending = existingRequest?.status === 'to_approve' || existingRequest?.status === 'pending';
  const isApproved = existingRequest?.status === 'approved';
  const isOwner = user?.employee_id === existingRequest?.employee_id;
  const canApproveOrRefuse = canManageHR && !isOwner && isPending;
  const canCancel = (isOwner || canManageHR) && (isPending || isApproved);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-8 h-8 animate-spin text-odoo-purple" />
        <span>Loading time off details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/time-off/requests')}
            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-odoo-purple" />
              {isEditing ? `Time Off Request #${existingRequest?.id}` : 'New Time Off Request'}
            </h1>
            <p className="text-xs text-slate-500">
              {isEditing ? 'View and process employee leave request.' : 'Submit a new leave or absence request.'}
            </p>
          </div>
        </div>

        {/* Top Status & Quick Action Bar (if viewing existing) */}
        {isEditing && existingRequest && (
          <div className="flex items-center gap-2">
            {canApproveOrRefuse && (
              <>
                <button
                  type="button"
                  onClick={() => setShowApproveModal(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setShowRefuseModal(true)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Refuse
                </button>
              </>
            )}

            {canCancel && (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5 text-slate-500" />
                Cancel Request
              </button>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl flex items-center gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        {/* Status Header Banner if existing */}
        {isEditing && existingRequest && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Status:</span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  existingRequest.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : existingRequest.status === 'refused'
                    ? 'bg-rose-100 text-rose-800'
                    : existingRequest.status === 'cancelled'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {existingRequest.status}
              </span>
            </div>

            {existingRequest.approved_at && (
              <div className="text-xs text-slate-500">
                Approved by <span className="font-semibold text-slate-700">{existingRequest.approver_name || 'HR Manager'}</span>
              </div>
            )}
            {existingRequest.refused_at && (
              <div className="text-xs text-rose-600">
                Refused reason: {existingRequest.refusal_reason || 'Not specified'}
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Employee <span className="text-rose-500">*</span>
            </label>
            {user?.role === 'Employee' || (isEditing && !canManageHR) ? (
              <input
                type="text"
                disabled
                value={
                  employees.find((e) => e.id === Number(selectedEmployeeId))?.name ||
                  existingRequest?.employee_name ||
                  user?.name ||
                  ''
                }
                className="w-full bg-slate-100 border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-700 cursor-not-allowed"
              />
            ) : (
              <select
                value={selectedEmployeeId}
                onChange={(e) => handleEmployeeChange(Number(e.target.value))}
                disabled={isEditing && !isPending}
                className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code || emp.department})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Time Off Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Time Off Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(Number(e.target.value))}
              disabled={isEditing && !isPending}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            >
              <option value="">Select Leave Type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.unit}) {t.requires_allocation ? '• Requires Allocation' : '• Unlimited / Unpaid'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Balance Card */}
        {currentBalance && (
          <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-sm"
                style={{ backgroundColor: currentBalance.color || '#017E84' }}
              >
                {currentBalance.unit === 'days' ? 'D' : 'H'}
              </div>
              <div>
                <div className="font-semibold text-slate-800 text-sm">
                  {currentBalance.type_name} Balance
                </div>
                <div className="text-xs text-slate-500">
                  {currentBalance.requires_allocation
                    ? `Allocated: ${currentBalance.allocated} | Taken: ${currentBalance.taken}`
                    : 'No allocation limit required for this type.'}
                </div>
              </div>
            </div>

            {currentBalance.requires_allocation ? (
              <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-lg border border-purple-200 shadow-inner">
                <span className="text-xs text-slate-500 font-medium">Available Remaining:</span>
                <span className="text-base font-bold text-odoo-purple">
                  {currentBalance.remaining} {currentBalance.unit}
                </span>
              </div>
            ) : (
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                Unlimited Usage
              </span>
            )}
          </div>
        )}

        {/* Period Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isEditing && !isPending}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              End Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isEditing && !isPending}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            />
          </div>
        </div>

        {/* Hourly inputs if hours-based */}
        {selectedTypeObj?.unit === 'hours' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Start Time (Optional)</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isEditing && !isPending}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">End Time (Optional)</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isEditing && !isPending}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-sm"
              />
            </div>
          </div>
        )}

        {/* Live Duration Calculation Card */}
        {calculatingDuration ? (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center gap-3 text-xs text-slate-500">
            <RefreshCw className="w-4 h-4 animate-spin text-odoo-purple" />
            <span>Calculating applicable working schedule duration...</span>
          </div>
        ) : durationPreview && (
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
              durationPreview.has_sufficient_balance
                ? 'bg-slate-50 border-slate-200'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-odoo-purple" />
              <div>
                <div className="text-sm font-bold text-slate-800">
                  Calculated Duration: {durationPreview.duration} {durationPreview.unit}
                </div>
                <div className="text-xs text-slate-500">
                  {durationPreview.working_days_counted} working days counted (respects employee's active schedule, {durationPreview.calendar_days} calendar days)
                </div>
              </div>
            </div>

            {durationPreview.warning && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1.5 rounded-lg border border-rose-300">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                {durationPreview.warning}
              </div>
            )}
          </div>
        )}

        {/* Reason Field */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Reason / Description
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={isEditing && !isPending}
            placeholder="Provide context or explanation for the time off request..."
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
          />
        </div>

        {/* Form Actions */}
        {(!isEditing || isPending) && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/time-off/requests')}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (durationPreview !== null && !durationPreview.has_sufficient_balance)}
              className="px-5 py-2 text-sm font-semibold text-white bg-odoo-purple hover:bg-purple-900 disabled:opacity-50 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isEditing ? 'Save Changes' : 'Submit Request'}
            </button>
          </div>
        )}
      </form>

      {/* Confirmation Modal: Approve Request */}
      {showApproveModal && existingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Approve Leave Request</h3>
                <p className="text-xs text-slate-500">Official leave confirmation & balance update.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 text-sm space-y-2 border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Employee:</span>
                <span className="font-semibold text-slate-800">{existingRequest.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-bold text-odoo-purple">{existingRequest.duration} {existingRequest.unit || 'Days'}</span>
              </div>
              {currentBalance && currentBalance.requires_allocation && (
                <>
                  <div className="flex justify-between border-t border-slate-200 pt-1.5">
                    <span className="text-slate-500">Current Remaining:</span>
                    <span className="font-medium text-slate-700">{currentBalance.remaining} {currentBalance.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Remaining After Approval:</span>
                    <span className="font-bold text-emerald-700">
                      {Math.max(0, currentBalance.remaining - existingRequest.duration)} {currentBalance.unit}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Approval Note (Optional)
              </label>
              <input
                type="text"
                value={approvalReason}
                onChange={(e) => setApprovalReason(e.target.value)}
                placeholder="e.g., Approved based on available coverage."
                className="w-full text-sm rounded-lg border border-slate-300 p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Approval
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Refuse Request */}
      {showRefuseModal && existingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Refuse Leave Request</h3>
                <p className="text-xs text-slate-500">Provide an optional reason for the employee.</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Refusal Reason
              </label>
              <textarea
                rows={3}
                value={refusalReason}
                onChange={(e) => setRefusalReason(e.target.value)}
                placeholder="e.g., Critical project milestone during requested timeframe."
                className="w-full text-sm rounded-lg border border-slate-300 p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRefuseModal(false)}
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRefuse}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow transition-colors flex items-center gap-1.5"
              >
                {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Refusal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeOffRequestFormPage;
