import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Settings2,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Palette,
  RefreshCw
} from 'lucide-react';
import { timeOffService } from '../services/timeOffService';
import type { LeaveUnit, ApprovalType, PayrollBehavior } from '../types';

export const TimeOffTypeFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState<boolean>(isEditing);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState<string>('');
  const [unit, setUnit] = useState<LeaveUnit>('days');
  const [requiresAllocation, setRequiresAllocation] = useState<boolean>(true);
  const [isUnpaid, setIsUnpaid] = useState<boolean>(false);
  const [approvalType, setApprovalType] = useState<ApprovalType | string>('hr');
  const [payrollBehavior, setPayrollBehavior] = useState<PayrollBehavior | string>('paid');
  const [color, setColor] = useState<string>('#017E84');
  const [active, setActive] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');

  const PRESET_COLORS = [
    '#017E84', '#0284C7', '#6366F1', '#8B5CF6', '#EC4899', 
    '#F43F5E', '#EA580C', '#D97706', '#10B981', '#64748B'
  ];

  useEffect(() => {
    if (isEditing && id) {
      const fetchType = async () => {
        try {
          setLoading(true);
          const t = await timeOffService.getType(parseInt(id, 10));
          setName(t.name);
          setUnit(t.unit || 'days');
          setRequiresAllocation(t.requires_allocation);
          setIsUnpaid(t.is_unpaid);
          setApprovalType(t.approval_type || 'hr');
          setPayrollBehavior(t.payroll_behavior || (t.is_unpaid ? 'unpaid' : 'paid'));
          setColor(t.color || '#017E84');
          setActive(t.active);
          setNotes(t.notes || '');
        } catch (err: any) {
          console.error('Failed to load type:', err);
          setError(err.response?.data?.detail || 'Failed to load time off type.');
        } finally {
          setLoading(false);
        }
      };
      fetchType();
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Type name is required.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        name: name.trim(),
        unit,
        requires_allocation: requiresAllocation,
        is_unpaid: isUnpaid || payrollBehavior === 'unpaid',
        approval_type: approvalType,
        payroll_behavior: isUnpaid ? 'unpaid' : payrollBehavior,
        color,
        active,
        notes: notes.trim() || undefined
      };

      if (isEditing && id) {
        await timeOffService.updateType(parseInt(id, 10), payload);
        setSuccessMessage('Time off type updated successfully.');
      } else {
        await timeOffService.createType(payload);
        setSuccessMessage('Time off type created successfully.');
      }

      setTimeout(() => navigate('/time-off/types'), 1000);
    } catch (err: any) {
      console.error('Error saving type:', err);
      setError(err.response?.data?.detail || 'Failed to save time off type.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-8 h-8 animate-spin text-odoo-purple" />
        <span>Loading time off type...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/time-off/types')}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings2 className="w-6 h-6 text-odoo-purple" />
            {isEditing ? `Edit Time Off Type: ${name}` : 'New Time Off Type'}
          </h1>
          <p className="text-xs text-slate-500">
            Define calculation units, allocation requirements, and payroll link rules.
          </p>
        </div>
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

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Type Name */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Type Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Annual Paid Leave, Medical Sick Leave, Comp Off"
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm font-semibold"
            />
          </div>

          {/* Unit */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Leave Unit <span className="text-rose-500">*</span>
            </label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value as LeaveUnit)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            >
              <option value="days">Days (Whole/Working Days)</option>
              <option value="hours">Hours (Hourly/Shift)</option>
            </select>
          </div>

          {/* Requires Allocation */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Requires Allocation
            </label>
            <select
              value={requiresAllocation ? 'true' : 'false'}
              onChange={(e) => setRequiresAllocation(e.target.value === 'true')}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            >
              <option value="true">Yes (Employee must have approved allocation balance)</option>
              <option value="false">No (Unlimited / Direct request without quota)</option>
            </select>
          </div>

          {/* Approval Configuration */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Approval Workflow
            </label>
            <select
              value={approvalType}
              onChange={(e) => setApprovalType(e.target.value as ApprovalType)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            >
              <option value="hr">HR Manager Approval</option>
              <option value="manager">Direct Manager Approval</option>
              <option value="both">Manager + HR Approval</option>
              <option value="no_approval">No Approval Required (Auto-Approved)</option>
            </select>
          </div>

          {/* Payroll Behavior */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Payroll / Work Entry Behavior
            </label>
            <select
              value={isUnpaid || payrollBehavior === 'unpaid' ? 'unpaid' : payrollBehavior}
              onChange={(e) => {
                const val = e.target.value;
                setPayrollBehavior(val);
                setIsUnpaid(val === 'unpaid');
              }}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            >
              <option value="paid">Paid Leave (Standard Salary)</option>
              <option value="unpaid">Unpaid Leave (Triggers LOP / Salary Deduction)</option>
              <option value="not_applicable">Not Applicable</option>
            </select>
          </div>
        </div>

        {/* Display Color Picker */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-slate-400" />
            Display Color (Calendar & Badge Tag)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border border-slate-300 p-0.5 shadow-sm"
            />
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color.toLowerCase() === c.toLowerCase() ? 'scale-125 ring-2 ring-offset-2 ring-odoo-purple' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
          <input
            type="checkbox"
            id="active-toggle"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            className="w-4 h-4 text-odoo-purple rounded focus:ring-odoo-purple"
          />
          <label htmlFor="active-toggle" className="text-sm font-semibold text-slate-700 cursor-pointer">
            Active for new requests
          </label>
          <span className="text-xs text-slate-400 ml-auto">
            Inactive types are hidden from new requests but preserved for historical audits.
          </span>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Notes / Policy Guidelines
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Policy description, eligibility rules, or documentation references..."
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/time-off/types')}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 text-sm font-semibold text-white bg-odoo-purple hover:bg-purple-900 rounded-lg shadow transition-colors flex items-center gap-2"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Save Changes' : 'Create Time Off Type'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimeOffTypeFormPage;
