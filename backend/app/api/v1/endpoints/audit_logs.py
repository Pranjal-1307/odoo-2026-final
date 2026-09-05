from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user, require_permissions
from app.core.permissions import Permissions
from app.models import User
from app.schemas.audit_log import AuditLogListResponse
from app.services.audit_service import AuditService

router = APIRouter()


@router.get("", response_model=AuditLogListResponse)
def list_audit_logs(
    company: Optional[str] = Query(None, description="Company filter"),
    action: Optional[str] = Query(None, description="Action filter e.g. EMPLOYEE_CREATED"),
    entity_type: Optional[str] = Query(None, description="Entity type filter e.g. employee, contract, payrun"),
    entity_id: Optional[int] = Query(None, description="Entity ID filter"),
    actor_id: Optional[int] = Query(None, description="Actor User ID filter"),
    search: Optional[str] = Query(None, description="Search term in details/code/actor/action"),
    start_date: Optional[date] = Query(None, description="Start date filter"),
    end_date: Optional[date] = Query(None, description="End date filter"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.AUDIT_LOG_READ if hasattr(Permissions, "AUDIT_LOG_READ") else Permissions.EMPLOYEE_READ)),
):
    """
    Retrieves system audit trail records with filters, search, and pagination.
    """
    items, total, actions, entity_types = AuditService.list_audit_logs(
        db=db,
        company=company,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        search=search,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )
    return {
        "items": items,
        "total": total,
        "actions": actions,
        "entity_types": entity_types,
    }
