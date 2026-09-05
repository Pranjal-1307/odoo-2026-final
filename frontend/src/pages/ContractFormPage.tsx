import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Save,
  Trash2,
  User as UserIcon,
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  contractService,
  ContractOptionsResponse,
  CreateContractPayload,
  UpdateContractPayload
} from '../services/contractService';
import type { Contract } from '../types';
import { useAuth } from '../context/AuthContext';

export const ContractFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const contractId = isNew ? null : parseInt(id, 10);
  const navigate = useNavigate();
  const { canManageHR, canManagePayroll, user } = useAuth();

  // State
  const [loading, setLoading] = useState<boolean>(!isNew);
  const [saving, setSaving] = useState<boolean>(false);
  const [optionsLoading, setOptionsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Dropdown options
  const [options, setOptions] = useState<ContractOptionsResponse>({
    employees: [],
    salary_structures: [],
    working_schedules: [],
    departments: [],
    job_positions: [],
  });

  // Form Fields
  const [formData, setFormData] = useState<{
    contract_code: string;
    name: string;
    employee_id: number | '';
    department: string;
    job_position: string;
    start_date: string;
    end_date: string;
    isOpenEnded: boolean;
    wage_per_month: number | '';
    status: string;
    working_schedule_id: number | '';
    salary_structure_id: number | '';
    notes: string;
  }>({
    contract_code: '',
    name: '',
    employee_id: '',
    department: '',
    job_position: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    isOpenEnded: true,
    wage_per_month: '',
    status: 'draft',
    working_schedule_id: '',
    salary_structure_id: '',
    notes: '',
  });

  const [existingContract, setExistingContract] = useState<Contract | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<{
    isOpen: boolean;
    action: 'activate' | 'cancel' | 'delete' | null;
    title: string;
    message: string;
  }>({
    isOpen: false,
    action: null,
    title: '',
    message: '',
  });

  // Load dropdown options
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        setOptionsLoading(true);
        const data = await contractService.getContractOptions();
        setOptions(data);
        if (isNew) {
          if (data.salary_structures.length > 0) {
            setFormData((prev) => ({
              ...prev,
              salary_structure_id: data.salary_structures[0].id,
            }));
          }
          if (data.working_schedules.length > 0) {
            setFormData((prev) => ({
              ...prev,
              working_schedule_id: data.working_schedules[0].id,
            }));
          }
        }
      } catch (err: any) {
        console.error('Error loading options:', err);
      } finally {
        setOptionsLoading(false);
      }
    };
    fetchOptions();
  }, [isNew]);

  // Load existing contract details if editing
  useEffect(() => {
    if (!isNew && contractId) {
      const fetchContract = async () => {
        try {
          setLoading(true);
          setError(null);
          const data = await contractService.getContract(contractId);
          setExistingContract(data);
          setFormData({
            contract_code: data.contract_code,
            name: data.name,
            employee_id: data.employee_id,
            department: data.department || '',
            job_position: data.job_position || '',
            start_date: data.start_date,
            end_date: data.end_date || '',
            isOpenEnded: !data.end_date,
            wage_per_month: data.wage_per_month,
            status: data.status,
            working_schedule_id: data.working_schedule_id || '',
            salary_structure_id: data.salary_structure_id,
            notes: data.notes || '',
          });
        } catch (err: any) {
          console.error('Error fetching contract:', err);
          setError(err.response?.data?.detail || 'Contract not found or access denied.');
        } finally {
          setLoading(false);
        }
      };
      fetchContract();
    }
  }, [contractId, isNew]);

  // Auto-fill employee details on employee select
  const handleEmployeeChange = (empId: number) => {
    const selectedEmp = options.employees.find((e) => e.id === empId);
    setFormData((prev) => ({
      ...prev,
      employee_id: empId,
      department: selectedEmp?.department || prev.department,
      job_position: selectedEmp?.job_position || prev.job_position,
      working_schedule_id: selectedEmp?.working_schedule_id || prev.working_schedule_id,
      name: prev.name || (selectedEmp ? `${selectedEmp.name} - Employment Contract` : prev.name),
    }));
  };

  // Form Submit (Save / Create / Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Basic Validation
    if (!formData.employee_id) {
      setError('Please select an employee.');
      return;
    }
    if (!formData.name.trim()) {
      setError('Please enter a contract title.');
      return;
    }
    if (!formData.start_date) {
      setError('Please provide a contract start date.');
      return;
    }
    if (!formData.isOpenEnded && formData.end_date && formData.end_date < formData.start_date) {
      setError('End date cannot be before start date.');
      return;
    }
    if (formData.wage_per_month === '' || Number(formData.wage_per_month) < 0) {
      setError('Monthly wage must be a non-negative number.');
      return;
    }
    if (!formData.salary_structure_id) {
      setError('Please select a salary structure.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name.trim(),
        employee_id: Number(formData.employee_id),
        department: formData.department || undefined,
        job_position: formData.job_position || undefined,
        start_date: formData.start_date,
        end_date: formData.isOpenEnded ? null : formData.end_date || null,
        wage_per_month: Number(formData.wage_per_month),
        status: formData.status,
        working_schedule_id: formData.working_schedule_id ? Number(formData.working_schedule_id) : null,
        salary_structure_id: Number(formData.salary_structure_id),
        notes: formData.notes.trim() || undefined,
      };

      if (isNew) {
        const created = await contractService.createContract({
          ...payload,
          contract_code: formData.contract_code.trim() || undefined,
        });
        setSuccessMsg('Contract created successfully!');
        setTimeout(() => {
          navigate(`/contracts/${created.id}`);
        }, 800);
      } else if (contractId) {
        const updated = await contractService.updateContract(contractId, payload);
        setExistingContract(updated);
        setSuccessMsg('Contract updated successfully!');
      }
    } catch (err: any) {
      console.error('Error saving contract:', err);
      setError(err.response?.data?.detail || 'Unable to save contract. Please check all fields.');
    } finally {
      setSaving(false);
    }
  };

  // Perform Modal Action
  const handlePerformModalAction = async () => {
    if (!contractId || !showConfirmModal.action) return;
    try {
      setSaving(true);
      setError(null);
      if (showConfirmModal.action === 'activate') {
        const res = await contractService.activateContract(contractId);
        setExistingContract(res);
        setFormData((prev) => ({ ...prev, status: res.status }));
        setSuccessMsg('Contract successfully activated to Running status!');
      } else if (showConfirmModal.action === 'cancel') {
        const res = await contractService.cancelContract(contractId);
        setExistingContract(res);
        setFormData((prev) => ({ ...prev, status: res.status }));
        setSuccessMsg('Contract cancelled / terminated.');
      } else if (showConfirmModal.action === 'delete') {
        await contractService.deleteContract(contractId);
        navigate('/contracts');
        return;
      }
    } catch (err: any) {
      console.error('Error updating contract state:', err);
      setError(err.response?.data?.detail || 'Action failed.');
    } finally {
      setSaving(false);
      setShowConfirmModal({ isOpen: false, action: null, title: '', message: '' });
    }
  };

  // Format currency
  const formatCurrency = (val: number | '') => {
    if (val === '') return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val));
  };

  // Status Stepper Active Indicator
  const currentStatus = formData.status.toLowerCase();

  return (
    <div className="space-y-5 pb-10">
      {/* Top Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2 text-xs">
          <Link
            to="/contracts"
            className="text-slate-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Contracts
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-semibold text-slate-800">
            {isNew ? 'New Contract' : existingContract?.contract_code || `Contract #${id}`}
          </span>
        </div>

        {/* Quick Action Buttons Header */}
        <div className="flex items-center gap-2">
          {!isNew && canManageHR && currentStatus === 'draft' && (
            <button
              type="button"
              onClick={() =>
                setShowConfirmModal({
                  isOpen: true,
                  action: 'activate',
                  title: 'Activate Contract?',
                  message:
                    'This will transition the contract to Running status. The system will verify that no overlapping active contract exists for this employee.',
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Activate Contract
            </button>
          )}

          {!isNew && canManageHR && currentStatus === 'running' && (
            <button
              type="button"
              onClick={() =>
                setShowConfirmModal({
                  isOpen: true,
                  action: 'cancel',
                  title: 'Cancel / Terminate Contract?',
                  message:
                    'This will mark the contract as Terminated. Historical payroll calculations will remain intact.',
                })
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Contract
            </button>
          )}

          {!isNew && canManageHR && (
            <button
              type="button"
              onClick={() =>
                setShowConfirmModal({
                  isOpen: true,
                  action: 'delete',
                  title: 'Delete Contract?',
                  message:
                    'Are you sure you want to permanently delete this contract? This is only possible if no payslips have been generated for it.',
                })
              }
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100"
              title="Delete Contract"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => navigate('/contracts')}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
          >
            Back
          </button>
        </div>
      </div>

      {/* Status Pipeline / Stepper Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Contract Lifecycle Stage
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-base font-bold text-slate-900">
                {isNew ? 'New Draft Contract' : existingContract?.name}
              </span>
              {existingContract?.contract_code && (
                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-mono text-xs rounded-md font-semibold">
                  {existingContract.contract_code}
                </span>
              )}
            </div>
          </div>

          {/* Stepper pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-lg text-xs font-semibold">
            <div
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                currentStatus === 'draft'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              1. Draft
            </div>
            <span className="text-slate-300">→</span>
            <div
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                currentStatus === 'running'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              2. Running
            </div>
            <span className="text-slate-300">→</span>
            <div
              className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                currentStatus === 'expired' || currentStatus === 'terminated'
                  ? currentStatus === 'expired'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-400'
              }`}
            >
              {currentStatus === 'terminated' ? (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  3. Cancelled
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  3. Expired
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-900">Validation Error</h4>
            <p className="text-xs text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-emerald-900">Success</h4>
            <p className="text-xs text-emerald-700 mt-0.5">{successMsg}</p>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left Column: Core Contract Details (2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Section 1: Employee & Position Information */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Employee & Position</h3>
                </div>
                {formData.employee_id && (
                  <Link
                    to={`/employees/${formData.employee_id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    View Employee Form
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee Select */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Employee <span className="text-rose-500">*</span>
                  </label>
                  <select
                    disabled={!isNew || !canManageHR}
                    value={formData.employee_id}
                    onChange={(e) => handleEmployeeChange(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 font-medium"
                    required
                  >
                    <option value="">-- Select Employee --</option>
                    {options.employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employee_code}) — {emp.department}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contract Title */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Contract Title / Reference <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    disabled={!canManageHR}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Aarav Mehta - Senior Engineer 2026"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 font-medium"
                    required
                  />
                </div>

                {/* Department */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <input
                    type="text"
                    disabled={!canManageHR}
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Engineering"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100"
                  />
                </div>

                {/* Job Position */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Position</label>
                  <input
                    type="text"
                    disabled={!canManageHR}
                    value={formData.job_position}
                    onChange={(e) => setFormData({ ...formData, job_position: e.target.value })}
                    placeholder="e.g. Senior Software Engineer"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Contract Dates & Interval */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Contract Period & Interval</h3>
                </div>
                <div className="text-[11px] text-slate-500">
                  Defines payroll applicability interval
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Start Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    disabled={!canManageHR}
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 font-medium"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">End Date</label>
                    <label className="flex items-center gap-1.5 text-[11px] text-indigo-600 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!canManageHR}
                        checked={formData.isOpenEnded}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isOpenEnded: e.target.checked,
                            end_date: e.target.checked ? '' : formData.end_date,
                          })
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Open-ended (No end date)
                    </label>
                  </div>
                  <input
                    type="date"
                    disabled={!canManageHR || formData.isOpenEnded}
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-400 font-medium"
                    placeholder="Select end date"
                  />
                </div>

                {/* Status selector */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    disabled={!canManageHR}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100 font-medium"
                  >
                    <option value="draft">Draft (Inactive / Staging)</option>
                    <option value="running">Running (Active for Payroll)</option>
                    <option value="expired">Expired (Historical Record)</option>
                    <option value="terminated">Cancelled / Terminated</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 3: Notes & Terms */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Notes & Special Clauses</h3>
              </div>
              <textarea
                rows={3}
                disabled={!canManageHR}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add revision reason, promotion details, or special terms..."
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 disabled:bg-slate-100"
              />
            </div>
          </div>

          {/* Right Column: Compensation, Schedule & Payroll Config */}
          <div className="space-y-5">
            {/* Compensation & Structure Card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Payroll & Compensation</h3>
              </div>

              {/* Monthly Wage */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Monthly Wage (₹) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    disabled={!canManageHR}
                    value={formData.wage_per_month}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        wage_per_month: e.target.value === '' ? '' : Number(e.target.value),
                      })
                    }
                    placeholder="60000"
                    className="w-full pl-7 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono font-bold text-slate-900"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Formatted:{' '}
                  <strong className="text-slate-700">{formatCurrency(formData.wage_per_month)}</strong> /
                  month
                </p>
              </div>

              {/* Salary Structure Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Salary Structure <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={!canManageHR}
                  value={formData.salary_structure_id}
                  onChange={(e) => setFormData({ ...formData, salary_structure_id: Number(e.target.value) })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                  required
                >
                  <option value="">-- Select Structure --</option>
                  {options.salary_structures.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Working Schedule Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Working Schedule
                </label>
                <select
                  disabled={!canManageHR}
                  value={formData.working_schedule_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      working_schedule_id: e.target.value ? Number(e.target.value) : '',
                    })
                  }
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
                >
                  <option value="">-- Default Schedule --</option>
                  {options.working_schedules.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name} ({ws.hours_per_week}h/week)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Historical Protection Notice */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-slate-600 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Info className="w-4 h-4 text-indigo-600" />
                Historical Salary Guarantee
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Creating or updating this contract preserves employee history. Past payruns and finalized payslips will retain their historical contract snapshot amounts.
              </p>
            </div>

            {/* Save Button */}
            {canManageHR && (
              <button
                type="submit"
                disabled={saving}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white font-semibold text-xs rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : isNew ? 'Create Contract' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-full ${
                  showConfirmModal.action === 'delete' || showConfirmModal.action === 'cancel'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{showConfirmModal.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Please confirm this action</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
              {showConfirmModal.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  setShowConfirmModal({ isOpen: false, action: null, title: '', message: '' })
                }
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformModalAction}
                disabled={saving}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                  showConfirmModal.action === 'delete' || showConfirmModal.action === 'cancel'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {saving ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ContractFormPage;
