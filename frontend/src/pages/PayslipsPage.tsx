import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  Layers,
  ChevronRight,
  Calculator,
  Calendar,
  Filter,
  X,
  Sparkles,
} from 'lucide-react';
import { payslipService, type PayslipListParams } from '../services/payslipService';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../context/AuthContext';
import type { Payslip, PayslipSummaryMetrics, Employee } from '../types';

export const PayslipsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isEmployee, canManagePayroll } = useAuth();


  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [metrics, setMetrics] = useState<PayslipSummaryMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // New Payslip Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<number | ''>('');
  const [modalPeriodStart, setModalPeriodStart] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  });
  const [modalPeriodEnd, setModalPeriodEnd] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
  });
  const [creating, setCreating] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchPayslips = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: PayslipListParams = {
        skip: page * pageSize,
        limit: pageSize,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;
      if (periodStart) params.period_start = periodStart;
      if (periodEnd) params.period_end = periodEnd;

      const [listRes, metricsRes] = await Promise.all([
        payslipService.listPayslips(params),
        payslipService.getSummaryMetrics(),
      ]);

      setPayslips(listRes.items);
      setTotalCount(listRes.total);
      setMetrics(metricsRes);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load payslips.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, periodStart, periodEnd]);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const loadEmployeesForModal = async () => {
    try {
      const res = await employeeService.getEmployees({ limit: 100 });
      setEmployees(res.items.filter((e) => e.status === 'active'));
      if (res.items.length > 0 && selectedEmpId === '') {
        setSelectedEmpId(res.items[0].id);
      }
    } catch (e) {
      console.error('Failed to load employees for modal', e);
    }
  };

  const handleOpenCreateModal = () => {
    setModalError(null);
    setIsModalOpen(true);
    loadEmployeesForModal();
  };

  const handleCreatePayslip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) {
      setModalError('Please select an employee.');
      return;
    }
    setCreating(true);
    setModalError(null);
    try {
      const newSlip = await payslipService.createPayslip({
        employee_id: Number(selectedEmpId),
        period_start: modalPeriodStart,
        period_end: modalPeriodEnd,
        auto_compute: true,
      });
      setIsModalOpen(false);
      navigate(`/payroll/payslips/${newSlip.id}`);
    } catch (err: any) {
      setModalError(err.response?.data?.detail || 'Failed to generate payslip.');
    } finally {
      setCreating(false);
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

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finalized':
      case 'validated':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {status.toUpperCase()}
          </span>
        );
      case 'computed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            COMPUTED
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            DRAFT
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-odoo-purple tracking-wider uppercase mb-1">
            <Layers className="w-4 h-4" />
            <span>Payroll Computation Hub</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEmployee ? 'My Payslips & Salary Breakdown' : 'Employee Payslips'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEmployee
              ? 'View official payroll records, salary breakdowns, and take-home details.'
              : 'Compute, review, and finalize employee salary breakdown documents.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPayslips()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-all shadow-sm active:scale-95"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-odoo-purple' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {canManagePayroll && (
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-odoo-purple hover:bg-purple-900 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Generate Payslip</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-odoo-purple border border-purple-100">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payslips</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{metrics.total_payslips}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{metrics.finalized_payslips} Finalized</span>
                <span>•</span>
                <span>{metrics.computed_payslips} Computed</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-blue-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
              <IndianRupee className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Payroll</p>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{formatCurrency(metrics.total_gross)}</p>
              <p className="text-xs text-blue-600 font-medium mt-1">Total Earnings Calculated</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-amber-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Deductions</p>
              <p className="text-2xl font-bold text-amber-700 mt-0.5">{formatCurrency(metrics.total_deductions)}</p>
              <p className="text-xs text-amber-600 font-medium mt-1">PF, Tax & Unpaid Leave</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-emerald-300 transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Take-Home</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">{formatCurrency(metrics.total_net)}</p>
              <p className="text-xs text-emerald-600 font-medium mt-1">Total Net Payable</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by employee name, code, or payslip number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-odoo-purple transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="bg-transparent focus:outline-none cursor-pointer text-slate-700 text-xs font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="computed">Computed</option>
              <option value="finalized">Finalized</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={periodStart}
              onChange={(e) => {
                setPeriodStart(e.target.value);
                setPage(0);
              }}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
              title="Period Start"
            />
            <span className="text-slate-300">to</span>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => {
                setPeriodEnd(e.target.value);
                setPage(0);
              }}
              className="bg-transparent text-slate-700 focus:outline-none cursor-pointer"
              title="Period End"
            />
            {(periodStart || periodEnd) && (
              <button
                onClick={() => {
                  setPeriodStart('');
                  setPeriodEnd('');
                  setPage(0);
                }}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear dates"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-sm animate-shake">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Payslips Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-odoo-purple" />
            <p className="text-sm font-medium text-slate-500">Loading payroll records...</p>
          </div>
        ) : payslips.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-odoo-purple flex items-center justify-center mb-1">
              <FileText className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No Payslips Found</h3>
            <p className="text-sm text-slate-500 max-w-md">
              {search || statusFilter !== 'all' || periodStart
                ? 'No payslip records match the selected search or filters.'
                : 'No employee payslips have been computed yet. Create one or process a Payrun.'}
            </p>
            {canManagePayroll && (
              <button
                onClick={handleOpenCreateModal}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-odoo-purple hover:bg-purple-900 rounded-xl transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Generate First Payslip</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Payslip Reference</th>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Period</th>
                  <th className="py-3.5 px-4">Structure</th>
                  <th className="py-3.5 px-4 text-right">Gross Salary</th>
                  <th className="py-3.5 px-4 text-right">Deductions</th>
                  <th className="py-3.5 px-4 text-right">Net Salary</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-center">Email</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {payslips.map((slip) => (
                  <tr
                    key={slip.id}
                    onClick={() => navigate(`/payroll/payslips/${slip.id}`)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 sm:px-6 font-semibold text-odoo-purple">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-slate-400 group-hover:text-odoo-purple transition-colors" />
                        <span>{slip.payslip_number}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs border border-slate-200">
                          {slip.employee_name ? slip.employee_name.substring(0, 2).toUpperCase() : 'EM'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">{slip.employee_name}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span>{slip.employee_code || `EMP-${slip.employee_id}`}</span>
                            {slip.department && (
                              <>
                                <span>•</span>
                                <span>{slip.department}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      <div className="font-medium text-slate-800">
                        {new Date(slip.period_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} –{' '}
                        {new Date(slip.period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {slip.worked_days} Worked Days
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                      {slip.structure_name || slip.salary_structure_name || 'Standard Monthly'}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700">
                      {formatCurrency(slip.gross_salary)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-amber-700">
                      -{formatCurrency(slip.total_deductions)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                        {formatCurrency(slip.net_salary)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(slip.status)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {slip.email_sent ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          SENT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-50 text-slate-400 border border-slate-200">
                          Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 sm:px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={async () => {
                            try {
                              await payslipService.downloadPdfFile(slip.id, `Payslip_${slip.payslip_number}.pdf`);
                            } catch (err: any) {
                              alert('Failed to download PDF: ' + (err.response?.data?.detail || err.message));
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-odoo-purple hover:bg-purple-50 rounded-lg transition-all"
                          title="Download PDF"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/payroll/payslips/${slip.id}`)}
                          className="p-1.5 text-slate-400 hover:text-odoo-purple hover:bg-purple-50 rounded-lg transition-all"
                          title="View Details"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalCount > pageSize && (
          <div className="p-4 border-t border-slate-200/80 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalCount)} of {totalCount} payslips
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-all"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-700 px-2">Page {page + 1}</span>
              <button
                disabled={(page + 1) * pageSize >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-700 disabled:opacity-40 hover:bg-slate-100 transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Standalone Create Payslip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-odoo-purple flex items-center justify-center font-bold">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Generate Employee Payslip</h3>
                  <p className="text-xs text-slate-500">Calculates salary components with attendance and time-off rules</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePayslip} className="p-6 space-y-4">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span>{modalError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select Employee *
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(Number(e.target.value))}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-odoo-purple font-medium"
                >
                  <option value="" disabled>Choose an employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_code}) — {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Period Start *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalPeriodStart}
                    onChange={(e) => setModalPeriodStart(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-odoo-purple"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Period End *
                  </label>
                  <input
                    type="date"
                    required
                    value={modalPeriodEnd}
                    onChange={(e) => setModalPeriodEnd(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-odoo-purple"
                  />
                </div>
              </div>

              <div className="bg-purple-50/70 border border-purple-100 rounded-xl p-3.5 text-xs text-purple-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-odoo-purple shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Instant Automatic Computation:</span>
                  <p className="text-purple-700 mt-0.5 leading-relaxed">
                    The engine will resolve the employee's active contract, fetch scheduled vs worked days, apply unpaid leave deductions, compute percentage rules (HRA, PF), and generate the complete salary breakdown.
                  </p>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-odoo-purple hover:bg-purple-900 rounded-xl shadow-md transition-all disabled:opacity-50"
                >
                  {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Calculator className="w-4 h-4" />}
                  <span>{creating ? 'Computing...' : 'Compute & View'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
