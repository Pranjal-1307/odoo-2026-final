from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    username: str
    role: str = "Employee"
    is_active: bool = True
    employee_id: Optional[int] = None

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str = Field(..., min_length=4)
    role: str = "Employee"
    is_active: bool = True
    employee_id: Optional[int] = None

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    username: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    employee_id: Optional[int] = None
    password: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: str

class UserStatusUpdate(BaseModel):
    is_active: bool

class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=4)

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    employee_name: Optional[str] = None
    last_login_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class UserListResponse(BaseModel):
    total: int
    users: List[UserResponse]
