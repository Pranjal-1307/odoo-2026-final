import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Layers,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  RefreshCw
} from 'lucide-react';
import { timeOffService } from '../services/timeOffService';
import { employeeService } from '../services/employeeService';
import type { TimeOffAllocation, TimeOffType, Employee } from '../types';

export const TimeOffAllocationFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [selectedTypeId, setSelectedTypeId] = useState<number | ''>('');
  const [allocatedAmount, setAllocatedAmount] = useState<number>(20.0);
  const [validityStart, setValidityStart] = useState<string>('');
  const [validityEnd, setValidityEnd] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [statusVal, setStatusVal] = useState<string>('approved');

  const [existingAllocation, setExistingAllocation] = useState<TimeOffAllocation | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [typesData, empData] = await Promise.all([
          timeOffService.getTypes(),
          employeeService.getEmployees({ limit: 100 })
        ]);

        setTypes(typesData.filter((t) => t.requires_allocation));
        setEmployees(empData.items);

        if (isEditing && id) {
          const alloc = await timeOffService.getAllocation(parseInt(id, 10));
          setExistingAllocation(alloc);
          setSelectedEmployeeId(alloc.employee_id);
          setSelectedTypeId(alloc.time_off_type_id);
          setAllocatedAmount(alloc.allocated_amount);
          setValidityStart(alloc.validity_start || '');
          setValidityEnd(alloc.validity_end || '');
          setNotes(alloc.notes || '');
          setStatusVal(alloc.status);
        } else {
          if (empData.items.length > 0) setSelectedEmployeeId(empData.items[0].id);
          const reqAllocTypes = typesData.filter((t) => t.requires_allocation);
          if (reqAllocTypes.length > 0) setSelectedTypeId(reqAllocTypes[0].id);
        }
      } catch (err: any) {
        console.error('Error loading allocation form:', err);
        setError(err.response?.data?.detail || 'Failed to initialize allocation form.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId || !selectedTypeId || allocatedAmount <= 0) {
      setError('Please provide a valid employee, leave type, and positive allocated amount.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (isEditing && existingAllocation) {
        await timeOffService.updateAllocation(existingAllocation.id, {
          allocated_amount: allocatedAmount,
          validity_start: validityStart || undefined,
          validity_end: validityEnd || undefined,
          notes: notes || undefined,
          status: statusVal
        });
        setSuccessMessage('Allocation updated successfully.');
        setTimeout(() => navigate('/time-off/allocations'), 1000);
      } else {
        await timeOffService.createAllocation({
          employee_id: Number(selectedEmployeeId),
          time_off_type_id: Number(selectedTypeId),
          allocated_amount: allocatedAmount,
          status: statusVal,
          validity_start: validityStart || undefined,
          validity_end: validityEnd || undefined,
          notes: notes || undefined
        });
        setSuccessMessage('Allocation created successfully.');
        setTimeout(() => navigate('/time-off/allocations'), 1000);
      }
    } catch (err: any) {
      console.error('Error saving allocation:', err);
      setError(err.response?.data?.detail || 'Failed to save allocation.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedTypeObj = types.find((t) => t.id === Number(selectedTypeId));

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-8 h-8 animate-spin text-odoo-purple" />
        <span>Loading allocation form...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/time-off/allocations')}
          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-6 h-6 text-odoo-purple" />
            {isEditing ? `Edit Allocation #${existingAllocation?.id}` : 'Grant Time Off Allocation'}
          </h1>
          <p className="text-xs text-slate-500">
            Define granted days/hours quota for an employee.
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
        {/* Status Tracker if existing */}
        {isEditing && existingAllocation && (
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-3 text-center">
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Allocated</div>
              <div className="text-lg font-bold text-slate-800">{existingAllocation.allocated_amount} {existingAllocation.unit}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Taken</div>
              <div className="text-lg font-bold text-amber-700">{existingAllocation.taken_amount} {existingAllocation.unit}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 uppercase font-semibold">Remaining</div>
              <div className="text-lg font-bold text-emerald-700">{existingAllocation.remaining_amount} {existingAllocation.unit}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Employee <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
              disabled={isEditing}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple disabled:bg-slate-100 shadow-sm"
            >
              <option value="">Select Employee</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.employee_code || emp.department})
                </option>
              ))}
            </select>
          </div>

          {/* Time Off Type */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Time Off Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedTypeId}
              onChange={(e) => setSelectedTypeId(Number(e.target.value))}
              disabled={isEditing}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple disabled:bg-slate-100 shadow-sm"
            >
              <option value="">Select Type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Allocated Amount */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Allocated Amount ({selectedTypeObj?.unit || 'days'}) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={allocatedAmount}
              onChange={(e) => setAllocatedAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Allocation Status
            </label>
            <select
              value={statusVal}
              onChange={(e) => setStatusVal(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            >
              <option value="approved">Approved (Active immediately)</option>
              <option value="draft">Draft (Pending Approval)</option>
              <option value="refused">Refused</option>
            </select>
          </div>
        </div>

        {/* Validity Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Validity Start Date (Optional)
            </label>
            <input
              type="date"
              value={validityStart}
              onChange={(e) => setValidityStart(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Validity End Date (Optional)
            </label>
            <input
              type="date"
              value={validityEnd}
              onChange={(e) => setValidityEnd(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Notes / Reference
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Annual leave quota grant for 2026."
            className="w-full bg-white border border-slate-300 rounded-lg p-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/time-off/allocations')}
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
            {isEditing ? 'Save Allocation' : 'Create Allocation'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TimeOffAllocationFormPage;
