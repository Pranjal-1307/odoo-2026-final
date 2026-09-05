from datetime import date
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_permissions, require_roles
from app.core.permissions import Permissions
from app.models import (
    Payrun,
    PayrunEmployee,
    PayrunStatus,
    PayrunEmployeeStatus,
    Employee,
    Contract,
    SalaryStructure,
    User,
)
from app.schemas.payrun import (
    PayrunCreate,
    PayrunUpdate,
    PayrunResponse,
    PayrunListResponse,
    PayrunEmployeeResponse,
    PayrunEmployeeSelectionUpdate,
    PayrunEligibilityResponse,
    PayrunValidationResponse,
    PayrunStatusResponse,
)
from app.services.payrun_service import PayrunService, EligibilityService


router = APIRouter()


def _format_payrun_employee_response(pe: PayrunEmployee, db: Session) -> PayrunEmployeeResponse:
    emp = db.query(Employee).filter(Employee.id == pe.employee_id).first()
    contract = db.query(Contract).filter(Contract.id == pe.contract_id).first() if pe.contract_id else None
    
    struct_name = None
    if contract and contract.salary_structure_id:
        st = db.query(SalaryStructure).filter(SalaryStructure.id == contract.salary_structure_id).first()
        if st:
            struct_name = st.name

    return PayrunEmployeeResponse(
        id=pe.id,
        payrun_id=pe.payrun_id,
        employee_id=pe.employee_id,
        employee_code=emp.employee_code if emp else None,
        employee_name=emp.name if emp else f"Employee #{pe.employee_id}",
        employee_email=emp.work_email if emp else None,
        department=emp.department if emp else None,
        job_position=emp.job_position if emp else None,
        employee_type=emp.employee_type if emp else None,
        contract_id=pe.contract_id,
        contract_code=contract.contract_code if contract else None,
        salary_structure_name=struct_name,
        status=pe.status,
        excluded=pe.excluded,
        exclusion_reason=pe.exclusion_reason,
        worked_days=pe.worked_days or 0.0,
        unpaid_leave_days=pe.unpaid_leave_days or 0.0,
        gross_salary=pe.gross_salary or 0.0,
        total_deductions=pe.total_deductions or 0.0,
        net_salary=pe.net_salary or 0.0,
        employer_contribution_total=pe.employer_contribution_total or 0.0,
        employer_cost=pe.employer_cost or 0.0,
        error_code=pe.error_code,
        error_message=pe.error_message,
        calculation_trace=pe.calculation_trace,
        components=pe.components,
        warnings=pe.warnings,
        payslip_id=pe.payslip_id,
        processed_at=pe.processed_at,
        created_at=pe.created_at,
    )


def _format_payrun_response(payrun: Payrun, db: Session, include_employees: bool = True) -> PayrunResponse:
    struct_name = None
    if payrun.salary_structure_id:
        st = db.query(SalaryStructure).filter(SalaryStructure.id == payrun.salary_structure_id).first()
        if st:
            struct_name = st.name

    created_by_name = None
    if payrun.created_by_id:
        u = db.query(User).filter(User.id == payrun.created_by_id).first()
        if u:
            created_by_name = u.username

    emp_list = None
    if include_employees:
        pes = db.query(PayrunEmployee).filter(PayrunEmployee.payrun_id == payrun.id).order_by(PayrunEmployee.id.asc()).all()
        emp_list = [_format_payrun_employee_response(pe, db) for pe in pes]

    return PayrunResponse(
        id=payrun.id,
        name=payrun.name,
        company=payrun.company or "PeoplePay360 Inc.",
        salary_structure_id=payrun.salary_structure_id,
        salary_structure_name=struct_name,
        period_start=payrun.period_start,
        period_end=payrun.period_end,
        employee_type=payrun.employee_type or "All",
        status=payrun.status,
        total_employees=payrun.total_employees or 0,
        successful_employees=payrun.successful_employees or 0,
        failed_employees=payrun.failed_employees or 0,
        skipped_employees=payrun.skipped_employees or 0,
        excluded_employees=payrun.excluded_employees or 0,
        employee_count=payrun.total_employees or 0,
        warning_count=payrun.warning_count or 0,
        total_gross=payrun.total_gross or 0.0,
        total_deductions=payrun.total_deductions or 0.0,
        total_net=payrun.total_net or 0.0,
        total_net_paid=payrun.total_net_paid or 0.0,
        total_employer_contributions=payrun.total_employer_contributions or 0.0,
        total_employer_cost=payrun.total_employer_cost or 0.0,
        created_by_id=payrun.created_by_id,
        created_by_name=created_by_name,
        created_at=payrun.created_at,
        updated_at=payrun.updated_at,
        processed_at=payrun.processed_at,
        finalized_at=payrun.finalized_at,
        employees=emp_list,
    )


# ----------------------------------------------------
# 1. Eligibility Query Endpoint
# ----------------------------------------------------
@router.get("/eligible-employees", response_model=PayrunEligibilityResponse)
def get_eligible_employees(
    company: str = Query("PeoplePay360 Inc.", description="Company name"),
    period_start: date = Query(..., description="Start of payroll period"),
    period_end: date = Query(..., description="End of payroll period"),
    employee_type: Optional[str] = Query("All", description="Filter by employee type"),
    salary_structure_id: Optional[int] = Query(None, description="Optional salary structure filter"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_READ)),
):
    """Calculates eligibility for employees for a given company and period."""
    if period_start > period_end:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payroll period start date cannot be after end date."
        )

    result = EligibilityService.find_eligible_employees(
        db=db,
        company=company,
        period_start=period_start,
        period_end=period_end,
        employee_type=employee_type,
        salary_structure_id=salary_structure_id,
    )
    return result


# ----------------------------------------------------
# 2. List Payruns
# ----------------------------------------------------
@router.get("", response_model=PayrunListResponse)
def list_payruns(
    company: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    search: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_READ)),
):
    """Lists payruns with search, status filtering and pagination."""
    payruns, total = PayrunService.list_payruns(
        db=db,
        company=company,
        status=status_filter,
        search=search,
        skip=skip,
        limit=limit,
    )
    items = [_format_payrun_response(p, db, include_employees=False) for p in payruns]
    return {"items": items, "total": total}


# ----------------------------------------------------
# 3. Create Payrun
# ----------------------------------------------------
@router.post("", response_model=PayrunResponse, status_code=status.HTTP_201_CREATED)
def create_payrun(
    payload: PayrunCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_CREATE)),
):
    """Creates a new Payrun in DRAFT status with initial eligible employees."""
    try:
        payrun = PayrunService.create_payrun(
            db=db,
            user=current_user,
            name=payload.name,
            company=payload.company,
            period_start=payload.period_start,
            period_end=payload.period_end,
            employee_type=payload.employee_type,
            salary_structure_id=payload.salary_structure_id,
            selected_employee_ids=payload.selected_employee_ids,
        )
        return _format_payrun_response(payrun, db, include_employees=True)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ----------------------------------------------------
# 4. Get Payrun Detail
# ----------------------------------------------------
@router.get("/{payrun_id}", response_model=PayrunResponse)
def get_payrun_detail(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_READ)),
):
    """Retrieves full Payrun details including employee calculation results."""
    payrun = PayrunService.get_payrun(db, payrun_id)
    if not payrun:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Payrun #{payrun_id} not found.")
    return _format_payrun_response(payrun, db, include_employees=True)


# ----------------------------------------------------
# 5. Update Draft Payrun
# ----------------------------------------------------
@router.put("/{payrun_id}", response_model=PayrunResponse)
def update_draft_payrun(
    payrun_id: int,
    payload: PayrunUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_CREATE)),
):
    """Updates basic metadata of a Draft Payrun."""
    try:
        payrun = PayrunService.update_draft_payrun(
            db=db,
            payrun_id=payrun_id,
            name=payload.name,
            period_start=payload.period_start,
            period_end=payload.period_end,
            employee_type=payload.employee_type,
        )
        return _format_payrun_response(payrun, db, include_employees=True)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ----------------------------------------------------
# 6. Update Employee Selection / Exclusions
# ----------------------------------------------------
@router.post("/{payrun_id}/employees", response_model=PayrunResponse)
def update_payrun_employees(
    payrun_id: int,
    payload: PayrunEmployeeSelectionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_COMPUTE)),
):
    """Updates included/excluded employees and exclusion reasons for a Payrun."""
    try:
        payrun = PayrunService.update_employee_selection(
            db=db,
            payrun_id=payrun_id,
            employee_ids=payload.employee_ids,
            exclusion_reasons=payload.exclusion_reasons,
        )
        return _format_payrun_response(payrun, db, include_employees=True)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ----------------------------------------------------
# 7. Validate Payrun Pre-Processing
# ----------------------------------------------------
@router.post("/{payrun_id}/validate", response_model=PayrunValidationResponse)
def validate_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_COMPUTE)),
):
    """Runs automated pre-processing validation checks on contracts, structures, attendance, and duplicates."""
    try:
        return PayrunService.validate_payrun(db, payrun_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ----------------------------------------------------
# 8. Process Payrun (Batch Calculation)
# ----------------------------------------------------
@router.post("/{payrun_id}/process", response_model=PayrunResponse)
def process_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_COMPUTE)),
):
    """Executes the Salary Rules Engine for all selected employees in the Payrun."""
    try:
        payrun = PayrunService.process_payrun(db, payrun_id)
        return _format_payrun_response(payrun, db, include_employees=True)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ----------------------------------------------------
# 9. Get Processing Status / Progress
# ----------------------------------------------------
@router.get("/{payrun_id}/status", response_model=PayrunStatusResponse)
def get_payrun_status(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_READ)),
):
    """Lightweight endpoint for polling calculation progress."""
    payrun = PayrunService.get_payrun(db, payrun_id)
    if not payrun:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Payrun #{payrun_id} not found.")

    return PayrunStatusResponse(
        payrun_id=payrun.id,
        status=payrun.status,
        total_employees=payrun.total_employees or 0,
        successful_employees=payrun.successful_employees or 0,
        failed_employees=payrun.failed_employees or 0,
        excluded_employees=payrun.excluded_employees or 0,
        total_gross=payrun.total_gross or 0.0,
        total_deductions=payrun.total_deductions or 0.0,
        total_net=payrun.total_net or 0.0,
        processed_at=payrun.processed_at,
        finalized_at=payrun.finalized_at,
    )


# ----------------------------------------------------
# 10. Recalculate Single Employee
# ----------------------------------------------------
@router.post("/{payrun_id}/employees/{employee_id}/recalculate")
def recalculate_single_employee(
    payrun_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_COMPUTE)),
):
    """Re-executes salary rules computation for a single employee in a draft/review payrun."""
    try:
        return PayrunService.recalculate_single_employee(db, payrun_id, employee_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ----------------------------------------------------
# 11. Get Single Employee Calculation Trace
# ----------------------------------------------------
@router.get("/{payrun_id}/employees/{employee_id}", response_model=PayrunEmployeeResponse)
def get_payrun_employee_detail(
    payrun_id: int,
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_READ)),
):
    """Retrieves detailed computation trace, components, and error logs for a single employee."""
    pe = db.query(PayrunEmployee).filter(
        PayrunEmployee.payrun_id == payrun_id,
        PayrunEmployee.employee_id == employee_id,
    ).first()

    if not pe:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee #{employee_id} not found in Payrun #{payrun_id}."
        )

    return _format_payrun_employee_response(pe, db)


# ----------------------------------------------------
# 12. Finalize Payrun & Generate Payslips
# ----------------------------------------------------
@router.post("/{payrun_id}/finalize", response_model=PayrunResponse)
def finalize_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_VALIDATE)),
):
    """Finalizes the Payrun, generates official Payslips, and locks the payroll batch permanently."""
    try:
        payrun = PayrunService.finalize_payrun(db, payrun_id, current_user)
        return _format_payrun_response(payrun, db, include_employees=True)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ----------------------------------------------------
# 13. Cancel Payrun
# ----------------------------------------------------
@router.post("/{payrun_id}/cancel", response_model=PayrunResponse)
def cancel_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_VALIDATE)),
):
    """Cancels an active Payrun before finalization."""
    try:
        payrun = PayrunService.cancel_payrun(db, payrun_id)
        return _format_payrun_response(payrun, db, include_employees=False)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


# ----------------------------------------------------
# 14. Delete Draft Payrun
# ----------------------------------------------------
@router.delete("/{payrun_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_draft_payrun(
    payrun_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.PAYRUN_DELETE)),
):
    """Deletes an unfinalized draft Payrun."""
    try:
        PayrunService.delete_payrun(db, payrun_id)
        return None
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
