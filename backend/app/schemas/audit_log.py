from typing import Optional, List, Any, Dict
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company: str
    actor_id: Optional[int] = None
    actor_name: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[int] = None
    entity_code: Optional[str] = None
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime


class AuditLogListResponse(BaseModel):
    total: int
    items: List[AuditLogResponse]
    actions: List[str]
    entity_types: List[str]


class IntegrationIssue(BaseModel):
    category: str  # employee, contract, schedule, attendance, time_off, payroll
    severity: str  # blocking_error, warning, info
    code: str
    title: str
    message: str
    entity_type: str
    entity_id: Optional[int] = None
    entity_name: Optional[str] = None
    suggested_action: str


class IntegrationHealthResponse(BaseModel):
    company: str
    checked_at: datetime
    status: str  # healthy, warnings, critical
    total_checks: int
    passed_checks: int
    failed_checks: int
    issues: List[IntegrationIssue]
    summary: Dict[str, Any]
