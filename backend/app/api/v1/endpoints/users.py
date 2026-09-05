from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import get_db, get_current_active_user, require_roles, require_permissions
from app.core.permissions import Permissions, normalize_role
from app.core.security import get_password_hash
from app.models import User, Employee, UserRole
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserRoleUpdate,
    UserStatusUpdate,
    PasswordReset,
    UserResponse,
    UserListResponse
)

router = APIRouter()

ALLOWED_ROLES = {
    "Employee",
    "HR Manager",
    "HR Payroll User",
    "HR Payroll Manager",
    "Admin"
}

@router.get("", response_model=UserListResponse)
def list_users(
    search: Optional[str] = Query(None, description="Search by email, username or employee name"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db)
):
    """
    List all system users. Admin only.
    Supports search, role and active status filtering, plus pagination.
    """
    query = db.query(User).outerjoin(Employee, User.employee_id == Employee.id)
    
    if search:
        search_term = f"%{search.strip()}%"
        query = query.filter(
            or_(
                User.email.ilike(search_term),
                User.username.ilike(search_term),
                Employee.name.ilike(search_term)
            )
        )
        
    if role:
        norm_role = normalize_role(role)
        query = query.filter(User.role == norm_role)
        
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
        
    total = query.count()
    users = query.order_by(User.id.asc()).offset(skip).limit(limit).all()
    
    result_users = []
    for u in users:
        emp_name = u.employee.name if u.employee else None
        result_users.append(
            UserResponse(
                id=u.id,
                email=u.email,
                username=u.username,
                role=u.role,
                is_active=u.is_active,
                employee_id=u.employee_id,
                employee_name=emp_name,
                last_login_at=u.last_login_at,
                created_at=u.created_at,
                updated_at=u.updated_at
            )
        )
        
    return UserListResponse(total=total, users=result_users)

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_in: UserCreate,
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db)
):
    """
    Create a new user account. Admin only.
    """
    # Normalize email & role
    email = user_in.email.strip().lower()
    norm_role = normalize_role(user_in.role)
    if norm_role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles: {', '.join(ALLOWED_ROLES)}"
        )
        
    # Check duplicate email
    if db.query(User).filter(User.email.ilike(email)).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"User with email '{email}' already exists."
        )
        
    # Check duplicate username
    if db.query(User).filter(User.username.ilike(user_in.username.strip())).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user_in.username}' is already taken."
        )
        
    # Validate linked employee if provided
    if user_in.employee_id:
        emp = db.query(Employee).filter(Employee.id == user_in.employee_id).first()
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Linked employee with ID {user_in.employee_id} does not exist."
            )
        # Check if employee is already linked to another user
        existing_emp_user = db.query(User).filter(User.employee_id == user_in.employee_id).first()
        if existing_emp_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee '{emp.name}' is already linked to user '{existing_emp_user.email}'."
            )

    new_user = User(
        email=email,
        username=user_in.username.strip(),
        hashed_password=get_password_hash(user_in.password),
        role=norm_role,
        is_active=user_in.is_active,
        employee_id=user_in.employee_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    emp_name = new_user.employee.name if new_user.employee else None
    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        username=new_user.username,
        role=new_user.role,
        is_active=new_user.is_active,
        employee_id=new_user.employee_id,
        employee_name=emp_name,
        last_login_at=new_user.last_login_at,
        created_at=new_user.created_at,
        updated_at=new_user.updated_at
    )

@router.get("/{user_id}", response_model=UserResponse)
def get_user_detail(
    user_id: int,
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific user. Admin only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    emp_name = user.employee.name if user.employee else None
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        employee_id=user.employee_id,
        employee_name=emp_name,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db)
):
    """
    Update user information. Admin only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    if user_in.email is not None:
        clean_email = user_in.email.strip().lower()
        # Check uniqueness if changed
        existing = db.query(User).filter(User.email.ilike(clean_email), User.id != user_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email '{clean_email}' is already in use by another user."
            )
        user.email = clean_email
        
    if user_in.username is not None:
        clean_username = user_in.username.strip()
        existing = db.query(User).filter(User.username.ilike(clean_username), User.id != user_id).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username '{clean_username}' is already in use."
            )
        user.username = clean_username
        
    if user_in.role is not None:
        norm_role = normalize_role(user_in.role)
        if norm_role not in ALLOWED_ROLES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Allowed roles: {', '.join(ALLOWED_ROLES)}"
            )
        user.role = norm_role
        
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
        
    if user_in.employee_id is not None:
        if user_in.employee_id > 0:
            emp = db.query(Employee).filter(Employee.id == user_in.employee_id).first()
            if not emp:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Employee with ID {user_in.employee_id} does not exist."
                )
            existing_link = db.query(User).filter(User.employee_id == user_in.employee_id, User.id != user_id).first()
            if existing_link:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Employee '{emp.name}' is already linked to user '{existing_link.email}'."
                )
            user.employee_id = user_in.employee_id
        else:
            user.employee_id = None
            
    if user_in.password:
        if len(user_in.password) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 4 characters long."
            )
        user.hashed_password = get_password_hash(user_in.password)
        
    db.commit()
    db.refresh(user)
    
    emp_name = user.employee.name if user.employee else None
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        employee_id=user.employee_id,
        employee_name=emp_name,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: int,
    role_data: UserRoleUpdate,
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db)
):
    """
    Change user role. Admin only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    norm_role = normalize_role(role_data.role)
    if norm_role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Allowed roles: {', '.join(ALLOWED_ROLES)}"
        )
        
    user.role = norm_role
    db.commit()
    db.refresh(user)
    
    emp_name = user.employee.name if user.employee else None
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        employee_id=user.employee_id,
        employee_name=emp_name,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

@router.patch("/{user_id}/status", response_model=UserResponse)
def toggle_user_status(
    user_id: int,
    status_data: UserStatusUpdate,
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db)
):
    """
    Activate or deactivate user account. Admin only.
    Preserves all historical employee and payroll data.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    # Prevent self-deactivation of current Admin account
    if user.id == current_user.id and not status_data.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate your own administrative account."
        )
        
    user.is_active = status_data.is_active
    db.commit()
    db.refresh(user)
    
    emp_name = user.employee.name if user.employee else None
    return UserResponse(
        id=user.id,
        email=user.email,
        username=user.username,
        role=user.role,
        is_active=user.is_active,
        employee_id=user.employee_id,
        employee_name=emp_name,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
        updated_at=user.updated_at
    )

@router.post("/{user_id}/reset-password")
def admin_reset_password(
    user_id: int,
    data: PasswordReset,
    current_user: User = Depends(require_roles("Admin")),
    db: Session = Depends(get_db)
):
    """
    Reset password for a user. Admin only.
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
        
    if len(data.new_password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 4 characters long."
        )
        
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {"status": "success", "message": f"Password for '{user.email}' reset successfully."}
