from typing import Optional, List
from datetime import date, datetime
from pydantic import BaseModel, Field, field_validator


class ContractBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200, description="Readable contract title or description")
    employee_id: int = Field(..., description="ID of the associated employee")
    department: Optional[str] = Field(None, max_length=100)
    job_position: Optional[str] = Field(None, max_length=100)
    start_date: date = Field(..., description="Contract start date")
    end_date: Optional[date] = Field(None, description="Contract end date (null for open-ended)")
    wage_per_month: float = Field(..., ge=0, description="Monthly wage in INR, non-negative")
    status: Optional[str] = Field("draft", description="Contract lifecycle status: draft, running, expired, terminated")
    working_schedule_id: Optional[int] = Field(None, description="Assigned working schedule")
    salary_structure_id: int = Field(..., description="Assigned salary structure")
    notes: Optional[str] = Field(None, description="Additional contract notes/terms")

    @field_validator("wage_per_month")
    @classmethod
    def validate_wage(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Monthly wage cannot be negative.")
        return round(v, 2)

    @field_validator("end_date")
    @classmethod
    def validate_dates(cls, end_date: Optional[date], info) -> Optional[date]:
        start_date = info.data.get("start_date")
        if start_date and end_date and end_date < start_date:
            raise ValueError("End date cannot be before start date.")
        return end_date


class ContractCreate(ContractBase):
    contract_code: Optional[str] = Field(None, max_length=50, description="Optional custom contract identifier e.g. CNT-00001")


class ContractUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    employee_id: Optional[int] = None
    department: Optional[str] = None
    job_position: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    wage_per_month: Optional[float] = Field(None, ge=0)
    status: Optional[str] = None
    working_schedule_id: Optional[int] = None
    salary_structure_id: Optional[int] = None
    notes: Optional[str] = None

    @field_validator("wage_per_month")
    @classmethod
    def validate_wage(cls, v: Optional[float]) -> Optional[float]:
        if v is not None:
            if v < 0:
                raise ValueError("Monthly wage cannot be negative.")
            return round(v, 2)
        return v


class ContractStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status: running, expired, terminated, draft")


class ContractResponse(BaseModel):
    id: int
    contract_code: str
    name: str
    employee_id: int
    employee_name: str
    employee_code: Optional[str] = None
    department: Optional[str] = None
    job_position: Optional[str] = None
    start_date: date
    end_date: Optional[date] = None
    wage_per_month: float
    status: str
    working_schedule_id: Optional[int] = None
    working_schedule_name: Optional[str] = None
    salary_structure_id: int
    salary_structure_name: Optional[str] = None
    notes: Optional[str] = None
    payslips_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ContractDetailResponse(ContractResponse):
    pass


class ContractListResponse(BaseModel):
    items: List[ContractResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    running_count: int
    draft_count: int
    expired_count: int
    terminated_count: int


class ContractOptionEmployee(BaseModel):
    id: int
    name: str
    employee_code: str
    department: str
    job_position: str
    working_schedule_id: Optional[int] = None


class ContractOptionStructure(BaseModel):
    id: int
    name: str
    code: str


class ContractOptionSchedule(BaseModel):
    id: int
    name: str
    hours_per_week: float


class ContractOptionsResponse(BaseModel):
    employees: List[ContractOptionEmployee]
    salary_structures: List[ContractOptionStructure]
    working_schedules: List[ContractOptionSchedule]
    departments: List[str]
    job_positions: List[str]


class ApplicableContractResponse(BaseModel):
    has_applicable_contract: bool
    contract: Optional[ContractResponse] = None
    warning_type: Optional[str] = None  # NO_CONTRACT, MULTIPLE_CONTRACTS
    message: Optional[str] = None
