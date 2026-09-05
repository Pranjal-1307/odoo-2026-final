from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date

# --- Employee KPI Schemas ---
class EmployeeKpiSummary(BaseModel):
    total: int = 0
    active: int = 0
    on_leave: int = 0
    inactive: int = 0
    new_this_month: int = 0
    department_counts: Dict[str, int] = Field(default_factory=dict)

# --- Contract KPI Schemas ---
class ContractKpiSummary(BaseModel):
    total: int = 0
    active: int = 0
    expiring_soon: int = 0  # expiring within 30 days
    draft: int = 0
    expired: int = 0

# --- Payrun Processing Schemas ---
class PayrunSummary(BaseModel):
    id: Optional[int] = None
    name: Optional[str] = None
    period: Optional[str] = None
    status: Optional[str] = None
    total_employees: int = 0
    processed: int = 0
    successful: int = 0
    pending: int = 0
    failed: int = 0
    skipped: int = 0
    excluded: int = 0
    progress_percentage: float = 0.0

# --- Financial Summary Schemas ---
class PayrollFinancialSummary(BaseModel):
    gross_payroll: float = 0.0
    total_deductions: float = 0.0
    net_payroll: float = 0.0
    employer_contributions: float = 0.0
    total_payroll_cost: float = 0.0
    payslips_count: int = 0

# --- Historical Trend Schemas ---
class PayrollTrendItem(BaseModel):
    period: str  # e.g. "2026-09" or "Sep 2026"
    month_label: str  # e.g. "September 2026"
    gross: float = 0.0
    deductions: float = 0.0
    net: float = 0.0
    employer_cost: float = 0.0
    employee_count: int = 0

# --- Department Distribution Schemas ---
class DepartmentPayrollItem(BaseModel):
    department: str
    employee_count: int = 0
    gross_amount: float = 0.0
    net_amount: float = 0.0
    percentage_of_total: float = 0.0

# --- Actionable Alert Schemas ---
class PendingAlertItem(BaseModel):
    id: str
    type: str  # 'PAYROLL_FAILED', 'CONTRACT_EXPIRING', 'LEAVE_PENDING', 'MISSING_BANK_INFO', 'ATTENDANCE_ANOMALY'
    priority: str  # 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    title: str
    description: str
    count: int = 1
    action_url: str
    action_label: str

# --- Recent Activity Schemas ---
class RecentActivityItem(BaseModel):
    id: str
    event_type: str  # 'PAYRUN_FINALIZED', 'PAYSLIP_GENERATED', 'EMPLOYEE_JOINED', 'CONTRACT_CREATED', 'LEAVE_APPROVED'
    title: str
    description: str
    timestamp: datetime
    actor_name: Optional[str] = None
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None

# --- Recent Payrun Mini Schema ---
class RecentPayrunItem(BaseModel):
    id: int
    name: str
    period: str
    status: str
    total_employees: int
    total_net: float
    warning_count: int = 0
    finalized_at: Optional[datetime] = None
    created_at: datetime

# --- Aggregated Full Dashboard Response ---
class DashboardResponse(BaseModel):
    period: str
    company: str
    user_role: str
    can_view_financials: bool = True
    available_periods: List[str] = Field(default_factory=list)
    employees: EmployeeKpiSummary
    contracts: ContractKpiSummary
    payrun: Optional[PayrunSummary] = None
    payroll: PayrollFinancialSummary
    payroll_trend: List[PayrollTrendItem] = Field(default_factory=list)
    department_distribution: List[DepartmentPayrollItem] = Field(default_factory=list)
    alerts: List[PendingAlertItem] = Field(default_factory=list)
    recent_payruns: List[RecentPayrunItem] = Field(default_factory=list)
    recent_activity: List[RecentActivityItem] = Field(default_factory=list)

# --- Employee Self-Service Dashboard Response ---
class EmployeePayslipItem(BaseModel):
    id: int
    payslip_number: str
    period_label: str
    period_start: date
    period_end: date
    gross_salary: float
    total_deductions: float
    net_salary: float
    status: str
    has_pdf: bool = False
    created_at: datetime

class EmployeeDashboardResponse(BaseModel):
    employee_id: int
    employee_code: str
    name: str
    work_email: str
    department: str
    job_position: str
    company: str
    status: str
    avatar_url: Optional[str] = None
    
    # Attendance summary
    attendance_rate: float = 0.0
    days_present: int = 0
    days_late: int = 0
    total_worked_hours: float = 0.0
    
    # Leave balance summary
    leave_allocations_total: float = 0.0
    leave_used: float = 0.0
    leave_remaining: float = 0.0
    pending_leave_requests: int = 0
    
    # Active contract
    contract_code: Optional[str] = None
    wage_per_month: Optional[float] = None
    contract_start_date: Optional[date] = None
    contract_end_date: Optional[date] = None
    
    # Recent payslips
    recent_payslips: List[EmployeePayslipItem] = Field(default_factory=list)
