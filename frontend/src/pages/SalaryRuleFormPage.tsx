import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Calculator, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  Percent, 
  Coins, 
  FileCode2
} from 'lucide-react';
import { salaryStructureService } from '../services/salaryStructureService';
import type { SalaryStructure, RuleCategory, ComputationType, ConditionType } from '../types/salaryStructure';
import { useAuth } from '../context/AuthContext';

export const SalaryRuleFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { canConfigurePayroll } = useAuth();

  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [structureId, setStructureId] = useState<number | ''>('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<RuleCategory>('Basic');
  const [sequence, setSequence] = useState<number>(100);
  const [computationType, setComputationType] = useState<ComputationType>('fixed');
  const [fixedAmount, setFixedAmount] = useState<number>(0);
  const [percentageBaseCode, setPercentageBaseCode] = useState('BASIC');
  const [percentageRate, setPercentageRate] = useState<number>(0);
  const [formulaExpression, setFormulaExpression] = useState('');
  const [conditionType, setConditionType] = useState<ConditionType>('always');
  const [conditionFormula, setConditionFormula] = useState('');
  const [appearsOnPayslip, setAppearsOnPayslip] = useState(true);
  const [employerCostFlag, setEmployerCostFlag] = useState(false);
  const [active, setActive] = useState(true);
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const structRes = await salaryStructureService.listStructures({ limit: 100 });
        setStructures(structRes.items);

        if (!isNew && id) {
          const rule = await salaryStructureService.getRule(Number(id));
          setStructureId(rule.structure_id);
          setName(rule.name);
          setCode(rule.code);
          setCategory(rule.category);
          setSequence(rule.sequence);
          setComputationType(rule.computation_type);
          setFixedAmount(rule.fixed_amount || 0);
          setPercentageBaseCode(rule.percentage_base_code || 'BASIC');
          setPercentageRate(rule.percentage_rate || 0);
          setFormulaExpression(rule.formula_expression || '');
          setConditionType(rule.condition_type || 'always');
          setConditionFormula(rule.condition_formula || '');
          setAppearsOnPayslip(rule.appears_on_payslip ?? true);
          setEmployerCostFlag(rule.employer_cost_flag ?? false);
          setActive(rule.active ?? true);
          setDescription(rule.description || '');
        } else if (structRes.items.length > 0) {
          setStructureId(structRes.items[0].id);
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to initialize rule form');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [id, isNew]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setError('Rule Name and Rule Code are required.');
      return;
    }
    if (!structureId) {
      setError('Please select a Salary Structure for this rule.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        structure_id: Number(structureId),
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        sequence: Number(sequence) || 10,
        computation_type: computationType,
        fixed_amount: Number(fixedAmount) || 0,
        percentage_base_code: percentageBaseCode.trim().toUpperCase() || undefined,
        percentage_rate: Number(percentageRate) || 0,
        formula_expression: formulaExpression.trim() || undefined,
        condition_type: conditionType,
        condition_formula: conditionFormula.trim() || undefined,
        appears_on_payslip: appearsOnPayslip,
        employer_cost_flag: employerCostFlag,
        active,
        description: description.trim() || undefined,
      };

      if (isNew) {
        const created = await salaryStructureService.createRule(payload);
        setSuccessMsg('Salary rule created successfully!');
        setTimeout(() => navigate(`/payroll/salary-rules/${created.id}`), 1000);
      } else {
        await salaryStructureService.updateRule(Number(id), payload);
        setSuccessMsg('Salary rule updated successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save salary rule');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Loading salary rule details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/payroll/salary-rules')}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-700 uppercase tracking-wider mb-0.5">
              <Calculator className="w-4 h-4" />
              <span>{isNew ? 'New Salary Rule' : 'Salary Rule Details'}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isNew ? 'Create Salary Rule' : name || 'Unnamed Rule'}
            </h1>
          </div>
        </div>

        {canConfigurePayroll && (
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-odoo-purple hover:bg-purple-800 rounded-lg transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Salary Rule'}</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* Rule Form Card */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm space-y-6">
        
        {/* Section 1: Identification & Structure */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>Rule Identification & Structure Assignment</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Salary Structure <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={structureId}
                onChange={(e) => setStructureId(Number(e.target.value))}
                disabled={!canConfigurePayroll}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors bg-white disabled:bg-slate-50"
              >
                <option value="">Select Salary Structure</option>
                {structures.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Execution Sequence <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="10"
                required
                value={sequence}
                onChange={(e) => setSequence(Number(e.target.value))}
                disabled={!canConfigurePayroll}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rule Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. House Rent Allowance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canConfigurePayroll}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rule Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. HRA"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                disabled={!canConfigurePayroll}
                className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors uppercase disabled:bg-slate-50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as RuleCategory)}
                disabled={!canConfigurePayroll}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors bg-white disabled:bg-slate-50"
              >
                <option value="Basic">Basic Salary</option>
                <option value="Allowance">Allowance / Earning</option>
                <option value="Gross">Gross Salary</option>
                <option value="Deduction">Employee Deduction</option>
                <option value="Employer Contribution">Employer Cost / Contribution</option>
                <option value="Net">Net Take-Home Salary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rule Active Status
              </label>
              <div className="flex items-center gap-3 pt-2">
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
                <span className="text-xs font-medium text-slate-700">
                  {active ? 'Rule is Enabled' : 'Rule is Disabled'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Computation Algorithm */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Coins className="w-4 h-4 text-purple-600" />
            <span>Computation Algorithm</span>
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Calculation Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['fixed', 'percentage', 'formula'] as ComputationType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setComputationType(t)}
                    disabled={!canConfigurePayroll}
                    className={`py-2.5 px-4 text-xs font-bold rounded-xl border capitalize transition-all text-center flex flex-col items-center gap-1 ${
                      computationType === t
                        ? 'bg-purple-50 text-purple-900 border-purple-400 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {t === 'fixed' && <Coins className="w-4 h-4 text-amber-600" />}
                    {t === 'percentage' && <Percent className="w-4 h-4 text-blue-600" />}
                    {t === 'formula' && <FileCode2 className="w-4 h-4 text-purple-600" />}
                    <span>{t} Calculation</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Computation Inputs */}
            {computationType === 'fixed' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fixed Amount (₹ INR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(Number(e.target.value))}
                  disabled={!canConfigurePayroll}
                  className="w-full px-3.5 py-2 text-sm font-bold text-slate-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors disabled:bg-slate-50"
                />
              </div>
            )}

            {computationType === 'percentage' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Percentage Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    step="0.1"
                    value={percentageRate}
                    onChange={(e) => setPercentageRate(Number(e.target.value))}
                    disabled={!canConfigurePayroll}
                    className="w-full px-3.5 py-2 text-sm font-bold text-blue-900 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Percentage Base Component Code
                  </label>
                  <input
                    type="text"
                    placeholder="BASIC, GROSS, or contract_wage"
                    value={percentageBaseCode}
                    onChange={(e) => setPercentageBaseCode(e.target.value.toUpperCase())}
                    disabled={!canConfigurePayroll}
                    className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg uppercase focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors disabled:bg-slate-50"
                  />
                </div>
              </div>
            )}

            {computationType === 'formula' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Formula Expression
                </label>
                <input
                  type="text"
                  placeholder="e.g. BASIC + HRA + TRANSPORT or (BASIC / days_in_period) * unpaid_leave_days"
                  value={formulaExpression}
                  onChange={(e) => setFormulaExpression(e.target.value)}
                  disabled={!canConfigurePayroll}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors disabled:bg-slate-50"
                />
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[11px] font-semibold text-slate-400 mr-1">Insert Variable:</span>
                  {['BASIC', 'HRA', 'GROSS', 'contract_wage', 'worked_days', 'unpaid_leave_days', 'days_in_period'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setFormulaExpression(formulaExpression ? `${formulaExpression} + ${chip}` : chip)}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-800 rounded text-xs font-mono border border-slate-200 transition-colors"
                    >
                      +{chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Conditions & Payslip Display */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
            <Percent className="w-4 h-4 text-purple-600" />
            <span>Condition & Payslip Settings</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Applicability Condition
              </label>
              <select
                value={conditionType}
                onChange={(e) => setConditionType(e.target.value as ConditionType)}
                disabled={!canConfigurePayroll}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors bg-white disabled:bg-slate-50"
              >
                <option value="always">Always Applicable</option>
                <option value="conditional">Conditional Formula</option>
              </select>
            </div>

            {conditionType === 'conditional' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Condition Expression
                </label>
                <input
                  type="text"
                  placeholder="e.g. unpaid_leave_days > 0"
                  value={conditionFormula}
                  onChange={(e) => setConditionFormula(e.target.value)}
                  disabled={!canConfigurePayroll}
                  className="w-full px-3.5 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors disabled:bg-slate-50"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="appearsOnPayslip"
                checked={appearsOnPayslip}
                onChange={(e) => setAppearsOnPayslip(e.target.checked)}
                disabled={!canConfigurePayroll}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <label htmlFor="appearsOnPayslip" className="text-xs font-semibold text-slate-700">
                Appears on Employee Payslip
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="employerCostFlag"
                checked={employerCostFlag}
                onChange={(e) => setEmployerCostFlag(e.target.checked)}
                disabled={!canConfigurePayroll}
                className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
              />
              <label htmlFor="employerCostFlag" className="text-xs font-semibold text-slate-700">
                Is Employer Cost / Contribution (Does not deduct employee net)
              </label>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Rule Notes / Statutory Reference
              </label>
              <textarea
                rows={2}
                placeholder="Statutory explanation, labor law article, or calculation rationale..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canConfigurePayroll}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-colors resize-none disabled:bg-slate-50"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        {canConfigurePayroll && (
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/payroll/salary-rules')}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-sm font-semibold text-white bg-odoo-purple hover:bg-purple-800 rounded-lg transition-all shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Salary Rule'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
export default SalaryRuleFormPage;
