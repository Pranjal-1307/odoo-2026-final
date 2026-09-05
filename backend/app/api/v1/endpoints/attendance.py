from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.api.deps import get_db, get_current_active_user, require_roles, validate_employee_ownership
from app.models import Attendance, Employee, User, UserRole
from app.core.permissions import normalize_role
from app.schemas.attendance import (
    AttendanceBase,
    AttendanceCreate,
    AttendanceUpdate,
    CheckInRequest,
    CheckOutRequest,
    AttendanceResponse,
    AttendanceDetailResponse,
    AttendanceListResponse,
    AttendanceCurrentStatusResponse,
    AttendanceSummaryResponse
)
from app.services.attendance_service import AttendanceService

router = APIRouter()


def build_attendance_response(record: Attendance) -> AttendanceResponse:
    """Helper to convert ORM Attendance record into AttendanceResponse with employee details."""
    emp = record.employee
    emp_name = emp.name if emp else "Unknown"
    emp_code = emp.employee_code if emp else None
    dept = emp.department if emp else None
    mgr_id = emp.manager_id if emp else None
    mgr_name = emp.manager.name if (emp and emp.manager) else None

    return AttendanceResponse(
        id=record.id,
        employee_id=record.employee_id,
        employee_name=emp_name,
        employee_code=emp_code,
        department=dept,
        manager_id=mgr_id,
        manager_name=mgr_name,
        date=record.date,
        check_in=record.check_in,
        check_out=record.check_out,
        worked_hours=record.worked_hours or 0.0,
        expected_hours=record.expected_hours or 8.0,
        overtime_hours=record.overtime_hours or 0.0,
        late_minutes=record.late_minutes or 0,
        status=record.status,
        is_manual_edit=record.is_manual_edit or False,
        notes=record.notes,
        created_at=record.created_at,
        updated_at=record.updated_at
    )


@router.get("", response_model=AttendanceListResponse)
def list_attendances(
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    department: Optional[str] = Query(None, description="Filter by department"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by attendance status"),
    date_from: Optional[date] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[date] = Query(None, description="End date (YYYY-MM-DD)"),
    search: Optional[str] = Query(None, description="Search employee name, code, notes"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(25, ge=1, le=200, description="Items per page"),
    sort_by: str = Query("date", description="Field to sort by (date, check_in, worked_hours)"),
    sort_order: str = Query("desc", description="Sort order (asc, desc)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    List attendance records with filtering, searching, pagination, and RBAC visibility.
    Employees are restricted to viewing only their own attendance history.
    """
    user_role = normalize_role(current_user.role)
    
    query = db.query(Attendance).join(Employee, Attendance.employee_id == Employee.id)

    # RBAC: Regular employee can only see their own attendance
    if user_role == "Employee":
        if not current_user.employee_id:
            return AttendanceListResponse(items=[], total=0, page=page, limit=limit, total_pages=0)
        query = query.filter(Attendance.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(Attendance.employee_id == employee_id)

    if department:
        query = query.filter(Employee.department == department)

    if status_filter:
        query = query.filter(Attendance.status == status_filter)

    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Employee.name.ilike(search_pattern),
                Employee.employee_code.ilike(search_pattern),
                Attendance.notes.ilike(search_pattern)
            )
        )

    # Sorting
    sort_col = getattr(Attendance, sort_by, Attendance.date)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col), asc(Attendance.id))
    else:
        query = query.order_by(desc(sort_col), desc(Attendance.id))

    total = query.count()
    offset = (page - 1) * limit
    records = query.offset(offset).limit(limit).all()
    total_pages = (total + limit - 1) // limit if total > 0 else 1

    return AttendanceListResponse(
        items=[build_attendance_response(r) for r in records],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get("/current", response_model=AttendanceCurrentStatusResponse)
@router.get("/my-status", response_model=AttendanceCurrentStatusResponse)
def get_my_attendance_status(
    employee_id: Optional[int] = Query(None, description="Optional employee ID for managers"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get the active check-in status and live elapsed time for the current user's employee.
    """
    target_emp_id = current_user.employee_id
    user_role = normalize_role(current_user.role)

    # Managers can inspect a specific employee's status
    if employee_id and user_role in {"Admin", "HR Manager", "HR Payroll Manager", "HR Payroll User"}:
        target_emp_id = employee_id

    if not target_emp_id:
        return AttendanceCurrentStatusResponse(
            is_checked_in=False,
            attendance_id=None,
            employee_id=None,
            employee_name="Unlinked User",
            check_in=None,
            worked_seconds=0,
            expected_hours=8.0,
            status=None
        )

    status_data = AttendanceService.get_current_status(db, target_emp_id)
    return AttendanceCurrentStatusResponse(**status_data)


@router.get("/summary", response_model=AttendanceSummaryResponse)
def get_attendance_summary(
    date_from: Optional[date] = Query(None, description="Start date"),
    date_to: Optional[date] = Query(None, description="End date"),
    department: Optional[str] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get live attendance KPI metrics (present, checked-in, late, overtime, worked hours)
    and departmental breakdown.
    """
    return AttendanceService.get_summary(db, date_from, date_to, department)


@router.get("/{attendance_id}", response_model=AttendanceDetailResponse)
def get_attendance_detail(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get a single attendance record by ID.
    """
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record with ID {attendance_id} not found."
        )

    validate_employee_ownership(current_user, record.employee_id)
    return build_attendance_response(record)


@router.post("/check-in", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def check_in(
    payload: Optional[CheckInRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check-in endpoint. Identifies employee from authenticated user or payload.
    """
    user_role = normalize_role(current_user.role)
    target_emp_id = None

    if payload and payload.employee_id:
        if user_role in {"Admin", "HR Manager", "HR Payroll Manager"}:
            target_emp_id = payload.employee_id
        elif current_user.employee_id == payload.employee_id:
            target_emp_id = current_user.employee_id
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to check in for another employee."
            )
    else:
        target_emp_id = current_user.employee_id

    if not target_emp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your user account is not linked to an employee profile. Please contact HR."
        )

    check_in_time = payload.check_in if payload else None
    notes = payload.notes if payload else None

    record = AttendanceService.check_in(
        db=db,
        employee_id=target_emp_id,
        check_in_time=check_in_time,
        notes=notes,
        is_manual=False
    )
    return build_attendance_response(record)


@router.post("/check-out", response_model=AttendanceResponse)
def check_out(
    payload: Optional[CheckOutRequest] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Check-out endpoint. Completes active attendance, calculates worked hours and overtime.
    """
    user_role = normalize_role(current_user.role)
    target_emp_id = None

    if payload and payload.employee_id:
        if user_role in {"Admin", "HR Manager", "HR Payroll Manager"}:
            target_emp_id = payload.employee_id
        elif current_user.employee_id == payload.employee_id:
            target_emp_id = current_user.employee_id
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to check out for another employee."
            )
    else:
        target_emp_id = current_user.employee_id

    if not target_emp_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Your user account is not linked to an employee profile. Please contact HR."
        )

    check_out_time = payload.check_out if payload else None
    notes = payload.notes if payload else None

    record = AttendanceService.check_out(
        db=db,
        employee_id=target_emp_id,
        check_out_time=check_out_time,
        notes=notes
    )
    return build_attendance_response(record)


@router.post("", response_model=AttendanceResponse, status_code=status.HTTP_201_CREATED)
def create_manual_attendance(
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "HR Manager", "HR Payroll Manager", "HR Payroll User"))
):
    """
    Manual attendance creation endpoint for HR / Admin.
    Authoritatively recalculates worked hours, expected hours, overtime, and status.
    """
    record = AttendanceService.create_manual_attendance(
        db=db,
        employee_id=payload.employee_id,
        att_date=payload.date,
        check_in=payload.check_in,
        check_out=payload.check_out,
        notes=payload.notes,
        user_id=current_user.id
    )
    return build_attendance_response(record)


@router.put("/{attendance_id}", response_model=AttendanceResponse)
def update_attendance(
    attendance_id: int,
    payload: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "HR Manager", "HR Payroll Manager"))
):
    """
    Manual attendance correction endpoint for HR / Admin.
    Recalculates all derived fields on the server.
    """
    record = AttendanceService.update_attendance(
        db=db,
        attendance_id=attendance_id,
        att_date=payload.date,
        check_in=payload.check_in,
        check_out=payload.check_out,
        status_val=payload.status,
        notes=payload.notes
    )
    return build_attendance_response(record)


@router.delete("/{attendance_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "HR Manager", "HR Payroll Manager"))
):
    """
    Delete an attendance record. Permitted for HR Managers and Admins.
    """
    record = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Attendance record with ID {attendance_id} not found."
        )

    db.delete(record)
    db.commit()
    return None
