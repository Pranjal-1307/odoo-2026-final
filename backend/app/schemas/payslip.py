from datetime import date, datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PayslipLineOut(BaseModel):
    id: int
    payslip_id: int
    rule_id: Optional[int] = None
    rule_name: str
    rule_code: str
    category: str
    sequence: int = 10
    amount: float = 0.0
    quantity: float = 1.0
    rate: float = 100.0
    base_amount: float = 0.0
    total: float = 0.0
    calculation_type: Optional[str] = None
    calculation_expression: Optional[str] = None
    is_employer_contribution: bool = False
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class PayslipCreate(BaseModel):
    employee_id: int = Field(..., description="ID of employee")
    payrun_id: Optional[int] = Field(None, description="Optional associated payrun ID")
    contract_id: Optional[int] = Field(None, description="Optional explicit contract ID")
    period_start: date = Field(..., description="Start of pay period (YYYY-MM-DD)")
    period_end: date = Field(..., description="End of pay period (YYYY-MM-DD)")
    auto_compute: bool = Field(True, description="Automatically compute lines upon creation")


class PayslipOut(BaseModel):
    id: int
    payslip_number: str
    payrun_id: Optional[int] = None
    employee_id: int
    contract_id: int
    salary_structure_id: int
    company: str = "PeoplePay360 Inc."
    
    period_start: date
    period_end: date
    status: str
    
    worked_days: float = 0.0
    unpaid_leave_days: float = 0.0
    basic_salary: float = 0.0
    total_earnings: float = 0.0
    gross_salary: float = 0.0
    total_deductions: float = 0.0
    net_salary: float = 0.0
    total_employer_contributions: float = 0.0
    total_employer_cost: float = 0.0
    
    # Snapshots & Diagnostics
    employee_snapshot: Optional[Dict[str, Any]] = None
    contract_snapshot: Optional[Dict[str, Any]] = None
    attendance_snapshot: Optional[Dict[str, Any]] = None
    time_off_snapshot: Optional[Dict[str, Any]] = None
    calculation_trace: Optional[List[Dict[str, Any]]] = None
    
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    
    computed_at: Optional[datetime] = None
    finalized_at: Optional[datetime] = None
    pdf_path: Optional[str] = None
    email_sent: bool = False
    email_sent_at: Optional[datetime] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Nested relations
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    job_position: Optional[str] = None
    structure_name: Optional[str] = None
    payrun_name: Optional[str] = None
    
    lines: List[PayslipLineOut] = []

    class Config:
        from_attributes = True


class PayslipSummaryMetrics(BaseModel):
    total_payslips: int = 0
    draft_payslips: int = 0
    computed_payslips: int = 0
    validated_payslips: int = 0
    finalized_payslips: int = 0
    cancelled_payslips: int = 0
    total_gross: float = 0.0
    total_deductions: float = 0.0
    total_net: float = 0.0
    total_employer_cost: float = 0.0
