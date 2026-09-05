import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Clock, 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Building2, 
  Globe, 
  Calendar,
  Sparkles,
  Power
} from 'lucide-react';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { WorkingScheduleDay } from '../types';

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Paris",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney"
];

export const WorkingScheduleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManageHR } = useAuth();
  const isNew = !id || id === 'new';

  const [name, setName] = useState<string>('');
  const [company, setCompany] = useState<string>('PeoplePay360 Inc.');
  const [timezone, setTimezone] = useState<string>('Asia/Kolkata');
  const [status, setStatus] = useState<string>('active');
  const [days, setDays] = useState<WorkingScheduleDay[]>([
    { day_of_week: 'Monday', start_time: '09:00', end_time: '18:00', break_hours: 1.0, daily_hours: 8.0 },
    { day_of_week: 'Tuesday', start_time: '09:00', end_time: '18:00', break_hours: 1.0, daily_hours: 8.0 },
    { day_of_week: 'Wednesday', start_time: '09:00', end_time: '18:00', break_hours: 1.0, daily_hours: 8.0 },
    { day_of_week: 'Thursday', start_time: '09:00', end_time: '18:00', break_hours: 1.0, daily_hours: 8.0 },
    { day_of_week: 'Friday', start_time: '09:00', end_time: '18:00', break_hours: 1.0, daily_hours: 8.0 },
  ]);

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Client-side calculations helper
  const computeDailyHours = (startTime: string, endTime: string, breakHours: number): number => {
    if (!startTime || !endTime) return 0;
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return 0;

    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;
    let elapsed = endMin < startMin ? (24 * 60 - startMin) + endMin : endMin - startMin;
    const breakMin = (breakHours || 0) * 60;
    const workedMin = Math.max(0, elapsed - breakMin);
    return parseFloat((workedMin / 60).toFixed(2));
  };

  // Recompute daily hours whenever row inputs change
  const handleDayChange = (index: number, field: keyof WorkingScheduleDay, value: any) => {
    const updated = [...days];
    const item = { ...updated[index], [field]: value };
    
    // Auto recalculate daily hours for this row
    const dailyHrs = computeDailyHours(item.start_time, item.end_time, parseFloat(item.break_hours as any) || 0);
    item.daily_hours = dailyHrs;

    updated[index] = item;
    setDays(updated);
  };

  // Add next available weekday
  const handleAddDay = () => {
    const configuredDays = new Set(days.map(d => d.day_of_week));
    const nextDay = WEEKDAYS.find(d => !configuredDays.has(d)) || 'Monday';
    
    const newRow: WorkingScheduleDay = {
      day_of_week: nextDay,
      start_time: '09:00',
      end_time: '18:00',
      break_hours: 1.0,
      daily_hours: 8.0
    };
    setDays([...days, newRow]);
  };

  const handleRemoveDay = (index: number) => {
    const updated = days.filter((_, i) => i !== index);
    setDays(updated);
  };

  // Fetch existing schedule if editing
  useEffect(() => {
    if (!isNew && id) {
      const fetchSchedule = async () => {
        setError(null);
        try {
          const res = await apiClient.get(`/working-schedules/${id}`);
          const s = res.data;
          setName(s.name);
          setCompany(s.company);
          setTimezone(s.timezone);
          setStatus(s.status);
          setDays(s.days || []);
        } catch (err: any) {
          console.error('Failed to load schedule:', err);
          setError(err.response?.data?.detail || 'Failed to load schedule.');
        }
      };
      fetchSchedule();
    }
  }, [id, isNew]);

  // Derived metrics
  const uniqueDays = new Set(days.map(d => d.day_of_week));
  const hasDuplicateDays = uniqueDays.size !== days.length;
  const daysPerWeek = uniqueDays.size;
  const totalWeeklyHours = parseFloat(days.reduce((acc, d) => acc + (d.daily_hours || 0), 0).toFixed(2));

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Schedule Name is required.');
      return;
    }
    if (days.length === 0) {
      setError('At least one working day must be configured.');
      return;
    }
    if (hasDuplicateDays) {
      setError('A working day cannot be configured more than once in the same schedule.');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      name: name.trim(),
      company: company.trim(),
      timezone: timezone,
      status: status,
      days: days.map(d => ({
        day_of_week: d.day_of_week,
        start_time: d.start_time,
        end_time: d.end_time,
        break_hours: parseFloat(d.break_hours as any) || 0.0
      }))
    };

    try {
      if (isNew) {
        const res = await apiClient.post('/working-schedules', payload);
        setSuccessMessage('Working Schedule created successfully!');
        setTimeout(() => navigate(`/working-schedules/${res.data.id}`), 1000);
      } else {
        await apiClient.put(`/working-schedules/${id}`, payload);
        setSuccessMessage('Working Schedule updated successfully!');
      }
    } catch (err: any) {
      console.error('Save failed:', err);
      setError(err.response?.data?.detail || 'Failed to save working schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    if (isNew || !id) return;
    try {
      const res = await apiClient.patch(`/working-schedules/${id}/status`);
      setStatus(res.data.status);
      setSuccessMessage(`Schedule status updated to ${res.data.status}.`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to toggle status.');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/working-schedules')}
            className="p-2 rounded-lg text-slate-500 hover:text-odoo-purple hover:bg-purple-50 transition-colors cursor-pointer"
            title="Back to Working Schedules"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Configuration</span>
              <span>/</span>
              <span>Working Schedules</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight mt-0.5">
              {isNew ? 'New Working Schedule' : name || 'Edit Working Schedule'}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isNew && canManageHR && (
            <button
              type="button"
              onClick={handleToggleStatus}
              className={`px-3 py-2 text-xs font-semibold rounded-md border transition-colors flex items-center gap-1.5 cursor-pointer ${
                status === 'active'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{status === 'active' ? 'Deactivate' : 'Activate'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/working-schedules')}
            className="odoo-btn-secondary text-xs px-3 py-2 cursor-pointer"
          >
            Cancel
          </button>

          {canManageHR && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="odoo-btn-primary text-xs px-4 py-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Schedule'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-700 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Validation Error</h4>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-sm text-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Schedule General Metadata Card */}
        <div className="odoo-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-5 h-5 text-odoo-purple" />
              Schedule Identification
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={!canManageHR}
                className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-odoo-purple cursor-pointer"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Schedule Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                Schedule Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 40 Hours / Week, Night Shift, Retail Weekend"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canManageHR}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 focus:border-odoo-purple transition-all"
              />
              <p className="text-[11px] text-slate-400">Descriptive name identifying shift duration and schedule type.</p>
            </div>

            {/* Timezone */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Timezone <span className="text-rose-500">*</span>
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={!canManageHR}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 focus:border-odoo-purple bg-white transition-all cursor-pointer"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">Timestamps and attendance baseline apply in this timezone.</p>
            </div>

            {/* Company */}
            <div className="space-y-1.5 md:col-span-3">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                Company
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                disabled={!canManageHR}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-odoo-purple/30 focus:border-odoo-purple transition-all"
              />
            </div>
          </div>

          {/* Real-time Computed Summary Badges */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-odoo-purple" />
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Computed Schedule Totals</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Days / Week:</span>
                <span className="text-base font-bold text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-200 shadow-xs">
                  {daysPerWeek}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Total Weekly Hours:</span>
                <span className="text-base font-bold text-odoo-purple bg-purple-50 px-2.5 py-0.5 rounded border border-purple-200 shadow-xs">
                  {totalWeeklyHours} hrs
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Days Builder */}
        <div className="odoo-card p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-odoo-purple" />
                Weekly Schedule Days
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define the expected shift timings and break for each working day. Daily hours are calculated automatically.
              </p>
            </div>

            {canManageHR && (
              <button
                type="button"
                onClick={handleAddDay}
                className="odoo-btn-secondary text-xs px-3 py-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-odoo-purple" />
                <span>Add Day</span>
              </button>
            )}
          </div>

          {hasDuplicateDays && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Warning: Duplicate working days detected. Each weekday should be configured at most once.</span>
            </div>
          )}

          {days.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No working days configured</p>
              <p className="text-xs text-slate-400 mt-1">Click "Add Day" above to specify working days.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Day of Week</th>
                    <th className="py-2.5 px-3">Start Time</th>
                    <th className="py-2.5 px-3">End Time</th>
                    <th className="py-2.5 px-3">Break (Hours)</th>
                    <th className="py-2.5 px-3">Daily Worked Hours</th>
                    {canManageHR && <th className="py-2.5 px-3 text-right">Remove</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {days.map((dayRow, index) => {
                    const isOvernight = dayRow.start_time && dayRow.end_time && dayRow.end_time < dayRow.start_time;

                    return (
                      <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                        {/* Day dropdown */}
                        <td className="py-2.5 px-3">
                          <select
                            value={dayRow.day_of_week}
                            onChange={(e) => handleDayChange(index, 'day_of_week', e.target.value)}
                            disabled={!canManageHR}
                            className="w-full sm:w-36 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-odoo-purple cursor-pointer"
                          >
                            {WEEKDAYS.map(w => (
                              <option key={w} value={w}>{w}</option>
                            ))}
                          </select>
                        </td>

                        {/* Start Time */}
                        <td className="py-2.5 px-3">
                          <input
                            type="time"
                            value={dayRow.start_time}
                            onChange={(e) => handleDayChange(index, 'start_time', e.target.value)}
                            disabled={!canManageHR}
                            className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-odoo-purple bg-white"
                          />
                        </td>

                        {/* End Time */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="time"
                              value={dayRow.end_time}
                              onChange={(e) => handleDayChange(index, 'end_time', e.target.value)}
                              disabled={!canManageHR}
                              className="px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-odoo-purple bg-white"
                            />
                            {isOvernight && (
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded" title="Overnight shift crossing midnight">
                                +1d
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Break */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.25"
                              min="0"
                              max="12"
                              value={dayRow.break_hours}
                              onChange={(e) => handleDayChange(index, 'break_hours', parseFloat(e.target.value) || 0)}
                              disabled={!canManageHR}
                              className="w-20 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-odoo-purple bg-white"
                            />
                            <span className="text-xs text-slate-400">hrs</span>
                          </div>
                        </td>

                        {/* Computed Daily Hours */}
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-mono font-bold ${
                            (dayRow.daily_hours || 0) > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {dayRow.daily_hours} hrs
                          </span>
                        </td>

                        {/* Remove Row */}
                        {canManageHR && (
                          <td className="py-2.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveDay(index)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Remove day"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Visual Shift Timeline Preview */}
        <div className="odoo-card p-6 space-y-4">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Weekly Visual Shift Preview
          </h2>
          <p className="text-xs text-slate-500">
            Preview of working and non-working days for employee schedule visualization.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-7 gap-2.5 pt-2">
            {WEEKDAYS.map((dayName) => {
              const matchedRow = days.find(d => d.day_of_week.toLowerCase() === dayName.toLowerCase());
              const isWorking = !!matchedRow;

              return (
                <div
                  key={dayName}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isWorking
                      ? 'bg-emerald-50/70 border-emerald-200 text-slate-800 shadow-xs'
                      : 'bg-slate-50 border-slate-200/60 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs">{dayName.substring(0, 3)}</div>
                  <div className="text-[11px] text-slate-500 mt-1 font-medium">
                    {isWorking ? `${matchedRow.start_time} - ${matchedRow.end_time}` : 'OFF'}
                  </div>
                  {isWorking && (
                    <div className="mt-2 inline-flex items-center px-1.5 py-0.5 rounded bg-white text-emerald-800 font-bold text-[10px] border border-emerald-200 shadow-xs">
                      {matchedRow.daily_hours}h (Break: {matchedRow.break_hours}h)
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </form>
    </div>
  );
};
