from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_active_user
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.permissions import get_role_permissions, normalize_role
from app.models import User, Employee
from app.schemas.auth import (
    LoginRequest,
    TokenResponse,
    CurrentUserResponse,
    UserSummary,
    PasswordChangeRequest
)

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate user with email and password.
    Returns JWT access token and user profile.
    """
    # Normalize email to lowercase
    email = login_data.email.strip().lower()
    
    user = db.query(User).filter(User.email.ilike(email)).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive. Please contact system administrator.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login timestamp
    user.last_login_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    
    # Generate token
    token = create_access_token(
        subject=user.id,
        role=user.role,
        employee_id=user.employee_id
    )
    
    # Linked employee name
    employee_name = user.employee.name if user.employee else None
    
    user_summary = UserSummary(
        id=user.id,
        email=user.email,
        username=user.username,
        name=employee_name or user.username,
        role=user.role,
        is_active=user.is_active,
        employee_id=user.employee_id,
        employee_name=employee_name,
        last_login_at=user.last_login_at
    )
    
    role_perms = list(get_role_permissions(user.role))
    
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=user_summary,
        permissions=role_perms
    )

@router.get("/me", response_model=CurrentUserResponse)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get profile information and permissions for the currently authenticated user.
    """
    employee_name = current_user.employee.name if current_user.employee else None
    role_perms = list(get_role_permissions(current_user.role))
    
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        name=employee_name or current_user.username,
        role=current_user.role,
        is_active=current_user.is_active,
        employee_id=current_user.employee_id,
        employee_name=employee_name,
        last_login_at=current_user.last_login_at,
        permissions=role_perms
    )

@router.post("/change-password")
def change_password(
    data: PasswordChangeRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Allows the logged-in user to update their own password.
    """
    if not verify_password(data.old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect."
        )
    
    if len(data.new_password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 4 characters long."
        )
        
    current_user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    
    return {"status": "success", "message": "Password updated successfully."}

@router.post("/logout")
def logout(
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout endpoint acknowledging session termination.
    """
    return {"status": "success", "message": "Successfully logged out."}
