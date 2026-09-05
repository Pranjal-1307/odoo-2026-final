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
  role: UserRole;
  is_active: boolean;
  employee_id?: number;
  employee_name?: string;
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
}

export interface WorkingScheduleDay {
  id?: number;
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
  date: string;
  check_in?: string;
  check_out?: string;
  worked_hours: number;
  overtime_hours: number;
  status: 'present' | 'late' | 'absent' | 'incomplete' | 'on_leave';
  is_manual_edit: boolean;
  notes?: string;
}

export interface TimeOffType {
  id: number;
  name: string;
  unit: 'days' | 'hours';
  requires_allocation: boolean;
  is_unpaid: boolean;
  active: boolean;
  color: string;
}

export interface TimeOffAllocation {
  id: number;
  employee_id: number;
  employee_name: string;
  time_off_type_id: number;
  time_off_type_name: string;
  allocated_amount: number;
  taken_amount: number;
  remaining_amount: number;
  status: 'draft' | 'approved' | 'refused';
  approver_id?: number;
  approver_name?: string;
  validity_start?: string;
  validity_end?: string;
}

export interface TimeOffRequest {
  id: number;
  employee_id: number;
  employee_name: string;
  time_off_type_id: number;
  time_off_type_name: string;
  start_date: string;
  end_date: string;
  duration: number;
  status: 'draft' | 'to_approve' | 'approved' | 'refused' | 'cancelled';
  reason?: string;
  approver_id?: number;
  approver_name?: string;
  allocation_id?: number;
}

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

export interface Payrun {
  id: number;
  name: string;
  salary_structure_id: number;
  salary_structure_name: string;
  period_start: string;
  period_end: string;
  employee_type: string;
  status: 'draft' | 'computed' | 'validated' | 'paid';
  employee_count: number;
  warning_count: number;
  total_net_paid: number;
  warnings?: PayrollWarning[];
  payslips?: Payslip[];
}

export interface Payslip {
  id: number;
  payslip_number: string;
  payrun_id: number;
  payrun_name?: string;
  employee_id: number;
  employee_name: string;
  employee_code?: string;
  department?: string;
  job_position?: string;
  contract_id: number;
  salary_structure_id: number;
  salary_structure_name?: string;
  period_start: string;
  period_end: string;
  status: 'draft' | 'computed' | 'validated' | 'paid';
  worked_days: number;
  unpaid_leave_days: number;
  basic_salary: number;
  gross_salary: number;
  total_deductions: number;
  net_salary: number;
  pdf_path?: string;
  email_sent: boolean;
  email_sent_at?: string;
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
