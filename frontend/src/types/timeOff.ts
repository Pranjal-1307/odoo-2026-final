export type LeaveUnit = 'days' | 'hours';
export type LeaveRequestStatus = 'draft' | 'to_approve' | 'pending' | 'approved' | 'refused' | 'cancelled';
export type AllocationStatus = 'draft' | 'approved' | 'refused';
export type ApprovalType = 'no_approval' | 'manager' | 'hr' | 'both';
export type PayrollBehavior = 'paid' | 'unpaid' | 'not_applicable';

export interface TimeOffType {
  id: number;
  name: string;
  unit: LeaveUnit;
  requires_allocation: boolean;
  is_unpaid: boolean;
  approval_type: ApprovalType | string;
  payroll_behavior: PayrollBehavior | string;
  active: boolean;
  color: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimeOffTypeCreate {
  name: string;
  unit?: LeaveUnit;
  requires_allocation?: boolean;
  is_unpaid?: boolean;
  approval_type?: ApprovalType | string;
  payroll_behavior?: PayrollBehavior | string;
  active?: boolean;
  color?: string;
  notes?: string;
}

export interface TimeOffTypeUpdate {
  name?: string;
  unit?: LeaveUnit;
  requires_allocation?: boolean;
  is_unpaid?: boolean;
  approval_type?: ApprovalType | string;
  payroll_behavior?: PayrollBehavior | string;
  active?: boolean;
  color?: string;
  notes?: string;
}

export interface TimeOffAllocation {
  id: number;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  department?: string;
  time_off_type_id: number;
  time_off_type_name?: string;
  time_off_type_color?: string;
  unit?: string;
  allocated_amount: number;
  taken_amount: number;
  remaining_amount: number;
  status: AllocationStatus | string;
  approver_id?: number;
  approver_name?: string;
  validity_start?: string;
  validity_end?: string;
  notes?: string;
  approved_at?: string;
  refused_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TimeOffAllocationCreate {
  employee_id: number;
  time_off_type_id: number;
  allocated_amount: number;
  status?: string;
  approver_id?: number;
  validity_start?: string;
  validity_end?: string;
  notes?: string;
}

export interface TimeOffAllocationUpdate {
  allocated_amount?: number;
  status?: string;
  validity_start?: string;
  validity_end?: string;
  notes?: string;
}

export interface TimeOffAllocationUsage {
  id: number;
  allocation_id: number;
  amount_used: number;
  created_at?: string;
}

export interface TimeOffRequest {
  id: number;
  employee_id: number;
  employee_name?: string;
  employee_code?: string;
  department?: string;
  time_off_type_id: number;
  time_off_type_name?: string;
  time_off_type_color?: string;
  unit?: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  duration: number;
  status: LeaveRequestStatus | string;
  reason?: string;
  approval_reason?: string;
  refusal_reason?: string;
  approver_id?: number;
  approver_name?: string;
  allocation_id?: number;
  allocation_used?: number;
  approved_at?: string;
  refused_at?: string;
  cancelled_at?: string;
  created_at?: string;
  updated_at?: string;
  usages?: TimeOffAllocationUsage[];
}

export interface TimeOffRequestCreate {
  employee_id: number;
  time_off_type_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export interface TimeOffRequestUpdate {
  time_off_type_id?: number;
  start_date?: string;
  end_date?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
}

export interface DurationCalculateRequest {
  employee_id: number;
  time_off_type_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
}

export interface DurationCalculateResponse {
  duration: number;
  unit: string;
  working_days_counted: number;
  calendar_days: number;
  available_balance?: number;
  has_sufficient_balance: boolean;
  warning?: string;
}

export interface LeaveBalanceItem {
  type_id: number;
  type_name: string;
  unit: string;
  color: string;
  requires_allocation: boolean;
  is_unpaid: boolean;
  allocated: number;
  taken: number;
  remaining: number;
}

export interface EmployeeLeaveBalancesResponse {
  employee_id: number;
  employee_name: string;
  balances: LeaveBalanceItem[];
}

export interface TimeOffOverview {
  pending_requests_count: number;
  approved_requests_count: number;
  refused_requests_count: number;
  total_allocations_count: number;
  upcoming_leaves_count: number;
  my_remaining_days: number;
}
