from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.api.deps import get_db, get_current_active_user, require_permissions
from app.core.permissions import Permissions
from app.models import User, SalaryStructure, SalaryRule, Contract, Payslip
from app.schemas.salary_structure import (
    SalaryStructureCreate,
    SalaryStructureUpdate,
    SalaryStructureStatusUpdate,
    SalaryStructureResponse,
    SalaryStructureDetailResponse,
    SalaryStructureListResponse,
    SalaryPreviewRequest,
    SalaryPreviewResponse,
    LiveComputationRequest,
)
from app.schemas.salary_rule import SalaryRuleResponse
from app.services.salary_engine_service import SalaryEngineService, FormulaEvaluationError, SalaryEngineException

router = APIRouter()


@router.get("", response_model=SalaryStructureListResponse)
def list_salary_structures(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by structure name or code"),
    active: Optional[bool] = Query(None, description="Filter by active status"),
    pay_frequency: Optional[str] = Query(None, description="Filter by frequency: monthly, weekly, etc."),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_STRUCTURE_READ)),
):
    """
    List all salary structures with pagination, search, and status filters.
    Includes rules count and contracts count.
    """
    query = db.query(SalaryStructure)

    if search and search.strip():
        term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                SalaryStructure.name.ilike(term),
                SalaryStructure.code.ilike(term),
                SalaryStructure.description.ilike(term),
            )
        )

    if active is not None:
        query = query.filter(SalaryStructure.active == active)

    if pay_frequency and pay_frequency.strip():
        query = query.filter(SalaryStructure.pay_frequency == pay_frequency.strip().lower())

    total = query.count()
    structures = query.order_by(SalaryStructure.id.desc()).offset((page - 1) * limit).limit(limit).all()

    items = []
    for s in structures:
        r_count = db.query(SalaryRule).filter(SalaryRule.structure_id == s.id).count()
        c_count = db.query(Contract).filter(Contract.salary_structure_id == s.id).count()
        
        items.append(
            SalaryStructureResponse(
                id=s.id,
                name=s.name,
                code=s.code,
                company=s.company or "PeoplePay360 Inc.",
                pay_frequency=s.pay_frequency or "monthly",
                description=s.description,
                effective_from=s.effective_from,
                effective_to=s.effective_to,
                active=s.active,
                rules_count=r_count,
                contracts_count=c_count,
                created_at=s.created_at,
                updated_at=s.updated_at,
            )
        )

    return SalaryStructureListResponse(items=items, total=total, page=page, limit=limit)


@router.get("/{structure_id}", response_model=SalaryStructureDetailResponse)
def get_salary_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_STRUCTURE_READ)),
):
    """Get single salary structure details with all attached rules in sequence order."""
    structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salary Structure #{structure_id} not found."
        )

    r_count = db.query(SalaryRule).filter(SalaryRule.structure_id == structure.id).count()
    c_count = db.query(Contract).filter(Contract.salary_structure_id == structure.id).count()

    rule_items = []
    # rules relationship is already ordered by SalaryRule.sequence
    for r in structure.rules:
        rule_items.append(
            SalaryRuleResponse(
                id=r.id,
                structure_id=r.structure_id,
                structure_name=structure.name,
                structure_code=structure.code,
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

    return SalaryStructureDetailResponse(
        id=structure.id,
        name=structure.name,
        code=structure.code,
        company=structure.company or "PeoplePay360 Inc.",
        pay_frequency=structure.pay_frequency or "monthly",
        description=structure.description,
        effective_from=structure.effective_from,
        effective_to=structure.effective_to,
        active=structure.active,
        rules_count=r_count,
        contracts_count=c_count,
        rules=rule_items,
        created_at=structure.created_at,
        updated_at=structure.updated_at,
    )


@router.post("", response_model=SalaryStructureDetailResponse, status_code=status.HTTP_201_CREATED)
def create_salary_structure(
    payload: SalaryStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_STRUCTURE_CREATE)),
):
    """Create a new salary structure with optional initial salary rules."""
    # Check duplicate name or code
    existing_name = db.query(SalaryStructure).filter(SalaryStructure.name == payload.name.strip()).first()
    if existing_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A salary structure with the name '{payload.name}' already exists."
        )

    existing_code = db.query(SalaryStructure).filter(SalaryStructure.code == payload.code.strip().upper()).first()
    if existing_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A salary structure with the code '{payload.code}' already exists."
        )

    new_structure = SalaryStructure(
        name=payload.name.strip(),
        code=payload.code.strip().upper(),
        company=payload.company.strip() if payload.company else "PeoplePay360 Inc.",
        pay_frequency=payload.pay_frequency.strip().lower(),
        description=payload.description.strip() if payload.description else None,
        effective_from=payload.effective_from,
        effective_to=payload.effective_to,
        active=payload.active,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(new_structure)
    db.flush()

    # If initial rules were provided
    if payload.rules:
        codes_seen = set()
        for r_in in payload.rules:
            r_code = r_in.code.strip().upper()
            if r_code in codes_seen:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Duplicate rule code '{r_code}' provided within the same structure."
                )
            codes_seen.add(r_code)

            new_rule = SalaryRule(
                structure_id=new_structure.id,
                name=r_in.name.strip(),
                code=r_code,
                category=r_in.category,
                sequence=r_in.sequence,
                computation_type=r_in.computation_type.strip().lower(),
                fixed_amount=r_in.fixed_amount,
                percentage_base_code=r_in.percentage_base_code.strip().upper() if r_in.percentage_base_code else None,
                percentage_rate=r_in.percentage_rate,
                formula_expression=r_in.formula_expression.strip() if r_in.formula_expression else None,
                condition_type=r_in.condition_type.strip().lower(),
                condition_formula=r_in.condition_formula.strip() if r_in.condition_formula else None,
                appears_on_payslip=r_in.appears_on_payslip,
                employer_cost_flag=r_in.employer_cost_flag,
                active=r_in.active,
                description=r_in.description,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(new_rule)
        db.flush()

    db.commit()
    db.refresh(new_structure)

    return get_salary_structure(new_structure.id, db=db, current_user=current_user)


@router.put("/{structure_id}", response_model=SalaryStructureDetailResponse)
def update_salary_structure(
    structure_id: int,
    payload: SalaryStructureUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_STRUCTURE_UPDATE)),
):
    """Update salary structure fields."""
    structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salary Structure #{structure_id} not found."
        )

    if payload.name is not None and payload.name.strip() != structure.name:
        existing = db.query(SalaryStructure).filter(
            SalaryStructure.name == payload.name.strip(),
            SalaryStructure.id != structure_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another salary structure with the name '{payload.name}' already exists."
            )
        structure.name = payload.name.strip()

    if payload.code is not None and payload.code.strip().upper() != structure.code:
        existing = db.query(SalaryStructure).filter(
            SalaryStructure.code == payload.code.strip().upper(),
            SalaryStructure.id != structure_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Another salary structure with the code '{payload.code}' already exists."
            )
        structure.code = payload.code.strip().upper()

    if payload.company is not None:
        structure.company = payload.company.strip()
    if payload.pay_frequency is not None:
        structure.pay_frequency = payload.pay_frequency.strip().lower()
    if payload.description is not None:
        structure.description = payload.description.strip() if payload.description else None
    if payload.effective_from is not None:
        structure.effective_from = payload.effective_from
    if payload.effective_to is not None:
        structure.effective_to = payload.effective_to
    if payload.active is not None:
        structure.active = payload.active

    structure.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(structure)

    return get_salary_structure(structure.id, db=db, current_user=current_user)


@router.patch("/{structure_id}/status", response_model=SalaryStructureResponse)
def toggle_salary_structure_status(
    structure_id: int,
    payload: SalaryStructureStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_STRUCTURE_UPDATE)),
):
    """Activate or deactivate a salary structure."""
    structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salary Structure #{structure_id} not found."
        )

    structure.active = payload.active
    structure.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(structure)

    r_count = db.query(SalaryRule).filter(SalaryRule.structure_id == structure.id).count()
    c_count = db.query(Contract).filter(Contract.salary_structure_id == structure.id).count()

    return SalaryStructureResponse(
        id=structure.id,
        name=structure.name,
        code=structure.code,
        company=structure.company or "PeoplePay360 Inc.",
        pay_frequency=structure.pay_frequency or "monthly",
        description=structure.description,
        effective_from=structure.effective_from,
        effective_to=structure.effective_to,
        active=structure.active,
        rules_count=r_count,
        contracts_count=c_count,
        created_at=structure.created_at,
        updated_at=structure.updated_at,
    )


@router.delete("/{structure_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_salary_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_STRUCTURE_DELETE)),
):
    """
    Delete a salary structure. Protected from deletion if referenced by active contracts or payslips.
    """
    structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
    if not structure:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salary Structure #{structure_id} not found."
        )

    # Check contract references
    linked_contracts = db.query(Contract).filter(Contract.salary_structure_id == structure_id).count()
    if linked_contracts > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete Salary Structure '{structure.name}' because it is assigned to {linked_contracts} contract(s). Deactivate it instead."
        )

    # Check payslip references
    linked_payslips = db.query(Payslip).filter(Payslip.salary_structure_id == structure_id).count()
    if linked_payslips > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete Salary Structure '{structure.name}' because {linked_payslips} historical payslip(s) reference it. Deactivate it instead."
        )

    db.delete(structure)
    db.commit()
    return None


@router.post("/{structure_id}/preview", response_model=SalaryPreviewResponse)
def preview_salary_structure(
    structure_id: int,
    payload: SalaryPreviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permissions(Permissions.SALARY_STRUCTURE_READ)),
):
    """
    Run an instant simulation of the salary calculation engine for a given structure
    and test input parameters (wage, worked days, unpaid leave days, etc.).
    """
    try:
        result = SalaryEngineService.preview_structure(
            db=db,
            structure_id=structure_id,
            contract_wage=payload.contract_wage,
            days_in_period=payload.days_in_period,
            worked_days=payload.worked_days,
            paid_leave_days=payload.paid_leave_days,
            unpaid_leave_days=payload.unpaid_leave_days,
            employee_id=payload.employee_id,
        )
        return SalaryPreviewResponse(**result)
    except (FormulaEvaluationError, SalaryEngineException) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Salary calculation simulation failed: {str(e)}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/preview-computation", response_model=SalaryPreviewResponse)
def preview_live_computation(
    payload: LiveComputationRequest,
    current_user: User = Depends(require_permissions(Permissions.SALARY_STRUCTURE_READ)),
):
    """
    Sandbox calculation endpoint allowing the frontend to simulate arbitrary
    or unsaved rules in real time.
    """
    try:
        result = SalaryEngineService.calculate_salary_structure(
            rules=payload.rules,
            contract_wage=payload.contract_wage,
            days_in_period=payload.days_in_period,
            worked_days=payload.worked_days,
            paid_leave_days=payload.paid_leave_days,
            unpaid_leave_days=payload.unpaid_leave_days,
        )
        return SalaryPreviewResponse(**result)
    except (FormulaEvaluationError, SalaryEngineException) as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Rule calculation error: {str(e)}"
        )

