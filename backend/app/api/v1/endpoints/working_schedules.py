from typing import List, Optional, Tuple
from datetime import datetime, time
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.api.deps import get_db, get_current_active_user, require_roles
from app.models import WorkingSchedule, WorkingScheduleDay, Employee, Contract, User
from app.schemas.working_schedule import (
    WorkingScheduleBase,
    WorkingScheduleCreate,
    WorkingScheduleUpdate,
    WorkingScheduleResponse,
    WorkingScheduleListResponse,
    WorkingScheduleDayResponse,
    WorkingScheduleDayCreate,
    WorkingScheduleDayBase,
    ScheduleCalculationRequest,
    ScheduleCalculationResponse
)

router = APIRouter()

DAY_ORDER = {
    "Monday": 1,
    "Tuesday": 2,
    "Wednesday": 3,
    "Thursday": 4,
    "Friday": 5,
    "Saturday": 6,
    "Sunday": 7
}


def time_str_to_minutes(time_str: str) -> int:
    parts = time_str.split(":")
    return int(parts[0]) * 60 + int(parts[1])


def calculate_daily_hours(start_time_str: str, end_time_str: str, break_hours: float) -> float:
    """
    Calculates daily worked hours given start_time, end_time, and break_hours.
    Supports standard same-day shifts and overnight shifts (where end < start).
    """
    start_min = time_str_to_minutes(start_time_str)
    end_min = time_str_to_minutes(end_time_str)

    if end_min < start_min:
        # Overnight shift (crosses midnight)
        elapsed_min = (24 * 60 - start_min) + end_min
    else:
        elapsed_min = end_min - start_min

    break_min = break_hours * 60.0

    if break_hours < 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Break duration cannot be negative."
        )

    if break_min >= elapsed_min:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Break duration ({break_hours}h) must be less than total elapsed shift time ({round(elapsed_min/60.0, 2)}h)."
        )

    worked_min = elapsed_min - break_min
    if worked_min <= 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Daily worked hours must be greater than zero."
        )

    return round(worked_min / 60.0, 2)


def calculate_schedule_metrics(days_input: List[WorkingScheduleDayCreate]) -> Tuple[int, float, List[dict]]:
    """
    Validates days, checks for duplicates, computes daily and weekly hours.
    Returns (days_per_week, hours_per_week, processed_days_list).
    """
    seen_days = set()
    processed_days = []
    total_hours = 0.0

    # Sort days by standard weekday order
    sorted_input = sorted(days_input, key=lambda d: DAY_ORDER.get(d.day_of_week.capitalize(), 99))

    for day_item in sorted_input:
        normalized_day = day_item.day_of_week.capitalize()
        if normalized_day in seen_days:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Duplicate working day: '{normalized_day}' cannot be configured more than once in the same schedule."
            )
        seen_days.add(normalized_day)

        daily_hrs = calculate_daily_hours(day_item.start_time, day_item.end_time, day_item.break_hours)
        total_hours += daily_hrs

        # Convert start/end str to python time object
        s_parts = [int(p) for p in day_item.start_time.split(":")]
        e_parts = [int(p) for p in day_item.end_time.split(":")]
        start_t = time(hour=s_parts[0], minute=s_parts[1])
        end_t = time(hour=e_parts[0], minute=e_parts[1])

        processed_days.append({
            "day_of_week": normalized_day,
            "start_time": start_t,
            "end_time": end_t,
            "start_time_str": f"{s_parts[0]:02d}:{s_parts[1]:02d}",
            "end_time_str": f"{e_parts[0]:02d}:{e_parts[1]:02d}",
            "break_hours": day_item.break_hours,
            "daily_hours": daily_hrs
        })

    days_per_week = len(seen_days)
    hours_per_week = round(total_hours, 2)

    return days_per_week, hours_per_week, processed_days


def format_schedule_response(schedule: WorkingSchedule, db: Session) -> WorkingScheduleResponse:
    # Count contracts and employees referencing this schedule
    contract_count = db.query(Contract).filter(Contract.working_schedule_id == schedule.id).count()
    employee_count = db.query(Employee).filter(Employee.working_schedule_id == schedule.id).count()

    days_sorted = sorted(schedule.days, key=lambda d: DAY_ORDER.get(d.day_of_week, 99))
    days_response = []
    for d in days_sorted:
        s_str = d.start_time.strftime("%H:%M") if isinstance(d.start_time, time) else str(d.start_time)[:5]
        e_str = d.end_time.strftime("%H:%M") if isinstance(d.end_time, time) else str(d.end_time)[:5]
        days_response.append(
            WorkingScheduleDayResponse(
                id=d.id,
                schedule_id=d.schedule_id,
                day_of_week=d.day_of_week,
                start_time=s_str,
                end_time=e_str,
                break_hours=d.break_hours,
                daily_hours=d.daily_hours
            )
        )

    return WorkingScheduleResponse(
        id=schedule.id,
        name=schedule.name,
        company=schedule.company,
        timezone=schedule.timezone,
        days_per_week=schedule.days_per_week,
        hours_per_week=schedule.hours_per_week,
        status=schedule.status,
        days=days_response,
        employee_count=employee_count,
        contract_count=contract_count,
        created_at=schedule.created_at,
        updated_at=schedule.updated_at
    )


# ==============================================================================
# Helper endpoint: Live Calculation
# ==============================================================================
@router.post(
    "/calculate",
    response_model=ScheduleCalculationResponse,
    summary="Compute daily and weekly hours in real time for UI preview"
)
def calculate_schedule_preview(
    request: ScheduleCalculationRequest,
    current_user: User = Depends(get_current_active_user)
):
    """Real-time calculation helper for the frontend working schedule builder."""
    if not request.days:
        return ScheduleCalculationResponse(
            days_per_week=0,
            hours_per_week=0.0,
            calculated_days=[]
        )

    days_per_week, hours_per_week, processed = calculate_schedule_metrics(request.days)
    calculated_days = [
        WorkingScheduleDayBase(
            day_of_week=d["day_of_week"],
            start_time=d["start_time_str"],
            end_time=d["end_time_str"],
            break_hours=d["break_hours"],
            daily_hours=d["daily_hours"]
        )
        for d in processed
    ]

    return ScheduleCalculationResponse(
        days_per_week=days_per_week,
        hours_per_week=hours_per_week,
        calculated_days=calculated_days
    )


# ==============================================================================
# List Working Schedules
# ==============================================================================
@router.get(
    "",
    response_model=WorkingScheduleListResponse,
    summary="List all working schedules with search and filtering"
)
def list_working_schedules(
    search: Optional[str] = Query(None, description="Search by schedule name or company"),
    status: Optional[str] = Query(None, description="Filter by status: active, inactive, all"),
    company: Optional[str] = Query(None, description="Filter by company"),
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    sort_by: str = Query("name", description="Field to sort by"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(WorkingSchedule)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                WorkingSchedule.name.ilike(search_pattern),
                WorkingSchedule.company.ilike(search_pattern),
            )
        )

    if status and status.lower() != "all":
        query = query.filter(WorkingSchedule.status == status.lower())

    if company:
        query = query.filter(WorkingSchedule.company.ilike(f"%{company.strip()}%"))

    total = query.count()

    # Sorting
    sort_col = getattr(WorkingSchedule, sort_by, WorkingSchedule.name)
    if sort_order.lower() == "desc":
        query = query.order_by(sort_col.desc())
    else:
        query = query.order_by(sort_col.asc())

    offset = (page - 1) * size
    schedules = query.offset(offset).limit(size).all()

    items = [format_schedule_response(s, db) for s in schedules]
    pages = (total + size - 1) // size if total > 0 else 1

    return WorkingScheduleListResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages
    )


# ==============================================================================
# Get Single Working Schedule Detail
# ==============================================================================
@router.get(
    "/{schedule_id}",
    response_model=WorkingScheduleResponse,
    summary="Get single working schedule detail with all day lines"
)
def get_working_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    schedule = db.query(WorkingSchedule).filter(WorkingSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Working schedule with ID {schedule_id} not found."
        )
    return format_schedule_response(schedule, db)


# ==============================================================================
# Create Working Schedule
# ==============================================================================
@router.post(
    "",
    response_model=WorkingScheduleResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new working schedule (HR / Admin only)"
)
def create_working_schedule(
    payload: WorkingScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR Manager", "HR Payroll Manager", "Admin"))
):
    # Check if name is already taken
    existing = db.query(WorkingSchedule).filter(
        func.lower(WorkingSchedule.name) == payload.name.strip().lower()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A working schedule with the name '{payload.name}' already exists."
        )

    if payload.status == "active" and (not payload.days or len(payload.days) == 0):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="An active schedule must contain at least one configured working day."
        )

    days_per_week, hours_per_week, processed_days = calculate_schedule_metrics(payload.days)

    schedule = WorkingSchedule(
        name=payload.name.strip(),
        company=payload.company or "PeoplePay360 Inc.",
        timezone=payload.timezone or "Asia/Kolkata",
        days_per_week=days_per_week,
        hours_per_week=hours_per_week,
        status=payload.status or "active"
    )
    db.add(schedule)
    db.flush()

    for p in processed_days:
        day_line = WorkingScheduleDay(
            schedule_id=schedule.id,
            day_of_week=p["day_of_week"],
            start_time=p["start_time"],
            end_time=p["end_time"],
            break_hours=p["break_hours"],
            daily_hours=p["daily_hours"]
        )
        db.add(day_line)

    db.commit()
    db.refresh(schedule)

    return format_schedule_response(schedule, db)


# ==============================================================================
# Update Working Schedule
# ==============================================================================
@router.put(
    "/{schedule_id}",
    response_model=WorkingScheduleResponse,
    summary="Update working schedule and its day lines (HR / Admin only)"
)
def update_working_schedule(
    schedule_id: int,
    payload: WorkingScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR Manager", "HR Payroll Manager", "Admin"))
):
    schedule = db.query(WorkingSchedule).filter(WorkingSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Working schedule with ID {schedule_id} not found."
        )

    if payload.name and payload.name.strip().lower() != schedule.name.lower():
        existing = db.query(WorkingSchedule).filter(
            func.lower(WorkingSchedule.name) == payload.name.strip().lower(),
            WorkingSchedule.id != schedule_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another working schedule with the name '{payload.name}' already exists."
            )
        schedule.name = payload.name.strip()

    if payload.company is not None:
        schedule.company = payload.company
    if payload.timezone is not None:
        schedule.timezone = payload.timezone
    if payload.status is not None:
        schedule.status = payload.status

    if payload.days is not None:
        if schedule.status == "active" and len(payload.days) == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="An active schedule must contain at least one configured working day."
            )

        days_per_week, hours_per_week, processed_days = calculate_schedule_metrics(payload.days)
        schedule.days_per_week = days_per_week
        schedule.hours_per_week = hours_per_week

        # Remove old days and recreate
        db.query(WorkingScheduleDay).filter(WorkingScheduleDay.schedule_id == schedule.id).delete()
        for p in processed_days:
            day_line = WorkingScheduleDay(
                schedule_id=schedule.id,
                day_of_week=p["day_of_week"],
                start_time=p["start_time"],
                end_time=p["end_time"],
                break_hours=p["break_hours"],
                daily_hours=p["daily_hours"]
            )
            db.add(day_line)

    schedule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)

    return format_schedule_response(schedule, db)


# ==============================================================================
# Status Toggle (Activate / Deactivate)
# ==============================================================================
@router.patch(
    "/{schedule_id}/status",
    response_model=WorkingScheduleResponse,
    summary="Toggle working schedule active/inactive status"
)
def toggle_working_schedule_status(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("HR Manager", "HR Payroll Manager", "Admin"))
):
    schedule = db.query(WorkingSchedule).filter(WorkingSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Working schedule with ID {schedule_id} not found."
        )

    if schedule.status == "active":
        schedule.status = "inactive"
    else:
        # Validate before activation
        if not schedule.days or len(schedule.days) == 0:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Cannot activate schedule with zero working days."
            )
        schedule.status = "active"

    schedule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(schedule)

    return format_schedule_response(schedule, db)


# ==============================================================================
# Delete Working Schedule
# ==============================================================================
@router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_200_OK,
    summary="Delete working schedule (Blocked if referenced by contracts or employees)"
)
def delete_working_schedule(
    schedule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin"))
):
    schedule = db.query(WorkingSchedule).filter(WorkingSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Working schedule with ID {schedule_id} not found."
        )

    # Check contract references
    contract_count = db.query(Contract).filter(Contract.working_schedule_id == schedule_id).count()
    if contract_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete schedule '{schedule.name}' because it is linked to {contract_count} contract(s). Please deactivate the schedule instead to protect historical records."
        )

    # Check employee references
    employee_count = db.query(Employee).filter(Employee.working_schedule_id == schedule_id).count()
    if employee_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete schedule '{schedule.name}' because it is assigned to {employee_count} employee(s). Please reassign them first or deactivate the schedule."
        )

    db.delete(schedule)
    db.commit()

    return {"message": f"Working schedule '{schedule.name}' deleted successfully."}
