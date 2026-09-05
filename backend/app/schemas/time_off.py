import datetime as dt
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


# ==========================================
# 1. Time Off Type Schemas
# ==========================================
class TimeOffTypeBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    unit: str = Field(default="days")  # "days" or "hours"
    requires_allocation: bool = True
    is_unpaid: bool = False
    approval_type: str = Field(default="hr")  # "no_approval", "manager", "hr", "both"
    payroll_behavior: str = Field(default="paid")  # "paid", "unpaid", "not_applicable"
    active: bool = True
    color: str = Field(default="#017E84")
    notes: Optional[str] = None


class TimeOffTypeCreate(TimeOffTypeBase):
    pass


class TimeOffTypeUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    requires_allocation: Optional[bool] = None
    is_unpaid: Optional[bool] = None
    approval_type: Optional[str] = None
    payroll_behavior: Optional[str] = None
    active: Optional[bool] = None
    color: Optional[str] = None
    notes: Optional[str] = None


class TimeOffTypeResponse(TimeOffTypeBase):
    id: int
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 2. Time Off Allocation Schemas
# ==========================================
class TimeOffAllocationBase(BaseModel):
    employee_id: int
    time_off_type_id: int
    allocated_amount: float = Field(..., gt=0)
    notes: Optional[str] = None
    validity_start: Optional[dt.date] = None
    validity_end: Optional[dt.date] = None


class TimeOffAllocationCreate(TimeOffAllocationBase):
    approver_id: Optional[int] = None
    status: Optional[str] = "approved"


class TimeOffAllocationUpdate(BaseModel):
    allocated_amount: Optional[float] = None
    notes: Optional[str] = None
    validity_start: Optional[dt.date] = None
    validity_end: Optional[dt.date] = None
    status: Optional[str] = None


class TimeOffAllocationResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    time_off_type_id: int
    time_off_type_name: Optional[str] = None
    time_off_type_color: Optional[str] = None
    unit: Optional[str] = "days"
    allocated_amount: float
    taken_amount: float
    remaining_amount: float
    status: str
    approver_id: Optional[int] = None
    approver_name: Optional[str] = None
    validity_start: Optional[dt.date] = None
    validity_end: Optional[dt.date] = None
    notes: Optional[str] = None
    approved_at: Optional[dt.datetime] = None
    refused_at: Optional[dt.datetime] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 3. Time Off Request Schemas
# ==========================================
class TimeOffRequestBase(BaseModel):
    employee_id: int
    time_off_type_id: int
    start_date: dt.date
    end_date: dt.date
    start_time: Optional[dt.time] = None
    end_time: Optional[dt.time] = None
    reason: Optional[str] = None


class TimeOffRequestCreate(TimeOffRequestBase):
    pass


class TimeOffRequestUpdate(BaseModel):
    time_off_type_id: Optional[int] = None
    start_date: Optional[dt.date] = None
    end_date: Optional[dt.date] = None
    start_time: Optional[dt.time] = None
    end_time: Optional[dt.time] = None
    reason: Optional[str] = None


class TimeOffRequestApprove(BaseModel):
    approval_reason: Optional[str] = None


class TimeOffRequestRefuse(BaseModel):
    refusal_reason: Optional[str] = None


class TimeOffAllocationUsageResponse(BaseModel):
    id: int
    allocation_id: int
    amount_used: float
    created_at: Optional[dt.datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TimeOffRequestResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    time_off_type_id: int
    time_off_type_name: Optional[str] = None
    time_off_type_color: Optional[str] = None
    unit: Optional[str] = "days"
    start_date: dt.date
    end_date: dt.date
    start_time: Optional[dt.time] = None
    end_time: Optional[dt.time] = None
    duration: float
    status: str
    reason: Optional[str] = None
    approval_reason: Optional[str] = None
    refusal_reason: Optional[str] = None
    approver_id: Optional[int] = None
    approver_name: Optional[str] = None
    allocation_id: Optional[int] = None
    allocation_used: Optional[float] = 0.0
    approved_at: Optional[dt.datetime] = None
    refused_at: Optional[dt.datetime] = None
    cancelled_at: Optional[dt.datetime] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None
    usages: List[TimeOffAllocationUsageResponse] = []

    model_config = ConfigDict(from_attributes=True)


# ==========================================
# 4. Calculation & Balance Schemas
# ==========================================
class DurationCalculateRequest(BaseModel):
    employee_id: int
    time_off_type_id: int
    start_date: dt.date
    end_date: dt.date
    start_time: Optional[dt.time] = None
    end_time: Optional[dt.time] = None


class DurationCalculateResponse(BaseModel):
    duration: float
    unit: str
    working_days_counted: int
    calendar_days: int
    available_balance: Optional[float] = None
    has_sufficient_balance: bool = True
    warning: Optional[str] = None


class LeaveBalanceItem(BaseModel):
    type_id: int
    type_name: str
    unit: str
    color: str
    requires_allocation: bool
    is_unpaid: bool
    allocated: float
    taken: float
    remaining: float


class EmployeeLeaveBalancesResponse(BaseModel):
    employee_id: int
    employee_name: str
    balances: List[LeaveBalanceItem]


class TimeOffOverviewResponse(BaseModel):
    pending_requests_count: int
    approved_requests_count: int
    refused_requests_count: int
    total_allocations_count: int
    upcoming_leaves_count: int
    my_remaining_days: float
