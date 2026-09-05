from typing import List, Optional, Dict, Any
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc

from app.api.deps import get_db, get_current_active_user, require_roles
from app.models import (
    TimeOffType,
    TimeOffAllocation,
    TimeOffRequest,
    TimeOffAllocationUsage,
    Employee,
    User,
    UserRole,
    LeaveRequestStatus,
    AllocationStatus
)
from app.schemas.time_off import (
    TimeOffTypeBase,
    TimeOffTypeCreate,
    TimeOffTypeUpdate,
    TimeOffTypeResponse,
    TimeOffAllocationBase,
    TimeOffAllocationCreate,
    TimeOffAllocationUpdate,
    TimeOffAllocationResponse,
    TimeOffRequestBase,
    TimeOffRequestCreate,
    TimeOffRequestUpdate,
    TimeOffRequestApprove,
    TimeOffRequestRefuse,
    TimeOffAllocationUsageResponse,
    TimeOffRequestResponse,
    DurationCalculateRequest,
    DurationCalculateResponse,
    LeaveBalanceItem,
    EmployeeLeaveBalancesResponse,
    TimeOffOverviewResponse
)
from app.services.time_off_service import TimeOffService

router = APIRouter()


def build_type_response(t: TimeOffType) -> TimeOffTypeResponse:
    return TimeOffTypeResponse(
        id=t.id,
        name=t.name,
        unit=t.unit or "days",
        requires_allocation=t.requires_allocation,
        is_unpaid=t.is_unpaid or False,
        approval_type=t.approval_type or "hr",
        payroll_behavior=t.payroll_behavior or ("unpaid" if t.is_unpaid else "paid"),
        active=t.active,
        color=t.color or "#017E84",
        notes=t.notes,
        created_at=t.created_at,
        updated_at=t.updated_at
    )


def build_allocation_response(a: TimeOffAllocation) -> TimeOffAllocationResponse:
    emp = a.employee
    emp_name = emp.name if emp else "Unknown"
    emp_code = emp.employee_code if emp else None
    dept = emp.department if emp else None

    type_name = a.time_off_type.name if a.time_off_type else "Unknown"
    type_color = a.time_off_type.color if a.time_off_type else "#017E84"
    unit = a.time_off_type.unit if a.time_off_type else "days"

    approver_name = a.approver.name if a.approver else None

    return TimeOffAllocationResponse(
        id=a.id,
        employee_id=a.employee_id,
        employee_name=emp_name,
        employee_code=emp_code,
        department=dept,
        time_off_type_id=a.time_off_type_id,
        time_off_type_name=type_name,
        time_off_type_color=type_color,
        unit=unit,
        allocated_amount=a.allocated_amount or 0.0,
        taken_amount=a.taken_amount or 0.0,
        remaining_amount=round((a.allocated_amount or 0.0) - (a.taken_amount or 0.0), 2),
        status=a.status,
        approver_id=a.approver_id,
        approver_name=approver_name,
        validity_start=a.validity_start,
        validity_end=a.validity_end,
        notes=a.notes,
        approved_at=a.approved_at,
        refused_at=a.refused_at,
        created_at=a.created_at,
        updated_at=a.updated_at
    )


def build_request_response(r: TimeOffRequest) -> TimeOffRequestResponse:
    emp = r.employee
    emp_name = emp.name if emp else "Unknown"
    emp_code = emp.employee_code if emp else None
    dept = emp.department if emp else None

    type_name = r.time_off_type.name if r.time_off_type else "Unknown"
    type_color = r.time_off_type.color if r.time_off_type else "#017E84"
    unit = r.time_off_type.unit if r.time_off_type else "days"

    approver_name = r.approver.name if r.approver else None

    usage_items = [
        TimeOffAllocationUsageResponse(
            id=u.id,
            allocation_id=u.allocation_id,
            amount_used=u.amount_used,
            created_at=u.created_at
        ) for u in (r.usages or [])
    ]

    total_used = sum(u.amount_used for u in (r.usages or [])) if r.status == LeaveRequestStatus.APPROVED.value else 0.0

    return TimeOffRequestResponse(
        id=r.id,
        employee_id=r.employee_id,
        employee_name=emp_name,
        employee_code=emp_code,
        department=dept,
        time_off_type_id=r.time_off_type_id,
        time_off_type_name=type_name,
        time_off_type_color=type_color,
        unit=unit,
        start_date=r.start_date,
        end_date=r.end_date,
        start_time=r.start_time,
        end_time=r.end_time,
        duration=r.duration,
        status=r.status,
        reason=r.reason,
        approval_reason=r.approval_reason,
        refusal_reason=r.refusal_reason,
        approver_id=r.approver_id,
        approver_name=approver_name,
        allocation_id=r.allocation_id,
        allocation_used=total_used,
        approved_at=r.approved_at,
        refused_at=r.refused_at,
        cancelled_at=r.cancelled_at,
        created_at=r.created_at,
        updated_at=r.updated_at,
        usages=usage_items
    )


# ==========================================
# 1. Time Off Types Endpoints
# ==========================================
@router.get("/types", response_model=List[TimeOffTypeResponse])
def list_time_off_types(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(TimeOffType)
    if active_only:
        query = query.filter(TimeOffType.active == True)
    types = query.order_by(TimeOffType.id.asc()).all()
    return [build_type_response(t) for t in types]


@router.post("/types", response_model=TimeOffTypeResponse, status_code=status.HTTP_201_CREATED)
def create_time_off_type(
    payload: TimeOffTypeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value))
):
    existing = db.query(TimeOffType).filter(TimeOffType.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"A Time Off Type named '{payload.name}' already exists.")

    new_type = TimeOffType(
        name=payload.name,
        unit=payload.unit,
        requires_allocation=payload.requires_allocation,
        is_unpaid=payload.is_unpaid,
        approval_type=payload.approval_type,
        payroll_behavior=payload.payroll_behavior,
        active=payload.active,
        color=payload.color,
        notes=payload.notes,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_type)
    db.commit()
    db.refresh(new_type)
    return build_type_response(new_type)


@router.get("/types/{type_id}", response_model=TimeOffTypeResponse)
def get_time_off_type(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    t = db.query(TimeOffType).filter(TimeOffType.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Time off type not found.")
    return build_type_response(t)


@router.put("/types/{type_id}", response_model=TimeOffTypeResponse)
def update_time_off_type(
    type_id: int,
    payload: TimeOffTypeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value))
):
    t = db.query(TimeOffType).filter(TimeOffType.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Time off type not found.")

    if payload.name is not None and payload.name != t.name:
        existing = db.query(TimeOffType).filter(TimeOffType.name == payload.name, TimeOffType.id != type_id).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"A Time Off Type named '{payload.name}' already exists.")
        t.name = payload.name

    if payload.unit is not None:
        t.unit = payload.unit
    if payload.requires_allocation is not None:
        t.requires_allocation = payload.requires_allocation
    if payload.is_unpaid is not None:
        t.is_unpaid = payload.is_unpaid
    if payload.approval_type is not None:
        t.approval_type = payload.approval_type
    if payload.payroll_behavior is not None:
        t.payroll_behavior = payload.payroll_behavior
    if payload.active is not None:
        t.active = payload.active
    if payload.color is not None:
        t.color = payload.color
    if payload.notes is not None:
        t.notes = payload.notes

    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return build_type_response(t)


@router.patch("/types/{type_id}/toggle-active", response_model=TimeOffTypeResponse)
def toggle_time_off_type_active(
    type_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value))
):
    t = db.query(TimeOffType).filter(TimeOffType.id == type_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Time off type not found.")
    t.active = not t.active
    t.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(t)
    return build_type_response(t)


# ==========================================
# 2. Allocations Endpoints
# ==========================================
@router.get("/allocations", response_model=List[TimeOffAllocationResponse])
def list_allocations(
    employee_id: Optional[int] = None,
    type_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(TimeOffAllocation)

    # If employee role, restrict to own allocations
    if current_user.role == UserRole.EMPLOYEE.value:
        query = query.filter(TimeOffAllocation.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(TimeOffAllocation.employee_id == employee_id)

    if type_id:
        query = query.filter(TimeOffAllocation.time_off_type_id == type_id)
    if status_filter:
        query = query.filter(TimeOffAllocation.status == status_filter)

    allocations = query.order_by(TimeOffAllocation.id.desc()).all()
    return [build_allocation_response(a) for a in allocations]


@router.post("/allocations", response_model=TimeOffAllocationResponse, status_code=status.HTTP_201_CREATED)
def create_allocation(
    payload: TimeOffAllocationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value))
):
    emp = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    leave_type = db.query(TimeOffType).filter(TimeOffType.id == payload.time_off_type_id).first()
    if not leave_type:
        raise HTTPException(status_code=404, detail="Time off type not found.")

    alloc_status = payload.status or AllocationStatus.APPROVED.value
    approver_id = payload.approver_id or (current_user.employee_id if current_user.employee_id else None)
    approved_at = datetime.utcnow() if alloc_status == AllocationStatus.APPROVED.value else None

    allocation = TimeOffAllocation(
        employee_id=payload.employee_id,
        time_off_type_id=payload.time_off_type_id,
        allocated_amount=payload.allocated_amount,
        taken_amount=0.0,
        remaining_amount=payload.allocated_amount,
        status=alloc_status,
        approver_id=approver_id,
        validity_start=payload.validity_start,
        validity_end=payload.validity_end,
        notes=payload.notes,
        approved_at=approved_at,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(allocation)
    db.commit()
    db.refresh(allocation)
    return build_allocation_response(allocation)


@router.get("/allocations/{allocation_id}", response_model=TimeOffAllocationResponse)
def get_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    a = db.query(TimeOffAllocation).filter(TimeOffAllocation.id == allocation_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Allocation not found.")

    if current_user.role == UserRole.EMPLOYEE.value and a.employee_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this allocation.")

    return build_allocation_response(a)


@router.put("/allocations/{allocation_id}", response_model=TimeOffAllocationResponse)
def update_allocation(
    allocation_id: int,
    payload: TimeOffAllocationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value))
):
    a = db.query(TimeOffAllocation).filter(TimeOffAllocation.id == allocation_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Allocation not found.")

    if payload.allocated_amount is not None:
        if payload.allocated_amount < a.taken_amount:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot reduce allocation to {payload.allocated_amount}, which is less than taken amount ({a.taken_amount})."
            )
        a.allocated_amount = payload.allocated_amount
        a.remaining_amount = round(a.allocated_amount - a.taken_amount, 2)

    if payload.validity_start is not None:
        a.validity_start = payload.validity_start
    if payload.validity_end is not None:
        a.validity_end = payload.validity_end
    if payload.notes is not None:
        a.notes = payload.notes
    if payload.status is not None:
        a.status = payload.status

    a.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(a)
    return build_allocation_response(a)


@router.post("/allocations/{allocation_id}/approve", response_model=TimeOffAllocationResponse)
def approve_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value))
):
    a = db.query(TimeOffAllocation).filter(TimeOffAllocation.id == allocation_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Allocation not found.")

    a.status = AllocationStatus.APPROVED.value
    a.approver_id = current_user.employee_id if current_user.employee_id else a.approver_id
    a.approved_at = datetime.utcnow()
    a.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(a)
    return build_allocation_response(a)


@router.post("/allocations/{allocation_id}/refuse", response_model=TimeOffAllocationResponse)
def refuse_allocation(
    allocation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value))
):
    a = db.query(TimeOffAllocation).filter(TimeOffAllocation.id == allocation_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Allocation not found.")

    a.status = AllocationStatus.REFUSED.value
    a.approver_id = current_user.employee_id if current_user.employee_id else a.approver_id
    a.refused_at = datetime.utcnow()
    a.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(a)
    return build_allocation_response(a)


# ==========================================
# 3. Calculation & Balance Endpoints
# ==========================================
@router.post("/requests/calculate-duration", response_model=DurationCalculateResponse)
def calculate_duration_preview(
    payload: DurationCalculateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    res = TimeOffService.calculate_duration(
        db=db,
        employee_id=payload.employee_id,
        type_id=payload.time_off_type_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        start_time=payload.start_time,
        end_time=payload.end_time
    )

    leave_type = db.query(TimeOffType).filter(TimeOffType.id == payload.time_off_type_id).first()
    available_balance = None
    has_sufficient = True
    warning = None

    if leave_type and leave_type.requires_allocation:
        available_balance = TimeOffService.get_available_allocation_balance(
            db, payload.employee_id, payload.time_off_type_id, payload.start_date
        )
        if available_balance < res["duration"]:
            has_sufficient = False
            warning = f"Insufficient balance. You have {available_balance} {res['unit']} available, but requested {res['duration']} {res['unit']}."

    return DurationCalculateResponse(
        duration=res["duration"],
        unit=res["unit"],
        working_days_counted=res["working_days_counted"],
        calendar_days=res["calendar_days"],
        available_balance=available_balance,
        has_sufficient_balance=has_sufficient,
        warning=warning
    )


@router.get("/balances", response_model=EmployeeLeaveBalancesResponse)
def get_balances(
    employee_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    target_emp_id = employee_id
    if current_user.role == UserRole.EMPLOYEE.value or not target_emp_id:
        target_emp_id = current_user.employee_id

    if not target_emp_id:
        raise HTTPException(status_code=400, detail="Employee ID is required.")

    emp = db.query(Employee).filter(Employee.id == target_emp_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    balances = TimeOffService.get_employee_balances(db, target_emp_id)
    return EmployeeLeaveBalancesResponse(
        employee_id=emp.id,
        employee_name=emp.name,
        balances=[LeaveBalanceItem(**b) for b in balances]
    )


@router.get("/overview", response_model=TimeOffOverviewResponse)
def get_time_off_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    pending_count = db.query(TimeOffRequest).filter(
        TimeOffRequest.status.in_([LeaveRequestStatus.TO_APPROVE.value, "pending"])
    ).count()

    approved_count = db.query(TimeOffRequest).filter(
        TimeOffRequest.status == LeaveRequestStatus.APPROVED.value
    ).count()

    refused_count = db.query(TimeOffRequest).filter(
        TimeOffRequest.status == LeaveRequestStatus.REFUSED.value
    ).count()

    allocations_count = db.query(TimeOffAllocation).count()

    today_val = date.today()
    upcoming_count = db.query(TimeOffRequest).filter(
        TimeOffRequest.status == LeaveRequestStatus.APPROVED.value,
        TimeOffRequest.start_date >= today_val
    ).count()

    my_remaining = 0.0
    if current_user.employee_id:
        my_balances = TimeOffService.get_employee_balances(db, current_user.employee_id)
        for b in my_balances:
            if b.get("requires_allocation"):
                my_remaining += b.get("remaining", 0.0)

    return TimeOffOverviewResponse(
        pending_requests_count=pending_count,
        approved_requests_count=approved_count,
        refused_requests_count=refused_count,
        total_allocations_count=allocations_count,
        upcoming_leaves_count=upcoming_count,
        my_remaining_days=round(my_remaining, 1)
    )


# ==========================================
# 4. Requests Endpoints
# ==========================================
@router.get("/requests", response_model=List[TimeOffRequestResponse])
def list_time_off_requests(
    employee_id: Optional[int] = None,
    type_id: Optional[int] = None,
    status_filter: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    department: Optional[str] = None,
    search: Optional[str] = None,
    my_requests_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(TimeOffRequest).join(TimeOffRequest.employee)

    # Role-based restriction
    if current_user.role == UserRole.EMPLOYEE.value or my_requests_only:
        query = query.filter(TimeOffRequest.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(TimeOffRequest.employee_id == employee_id)

    if type_id:
        query = query.filter(TimeOffRequest.time_off_type_id == type_id)

    if status_filter:
        if status_filter.lower() in ["pending", "to_approve"]:
            query = query.filter(TimeOffRequest.status.in_(["pending", LeaveRequestStatus.TO_APPROVE.value]))
        else:
            query = query.filter(TimeOffRequest.status == status_filter)

    if date_from:
        query = query.filter(TimeOffRequest.end_date >= date_from)
    if date_to:
        query = query.filter(TimeOffRequest.start_date <= date_to)

    if department:
        query = query.filter(Employee.department == department)

    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Employee.name.ilike(search_fmt),
                Employee.employee_code.ilike(search_fmt),
                TimeOffRequest.reason.ilike(search_fmt)
            )
        )

    requests = query.order_by(TimeOffRequest.start_date.desc(), TimeOffRequest.id.desc()).all()
    return [build_request_response(r) for r in requests]


@router.post("/requests", response_model=TimeOffRequestResponse, status_code=status.HTTP_201_CREATED)
def create_time_off_request(
    payload: TimeOffRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # If employee role, ensure they are requesting for themselves
    target_emp_id = payload.employee_id
    if current_user.role == UserRole.EMPLOYEE.value:
        if current_user.employee_id and current_user.employee_id != target_emp_id:
            raise HTTPException(status_code=403, detail="Employees can only submit leave requests for themselves.")
        target_emp_id = current_user.employee_id

    req = TimeOffService.create_request(
        db=db,
        employee_id=target_emp_id,
        type_id=payload.time_off_type_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        reason=payload.reason,
        start_time=payload.start_time,
        end_time=payload.end_time,
        current_user=current_user
    )
    return build_request_response(req)


@router.get("/requests/{request_id}", response_model=TimeOffRequestResponse)
def get_time_off_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    r = db.query(TimeOffRequest).filter(TimeOffRequest.id == request_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Time off request not found.")

    if current_user.role == UserRole.EMPLOYEE.value and r.employee_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this request.")

    return build_request_response(r)


@router.put("/requests/{request_id}", response_model=TimeOffRequestResponse)
def update_time_off_request(
    request_id: int,
    payload: TimeOffRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    r = db.query(TimeOffRequest).filter(TimeOffRequest.id == request_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Time off request not found.")

    if current_user.role == UserRole.EMPLOYEE.value and r.employee_id != current_user.employee_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this request.")

    if r.status not in [LeaveRequestStatus.DRAFT.value, LeaveRequestStatus.TO_APPROVE.value, "pending"]:
        raise HTTPException(status_code=400, detail="Only draft or pending requests can be modified.")

    if payload.time_off_type_id:
        r.time_off_type_id = payload.time_off_type_id
    if payload.start_date:
        r.start_date = payload.start_date
    if payload.end_date:
        r.end_date = payload.end_date
    if payload.start_time is not None:
        r.start_time = payload.start_time
    if payload.end_time is not None:
        r.end_time = payload.end_time
    if payload.reason is not None:
        r.reason = payload.reason

    # Recalculate duration
    calc = TimeOffService.calculate_duration(
        db=db,
        employee_id=r.employee_id,
        type_id=r.time_off_type_id,
        start_date=r.start_date,
        end_date=r.end_date,
        start_time=r.start_time,
        end_time=r.end_time
    )
    r.duration = calc["duration"]
    r.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(r)
    return build_request_response(r)


@router.post("/requests/{request_id}/approve", response_model=TimeOffRequestResponse)
def approve_time_off_request(
    request_id: int,
    payload: Optional[TimeOffRequestApprove] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value))
):
    reason = payload.approval_reason if payload else None
    req = TimeOffService.approve_request(
        db=db,
        request_id=request_id,
        approver_user=current_user,
        approval_reason=reason
    )
    return build_request_response(req)


@router.post("/requests/{request_id}/refuse", response_model=TimeOffRequestResponse)
def refuse_time_off_request(
    request_id: int,
    payload: Optional[TimeOffRequestRefuse] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value))
):
    reason = payload.refusal_reason if payload else None
    req = TimeOffService.refuse_request(
        db=db,
        request_id=request_id,
        approver_user=current_user,
        refusal_reason=reason
    )
    return build_request_response(req)


@router.post("/requests/{request_id}/cancel", response_model=TimeOffRequestResponse)
def cancel_time_off_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    req = TimeOffService.cancel_request(
        db=db,
        request_id=request_id,
        current_user=current_user
    )
    return build_request_response(req)
