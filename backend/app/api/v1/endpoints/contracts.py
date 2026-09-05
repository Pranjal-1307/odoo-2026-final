from typing import List, Optional
from datetime import date, datetime
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
    SalaryStructure,
    Contract,
    ContractStatus,
    Payslip
)
from app.schemas.contract import (
    ContractCreate,
    ContractUpdate,
    ContractStatusUpdate,
    ContractResponse,
    ContractDetailResponse,
    ContractListResponse,
    ContractOptionEmployee,
    ContractOptionStructure,
    ContractOptionSchedule,
    ContractOptionsResponse,
    ApplicableContractResponse
)

router = APIRouter()


def generate_next_contract_code(db: Session) -> str:
    """Generates the next sequential contract identifier e.g. CNT-00001."""
    contracts = db.query(Contract.contract_code).all()
    max_num = 0
    for (code,) in contracts:
        if code:
            matches = re.findall(r'\d+', code)
            if matches:
                num = int(matches[-1])
                if num > max_num:
                    max_num = num
    next_num = max_num + 1
    return f"CNT-{next_num:05d}"


def check_contract_overlap(
    db: Session,
    employee_id: int,
    start_date: date,
    end_date: Optional[date],
    exclude_contract_id: Optional[int] = None
) -> Optional[Contract]:
    """
    Checks if an employee already has an active/running contract overlapping the specified date interval.
    Open-ended contracts (end_date=None) extend indefinitely.
    """
    query = db.query(Contract).filter(
        Contract.employee_id == employee_id,
        Contract.status == ContractStatus.RUNNING.value
    )
    if exclude_contract_id:
        query = query.filter(Contract.id != exclude_contract_id)

    existing_contracts = query.all()
    
    for c in existing_contracts:
        c_end = c.end_date or date(9999, 12, 31)
        target_end = end_date or date(9999, 12, 31)
        
        # Overlap interval logic: max(start1, start2) <= min(end1, end2)
        if max(start_date, c.start_date) <= min(target_end, c_end):
            return c
            
    return None


def find_applicable_contract(
    db: Session,
    employee_id: int,
    period_start: date,
    period_end: date
) -> tuple[Optional[Contract], Optional[str], Optional[str]]:
    """
    Finds the contract applicable to a given employee and payroll period.
    Returns: (contract, warning_type, warning_message)
    """
    contracts = db.query(Contract).filter(
        Contract.employee_id == employee_id,
        Contract.status == ContractStatus.RUNNING.value
    ).all()
    
    applicable = []
    for c in contracts:
        c_end = c.end_date or date(9999, 12, 31)
        if max(period_start, c.start_date) <= min(period_end, c_end):
            applicable.append(c)

    if not applicable:
        # Also check if there is an expired contract that covered this period (historical payrun)
        historical_contracts = db.query(Contract).filter(
            Contract.employee_id == employee_id,
            Contract.status == ContractStatus.EXPIRED.value
        ).all()
        for c in historical_contracts:
            c_end = c.end_date or date(9999, 12, 31)
            if max(period_start, c.start_date) <= min(period_end, c_end):
                applicable.append(c)
                
    if not applicable:
        return None, "NO_CONTRACT", "No applicable running or historical contract found for this employee for the selected payroll period."
    
    if len(applicable) > 1:
        return None, "MULTIPLE_CONTRACTS", f"Multiple ({len(applicable)}) applicable contracts found for this employee covering the payroll period."
        
    return applicable[0], None, None


def map_contract_to_response(c: Contract) -> ContractResponse:
    emp_name = c.employee.name if c.employee else "Unknown Employee"
    emp_code = c.employee.employee_code if c.employee else None
    schedule_name = c.working_schedule.name if c.working_schedule else None
    structure_name = c.salary_structure.name if c.salary_structure else None
    payslips_count = len(c.payslips) if c.payslips else 0

    return ContractResponse(
        id=c.id,
        contract_code=c.contract_code,
        name=c.name,
        employee_id=c.employee_id,
        employee_name=emp_name,
        employee_code=emp_code,
        department=c.department,
        job_position=c.job_position,
        start_date=c.start_date,
        end_date=c.end_date,
        wage_per_month=c.wage_per_month,
        status=c.status,
        working_schedule_id=c.working_schedule_id,
        working_schedule_name=schedule_name,
        salary_structure_id=c.salary_structure_id,
        salary_structure_name=structure_name,
        notes=c.notes,
        payslips_count=payslips_count,
        created_at=c.created_at,
        updated_at=c.updated_at
    )


# =========================================================================
# 1. Options for Contract Form
# =========================================================================
@router.get("/options", response_model=ContractOptionsResponse)
def get_contract_options(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dropdown selection options for creating/editing contracts.
    """
    employees = db.query(Employee).order_by(Employee.name.asc()).all()
    emp_opts = [
        ContractOptionEmployee(
            id=e.id,
            name=e.name,
            employee_code=e.employee_code,
            department=e.department,
            job_position=e.job_position,
            working_schedule_id=e.working_schedule_id
        ) for e in employees
    ]

    structures = db.query(SalaryStructure).filter(SalaryStructure.active == True).order_by(SalaryStructure.name.asc()).all()
    struct_opts = [
        ContractOptionStructure(
            id=s.id,
            name=s.name,
            code=s.code
        ) for s in structures
    ]

    schedules = db.query(WorkingSchedule).filter(WorkingSchedule.status == "active").order_by(WorkingSchedule.name.asc()).all()
    sched_opts = [
        ContractOptionSchedule(
            id=s.id,
            name=s.name,
            hours_per_week=s.hours_per_week
        ) for s in schedules
    ]

    # Unique departments & positions
    departments = sorted(list({e.department for e in employees if e.department}))
    if not departments:
        departments = ["Engineering", "Finance & Payroll", "Human Resources", "Executive / IT", "Sales & Marketing", "Design"]

    job_positions = sorted(list({e.job_position for e in employees if e.job_position}))
    if not job_positions:
        job_positions = ["Software Engineer", "Senior Software Engineer", "HR Manager", "Payroll Specialist", "Payroll Manager"]

    return ContractOptionsResponse(
        employees=emp_opts,
        salary_structures=struct_opts,
        working_schedules=sched_opts,
        departments=departments,
        job_positions=job_positions
    )


# =========================================================================
# 2. Reusable Applicable Contract Lookup Endpoint
# =========================================================================
@router.get("/applicable", response_model=ApplicableContractResponse)
def get_applicable_contract(
    employee_id: int = Query(..., description="ID of employee"),
    period_start: date = Query(..., description="Payroll period start date"),
    period_end: date = Query(..., description="Payroll period end date"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Finds the contract applicable to a given payroll period for an employee.
    Enforces employee privacy ownership checks.
    """
    validate_employee_ownership(current_user, employee_id)
    
    contract, warning_type, message = find_applicable_contract(db, employee_id, period_start, period_end)
    
    if contract:
        return ApplicableContractResponse(
            has_applicable_contract=True,
            contract=map_contract_to_response(contract),
            warning_type=None,
            message=None
        )
    else:
        return ApplicableContractResponse(
            has_applicable_contract=False,
            contract=None,
            warning_type=warning_type,
            message=message
        )


# =========================================================================
# 3. List Contracts (with Search, Filters, Sorting, RBAC)
# =========================================================================
@router.get("", response_model=ContractListResponse)
def list_contracts(
    search: Optional[str] = Query(None, description="Search by name, code, employee name, department, job position"),
    employee_id: Optional[int] = Query(None, description="Filter by employee ID"),
    department: Optional[str] = Query(None, description="Filter by department"),
    status: Optional[str] = Query(None, description="Filter by status (draft, running, expired, terminated)"),
    working_schedule_id: Optional[int] = Query(None, description="Filter by working schedule"),
    salary_structure_id: Optional[int] = Query(None, description="Filter by salary structure"),
    start_date: Optional[date] = Query(None, description="Filter by start date >= this date"),
    end_date: Optional[date] = Query(None, description="Filter by end date <= this date"),
    sort_by: str = Query("start_date", description="Field to sort by: start_date, end_date, name, contract_code, wage_per_month, status, employee_name"),
    sort_order: str = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    List contracts with full search, filtering, and role-based access control.
    """
    user_role = normalize_role(current_user.role)
    
    query = db.query(Contract).join(Employee, Contract.employee_id == Employee.id)
    
    # Enforce RBAC privacy: Regular Employee role can only see their own contracts
    if user_role == "Employee":
        if current_user.employee_id is None:
            return ContractListResponse(
                items=[], total=0, page=page, limit=limit, total_pages=0,
                running_count=0, draft_count=0, expired_count=0, terminated_count=0
            )
        query = query.filter(Contract.employee_id == current_user.employee_id)
    elif employee_id:
        query = query.filter(Contract.employee_id == employee_id)

    # Search filter
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Contract.name.ilike(search_term),
                Contract.contract_code.ilike(search_term),
                Contract.department.ilike(search_term),
                Contract.job_position.ilike(search_term),
                Contract.notes.ilike(search_term),
                Employee.name.ilike(search_term),
                Employee.employee_code.ilike(search_term)
            )
        )

    # Additional filters
    if department:
        query = query.filter(Contract.department == department)
    if status:
        query = query.filter(Contract.status == status)
    if working_schedule_id:
        query = query.filter(Contract.working_schedule_id == working_schedule_id)
    if salary_structure_id:
        query = query.filter(Contract.salary_structure_id == salary_structure_id)
    if start_date:
        query = query.filter(Contract.start_date >= start_date)
    if end_date:
        query = query.filter(Contract.end_date <= end_date)

    # Status breakdown counts
    count_base_query = db.query(Contract)
    if user_role == "Employee":
        count_base_query = count_base_query.filter(Contract.employee_id == current_user.employee_id)
    elif employee_id:
        count_base_query = count_base_query.filter(Contract.employee_id == employee_id)

    running_count = count_base_query.filter(Contract.status == ContractStatus.RUNNING.value).count()
    draft_count = count_base_query.filter(Contract.status == ContractStatus.DRAFT.value).count()
    expired_count = count_base_query.filter(Contract.status == ContractStatus.EXPIRED.value).count()
    terminated_count = count_base_query.filter(Contract.status == ContractStatus.TERMINATED.value).count()

    # Total count after filters
    total = query.count()
    total_pages = (total + limit - 1) // limit if total > 0 else 0

    # Sorting
    order_func = desc if sort_order.lower() == "desc" else asc
    if sort_by == "start_date":
        query = query.order_by(order_func(Contract.start_date), order_func(Contract.id))
    elif sort_by == "end_date":
        query = query.order_by(order_func(Contract.end_date), order_func(Contract.id))
    elif sort_by == "name":
        query = query.order_by(order_func(Contract.name))
    elif sort_by == "contract_code":
        query = query.order_by(order_func(Contract.contract_code))
    elif sort_by == "wage_per_month":
        query = query.order_by(order_func(Contract.wage_per_month))
    elif sort_by == "status":
        query = query.order_by(order_func(Contract.status))
    elif sort_by == "employee_name":
        query = query.order_by(order_func(Employee.name))
    else:
        query = query.order_by(order_func(Contract.start_date), order_func(Contract.id))

    # Pagination
    offset = (page - 1) * limit
    contracts = query.offset(offset).limit(limit).all()

    items = [map_contract_to_response(c) for c in contracts]

    return ContractListResponse(
        items=items,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        running_count=running_count,
        draft_count=draft_count,
        expired_count=expired_count,
        terminated_count=terminated_count
    )


# =========================================================================
# 4. Create Contract
# =========================================================================
@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
def create_contract(
    contract_in: ContractCreate,
    current_user: User = Depends(require_permissions(Permissions.CONTRACT_CREATE)),
    db: Session = Depends(get_db)
):
    """
    Create a new contract with full business validation and overlap detection.
    """
    # 1. Validate employee exists
    employee = db.query(Employee).filter(Employee.id == contract_in.employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Employee with ID {contract_in.employee_id} does not exist."
        )

    # 2. Validate salary structure exists
    salary_structure = db.query(SalaryStructure).filter(SalaryStructure.id == contract_in.salary_structure_id).first()
    if not salary_structure:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Salary Structure with ID {contract_in.salary_structure_id} does not exist."
        )

    # 3. Validate working schedule exists if specified
    if contract_in.working_schedule_id:
        schedule = db.query(WorkingSchedule).filter(WorkingSchedule.id == contract_in.working_schedule_id).first()
        if not schedule:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Working Schedule with ID {contract_in.working_schedule_id} does not exist."
            )

    # 4. Validate dates
    if contract_in.end_date and contract_in.end_date < contract_in.start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be before start date."
        )

    # 5. Validate wage
    if contract_in.wage_per_month < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monthly wage cannot be negative."
        )

    # 6. Check overlap if creating as running
    contract_status = (contract_in.status or ContractStatus.DRAFT.value).lower()
    if contract_status == ContractStatus.RUNNING.value:
        overlap = check_contract_overlap(
            db,
            contract_in.employee_id,
            contract_in.start_date,
            contract_in.end_date
        )
        if overlap:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot create running contract. This employee already has an active running contract ({overlap.contract_code} - {overlap.name}) overlapping this period."
            )

    # 7. Generate or validate contract code
    contract_code = contract_in.contract_code.strip() if contract_in.contract_code else generate_next_contract_code(db)
    existing_code = db.query(Contract).filter(Contract.contract_code == contract_code).first()
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Contract code '{contract_code}' already exists."
        )

    # Auto-fill department / job position from employee if omitted
    dept = contract_in.department or employee.department
    pos = contract_in.job_position or employee.job_position
    schedule_id = contract_in.working_schedule_id or employee.working_schedule_id

    contract = Contract(
        contract_code=contract_code,
        name=contract_in.name,
        employee_id=contract_in.employee_id,
        department=dept,
        job_position=pos,
        start_date=contract_in.start_date,
        end_date=contract_in.end_date,
        wage_per_month=contract_in.wage_per_month,
        status=contract_status,
        working_schedule_id=schedule_id,
        salary_structure_id=contract_in.salary_structure_id,
        notes=contract_in.notes
    )

    db.add(contract)
    db.commit()
    db.refresh(contract)

    return map_contract_to_response(contract)


# =========================================================================
# 5. Get Contract Detail
# =========================================================================
@router.get("/{id}", response_model=ContractDetailResponse)
def get_contract(
    id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed contract information.
    Validates employee ownership (Employee role only sees their own contract).
    """
    contract = db.query(Contract).filter(Contract.id == id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract with ID {id} not found."
        )

    validate_employee_ownership(current_user, contract.employee_id)
    return map_contract_to_response(contract)


# =========================================================================
# 6. Update Contract
# =========================================================================
@router.put("/{id}", response_model=ContractResponse)
def update_contract(
    id: int,
    contract_in: ContractUpdate,
    current_user: User = Depends(require_permissions(Permissions.CONTRACT_UPDATE)),
    db: Session = Depends(get_db)
):
    """
    Update an existing contract with date, wage, and overlap validations.
    """
    contract = db.query(Contract).filter(Contract.id == id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract with ID {id} not found."
        )

    # Check date range validation
    new_start = contract_in.start_date if contract_in.start_date is not None else contract.start_date
    new_end = contract_in.end_date if contract_in.end_date is not None else contract.end_date
    if new_end and new_end < new_start:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date cannot be before start date."
        )

    # Check wage validation
    if contract_in.wage_per_month is not None and contract_in.wage_per_month < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Monthly wage cannot be negative."
        )

    # Check related models if changing
    if contract_in.employee_id is not None:
        emp = db.query(Employee).filter(Employee.id == contract_in.employee_id).first()
        if not emp:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Employee does not exist.")
        contract.employee_id = contract_in.employee_id

    if contract_in.salary_structure_id is not None:
        struct = db.query(SalaryStructure).filter(SalaryStructure.id == contract_in.salary_structure_id).first()
        if not struct:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Salary Structure does not exist.")
        contract.salary_structure_id = contract_in.salary_structure_id

    if contract_in.working_schedule_id is not None:
        sched = db.query(WorkingSchedule).filter(WorkingSchedule.id == contract_in.working_schedule_id).first()
        if not sched:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Working Schedule does not exist.")
        contract.working_schedule_id = contract_in.working_schedule_id

    # Check overlap if status is/becomes running
    target_status = contract_in.status if contract_in.status is not None else contract.status
    if target_status == ContractStatus.RUNNING.value:
        overlap = check_contract_overlap(
            db,
            contract.employee_id,
            new_start,
            new_end,
            exclude_contract_id=contract.id
        )
        if overlap:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contract overlaps with another running contract ({overlap.contract_code} - {overlap.name})."
            )

    # Apply updates
    if contract_in.name is not None:
        contract.name = contract_in.name
    if contract_in.department is not None:
        contract.department = contract_in.department
    if contract_in.job_position is not None:
        contract.job_position = contract_in.job_position
    if contract_in.start_date is not None:
        contract.start_date = contract_in.start_date
    if "end_date" in contract_in.model_fields_set:
        contract.end_date = contract_in.end_date
    if contract_in.wage_per_month is not None:
        contract.wage_per_month = contract_in.wage_per_month
    if contract_in.status is not None:
        contract.status = contract_in.status.lower()
    if contract_in.notes is not None:
        contract.notes = contract_in.notes

    contract.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)

    return map_contract_to_response(contract)


# =========================================================================
# 7. Activate Contract Workflow (Draft -> Running)
# =========================================================================
@router.post("/{id}/activate", response_model=ContractResponse)
def activate_contract(
    id: int,
    current_user: User = Depends(require_permissions(Permissions.CONTRACT_UPDATE)),
    db: Session = Depends(get_db)
):
    """
    Activates a draft contract into 'running' status with overlap check.
    """
    contract = db.query(Contract).filter(Contract.id == id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract with ID {id} not found."
        )

    # Check overlap
    overlap = check_contract_overlap(
        db,
        contract.employee_id,
        contract.start_date,
        contract.end_date,
        exclude_contract_id=contract.id
    )
    if overlap:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot activate contract. This employee already has another running contract ({overlap.contract_code}) overlapping this period."
        )

    contract.status = ContractStatus.RUNNING.value
    contract.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)

    return map_contract_to_response(contract)


# =========================================================================
# 8. Cancel Contract Workflow (Running -> Terminated)
# =========================================================================
@router.post("/{id}/cancel", response_model=ContractResponse)
def cancel_contract(
    id: int,
    current_user: User = Depends(require_permissions(Permissions.CONTRACT_UPDATE)),
    db: Session = Depends(get_db)
):
    """
    Cancels/Terminates a contract. Historical data is preserved.
    """
    contract = db.query(Contract).filter(Contract.id == id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract with ID {id} not found."
        )

    contract.status = ContractStatus.TERMINATED.value
    contract.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(contract)

    return map_contract_to_response(contract)


# =========================================================================
# 9. Delete Contract
# =========================================================================
@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_contract(
    id: int,
    current_user: User = Depends(require_permissions(Permissions.CONTRACT_DELETE)),
    db: Session = Depends(get_db)
):
    """
    Deletes a contract if not referenced by payslips/payroll history.
    """
    contract = db.query(Contract).filter(Contract.id == id).first()
    if not contract:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract with ID {id} not found."
        )

    # Check if payslips exist for this contract
    payslips_count = db.query(Payslip).filter(Payslip.contract_id == id).count()
    if payslips_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete contract {contract.contract_code} because it is referenced by {payslips_count} payslip(s). Please cancel/terminate the contract instead to protect historical payroll integrity."
        )

    db.delete(contract)
    db.commit()
    return None
