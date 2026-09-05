import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Printer,
  Building,
  User,
  CreditCard,
  Clock,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Info,
  X,
  TrendingUp,
  Percent,
} from 'lucide-react';
import { payslipService } from '../services/payslipService';
import { useAuth } from '../context/AuthContext';
import type { Payslip } from '../types';

export const PayslipDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canManagePayroll } = useAuth();


  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showTraceModal, setShowTraceModal] = useState(false);

  const fetchPayslip = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await payslipService.getPayslip(Number(id));
      setPayslip(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load payslip details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayslip();
  }, [fetchPayslip]);

  const handleRecompute = async () => {
    if (!payslip) return;
    setActionLoading(true);
    setError(null);
    try {
      const updated = await payslipService.recomputePayslip(payslip.id);
      setPayslip(updated);
      setSuccessMsg('Payslip recomputed successfully with latest rules and attendance!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to recompute payslip.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!payslip) return;
    if (!window.confirm(`Are you sure you want to finalize Payslip #${payslip.payslip_number}? Finalized records are permanently locked against modifications.`)) {
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const updated = await payslipService.finalizePayslip(payslip.id);
      setPayslip(updated);
      setSuccessMsg('Payslip finalized and locked successfully!');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to finalize payslip.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!payslip) return;
    if (!window.confirm(`Are you sure you want to cancel Payslip #${payslip.payslip_number}?`)) {
      return;
    }
    setActionLoading(true);
    setError(null);
    try {
      const updated = await payslipService.cancelPayslip(payslip.id);
      setPayslip(updated);
      setSuccessMsg('Payslip cancelled.');
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to cancel payslip.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const isFinalized =
    payslip?.status === 'finalized' ||
    payslip?.status === 'validated' ||
    payslip?.status === 'paid';

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400 animate-fadeIn">
        <RefreshCw className="w-9 h-9 animate-spin text-odoo-purple" />
        <p className="text-sm font-medium text-slate-600">Loading payroll document...</p>
      </div>
    );
  }

  if (error && !payslip) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center space-y-4 animate-fadeIn">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Payslip Not Found</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <button
          onClick={() => navigate('/payroll/payslips')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-odoo-purple text-white rounded-xl text-sm font-semibold hover:bg-purple-900 transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payslips</span>
        </button>
      </div>
    );
  }

  if (!payslip) return null;

  // Group lines
  const earningsLines = (payslip.lines || []).filter(
    (l) => !l.is_employer_contribution && ['Basic', 'Allowance', 'Gross', 'Earning', 'EARNING'].includes(l.category)
  );
  const deductionLines = (payslip.lines || []).filter(
    (l) => !l.is_employer_contribution && ['Deduction', 'DEDUCTION', 'Tax'].includes(l.category)
  );
  const employerLines = (payslip.lines || []).filter(
    (l) => l.is_employer_contribution || ['Employer Contribution'].includes(l.category)
  );

  const empSnap = payslip.employee_snapshot || {};
  const contractSnap = payslip.contract_snapshot || {};
  const attSnap = payslip.attendance_snapshot || {};
  const timeOffSnap = payslip.time_off_snapshot || {};

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 animate-fadeIn">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/payroll/payslips')}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            title="Back to Payslips"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{payslip.payslip_number}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isFinalized
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : payslip.status === 'computed'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {payslip.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Period: {new Date(payslip.period_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
              {new Date(payslip.period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Calculation Trace Button */}
          {payslip.calculation_trace && payslip.calculation_trace.length > 0 && (
            <button
              onClick={() => setShowTraceModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 text-odoo-purple hover:bg-purple-100 border border-purple-200 rounded-xl text-xs font-bold transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Calculation Trace ({payslip.calculation_trace.length})</span>
            </button>
          )}

          {/* Print Button */}
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          {/* Recompute Button (Only if not finalized) */}
          {canManagePayroll && !isFinalized && payslip.status !== 'cancelled' && (
            <button
              onClick={handleRecompute}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />
              <span>Recompute</span>
            </button>
          )}

          {/* Finalize Button (Only if not finalized) */}
          {canManagePayroll && !isFinalized && payslip.status !== 'cancelled' && (
            <button
              onClick={handleFinalize}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>Finalize & Lock</span>
            </button>
          )}

          {/* Cancel Button */}
          {canManagePayroll && !isFinalized && payslip.status !== 'cancelled' && (
            <button
              onClick={handleCancel}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-semibold transition-all"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          )}
        </div>
      </div>

      {/* Success Alert */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm shadow-sm animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Payslip Document (Printable) */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden print:shadow-none print:border-none">
        
        {/* Document Header */}
        <div className="bg-gradient-to-r from-odoo-purple to-purple-900 text-white p-8 sm:p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold tracking-widest uppercase mb-1">
                <Building className="w-4 h-4" />
                <span>{payslip.company || 'PeoplePay360 Inc.'}</span>
              </div>
              <h2 className="text-3xl font-extrabold tracking-tight">SALARY PAYSLIP</h2>
              <p className="text-purple-200 text-sm mt-1">
                For the period of{' '}
                <span className="font-semibold text-white">
                  {new Date(payslip.period_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-white">
                  {new Date(payslip.period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-2xl border border-white/20 text-right sm:text-right">
              <div className="text-[10px] text-purple-200 uppercase tracking-wider font-bold">Payslip Number</div>
              <div className="text-xl font-extrabold tracking-tight text-white mt-0.5">{payslip.payslip_number}</div>
              <div className="text-xs text-emerald-300 font-semibold mt-1">
                {isFinalized ? 'Official Locked Record' : 'Draft Computation'}
              </div>
            </div>
          </div>
        </div>

        {/* Employee & Snapshot Metadata Cards */}
        <div className="p-6 sm:p-8 bg-slate-50/70 border-b border-slate-200/80 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Employee Info */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <User className="w-4 h-4 text-odoo-purple" />
              <span>Employee Information</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {empSnap.name || payslip.employee_name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {empSnap.job_position || payslip.job_position || 'Staff'} • {empSnap.department || payslip.department}
              </p>
            </div>
            <div className="pt-2 border-t border-slate-100 text-xs space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Employee Code:</span>
                <span className="font-semibold text-slate-800">{empSnap.employee_code || payslip.employee_code || 'EMP001'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Work Email:</span>
                <span className="font-medium text-slate-700">{empSnap.work_email || '—'}</span>
              </div>
            </div>
          </div>

          {/* Contract & Bank Details */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <CreditCard className="w-4 h-4 text-odoo-purple" />
              <span>Contract & Bank Info</span>
            </div>
            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">Contract Code:</span>
                <span className="font-semibold text-slate-800">{contractSnap.contract_code || 'CT-2026-001'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Salary Structure:</span>
                <span className="font-semibold text-odoo-purple">
                  {payslip.structure_name || contractSnap.structure_name || 'Standard Monthly'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bank / A/C:</span>
                <span className="font-medium text-slate-800">{empSnap.bank_name || 'HDFC Bank'} ({empSnap.bank_account_no ? `••••${empSnap.bank_account_no.slice(-4)}` : '••••5678'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PAN / Tax ID:</span>
                <span className="font-semibold text-slate-800">{empSnap.pan_no || 'ABCDE1234F'}</span>
              </div>
            </div>
          </div>

          {/* Attendance & Leave Summary */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <Clock className="w-4 h-4 text-odoo-purple" />
              <span>Attendance & Leave</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-base font-bold text-slate-800">{payslip.worked_days || attSnap.worked_days || 0}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Worked Days</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-base font-bold text-slate-800">{attSnap.scheduled_days || 22}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Scheduled Days</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-base font-bold text-emerald-700">{timeOffSnap.paid_leave_days || 0}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Paid Leave</div>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                <div className="text-base font-bold text-amber-700">{payslip.unpaid_leave_days || timeOffSnap.unpaid_leave_days || 0}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Unpaid Days</div>
              </div>
            </div>
          </div>
        </div>

        {/* Salary Breakdown: Two-Column Earnings & Deductions */}
        <div className="p-6 sm:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Left Column: Earnings */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-emerald-500/80 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <span>EARNINGS</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                  Positive Components
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                {earningsLines.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">No earning components configured.</div>
                ) : (
                  earningsLines.map((line) => (
                    <div key={line.id} className="py-2.5 flex items-center justify-between group">
                      <div>
                        <div className="font-semibold text-slate-800">{line.rule_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span className="font-mono text-odoo-purple">{line.rule_code}</span>
                          {line.calculation_expression && (
                            <>
                              <span>•</span>
                              <span>{line.calculation_expression}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">{formatCurrency(line.amount)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Gross Earnings */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-950 mt-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">GROSS SALARY (Total Earnings)</span>
                  <p className="text-[11px] text-emerald-600">Sum of Basic + Allowances</p>
                </div>
                <div className="text-xl font-extrabold text-emerald-800">
                  {formatCurrency(payslip.gross_salary)}
                </div>
              </div>
            </div>

            {/* Right Column: Deductions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-amber-500/80 pb-2">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <Percent className="w-5 h-5 text-amber-600" />
                  <span>DEDUCTIONS</span>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                  Salary Reductions
                </span>
              </div>

              <div className="divide-y divide-slate-100 text-sm">
                {deductionLines.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs">No deduction components applied.</div>
                ) : (
                  deductionLines.map((line) => (
                    <div key={line.id} className="py-2.5 flex items-center justify-between group">
                      <div>
                        <div className="font-semibold text-slate-800">{line.rule_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <span className="font-mono text-amber-700">{line.rule_code}</span>
                          {line.calculation_expression && (
                            <>
                              <span>•</span>
                              <span>{line.calculation_expression}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="font-bold text-amber-700">-{formatCurrency(line.amount)}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Deductions */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-amber-950 mt-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-800">TOTAL DEDUCTIONS</span>
                  <p className="text-[11px] text-amber-600">PF, Tax & statutory withholdings</p>
                </div>
                <div className="text-xl font-extrabold text-amber-800">
                  -{formatCurrency(payslip.total_deductions)}
                </div>
              </div>
            </div>
          </div>

          {/* NET TAKE HOME SALARY HIGHLIGHT CARD */}
          <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white rounded-3xl p-8 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-1 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
                <CheckCircle2 className="w-4 h-4" />
                <span>Net Payable Take-Home</span>
              </div>
              <h3 className="text-2xl font-bold tracking-tight">NET SALARY</h3>
              <p className="text-xs text-emerald-100/90">
                Gross Salary ({formatCurrency(payslip.gross_salary)}) minus Total Deductions ({formatCurrency(payslip.total_deductions)})
              </p>
            </div>

            <div className="text-right sm:text-right relative z-10">
              <div className="text-4xl sm:text-5xl font-extrabold tracking-tight drop-shadow-sm">
                {formatCurrency(payslip.net_salary)}
              </div>
              <div className="text-xs text-emerald-200 mt-1 font-medium">
                Direct Bank Transfer • {empSnap.bank_name || 'HDFC Bank'}
              </div>
            </div>
          </div>

          {/* Employer Contributions & Cost (Visible to HR/Admins) */}
          {(canManagePayroll || employerLines.length > 0) && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-odoo-purple" />
                  <span>Employer Contributions & Total Cost (CTC)</span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Total Employer Cost: <strong className="text-slate-900">{formatCurrency(payslip.total_employer_cost)}</strong>
                </span>
              </div>

              <div className="divide-y divide-slate-200/60 text-xs">
                {employerLines.map((line) => (
                  <div key={line.id} className="py-2 flex items-center justify-between text-slate-700">
                    <span className="font-medium">{line.rule_name} ({line.rule_code})</span>
                    <span className="font-bold text-slate-900">{formatCurrency(line.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Audit Stamp */}
        <div className="p-6 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-400" />
            <span>This is a system generated salary certificate under PeoplePay360.</span>
          </div>
          <div>
            {payslip.computed_at && (
              <span>Computed at: {new Date(payslip.computed_at).toLocaleString()}</span>
            )}
            {payslip.finalized_at && (
              <span className="ml-3 font-semibold text-emerald-700">• Finalized: {new Date(payslip.finalized_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Calculation Trace Modal */}
      {showTraceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl max-h-[85vh] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleIn">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-odoo-purple flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Step-by-Step Calculation Trace</h3>
                  <p className="text-xs text-slate-500">
                    Exact deterministic execution flow of salary rules for {payslip.employee_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowTraceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 divide-y divide-slate-100">
              {payslip.calculation_trace?.map((trace, idx) => (
                <div key={idx} className="pt-3 first:pt-0 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-[10px]">
                        {trace.sequence || idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">{trace.rule_name}</span>
                      <span className="font-mono bg-purple-50 text-odoo-purple px-1.5 py-0.5 rounded text-[11px] font-semibold">
                        {trace.rule_code}
                      </span>
                      <span className="text-[11px] text-slate-400">({trace.category})</span>
                    </div>

                    <div className="font-extrabold text-sm text-slate-900">
                      {formatCurrency(trace.amount)}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>
                      <span className="text-slate-400">Formula / Expression: </span>
                      <span className="font-mono font-semibold text-slate-800">{trace.formula_or_rate || 'Fixed / Default'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Status: </span>
                      <span className={`font-semibold capitalize ${trace.status === 'calculated' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {trace.status}
                      </span>
                    </div>
                    {trace.inputs_used && Object.keys(trace.inputs_used).length > 0 && (
                      <div className="col-span-2 text-slate-500">
                        <span className="text-slate-400">Inputs Used: </span>
                        <span className="font-mono text-slate-700">{JSON.stringify(trace.inputs_used)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowTraceModal(false)}
                className="px-5 py-2 bg-odoo-purple text-white text-xs font-semibold rounded-xl hover:bg-purple-900 transition-all"
              >
                Close Trace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
