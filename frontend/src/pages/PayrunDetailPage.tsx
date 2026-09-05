import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Building2,
  Users,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowLeft,
  RefreshCw,
  CreditCard,
  Ban,
  Eye,
  Lock,
  X,
  Receipt,
} from 'lucide-react';
import { payrunService } from '../services/payrunService';
import type { Payrun, PayrunEmployee } from '../types';
import { useAuth } from '../context/AuthContext';

export const PayrunDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManagePayroll } = useAuth();

  const [payrun, setPayrun] = useState<Payrun | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'employees' | 'warnings' | 'payslips'>('overview');

  // Slide-over trace drawer
  const [traceEmp, setTraceEmp] = useState<PayrunEmployee | null>(null);
  const [recalculatingEmpId, setRecalculatingEmpId] = useState<number | null>(null);
  const [finalizeModalOpen, setFinalizeModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const fetchPayrun = async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await payrunService.getPayrun(parseInt(id, 10));
      setPayrun(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load payrun');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrun();
  }, [id]);

  const handleRecalculate = async (empId: number) => {
    if (!payrun) return;
    try {
      setRecalculatingEmpId(empId);
      await payrunService.recalculateEmployee(payrun.id, empId);
      await fetchPayrun();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Recalculation failed');
    } finally {
      setRecalculatingEmpId(null);
    }
  };

  const handleFinalize = async () => {
    if (!payrun) return;
    try {
      setLoading(true);
      setError(null);
      const finalized = await payrunService.finalizePayrun(payrun.id);
      setPayrun(finalized);
      setFinalizeModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Finalization failed');
      setFinalizeModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!payrun) return;
    try {
      setLoading(true);
      setError(null);
      const cancelled = await payrunService.cancelPayrun(payrun.id);
      setPayrun(cancelled);
      setCancelModalOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Cancellation failed');
      setCancelModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !payrun) {
    return (
      <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-8 h-8 text-odoo-purple animate-spin" />
        <p className="text-sm font-medium">Loading Payrun details...</p>
      </div>
    );
  }

  if (!payrun) {
    return (
      <div className="p-12 text-center text-slate-500 space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Payrun Not Found</h2>
        <button
          onClick={() => navigate('/payroll/payruns')}
          className="px-4 py-2 bg-odoo-purple text-white text-xs font-semibold rounded-lg"
        >
          Return to Payruns List
        </button>
      </div>
    );
  }

  const isFinalized = payrun.status.toLowerCase() === 'finalized' || payrun.status.toLowerCase() === 'validated';
  const isDraft = payrun.status.toLowerCase() === 'draft' || payrun.status.toLowerCase() === 'ready';

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/payroll/payruns')}
          className="text-xs font-semibold text-slate-500 hover:text-odoo-purple flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payruns</span>
        </button>

        <div className="flex items-center gap-2">
          {isDraft && (
            <button
              onClick={() => navigate(`/payroll/payruns/wizard?resume_id=${payrun.id}`)}
              className="px-4 py-2 bg-odoo-purple hover:bg-purple-900 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume Wizard</span>
            </button>
          )}

          {!isFinalized && payrun.status !== 'cancelled' && canManagePayroll && (
            <>
              <button
                onClick={() => setFinalizeModalOpen(true)}
                disabled={payrun.failed_employees > 0}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Finalize Payrun</span>
              </button>
              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-4 py-2 border border-slate-200 text-rose-600 hover:bg-rose-50 font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p className="flex-1">{error}</p>
          <button onClick={() => setError(null)} className="font-bold">×</button>
        </div>
      )}

      {/* Main Payrun Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Payrun Batch #{payrun.id}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                isFinalized
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-purple-50 text-odoo-purple border border-purple-200'
              }`}>
                {payrun.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">{payrun.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span>{payrun.company}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>
                  {new Date(payrun.period_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  {' '}—{' '}
                  {new Date(payrun.period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Employees</span>
              <p className="text-base font-bold text-slate-800">{payrun.total_employees}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600">Successful</span>
              <p className="text-base font-bold text-emerald-700">{payrun.successful_employees}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-rose-600">Failed</span>
              <p className="text-base font-bold text-rose-700">{payrun.failed_employees}</p>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-600">Net Pay</span>
              <p className="text-base font-bold text-slate-900">
                ₹{(payrun.total_net || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {[
            { id: 'overview', label: 'Financial Overview', icon: CreditCard },
            { id: 'employees', label: `Employees (${payrun.employees?.length || 0})`, icon: Users },
            { id: 'warnings', label: `Warnings & Diagnostics (${payrun.warning_count || 0})`, icon: AlertTriangle },
            ...(isFinalized ? [{ id: 'payslips', label: 'Generated Payslips', icon: Receipt }] : []),
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-odoo-purple text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ======================================================== */}
        {/* TAB 1: Financial Overview                               */}
        {/* ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Salary</span>
                <p className="text-xl font-bold text-slate-800 mt-1">
                  ₹{(payrun.total_gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-[10px] font-bold text-rose-500 uppercase">Total Deductions</span>
                <p className="text-xl font-bold text-rose-600 mt-1">
                  ₹{(payrun.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">Net Disbursed</span>
                <p className="text-xl font-bold text-emerald-700 mt-1">
                  ₹{(payrun.total_net || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <span className="text-[10px] font-bold text-purple-600 uppercase">Total Employer Cost</span>
                <p className="text-xl font-bold text-purple-700 mt-1">
                  ₹{(payrun.total_employer_cost || payrun.total_gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Audit & Execution Metadata */}
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200 text-xs space-y-2 text-slate-600">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Audit & Traceability</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-400">Created At:</span>{' '}
                  <span className="font-medium">{new Date(payrun.created_at).toLocaleString()}</span>
                </div>
                {payrun.processed_at && (
                  <div>
                    <span className="text-slate-400">Processed At:</span>{' '}
                    <span className="font-medium">{new Date(payrun.processed_at).toLocaleString()}</span>
                  </div>
                )}
                {payrun.finalized_at && (
                  <div>
                    <span className="text-slate-400">Finalized At:</span>{' '}
                    <span className="font-medium text-emerald-700 font-bold">{new Date(payrun.finalized_at).toLocaleString()}</span>
                  </div>
                )}
                <div>
                  <span className="text-slate-400">Status:</span>{' '}
                  <span className="font-semibold uppercase">{payrun.status}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: Employee Calculations Table                      */}
        {/* ======================================================== */}
        {activeTab === 'employees' && (
          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Employee</th>
                  <th className="py-2.5 px-4">Contract Wage</th>
                  <th className="py-2.5 px-4 text-right">Gross</th>
                  <th className="py-2.5 px-4 text-right">Deductions</th>
                  <th className="py-2.5 px-4 text-right">Net</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrun.employees?.map((pe) => (
                  <tr key={pe.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{pe.employee_name}</div>
                      <div className="text-xs text-slate-400">{pe.employee_code} · {pe.department}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">
                      {pe.contract_code ? `${pe.contract_code}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      ₹{(pe.gross_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-rose-600">
                      ₹{(pe.total_deductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      ₹{(pe.net_salary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                        pe.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700'
                          : pe.status === 'failed'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {pe.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setTraceEmp(pe)}
                          className="px-2.5 py-1 text-xs font-semibold text-odoo-purple hover:bg-purple-50 rounded-lg border border-purple-200 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Trace</span>
                        </button>
                        {!isFinalized && (
                          <button
                            onClick={() => handleRecalculate(pe.employee_id)}
                            disabled={recalculatingEmpId === pe.employee_id}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg"
                            title="Recalculate Employee"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${recalculatingEmpId === pe.employee_id ? 'animate-spin text-odoo-purple' : ''}`} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: Diagnostics & Warnings                           */}
        {/* ======================================================== */}
        {activeTab === 'warnings' && (
          <div className="space-y-4 pt-2">
            {payrun.warnings && payrun.warnings.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {payrun.warnings.map((w) => (
                  <div key={w.id} className="p-3.5 flex items-start gap-3 bg-amber-50/40 text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded mr-2">
                        {w.warning_type}
                      </span>
                      <span className="text-slate-700">{w.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                <span>No active payroll warnings or blocking diagnostics reported.</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trace Drawer */}
      {traceEmp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex justify-end animate-fadeIn">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto space-y-6 animate-slideLeft">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[11px] font-bold text-odoo-purple uppercase tracking-wider">Salary Rules Engine Trace</span>
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

            {/* Totals */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 grid grid-cols-3 gap-2 text-center text-xs">
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

            {/* Trace List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Rule Execution Trace</h4>
              <div className="space-y-2">
                {traceEmp.calculation_trace?.map((rule: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1 text-xs">
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

      {/* Finalize Modal */}
      {finalizeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Finalize {payrun.name}?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Finalizing will officially lock all payroll calculations and generate immutable Payslips.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setFinalizeModalOpen(false)}
                className="px-3.5 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalize}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Confirm Finalize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Ban className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Cancel Payrun?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to cancel this Payrun? Any unfinalized draft records will be voided.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-3.5 py-2 border border-slate-200 text-xs font-semibold text-slate-600 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrunDetailPage;
