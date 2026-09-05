from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field


class PayrollCalculatePreviewRequest(BaseModel):
    employee_id: int = Field(..., description="ID of the employee to calculate payroll for")
    period_start: date = Field(..., description="Start date of the payroll period (e.g. 2026-09-01)")
    period_end: date = Field(..., description="End date of the payroll period (e.g. 2026-09-30)")
    contract_id: Optional[int] = Field(None, description="Optional specific contract ID override")
    custom_inputs: Optional[Dict[str, float]] = Field(
        None,
        description="Optional simulation inputs (e.g. custom worked_days, unpaid_leave_days, contract_wage)"
    )


class RuleExecutionTraceItem(BaseModel):
    sequence: int
    rule_id: Optional[int] = None
    rule_code: str
    rule_name: str
    category: str
    computation_type: str
    status: str = "calculated"  # "calculated", "skipped", "error"
    condition_applied: bool = True
    inputs_used: Dict[str, Any] = {}
    formula_or_rate: Optional[str] = None
    amount: float = 0.0
    appears_on_payslip: bool = True
    employer_cost_flag: bool = False
    note: Optional[str] = None


class SalaryComponentResult(BaseModel):
    sequence: int
    rule_id: Optional[int] = None
    rule_code: str
    rule_name: str
    category: str
    computation_type: str
    amount: float
    description: Optional[str] = None
    appears_on_payslip: bool = True
    employer_cost_flag: bool = False
    condition_applied: bool = True


class EmployeeSummary(BaseModel):
    id: int
    name: str
    employee_code: str
    work_email: Optional[str] = None
    department: str
    job_position: str
    company: Optional[str] = None


class ContractSummary(BaseModel):
    id: int
    contract_code: str
    name: str
    wage_per_month: float
    start_date: date
    end_date: Optional[date] = None
    status: str
    salary_structure_id: int


class StructureSummary(BaseModel):
    id: int
    name: str
    code: str
    pay_frequency: str
    active: bool


class AttendanceSummary(BaseModel):
    scheduled_days: int
    worked_days: float
    absent_days: float
    total_worked_hours: float
    overtime_hours: float
    late_minutes: int


class TimeOffSummary(BaseModel):
    paid_leave_days: float
    unpaid_leave_days: float
    total_leave_days: float
    leave_records_count: int


class PeriodSummary(BaseModel):
    start_date: date
    end_date: date
    days_in_period: int


class PayrollCalculatePreviewResponse(BaseModel):
    mode: str = "preview"
    status: str = "SUCCESS"  # SUCCESS, WARNING, FAILED
    employee: EmployeeSummary
    contract: ContractSummary
    structure: StructureSummary
    period: PeriodSummary
    attendance: AttendanceSummary
    time_off: TimeOffSummary
    
    # Financial breakdowns
    basic_salary: float
    allowance_total: float
    earning_total: float
    gross_salary: float
    total_deductions: float
    net_salary: float
    employer_contribution_total: float
    employer_cost: float
    
    # Granular output lines and audit trace
    components: List[SalaryComponentResult]
    calculation_trace: List[RuleExecutionTraceItem]
    warnings: List[str] = []
    context_used: Dict[str, Any] = {}
