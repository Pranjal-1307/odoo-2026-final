from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_current_active_user, require_permissions
from app.core.permissions import Permissions
from app.models import User, SalaryStructure, SalaryRule
from app.schemas.salary_rule import (
    SalaryRuleCreate,
    SalaryRuleUpdate,
    SalaryRuleResponse,
    SalaryRuleListResponse,
    SalaryRuleReorderRequest,
)

router = APIRouter()


@router.get("", response_model=SalaryRuleListResponse)
def list_salary_rules(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    structure_id: Optional[int] = Query(None, description="Filter by salary structure ID"),
    category: Optional[str] = Query(None, description="Filter by category (Basic, Allowance, Gross, Deduction, Net, etc.)"),
    computation_type: Optional[str] = Query(None, description="Filter by calculation type (fixed, percentage, formula)"),
    search: Optional[str] = Query(None, description="Search by name, code, or description"),
    active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_RULE_READ)),
):
    """List all salary rules with category, computation type, and structure filters."""
    query = db.query(SalaryRule)

    if structure_id is not None:
        query = query.filter(SalaryRule.structure_id == structure_id)

    if category and category.strip():
        query = query.filter(SalaryRule.category.ilike(category.strip()))

    if computation_type and computation_type.strip():
        query = query.filter(SalaryRule.computation_type.ilike(computation_type.strip()))

    if active is not None:
        query = query.filter(SalaryRule.active == active)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SalaryRule.name.ilike(term),
                SalaryRule.code.ilike(term),
                SalaryRule.description.ilike(term),
            )
        )

    total = query.count()
    rules = query.order_by(SalaryRule.structure_id, SalaryRule.sequence).offset((page - 1) * limit).limit(limit).all()

    items = []
    for r in rules:
        s_name = r.structure.name if r.structure else None
        s_code = r.structure.code if r.structure else None
        items.append(
            SalaryRuleResponse(
                id=r.id,
                structure_id=r.structure_id,
                structure_name=s_name,
                structure_code=s_code,
                name=r.name,
                code=r.code,
                category=r.category,
                sequence=r.sequence,
                computation_type=r.computation_type,
                fixed_amount=r.fixed_amount or 0.0,
                percentage_base_code=r.percentage_base_code,
                percentage_rate=r.percentage_rate or 0.0,
                formula_expression=r.formula_expression,
                condition_type=r.condition_type or "always",
                condition_formula=r.condition_formula,
                appears_on_payslip=r.appears_on_payslip if r.appears_on_payslip is not None else True,
                employer_cost_flag=r.employer_cost_flag if r.employer_cost_flag is not None else False,
                active=r.active if r.active is not None else True,
                description=r.description,
                created_at=r.created_at,
                updated_at=r.updated_at,
            )
        )

    return SalaryRuleListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/{rule_id}", response_model=SalaryRuleResponse)
def get_salary_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_RULE_READ)),
):
    """Get single salary rule details."""
    r = db.query(SalaryRule).filter(SalaryRule.id == rule_id).first()
    if not r:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salary Rule #{rule_id} not found."
        )

    s_name = r.structure.name if r.structure else None
    s_code = r.structure.code if r.structure else None

    return SalaryRuleResponse(
        id=r.id,
        structure_id=r.structure_id,
        structure_name=s_name,
        structure_code=s_code,
        name=r.name,
        code=r.code,
        category=r.category,
        sequence=r.sequence,
        computation_type=r.computation_type,
        fixed_amount=r.fixed_amount or 0.0,
        percentage_base_code=r.percentage_base_code,
        percentage_rate=r.percentage_rate or 0.0,
        formula_expression=r.formula_expression,
        condition_type=r.condition_type or "always",
        condition_formula=r.condition_formula,
        appears_on_payslip=r.appears_on_payslip if r.appears_on_payslip is not None else True,
        employer_cost_flag=r.employer_cost_flag if r.employer_cost_flag is not None else False,
        active=r.active if r.active is not None else True,
        description=r.description,
        created_at=r.created_at,
        updated_at=r.updated_at,
    )


@router.post("", response_model=SalaryRuleResponse, status_code=status.HTTP_201_CREATED)
def create_salary_rule(
    payload: SalaryRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_RULE_CREATE)),
):
    """Create a new salary rule attached to a salary structure."""
    if not payload.structure_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A valid structure_id is required to create a salary rule."
        )

    structure = db.query(SalaryStructure).filter(SalaryStructure.id == payload.structure_id).first()
    if not structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salary Structure #{payload.structure_id} does not exist."
        )

    # Check rule code uniqueness within the structure
    existing = db.query(SalaryRule).filter(
        SalaryRule.structure_id == payload.structure_id,
        SalaryRule.code == payload.code.strip().upper()
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Rule with code '{payload.code}' already exists in structure '{structure.name}'."
        )

    new_rule = SalaryRule(
        structure_id=structure.id,
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        category=payload.category,
        sequence=payload.sequence,
        computation_type=payload.computation_type.strip().lower(),
        fixed_amount=payload.fixed_amount,
        percentage_base_code=payload.percentage_base_code.strip().upper() if payload.percentage_base_code else None,
        percentage_rate=payload.percentage_rate,
        formula_expression=payload.formula_expression.strip() if payload.formula_expression else None,
        condition_type=payload.condition_type.strip().lower(),
        condition_formula=payload.condition_formula.strip() if payload.condition_formula else None,
        appears_on_payslip=payload.appears_on_payslip,
        employer_cost_flag=payload.employer_cost_flag,
        active=payload.active,
        description=payload.description.strip() if payload.description else None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)

    return get_salary_rule(new_rule.id, db=db, current_user=current_user)


@router.put("/{rule_id}", response_model=SalaryRuleResponse)
def update_salary_rule(
    rule_id: int,
    payload: SalaryRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_RULE_UPDATE)),
):
    """Update salary rule parameters."""
    rule = db.query(SalaryRule).filter(SalaryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salary Rule #{rule_id} not found."
        )

    if payload.code is not None and payload.code.strip().upper() != rule.code:
        existing = db.query(SalaryRule).filter(
            SalaryRule.structure_id == rule.structure_id,
            SalaryRule.code == payload.code.strip().upper(),
            SalaryRule.id != rule_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another rule with code '{payload.code}' already exists in this structure."
            )
        rule.code = payload.code.strip().upper()

    if payload.name is not None:
        rule.name = payload.name.strip()
    if payload.category is not None:
        rule.category = payload.category
    if payload.sequence is not None:
        rule.sequence = payload.sequence
    if payload.computation_type is not None:
        rule.computation_type = payload.computation_type.strip().lower()
    if payload.fixed_amount is not None:
        rule.fixed_amount = payload.fixed_amount
    if payload.percentage_base_code is not None:
        rule.percentage_base_code = payload.percentage_base_code.strip().upper() if payload.percentage_base_code else None
    if payload.percentage_rate is not None:
        rule.percentage_rate = payload.percentage_rate
    if payload.formula_expression is not None:
        rule.formula_expression = payload.formula_expression.strip() if payload.formula_expression else None
    if payload.condition_type is not None:
        rule.condition_type = payload.condition_type.strip().lower()
    if payload.condition_formula is not None:
        rule.condition_formula = payload.condition_formula.strip() if payload.condition_formula else None
    if payload.appears_on_payslip is not None:
        rule.appears_on_payslip = payload.appears_on_payslip
    if payload.employer_cost_flag is not None:
        rule.employer_cost_flag = payload.employer_cost_flag
    if payload.active is not None:
        rule.active = payload.active
    if payload.description is not None:
        rule.description = payload.description.strip() if payload.description else None

    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)

    return get_salary_rule(rule.id, db=db, current_user=current_user)


@router.patch("/{rule_id}/status", response_model=SalaryRuleResponse)
def toggle_salary_rule_status(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_RULE_UPDATE)),
):
    """Toggle rule active/inactive status."""
    rule = db.query(SalaryRule).filter(SalaryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salary Rule #{rule_id} not found."
        )

    rule.active = not rule.active
    rule.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(rule)

    return get_salary_rule(rule.id, db=db, current_user=current_user)


@router.delete("/{rule_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_salary_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_RULE_DELETE)),
):
    """Delete a salary rule."""
    rule = db.query(SalaryRule).filter(SalaryRule.id == rule_id).first()
    if not rule:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salary Rule #{rule_id} not found."
        )

    db.delete(rule)
    db.commit()
    return None


@router.post("/reorder", status_code=status.HTTP_200_OK)
def reorder_salary_rules(
    payload: SalaryRuleReorderRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_RULE_UPDATE)),
):
    """Batch update execution sequences for a list of rules."""
    for item in payload.rules:
        r = db.query(SalaryRule).filter(SalaryRule.id == item.id).first()
        if r:
            r.sequence = item.sequence
            r.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Salary rules successfully reordered."}
