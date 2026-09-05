from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional, List, Set
from datetime import datetime

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    username: str
    name: Optional[str] = None
    role: str
    is_active: bool
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    last_login_at: Optional[datetime] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserSummary
    permissions: List[str] = []

class CurrentUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    username: str
    name: Optional[str] = None
    role: str
    is_active: bool
    employee_id: Optional[int] = None
    employee_name: Optional[str] = None
    last_login_at: Optional[datetime] = None
    permissions: List[str] = []

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str
