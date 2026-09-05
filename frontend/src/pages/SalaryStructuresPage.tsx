import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Calculator, 
  Edit3, 
  Trash2, 
  Power,
  AlertCircle,
} from 'lucide-react';
import { salaryStructureService } from '../services/salaryStructureService';
import type { SalaryStructure } from '../types/salaryStructure';
import { useAuth } from '../context/AuthContext';

export const SalaryStructuresPage: React.FC = () => {
  const navigate = useNavigate();
  const { canConfigurePayroll } = useAuth();

  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = {};
      if (search.trim()) params.search = search.trim();
      if (activeFilter === 'active') params.active = true;
      if (activeFilter === 'inactive') params.active = false;
      if (frequencyFilter !== 'all') params.pay_frequency = frequencyFilter;

      const data = await salaryStructureService.listStructures(params);
      setStructures(data.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load salary structures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, [activeFilter, frequencyFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStructures();
  };

  const handleToggleStatus = async (struct: SalaryStructure) => {
    try {
      await salaryStructureService.toggleStructureStatus(struct.id, !struct.active);
      fetchStructures();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to change structure status');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await salaryStructureService.deleteStructure(id);
      setDeleteConfirmId(null);
      fetchStructures();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete salary structure');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Payroll Engine & Configuration</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Salary Structures</h1>
          <p className="text-sm text-slate-500 mt-1">
            Define reusable templates for computing basic salary, allowances, gross pay, deductions, and net salary.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/payroll/salary-rules')}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <Calculator className="w-4 h-4 text-purple-600" />
            <span>Rule Library</span>
          </button>

          {canConfigurePayroll && (
            <button
              onClick={() => navigate('/payroll/salary-structures/new')}
              className="px-4 py-2 text-sm font-medium text-white bg-odoo-purple hover:bg-purple-800 rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Structure</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === 'all'
                  ? 'bg-white text-purple-900 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === 'active'
                  ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveFilter('inactive')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                activeFilter === 'inactive'
                  ? 'bg-white text-slate-800 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Inactive
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={frequencyFilter}
              onChange={(e) => setFrequencyFilter(e.target.value)}
              className="text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700"
            >
              <option value="all">All Frequencies</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="bi-weekly">Bi-Weekly</option>
              <option value="semi-monthly">Semi-Monthly</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm text-slate-500 font-medium">Loading salary structures...</p>
          </div>
        ) : structures.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No Salary Structures Found</h3>
            <p className="text-sm text-slate-500 mb-6">
              {search ? 'Try adjusting your search keywords or active filter.' : 'Create your first salary calculation structure to attach to employee contracts.'}
            </p>
            {canConfigurePayroll && (
              <button
                onClick={() => navigate('/payroll/salary-structures/new')}
                className="px-4 py-2 text-sm font-medium text-white bg-odoo-purple hover:bg-purple-800 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Salary Structure</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Structure Name</th>
                  <th className="py-3.5 px-4">Code</th>
                  <th className="py-3.5 px-4">Pay Frequency</th>
                  <th className="py-3.5 px-4 text-center">Rules Configured</th>
                  <th className="py-3.5 px-4 text-center">Contracts Linked</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {structures.map((struct) => (
                  <tr 
                    key={struct.id} 
                    className="hover:bg-purple-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/payroll/salary-structures/${struct.id}`)}
                  >
                    <td className="py-4 px-6 font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-purple-100/70 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                          {struct.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                            {struct.name}
                          </div>
                          {struct.description && (
                            <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                              {struct.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-xs font-semibold text-slate-700">
                      <span className="px-2 py-1 bg-slate-100 rounded border border-slate-200/80">
                        {struct.code}
                      </span>
                    </td>

                    <td className="py-4 px-4 capitalize text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{struct.pay_frequency}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                        {struct.rules_count || 0} rules
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                        {struct.contracts_count || 0} contracts
                      </span>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {struct.active ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <XCircle className="w-3 h-3 text-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/payroll/salary-structures/${struct.id}`)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="View / Edit Structure"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {canConfigurePayroll && (
                          <button
                            onClick={() => handleToggleStatus(struct)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              struct.active
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={struct.active ? 'Deactivate Structure' : 'Activate Structure'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}

                        {canConfigurePayroll && (
                          <button
                            onClick={() => setDeleteConfirmId(struct.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Structure"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Salary Structure?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete this structure? If it is already linked to active contracts or past payroll records, the system will prevent accidental deletion to protect historical data integrity.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm"
              >
                Delete Structure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SalaryStructuresPage;
