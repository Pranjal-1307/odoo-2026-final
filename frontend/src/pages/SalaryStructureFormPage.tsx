import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Calculator, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  X,
} from 'lucide-react';
import { salaryStructureService } from '../services/salaryStructureService';
import type { 
  SalaryRule, 
  SalaryPreviewResponse, 
  RuleCategory, 
  ComputationType, 
  ConditionType 
} from '../types/salaryStructure';
import { useAuth } from '../context/AuthContext';

export const SalaryStructureFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { canConfigurePayroll } = useAuth();

  // Structure Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [company, setCompany] = useState('PeoplePay360 Inc.');
  const [payFrequency, setPayFrequency] = useState('monthly');
  const [description, setDescription] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [effectiveTo, setEffectiveTo] = useState('');
  const [active, setActive] = useState(true);
  const [rules, setRules] = useState<SalaryRule[]>([]);

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Live Preview state
  const [testWage, setTestWage] = useState<number>(50000);
  const [testDaysInPeriod, setTestDaysInPeriod] = useState<number>(30);
  const [testWorkedDays, setTestWorkedDays] = useState<number>(30);
  const [testUnpaidLeaveDays, setTestUnpaidLeaveDays] = useState<number>(0);
  const [previewResult, setPreviewResult] = useState<SalaryPreviewResponse | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Modal for Rule Add/Edit
  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null);
  const [ruleForm, setRuleForm] = useState<{
    id?: number;
    name: string;
    code: string;
    category: RuleCategory;
    sequence: number;
    computation_type: ComputationType;
    fixed_amount: number;
    percentage_base_code: string;
    percentage_rate: number;
    formula_expression: string;
    condition_type: ConditionType;
    condition_formula: string;
    appears_on_payslip: boolean;
    employer_cost_flag: boolean;
    active: boolean;
    description: string;
  }>({
    name: '',
    code: '',
    category: 'Basic',
    sequence: 100,
    computation_type: 'fixed',
    fixed_amount: 0,
    percentage_base_code: 'BASIC',
    percentage_rate: 0,
    formula_expression: '',
    condition_type: 'always',
    condition_formula: '',
    appears_on_payslip: true,
    employer_cost_flag: false,
    active: true,
    description: '',
  });

  // Fetch structure details
  useEffect(() => {
    if (!isNew && id) {
      const fetchDetail = async () => {
        try {
          setLoading(true);
          const data = await salaryStructureService.getStructure(Number(id));
          setName(data.name);
          setCode(data.code);
          setCompany(data.company || 'PeoplePay360 Inc.');
          setPayFrequency(data.pay_frequency || 'monthly');
          setDescription(data.description || '');
          setEffectiveFrom(data.effective_from || '');
          setEffectiveTo(data.effective_to || '');
          setActive(data.active);
          setRules(data.rules || []);
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Failed to fetch salary structure');
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [id, isNew]);

  // Run live calculation preview whenever test parameters or rules change
  const runLivePreview = async () => {
    try {
      setPreviewLoading(true);
      setPreviewError(null);
      const res = await salaryStructureService.previewLiveComputation({
        contract_wage: Number(testWage) || 0,
        days_in_period: Number(testDaysInPeriod) || 30,
        worked_days: Number(testWorkedDays) || 30,
        paid_leave_days: 0,
        unpaid_leave_days: Number(testUnpaidLeaveDays) || 0,
        rules: rules,
      });
      setPreviewResult(res);
    } catch (err: any) {
      setPreviewError(err.response?.data?.detail || 'Calculation simulation failed');
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    if (rules.length > 0) {
      runLivePreview();
    }
  }, [rules, testWage, testDaysInPeriod, testWorkedDays, testUnpaidLeaveDays]);

  // Save Structure
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Structure name is required.');
      return;
    }
    if (!code.trim()) {
      setError('Structure code is required.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      if (isNew) {
        const payload = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          company: company.trim(),
          pay_frequency: payFrequency,
          description: description.trim() || undefined,
          effective_from: effectiveFrom || undefined,
          effective_to: effectiveTo || undefined,
          active,
          rules: rules.map((r) => ({
            name: r.name,
            code: r.code,
            category: r.category,
            sequence: r.sequence,
            computation_type: r.computation_type,
            fixed_amount: r.fixed_amount,
            percentage_base_code: r.percentage_base_code,
            percentage_rate: r.percentage_rate,
            formula_expression: r.formula_expression,
            condition_type: r.condition_type,
            condition_formula: r.condition_formula,
            appears_on_payslip: r.appears_on_payslip,
            employer_cost_flag: r.employer_cost_flag,
            active: r.active,
            description: r.description,
          })),
        };
        const created = await salaryStructureService.createStructure(payload);
        setSuccessMsg('Salary structure created successfully!');
        setTimeout(() => navigate(`/payroll/salary-structures/${created.id}`), 1000);
      } else {
        const payload = {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          company: company.trim(),
          pay_frequency: payFrequency,
          description: description.trim() || undefined,
          effective_from: effectiveFrom || undefined,
          effective_to: effectiveTo || undefined,
          active,
        };
        await salaryStructureService.updateStructure(Number(id), payload);
        setSuccessMsg('Salary structure updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save salary structure');
    } finally {
      setSaving(false);
    }
  };

  // Open Rule Modal for Add or Edit
  const openRuleModal = (ruleIndex: number | null = null) => {
    if (ruleIndex !== null && rules[ruleIndex]) {
      const r = rules[ruleIndex];
      setEditingRuleIndex(ruleIndex);
      setRuleForm({
        id: r.id,
        name: r.name,
        code: r.code,
        category: r.category,
        sequence: r.sequence,
        computation_type: r.computation_type,
        fixed_amount: r.fixed_amount || 0,
        percentage_base_code: r.percentage_base_code || 'BASIC',
        percentage_rate: r.percentage_rate || 0,
        formula_expression: r.formula_expression || '',
        condition_type: r.condition_type || 'always',
        condition_formula: r.condition_formula || '',
        appears_on_payslip: r.appears_on_payslip ?? true,
        employer_cost_flag: r.employer_cost_flag ?? false,
        active: r.active ?? true,
        description: r.description || '',
      });
    } else {
      setEditingRuleIndex(null);
      // Auto-increment sequence based on highest rule sequence
      const maxSeq = rules.reduce((acc, r) => Math.max(acc, r.sequence), 0);
      setRuleForm({
        name: '',
        code: '',
        category: 'Allowance',
        sequence: maxSeq + 100 || 100,
        computation_type: 'fixed',
        fixed_amount: 0,
        percentage_base_code: 'BASIC',
        percentage_rate: 0,
        formula_expression: '',
        condition_type: 'always',
        condition_formula: '',
        appears_on_payslip: true,
        employer_cost_flag: false,
        active: true,
        description: '',
      });
    }
    setRuleModalOpen(true);
  };

  // Save Rule from Modal
  const handleSaveRuleModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleForm.name.trim() || !ruleForm.code.trim()) {
      alert('Rule Name and Rule Code are required.');
      return;
    }

    const cleanCode = ruleForm.code.trim().toUpperCase();

    // Check duplicate code in local rules list
    const isDuplicate = rules.some((r, idx) => r.code === cleanCode && idx !== editingRuleIndex);
    if (isDuplicate) {
      alert(`Rule code '${cleanCode}' is already present in this structure.`);
      return;
    }

    const updatedRule: any = {
      ...ruleForm,
      name: ruleForm.name.trim(),
      code: cleanCode,
      structure_id: Number(id) || 0,
    };

    if (!isNew && id) {
      try {
        if (ruleForm.id) {
          const res = await salaryStructureService.updateRule(ruleForm.id, updatedRule);
          setRules(rules.map((r) => (r.id === ruleForm.id ? res : r)));
        } else {
          const res = await salaryStructureService.createRule({
            ...updatedRule,
            structure_id: Number(id),
          });
          setRules([...rules, res].sort((a, b) => a.sequence - b.sequence));
        }
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to persist rule in backend');
        return;
      }
    } else {
      // Local state update for new structures before initial save
      if (editingRuleIndex !== null) {
        const copy = [...rules];
        copy[editingRuleIndex] = updatedRule;
        setRules(copy.sort((a, b) => a.sequence - b.sequence));
      } else {
        setRules([...rules, updatedRule].sort((a, b) => a.sequence - b.sequence));
      }
    }

    setRuleModalOpen(false);
  };

  // Delete Rule
  const handleDeleteRule = async (index: number) => {
    const target = rules[index];
    if (!target) return;

    if (!isNew && target.id) {
      if (!window.confirm(`Are you sure you want to delete rule '${target.name}'?`)) return;
      try {
        await salaryStructureService.deleteRule(target.id);
        setRules(rules.filter((_, idx) => idx !== index));
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete rule');
      }
    } else {
      setRules(rules.filter((_, idx) => idx !== index));
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

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Loading structure details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Navigation / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/payroll/salary-structures')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-0.5">
              <Layers className="w-4 h-4" />
              <span>{isNew ? 'New Salary Structure' : 'Salary Structure Details'}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isNew ? 'Create Salary Structure' : name || 'Unnamed Structure'}
            </h1>
          </div>
        </div>

        {canConfigurePayroll && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-odoo-purple hover:bg-purple-800 rounded-lg transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Structure'}</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Main Grid: Structure Config (Left) + Interactive Live Previewer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form & Rules Table (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* General Information Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Structure Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Structure Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Monthly Salary"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canConfigurePayroll}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Structure Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. STANDARD_MONTHLY"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  disabled={!canConfigurePayroll}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors uppercase disabled:bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Pay Frequency
                </label>
                <select
                  value={payFrequency}
                  onChange={(e) => setPayFrequency(e.target.value)}
                  disabled={!canConfigurePayroll}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors capitalize bg-white disabled:bg-slate-50"
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="semi-monthly">Semi-Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  disabled={!canConfigurePayroll}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors disabled:bg-slate-50"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Applicability Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Default salary structure applied to standard employment contracts..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canConfigurePayroll}
                  className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors resize-none disabled:bg-slate-50"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    disabled={!canConfigurePayroll}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                <span className="text-sm font-medium text-slate-700">
                  {active ? 'Structure is Active' : 'Structure is Inactive'}
                </span>
              </div>
            </div>
          </div>

          {/* Salary Rules List Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-600" />
                  <span>Configured Salary Rules ({rules.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rules execute deterministically in ascending sequence order.
                </p>
              </div>

              {canConfigurePayroll && (
                <button
                  type="button"
                  onClick={() => openRuleModal(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-odoo-purple hover:bg-purple-800 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Salary Rule</span>
                </button>
              )}
            </div>

            {rules.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500 mb-3">No salary rules configured in this structure yet.</p>
                {canConfigurePayroll && (
                  <button
                    type="button"
                    onClick={() => openRuleModal(null)}
                    className="px-4 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
                  >
                    + Add First Rule (e.g. Basic Salary)
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/60 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                      <th className="py-3 px-4 w-14 text-center">Seq</th>
                      <th className="py-3 px-4">Rule / Component</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Computation Method</th>
                      <th className="py-3 px-3 text-center">Condition</th>
                      {canConfigurePayroll && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rules.map((rule, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                          {rule.sequence}
                        </td>

                        <td className="py-3 px-4 font-medium text-slate-900">
                          <div className="font-semibold text-slate-900">{rule.name}</div>
                          <div className="font-mono text-[11px] text-slate-500 font-bold">{rule.code}</div>
                        </td>

                        <td className="py-3 px-3">
                          {getCategoryBadge(rule.category)}
                        </td>

                        <td className="py-3 px-3 text-slate-700">
                          {rule.computation_type === 'fixed' && (
                            <span className="font-semibold text-slate-800">
                              Fixed: ₹{rule.fixed_amount?.toLocaleString() || 0}
                            </span>
                          )}
                          {rule.computation_type === 'percentage' && (
                            <span className="font-semibold text-blue-800">
                              {rule.percentage_rate}% of {rule.percentage_base_code || 'BASIC'}
                            </span>
                          )}
                          {rule.computation_type === 'formula' && (
                            <code className="px-2 py-0.5 bg-slate-100 rounded text-purple-700 font-mono text-[11px] border border-slate-200">
                              {rule.formula_expression || 'Custom'}
                            </code>
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          {rule.condition_type === 'conditional' ? (
                            <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200" title={rule.condition_formula || ''}>
                              Conditional
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Always</span>
                          )}
                        </td>

                        {canConfigurePayroll && (
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => openRuleModal(idx)}
                                className="p-1 text-slate-400 hover:text-purple-600 rounded transition-colors"
                                title="Edit Rule"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(idx)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                title="Delete Rule"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Salary Calculator & Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-purple-200/80 shadow-md p-5 sticky top-20 bg-gradient-to-b from-purple-50/30 to-white">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>Live Salary Calculator Simulator</span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Authoritative Backend Engine
              </span>
            </div>

            {/* Test Parameter Inputs */}
            <div className="grid grid-cols-3 gap-2.5 mb-5 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div className="col-span-3">
                <label className="block font-bold text-slate-700 mb-1">
                  Contract Wage (₹ Base)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={testWage}
                    onChange={(e) => setTestWage(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Days in Month</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={testDaysInPeriod}
                  onChange={(e) => setTestDaysInPeriod(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Worked Days</label>
                <input
                  type="number"
                  min="0"
                  max={testDaysInPeriod}
                  value={testWorkedDays}
                  onChange={(e) => setTestWorkedDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Unpaid Leaves</label>
                <input
                  type="number"
                  min="0"
                  max={testDaysInPeriod}
                  value={testUnpaidLeaveDays}
                  onChange={(e) => setTestUnpaidLeaveDays(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-rose-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Calculation Output Card */}
            {previewLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs font-medium animate-pulse">
                Simulating calculation in backend...
              </div>
            ) : previewError ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
                {previewError}
              </div>
            ) : previewResult ? (
              <div className="space-y-4">
                
                {/* Net Salary Highlight Card */}
                <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl text-white shadow-lg relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl"></div>
                  <div className="text-xs uppercase font-bold tracking-widest text-purple-200 mb-1">
                    Estimated Net Take-Home Salary
                  </div>
                  <div className="text-3xl font-extrabold tracking-tight text-white flex items-baseline gap-1">
                    <span>₹</span>
                    <span>{previewResult.net_salary.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-white/10 text-purple-200">
                    <span>Gross: ₹{previewResult.gross_earnings.toLocaleString('en-IN')}</span>
                    <span>Deductions: -₹{previewResult.total_deductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Detailed Components Breakdown */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Calculated Rule Breakdown
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 text-xs">
                    {previewResult.components.map((comp, cIdx) => (
                      <div key={cIdx} className="pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400">#{comp.sequence}</span>
                          <div>
                            <span className="font-semibold text-slate-900">{comp.rule_name}</span>
                            <span className="ml-1.5 font-mono text-[10px] text-slate-400">({comp.rule_code})</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {comp.category === 'Deduction' && (
                            <span className="font-mono font-bold text-rose-600">
                              -₹{comp.amount.toLocaleString('en-IN')}
                            </span>
                          )}
                          {comp.category === 'Allowance' && (
                            <span className="font-mono font-bold text-emerald-600">
                              +₹{comp.amount.toLocaleString('en-IN')}
                            </span>
                          )}
                          {comp.category === 'Basic' && (
                            <span className="font-mono font-bold text-blue-700">
                              ₹{comp.amount.toLocaleString('en-IN')}
                            </span>
                          )}
                          {comp.category === 'Gross' && (
                            <span className="font-mono font-bold text-purple-700">
                              = ₹{comp.amount.toLocaleString('en-IN')}
                            </span>
                          )}
                          {comp.category === 'Net' && (
                            <span className="font-mono font-extrabold text-indigo-700">
                              = ₹{comp.amount.toLocaleString('en-IN')}
                            </span>
                          )}
                          {comp.category === 'Employer Contribution' && (
                            <span className="font-mono font-bold text-amber-700">
                              (₹{comp.amount.toLocaleString('en-IN')})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Modal: Add / Edit Salary Rule */}
      {ruleModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-scaleIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-600" />
                <span>{editingRuleIndex !== null ? 'Edit Salary Rule' : 'Add New Salary Rule'}</span>
              </h3>
              <button
                onClick={() => setRuleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRuleModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">
                    Rule Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. House Rent Allowance"
                    value={ruleForm.name}
                    onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-bold text-slate-700 mb-1">
                    Rule Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. HRA"
                    value={ruleForm.code}
                    onChange={(e) => setRuleForm({ ...ruleForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg uppercase focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={ruleForm.category}
                    onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value as RuleCategory })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Allowance">Allowance</option>
                    <option value="Gross">Gross</option>
                    <option value="Deduction">Deduction</option>
                    <option value="Employer Contribution">Employer Contribution</option>
                    <option value="Net">Net</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sequence</label>
                  <input
                    type="number"
                    min="1"
                    step="10"
                    value={ruleForm.sequence}
                    onChange={(e) => setRuleForm({ ...ruleForm, sequence: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Calculation Method</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['fixed', 'percentage', 'formula'] as ComputationType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setRuleForm({ ...ruleForm, computation_type: t })}
                        className={`py-1.5 text-xs font-semibold rounded-lg border capitalize transition-all ${
                          ruleForm.computation_type === t
                            ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dynamic Computation Fields */}
                {ruleForm.computation_type === 'fixed' && (
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">Fixed Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="100"
                      value={ruleForm.fixed_amount}
                      onChange={(e) => setRuleForm({ ...ruleForm, fixed_amount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
                    />
                  </div>
                )}

                {ruleForm.computation_type === 'percentage' && (
                  <>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Percentage Rate (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="1000"
                        step="0.5"
                        value={ruleForm.percentage_rate}
                        onChange={(e) => setRuleForm({ ...ruleForm, percentage_rate: Number(e.target.value) })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Percentage Base Component</label>
                      <input
                        type="text"
                        placeholder="BASIC or GROSS"
                        value={ruleForm.percentage_base_code}
                        onChange={(e) => setRuleForm({ ...ruleForm, percentage_base_code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg uppercase"
                      />
                    </div>
                  </>
                )}

                {ruleForm.computation_type === 'formula' && (
                  <div className="col-span-2">
                    <label className="block font-bold text-slate-700 mb-1">
                      Formula Expression
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BASIC + HRA + TRANSPORT"
                      value={ruleForm.formula_expression}
                      onChange={(e) => setRuleForm({ ...ruleForm, formula_expression: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['BASIC', 'HRA', 'GROSS', 'contract_wage', 'unpaid_leave_days', 'days_in_period'].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setRuleForm({
                            ...ruleForm,
                            formula_expression: ruleForm.formula_expression ? `${ruleForm.formula_expression} + ${chip}` : chip
                          })}
                          className="px-1.5 py-0.5 bg-slate-100 hover:bg-purple-100 text-slate-600 hover:text-purple-800 rounded text-[10px] font-mono border border-slate-200"
                        >
                          +{chip}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Condition settings */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicability Condition</label>
                  <select
                    value={ruleForm.condition_type}
                    onChange={(e) => setRuleForm({ ...ruleForm, condition_type: e.target.value as ConditionType })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="always">Always Applicable</option>
                    <option value="conditional">Conditional Expression</option>
                  </select>
                </div>

                {ruleForm.condition_type === 'conditional' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Condition Expression</label>
                    <input
                      type="text"
                      placeholder="e.g. unpaid_leave_days > 0"
                      value={ruleForm.condition_formula}
                      onChange={(e) => setRuleForm({ ...ruleForm, condition_formula: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRuleModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-odoo-purple hover:bg-purple-800 rounded-lg shadow-sm"
                >
                  {editingRuleIndex !== null ? 'Update Rule' : 'Add Rule to Structure'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SalaryStructureFormPage;
