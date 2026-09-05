from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.models import User
from app.services.dashboard_service import DashboardService
from app.schemas.dashboard import (
    DashboardResponse,
    EmployeeDashboardResponse,
    PendingAlertItem,
    PayrollTrendItem,
    DepartmentPayrollItem
)

router = APIRouter()

@router.get("", response_model=DashboardResponse, summary="Get Company-Wide Operational & Payroll Dashboard")
def get_dashboard(
    period: Optional[str] = Query(None, description="Payroll period format YYYY-MM (e.g. 2026-09)"),
    department: Optional[str] = Query(None, description="Filter metrics by department"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves the aggregated KPI cards, current payrun processing status,
    historical 6-month trends, department payroll distribution, actionable alerts,
    recent payruns, and recent audit activity feed.
    
    Data is scoped strictly to the authenticated user's company and role permissions.
    """
    try:
        return DashboardService.get_company_dashboard(
            db=db,
            current_user=current_user,
            period=period,
            department=department
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate dashboard overview: {str(e)}"
        )

@router.get("/employee", response_model=EmployeeDashboardResponse, summary="Get Employee Self-Service Dashboard")
def get_employee_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Retrieves the personal self-service dashboard for the authenticated employee:
    profile summary, live attendance rate, leave balances, active contract terms,
    and recent personal payslips with direct download status.
    """
    try:
        return DashboardService.get_employee_dashboard(db=db, current_user=current_user)
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate employee dashboard: {str(e)}"
        )

@router.get("/periods", response_model=List[str], summary="Get Available Payroll Periods")
def get_available_periods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Returns list of distinct payroll periods available for filtering in YYYY-MM format."""
    dashboard = DashboardService.get_company_dashboard(db=db, current_user=current_user)
    return dashboard.available_periods

@router.get("/alerts", response_model=List[PendingAlertItem], summary="Get Actionable Pending Alerts")
def get_dashboard_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Returns priority actionable items (failed payruns, expiring contracts, pending leaves, missing info)."""
    dashboard = DashboardService.get_company_dashboard(db=db, current_user=current_user)
    return dashboard.alerts

@router.get("/payroll-trend", response_model=List[PayrollTrendItem], summary="Get 6-Month Payroll Historical Trend")
def get_payroll_trend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Returns 6-month historical trend of gross salary, deductions, net salary, and employer cost."""
    dashboard = DashboardService.get_company_dashboard(db=db, current_user=current_user)
    return dashboard.payroll_trend

@router.get("/department-distribution", response_model=List[DepartmentPayrollItem], summary="Get Department Payroll Distribution")
def get_department_distribution(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Returns department-wise headcount and gross/net salary allocation."""
    dashboard = DashboardService.get_company_dashboard(db=db, current_user=current_user)
    return dashboard.department_distribution
