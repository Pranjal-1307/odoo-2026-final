from datetime import datetime, date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


# ----------------------------------------------------
# Payrun Employee Schemas
# ----------------------------------------------------
class PayrunEmployeeBase(BaseModel):
    employee_id: int
    contract_id: Optional[int] = None
    status: str = "pending"
    excluded: bool = False
    exclusion_reason: Optional[str] = None


class PayrunEmployeeResponse(BaseModel):
    id: int
    payrun_id: int
    employee_id: int
    employee_code: Optional[str] = None
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    department: Optional[str] = None
    job_position: Optional[str] = None
    employee_type: Optional[str] = None
    contract_id: Optional[int] = None
    contract_code: Optional[str] = None
    salary_structure_name: Optional[str] = None
    status: str
    excluded: bool
    exclusion_reason: Optional[str] = None
    worked_days: float = 0.0
    unpaid_leave_days: float = 0.0
    gross_salary: float = 0.0
    total_deductions: float = 0.0
    net_salary: float = 0.0
    employer_contribution_total: float = 0.0
    employer_cost: float = 0.0
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    calculation_trace: Optional[List[Dict[str, Any]]] = None
    components: Optional[List[Dict[str, Any]]] = None
    warnings: Optional[List[str]] = None
    payslip_id: Optional[int] = None
    processed_at: Optional[datetime] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PayrunEmployeeSelectionUpdate(BaseModel):
    employee_ids: List[int]
    exclusion_reasons: Optional[Dict[int, str]] = None


# ----------------------------------------------------
# Payrun Core Schemas
# ----------------------------------------------------
class PayrunCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    company: str = "PeoplePay360 Inc."
    period_start: date
    period_end: date
    employee_type: str = "All"
    salary_structure_id: Optional[int] = None
    selected_employee_ids: Optional[List[int]] = None


class PayrunUpdate(BaseModel):
    name: Optional[str] = None
    period_start: Optional[date] = None
    period_end: Optional[date] = None
    employee_type: Optional[str] = None


class PayrunResponse(BaseModel):
    id: int
    name: str
    company: str
    salary_structure_id: Optional[int] = None
    salary_structure_name: Optional[str] = None
    period_start: date
    period_end: date
    employee_type: str
    status: str
    total_employees: int = 0
    successful_employees: int = 0
    failed_employees: int = 0
    skipped_employees: int = 0
    excluded_employees: int = 0
    employee_count: int = 0
    warning_count: int = 0
    total_gross: float = 0.0
    total_deductions: float = 0.0
    total_net: float = 0.0
    total_net_paid: float = 0.0
    total_employer_contributions: float = 0.0
    total_employer_cost: float = 0.0
    created_by_id: Optional[int] = None
    created_by_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    processed_at: Optional[datetime] = None
    finalized_at: Optional[datetime] = None
    employees: Optional[List[PayrunEmployeeResponse]] = None

    class Config:
        from_attributes = True


class PayrunListResponse(BaseModel):
    items: List[PayrunResponse]
    total: int


# ----------------------------------------------------
# Eligibility & Validation Schemas
# ----------------------------------------------------
class EligibleEmployeeItem(BaseModel):
    employee_id: int
    employee_code: str
    employee_name: str
    work_email: Optional[str] = None
    department: str
    job_position: str
    employee_type: str
    working_schedule_name: Optional[str] = None
    bank_account_no: Optional[str] = None
    pan_no: Optional[str] = None
    is_eligible: bool
    reason: Optional[str] = None
    contract: Optional[Dict[str, Any]] = None
    salary_structure: Optional[Dict[str, Any]] = None


class PayrunEligibilityResponse(BaseModel):
    company: str
    period_start: str
    period_end: str
    total_employees: int
    eligible_count: int
    ineligible_count: int
    eligible_employees: List[EligibleEmployeeItem]
    ineligible_employees: List[EligibleEmployeeItem]


class PayrunValidationItem(BaseModel):
    employee_id: int
    employee_code: str
    employee_name: str
    department: str
    is_valid: bool
    errors: List[str]
    warnings: List[str]


class PayrunValidationResponse(BaseModel):
    payrun_id: int
    status: str
    total_selected: int
    valid_count: int
    warning_count: int
    error_count: int
    can_process: bool
    items: List[PayrunValidationItem]


class PayrunStatusResponse(BaseModel):
    payrun_id: int
    status: str
    total_employees: int
    successful_employees: int
    failed_employees: int
    excluded_employees: int
    total_gross: float
    total_deductions: float
    total_net: float
    processed_at: Optional[datetime] = None
    finalized_at: Optional[datetime] = None
