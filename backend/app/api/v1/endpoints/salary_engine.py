from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_permissions
from app.core.permissions import Permissions
from app.models import User
from app.schemas.salary_engine import (
    PayrollCalculatePreviewRequest,
    PayrollCalculatePreviewResponse,
)
from app.services.salary_engine_service import (
    SalaryEngineService,
    SalaryEngineException,
    FormulaEvaluationError,
    MissingPercentageBaseError,
    DivisionByZeroError,
)

router = APIRouter()


@router.post("/calculate-preview", response_model=PayrollCalculatePreviewResponse)
def calculate_payroll_preview(
    payload: PayrollCalculatePreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_STRUCTURE_READ)),
):
    """
    Calculates a live salary preview for an employee over a specific payroll period.
    Orchestrates Employee validation, Active Contract lookup, Salary Structure & Rules execution,
    real Attendance & Time Off data retrieval, and generates a step-by-step Execution Audit Trace.
    """
    try:
        result = SalaryEngineService.calculate_employee_payroll(
            db=db,
            employee_id=payload.employee_id,
            period_start=payload.period_start,
            period_end=payload.period_end,
            contract_id=payload.contract_id,
            custom_inputs=payload.custom_inputs,
        )
        return PayrollCalculatePreviewResponse(**result)
    except SalaryEngineException as e:
        status_code = status.HTTP_404_NOT_FOUND if e.code in ("EMPLOYEE_NOT_FOUND", "INVALID_CONTRACT", "NO_APPLICABLE_CONTRACT", "NO_SALARY_STRUCTURE") else status.HTTP_422_UNPROCESSABLE_ENTITY
        raise HTTPException(
            status_code=status_code,
            detail={
                "code": e.code,
                "rule_code": e.rule_code,
                "message": e.message,
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "CALCULATION_FAILED",
                "message": f"Unexpected payroll calculation error: {str(e)}",
            }
        )
