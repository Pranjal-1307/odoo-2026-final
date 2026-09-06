from typing import List, Optional
import re
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func

from app.api.deps import (
    get_db,
    get_current_active_user,
    require_permissions,
    validate_employee_ownership
)
from app.core.permissions import Permissions, normalize_role
from app.models import (
    User,
    Employee,
    WorkingSchedule,
    Contract,
    Attendance,
    TimeOffRequest,
    TimeOffAllocation,
    Payslip
)
from app.schemas.employee import (
    EmployeeCreate,
    EmployeeUpdate,
    EmployeeStatusUpdate,
    EmployeeResponse,
    EmployeeDetailResponse,
    EmployeeListResponse,
    EmployeeOption,
    EmployeeOptionsResponse
)
from app.services.audit_service import AuditService

router = APIRouter()

def generate_next_employee_code(db: Session) -> str:
    """Generates the next sequential employee code e.g. EMP006."""
    employees = db.query(Employee.employee_code).all()
    max_num = 0
    for (code,) in employees:
        if code:
            match = re.search(r'\d+', code)
            if match:
                num = int(match.group(0))
                if num > max_num:
                    max_num = num
    next_num = max_num + 1
    return f"EMP{next_num:03d}"

def map_employee_to_response(emp: Employee) -> EmployeeResponse:
    manager_name = emp.manager.name if emp.manager else None
    schedule_name = emp.working_schedule.name if emp.working_schedule else None
    user_id = emp.user.id if emp.user else None
    
    return EmployeeResponse(
        id=emp.id,
        employee_code=emp.employee_code,
        name=emp.name,
        work_email=emp.work_email,
        phone=emp.phone,
        department=emp.department,
        job_position=emp.job_position,
        manager_id=emp.manager_id,
        manager_name=manager_name,
        working_schedule_id=emp.working_schedule_id,
        working_schedule_name=schedule_name,
        company=emp.company,
        work_location=emp.work_location,
        employee_type=emp.employee_type,
        status=emp.status,
        avatar_url=emp.avatar_url,
        bank_name=emp.bank_name,
        bank_account_no=emp.bank_account_no,
        ifsc_code=emp.ifsc_code,
        pan_no=emp.pan_no,
        user_id=user_id,
        created_at=emp.created_at,
        updated_at=emp.updated_at
    )

def map_employee_to_detail_response(emp: Employee) -> EmployeeDetailResponse:
    base_resp = map_employee_to_response(emp)
    
    # Calculate dynamic live counts
    contracts_count = len(emp.contracts) if emp.contracts else 0
    attendance_count = len(emp.attendance_records) if emp.attendance_records else 0
    time_off_count = len(emp.time_off_requests) if emp.time_off_requests else 0
    allocations_count = len(emp.time_off_allocations) if emp.time_off_allocations else 0
    payslips_count = len(emp.payslips) if emp.payslips else 0
    
    return EmployeeDetailResponse(
        **base_resp.model_dump(),
        contracts_count=contracts_count,
        attendance_count=attendance_count,
        time_off_count=time_off_count,
        allocations_count=allocations_count,
        payslips_count=payslips_count
    )

@router.get("/options", response_model=EmployeeOptionsResponse)
def get_employee_options(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get select dropdown options for employee creation/editing.
    Accessible to all authenticated users.
    """
    managers = db.query(Employee).filter(Employee.status == "active").order_by(Employee.name.asc()).all()
    manager_opts = [
        EmployeeOption(
            id=m.id,
            name=m.name,
            employee_code=m.employee_code,
            department=m.department,
            job_position=m.job_position
        ) for m in managers
    ]
    
    # Distinct departments
    dept_records = db.query(Employee.department).distinct().filter(Employee.department.isnot(None)).all()
    departments = sorted(list({d[0] for d in dept_records if d[0]}))
    if not departments:
        departments = ["Engineering", "Finance & Payroll", "Human Resources", "Executive / IT", "Sales & Marketing", "Design"]
        
    # Distinct positions
    pos_records = db.query(Employee.job_position).distinct().filter(Employee.job_position.isnot(None)).all()
    job_positions = sorted(list({p[0] for p in pos_records if p[0]}))
    if not job_positions:
        job_positions = ["Software Engineer", "Senior Software Engineer", "HR Manager", "Payroll Specialist", "Payroll Manager", "Product Designer"]

    # Distinct companies
    comp_records = db.query(Employee.company).distinct().filter(Employee.company.isnot(None)).all()
    companies = sorted(list({c[0] for c in comp_records if c[0]}))
    if not companies:
        companies = ["PeoplePay360 Inc."]

    # Working schedules
    schedules = db.query(WorkingSchedule).filter(WorkingSchedule.status == "active").order_by(WorkingSchedule.name.asc()).all()
    schedule_opts = [
        {"id": s.id, "name": s.name, "hours_per_week": s.hours_per_week}
        for s in schedules
    ]

    return EmployeeOptionsResponse(
        managers=manager_opts,
        departments=departments,
        job_positions=job_positions,
        companies=companies,
        working_schedules=schedule_opts
    )

@router.get("", response_model=EmployeeListResponse)
def list_employees(
    search: Optional[str] = Query(None, description="Search by name, code, email, department or job position"),
    status: Optional[str] = Query("all", description="Status filter: active, inactive, or all"),
    department: Optional[str] = Query(None, description="Filter by department"),
    job_position: Optional[str] = Query(None, description="Filter by job position"),
    company: Optional[str] = Query(None, description="Filter by company"),
    working_schedule_id: Optional[int] = Query(None, description="Filter by working schedule"),
    sort_by: Optional[str] = Query("name", description="Field to sort by: name, department, job_position, status, employee_code, created_at"),
    sort_order: Optional[str] = Query("asc", description="Sort direction: asc or desc"),
    page: Optional[int] = Query(None, ge=1, description="Page number (1-indexed)"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List employees.
    If the current user has the Employee role, only their own employee profile is returned.
    HR/Admin roles can search, filter, sort and paginate all employees.
    """
    user_role = normalize_role(current_user.role)
    
    query = db.query(Employee)
    
    # RBAC Self-access constraint for Employee role
    if user_role == "Employee":
        if not current_user.employee_id:
            return EmployeeListResponse(total=0, active_count=0, inactive_count=0, page=1, limit=limit, total_pages=1, items=[])
        query = query.filter(Employee.id == current_user.employee_id)
        emp = query.first()
        if not emp:
            return EmployeeListResponse(total=0, active_count=0, inactive_count=0, page=1, limit=limit, total_pages=1, items=[])
        item = map_employee_to_response(emp)
        return EmployeeListResponse(
            total=1,
            active_count=1 if emp.status == "active" else 0,
            inactive_count=1 if emp.status == "inactive" else 0,
            page=1,
            limit=limit,
            total_pages=1,
            items=[item]
        )

    # Calculate active/inactive overall counts before main filters
    active_count = db.query(func.count(Employee.id)).filter(Employee.status == "active").scalar() or 0
    inactive_count = db.query(func.count(Employee.id)).filter(Employee.status == "inactive").scalar() or 0

    # Apply search
    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Employee.name.ilike(term),
                Employee.employee_code.ilike(term),
                Employee.work_email.ilike(term),
                Employee.department.ilike(term),
                Employee.job_position.ilike(term)
            )
        )

    # Apply status filter
    if status and status.lower() != "all":
        query = query.filter(Employee.status == status.lower())

    # Apply department filter
    if department and department.strip():
        query = query.filter(Employee.department == department.strip())

    # Apply job position filter
    if job_position and job_position.strip():
        query = query.filter(Employee.job_position == job_position.strip())

    # Apply company filter
    if company and company.strip():
        query = query.filter(Employee.company == company.strip())

    # Apply working schedule filter
    if working_schedule_id is not None:
        query = query.filter(Employee.working_schedule_id == working_schedule_id)

    # Total after filters
    total = query.count()

    # Sorting
    sort_attr_map = {
        "name": Employee.name,
        "department": Employee.department,
        "job_position": Employee.job_position,
        "status": Employee.status,
        "employee_code": Employee.employee_code,
        "created_at": Employee.created_at
    }
    sort_col = sort_attr_map.get(sort_by.lower() if sort_by else "name", Employee.name)
    if sort_order and sort_order.lower() == "desc":
        query = query.order_by(desc(sort_col))
    else:
        query = query.order_by(asc(sort_col))

    # Pagination calculation
    if page is not None and page >= 1:
        skip = (page - 1) * limit
        current_page = page
    else:
        current_page = (skip // limit) + 1 if limit > 0 else 1

    total_pages = max(1, (total + limit - 1) // limit) if total > 0 else 1

    employees = query.offset(skip).limit(limit).all()
    items = [map_employee_to_response(emp) for emp in employees]

    return EmployeeListResponse(
        total=total,
        active_count=active_count,
        inactive_count=inactive_count,
        page=current_page,
        limit=limit,
        total_pages=total_pages,
        items=items
    )

@router.post("", response_model=EmployeeDetailResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    emp_in: EmployeeCreate,
    current_user: User = Depends(require_permissions(Permissions.EMPLOYEE_CREATE)),
    db: Session = Depends(get_db)
):
    """
    Create a new employee record. Requires HR or Admin role.
    """
    work_email = emp_in.work_email.strip().lower()
    
    # Check duplicate email
    existing_email = db.query(Employee).filter(Employee.work_email == work_email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"An employee with email '{work_email}' already exists."
        )

    # Determine code
    if emp_in.employee_code and emp_in.employee_code.strip():
        code = emp_in.employee_code.strip().upper()
        existing_code = db.query(Employee).filter(Employee.employee_code == code).first()
        if existing_code:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee code '{code}' is already in use."
            )
    else:
        code = generate_next_employee_code(db)

    # Validate Manager
    if emp_in.manager_id:
        manager = db.query(Employee).filter(Employee.id == emp_in.manager_id).first()
        if not manager:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Referenced manager (ID: {emp_in.manager_id}) does not exist."
            )

    # Validate Schedule
    if emp_in.working_schedule_id:
        schedule = db.query(WorkingSchedule).filter(WorkingSchedule.id == emp_in.working_schedule_id).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Referenced working schedule (ID: {emp_in.working_schedule_id}) does not exist."
            )

    new_emp = Employee(
        employee_code=code,
        name=emp_in.name,
        work_email=work_email,
        phone=emp_in.phone.strip() if emp_in.phone else None,
        department=emp_in.department.strip(),
        job_position=emp_in.job_position.strip(),
        manager_id=emp_in.manager_id,
        working_schedule_id=emp_in.working_schedule_id,
        company=emp_in.company.strip() if emp_in.company else "PeoplePay360 Inc.",
        work_location=emp_in.work_location.strip() if emp_in.work_location else "Headquarters",
        employee_type=emp_in.employee_type if emp_in.employee_type else "Full-Time",
        status=emp_in.status if emp_in.status else "active",
        avatar_url=emp_in.avatar_url,
        bank_name=emp_in.bank_name.strip() if emp_in.bank_name else None,
        bank_account_no=emp_in.bank_account_no.strip() if emp_in.bank_account_no else None,
        ifsc_code=emp_in.ifsc_code.strip() if emp_in.ifsc_code else None,
        pan_no=emp_in.pan_no.strip() if emp_in.pan_no else None
    )

    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    # Module 13: Audit Trail Logging
    AuditService.log_action(
        db=db,
        company=new_emp.company,
        action="EMPLOYEE_CREATED",
        entity_type="employee",
        entity_id=new_emp.id,
        entity_code=new_emp.employee_code,
        actor_id=current_user.id,
        actor_name=current_user.username,
        new_value={"name": new_emp.name, "email": new_emp.work_email, "department": new_emp.department, "status": new_emp.status},
        details=f"Created employee profile for {new_emp.name} ({new_emp.employee_code})"
    )

    return map_employee_to_detail_response(new_emp)

@router.get("/{id}", response_model=EmployeeDetailResponse)
def get_employee(
    id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed employee profile by ID with live counts for smart buttons.
    Enforces ownership check: Employee role can only access their own record.
    """
    validate_employee_ownership(current_user, id)
    
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found."
        )

    return map_employee_to_detail_response(emp)

@router.put("/{id}", response_model=EmployeeDetailResponse)
def update_employee(
    id: int,
    emp_in: EmployeeUpdate,
    current_user: User = Depends(require_permissions(Permissions.EMPLOYEE_UPDATE)),
    db: Session = Depends(get_db)
):
    """
    Update employee information. Requires HR or Admin role.
    Preserves historical records and validates relationships.
    """
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found."
        )

    # Validate manager != self
    if emp_in.manager_id is not None:
        if emp_in.manager_id == id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An employee cannot be their own manager."
            )
        if emp_in.manager_id != 0:
            mgr = db.query(Employee).filter(Employee.id == emp_in.manager_id).first()
            if not mgr:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Referenced manager (ID: {emp_in.manager_id}) does not exist."
                )
            emp.manager_id = emp_in.manager_id
        else:
            emp.manager_id = None

    # Validate work email uniqueness if changing
    if emp_in.work_email:
        new_email = emp_in.work_email.strip().lower()
        if new_email != emp.work_email:
            existing = db.query(Employee).filter(Employee.work_email == new_email).first()
            if existing and existing.id != id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"An employee with email '{new_email}' already exists."
                )
            emp.work_email = new_email

    # Validate Working Schedule
    if emp_in.working_schedule_id is not None:
        if emp_in.working_schedule_id != 0:
            sch = db.query(WorkingSchedule).filter(WorkingSchedule.id == emp_in.working_schedule_id).first()
            if not sch:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Referenced working schedule (ID: {emp_in.working_schedule_id}) does not exist."
                )
            emp.working_schedule_id = emp_in.working_schedule_id
        else:
            emp.working_schedule_id = None

    # Apply other fields
    if emp_in.name is not None:
        emp.name = emp_in.name.strip()
    if emp_in.phone is not None:
        emp.phone = emp_in.phone.strip() if emp_in.phone else None
    if emp_in.department is not None:
        emp.department = emp_in.department.strip()
    if emp_in.job_position is not None:
        emp.job_position = emp_in.job_position.strip()
    if emp_in.company is not None:
        emp.company = emp_in.company.strip()
    if emp_in.work_location is not None:
        emp.work_location = emp_in.work_location.strip()
    if emp_in.employee_type is not None:
        emp.employee_type = emp_in.employee_type
    if emp_in.status is not None:
        emp.status = emp_in.status
    if emp_in.avatar_url is not None:
        emp.avatar_url = emp_in.avatar_url
    if emp_in.bank_name is not None:
        emp.bank_name = emp_in.bank_name.strip() if emp_in.bank_name else None
    if emp_in.bank_account_no is not None:
        emp.bank_account_no = emp_in.bank_account_no.strip() if emp_in.bank_account_no else None
    if emp_in.ifsc_code is not None:
        emp.ifsc_code = emp_in.ifsc_code.strip() if emp_in.ifsc_code else None
    if emp_in.pan_no is not None:
        emp.pan_no = emp_in.pan_no.strip() if emp_in.pan_no else None

    db.commit()
    db.refresh(emp)

    # Module 13: Audit Trail Logging
    AuditService.log_action(
        db=db,
        company=emp.company,
        action="EMPLOYEE_UPDATED",
        entity_type="employee",
        entity_id=emp.id,
        entity_code=emp.employee_code,
        actor_id=current_user.id,
        actor_name=current_user.username,
        details=f"Updated profile for employee {emp.name} ({emp.employee_code})"
    )

    return map_employee_to_detail_response(emp)

@router.patch("/{id}/status", response_model=EmployeeDetailResponse)
def update_employee_status(
    id: int,
    status_in: EmployeeStatusUpdate,
    current_user: User = Depends(require_permissions(Permissions.EMPLOYEE_UPDATE)),
    db: Session = Depends(get_db)
):
    """
    Soft-activate or deactivate an employee. Preserves all historical records.
    """
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found."
        )

    old_status = emp.status
    emp.status = status_in.status
    db.commit()
    db.refresh(emp)

    # Module 13: Audit Trail Logging
    AuditService.log_action(
        db=db,
        company=emp.company,
        action="EMPLOYEE_STATUS_CHANGED",
        entity_type="employee",
        entity_id=emp.id,
        entity_code=emp.employee_code,
        actor_id=current_user.id,
        actor_name=current_user.username,
        old_value={"status": old_status},
        new_value={"status": status_in.status},
        details=f"Changed status for {emp.name} from {old_status} to {status_in.status}"
    )

    return map_employee_to_detail_response(emp)

@router.delete("/{id}")
def delete_employee(
    id: int,
    current_user: User = Depends(require_permissions(Permissions.EMPLOYEE_DELETE)),
    db: Session = Depends(get_db)
):
    """
    Delete employee record. Protects records with existing dependencies.
    """
    emp = db.query(Employee).filter(Employee.id == id).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {id} not found."
        )

    # Check for historical contracts, attendance, time off, payslips
    contracts_count = db.query(Contract).filter(Contract.employee_id == id).count()
    attendance_count = db.query(Attendance).filter(Attendance.employee_id == id).count()
    timeoff_count = db.query(TimeOffRequest).filter(TimeOffRequest.employee_id == id).count()
    payslips_count = db.query(Payslip).filter(Payslip.employee_id == id).count()

    if contracts_count > 0 or attendance_count > 0 or timeoff_count > 0 or payslips_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Cannot physically delete employee '{emp.name}' because historical dependencies exist "
                f"({contracts_count} contracts, {attendance_count} attendance records, "
                f"{timeoff_count} time off requests, {payslips_count} payslips). "
                f"Please mark the employee as 'inactive' instead to preserve audit integrity."
            )
        )

    db.delete(emp)
    db.commit()

    return {"message": f"Employee '{emp.name}' deleted successfully."}
