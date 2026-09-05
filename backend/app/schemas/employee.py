from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict

class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200, description="Full name of employee")
    work_email: str = Field(..., description="Official work email address")
    phone: Optional[str] = Field(None, max_length=50, description="Contact phone number")
    department: str = Field(..., min_length=1, max_length=100, description="Department name")
    job_position: str = Field(..., min_length=1, max_length=100, description="Job title / position")
    manager_id: Optional[int] = Field(None, description="ID of manager (employee)")
    working_schedule_id: Optional[int] = Field(None, description="Assigned working schedule ID")
    company: Optional[str] = Field("PeoplePay360 Inc.", max_length=100)
    work_location: Optional[str] = Field("Headquarters", max_length=100)
    employee_type: Optional[str] = Field("Full-Time", max_length=50)
    status: Optional[str] = Field("active", max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=500)
    
    # Financial & Statutory Details
    bank_name: Optional[str] = Field(None, max_length=100)
    bank_account_no: Optional[str] = Field(None, max_length=100)
    ifsc_code: Optional[str] = Field(None, max_length=50)
    pan_no: Optional[str] = Field(None, max_length=50)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Employee name cannot be empty or only whitespace")
        return v.strip()

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: Optional[str]) -> str:
        allowed = {"active", "inactive", "on_leave", "terminated"}
        if v and v.lower() not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v.lower() if v else "active"

class EmployeeCreate(EmployeeBase):
    employee_code: Optional[str] = Field(None, max_length=50, description="Optional custom employee code; auto-generated if omitted")

    @field_validator("work_email")
    @classmethod
    def email_must_have_at(cls, v: str) -> str:
        if not v or "@" not in v:
            raise ValueError("Valid email address is required")
        return v.strip().lower()

class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    work_email: Optional[str] = None

    phone: Optional[str] = Field(None, max_length=50)
    department: Optional[str] = Field(None, min_length=1, max_length=100)
    job_position: Optional[str] = Field(None, min_length=1, max_length=100)
    manager_id: Optional[int] = None
    working_schedule_id: Optional[int] = None
    company: Optional[str] = Field(None, max_length=100)
    work_location: Optional[str] = Field(None, max_length=100)
    employee_type: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    avatar_url: Optional[str] = Field(None, max_length=500)
    bank_name: Optional[str] = Field(None, max_length=100)
    bank_account_no: Optional[str] = Field(None, max_length=100)
    ifsc_code: Optional[str] = Field(None, max_length=50)
    pan_no: Optional[str] = Field(None, max_length=50)

    @field_validator("name")
    @classmethod
    def name_must_not_be_blank(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and not v.strip():
            raise ValueError("Employee name cannot be blank")
        return v.strip() if v else v

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            allowed = {"active", "inactive", "on_leave", "terminated"}
            if v.lower() not in allowed:
                raise ValueError(f"Status must be one of: {', '.join(allowed)}")
            return v.lower()
        return v

class EmployeeStatusUpdate(BaseModel):
    status: str = Field(..., description="Target status: 'active' or 'inactive'")

    @field_validator("status")
    @classmethod
    def status_must_be_valid(cls, v: str) -> str:
        allowed = {"active", "inactive", "on_leave", "terminated"}
        if v.lower() not in allowed:
            raise ValueError(f"Status must be one of: {', '.join(allowed)}")
        return v.lower()

class EmployeeResponse(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    work_email: str
    manager_name: Optional[str] = None
    working_schedule_name: Optional[str] = None
    user_id: Optional[int] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


class EmployeeDetailResponse(EmployeeResponse):
    # Smart button live counts
    contracts_count: int = 0
    attendance_count: int = 0
    time_off_count: int = 0
    allocations_count: int = 0
    payslips_count: int = 0

class EmployeeOption(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    employee_code: Optional[str] = None
    department: Optional[str] = None
    job_position: Optional[str] = None

class EmployeeOptionsResponse(BaseModel):
    managers: List[EmployeeOption]
    departments: List[str]
    job_positions: List[str]
    companies: List[str]
    working_schedules: List[dict]

class EmployeeListResponse(BaseModel):
    total: int
    active_count: int = 0
    inactive_count: int = 0
    items: List[EmployeeResponse]
