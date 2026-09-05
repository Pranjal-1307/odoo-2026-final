from typing import Generator, Optional, List, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.permissions import has_permission, normalize_role
from app.db.session import SessionLocal
from app.models import User

# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(
    auth: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    if not auth or not auth.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = auth.credentials
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate token or token has expired.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User belonging to this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is inactive. Please contact system administrator."
        )
    return current_user

def require_roles(*allowed_roles: str) -> Callable:
    """Dependency factory to require one of the specified roles. Admin always passes."""
    normalized_allowed = {normalize_role(r) for r in allowed_roles}
    normalized_allowed.add("Admin")

    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = normalize_role(current_user.role)
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}"
            )
        return current_user

    return role_checker

def require_permissions(*required_perms: str) -> Callable:
    """Dependency factory to require all of the specified permissions."""
    def permission_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = normalize_role(current_user.role)
        for perm in required_perms:
            if not has_permission(user_role, perm):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Access denied. Missing permission: '{perm}'"
                )
        return current_user

    return permission_checker

def validate_employee_ownership(current_user: User, target_employee_id: int) -> bool:
    """
    Validates if current_user has access to target_employee_id records.
    Admin / HR roles have access to all employees;
    Employees only have access to their own linked employee_id.
    """
    user_role = normalize_role(current_user.role)
    if user_role in {"Admin", "HR Manager", "HR Payroll Manager", "HR Payroll User"}:
        return True
    
    if current_user.employee_id is not None and current_user.employee_id == target_employee_id:
        return True
        
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="You do not have permission to access another employee's record."
    )
