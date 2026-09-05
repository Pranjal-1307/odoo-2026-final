import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Layers,
  Plus,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Filter,
  User as UserIcon,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import { timeOffService } from '../services/timeOffService';
import type { TimeOffAllocation, TimeOffType } from '../types';
import { useAuth } from '../context/AuthContext';

export const TimeOffAllocationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { canManageHR } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [allocations, setAllocations] = useState<TimeOffAllocation[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);

  const typeIdParam = searchParams.get('type_id') || '';
  const statusParam = searchParams.get('status') || '';
  const employeeIdParam = searchParams.get('employee_id') || '';

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      setError(null);

      const [allocData, typesData] = await Promise.all([
        timeOffService.getAllocations({
          type_id: typeIdParam ? parseInt(typeIdParam, 10) : undefined,
          status_filter: statusParam || undefined,
          employee_id: employeeIdParam ? parseInt(employeeIdParam, 10) : undefined
        }),
        timeOffService.getTypes()
      ]);

      setAllocations(allocData);
      setTypes(typesData);
    } catch (err: any) {
      console.error('Error fetching allocations:', err);
      setError(err.response?.data?.detail || 'Failed to load allocations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [searchParams]);

  const handleApprove = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await timeOffService.approveAllocation(id);
      fetchAllocations();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to approve allocation.');
    }
  };

  const handleRefuse = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await timeOffService.refuseAllocation(id);
      fetchAllocations();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to refuse allocation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-7 h-7 text-odoo-purple" />
            Time Off Allocations
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage granted leave allowances, validity periods, and balances.
          </p>
        </div>

        {canManageHR && (
          <div className="flex items-center gap-3">
            <Link
              to="/time-off/allocations/new"
              className="inline-flex items-center gap-2 bg-odoo-purple hover:bg-purple-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Allocation
            </Link>
          </div>
        )}
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap gap-3 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={typeIdParam}
                onChange={(e) => {
                  const p = new URLSearchParams(searchParams);
                  if (e.target.value) p.set('type_id', e.target.value);
                  else p.delete('type_id');
                  setSearchParams(p);
                }}
                className="text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
              >
                <option value="">All Leave Types</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={statusParam}
              onChange={(e) => {
                const p = new URLSearchParams(searchParams);
                if (e.target.value) p.set('status', e.target.value);
                else p.delete('status');
                setSearchParams(p);
              }}
              className="text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-odoo-purple shadow-sm"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="draft">Draft</option>
              <option value="refused">Refused</option>
            </select>
          </div>

          <button
            onClick={() => setSearchParams({})}
            title="Reset Filters"
            className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 m-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Allocations Table */}
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-odoo-purple" />
            <span>Loading allocations...</span>
          </div>
        ) : allocations.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Layers className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-600">No allocations found</p>
            <p className="text-xs text-slate-400 mt-1">Grant leave days to employees to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-center">Allocated</th>
                  <th className="py-3 px-4 text-center">Taken</th>
                  <th className="py-3 px-4 text-center">Remaining</th>
                  <th className="py-3 px-4">Validity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Approver</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allocations.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => canManageHR && navigate(`/time-off/allocations/${a.id}`)}
                    className={`transition-colors group ${
                      canManageHR ? 'hover:bg-slate-50/80 cursor-pointer' : ''
                    }`}
                  >
                    {/* Employee */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-odoo-purple font-semibold flex items-center justify-center text-xs flex-shrink-0">
                          {a.employee_name ? a.employee_name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="font-medium text-slate-800 group-hover:text-odoo-purple transition-colors">
                            {a.employee_name}
                          </div>
                          <div className="text-xs text-slate-400">{a.employee_code || a.department}</div>
                        </div>
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium"
                        style={{
                          backgroundColor: `${a.time_off_type_color || '#017E84'}15`,
                          color: a.time_off_type_color || '#017E84',
                          border: `1px solid ${a.time_off_type_color || '#017E84'}30`
                        }}
                      >
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: a.time_off_type_color || '#017E84' }}
                        />
                        {a.time_off_type_name}
                      </span>
                    </td>

                    {/* Allocated */}
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {a.allocated_amount} <span className="text-xs text-slate-400 font-normal">{a.unit || 'days'}</span>
                    </td>

                    {/* Taken */}
                    <td className="py-3.5 px-4 text-center font-medium text-amber-700">
                      {a.taken_amount} <span className="text-xs text-slate-400 font-normal">{a.unit || 'days'}</span>
                    </td>

                    {/* Remaining */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {a.remaining_amount} {a.unit || 'days'}
                      </span>
                    </td>

                    {/* Validity */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {a.validity_start && a.validity_end
                        ? `${a.validity_start} to ${a.validity_end}`
                        : a.validity_start
                        ? `From ${a.validity_start}`
                        : 'Permanent / Open'}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {a.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Approved
                        </span>
                      ) : a.status === 'refused' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          Refused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          Draft
                        </span>
                      )}
                    </td>

                    {/* Approver */}
                    <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {a.approver_name || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {canManageHR && a.status === 'draft' && (
                          <>
                            <button
                              onClick={(e) => handleApprove(a.id, e)}
                              className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => handleRefuse(a.id, e)}
                              className="px-2 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                            >
                              Refuse
                            </button>
                          </>
                        )}
                        {canManageHR && (
                          <Link
                            to={`/time-off/allocations/${a.id}`}
                            className="p-1 text-slate-400 hover:text-odoo-purple transition-colors"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeOffAllocationsPage;
