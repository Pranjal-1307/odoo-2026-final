import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Settings2,
  Plus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Edit,
  Power,
  RefreshCw
} from 'lucide-react';
import { timeOffService } from '../services/timeOffService';
import type { TimeOffType } from '../types';
import { useAuth } from '../context/AuthContext';

export const TimeOffTypesPage: React.FC = () => {
  const navigate = useNavigate();
  const { canManageHR } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [types, setTypes] = useState<TimeOffType[]>([]);

  const fetchTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await timeOffService.getTypes();
      setTypes(data);
    } catch (err: any) {
      console.error('Error fetching time off types:', err);
      setError(err.response?.data?.detail || 'Failed to load time off types.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleToggleActive = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await timeOffService.toggleTypeActive(id);
      fetchTypes();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update type status.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings2 className="w-7 h-7 text-odoo-purple" />
            Time Off Types
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure leave categories, allocation rules, approval workflows, and payroll behaviors.
          </p>
        </div>

        {canManageHR && (
          <Link
            to="/time-off/types/new"
            className="inline-flex items-center gap-2 bg-odoo-purple hover:bg-purple-900 text-white px-4 py-2 rounded-lg text-sm font-medium shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Time Off Type
          </Link>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-odoo-purple" />
            <span>Loading time off types...</span>
          </div>
        ) : types.length === 0 ? (
          <div className="py-16 text-center text-slate-400">
            <Settings2 className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-base font-medium text-slate-600">No time off types found</p>
            <p className="text-xs text-slate-400 mt-1">Create your first time off type to configure leave rules.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3 px-4">Type Name</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Requires Allocation</th>
                  <th className="py-3 px-4">Approval Workflow</th>
                  <th className="py-3 px-4">Payroll Behavior</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {types.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => canManageHR && navigate(`/time-off/types/${t.id}`)}
                    className={`transition-colors group ${
                      canManageHR ? 'hover:bg-slate-50/80 cursor-pointer' : ''
                    }`}
                  >
                    {/* Name & Color */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: t.color || '#017E84' }}
                          title={`Color: ${t.color}`}
                        />
                        <div>
                          <div className="font-semibold text-slate-800 group-hover:text-odoo-purple transition-colors">
                            {t.name}
                          </div>
                          {t.notes && <div className="text-xs text-slate-400 truncate max-w-xs">{t.notes}</div>}
                        </div>
                      </div>
                    </td>

                    {/* Unit */}
                    <td className="py-3.5 px-4 capitalize text-slate-700">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {t.unit}
                      </span>
                    </td>

                    {/* Requires Allocation */}
                    <td className="py-3.5 px-4">
                      {t.requires_allocation ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          Yes
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                          No (Unlimited)
                        </span>
                      )}
                    </td>

                    {/* Approval */}
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600 capitalize">
                      {t.approval_type === 'no_approval'
                        ? 'No Approval (Instant)'
                        : t.approval_type === 'manager'
                        ? 'Direct Manager'
                        : t.approval_type === 'both'
                        ? 'Manager + HR'
                        : 'HR Manager'}
                    </td>

                    {/* Payroll Behavior */}
                    <td className="py-3.5 px-4 text-xs">
                      {t.is_unpaid || t.payroll_behavior === 'unpaid' ? (
                        <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                          Unpaid (Salary Deduction)
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">
                          Paid
                        </span>
                      )}
                    </td>

                    {/* Status Active */}
                    <td className="py-3.5 px-4">
                      {t.active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-500">
                          <XCircle className="w-3.5 h-3.5 text-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {canManageHR && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => handleToggleActive(t.id, e)}
                            title={t.active ? 'Deactivate Type' : 'Activate Type'}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              t.active
                                ? 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                          <Link
                            to={`/time-off/types/${t.id}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        </div>
                      )}
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

export default TimeOffTypesPage;
