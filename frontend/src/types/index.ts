export type UserRole = 
  | 'Employee' 
  | 'HR Manager' 
  | 'HR Payroll User' 
  | 'HR Payroll Manager' 
  | 'Admin';

export interface User {
  id: number;
  email: string;
  username: string;
  name?: string;
  role: UserRole;
  is_active: boolean;
  employee_id?: number;
  employee_name?: string;
  last_login_at?: string;
}

export interface Employee {
  id: number;
  employee_code: string;
  name: string;
  work_email: string;
  phone?: string;
  department: string;
  job_position: string;
  manager_id?: number;
  manager_name?: string;
  working_schedule_id?: number;
  working_schedule_name?: string;
  company: string;
  work_location: string;
  employee_type: string;
  status: 'active' | 'inactive' | 'on_leave' | 'terminated';
  avatar_url?: string;
  bank_name?: string;
  bank_account_no?: string;
  ifsc_code?: string;
  pan_no?: string;
  
  // Counts for smart buttons
  contract_count?: number;
  attendance_count?: number;
  time_off_count?: number;
  allocation_count?: number;
  payslip_count?: number;
}

export interface Contract {
  id: number;
  contract_code: string;
  name: string;
  employee_id: number;
  employee_name: string;
  employee_code?: string;
  department?: string;
  job_position?: string;
  start_date: string;
  end_date?: string;
  wage_per_month: number;
  status: 'draft' | 'running' | 'expired' | 'terminated';
  working_schedule_id?: number;
  working_schedule_name?: string;
  salary_structure_id: number;
  salary_structure_name: string;
  notes?: string;
}

export interface WorkingSchedule {
  id: number;
  name: string;
  company: string;
  timezone: string;
  days_per_week: number;
  hours_per_week: number;
  status: string;
  days?: WorkingScheduleDay[];
  employee_count?: number;
  contract_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WorkingScheduleDay {
  id?: number;
  schedule_id?: number;
  day_of_week: string;
  start_time: string;
  end_time: string;
  break_hours: number;
  daily_hours: number;
}

export interface Attendance {
  id: number;
  employee_id: number;
  employee_name: string;
  employee_code?: string;
  department?: string;
  manager_id?: number;
  manager_name?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  worked_hours: number;
  expected_hours: number;
  overtime_hours: number;
  late_minutes: number;
  status: 'present' | 'checked_in' | 'partial' | 'late' | 'overtime' | 'absent' | 'incomplete' | 'on_leave';
  is_manual_edit: boolean;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceCurrentStatus {
  is_checked_in: boolean;
  attendance_id?: number | null;
  employee_id?: number | null;
  employee_name?: string;
  check_in?: string | null;
  worked_seconds: number;
  expected_hours: number;
  status?: string | null;
}

export interface DepartmentAttendanceStats {
  department: string;
  total_employees: number;
  present: number;
  checked_in: number;
  late: number;
  overtime: number;
  absent: number;
  partial: number;
}

export interface AttendanceSummary {
  total_records: number;
  present_today: number;
  checked_in_now: number;
  late_today: number;
  overtime_today: number;
  partial_today: number;
  total_worked_hours: number;
  total_overtime_hours: number;
  department_breakdown: DepartmentAttendanceStats[];
}


export * from './timeOff';

export interface SalaryStructure {
  id: number;
  name: string;
  code: string;
  active: boolean;
  rule_count?: number;
  employee_count?: number;
  rules?: SalaryRule[];
}

export interface SalaryRule {
  id: number;
  structure_id: number;
  structure_name?: string;
  name: string;
  code: string;
  category: 'Basic' | 'Allowance' | 'Gross' | 'Deduction' | 'Net';
  sequence: number;
  computation_type: 'fixed' | 'percentage' | 'formula';
  fixed_amount: number;
  percentage_base_code?: string;
  percentage_rate: number;
  formula_expression?: string;
  active: boolean;
}

export type PayrunStatus = 
  | 'draft' 
  | 'ready' 
  | 'processing' 
  | 'review' 
  | 'finalized' 
  | 'failed' 
  | 'cancelled'
  | 'computed' 
  | 'validated' 
  | 'paid';

export type PayrunEmployeeStatus = 
  | 'pending' 
  | 'processing' 
  | 'success' 
  | 'failed' 
  | 'skipped' 
  | 'excluded';

export interface PayrunEmployee {
  id: number;
  payrun_id: number;
  employee_id: number;
  employee_code?: string;
  employee_name?: string;
  employee_email?: string;
  department?: string;
  job_position?: string;
  employee_type?: string;
  contract_id?: number;
  contract_code?: string;
  salary_structure_name?: string;
  status: PayrunEmployeeStatus;
  excluded: boolean;
  exclusion_reason?: string;
  worked_days: number;
  unpaid_leave_days: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  employer_contribution_total: number;
  employer_cost: number;
  error_code?: string;
  error_message?: string;
  calculation_trace?: any[];
  components?: any[];
  warnings?: string[];
  payslip_id?: number;
  processed_at?: string;
  created_at?: string;
}

export interface Payrun {
  id: number;
  name: string;
  company: string;
  salary_structure_id?: number;
  salary_structure_name?: string;
  period_start: string;
  period_end: string;
  employee_type: string;
  status: PayrunStatus;
  total_employees: number;
  successful_employees: number;
  failed_employees: number;
  skipped_employees: number;
  excluded_employees: number;
  employee_count: number;
  warning_count: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_net_paid: number;
  total_employer_contributions: number;
  total_employer_cost: number;
  created_by_id?: number;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
  processed_at?: string;
  finalized_at?: string;
  employees?: PayrunEmployee[];
  warnings?: PayrollWarning[];
  payslips?: Payslip[];
}

export interface EligibleEmployeeItem {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  work_email?: string;
  department: string;
  job_position: string;
  employee_type: string;
  working_schedule_name?: string;
  bank_account_no?: string;
  pan_no?: string;
  is_eligible: boolean;
  reason?: string;
  contract?: {
    id: number;
    code: string;
    name: string;
    wage_per_month: number;
    start_date?: string;
    end_date?: string;
  };
  salary_structure?: {
    id: number;
    name: string;
    code: string;
  };
}

export interface PayrunEligibilityResponse {
  company: string;
  period_start: string;
  period_end: string;
  total_employees: number;
  eligible_count: number;
  ineligible_count: number;
  eligible_employees: EligibleEmployeeItem[];
  ineligible_employees: EligibleEmployeeItem[];
}

export interface PayrunValidationItem {
  employee_id: number;
  employee_code: string;
  employee_name: string;
  department: string;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PayrunValidationResponse {
  payrun_id: number;
  status: string;
  total_selected: number;
  valid_count: number;
  warning_count: number;
  error_count: number;
  can_process: boolean;
  items: PayrunValidationItem[];
}

export interface PayrunStatusResponse {
  payrun_id: number;
  status: PayrunStatus;
  total_employees: number;
  successful_employees: number;
  failed_employees: number;
  excluded_employees: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  processed_at?: string;
  finalized_at?: string;
}

export interface CalculationTraceItem {
  sequence: number;
  rule_id?: number;
  rule_code: string;
  rule_name: string;
  category: string;
  computation_type: string;
  status: string;
  condition_applied: boolean;
  inputs_used: Record<string, any>;
  formula_or_rate?: string | null;
  amount: number;
  appears_on_payslip?: boolean;
  employer_cost_flag?: boolean;
  note?: string | null;
}

export interface Payslip {
  id: number;
  payslip_number: string;
  payrun_id?: number;
  payrun_name?: string;
  employee_id: number;
  employee_name: string;
  employee_code?: string;
  department?: string;
  job_position?: string;
  contract_id: number;
  salary_structure_id: number;
  structure_name?: string;
  salary_structure_name?: string;
  company?: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'computed' | 'review' | 'confirmed' | 'validated' | 'finalized' | 'paid' | 'cancelled';
  worked_days: number;
  unpaid_leave_days: number;
  basic_salary: number;
  total_earnings?: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  total_employer_contributions?: number;
  total_employer_cost?: number;
  
  // Snapshots
  employee_snapshot?: Record<string, any>;
  contract_snapshot?: Record<string, any>;
  attendance_snapshot?: {
    scheduled_days?: number;
    worked_days?: number;
    absent_days?: number;
    overtime_hours?: number;
    total_worked_hours?: number;
  };
  time_off_snapshot?: {
    paid_leave_days?: number;
    unpaid_leave_days?: number;
  };
  calculation_trace?: CalculationTraceItem[];
  
  error_code?: string;
  error_message?: string;
  computed_at?: string;
  finalized_at?: string;
  pdf_path?: string;
  email_sent: boolean;
  email_sent_at?: string;
  created_at?: string;
  updated_at?: string;
  lines?: PayslipLine[];
  warnings?: PayrollWarning[];
}

export interface PayslipLine {
  id: number;
  payslip_id: number;
  rule_id?: number;
  rule_name: string;
  rule_code: string;
  category: string;
  sequence: number;
  amount: number;
  quantity?: number;
  rate?: number;
  base_amount?: number;
  total?: number;
  calculation_type?: string;
  calculation_expression?: string;
  is_employer_contribution?: boolean;
  created_at?: string;
}

export interface PayslipSummaryMetrics {
  total_payslips: number;
  draft_payslips: number;
  computed_payslips: number;
  validated_payslips: number;
  finalized_payslips: number;
  cancelled_payslips: number;
  total_gross: number;
  total_deductions: number;
  total_net: number;
  total_employer_cost: number;
}

export interface PayrollWarning {
  id: number;
  payrun_id: number;
  payslip_id?: number;
  employee_id?: number;
  employee_name?: string;
  warning_type: string;
  message: string;
  is_resolved: boolean;
}

