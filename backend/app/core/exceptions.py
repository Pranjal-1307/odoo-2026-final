"""
PeoplePay360 — Standardized Business Rule Exceptions and Error Codes (Module 13)
"""
from typing import Optional, Any, Dict
from fastapi import HTTPException, status


class BusinessRuleCode:
    # Identity & Access
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    
    # Employee Master
    EMPLOYEE_NOT_FOUND = "EMPLOYEE_NOT_FOUND"
    EMPLOYEE_INACTIVE = "EMPLOYEE_INACTIVE"
    EMPLOYEE_DUPLICATE = "EMPLOYEE_DUPLICATE"
    COMPANY_MISMATCH = "COMPANY_MISMATCH"
    
    # Contract Management
    CONTRACT_NOT_FOUND = "CONTRACT_NOT_FOUND"
    CONTRACT_NOT_ACTIVE = "CONTRACT_NOT_ACTIVE"
    CONTRACT_OVERLAP = "CONTRACT_OVERLAP"
    NO_APPLICABLE_CONTRACT = "NO_APPLICABLE_CONTRACT"
    MISSING_ACTIVE_CONTRACT = "MISSING_ACTIVE_CONTRACT"
    
    # Working Schedule
    SCHEDULE_NOT_FOUND = "SCHEDULE_NOT_FOUND"
    SCHEDULE_NOT_ASSIGNED = "SCHEDULE_NOT_ASSIGNED"
    
    # Attendance & Time Off
    ATTENDANCE_CONFLICT = "ATTENDANCE_CONFLICT"
    ATTENDANCE_INCOMPLETE = "ATTENDANCE_INCOMPLETE"
    TIME_OFF_CONFLICT = "TIME_OFF_CONFLICT"
    INSUFFICIENT_LEAVE_BALANCE = "INSUFFICIENT_LEAVE_BALANCE"
    
    # Salary Structures & Rules Engine
    SALARY_STRUCTURE_MISSING = "SALARY_STRUCTURE_MISSING"
    SALARY_STRUCTURE_INACTIVE = "SALARY_STRUCTURE_INACTIVE"
    SALARY_RULE_ERROR = "SALARY_RULE_ERROR"
    CIRCULAR_DEPENDENCY = "CIRCULAR_DEPENDENCY"
    MISSING_PERCENTAGE_BASE = "MISSING_PERCENTAGE_BASE"
    DIVISION_BY_ZERO = "DIVISION_BY_ZERO"
    
    # Payrun
    PAYRUN_NOT_FOUND = "PAYRUN_NOT_FOUND"
    PAYRUN_DUPLICATE = "PAYRUN_DUPLICATE"
    PAYRUN_INVALID_STATUS = "PAYRUN_INVALID_STATUS"
    PAYRUN_LOCKED = "PAYRUN_LOCKED"
    
    # Payslip
    PAYSLIP_NOT_FOUND = "PAYSLIP_NOT_FOUND"
    PAYSLIP_DUPLICATE = "PAYSLIP_DUPLICATE"
    PAYSLIP_FINALIZED = "PAYSLIP_FINALIZED"
    PAYSLIP_LOCKED = "PAYSLIP_LOCKED"
    
    # Output & Delivery
    PDF_GENERATION_FAILED = "PDF_GENERATION_FAILED"
    EMAIL_DELIVERY_FAILED = "EMAIL_DELIVERY_FAILED"


class BusinessRuleException(HTTPException):
    """
    Structured Business Rule Exception conforming to PeoplePay360 error specification.
    Produces:
    {
        "success": false,
        "code": "CONTRACT_OVERLAP",
        "message": "Employee already has a running contract in this period.",
        "entity_type": "contract",
        "entity_id": 123
    }
    """
    def __init__(
        self,
        message: str,
        code: str = BusinessRuleCode.SALARY_RULE_ERROR,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        entity_type: Optional[str] = None,
        entity_id: Optional[int] = None,
        details: Optional[Dict[str, Any]] = None,
    ):
        detail_dict = {
            "success": False,
            "code": code,
            "message": message,
            "entity_type": entity_type,
            "entity_id": entity_id,
        }
        if details:
            detail_dict["details"] = details
        super().__init__(status_code=status_code, detail=detail_dict)
        self.message = message
        self.code = code
        self.entity_type = entity_type
        self.entity_id = entity_id
