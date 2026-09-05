from typing import List, Optional, Any, Dict
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models import User, UserRole, Payslip, Employee, Contract, SalaryStructure
from app.schemas.payslip import (
    PayslipCreate,
    PayslipOut,
    PayslipLineOut,
    PayslipSummaryMetrics,
)
from app.services.payslip_service import PayslipService, PayslipServiceException

router = APIRouter()


def _format_payslip_out(payslip: Payslip) -> Dict[str, Any]:
    """Helper to enrich Payslip with relation names and nested line details."""
    emp = payslip.employee
    struct = payslip.salary_structure
    payrun = payslip.payrun
    
    return {
        "id": payslip.id,
        "payslip_number": payslip.payslip_number,
        "payrun_id": payslip.payrun_id,
        "employee_id": payslip.employee_id,
        "contract_id": payslip.contract_id,
        "salary_structure_id": payslip.salary_structure_id,
        "company": payslip.company or (emp.company if emp else "PeoplePay360 Inc."),
        "period_start": payslip.period_start,
        "period_end": payslip.period_end,
        "status": payslip.status,
        "worked_days": payslip.worked_days or 0.0,
        "unpaid_leave_days": payslip.unpaid_leave_days or 0.0,
        "basic_salary": payslip.basic_salary or 0.0,
        "total_earnings": payslip.total_earnings or payslip.gross_salary or 0.0,
        "gross_salary": payslip.gross_salary or 0.0,
        "total_deductions": payslip.total_deductions or 0.0,
        "net_salary": payslip.net_salary or 0.0,
        "total_employer_contributions": payslip.total_employer_contributions or 0.0,
        "total_employer_cost": payslip.total_employer_cost or ((payslip.gross_salary or 0.0) + (payslip.total_employer_contributions or 0.0)),
        "employee_snapshot": payslip.employee_snapshot,
        "contract_snapshot": payslip.contract_snapshot,
        "attendance_snapshot": payslip.attendance_snapshot,
        "time_off_snapshot": payslip.time_off_snapshot,
        "calculation_trace": payslip.calculation_trace,
        "error_code": payslip.error_code,
        "error_message": payslip.error_message,
        "computed_at": payslip.computed_at,
        "finalized_at": payslip.finalized_at,
        "pdf_path": payslip.pdf_path,
        "email_sent": payslip.email_sent or False,
        "email_sent_at": payslip.email_sent_at,
        "created_at": payslip.created_at,
        "updated_at": payslip.updated_at,
        "employee_name": emp.name if emp else (payslip.employee_snapshot.get("name") if payslip.employee_snapshot else "Unknown"),
        "employee_code": emp.employee_code if emp else (payslip.employee_snapshot.get("employee_code") if payslip.employee_snapshot else ""),
        "department": emp.department if emp else (payslip.employee_snapshot.get("department") if payslip.employee_snapshot else ""),
        "job_position": emp.job_position if emp else (payslip.employee_snapshot.get("job_position") if payslip.employee_snapshot else ""),
        "structure_name": struct.name if struct else (payslip.contract_snapshot.get("structure_name") if payslip.contract_snapshot else ""),
        "payrun_name": payrun.name if payrun else None,
        "lines": [
            {
                "id": line.id,
                "payslip_id": line.payslip_id,
                "rule_id": line.rule_id,
                "rule_name": line.rule_name,
                "rule_code": line.rule_code,
                "category": line.category,
                "sequence": line.sequence,
                "amount": line.amount,
                "quantity": line.quantity or 1.0,
                "rate": line.rate or 100.0,
                "base_amount": line.base_amount or 0.0,
                "total": line.total or line.amount,
                "calculation_type": line.calculation_type,
                "calculation_expression": line.calculation_expression,
                "is_employer_contribution": line.is_employer_contribution or False,
                "created_at": line.created_at,
            }
            for line in (payslip.lines or [])
        ],
    }


@router.get("", response_model=Dict[str, Any])
def list_payslips(
    employee_id: Optional[int] = Query(None, description="Filter by Employee ID"),
    period_start: Optional[date] = Query(None, description="Filter period start >= YYYY-MM-DD"),
    period_end: Optional[date] = Query(None, description="Filter period end <= YYYY-MM-DD"),
    status: Optional[str] = Query(None, description="Filter by status (draft, computed, finalized, etc.)"),
    payrun_id: Optional[int] = Query(None, description="Filter by Payrun ID"),
    search: Optional[str] = Query(None, description="Search employee name, code, or payslip number"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Dict[str, Any]:
    """
    List payslips with multi-criteria filtering, search, and strict RBAC isolation.
    """
    payslips, total_count = PayslipService.get_payslips_list(
        db=db,
        current_user=current_user,
        employee_id=employee_id,
        period_start=period_start,
        period_end=period_end,
        status=status,
        payrun_id=payrun_id,
        search=search,
        skip=skip,
        limit=limit,
    )
    items = [_format_payslip_out(p) for p in payslips]
    return {
        "items": items,
        "total": total_count,
        "skip": skip,
        "limit": limit,
    }


@router.get("/summary", response_model=PayslipSummaryMetrics)
def get_payslip_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Returns aggregated payslip metrics for dashboards.
    """
    return PayslipService.get_summary_metrics(db=db, current_user=current_user)


@router.get("/my-payslips", response_model=List[Dict[str, Any]])
def get_my_payslips(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Self-service endpoint: retrieves all finalized payslips for the current logged-in employee.
    """
    if not current_user.employee_id:
        return []
    payslips, _ = PayslipService.get_payslips_list(
        db=db,
        current_user=current_user,
        employee_id=current_user.employee_id,
        limit=100,
    )
    return [_format_payslip_out(p) for p in payslips]


@router.get("/{payslip_id}", response_model=Dict[str, Any])
def get_payslip_detail(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Get full details of a specific payslip with breakdown lines, snapshots, and calculation trace.
    Enforces RBAC: Employees can ONLY view their own payslip.
    """
    payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
    if not payslip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Payslip #{payslip_id} not found.")

    # RBAC security check
    if current_user.role == UserRole.EMPLOYEE.value:
        if payslip.employee_id != current_user.employee_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own payslips."
            )

    return _format_payslip_out(payslip)


@router.post("", response_model=Dict[str, Any], status_code=status.HTTP_201_CREATED)
def create_payslip(
    payload: PayslipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Create a new payslip header and calculate salary lines.
    Restricted to HR / Payroll Managers and Admins.
    """
    if current_user.role == UserRole.EMPLOYEE.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employees cannot create payslips.")

    try:
        payslip = PayslipService.create_payslip(
            db=db,
            employee_id=payload.employee_id,
            period_start=payload.period_start,
            period_end=payload.period_end,
            payrun_id=payload.payrun_id,
            contract_id=payload.contract_id,
            auto_compute=payload.auto_compute,
            user_id=current_user.id,
        )
        return _format_payslip_out(payslip)
    except PayslipServiceException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{payslip_id}/compute", response_model=Dict[str, Any])
def compute_payslip_endpoint(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Executes salary calculation engine for the payslip.
    """
    if current_user.role == UserRole.EMPLOYEE.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employees cannot trigger computation.")

    try:
        payslip = PayslipService.compute_payslip(db=db, payslip_id=payslip_id, user_id=current_user.id)
        return _format_payslip_out(payslip)
    except PayslipServiceException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{payslip_id}/recompute", response_model=Dict[str, Any])
def recompute_payslip_endpoint(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Recomputes payslip salary lines and totals (allowed only before finalization).
    """
    if current_user.role == UserRole.EMPLOYEE.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employees cannot trigger recomputation.")

    try:
        payslip = PayslipService.compute_payslip(db=db, payslip_id=payslip_id, user_id=current_user.id)
        return _format_payslip_out(payslip)
    except PayslipServiceException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{payslip_id}/finalize", response_model=Dict[str, Any])
def finalize_payslip_endpoint(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Finalizes and locks the payslip.
    """
    if current_user.role == UserRole.EMPLOYEE.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employees cannot finalize payslips.")

    try:
        payslip = PayslipService.finalize_payslip(db=db, payslip_id=payslip_id, user_id=current_user.id)
        return _format_payslip_out(payslip)
    except PayslipServiceException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.post("/{payslip_id}/cancel", response_model=Dict[str, Any])
def cancel_payslip_endpoint(
    payslip_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
) -> Any:
    """
    Cancels a draft/computed payslip.
    """
    if current_user.role == UserRole.EMPLOYEE.value:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Employees cannot cancel payslips.")

    try:
        payslip = PayslipService.cancel_payslip(db=db, payslip_id=payslip_id, user_id=current_user.id)
        return _format_payslip_out(payslip)
    except PayslipServiceException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
