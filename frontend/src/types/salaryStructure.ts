export type RuleCategory = 
  | 'Basic'
  | 'Allowance'
  | 'Gross'
  | 'Deduction'
  | 'Employer Contribution'
  | 'Net';

export type ComputationType = 'fixed' | 'percentage' | 'formula';

export type ConditionType = 'always' | 'conditional';

export interface SalaryRule {
  id: number;
  structure_id: number;
  structure_name?: string;
  structure_code?: string;
  name: string;
  code: string;
  category: RuleCategory;
  sequence: number;
  computation_type: ComputationType;
  fixed_amount: number;
  percentage_base_code?: string | null;
  percentage_rate: number;
  formula_expression?: string | null;
  condition_type: ConditionType;
  condition_formula?: string | null;
  appears_on_payslip: boolean;
  employer_cost_flag: boolean;
  active: boolean;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SalaryStructure {
  id: number;
  name: string;
  code: string;
  company: string;
  pay_frequency: 'monthly' | 'weekly' | 'bi-weekly' | 'semi-monthly' | string;
  description?: string | null;
  effective_from?: string | null;
  effective_to?: string | null;
  active: boolean;
  rules_count?: number;
  contracts_count?: number;
  rules?: SalaryRule[];
  created_at?: string;
  updated_at?: string;
}

export interface SalaryStructureCreatePayload {
  name: string;
  code: string;
  company?: string;
  pay_frequency?: string;
  description?: string;
  effective_from?: string;
  effective_to?: string;
  active?: boolean;
  rules?: Partial<SalaryRule>[];
}

export interface SalaryStructureUpdatePayload {
  name?: string;
  code?: string;
  company?: string;
  pay_frequency?: string;
  description?: string;
  effective_from?: string;
  effective_to?: string;
  active?: boolean;
}

export interface SalaryRuleCreatePayload {
  structure_id: number;
  name: string;
  code: string;
  category: RuleCategory;
  sequence: number;
  computation_type: ComputationType;
  fixed_amount?: number;
  percentage_base_code?: string;
  percentage_rate?: number;
  formula_expression?: string;
  condition_type?: ConditionType;
  condition_formula?: string;
  appears_on_payslip?: boolean;
  employer_cost_flag?: boolean;
  active?: boolean;
  description?: string;
}

export interface SalaryRuleUpdatePayload {
  name?: string;
  code?: string;
  category?: RuleCategory;
  sequence?: number;
  computation_type?: ComputationType;
  fixed_amount?: number;
  percentage_base_code?: string;
  percentage_rate?: number;
  formula_expression?: string;
  condition_type?: ConditionType;
  condition_formula?: string;
  appears_on_payslip?: boolean;
  employer_cost_flag?: boolean;
  active?: boolean;
  description?: string;
}

export interface SalaryComponentPreview {
  sequence: number;
  rule_id?: number;
  rule_code: string;
  rule_name: string;
  category: RuleCategory;
  computation_type: ComputationType;
  amount: number;
  description?: string | null;
  appears_on_payslip: boolean;
  employer_cost_flag: boolean;
  condition_applied: boolean;
}

export interface SalaryPreviewRequest {
  contract_wage: number;
  days_in_period?: number;
  worked_days?: number;
  paid_leave_days?: number;
  unpaid_leave_days?: number;
  employee_id?: number;
}

export interface SalaryPreviewResponse {
  structure_id?: number;
  structure_name?: string;
  structure_code?: string;
  contract_wage: number;
  basic_salary: number;
  gross_earnings: number;
  total_deductions: number;
  net_salary: number;
  employer_cost: number;
  components: SalaryComponentPreview[];
  warnings: string[];
  context_used: Record<string, any>;
}

export interface LiveComputationRequest {
  contract_wage: number;
  days_in_period?: number;
  worked_days?: number;
  paid_leave_days?: number;
  unpaid_leave_days?: number;
  rules: Partial<SalaryRule>[];
}

export interface SalaryStructureListResponse {
  items: SalaryStructure[];
  total: number;
  page: number;
  limit: number;
}

export interface SalaryRuleListResponse {
  items: SalaryRule[];
  total: number;
  page: number;
  limit: number;
}

// ==========================================
// Salary Rules Engine Calculation Preview Types
// ==========================================
export interface PayrollCalculatePreviewRequest {
  employee_id: number;
  period_start: string;
  period_end: string;
  contract_id?: number;
  custom_inputs?: Record<string, number>;
}

export interface RuleExecutionTraceItem {
  sequence: number;
  rule_id?: number;
  rule_code: string;
  rule_name: string;
  category: string;
  computation_type: string;
  status: 'calculated' | 'skipped' | 'error';
  condition_applied: boolean;
  inputs_used: Record<string, any>;
  formula_or_rate?: string | null;
  amount: number;
  appears_on_payslip: boolean;
  employer_cost_flag: boolean;
  note?: string | null;
}

export interface SalaryComponentResult {
  sequence: number;
  rule_id?: number;
  rule_code: string;
  rule_name: string;
  category: string;
  computation_type: string;
  amount: number;
  description?: string | null;
  appears_on_payslip: boolean;
  employer_cost_flag: boolean;
  condition_applied: boolean;
}

export interface EmployeeSummary {
  id: number;
  name: string;
  employee_code: string;
  work_email?: string | null;
  department: string;
  job_position: string;
  company?: string | null;
}

export interface ContractSummary {
  id: number;
  contract_code: string;
  name: string;
  wage_per_month: number;
  start_date: string;
  end_date?: string | null;
  status: string;
  salary_structure_id: number;
}

export interface StructureSummary {
  id: number;
  name: string;
  code: string;
  pay_frequency: string;
  active: boolean;
}

export interface AttendanceSummary {
  scheduled_days: number;
  worked_days: number;
  absent_days: number;
  total_worked_hours: number;
  overtime_hours: number;
  late_minutes: number;
}

export interface TimeOffSummary {
  paid_leave_days: number;
  unpaid_leave_days: number;
  total_leave_days: number;
  leave_records_count: number;
}

export interface PeriodSummary {
  start_date: string;
  end_date: string;
  days_in_period: number;
}

export interface PayrollCalculatePreviewResponse {
  mode: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | string;
  employee: EmployeeSummary;
  contract: ContractSummary;
  structure: StructureSummary;
  period: PeriodSummary;
  attendance: AttendanceSummary;
  time_off: TimeOffSummary;
  basic_salary: number;
  allowance_total: number;
  earning_total: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  employer_contribution_total: number;
  employer_cost: number;
  components: SalaryComponentResult[];
  calculation_trace: RuleExecutionTraceItem[];
  warnings: string[];
  context_used: Record<string, any>;
}

