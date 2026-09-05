import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  FileCheck,
  ShieldAlert,
  Eye,
  Check,
  X,
  Sparkles,
  Lock,
} from 'lucide-react';
import { payrunService } from '../services/payrunService';
import type {
  Payrun,
  EligibleEmployeeItem,
  PayrunValidationResponse,
  PayrunEmployee,
} from '../types';

export const PayrunWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resumeId = searchParams.get('resume_id');

  // Wizard Steps (1: Period, 2: Employees, 3: Validate, 4: Process, 5: Review/Finalize)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 Form Data
  const [company, setCompany] = useState('PeoplePay360 Inc.');
  const [payrunName, setPayrunName] = useState('');
  const [periodStart, setPeriodStart] = useState('2026-09-01');
  const [periodEnd, setPeriodEnd] = useState('2026-09-30');
  const [employeeType, setEmployeeType] = useState('All');

  // Step 2 Data
  const [eligibleEmployees, setEligibleEmployees] = useState<EligibleEmployeeItem[]>([]);
  const [ineligibleEmployees, setIneligibleEmployees] = useState<EligibleEmployeeItem[]>([]);
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<number>>(new Set());
  const [exclusionReasons, setExclusionReasons] = useState<Record<number, string>>({});
  const [deptFilter, setDeptFilter] = useState('all');
  const [excludeModalEmp, setExcludeModalEmp] = useState<EligibleEmployeeItem | null>(null);
  const [tempExclusionReason, setTempExclusionReason] = useState('');

  // Step 3 Data (Validation)
  const [validationData, setValidationData] = useState<PayrunValidationResponse | null>(null);

  // Active Payrun State
  const [createdPayrun, setCreatedPayrun] = useState<Payrun | null>(null);

  // Step 4 Data (Processing animation & progress)
  const [processingProgress, setProcessingProgress] = useState(0);

  // Step 5 Data (Trace Drawer & Finalize Modal)
  const [traceEmp, setTraceEmp] = useState<PayrunEmployee | null>(null);
  const [finalizeConfirmOpen, setFinalizeConfirmOpen] = useState(false);
  const [recalculatingEmpId, setRecalculatingEmpId] = useState<number | null>(null);

  // Auto-generate name based on period
  useEffect(() => {
    if (periodStart) {
      const d = new Date(periodStart);
      if (!isNaN(d.getTime())) {
        const monthName = d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
        setPayrunName(`${monthName} Payroll`);
      }
    }
  }, [periodStart]);

  // Resume logic if resume_id passed
  useEffect(() => {
    if (resumeId) {
      loadExistingPayrun(parseInt(resumeId, 10));
    }
  }, [resumeId]);

  const loadExistingPayrun = async (id: number) => {
    try {
      setLoading(true);
      const data = await payrunService.getPayrun(id);
      setCreatedPayrun(data);
      setPayrunName(data.name);
      setCompany(data.company);
      setPeriodStart(data.period_start);
      setPeriodEnd(data.period_end);
      setEmployeeType(data.employee_type);

      if (data.status === 'review') {
        setCurrentStep(5);
      } else if (data.status === 'processing') {
        setCurrentStep(4);
      } else {
        setCurrentStep(2);
        fetchEligibility(data.company, data.period_start, data.period_end, data.employee_type);
      }
    } catch (err: any) {
      setError('Failed to resume payrun');
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibility = async (comp: string, start: string, end: string, type: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await payrunService.getEligibleEmployees(comp, start, end, type);
      setEligibleEmployees(res.eligible_employees);
      setIneligibleEmployees(res.ineligible_employees);

      // Default select all eligible
      const ids = new Set<number>(res.eligible_employees.map((e) => e.employee_id));
      setSelectedEmpIds(ids);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to query employee eligibility');
    } finally {
      setLoading(false);
    }
  };

  // Step 1 Next Handler
  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodStart || !periodEnd) {
      setError('Please select valid payroll period dates.');
      return;
    }
    if (new Date(periodStart) > new Date(periodEnd)) {
      setError('Period start date cannot be after end date.');
      return;
    }
    await fetchEligibility(company, periodStart, periodEnd, employeeType);
    setCurrentStep(2);
  };

  // Step 2 Toggle Selection
  const toggleEmployee = (emp: EligibleEmployeeItem) => {
    const isSelected = selectedEmpIds.has(emp.employee_id);
    if (isSelected) {
      // Prompt for exclusion reason
      setExcludeModalEmp(emp);
      setTempExclusionReason('');
    } else {
      const next = new Set(selectedEmpIds);
      next.add(emp.employee_id);
      setSelectedEmpIds(next);

      const nextReasons = { ...exclusionReasons };
      delete nextReasons[emp.employee_id];
      setExclusionReasons(nextReasons);
    }
  };

  const confirmExclusion = () => {
    if (excludeModalEmp) {
      const next = new Set(selectedEmpIds);
      next.delete(excludeModalEmp.employee_id);
      setSelectedEmpIds(next);

      if (tempExclusionReason.trim()) {
        setExclusionReasons({
          ...exclusionReasons,
          [excludeModalEmp.employee_id]: tempExclusionReason.trim(),
        });
      }
      setExcludeModalEmp(null);
    }
  };

  const selectAll = () => {
    const all = new Set(eligibleEmployees.map((e) => e.employee_id));
    setSelectedEmpIds(all);
    setExclusionReasons({});
  };

  const deselectAll = () => {
    setSelectedEmpIds(new Set());
  };

  // Step 2 Next Handler -> Create / Save Payrun in Draft
  const handleStep2Submit = async () => {
    if (selectedEmpIds.size === 0) {
      setError('Please select at least one eligible employee to process.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let payrun = createdPayrun;
      if (!payrun) {
        payrun = await payrunService.createPayrun({
          name: payrunName,
          company,
          period_start: periodStart,
          period_end: periodEnd,
          employee_type: employeeType,
          selected_employee_ids: Array.from(selectedEmpIds),
        });
        setCreatedPayrun(payrun);
      } else {
        payrun = await payrunService.updateEmployeeSelection(
          payrun.id,
          Array.from(selectedEmpIds),
          exclusionReasons
        );
        setCreatedPayrun(payrun);
      }

      // Automatically run validation for Step 3
      const val = await payrunService.validatePayrun(payrun.id);
      setValidationData(val);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save payrun employee selection');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Next Handler -> Process Batch
  const handleStartProcessing = async () => {
    if (!createdPayrun) return;

    try {
      setLoading(true);
      setCurrentStep(4);
      setProcessingProgress(15);

      // Simulate step progress increments for smooth UX feedback
      const timer = setInterval(() => {
        setProcessingProgress((prev) => (prev < 90 ? prev + 15 : prev));
      }, 300);

      const processed = await payrunService.processPayrun(createdPayrun.id);
      clearInterval(timer);
      setProcessingProgress(100);

      setTimeout(() => {
        setCreatedPayrun(processed);
        setLoading(false);
        setCurrentStep(5);
      }, 500);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.detail || 'Failed to calculate payrun');
      setCurrentStep(3);
    }
  };

  // Step 5 Recalculate Single Employee
  const handleRecalculateEmployee = async (empId: number) => {
    if (!createdPayrun) return;
    try {
      setRecalculatingEmpId(empId);
      await payrunService.recalculateEmployee(createdPayrun.id, empId);

      // Refresh Payrun
      const refreshed = await payrunService.getPayrun(createdPayrun.id);
      setCreatedPayrun(refreshed);

      // If drawer is open, update drawer data
      if (traceEmp && traceEmp.employee_id === empId) {
        const updatedTrace = await payrunService.getEmployeeCalculationDetail(createdPayrun.id, empId);
        setTraceEmp(updatedTrace);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Recalculation failed');
    } finally {
      setRecalculatingEmpId(null);
    }
  };

  // Step 5 Finalize Payrun
  const handleFinalize = async () => {
    if (!createdPayrun) return;
    try {
      setLoading(true);
      setError(null);
      const finalized = await payrunService.finalizePayrun(createdPayrun.id);
      setCreatedPayrun(finalized);
      setFinalizeConfirmOpen(false);
      navigate(`/payroll/payruns/${finalized.id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Finalization failed');
      setFinalizeConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Filtered employees for Step 2
  const departments = Array.from(new Set(eligibleEmployees.map((e) => e.department)));
  const filteredEligible = deptFilter === 'all'
    ? eligibleEmployees
    : eligibleEmployees.filter((e) => e.department === deptFilter);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Wizard Step Progress Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-odoo-purple bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
              Interactive Payroll Wizard
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1">
              {payrunName || 'Create Payroll Run'}
            </h1>
          </div>
          <button
            onClick={() => navigate('/payroll/payruns')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 self-start sm:self-auto"
          >
            <X className="w-4 h-4" />
            Cancel & Exit
          </button>
        </div>

        {/* Step Indicator */}
        <div className="grid grid-cols-5 gap-2 relative">
          {[
            { step: 1, title: 'Period', icon: Calendar },
            { step: 2, title: 'Employees', icon: Users },
            { step: 3, title: 'Validate', icon: ShieldAlert },
            { step: 4, title: 'Process', icon: Sparkles },
            { step: 5, title: 'Review & Finalize', icon: FileCheck },
          ].map((item) => {
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;
            const Icon = item.icon;

            return (
              <div
                key={item.step}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-purple-50/80 border border-purple-200'
                    : isDone
                    ? 'opacity-80'
                    : 'opacity-40'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-sm mb-1.5 transition-colors ${
                    isDone
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-odoo-purple text-white ring-4 ring-purple-100'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={`text-[11px] font-bold ${isCurrent ? 'text-odoo-purple' : 'text-slate-600'}`}>
                  {item.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm animate-shake">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)} className="font-bold hover:text-rose-900">×</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 1: Payroll Period & Company Selection              */}
      {/* ======================================================== */}
      {currentStep === 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Step 1 — Payroll Period & Company</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select the company and payroll period dates for this payrun batch.
            </p>
          </div>

          {/* Quick Month Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'September 2026', start: '2026-09-01', end: '2026-09-30' },
                { label: 'October 2026', start: '2026-10-01', end: '2026-10-31' },
                { label: 'November 2026', start: '2026-11-01', end: '2026-11-30' },
                { label: 'December 2026', start: '2026-12-01', end: '2026-12-31' },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setPeriodStart(preset.start);
                    setPeriodEnd(preset.end);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    periodStart === preset.start && periodEnd === preset.end
                      ? 'bg-purple-50 border-odoo-purple text-odoo-purple shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleStep1Submit} className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Payrun Name
              </label>
              <input
                type="text"
                required
                value={payrunName}
                onChange={(e) => setPayrunName(e.target.value)}
                placeholder="e.g. September 2026 Payroll"
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Company
              </label>
              <select
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none bg-white"
              >
                <option value="PeoplePay360 Inc.">PeoplePay360 Inc.</option>
                <option value="ABC Technologies Pvt. Ltd.">ABC Technologies Pvt. Ltd.</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Period Start Date
              </label>
              <input
                type="date"
                required
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Period End Date
              </label>
              <input
                type="date"
                required
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-odoo-purple hover:bg-purple-900 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>Find Eligible Employees</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: Employee Eligibility & Selection                */}
      {/* ======================================================== */}
      {currentStep === 2 && (
        <div className="space-y-6">
          {/* Eligibility Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Eligible Employees</p>
                <p className="text-xl font-bold text-emerald-600">{eligibleEmployees.length}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-50 text-odoo-purple flex items-center justify-center font-bold">
                ☑
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Selected for Processing</p>
                <p className="text-xl font-bold text-odoo-purple">{selectedEmpIds.size}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                ✗
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase">Ineligible Employees</p>
                <p className="text-xl font-bold text-rose-600">{ineligibleEmployees.length}</p>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Step 2 — Review & Select Employees</h2>
                <p className="text-xs text-slate-500">
                  Select which eligible employees to include in this payroll batch. Excluded employees will not be processed.
                </p>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2">
                {departments.length > 1 && (
                  <select
                    value={deptFilter}
                    onChange={(e) => setDeptFilter(e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 bg-white"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={selectAll}
                  className="px-2.5 py-1.5 text-xs font-semibold text-odoo-purple hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={deselectAll}
                  className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Eligible Employees Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center">Include</th>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Department & Role</th>
                    <th className="py-2.5 px-4">Contract Wage</th>
                    <th className="py-2.5 px-4">Salary Structure</th>
                    <th className="py-2.5 px-4">Status / Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredEligible.map((emp) => {
                    const isSelected = selectedEmpIds.has(emp.employee_id);
                    const reason = exclusionReasons[emp.employee_id];

                    return (
                      <tr
                        key={emp.employee_id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !isSelected ? 'bg-slate-50/50 opacity-60' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleEmployee(emp)}
                            className="w-4 h-4 text-odoo-purple rounded focus:ring-odoo-purple cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{emp.employee_name}</div>
                          <div className="text-xs text-slate-400">{emp.employee_code}</div>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <div className="font-medium text-slate-700">{emp.department}</div>
                          <div className="text-slate-400">{emp.job_position}</div>
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                          ₹{(emp.contract?.wage_per_month || 0).toLocaleString('en-IN')}/mo
                        </td>
                        <td className="py-3 px-4 text-xs">
                          <span className="px-2 py-0.5 rounded bg-purple-50 text-odoo-purple font-medium border border-purple-100">
                            {emp.salary_structure?.name || 'Standard'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs">
                          {isSelected ? (
                            <span className="text-emerald-600 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Eligible & Selected
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium italic">
                              Excluded: {reason || 'Manual exclusion'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Ineligible Employees List if any */}
            {ineligibleEmployees.length > 0 && (
              <div className="mt-4 border border-rose-100 rounded-xl bg-rose-50/40 p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-700 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  Ineligible Employees in Company ({ineligibleEmployees.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ineligibleEmployees.map((inelig) => (
                    <div
                      key={inelig.employee_id}
                      className="bg-white p-2.5 rounded-lg border border-rose-200 text-xs flex items-start gap-2"
                    >
                      <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">{inelig.employee_name}</span>{' '}
                        <span className="text-slate-400">({inelig.department})</span>
                        <p className="text-rose-600 mt-0.5">{inelig.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Period
              </button>

              <button
                type="button"
                onClick={handleStep2Submit}
                disabled={loading || selectedEmpIds.size === 0}
                className="px-6 py-2.5 bg-odoo-purple hover:bg-purple-900 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>Continue to Pre-Validation ({selectedEmpIds.size})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exclusion Reason Modal */}
      {excludeModalEmp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn space-y-4">
            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Exclude {excludeModalEmp.employee_name}?
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                This employee is eligible but will be skipped during payroll calculation. Enter an optional exclusion reason for audit compliance.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Exclusion Reason
              </label>
              <input
                type="text"
                placeholder="e.g. Salary under review, On unpaid sabbatical"
                value={tempExclusionReason}
                onChange={(e) => setTempExclusionReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExcludeModalEmp(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmExclusion}
                className="px-4 py-1.5 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white rounded-lg shadow-sm"
              >
                Confirm Exclusion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: Pre-Processing Validation                       */}
      {/* ======================================================== */}
      {currentStep === 3 && validationData && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Step 3 — Pre-Processing Validation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated diagnostics verify contracts, structures, bank accounts, and attendance stability before calculation.
            </p>
          </div>

          {/* Diagnostics KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-xs text-slate-500 font-semibold uppercase">Total Selected</p>
              <p className="text-xl font-bold text-slate-800">{validationData.total_selected}</p>
            </div>

            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <p className="text-xs text-emerald-600 font-semibold uppercase">Fully Valid</p>
              <p className="text-xl font-bold text-emerald-700">{validationData.valid_count}</p>
            </div>

            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
              <p className="text-xs text-amber-600 font-semibold uppercase">Warnings (Non-blocking)</p>
              <p className="text-xl font-bold text-amber-700">{validationData.warning_count}</p>
            </div>

            <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
              <p className="text-xs text-rose-600 font-semibold uppercase">Blocking Errors</p>
              <p className="text-xl font-bold text-rose-700">{validationData.error_count}</p>
            </div>
          </div>

          {/* Validation Checklist Items */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
              Employee Validation Status
            </div>
            <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {validationData.items.map((item) => (
                <div key={item.employee_id} className="p-3.5 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-800">{item.employee_name}</span>{' '}
                    <span className="text-slate-400">({item.department})</span>
                    {item.warnings.length > 0 && (
                      <div className="text-amber-600 mt-1 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {item.warnings.join(', ')}
                      </div>
                    )}
                    {item.errors.length > 0 && (
                      <div className="text-rose-600 mt-1 font-semibold flex items-center gap-1">
                        <X className="w-3.5 h-3.5" />
                        {item.errors.join(', ')}
                      </div>
                    )}
                  </div>
                  <div>
                    {item.is_valid ? (
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold rounded border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Ready
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded border border-rose-200 flex items-center gap-1">
                        <X className="w-3 h-3" /> Fix Required
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Employee Selection
            </button>

            <button
              type="button"
              onClick={handleStartProcessing}
              disabled={!validationData.can_process}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              <span>Process Payroll Batch</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: Live Payroll Processing Screen                  */}
      {/* ======================================================== */}
      {currentStep === 4 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-purple-50 border-4 border-odoo-purple/20 border-t-odoo-purple flex items-center justify-center mx-auto animate-spin">
            <Sparkles className="w-8 h-8 text-odoo-purple" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">Calculating Payroll...</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Executing deterministic Salary Rules Engine for {selectedEmpIds.size} employees. Resolving attendance hours, approved time off, and statutory deductions.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="max-w-md mx-auto space-y-2">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
              <div
                className="bg-gradient-to-r from-odoo-purple to-emerald-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-semibold text-slate-500">
              <span>Evaluating salary rules</span>
              <span>{processingProgress}%</span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 5: Review Results & Finalize                       */}
      {/* ======================================================== */}
      {currentStep === 5 && createdPayrun && (
        <div className="space-y-6">
          {/* Financial Aggregation Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Gross Salary</span>
              <p className="text-2xl font-bold text-slate-800 mt-1">
                ₹{(createdPayrun.total_gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Basic + Allowances</span>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Deductions</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                ₹{(createdPayrun.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">PF, PT, TDS & Unpaid Leave</span>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Net Pay</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                ₹{(createdPayrun.total_net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Payable to Employees</span>
            </div>

            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Employer Cost</span>
              <p className="text-2xl font-bold text-purple-700 mt-1">
                ₹{(createdPayrun.total_employer_cost || createdPayrun.total_gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">Gross + Employer Contributions</span>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Step 5 — Review Employee Calculations</h2>
                <p className="text-xs text-slate-500">
                  Inspect salary components, recalculate single employees if configuration was updated, and finalize payslips.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFinalizeConfirmOpen(true)}
                  disabled={createdPayrun.failed_employees > 0}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Finalize Payrun</span>
                </button>
              </div>
            </div>

            {/* Employee Results List */}
            <div className="border border-slate-200 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Employee</th>
                    <th className="py-2.5 px-4">Worked / Leave Days</th>
                    <th className="py-2.5 px-4 text-right">Gross Salary</th>
                    <th className="py-2.5 px-4 text-right">Deductions</th>
                    <th className="py-2.5 px-4 text-right">Net Salary</th>
                    <th className="py-2.5 px-4 text-center">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {createdPayrun.employees?.map((pe) => (
                    <tr key={pe.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">{pe.employee_name}</div>
                        <div className="text-xs text-slate-400">{pe.employee_code} · {pe.department}</div>
                      </td>

                      <td className="py-3 px-4 text-xs">
                        <div className="font-medium text-slate-700">{pe.worked_days || 0} worked days</div>
                        {pe.unpaid_leave_days > 0 && (
                          <div className="text-amber-600 font-semibold">{pe.unpaid_leave_days} unpaid days</div>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-slate-700">
                        ₹{(pe.gross_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-right font-semibold text-rose-600">
                        ₹{(pe.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        ₹{(pe.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-4 text-center">
                        {pe.status === 'success' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3" /> Success
                          </span>
                        ) : pe.status === 'failed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200" title={pe.error_message || ''}>
                            <X className="w-3 h-3" /> Failed
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 capitalize">{pe.status}</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setTraceEmp(pe)}
                            className="px-2.5 py-1 text-xs font-semibold text-odoo-purple hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Trace</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRecalculateEmployee(pe.employee_id)}
                            disabled={recalculatingEmpId === pe.employee_id}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors title='Recalculate Employee'"
                            title="Recalculate Employee"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${recalculatingEmpId === pe.employee_id ? 'animate-spin text-odoo-purple' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Calculation Trace Slide-Over Drawer                     */}
      {/* ======================================================== */}
      {traceEmp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-slideLeft">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-odoo-purple uppercase tracking-wider">Calculation Trace</span>
                <h3 className="text-lg font-bold text-slate-800">{traceEmp.employee_name}</h3>
                <p className="text-xs text-slate-400">{traceEmp.employee_code} · {traceEmp.department}</p>
              </div>
              <button
                onClick={() => setTraceEmp(null)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Employee Totals Card */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500">Gross</span>
                <p className="text-base font-bold text-slate-800">₹{traceEmp.gross_salary?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-600">Deductions</span>
                <p className="text-base font-bold text-rose-700">₹{traceEmp.total_deductions?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-600">Net Pay</span>
                <p className="text-base font-bold text-emerald-700">₹{traceEmp.net_salary?.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Component Trace Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Evaluated Salary Rules</h4>
              <div className="space-y-2">
                {traceEmp.calculation_trace?.map((rule: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800">
                      <span>{rule.sequence}. {rule.rule_name} ({rule.rule_code})</span>
                      <span className="text-odoo-purple">₹{Number(rule.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="capitalize">{rule.category} · {rule.computation_type}</span>
                      {rule.formula_or_rate && (
                        <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                          {rule.formula_or_rate}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* Finalize Confirmation Modal                             */}
      {/* ======================================================== */}
      {finalizeConfirmOpen && createdPayrun && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl animate-scaleIn space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Finalize {createdPayrun.name}?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Finalizing locks the payroll calculation permanently and creates official, immutable Payslip records for {createdPayrun.successful_employees} employees.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl text-xs space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Total Net Disbursed:</span>
                <span className="font-bold">₹{createdPayrun.total_net?.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Successful Payslips:</span>
                <span className="font-bold">{createdPayrun.successful_employees}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setFinalizeConfirmOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleFinalize}
                disabled={loading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
                <span>Confirm & Lock Payroll</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrunWizardPage;
