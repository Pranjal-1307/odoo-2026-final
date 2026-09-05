from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_permissions
from app.core.permissions import Permissions
from app.models import User
from app.schemas.audit_log import IntegrationHealthResponse
from app.services.integration_service import IntegrationService

router = APIRouter()


@router.get("/health-check", response_model=IntegrationHealthResponse)
def get_integration_health(
    company: str = Query("PeoplePay360 Inc.", description="Company name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.EMPLOYEE_READ)),
):
    """
    Executes cross-module business rule health check across employees, contracts,
    schedules, attendance, time-off, salary structures, and payruns.
    """
    return IntegrationService.run_system_health_check(db=db, company=company)
