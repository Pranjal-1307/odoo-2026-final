from datetime import datetime, date
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, or_

from app.models import AuditLog, User


class AuditService:
    @staticmethod
    def log_action(
        db: Session,
        action: str,
        entity_type: str,
        company: str = "PeoplePay360 Inc.",
        actor_id: Optional[int] = None,
        actor_name: Optional[str] = None,
        entity_id: Optional[int] = None,
        entity_code: Optional[str] = None,
        old_value: Optional[Dict[str, Any]] = None,
        new_value: Optional[Dict[str, Any]] = None,
        details: Optional[str] = None,
        ip_address: Optional[str] = None,
    ) -> AuditLog:
        """
        Records an immutable audit trail entry in the database.
        """
        # Resolve actor name if missing
        if actor_id and not actor_name:
            user = db.query(User).filter(User.id == actor_id).first()
            if user:
                actor_name = user.username or user.email

        log_entry = AuditLog(
            company=company or "PeoplePay360 Inc.",
            actor_id=actor_id,
            actor_name=actor_name or "System",
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_code=entity_code,
            old_value=old_value,
            new_value=new_value,
            details=details,
            ip_address=ip_address,
            created_at=datetime.utcnow(),
        )
        db.add(log_entry)
        try:
            db.commit()
            db.refresh(log_entry)
        except Exception:
            db.rollback()
        return log_entry

    @staticmethod
    def list_audit_logs(
        db: Session,
        company: Optional[str] = None,
        actor_id: Optional[int] = None,
        action: Optional[str] = None,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        search: Optional[str] = None,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[AuditLog], int, List[str], List[str]]:
        query = db.query(AuditLog)

        if company:
            query = query.filter(func.lower(AuditLog.company) == func.lower(company))
        if actor_id:
            query = query.filter(AuditLog.actor_id == actor_id)
        if action and action.lower() != "all":
            query = query.filter(AuditLog.action == action)
        if entity_type and entity_type.lower() != "all":
            query = query.filter(AuditLog.entity_type == entity_type)
        if entity_id:
            query = query.filter(AuditLog.entity_id == entity_id)
        if start_date:
            query = query.filter(AuditLog.created_at >= datetime.combine(start_date, datetime.min.time()))
        if end_date:
            query = query.filter(AuditLog.created_at <= datetime.combine(end_date, datetime.max.time()))

        if search:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    AuditLog.action.ilike(search_pattern),
                    AuditLog.actor_name.ilike(search_pattern),
                    AuditLog.entity_type.ilike(search_pattern),
                    AuditLog.entity_code.ilike(search_pattern),
                    AuditLog.details.ilike(search_pattern),
                )
            )

        total = query.count()
        items = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

        # Query distinct available actions & entity types
        actions_res = db.query(AuditLog.action).distinct().all()
        actions = sorted([a[0] for a in actions_res if a[0]])

        entities_res = db.query(AuditLog.entity_type).distinct().all()
        entity_types = sorted([e[0] for e in entities_res if e[0]])

        return items, total, actions, entity_types
