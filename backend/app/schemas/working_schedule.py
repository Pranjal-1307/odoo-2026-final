from typing import Optional, List
from datetime import datetime, time
from pydantic import BaseModel, Field, field_validator


class WorkingScheduleDayBase(BaseModel):
    day_of_week: str = Field(..., description="Day of week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday")
    start_time: str = Field(..., description="Start time in HH:MM format, e.g., '09:00'")
    end_time: str = Field(..., description="End time in HH:MM format, e.g., '18:00'")
    break_hours: float = Field(1.0, ge=0.0, description="Break duration in hours, e.g., 1.0 for 1 hour")
    daily_hours: Optional[float] = Field(None, ge=0.0, description="Computed daily worked hours")

    @field_validator("day_of_week")
    @classmethod
    def validate_day(cls, v: str) -> str:
        valid_days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        capitalized = v.capitalize()
        for day in valid_days:
            if day.lower() == v.lower():
                return day
        raise ValueError(f"Invalid day_of_week: {v}. Must be one of {valid_days}")

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format(cls, v: str) -> str:
        # Check if v is valid HH:MM format
        parts = v.split(":")
        if len(parts) < 2:
            raise ValueError("Time must be in HH:MM format")
        try:
            h = int(parts[0])
            m = int(parts[1])
            if not (0 <= h <= 23 and 0 <= m <= 59):
                raise ValueError("Hours must be 0-23 and minutes 0-59")
            return f"{h:02d}:{m:02d}"
        except Exception:
            raise ValueError("Time must be in valid HH:MM format")


class WorkingScheduleDayCreate(WorkingScheduleDayBase):
    pass


class WorkingScheduleDayResponse(WorkingScheduleDayBase):
    id: Optional[int] = None
    schedule_id: Optional[int] = None

    class Config:
        from_attributes = True


class WorkingScheduleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Schedule name, e.g., '40 Hours / Week'")
    company: Optional[str] = Field("PeoplePay360 Inc.", max_length=100)
    timezone: Optional[str] = Field("Asia/Kolkata", max_length=50)
    status: Optional[str] = Field("active", description="active or inactive")

    @field_validator("timezone")
    @classmethod
    def validate_tz(cls, v: Optional[str]) -> str:
        if not v:
            return "Asia/Kolkata"
        # Common valid timezones check
        valid_prefixes = ["Asia/", "America/", "Europe/", "Africa/", "Australia/", "Pacific/", "UTC", "GMT"]
        if not any(v.startswith(p) for p in valid_prefixes) and v not in ["UTC", "GMT"]:
            raise ValueError(f"Invalid timezone: '{v}'. Please provide a valid timezone like 'Asia/Kolkata' or 'UTC'.")
        return v


class WorkingScheduleCreate(WorkingScheduleBase):
    days: List[WorkingScheduleDayCreate] = Field(..., min_length=1, description="List of working day definitions")


class WorkingScheduleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    company: Optional[str] = None
    timezone: Optional[str] = None
    status: Optional[str] = None
    days: Optional[List[WorkingScheduleDayCreate]] = None


class WorkingScheduleResponse(WorkingScheduleBase):
    id: int
    days_per_week: int
    hours_per_week: float
    days: List[WorkingScheduleDayResponse] = []
    employee_count: Optional[int] = 0
    contract_count: Optional[int] = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class WorkingScheduleListResponse(BaseModel):
    items: List[WorkingScheduleResponse]
    total: int
    page: int
    size: int
    pages: int


class ScheduleCalculationRequest(BaseModel):
    days: List[WorkingScheduleDayCreate]


class ScheduleCalculationResponse(BaseModel):
    days_per_week: int
    hours_per_week: float
    calculated_days: List[WorkingScheduleDayBase]
