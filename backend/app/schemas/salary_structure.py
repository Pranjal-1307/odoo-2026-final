from typing import Optional, List, Dict, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator
from app.schemas.salary_rule import SalaryRuleBase, SalaryRuleResponse, SalaryRuleCreate


class SalaryStructureBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Salary structure name e.g. Standard Monthly Salary")
    code: str = Field(..., min_length=1, max_length=50, description="Unique structure code e.g. STANDARD_MONTHLY")
    company: str = Field("PeoplePay360 Inc.", max_length=100, description="Company name")
    pay_frequency: str = Field("monthly", description="Pay frequency: monthly, weekly, bi-weekly, semi-monthly")
    description: Optional[str] = Field(None, description="Description or applicability notes")
    effective_from: Optional[date] = Field(None, description="Effective start date")
    effective_to: Optional[date] = Field(None, description="Effective end date")
    active: bool = Field(True, description="Active status")

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("Structure code cannot be empty.")
        if not clean.replace("_", "").isalnum():
            raise ValueError("Structure code must contain only alphanumeric characters and underscores.")
        return clean

    @field_validator("pay_frequency")
    @classmethod
    def validate_frequency(cls, v: str) -> str:
        valid = {"monthly", "weekly", "bi-weekly", "semi-monthly"}
        cleaned = v.strip().lower()
        if cleaned not in valid:
            raise ValueError(f"Pay frequency '{v}' is invalid. Supported options: {', '.join(valid)}")
        return cleaned

    @field_validator("effective_to")
    @classmethod
    def validate_dates(cls, effective_to: Optional[date], info) -> Optional[date]:
        effective_from = info.data.get("effective_from")
        if effective_from and effective_to and effective_to < effective_from:
            raise ValueError("Effective To date cannot be earlier than Effective From date.")
        return effective_to


class SalaryStructureCreate(SalaryStructureBase):
    rules: Optional[List[SalaryRuleCreate]] = Field(None, description="Optional list of initial salary rules to create with structure")


class SalaryStructureUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    company: Optional[str] = None
    pay_frequency: Optional[str] = None
    description: Optional[str] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    active: Optional[bool] = None

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().upper()
            if not clean.replace("_", "").isalnum():
                raise ValueError("Structure code must contain only alphanumeric characters and underscores.")
            return clean
        return v

    @field_validator("pay_frequency")
    @classmethod
    def validate_frequency(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            valid = {"monthly", "weekly", "bi-weekly", "semi-monthly"}
            cleaned = v.strip().lower()
            if cleaned not in valid:
                raise ValueError(f"Pay frequency '{v}' is invalid. Supported options: {', '.join(valid)}")
            return cleaned
        return v


class SalaryStructureStatusUpdate(BaseModel):
    active: bool = Field(..., description="Target active status")


class SalaryStructureResponse(BaseModel):
    id: int
    name: str
    code: str
    company: str
    pay_frequency: str
    description: Optional[str] = None
    effective_from: Optional[date] = None
    effective_to: Optional[date] = None
    active: bool
    rules_count: int = 0
    contracts_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SalaryStructureDetailResponse(SalaryStructureResponse):
    rules: List[SalaryRuleResponse] = []


class SalaryStructureListResponse(BaseModel):
    items: List[SalaryStructureResponse]
    total: int
    page: int
    limit: int


# ==========================================
# Salary Preview & Live Engine Models
# ==========================================
class SalaryPreviewRequest(BaseModel):
    contract_wage: float = Field(..., ge=0, description="Monthly base contract wage (e.g. 50000)")
    days_in_period: int = Field(30, ge=1, le=31, description="Total days in the payroll period")
    worked_days: float = Field(30.0, ge=0, le=31, description="Number of days worked")
    paid_leave_days: float = Field(0.0, ge=0, le=31, description="Approved paid leave days")
    unpaid_leave_days: float = Field(0.0, ge=0, le=31, description="Approved unpaid leave days")
    employee_id: Optional[int] = Field(None, description="Optional employee ID to pull real attendance/time off context")


class SalaryComponentPreview(BaseModel):
    sequence: int
    rule_id: Optional[int] = None
    rule_code: str
    rule_name: str
    category: str  # Basic, Allowance, Gross, Deduction, Employer Contribution, Net
    computation_type: str
    amount: float
    description: Optional[str] = None
    appears_on_payslip: bool = True
    employer_cost_flag: bool = False
    condition_applied: bool = True


class SalaryPreviewResponse(BaseModel):
    structure_id: Optional[int] = None
    structure_name: Optional[str] = None
    structure_code: Optional[str] = None
    contract_wage: float
    basic_salary: float
    gross_earnings: float
    total_deductions: float
    net_salary: float
    employer_cost: float
    components: List[SalaryComponentPreview]
    warnings: List[str] = []
    context_used: Dict[str, Any] = {}


class LiveComputationRuleInput(SalaryRuleBase):
    id: Optional[int] = None


class LiveComputationRequest(BaseModel):
    contract_wage: float = Field(..., ge=0)
    days_in_period: int = Field(30, ge=1, le=31)
    worked_days: float = Field(30.0, ge=0, le=31)
    paid_leave_days: float = Field(0.0, ge=0, le=31)
    unpaid_leave_days: float = Field(0.0, ge=0, le=31)
    rules: List[LiveComputationRuleInput] = []
