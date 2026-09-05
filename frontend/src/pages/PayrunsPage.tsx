import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Play,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  Building2,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Eye,
  FileCheck,
  Ban,
} from 'lucide-react';
import { payrunService } from '../services/payrunService';
import type { Payrun, PayrunStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export const PayrunsPage: React.FC = () => {
  const navigate = useNavigate();
  const { canManagePayroll } = useAuth();

  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchPayruns = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'all') params.status = statusFilter;

      const data = await payrunService.listPayruns(params);
      setPayruns(data.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load payruns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayruns();
  };

  const handleDelete = async (id: number) => {
    try {
      await payrunService.deletePayrun(id);
      setDeleteConfirmId(null);
      fetchPayruns();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete payrun');
    }
  };

  const getStatusBadge = (status: PayrunStatus) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Clock className="w-3 h-3 text-slate-500" />
            Draft
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-500" />
            Ready
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
            Processing
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-odoo-purple border border-purple-200">
            <AlertTriangle className="w-3 h-3 text-purple-600" />
            Review
          </span>
        );
      case 'finalized':
      case 'validated':
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <FileCheck className="w-3 h-3 text-emerald-600" />
            Finalized
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
            <Ban className="w-3 h-3 text-gray-400" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  // Summary Metrics
  const totalBatches = payruns.length;
  const activeBatches = payruns.filter(p => ['draft', 'ready', 'processing', 'review'].includes(p.status.toLowerCase())).length;
  const finalizedBatches = payruns.filter(p => ['finalized', 'validated', 'paid'].includes(p.status.toLowerCase())).length;
  const totalNetDisbursed = payruns.reduce((acc, p) => acc + (p.total_net || p.total_net_paid || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-r from-odoo-purple to-purple-800 rounded-2xl shadow-lg p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold uppercase tracking-wider backdrop-blur-sm mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              Module 9 · Operational Payroll Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Payrun Wizard & Processing</h1>
            <p className="text-purple-100 text-sm mt-1 max-w-xl">
              Execute, validate, and finalize end-to-end company payroll runs with live Salary Rules Engine calculations and automated payslip generation.
            </p>
          </div>

          {canManagePayroll && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/payroll/payruns/wizard')}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-md transition-all duration-150 flex items-center gap-2 text-sm transform hover:-translate-y-0.5"
              >
                <Plus className="w-4 h-4" />
                <span>Start Payrun Wizard</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-odoo-purple">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payruns</p>
            <p className="text-2xl font-bold text-slate-800">{totalBatches}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">In Progress / Review</p>
            <p className="text-2xl font-bold text-amber-600">{activeBatches}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <FileCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Finalized Runs</p>
            <p className="text-2xl font-bold text-emerald-600">{finalizedBatches}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Net Disbursed</p>
            <p className="text-2xl font-bold text-slate-800">
              ₹{totalNetDisbursed.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-sm">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-rose-500 hover:text-rose-700 font-bold">×</button>
        </div>
      )}

      {/* Filter Toolbar & Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search payruns by name or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-odoo-purple/20 focus:border-odoo-purple transition-all"
            />
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'draft', label: 'Draft' },
              { id: 'ready', label: 'Ready' },
              { id: 'processing', label: 'Processing' },
              { id: 'review', label: 'Review' },
              { id: 'finalized', label: 'Finalized' },
              { id: 'cancelled', label: 'Cancelled' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-odoo-purple text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Payruns List Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-odoo-purple animate-spin" />
            <p className="text-sm font-medium">Loading payruns...</p>
          </div>
        ) : payruns.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-purple-50 text-odoo-purple flex items-center justify-center">
              <Calendar className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">No Payruns Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                {search || statusFilter !== 'all'
                  ? 'No payruns match your active filter criteria.'
                  : 'Get started by running the interactive Payrun Wizard to calculate company payroll.'}
              </p>
            </div>
            {canManagePayroll && (
              <button
                onClick={() => navigate('/payroll/payruns/wizard')}
                className="px-4 py-2 bg-odoo-purple hover:bg-purple-900 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Start Payrun Wizard
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Payrun Name & Period</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Employees</th>
                  <th className="py-3 px-4 text-right">Total Gross</th>
                  <th className="py-3 px-4 text-right">Total Net</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payruns.map((payrun) => (
                  <tr
                    key={payrun.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/payroll/payruns/${payrun.id}`)}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 group-hover:text-odoo-purple transition-colors">
                        {payrun.name}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(payrun.period_start).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' '}-{' '}
                          {new Date(payrun.period_end).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{payrun.company}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getStatusBadge(payrun.status)}</td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        <span className="font-bold text-slate-700">{payrun.total_employees || payrun.employee_count}</span>
                        {payrun.successful_employees > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {payrun.successful_employees} ✓
                          </span>
                        )}
                        {payrun.failed_employees > 0 && (
                          <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            {payrun.failed_employees} ✗
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-600">
                      ₹{(payrun.total_gross || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      ₹{(payrun.total_net || payrun.total_net_paid || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {payrun.status === 'draft' || payrun.status === 'ready' ? (
                          <button
                            onClick={() => navigate(`/payroll/payruns/wizard?resume_id=${payrun.id}`)}
                            className="p-1.5 hover:bg-purple-50 text-odoo-purple rounded-lg transition-colors title='Resume Wizard'"
                            title="Resume Wizard"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/payroll/payruns/${payrun.id}`)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors"
                            title="View Payrun Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {payrun.status !== 'finalized' && canManagePayroll && (
                          <button
                            onClick={() => setDeleteConfirmId(payrun.id)}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors"
                            title="Delete Payrun"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}

                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-odoo-purple transition-colors ml-1" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scaleIn space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Delete Draft Payrun?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete this unfinalized Payrun? All draft calculations and employee staging records will be removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrunsPage;
