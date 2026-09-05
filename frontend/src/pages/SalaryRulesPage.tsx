import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Calculator, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Power,
  AlertCircle,
  Percent,
  Coins,
  FileCode2
} from 'lucide-react';
import { salaryStructureService } from '../services/salaryStructureService';
import type { SalaryRule, SalaryStructure } from '../types/salaryStructure';
import { useAuth } from '../context/AuthContext';

export const SalaryRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const { canConfigurePayroll } = useAuth();

  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [computationFilter, setComputationFilter] = useState<string>('all');
  const [structureFilter, setStructureFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { limit: 100 };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (computationFilter !== 'all') params.computation_type = computationFilter;
      if (structureFilter !== 'all') params.structure_id = Number(structureFilter);
      if (activeFilter === 'active') params.active = true;
      if (activeFilter === 'inactive') params.active = false;

      const [ruleData, structData] = await Promise.all([
        salaryStructureService.listRules(params),
        salaryStructureService.listStructures({ limit: 50 })
      ]);
      setRules(ruleData.items);
      setStructures(structData.items);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load salary rules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, [categoryFilter, computationFilter, structureFilter, activeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRules();
  };

  const handleToggleStatus = async (rule: SalaryRule) => {
    try {
      await salaryStructureService.toggleRuleStatus(rule.id);
      fetchRules();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle rule status');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await salaryStructureService.deleteRule(id);
      setDeleteConfirmId(null);
      fetchRules();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete rule');
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'Basic':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">Basic</span>;
      case 'Allowance':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Allowance</span>;
      case 'Gross':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">Gross</span>;
      case 'Deduction':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">Deduction</span>;
      case 'Employer Contribution':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">Employer Cost</span>;
      case 'Net':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">Net Salary</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{cat}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            <span>Payroll Computation Library</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Salary Rules</h1>
          <p className="text-sm text-slate-500 mt-1">
            Component rules executing fixed, percentage, and formula-based payroll algorithms in deterministic sequences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/payroll/salary-structures')}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2"
          >
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Salary Structures</span>
          </button>

          {canConfigurePayroll && (
            <button
              onClick={() => navigate('/payroll/salary-rules/new')}
              className="px-4 py-2 text-sm font-medium text-white bg-odoo-purple hover:bg-purple-800 rounded-lg transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Salary Rule</span>
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
            placeholder="Search rules by name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Structure Selector */}
          <select
            value={structureFilter}
            onChange={(e) => setStructureFilter(e.target.value)}
            className="text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700"
          >
            <option value="all">All Structures</option>
            {structures.map((s) => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>

          {/* Category Selector */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700"
          >
            <option value="all">All Categories</option>
            <option value="Basic">Basic</option>
            <option value="Allowance">Allowance</option>
            <option value="Gross">Gross</option>
            <option value="Deduction">Deduction</option>
            <option value="Employer Contribution">Employer Cost</option>
            <option value="Net">Net Salary</option>
          </select>

          {/* Computation Type */}
          <select
            value={computationFilter}
            onChange={(e) => setComputationFilter(e.target.value)}
            className="text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700 capitalize"
          >
            <option value="all">All Calculation Types</option>
            <option value="fixed">Fixed Amount</option>
            <option value="percentage">Percentage Rate</option>
            <option value="formula">Expression Formula</option>
          </select>

          {/* Status Filter */}
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-purple-500 text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3"></div>
            <p className="text-sm text-slate-500 font-medium">Loading salary rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-purple-100">
              <Calculator className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No Salary Rules Found</h3>
            <p className="text-sm text-slate-500 mb-6">
              {search ? 'Try adjusting your search filters.' : 'Create salary rules to define components of employee remuneration.'}
            </p>
            {canConfigurePayroll && (
              <button
                onClick={() => navigate('/payroll/salary-rules/new')}
                className="px-4 py-2 text-sm font-medium text-white bg-odoo-purple hover:bg-purple-800 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Salary Rule</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16 text-center">Seq</th>
                  <th className="py-3.5 px-6">Rule Name & Code</th>
                  <th className="py-3.5 px-4">Structure</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Calculation Specification</th>
                  <th className="py-3.5 px-4 text-center">Condition</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {rules.map((rule) => (
                  <tr 
                    key={rule.id} 
                    className="hover:bg-purple-50/30 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/payroll/salary-rules/${rule.id}`)}
                  >
                    <td className="py-4 px-4 text-center font-mono font-bold text-slate-500">
                      {rule.sequence}
                    </td>

                    <td className="py-4 px-6 font-medium text-slate-900">
                      <div className="font-semibold text-slate-900 group-hover:text-purple-700 transition-colors">
                        {rule.name}
                      </div>
                      <div className="font-mono text-xs font-bold text-slate-400 mt-0.5">
                        {rule.code}
                      </div>
                    </td>

                    <td className="py-4 px-4 text-xs font-medium text-slate-600">
                      {rule.structure_name || 'Generic'}
                    </td>

                    <td className="py-4 px-4">
                      {getCategoryBadge(rule.category)}
                    </td>

                    <td className="py-4 px-4 text-xs text-slate-700">
                      {rule.computation_type === 'fixed' && (
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Coins className="w-3.5 h-3.5 text-slate-400" />
                          <span>Fixed ₹{rule.fixed_amount?.toLocaleString() || 0}</span>
                        </div>
                      )}
                      {rule.computation_type === 'percentage' && (
                        <div className="flex items-center gap-1.5 font-bold text-blue-800">
                          <Percent className="w-3.5 h-3.5 text-blue-500" />
                          <span>{rule.percentage_rate}% of {rule.percentage_base_code || 'BASIC'}</span>
                        </div>
                      )}
                      {rule.computation_type === 'formula' && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-purple-700">
                          <FileCode2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <code className="px-1.5 py-0.5 bg-purple-50 rounded border border-purple-200">
                            {rule.formula_expression || 'Custom'}
                          </code>
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {rule.condition_type === 'conditional' ? (
                        <span className="inline-flex px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200" title={rule.condition_formula || ''}>
                          Conditional
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">Always</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      {rule.active ? (
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
                          onClick={() => navigate(`/payroll/salary-rules/${rule.id}`)}
                          className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Edit Rule"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {canConfigurePayroll && (
                          <button
                            onClick={() => handleToggleStatus(rule)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              rule.active
                                ? 'text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={rule.active ? 'Deactivate Rule' : 'Activate Rule'}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}

                        {canConfigurePayroll && (
                          <button
                            onClick={() => setDeleteConfirmId(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete Rule"
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
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete Salary Rule?</h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">
              Are you sure you want to delete this rule? It will be removed from its parent salary structure.
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
                Delete Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default SalaryRulesPage;
