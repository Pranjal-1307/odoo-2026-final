import datetime as dt
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AttendanceBase(BaseModel):
    employee_id: int
    date: Optional[dt.date] = None
    check_in: Optional[dt.datetime] = None
    check_out: Optional[dt.datetime] = None
    notes: Optional[str] = None


class AttendanceCreate(BaseModel):
    employee_id: int
    date: Optional[dt.date] = None
    check_in: Optional[dt.datetime] = None
    check_out: Optional[dt.datetime] = None
    notes: Optional[str] = None


class AttendanceUpdate(BaseModel):
    date: Optional[dt.date] = None
    check_in: Optional[dt.datetime] = None
    check_out: Optional[dt.datetime] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class CheckInRequest(BaseModel):
    employee_id: Optional[int] = None
    check_in: Optional[dt.datetime] = None
    notes: Optional[str] = None


class CheckOutRequest(BaseModel):
    employee_id: Optional[int] = None
    check_out: Optional[dt.datetime] = None
    notes: Optional[str] = None


class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    employee_code: Optional[str] = None
    department: Optional[str] = None
    manager_id: Optional[int] = None
    manager_name: Optional[str] = None
    date: dt.date
    check_in: Optional[dt.datetime] = None
    check_out: Optional[dt.datetime] = None
    worked_hours: float = 0.0
    expected_hours: float = 8.0
    overtime_hours: float = 0.0
    late_minutes: int = 0
    status: str
    is_manual_edit: bool = False
    notes: Optional[str] = None
    created_at: Optional[dt.datetime] = None
    updated_at: Optional[dt.datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AttendanceDetailResponse(AttendanceResponse):
    pass


class AttendanceListResponse(BaseModel):
    items: List[AttendanceResponse]
    total: int
    page: int
    limit: int
    total_pages: int


class AttendanceCurrentStatusResponse(BaseModel):
    is_checked_in: bool
    attendance_id: Optional[int] = None
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    check_in: Optional[dt.datetime] = None
    worked_seconds: int = 0
    expected_hours: float = 8.0
    status: Optional[str] = None


class DepartmentAttendanceStats(BaseModel):
    department: str
    total_employees: int
    present: int
    checked_in: int
    late: int
    overtime: int
    absent: int
    partial: int


class AttendanceSummaryResponse(BaseModel):
    total_records: int
    present_today: int
    checked_in_now: int
    late_today: int
    overtime_today: int
    partial_today: int
    total_worked_hours: float
    total_overtime_hours: float
    department_breakdown: List[DepartmentAttendanceStats]
