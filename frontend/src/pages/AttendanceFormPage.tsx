import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Clock,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  User,
  Calculator,
  Loader2,
  Trash2
} from 'lucide-react';
import { attendanceService } from '../services/attendanceService';
import { employeeService } from '../services/employeeService';
import type { Employee } from '../types';
import { useAuth } from '../context/AuthContext';


export const AttendanceFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageHR } = useAuth();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState<boolean>(isEditing);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Employee options for select dropdown
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [checkInDate, setCheckInDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [checkInTime, setCheckInTime] = useState<string>('09:00');
  const [hasCheckOut, setHasCheckOut] = useState<boolean>(true);
  const [checkOutDate, setCheckOutDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [checkOutTime, setCheckOutTime] = useState<string>('18:00');
  const [notes, setNotes] = useState<string>('');
  const [statusVal, setStatusVal] = useState<string>('present');

  // Preview metrics
  const [workedPreview, setWorkedPreview] = useState<number>(8.0);
  const [expectedPreview, setExpectedPreview] = useState<number>(8.0);
  const [overtimePreview, setOvertimePreview] = useState<number>(0.0);
  const [latePreview, setLatePreview] = useState<number>(0);

  // Load employee list
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await employeeService.getEmployees({ limit: 100 });
        setEmployees(res.items);
        if (!isEditing && res.items.length > 0) {
          setSelectedEmployeeId(res.items[0].id);
        }
      } catch (err) {
        console.error('Failed to load employees:', err);
      }
    };
    loadEmployees();
  }, [isEditing]);

  // Load attendance record if editing
  useEffect(() => {
    if (!isEditing || !id) return;
    const loadRecord = async () => {
      try {
        setLoading(true);
        const record = await attendanceService.getAttendance(parseInt(id, 10));
        setSelectedEmployeeId(record.employee_id);
        setAttendanceDate(record.date);
        setStatusVal(record.status);
        setNotes(record.notes || '');

        if (record.check_in) {
          const inDt = new Date(record.check_in);
          setCheckInDate(record.check_in.split('T')[0]);
          const inH = inDt.getHours().toString().padStart(2, '0');
          const inM = inDt.getMinutes().toString().padStart(2, '0');
          setCheckInTime(`${inH}:${inM}`);
        }

        if (record.check_out) {
          setHasCheckOut(true);
          const outDt = new Date(record.check_out);
          setCheckOutDate(record.check_out.split('T')[0]);
          const outH = outDt.getHours().toString().padStart(2, '0');
          const outM = outDt.getMinutes().toString().padStart(2, '0');
          setCheckOutTime(`${outH}:${outM}`);
        } else {
          setHasCheckOut(false);
        }

        setWorkedPreview(record.worked_hours);
        setExpectedPreview(record.expected_hours);
        setOvertimePreview(record.overtime_hours);
        setLatePreview(record.late_minutes);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load attendance record.');
      } finally {
        setLoading(false);
      }
    };
    loadRecord();
  }, [id, isEditing]);

  // Client-side live calculation preview
  useEffect(() => {
    if (!checkInDate || !checkInTime) return;

    if (!hasCheckOut || !checkOutDate || !checkOutTime) {
      setWorkedPreview(0.0);
      setOvertimePreview(0.0);
      return;
    }

    try {
      const inDt = new Date(`${checkInDate}T${checkInTime}:00`);
      const outDt = new Date(`${checkOutDate}T${checkOutTime}:00`);

      if (outDt < inDt) {
        setWorkedPreview(0.0);
        setOvertimePreview(0.0);
        return;
      }

      const elapsedSec = (outDt.getTime() - inDt.getTime()) / 1000;
      const elapsedHrs = elapsedSec / 3600.0;
      const breakHrs = 1.0; // standard default
      const worked = elapsedHrs > breakHrs ? elapsedHrs - breakHrs : elapsedHrs;
      const roundedWorked = Math.max(0, Math.round(worked * 100) / 100);
      setWorkedPreview(roundedWorked);

      const exp = expectedPreview || 8.0;
      const ot = Math.max(0, Math.round((roundedWorked - exp) * 100) / 100);
      setOvertimePreview(ot);

      // Late arrival preview compared to 09:00
      const expIn = new Date(`${checkInDate}T09:00:00`);
      if (inDt > expIn) {
        const lateMins = Math.floor((inDt.getTime() - expIn.getTime()) / 60000);
        setLatePreview(lateMins);
      } else {
        setLatePreview(0);
      }
    } catch {
      // ignore
    }
  }, [checkInDate, checkInTime, hasCheckOut, checkOutDate, checkOutTime, expectedPreview]);

  // Selected employee metadata
  const selectedEmp = employees.find((e) => e.id === selectedEmployeeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      setError('Please select an employee.');
      return;
    }

    setSubmitting(true);
    setError(null);

    const checkInIso = `${checkInDate}T${checkInTime}:00`;
    const checkOutIso = hasCheckOut ? `${checkOutDate}T${checkOutTime}:00` : undefined;

    try {
      if (isEditing && id) {
        await attendanceService.updateAttendance(parseInt(id, 10), {
          date: attendanceDate,
          check_in: checkInIso,
          check_out: checkOutIso,
          status: statusVal,
          notes: notes.trim() || undefined
        });
        setSuccessMessage('Attendance record updated successfully.');
      } else {
        await attendanceService.createAttendance({
          employee_id: selectedEmployeeId as number,
          date: attendanceDate,
          check_in: checkInIso,
          check_out: checkOutIso,
          notes: notes.trim() || undefined
        });
        setSuccessMessage('Attendance record created successfully.');
      }

      window.dispatchEvent(new CustomEvent('attendance-updated'));
      setTimeout(() => {
        navigate('/attendance');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save attendance record.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !id) return;
    if (!window.confirm('Are you sure you want to delete this attendance record?')) return;

    try {
      setSubmitting(true);
      await attendanceService.deleteAttendance(parseInt(id, 10));
      window.dispatchEvent(new CustomEvent('attendance-updated'));
      navigate('/attendance');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete attendance record.');
      setSubmitting(false);
    }
  };

  const formatHours = (hrs: number) => {
    if (!hrs || hrs <= 0) return '0h 00m';
    const h = Math.floor(hrs);
    const m = Math.round((hrs - h) * 60);
    return `${h}h ${m.toString().padStart(2, '0')}m`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#714B67] mb-3" />
        <p className="text-sm font-medium">Loading attendance details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Toast Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-lg shadow-sm flex items-center gap-2 text-sm font-medium animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/attendance"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Back to Attendance list"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">
              <span>Attendance</span>
              <span>/</span>
              <span className="text-[#714B67]">{isEditing ? `Record #${id}` : 'New Attendance'}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#714B67]" />
              {isEditing ? `Edit Attendance #${id}` : 'Create Manual Attendance'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && canManageHR && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/attendance')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            form="attendance-form"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#714B67] hover:bg-[#5b3c53] rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isEditing ? 'Update Record' : 'Save Attendance'}</span>
          </button>
        </div>
      </div>

      {/* Main Form Layout */}
      <form id="attendance-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Inputs */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <User className="w-4 h-4 text-[#714B67]" />
              Employee & Schedule Assignment
            </h2>

            {/* Employee Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Employee <span className="text-rose-500">*</span>
              </label>
              <select
                disabled={isEditing}
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-[#714B67]/20 focus:border-[#714B67] disabled:bg-slate-100"
              >
                <option value="">Select an employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.employee_code}) — {emp.department}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected Employee Info Preview */}
            {selectedEmp && (
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Department</span>
                  <div className="font-semibold text-slate-800">{selectedEmp.department}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Job Position</span>
                  <div className="font-semibold text-slate-800">{selectedEmp.job_position}</div>
                </div>
              </div>
            )}

            {/* Date Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Attendance Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={attendanceDate}
                onChange={(e) => {
                  setAttendanceDate(e.target.value);
                  setCheckInDate(e.target.value);
                  setCheckOutDate(e.target.value);
                }}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>

          {/* Timestamps Section */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#714B67]" />
              Check In & Check Out Timestamps
            </h2>

            {/* Check In */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Check-In Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#714B67]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Check-In Time <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={checkInTime}
                  onChange={(e) => setCheckInTime(e.target.value)}
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#714B67]"
                />
              </div>
            </div>

            {/* Check Out Toggle */}
            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCheckOut}
                  onChange={(e) => setHasCheckOut(e.target.checked)}
                  className="rounded border-slate-300 text-[#714B67] focus:ring-[#714B67]"
                />
                <span>Include Check Out timestamp (uncheck for ongoing active shift)</span>
              </label>
            </div>

            {/* Check Out Date & Time */}
            {hasCheckOut && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Check-Out Date
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#714B67]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Check-Out Time
                  </label>
                  <input
                    type="time"
                    value={checkOutTime}
                    onChange={(e) => setCheckOutTime(e.target.value)}
                    className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-lg p-2 focus:outline-none focus:border-[#714B67]"
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Internal HR / Attendance Notes
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Approved external meeting, deployment overtime, doctor appointment..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:border-[#714B67]"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Server Recalculation Preview */}
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-4 h-4 text-[#714B67]" />
              Calculated Hours Preview
            </h3>

            <div className="space-y-3 text-xs">
              {/* Worked Hours */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50/60 border border-emerald-100">
                <span className="font-medium text-emerald-900">Worked Hours:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  {formatHours(workedPreview)}
                </span>
              </div>

              {/* Expected Hours */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-medium text-slate-600">Expected Hours:</span>
                <span className="font-mono font-bold text-slate-800 text-sm">
                  {expectedPreview}h
                </span>
              </div>

              {/* Overtime */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50/60 border border-purple-100">
                <span className="font-medium text-purple-900">Overtime:</span>
                <span className="font-mono font-bold text-purple-700 text-sm">
                  {overtimePreview > 0 ? `+${formatHours(overtimePreview)}` : '0h 00m'}
                </span>
              </div>

              {/* Late Arrival */}
              {latePreview > 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-orange-50/60 border border-orange-100">
                  <span className="font-medium text-orange-900">Late Arrival:</span>
                  <span className="font-mono font-bold text-orange-700 text-sm">
                    +{latePreview} min
                  </span>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
              <span className="font-semibold text-slate-700">Authoritative Calculation:</span> Server will recalculate final worked hours, overtime, and break deductions based on the employee's assigned Working Schedule upon submission.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
export default AttendanceFormPage;
