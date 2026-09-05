import enum
from datetime import datetime, date, time
from typing import Optional, List
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, Time, 
    ForeignKey, Text, Enum as SQLEnum, JSON, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.db.session import Base

# Enums
class UserRole(str, enum.Enum):
    EMPLOYEE = "Employee"
    HR_MANAGER = "HR Manager"
    HR_PAYROLL_USER = "HR Payroll User"
    HR_PAYROLL_MANAGER = "HR Payroll Manager"
    ADMIN = "Admin"

class EmployeeStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"

class ContractStatus(str, enum.Enum):
    DRAFT = "draft"
    RUNNING = "running"
    EXPIRED = "expired"
    TERMINATED = "terminated"

class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    CHECKED_IN = "checked_in"
    PARTIAL = "partial"
    LATE = "late"
    OVERTIME = "overtime"
    ABSENT = "absent"
    INCOMPLETE = "incomplete"
    ON_LEAVE = "on_leave"

class LeaveUnit(str, enum.Enum):
    DAYS = "days"
    HOURS = "hours"

class LeaveRequestStatus(str, enum.Enum):
    DRAFT = "draft"
    TO_APPROVE = "to_approve"
    APPROVED = "approved"
    REFUSED = "refused"
    CANCELLED = "cancelled"

class AllocationStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    REFUSED = "refused"

class RuleCategory(str, enum.Enum):
    BASIC = "Basic"
    ALLOWANCE = "Allowance"
    GROSS = "Gross"
    DEDUCTION = "Deduction"
    EMPLOYER_CONTRIBUTION = "Employer Contribution"
    NET = "Net"

class ComputationType(str, enum.Enum):
    FIXED = "fixed"
    PERCENTAGE = "percentage"
    FORMULA = "formula"

class PayrunStatus(str, enum.Enum):
    DRAFT = "draft"
    READY = "ready"
    PROCESSING = "processing"
    REVIEW = "review"
    FINALIZED = "finalized"
    FAILED = "failed"
    CANCELLED = "cancelled"
    # Legacy / alias
    COMPUTED = "computed"
    VALIDATED = "validated"
    PAID = "paid"

class PayrunEmployeeStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    SKIPPED = "skipped"
    EXCLUDED = "excluded"

class PayslipStatus(str, enum.Enum):
    DRAFT = "draft"
    COMPUTED = "computed"
    REVIEW = "review"
    CONFIRMED = "confirmed"
    VALIDATED = "validated"
    FINALIZED = "finalized"
    PAID = "paid"
    CANCELLED = "cancelled"


# ==========================================
# 1. User Model
# ==========================================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    username = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.EMPLOYEE.value, nullable=False)
    is_active = Column(Boolean, default=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="user", uselist=False, foreign_keys=[employee_id])


# ==========================================
# 2. Employee Master Model
# ==========================================
class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False, index=True)
    work_email = Column(String(255), unique=True, index=True, nullable=False)
    phone = Column(String(50), nullable=True)
    department = Column(String(100), nullable=False, index=True)
    job_position = Column(String(100), nullable=False)
    manager_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    working_schedule_id = Column(Integer, ForeignKey("working_schedules.id", ondelete="SET NULL"), nullable=True)
    company = Column(String(100), default="PeoplePay360 Inc.")
    work_location = Column(String(100), default="Headquarters")
    employee_type = Column(String(50), default="Full-Time")  # Full-Time, Part-Time, Contractor, Intern
    status = Column(String(50), default=EmployeeStatus.ACTIVE.value)
    avatar_url = Column(String(500), nullable=True)
    
    # Financial details for Payroll Validation
    bank_name = Column(String(100), nullable=True)
    bank_account_no = Column(String(100), nullable=True)
    ifsc_code = Column(String(50), nullable=True)
    pan_no = Column(String(50), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="employee", uselist=False, foreign_keys="[User.employee_id]")
    manager = relationship("Employee", remote_side=[id], backref="subordinates")
    working_schedule = relationship("WorkingSchedule", back_populates="employees")
    contracts = relationship("Contract", back_populates="employee", cascade="all, delete-orphan")
    attendance_records = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    time_off_requests = relationship("TimeOffRequest", back_populates="employee", cascade="all, delete-orphan", foreign_keys="[TimeOffRequest.employee_id]")
    time_off_allocations = relationship("TimeOffAllocation", back_populates="employee", cascade="all, delete-orphan", foreign_keys="[TimeOffAllocation.employee_id]")
    payslips = relationship("Payslip", back_populates="employee", cascade="all, delete-orphan")


# ==========================================
# 3. Contract Management Model
# ==========================================
class Contract(Base):
    __tablename__ = "contracts"

    id = Column(Integer, primary_key=True, index=True)
    contract_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    department = Column(String(100), nullable=True)
    job_position = Column(String(100), nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)  # Null means Open-ended
    wage_per_month = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default=ContractStatus.DRAFT.value)
    working_schedule_id = Column(Integer, ForeignKey("working_schedules.id", ondelete="SET NULL"), nullable=True)
    salary_structure_id = Column(Integer, ForeignKey("salary_structures.id", ondelete="RESTRICT"), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="contracts")
    working_schedule = relationship("WorkingSchedule")
    salary_structure = relationship("SalaryStructure", back_populates="contracts")
    payslips = relationship("Payslip", back_populates="contract")


# ==========================================
# 4. Working Schedules Model
# ==========================================
class WorkingSchedule(Base):
    __tablename__ = "working_schedules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    company = Column(String(100), default="PeoplePay360 Inc.")
    timezone = Column(String(50), default="Asia/Kolkata")
    days_per_week = Column(Integer, default=5)
    hours_per_week = Column(Float, default=40.0)
    status = Column(String(50), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    days = relationship("WorkingScheduleDay", back_populates="schedule", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="working_schedule")


class WorkingScheduleDay(Base):
    __tablename__ = "working_schedule_days"

    id = Column(Integer, primary_key=True, index=True)
    schedule_id = Column(Integer, ForeignKey("working_schedules.id", ondelete="CASCADE"), nullable=False)
    day_of_week = Column(String(20), nullable=False)  # Monday, Tuesday, etc.
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    break_hours = Column(Float, default=1.0)
    daily_hours = Column(Float, default=8.0)

    schedule = relationship("WorkingSchedule", back_populates="days")


# ==========================================
# 5. Attendance Model
# ==========================================
class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False, default=date.today)
    check_in = Column(DateTime, nullable=True)
    check_out = Column(DateTime, nullable=True)
    worked_hours = Column(Float, default=0.0)
    expected_hours = Column(Float, default=8.0)
    overtime_hours = Column(Float, default=0.0)
    late_minutes = Column(Integer, default=0)
    status = Column(String(50), default=AttendanceStatus.PRESENT.value)
    is_manual_edit = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="attendance_records")


# ==========================================
# 6. Time Off & Allocation Models
# ==========================================
class TimeOffType(Base):
    __tablename__ = "time_off_types"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # Paid Time Off, Sick Leave, Comp Off, Unpaid Leave
    unit = Column(String(20), default=LeaveUnit.DAYS.value)  # days, hours
    requires_allocation = Column(Boolean, default=True)
    is_unpaid = Column(Boolean, default=False)
    approval_type = Column(String(50), default="hr")  # no_approval, manager, hr, both
    payroll_behavior = Column(String(50), default="paid")  # paid, unpaid, not_applicable
    active = Column(Boolean, default=True)
    color = Column(String(20), default="#017E84")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    allocations = relationship("TimeOffAllocation", back_populates="time_off_type")
    requests = relationship("TimeOffRequest", back_populates="time_off_type")


class TimeOffAllocation(Base):
    __tablename__ = "time_off_allocations"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    time_off_type_id = Column(Integer, ForeignKey("time_off_types.id", ondelete="RESTRICT"), nullable=False)
    allocated_amount = Column(Float, default=0.0)
    taken_amount = Column(Float, default=0.0)
    remaining_amount = Column(Float, default=0.0)
    status = Column(String(50), default=AllocationStatus.DRAFT.value)
    approver_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    validity_start = Column(Date, nullable=True)
    validity_end = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    refused_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="time_off_allocations", foreign_keys=[employee_id])
    approver = relationship("Employee", foreign_keys=[approver_id])
    time_off_type = relationship("TimeOffType", back_populates="allocations")
    usages = relationship("TimeOffAllocationUsage", back_populates="allocation", cascade="all, delete-orphan")


class TimeOffRequest(Base):
    __tablename__ = "time_off_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    time_off_type_id = Column(Integer, ForeignKey("time_off_types.id", ondelete="RESTRICT"), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    duration = Column(Float, nullable=False)
    status = Column(String(50), default=LeaveRequestStatus.DRAFT.value)
    reason = Column(Text, nullable=True)
    approval_reason = Column(Text, nullable=True)
    refusal_reason = Column(Text, nullable=True)
    approver_id = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    allocation_id = Column(Integer, ForeignKey("time_off_allocations.id", ondelete="SET NULL"), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    refused_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    employee = relationship("Employee", back_populates="time_off_requests", foreign_keys=[employee_id])
    approver = relationship("Employee", foreign_keys=[approver_id])
    time_off_type = relationship("TimeOffType", back_populates="requests")
    allocation = relationship("TimeOffAllocation")
    usages = relationship("TimeOffAllocationUsage", back_populates="request", cascade="all, delete-orphan")


class TimeOffAllocationUsage(Base):
    __tablename__ = "time_off_allocation_usages"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(Integer, ForeignKey("time_off_requests.id", ondelete="CASCADE"), nullable=False)
    allocation_id = Column(Integer, ForeignKey("time_off_allocations.id", ondelete="CASCADE"), nullable=False)
    amount_used = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    request = relationship("TimeOffRequest", back_populates="usages")
    allocation = relationship("TimeOffAllocation", back_populates="usages")


# ==========================================
# 7. Salary Structures & Rules Models
# ==========================================
class SalaryStructure(Base):
    __tablename__ = "salary_structures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)  # Standard Monthly Salary, Executive, etc.
    code = Column(String(50), unique=True, nullable=False)
    company = Column(String(100), default="PeoplePay360 Inc.")
    pay_frequency = Column(String(50), default="monthly")  # monthly, weekly, bi-weekly, semi-monthly
    description = Column(Text, nullable=True)
    effective_from = Column(Date, nullable=True)
    effective_to = Column(Date, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    rules = relationship("SalaryRule", back_populates="structure", cascade="all, delete-orphan", order_by="SalaryRule.sequence")
    contracts = relationship("Contract", back_populates="salary_structure")
    payruns = relationship("Payrun", back_populates="salary_structure")


class SalaryRule(Base):
    __tablename__ = "salary_rules"

    id = Column(Integer, primary_key=True, index=True)
    structure_id = Column(Integer, ForeignKey("salary_structures.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    code = Column(String(50), nullable=False)  # BASIC, HRA, STD, BONUS, GROSS, PF, PT, NET
    category = Column(String(50), default=RuleCategory.BASIC.value)
    sequence = Column(Integer, default=10, nullable=False)
    computation_type = Column(String(50), default=ComputationType.FIXED.value)  # fixed, percentage, formula
    
    # Computation config
    fixed_amount = Column(Float, default=0.0)
    percentage_base_code = Column(String(50), nullable=True)  # e.g., 'BASIC'
    percentage_rate = Column(Float, default=0.0)  # e.g., 20.0 for 20%
    formula_expression = Column(Text, nullable=True)  # e.g., 'BASIC + HRA + STD'
    
    # Condition & display flags
    condition_type = Column(String(50), default="always")  # always, conditional
    condition_formula = Column(Text, nullable=True)  # e.g., 'unpaid_leave_days > 0'
    appears_on_payslip = Column(Boolean, default=True)
    employer_cost_flag = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    structure = relationship("SalaryStructure", back_populates="rules")


# ==========================================
# 8. Payrun & Payslip Models
# ==========================================
class Payrun(Base):
    __tablename__ = "payruns"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)  # September 2026 Payroll
    company = Column(String(100), default="PeoplePay360 Inc.", nullable=False)
    salary_structure_id = Column(Integer, ForeignKey("salary_structures.id", ondelete="RESTRICT"), nullable=True)
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    employee_type = Column(String(50), default="All")
    status = Column(String(50), default=PayrunStatus.DRAFT.value)
    
    total_employees = Column(Integer, default=0)
    successful_employees = Column(Integer, default=0)
    failed_employees = Column(Integer, default=0)
    skipped_employees = Column(Integer, default=0)
    excluded_employees = Column(Integer, default=0)
    
    # Backward compatible fields
    employee_count = Column(Integer, default=0)
    warning_count = Column(Integer, default=0)
    total_net_paid = Column(Float, default=0.0)
    
    total_gross = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    total_net = Column(Float, default=0.0)
    total_employer_contributions = Column(Float, default=0.0)
    total_employer_cost = Column(Float, default=0.0)
    
    created_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    finalized_at = Column(DateTime, nullable=True)

    salary_structure = relationship("SalaryStructure", back_populates="payruns")
    payrun_employees = relationship("PayrunEmployee", back_populates="payrun", cascade="all, delete-orphan")
    payslips = relationship("Payslip", back_populates="payrun", cascade="all, delete-orphan")
    warnings = relationship("PayrollWarning", back_populates="payrun", cascade="all, delete-orphan")
    created_by_user = relationship("User", foreign_keys=[created_by_id])


class PayrunEmployee(Base):
    __tablename__ = "payrun_employees"

    id = Column(Integer, primary_key=True, index=True)
    payrun_id = Column(Integer, ForeignKey("payruns.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default=PayrunEmployeeStatus.PENDING.value)
    excluded = Column(Boolean, default=False)
    exclusion_reason = Column(String(255), nullable=True)
    
    worked_days = Column(Float, default=0.0)
    unpaid_leave_days = Column(Float, default=0.0)
    
    gross_salary = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    net_salary = Column(Float, default=0.0)
    employer_contribution_total = Column(Float, default=0.0)
    employer_cost = Column(Float, default=0.0)
    
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    
    calculation_trace = Column(JSON, nullable=True)
    components = Column(JSON, nullable=True)
    warnings = Column(JSON, nullable=True)
    
    payslip_id = Column(Integer, ForeignKey("payslips.id", ondelete="SET NULL"), nullable=True)
    processed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payrun = relationship("Payrun", back_populates="payrun_employees")
    employee = relationship("Employee")
    contract = relationship("Contract")
    payslip = relationship("Payslip")

    __table_args__ = (
        UniqueConstraint("payrun_id", "employee_id", name="uq_payrun_employee"),
    )


class Payslip(Base):
    __tablename__ = "payslips"

    id = Column(Integer, primary_key=True, index=True)
    payslip_number = Column(String(50), unique=True, index=True, nullable=False)
    payrun_id = Column(Integer, ForeignKey("payruns.id", ondelete="CASCADE"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    contract_id = Column(Integer, ForeignKey("contracts.id", ondelete="RESTRICT"), nullable=False)
    salary_structure_id = Column(Integer, ForeignKey("salary_structures.id", ondelete="RESTRICT"), nullable=False)
    company = Column(String(100), default="PeoplePay360 Inc.")
    
    period_start = Column(Date, nullable=False)
    period_end = Column(Date, nullable=False)
    status = Column(String(50), default=PayslipStatus.DRAFT.value)
    
    worked_days = Column(Float, default=0.0)
    unpaid_leave_days = Column(Float, default=0.0)
    basic_salary = Column(Float, default=0.0)
    total_earnings = Column(Float, default=0.0)
    gross_salary = Column(Float, default=0.0)
    total_deductions = Column(Float, default=0.0)
    net_salary = Column(Float, default=0.0)
    total_employer_contributions = Column(Float, default=0.0)
    total_employer_cost = Column(Float, default=0.0)
    
    # Snapshots & Trace
    employee_snapshot = Column(JSON, nullable=True)
    contract_snapshot = Column(JSON, nullable=True)
    attendance_snapshot = Column(JSON, nullable=True)
    time_off_snapshot = Column(JSON, nullable=True)
    calculation_trace = Column(JSON, nullable=True)
    
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)
    
    computed_at = Column(DateTime, nullable=True)
    finalized_at = Column(DateTime, nullable=True)
    pdf_path = Column(String(500), nullable=True)
    email_sent = Column(Boolean, default=False)
    email_sent_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    payrun = relationship("Payrun", back_populates="payslips")
    employee = relationship("Employee", back_populates="payslips")
    contract = relationship("Contract", back_populates="payslips")
    salary_structure = relationship("SalaryStructure")
    lines = relationship("PayslipLine", back_populates="payslip", cascade="all, delete-orphan", order_by="PayslipLine.sequence")
    warnings = relationship("PayrollWarning", back_populates="payslip", cascade="all, delete-orphan")


class PayslipLine(Base):
    __tablename__ = "payslip_lines"

    id = Column(Integer, primary_key=True, index=True)
    payslip_id = Column(Integer, ForeignKey("payslips.id", ondelete="CASCADE"), nullable=False)
    rule_id = Column(Integer, ForeignKey("salary_rules.id", ondelete="SET NULL"), nullable=True)
    rule_name = Column(String(100), nullable=False)
    rule_code = Column(String(50), nullable=False)
    category = Column(String(50), nullable=False)
    sequence = Column(Integer, default=10)
    
    amount = Column(Float, default=0.0)
    quantity = Column(Float, default=1.0)
    rate = Column(Float, default=100.0)
    base_amount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    
    calculation_type = Column(String(50), nullable=True)
    calculation_expression = Column(Text, nullable=True)
    is_employer_contribution = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    payslip = relationship("Payslip", back_populates="lines")
    rule = relationship("SalaryRule")


class PayrollWarning(Base):
    __tablename__ = "payroll_warnings"

    id = Column(Integer, primary_key=True, index=True)
    payrun_id = Column(Integer, ForeignKey("payruns.id", ondelete="CASCADE"), nullable=False)
    payslip_id = Column(Integer, ForeignKey("payslips.id", ondelete="CASCADE"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=True)
    warning_type = Column(String(100), nullable=False)  # MISSING_BANK, DUPLICATE_PAYSLIP, EXPIRED_CONTRACT, UNPAID_LEAVE
    message = Column(Text, nullable=False)
    is_resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    payrun = relationship("Payrun", back_populates="warnings")
    payslip = relationship("Payslip", back_populates="warnings")
    employee = relationship("Employee")
