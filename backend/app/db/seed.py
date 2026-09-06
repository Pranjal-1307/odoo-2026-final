import sys
import os

# Ensure UTF-8 output even on Windows terminals with non-UTF8 locale
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from datetime import datetime, date, time, timedelta
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import (
    User, Employee, UserRole, EmployeeStatus,
    WorkingSchedule, WorkingScheduleDay,
    SalaryStructure, SalaryRule, RuleCategory, ComputationType,
    Contract, ContractStatus,
    Attendance, AttendanceStatus,
    TimeOffType, TimeOffAllocation, TimeOffRequest,
    Payrun, PayrunEmployee, Payslip, PayslipLine, PayrollWarning,
    PayslipDocument, PayslipEmailLog, AuditLog,
    PayslipStatus, PayrunStatus, PayrunEmployeeStatus, LeaveRequestStatus, AllocationStatus
)
from app.services.salary_engine_service import SalaryEngineService
from app.services.payslip_service import PayslipService
from app.services.pdf_service import PayslipPDFService

COMPANY_NAME = "PeoplePay Technologies Pvt. Ltd."
COMPANY_DISPLAY = "PeoplePay Technologies"

def migrate_columns():
    """Ensures newly added columns in models are created in existing SQLite database."""
    try:
        with engine.connect() as conn:
            # Check salary_structures table
            existing_cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(salary_structures)").fetchall()}
            cols_to_add = [
                ("company", f"VARCHAR(100) DEFAULT '{COMPANY_NAME}'"),
                ("pay_frequency", "VARCHAR(50) DEFAULT 'monthly'"),
                ("description", "TEXT"),
                ("effective_from", "DATE"),
                ("effective_to", "DATE"),
            ]
            for col, col_type in cols_to_add:
                if col not in existing_cols:
                    conn.exec_driver_sql(f"ALTER TABLE salary_structures ADD COLUMN {col} {col_type}")

            # Check salary_rules table
            rule_cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(salary_rules)").fetchall()}
            rule_cols_to_add = [
                ("condition_type", "VARCHAR(50) DEFAULT 'always'"),
                ("condition_formula", "TEXT"),
                ("appears_on_payslip", "BOOLEAN DEFAULT 1"),
                ("employer_cost_flag", "BOOLEAN DEFAULT 0"),
                ("description", "TEXT"),
            ]
            for col, col_type in rule_cols_to_add:
                if col not in rule_cols:
                    conn.exec_driver_sql(f"ALTER TABLE salary_rules ADD COLUMN {col} {col_type}")

            # Check payruns table
            payrun_cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(payruns)").fetchall()}
            payrun_cols_to_add = [
                ("company", f"VARCHAR(100) DEFAULT '{COMPANY_NAME}'"),
                ("total_employees", "INTEGER DEFAULT 0"),
                ("successful_employees", "INTEGER DEFAULT 0"),
                ("failed_employees", "INTEGER DEFAULT 0"),
                ("skipped_employees", "INTEGER DEFAULT 0"),
                ("excluded_employees", "INTEGER DEFAULT 0"),
                ("total_gross", "FLOAT DEFAULT 0.0"),
                ("total_deductions", "FLOAT DEFAULT 0.0"),
                ("total_net", "FLOAT DEFAULT 0.0"),
                ("total_employer_contributions", "FLOAT DEFAULT 0.0"),
                ("total_employer_cost", "FLOAT DEFAULT 0.0"),
                ("created_by_id", "INTEGER"),
                ("processed_at", "DATETIME"),
                ("finalized_at", "DATETIME"),
            ]
            for col, col_type in payrun_cols_to_add:
                if col not in payrun_cols:
                    conn.exec_driver_sql(f"ALTER TABLE payruns ADD COLUMN {col} {col_type}")

            # Check payslips table
            payslip_cols = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(payslips)").fetchall()}
            payslip_cols_to_add = [
                ("has_pdf", "BOOLEAN DEFAULT 0"),
                ("pdf_generated_at", "DATETIME"),
                ("email_sent", "BOOLEAN DEFAULT 0"),
                ("email_sent_at", "DATETIME"),
            ]
            for col, col_type in payslip_cols_to_add:
                if col not in payslip_cols:
                    conn.exec_driver_sql(f"ALTER TABLE payslips ADD COLUMN {col} {col_type}")

            conn.commit()
    except Exception as e:
        print(f"Migration notice: {e}")


def seed_db():
    Base.metadata.create_all(bind=engine)
    migrate_columns()
    db = SessionLocal()

    try:
        print("🌱 Starting PeoplePay360 Comprehensive Seed Process (Module 15)...")

        # =========================================================================
        # 1. WORKING SCHEDULES (Section 14 & 15)
        # =========================================================================
        schedules_spec = [
            {
                "name": "Standard 5-Day Week",
                "company": COMPANY_NAME,
                "timezone": "Asia/Kolkata",
                "days_per_week": 5,
                "hours_per_week": 40.0,
                "status": "active",
                "days": [
                    {"day": d, "start": time(9, 0), "end": time(18, 0), "break": 1.0, "hours": 8.0}
                    for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                ]
            },
            {
                "name": "Flexible Working Hours",
                "company": COMPANY_NAME,
                "timezone": "Asia/Kolkata",
                "days_per_week": 5,
                "hours_per_week": 40.0,
                "status": "active",
                "days": [
                    {"day": d, "start": time(8, 0), "end": time(19, 0), "break": 1.0, "hours": 8.0}
                    for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                ]
            },
            {
                "name": "Operations Shift",
                "company": COMPANY_NAME,
                "timezone": "Asia/Kolkata",
                "days_per_week": 6,
                "hours_per_week": 48.0,
                "status": "active",
                "days": [
                    {"day": d, "start": time(10, 0), "end": time(19, 0), "break": 1.0, "hours": 8.0}
                    for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
                ]
            },
            {
                "name": "Leadership Flexible Schedule",
                "company": COMPANY_NAME,
                "timezone": "Asia/Kolkata",
                "days_per_week": 5,
                "hours_per_week": 40.0,
                "status": "active",
                "days": [
                    {"day": d, "start": time(9, 0), "end": time(17, 0), "break": 0.0, "hours": 8.0}
                    for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                ]
            },
            # Backward compatibility schedule for tests
            {
                "name": "40 Hours / Week",
                "company": COMPANY_NAME,
                "timezone": "Asia/Kolkata",
                "days_per_week": 5,
                "hours_per_week": 40.0,
                "status": "active",
                "days": [
                    {"day": d, "start": time(9, 0), "end": time(18, 0), "break": 1.0, "hours": 8.0}
                    for d in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                ]
            }
        ]

        sched_map = {}
        for s_info in schedules_spec:
            sched = db.query(WorkingSchedule).filter(WorkingSchedule.name == s_info["name"]).first()
            if not sched:
                sched = WorkingSchedule(
                    name=s_info["name"],
                    company=s_info["company"],
                    timezone=s_info["timezone"],
                    days_per_week=s_info["days_per_week"],
                    hours_per_week=s_info["hours_per_week"],
                    status=s_info["status"]
                )
                db.add(sched)
                db.flush()
                for d in s_info["days"]:
                    db.add(WorkingScheduleDay(
                        schedule_id=sched.id,
                        day_of_week=d["day"],
                        start_time=d["start"],
                        end_time=d["end"],
                        break_hours=d["break"],
                        daily_hours=d["hours"]
                    ))
                db.flush()
            sched_map[s_info["name"]] = sched

        standard_sched = sched_map["Standard 5-Day Week"]
        flexible_sched = sched_map["Flexible Working Hours"]
        operations_sched = sched_map["Operations Shift"]
        leadership_sched = sched_map["Leadership Flexible Schedule"]

        # =========================================================================
        # 2. SALARY STRUCTURES & SALARY RULES (Sections 19, 20, 21, 22)
        # =========================================================================
        structures_spec = [
            {
                "code": "STANDARD_MONTHLY",
                "name": "Standard Employee Salary",
                "company": COMPANY_NAME,
                "pay_frequency": "monthly",
                "description": "Standard structure with Basic, HRA (40%), Transport, Special Allowance, Unpaid Leave Deduction, and Statutory Deductions.",
                "rules": [
                    {"name": "Basic Salary", "code": "BASIC", "category": RuleCategory.BASIC.value, "sequence": 10, "type": ComputationType.PERCENTAGE.value, "rate": 100.0, "base": "contract_wage", "desc": "Base contractual wage"},
                    {"name": "House Rent Allowance", "code": "HRA", "category": RuleCategory.ALLOWANCE.value, "sequence": 20, "type": ComputationType.PERCENTAGE.value, "rate": 40.0, "base": "BASIC", "desc": "40% of Basic Salary"},
                    {"name": "Transport Allowance", "code": "TRANSPORT", "category": RuleCategory.ALLOWANCE.value, "sequence": 30, "type": ComputationType.FIXED.value, "fixed": 3000.0, "desc": "Standard monthly transport allowance"},
                    {"name": "Special Allowance", "code": "SPECIAL", "category": RuleCategory.ALLOWANCE.value, "sequence": 40, "type": ComputationType.FIXED.value, "fixed": 14000.0, "desc": "Supplementary flexible allowance"},
                    {"name": "Gross Salary", "code": "GROSS", "category": RuleCategory.GROSS.value, "sequence": 70, "type": ComputationType.FORMULA.value, "formula": "BASIC + HRA + TRANSPORT + SPECIAL", "desc": "Total gross compensation before deductions"},
                    {"name": "Unpaid Leave Deduction", "code": "UNPAID_LEAVE", "category": RuleCategory.DEDUCTION.value, "sequence": 80, "type": ComputationType.FORMULA.value, "formula": "(BASIC / days_in_period) * unpaid_leave_days", "condition_type": "conditional", "condition": "unpaid_leave_days > 0", "desc": "Loss of pay per approved unpaid leave day"},
                    {"name": "Provident Fund", "code": "PF", "category": RuleCategory.DEDUCTION.value, "sequence": 90, "type": ComputationType.PERCENTAGE.value, "rate": 12.0, "base": "BASIC", "desc": "12% statutory employee provident fund"},
                    {"name": "Professional Tax", "code": "PT", "category": RuleCategory.DEDUCTION.value, "sequence": 100, "type": ComputationType.FIXED.value, "fixed": 200.0, "desc": "State professional tax"},
                    {"name": "Income Tax TDS", "code": "TAX", "category": RuleCategory.DEDUCTION.value, "sequence": 110, "type": ComputationType.FIXED.value, "fixed": 5000.0, "desc": "Standard monthly income tax TDS"},
                    {"name": "Net Salary", "code": "NET", "category": RuleCategory.NET.value, "sequence": 120, "type": ComputationType.FORMULA.value, "formula": "GROSS - UNPAID_LEAVE - PF - PT - TAX", "desc": "Net take-home pay after deductions"}
                ]
            },
            {
                "code": "MGMT_MONTHLY",
                "name": "Management Salary",
                "company": COMPANY_NAME,
                "pay_frequency": "monthly",
                "description": "Salary structure for managers and department heads with Management Allowance and Performance Bonus.",
                "rules": [
                    {"name": "Basic Salary", "code": "BASIC", "category": RuleCategory.BASIC.value, "sequence": 10, "type": ComputationType.PERCENTAGE.value, "rate": 100.0, "base": "contract_wage"},
                    {"name": "House Rent Allowance", "code": "HRA", "category": RuleCategory.ALLOWANCE.value, "sequence": 20, "type": ComputationType.PERCENTAGE.value, "rate": 40.0, "base": "BASIC"},
                    {"name": "Transport Allowance", "code": "TRANSPORT", "category": RuleCategory.ALLOWANCE.value, "sequence": 30, "type": ComputationType.FIXED.value, "fixed": 5000.0},
                    {"name": "Management Allowance", "code": "MGMT_ALLOW", "category": RuleCategory.ALLOWANCE.value, "sequence": 40, "type": ComputationType.FIXED.value, "fixed": 15000.0},
                    {"name": "Special Allowance", "code": "SPECIAL", "category": RuleCategory.ALLOWANCE.value, "sequence": 50, "type": ComputationType.FIXED.value, "fixed": 20000.0},
                    {"name": "Performance Bonus", "code": "BONUS", "category": RuleCategory.ALLOWANCE.value, "sequence": 60, "type": ComputationType.FIXED.value, "fixed": 25000.0},
                    {"name": "Gross Salary", "code": "GROSS", "category": RuleCategory.GROSS.value, "sequence": 70, "type": ComputationType.FORMULA.value, "formula": "BASIC + HRA + TRANSPORT + MGMT_ALLOW + SPECIAL + BONUS"},
                    {"name": "Unpaid Leave Deduction", "code": "UNPAID_LEAVE", "category": RuleCategory.DEDUCTION.value, "sequence": 80, "type": ComputationType.FORMULA.value, "formula": "(BASIC / days_in_period) * unpaid_leave_days", "condition_type": "conditional", "condition": "unpaid_leave_days > 0"},
                    {"name": "Provident Fund", "code": "PF", "category": RuleCategory.DEDUCTION.value, "sequence": 90, "type": ComputationType.PERCENTAGE.value, "rate": 12.0, "base": "BASIC"},
                    {"name": "Professional Tax", "code": "PT", "category": RuleCategory.DEDUCTION.value, "sequence": 100, "type": ComputationType.FIXED.value, "fixed": 200.0, "desc": "State professional tax"},
                    {"name": "Income Tax TDS", "code": "TAX", "category": RuleCategory.DEDUCTION.value, "sequence": 110, "type": ComputationType.FIXED.value, "fixed": 15000.0, "desc": "Management estimated TDS"},
                    {"name": "Net Salary", "code": "NET", "category": RuleCategory.NET.value, "sequence": 120, "type": ComputationType.FORMULA.value, "formula": "GROSS - UNPAID_LEAVE - PF - PT - TAX"}
                ]
            },
            {
                "code": "EXEC_MONTHLY",
                "name": "Executive Salary",
                "company": COMPANY_NAME,
                "pay_frequency": "monthly",
                "description": "Executive leadership compensation structure with 50% HRA, Executive Allowance, and Leadership Bonus.",
                "rules": [
                    {"name": "Basic Salary", "code": "BASIC", "category": RuleCategory.BASIC.value, "sequence": 10, "type": ComputationType.PERCENTAGE.value, "rate": 100.0, "base": "contract_wage"},
                    {"name": "Executive HRA", "code": "HRA", "category": RuleCategory.ALLOWANCE.value, "sequence": 20, "type": ComputationType.PERCENTAGE.value, "rate": 50.0, "base": "BASIC"},
                    {"name": "Executive Allowance", "code": "EXEC_ALLOW", "category": RuleCategory.ALLOWANCE.value, "sequence": 30, "type": ComputationType.FIXED.value, "fixed": 35000.0},
                    {"name": "Special Allowance", "code": "SPECIAL", "category": RuleCategory.ALLOWANCE.value, "sequence": 40, "type": ComputationType.FIXED.value, "fixed": 25000.0},
                    {"name": "Performance Bonus", "code": "BONUS", "category": RuleCategory.ALLOWANCE.value, "sequence": 50, "type": ComputationType.FIXED.value, "fixed": 40000.0},
                    {"name": "Gross Salary", "code": "GROSS", "category": RuleCategory.GROSS.value, "sequence": 70, "type": ComputationType.FORMULA.value, "formula": "BASIC + HRA + EXEC_ALLOW + SPECIAL + BONUS"},
                    {"name": "Provident Fund", "code": "PF", "category": RuleCategory.DEDUCTION.value, "sequence": 90, "type": ComputationType.PERCENTAGE.value, "rate": 12.0, "base": "BASIC"},
                    {"name": "Professional Tax", "code": "PT", "category": RuleCategory.DEDUCTION.value, "sequence": 100, "type": ComputationType.FIXED.value, "fixed": 200.0},
                    {"name": "Income Tax TDS", "code": "TAX", "category": RuleCategory.DEDUCTION.value, "sequence": 110, "type": ComputationType.FIXED.value, "fixed": 35000.0},
                    {"name": "Net Salary", "code": "NET", "category": RuleCategory.NET.value, "sequence": 120, "type": ComputationType.FORMULA.value, "formula": "GROSS - PF - PT - TAX"}
                ]
            },
            {
                "code": "INTERN_MONTHLY",
                "name": "Intern Salary",
                "company": COMPANY_NAME,
                "pay_frequency": "monthly",
                "description": "Fixed monthly stipend for engineering & operations interns.",
                "rules": [
                    {"name": "Monthly Stipend", "code": "BASIC", "category": RuleCategory.BASIC.value, "sequence": 10, "type": ComputationType.PERCENTAGE.value, "rate": 100.0, "base": "contract_wage"},
                    {"name": "Gross Stipend", "code": "GROSS", "category": RuleCategory.GROSS.value, "sequence": 70, "type": ComputationType.FORMULA.value, "formula": "BASIC"},
                    {"name": "Unpaid Leave Deduction", "code": "UNPAID_LEAVE", "category": RuleCategory.DEDUCTION.value, "sequence": 80, "type": ComputationType.FORMULA.value, "formula": "(BASIC / days_in_period) * unpaid_leave_days", "condition_type": "conditional", "condition": "unpaid_leave_days > 0"},
                    {"name": "Net Stipend", "code": "NET", "category": RuleCategory.NET.value, "sequence": 120, "type": ComputationType.FORMULA.value, "formula": "GROSS - UNPAID_LEAVE"}
                ]
            }
        ]

        struct_map = {}
        for st_info in structures_spec:
            st = db.query(SalaryStructure).filter(SalaryStructure.code == st_info["code"]).first()
            if not st:
                st = SalaryStructure(
                    name=st_info["name"],
                    code=st_info["code"],
                    company=st_info["company"],
                    pay_frequency=st_info["pay_frequency"],
                    description=st_info["description"],
                    active=True
                )
                db.add(st)
                db.flush()
                for r_info in st_info["rules"]:
                    db.add(SalaryRule(
                        structure_id=st.id,
                        name=r_info["name"],
                        code=r_info["code"],
                        category=r_info["category"],
                        sequence=r_info["sequence"],
                        computation_type=r_info["type"],
                        percentage_rate=r_info.get("rate", 0.0),
                        percentage_base_code=r_info.get("base"),
                        fixed_amount=r_info.get("fixed", 0.0),
                        formula_expression=r_info.get("formula"),
                        condition_type=r_info.get("condition_type", "always"),
                        condition_formula=r_info.get("condition"),
                        appears_on_payslip=True,
                        description=r_info.get("desc", r_info["name"])
                    ))
                db.flush()
            struct_map[st_info["code"]] = st

        std_structure = struct_map["STANDARD_MONTHLY"]
        mgmt_structure = struct_map["MGMT_MONTHLY"]
        exec_structure = struct_map["EXEC_MONTHLY"]
        intern_structure = struct_map["INTERN_MONTHLY"]

        # =========================================================================
        # 3. BASE TEST FIXTURE EMPLOYEES (Preserved for existing test suite)
        # =========================================================================
        legacy_employees = [
            {
                "employee_code": "EMP001",
                "name": "Sarah Connor",
                "work_email": "admin@peoplepay360.com",
                "phone": "+1 (555) 019-2831",
                "department": "Executive / IT",
                "job_position": "System Administrator & HR Director",
                "company": COMPANY_NAME,
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_sched.id,
                "bank_name": "Chase Bank",
                "bank_account_no": "98765432101",
                "ifsc_code": "CHAS0001234",
                "pan_no": "ABCDE1234F"
            },
            {
                "employee_code": "EMP002",
                "name": "Vikram Malhotra",
                "work_email": "payroll.manager@peoplepay360.com",
                "phone": "+1 (555) 014-9982",
                "department": "Finance & Payroll",
                "job_position": "Payroll Manager",
                "company": COMPANY_NAME,
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_sched.id,
                "bank_name": "Bank of America",
                "bank_account_no": "88765432102",
                "ifsc_code": "BOFA0005678",
                "pan_no": "BCDEF2345G"
            },
            {
                "employee_code": "EMP003",
                "name": "Neha Patel",
                "work_email": "payroll.user@peoplepay360.com",
                "phone": "+1 (555) 018-7721",
                "department": "Finance & Payroll",
                "job_position": "Payroll Specialist",
                "company": COMPANY_NAME,
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_sched.id,
                "bank_name": "Wells Fargo",
                "bank_account_no": "78765432103",
                "ifsc_code": "WELS0009012",
                "pan_no": "CDEFG3456H"
            },
            {
                "employee_code": "EMP004",
                "name": "Marcus Vance",
                "work_email": "hr.manager@peoplepay360.com",
                "phone": "+1 (555) 012-4439",
                "department": "Human Resources",
                "job_position": "HR Operations Manager",
                "company": COMPANY_NAME,
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_sched.id,
                "bank_name": "Citibank",
                "bank_account_no": "68765432104",
                "ifsc_code": "CITI0003456",
                "pan_no": "DEFGH4567I"
            },
            {
                "employee_code": "EMP005",
                "name": "Aarav Mehta",
                "work_email": "employee@peoplepay360.com",
                "phone": "+1 (555) 017-8812",
                "department": "Engineering",
                "job_position": "Senior Software Engineer",
                "company": COMPANY_NAME,
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_sched.id,
                "bank_name": "Chase Bank",
                "bank_account_no": "58765432105",
                "ifsc_code": "CHAS0007890",
                "pan_no": "EFGHI5678J"
            },
            {
                "employee_code": "EMP006",
                "name": "Sara Khan",
                "work_email": "sara.khan@peoplepay360.com",
                "phone": "+1 (555) 013-6641",
                "department": "Engineering",
                "job_position": "Full Stack Developer",
                "company": COMPANY_NAME,
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_sched.id,
                "bank_name": "PNC Bank",
                "bank_account_no": "48765432106",
                "ifsc_code": "PNCC0001234",
                "pan_no": "FGHIJ6789K"
            },
            {
                "employee_code": "EMP007",
                "name": "John Dsouza",
                "work_email": "john.dsouza@peoplepay360.com",
                "phone": "+1 (555) 016-3392",
                "department": "Sales & Marketing",
                "job_position": "Account Executive",
                "company": COMPANY_NAME,
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_sched.id,
                "bank_name": "US Bank",
                "bank_account_no": "38765432107",
                "ifsc_code": "USBK0005678",
                "pan_no": "GHIJK7890L"
            }
        ]

        emp_map = {}
        for emp_d in legacy_employees:
            existing = db.query(Employee).filter(Employee.work_email == emp_d["work_email"]).first()
            if not existing:
                emp = Employee(**emp_d)
                db.add(emp)
                db.flush()
                emp_map[emp_d["work_email"]] = emp
            else:
                emp_map[emp_d["work_email"]] = existing

        sarah_emp = emp_map.get("admin@peoplepay360.com")
        vikram_emp = emp_map.get("payroll.manager@peoplepay360.com")
        marcus_emp = emp_map.get("hr.manager@peoplepay360.com")
        aarav_m_emp = emp_map.get("employee@peoplepay360.com")

        if vikram_emp and sarah_emp: vikram_emp.manager_id = sarah_emp.id
        if marcus_emp and sarah_emp: marcus_emp.manager_id = sarah_emp.id
        if aarav_m_emp and marcus_emp: aarav_m_emp.manager_id = marcus_emp.id
        db.flush()

        # =========================================================================
        # 4. 24 MODULE 15 REALISTIC EMPLOYEES (EMP-001 to EMP-024)
        # =========================================================================
        employees_spec = [
            # Management (1)
            {
                "code": "EMP-001", "name": "Aarav Sharma", "email": "aarav.sharma@peoplepay360.demo",
                "phone": "+91 98201 11001", "dept": "Management", "pos": "Chief Executive Officer",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": leadership_sched.id,
                "bank": "HDFC Bank", "acc": "50100234567801", "ifsc": "HDFC0000001", "pan": "AARPS1001M",
                "wage": 250000.0, "struct": exec_structure.id, "mgr": None, "ctype": "Permanent"
            },
            # Engineering (8)
            {
                "code": "EMP-002", "name": "Rohan Patel", "email": "rohan.patel@peoplepay360.demo",
                "phone": "+91 98201 11002", "dept": "Engineering", "pos": "Engineering Manager",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "ICICI Bank", "acc": "00110234567802", "ifsc": "ICIC0000011", "pan": "ROHPP1002E",
                "wage": 150000.0, "struct": mgmt_structure.id, "mgr": "aarav.sharma@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                "code": "EMP-003", "name": "Priyansh Shah", "email": "priyansh.shah@peoplepay360.demo",
                "phone": "+91 98201 11003", "dept": "Engineering", "pos": "Senior Software Engineer",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "State Bank of India", "acc": "20110234567803", "ifsc": "SBIN0000021", "pan": "PRYPS1003S",
                "wage": 100000.0, "struct": std_structure.id, "mgr": "rohan.patel@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                "code": "EMP-004", "name": "Vivaan Mehta", "email": "vivaan.mehta@peoplepay360.demo",
                "phone": "+91 98201 11004", "dept": "Engineering", "pos": "Software Engineer",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "Axis Bank", "acc": "91110234567804", "ifsc": "UTIB0000031", "pan": "VIVPM1004M",
                "wage": 75000.0, "struct": std_structure.id, "mgr": "rohan.patel@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                "code": "EMP-005", "name": "Aditya Joshi", "email": "aditya.joshi@peoplepay360.demo",
                "phone": "+91 98201 11005", "dept": "Engineering", "pos": "Backend Developer",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "Kotak Mahindra Bank", "acc": "40110234567805", "ifsc": "KKBK0000041", "pan": "ADIPI1005J",
                "wage": 72000.0, "struct": std_structure.id, "mgr": "rohan.patel@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                # HERO DEMO EMPLOYEE
                "code": "EMP-006", "name": "Kabir Singh", "email": "kabir.singh@peoplepay360.demo",
                "phone": "+91 98201 11006", "dept": "Engineering", "pos": "Frontend Developer",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "HDFC Bank", "acc": "50110234567806", "ifsc": "HDFC0000001", "pan": "KABPS1006K",
                "wage": 70000.0, "struct": std_structure.id, "mgr": "rohan.patel@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                # Controlled attendance warning
                "code": "EMP-007", "name": "Arjun Desai", "email": "arjun.desai@peoplepay360.demo",
                "phone": "+91 98201 11007", "dept": "Engineering", "pos": "QA Engineer",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "ICICI Bank", "acc": "00110234567807", "ifsc": "ICIC0000011", "pan": "ARJPD1007D",
                "wage": 65000.0, "struct": std_structure.id, "mgr": "rohan.patel@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                "code": "EMP-008", "name": "Ishaan Verma", "email": "ishaan.verma@peoplepay360.demo",
                "phone": "+91 98201 11008", "dept": "Engineering", "pos": "DevOps Engineer",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "Axis Bank", "acc": "91110234567808", "ifsc": "UTIB0000031", "pan": "ISHPI1008V",
                "wage": 80000.0, "struct": std_structure.id, "mgr": "rohan.patel@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                # Status variety: On Leave
                "code": "EMP-009", "name": "Neel Patel", "email": "neel.patel@peoplepay360.demo",
                "phone": "+91 98201 11009", "dept": "Engineering", "pos": "Software Engineer",
                "type": "Full-Time", "status": EmployeeStatus.ON_LEAVE.value, "sched": standard_sched.id,
                "bank": "State Bank of India", "acc": "20110234567809", "ifsc": "SBIN0000021", "pan": "NELPP1009P",
                "wage": 70000.0, "struct": std_structure.id, "mgr": "rohan.patel@peoplepay360.demo", "ctype": "Permanent"
            },
            # Product (3)
            {
                "code": "EMP-010", "name": "Ananya Gupta", "email": "ananya.gupta@peoplepay360.demo",
                "phone": "+91 98201 11010", "dept": "Product", "pos": "Product Manager",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": flexible_sched.id,
                "bank": "HDFC Bank", "acc": "50110234567810", "ifsc": "HDFC0000001", "pan": "ANAPG1010G",
                "wage": 130000.0, "struct": mgmt_structure.id, "mgr": "aarav.sharma@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                "code": "EMP-011", "name": "Kavya Shah", "email": "kavya.shah@peoplepay360.demo",
                "phone": "+91 98201 11011", "dept": "Product", "pos": "Product Designer",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": flexible_sched.id,
                "bank": "ICICI Bank", "acc": "00110234567811", "ifsc": "ICIC0000011", "pan": "KAVPS1011K",
                "wage": 65000.0, "struct": std_structure.id, "mgr": "ananya.gupta@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                "code": "EMP-012", "name": "Dhruv Mehta", "email": "dhruv.mehta@peoplepay360.demo",
                "phone": "+91 98201 11012", "dept": "Product", "pos": "Business Analyst",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": flexible_sched.id,
                "bank": "Kotak Mahindra Bank", "acc": "40110234567812", "ifsc": "KKBK0000041", "pan": "DHRPM1012M",
                "wage": 60000.0, "struct": std_structure.id, "mgr": "ananya.gupta@peoplepay360.demo", "ctype": "Probation"
            },
            # Human Resources (2)
            {
                "code": "EMP-013", "name": "Priya Nair", "email": "priya.nair@peoplepay360.demo",
                "phone": "+91 98201 11013", "dept": "Human Resources", "pos": "HR Manager",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "HDFC Bank", "acc": "50110234567813", "ifsc": "HDFC0000001", "pan": "PRYPN1013N",
                "wage": 90000.0, "struct": mgmt_structure.id, "mgr": "aarav.sharma@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                # Pending Leave demo
                "code": "EMP-014", "name": "Sneha Patel", "email": "sneha.patel@peoplepay360.demo",
                "phone": "+91 98201 11014", "dept": "Human Resources", "pos": "HR Executive",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "Axis Bank", "acc": "91110234567814", "ifsc": "UTIB0000031", "pan": "SNEPP1014S",
                "wage": 55000.0, "struct": std_structure.id, "mgr": "priya.nair@peoplepay360.demo", "ctype": "Fixed-Term"
            },
            # Finance (2)
            {
                "code": "EMP-015", "name": "Rajesh Kumar", "email": "rajesh.kumar@peoplepay360.demo",
                "phone": "+91 98201 11015", "dept": "Finance", "pos": "Finance Manager",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "State Bank of India", "acc": "20110234567815", "ifsc": "SBIN0000021", "pan": "RAJPR1015K",
                "wage": 100000.0, "struct": mgmt_structure.id, "mgr": "aarav.sharma@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                "code": "EMP-016", "name": "Nisha Shah", "email": "nisha.shah@peoplepay360.demo",
                "phone": "+91 98201 11016", "dept": "Finance", "pos": "Accountant",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": standard_sched.id,
                "bank": "ICICI Bank", "acc": "00110234567816", "ifsc": "ICIC0000011", "pan": "NISPS1016S",
                "wage": 55000.0, "struct": std_structure.id, "mgr": "rajesh.kumar@peoplepay360.demo", "ctype": "Permanent"
            },
            # Sales (3)
            {
                "code": "EMP-017", "name": "Rahul Joshi", "email": "rahul.joshi@peoplepay360.demo",
                "phone": "+91 98201 11017", "dept": "Sales", "pos": "Sales Manager",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": flexible_sched.id,
                "bank": "HDFC Bank", "acc": "50110234567817", "ifsc": "HDFC0000001", "pan": "RAHPJ1017J",
                "wage": 110000.0, "struct": mgmt_structure.id, "mgr": "aarav.sharma@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                "code": "EMP-018", "name": "Meera Desai", "email": "meera.desai@peoplepay360.demo",
                "phone": "+91 98201 11018", "dept": "Sales", "pos": "Sales Executive",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": flexible_sched.id,
                "bank": "Axis Bank", "acc": "91110234567818", "ifsc": "UTIB0000031", "pan": "MEEPD1018D",
                "wage": 58000.0, "struct": std_structure.id, "mgr": "rahul.joshi@peoplepay360.demo", "ctype": "Fixed-Term"
            },
            {
                "code": "EMP-019", "name": "Yash Patel", "email": "yash.patel@peoplepay360.demo",
                "phone": "+91 98201 11019", "dept": "Sales", "pos": "Business Development Executive",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": flexible_sched.id,
                "bank": "Kotak Mahindra Bank", "acc": "40110234567819", "ifsc": "KKBK0000041", "pan": "YASPP1019Y",
                "wage": 52000.0, "struct": std_structure.id, "mgr": "rahul.joshi@peoplepay360.demo", "ctype": "Probation"
            },
            # Operations (3)
            {
                "code": "EMP-020", "name": "Harsh Mehta", "email": "harsh.mehta@peoplepay360.demo",
                "phone": "+91 98201 11020", "dept": "Operations", "pos": "Operations Manager",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": operations_sched.id,
                "bank": "State Bank of India", "acc": "20110234567820", "ifsc": "SBIN0000021", "pan": "HARPM1020M",
                "wage": 95000.0, "struct": mgmt_structure.id, "mgr": "aarav.sharma@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                # Controlled warning scenario
                "code": "EMP-021", "name": "Dev Shah", "email": "dev.shah@peoplepay360.demo",
                "phone": "+91 98201 11021", "dept": "Operations", "pos": "Operations Executive",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": operations_sched.id,
                "bank": "ICICI Bank", "acc": "00110234567821", "ifsc": "ICIC0000011", "pan": "DEVPS1021S",
                "wage": 50000.0, "struct": std_structure.id, "mgr": "harsh.mehta@peoplepay360.demo", "ctype": "Fixed-Term"
            },
            {
                # Status variety: Notice Period
                "code": "EMP-022", "name": "Krish Patel", "email": "krish.patel@peoplepay360.demo",
                "phone": "+91 98201 11022", "dept": "Operations", "pos": "Support Executive",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": operations_sched.id,
                "bank": "HDFC Bank", "acc": "50110234567822", "ifsc": "HDFC0000001", "pan": "KRIPP1022K",
                "wage": 45000.0, "struct": std_structure.id, "mgr": "harsh.mehta@peoplepay360.demo", "ctype": "Permanent"
            },
            # Marketing (2)
            {
                "code": "EMP-023", "name": "Diya Sharma", "email": "diya.sharma@peoplepay360.demo",
                "phone": "+91 98201 11023", "dept": "Marketing", "pos": "Marketing Manager",
                "type": "Full-Time", "status": EmployeeStatus.ACTIVE.value, "sched": flexible_sched.id,
                "bank": "Axis Bank", "acc": "91110234567823", "ifsc": "UTIB0000031", "pan": "DIYPS1023D",
                "wage": 90000.0, "struct": mgmt_structure.id, "mgr": "aarav.sharma@peoplepay360.demo", "ctype": "Permanent"
            },
            {
                # Status variety: Inactive (Expired Contract warning)
                "code": "EMP-024", "name": "Riya Patel", "email": "riya.patel@peoplepay360.demo",
                "phone": "+91 98201 11024", "dept": "Marketing", "pos": "Digital Marketing Executive",
                "type": "Full-Time", "status": EmployeeStatus.INACTIVE.value, "sched": flexible_sched.id,
                "bank": "Kotak Mahindra Bank", "acc": "40110234567824", "ifsc": "KKBK0000041", "pan": "RIYPP1024R",
                "wage": 48000.0, "struct": std_structure.id, "mgr": "diya.sharma@peoplepay360.demo", "ctype": "Fixed-Term"
            }
        ]

        for esp in employees_spec:
            existing = db.query(Employee).filter(Employee.work_email == esp["email"]).first()
            if not existing:
                emp = Employee(
                    employee_code=esp["code"],
                    name=esp["name"],
                    work_email=esp["email"],
                    phone=esp["phone"],
                    department=esp["dept"],
                    job_position=esp["pos"],
                    company=COMPANY_NAME,
                    work_location="Headquarters",
                    employee_type=esp["type"],
                    status=esp["status"],
                    working_schedule_id=esp["sched"],
                    bank_name=esp["bank"],
                    bank_account_no=esp["acc"],
                    ifsc_code=esp["ifsc"],
                    pan_no=esp["pan"]
                )
                db.add(emp)
                db.flush()
                emp_map[esp["email"]] = emp
            else:
                existing.name = esp["name"]
                existing.department = esp["dept"]
                existing.job_position = esp["pos"]
                existing.status = esp["status"]
                existing.working_schedule_id = esp["sched"]
                existing.bank_name = esp["bank"]
                existing.bank_account_no = esp["acc"]
                existing.ifsc_code = esp["ifsc"]
                existing.pan_no = esp["pan"]
                db.flush()
                emp_map[esp["email"]] = existing

        # Update manager reporting relationships for Module 15
        for esp in employees_spec:
            mgr_email = esp["mgr"]
            if mgr_email and mgr_email in emp_map:
                emp = emp_map[esp["email"]]
                emp.manager_id = emp_map[mgr_email].id
        db.flush()

        # =========================================================================
        # 5. USER ACCOUNTS & CREDENTIALS
        # =========================================================================
        users_spec = [
            # Official Hackathon Presentation Accounts (Demo@123)
            {
                "email": "admin@peoplepay360.demo",
                "username": "Aarav Sharma (Super Admin)",
                "password": "Demo@123",
                "role": UserRole.ADMIN.value,
                "emp_email": "aarav.sharma@peoplepay360.demo"
            },
            {
                "email": "hr@peoplepay360.demo",
                "username": "Priya Nair (HR Manager)",
                "password": "Demo@123",
                "role": UserRole.HR_MANAGER.value,
                "emp_email": "priya.nair@peoplepay360.demo"
            },
            {
                "email": "payroll@peoplepay360.demo",
                "username": "Rajesh Kumar (Payroll Manager)",
                "password": "Demo@123",
                "role": UserRole.HR_PAYROLL_MANAGER.value,
                "emp_email": "rajesh.kumar@peoplepay360.demo"
            },
            {
                "email": "employee@peoplepay360.demo",
                "username": "Kabir Singh (Employee)",
                "password": "Demo@123",
                "role": UserRole.EMPLOYEE.value,
                "emp_email": "kabir.singh@peoplepay360.demo"
            },
            # Standard accounts for test suite
            {
                "email": "admin@peoplepay360.com",
                "username": "Sarah Connor",
                "password": "admin123",
                "role": UserRole.ADMIN.value,
                "emp_email": "admin@peoplepay360.com"
            },
            {
                "email": "payroll.manager@peoplepay360.com",
                "username": "Vikram Malhotra",
                "password": "payrollmgr123",
                "role": UserRole.HR_PAYROLL_MANAGER.value,
                "emp_email": "payroll.manager@peoplepay360.com"
            },
            {
                "email": "payroll.user@peoplepay360.com",
                "username": "Neha Patel",
                "password": "payrolluser123",
                "role": UserRole.HR_PAYROLL_USER.value,
                "emp_email": "payroll.user@peoplepay360.com"
            },
            {
                "email": "hr.manager@peoplepay360.com",
                "username": "Marcus Vance",
                "password": "hrmanager123",
                "role": UserRole.HR_MANAGER.value,
                "emp_email": "hr.manager@peoplepay360.com"
            },
            {
                "email": "employee@peoplepay360.com",
                "username": "Aarav Mehta",
                "password": "employee123",
                "role": UserRole.EMPLOYEE.value,
                "emp_email": "employee@peoplepay360.com"
            },
            {
                "email": "inactive@peoplepay360.com",
                "username": "Inactive User",
                "password": "inactive123",
                "role": UserRole.EMPLOYEE.value,
                "emp_email": None
            }
        ]

        for usp in users_spec:
            user = db.query(User).filter(User.email == usp["email"]).first()
            emp_obj = emp_map.get(usp.get("emp_email"))
            emp_id = emp_obj.id if emp_obj else None

            if not user:
                user = User(
                    email=usp["email"],
                    username=usp["username"],
                    hashed_password=get_password_hash(usp["password"]),
                    role=usp["role"],
                    is_active=(usp["email"] != "inactive@peoplepay360.com"),
                    employee_id=emp_id
                )
                db.add(user)
            else:
                user.hashed_password = get_password_hash(usp["password"])
                user.role = usp["role"]
                user.is_active = (usp["email"] != "inactive@peoplepay360.com")
                if emp_id:
                    user.employee_id = emp_id
        db.flush()

        # =========================================================================
        # 6. TIME OFF TYPES & ALLOCATIONS
        # =========================================================================
        time_off_types_spec = [
            {"name": "Paid Time Off", "unit": "days", "req_alloc": True, "unpaid": False, "color": "#017E84"},
            {"name": "Sick Leave", "unit": "days", "req_alloc": True, "unpaid": False, "color": "#E2A03F"},
            {"name": "Casual Leave", "unit": "days", "req_alloc": True, "unpaid": False, "color": "#714B67"},
            {"name": "Unpaid Leave", "unit": "days", "req_alloc": False, "unpaid": True, "color": "#DC2626"},
            {"name": "Work From Home", "unit": "days", "req_alloc": False, "unpaid": False, "color": "#2563EB"},
        ]

        tot_map = {}
        for tot in time_off_types_spec:
            t = db.query(TimeOffType).filter(TimeOffType.name == tot["name"]).first()
            if not t:
                t = TimeOffType(
                    name=tot["name"],
                    unit=tot["unit"],
                    requires_allocation=tot["req_alloc"],
                    is_unpaid=tot["unpaid"],
                    approval_type="hr",
                    payroll_behavior="unpaid" if tot["unpaid"] else "paid",
                    color=tot["color"],
                    active=True
                )
                db.add(t)
                db.flush()
            tot_map[tot["name"]] = t

        pto_type = tot_map["Paid Time Off"]
        sick_type = tot_map["Sick Leave"]
        casual_type = tot_map["Casual Leave"]
        unpaid_type = tot_map["Unpaid Leave"]
        wfh_type = tot_map["Work From Home"]

        # Seed allocations for Aarav Mehta (employee_id=5 for test suite)
        if aarav_m_emp and db.query(TimeOffAllocation).filter(TimeOffAllocation.employee_id == aarav_m_emp.id).count() == 0:
            db.add(TimeOffAllocation(
                employee_id=aarav_m_emp.id,
                time_off_type_id=pto_type.id,
                allocated_amount=24.0,
                taken_amount=3.0,
                remaining_amount=21.0,
                status=AllocationStatus.APPROVED.value,
                approver_id=marcus_emp.id if marcus_emp else None
            ))
            db.add(TimeOffAllocation(
                employee_id=aarav_m_emp.id,
                time_off_type_id=sick_type.id,
                allocated_amount=12.0,
                taken_amount=1.0,
                remaining_amount=11.0,
                status=AllocationStatus.APPROVED.value,
                approver_id=marcus_emp.id if marcus_emp else None
            ))
            db.flush()

        # Seed test requests for Aarav Mehta
        if aarav_m_emp and db.query(TimeOffRequest).filter(TimeOffRequest.employee_id == aarav_m_emp.id).count() == 0:
            db.add(TimeOffRequest(
                employee_id=aarav_m_emp.id,
                time_off_type_id=pto_type.id,
                start_date=date(2026, 1, 15),
                end_date=date(2026, 1, 16),
                duration=2.0,
                status=LeaveRequestStatus.APPROVED.value,
                reason="Family trip",
                approver_id=marcus_emp.id if marcus_emp else None,
                approved_at=datetime(2026, 1, 10, 10, 0)
            ))
            db.add(TimeOffRequest(
                employee_id=aarav_m_emp.id,
                time_off_type_id=sick_type.id,
                start_date=date(2026, 2, 5),
                end_date=date(2026, 2, 5),
                duration=1.0,
                status=LeaveRequestStatus.APPROVED.value,
                reason="Dental appointment",
                approver_id=marcus_emp.id if marcus_emp else None,
                approved_at=datetime(2026, 2, 4, 11, 0)
            ))
            db.add(TimeOffRequest(
                employee_id=aarav_m_emp.id,
                time_off_type_id=pto_type.id,
                start_date=date(2026, 3, 20),
                end_date=date(2026, 3, 20),
                duration=1.0,
                status=LeaveRequestStatus.TO_APPROVE.value,
                reason="Personal work",
                approver_id=marcus_emp.id if marcus_emp else None
            ))
            db.flush()

        # Seed allocations for all Module 15 employees
        priya_emp = emp_map.get("priya.nair@peoplepay360.demo")
        for esp in employees_spec:
            emp = emp_map.get(esp["email"])
            if emp and db.query(TimeOffAllocation).filter(TimeOffAllocation.employee_id == emp.id).count() == 0:
                db.add(TimeOffAllocation(
                    employee_id=emp.id,
                    time_off_type_id=pto_type.id,
                    allocated_amount=24.0,
                    taken_amount=3.0 if emp.employee_code == "EMP-009" else 1.0,
                    remaining_amount=21.0 if emp.employee_code == "EMP-009" else 23.0,
                    status=AllocationStatus.APPROVED.value,
                    approver_id=priya_emp.id if priya_emp else None,
                    validity_start=date(2026, 1, 1),
                    validity_end=date(2026, 12, 31),
                    notes="Annual leave entitlement 2026"
                ))
                db.add(TimeOffAllocation(
                    employee_id=emp.id,
                    time_off_type_id=sick_type.id,
                    allocated_amount=12.0,
                    taken_amount=0.0,
                    remaining_amount=12.0,
                    status=AllocationStatus.APPROVED.value,
                    approver_id=priya_emp.id if priya_emp else None,
                    validity_start=date(2026, 1, 1),
                    validity_end=date(2026, 12, 31),
                    notes="Medical leave allowance 2026"
                ))
                db.add(TimeOffAllocation(
                    employee_id=emp.id,
                    time_off_type_id=casual_type.id,
                    allocated_amount=10.0,
                    taken_amount=0.0,
                    remaining_amount=10.0,
                    status=AllocationStatus.APPROVED.value,
                    approver_id=priya_emp.id if priya_emp else None,
                    validity_start=date(2026, 1, 1),
                    validity_end=date(2026, 12, 31),
                    notes="Casual leave quota 2026"
                ))
        db.flush()

        # Seed key demo leave requests
        leave_requests_spec = [
            # 1. Sneha Patel: Pending Casual Leave (2 Days) -> Live "Approve Leave" presentation step!
            {
                "emp": "sneha.patel@peoplepay360.demo",
                "type": casual_type.id,
                "start": date(2026, 9, 18),
                "end": date(2026, 9, 19),
                "dur": 2.0,
                "status": LeaveRequestStatus.TO_APPROVE.value,
                "reason": "Family wedding celebration in Ahmedabad",
                "approver": priya_emp.id if priya_emp else None
            },
            # 2. Neel Patel: Approved Paid Leave (3 Days) -> Status On Leave
            {
                "emp": "neel.patel@peoplepay360.demo",
                "type": pto_type.id,
                "start": date(2026, 9, 1),
                "end": date(2026, 9, 3),
                "dur": 3.0,
                "status": LeaveRequestStatus.APPROVED.value,
                "reason": "Annual family vacation",
                "approver": priya_emp.id if priya_emp else None
            },
            # 3. Kabir Singh: Approved Unpaid Leave (2 Days in Sept 2026) -> Key Payroll Deduction Story!
            {
                "emp": "kabir.singh@peoplepay360.demo",
                "type": unpaid_type.id,
                "start": date(2026, 9, 10),
                "end": date(2026, 9, 11),
                "dur": 2.0,
                "status": LeaveRequestStatus.APPROVED.value,
                "reason": "Personal urgent relocation work (Unpaid)",
                "approver": priya_emp.id if priya_emp else None
            },
            # 4. Dhruv Mehta: Approved Sick Leave
            {
                "emp": "dhruv.mehta@peoplepay360.demo",
                "type": sick_type.id,
                "start": date(2026, 8, 14),
                "end": date(2026, 8, 14),
                "dur": 1.0,
                "status": LeaveRequestStatus.APPROVED.value,
                "reason": "Viral fever recovery",
                "approver": priya_emp.id if priya_emp else None
            },
            # 5. Yash Patel: Refused Casual Leave
            {
                "emp": "yash.patel@peoplepay360.demo",
                "type": casual_type.id,
                "start": date(2026, 8, 20),
                "end": date(2026, 8, 20),
                "dur": 1.0,
                "status": LeaveRequestStatus.REFUSED.value,
                "reason": "Personal errands",
                "approver": priya_emp.id if priya_emp else None
            },
            # 6. Meera Desai: Cancelled Sick Leave
            {
                "emp": "meera.desai@peoplepay360.demo",
                "type": sick_type.id,
                "start": date(2026, 8, 25),
                "end": date(2026, 8, 25),
                "dur": 1.0,
                "status": LeaveRequestStatus.CANCELLED.value,
                "reason": "Doctor appointment rescheduled",
                "approver": priya_emp.id if priya_emp else None
            }
        ]

        for lsp in leave_requests_spec:
            emp = emp_map.get(lsp["emp"])
            if not emp:
                continue
            exist_req = db.query(TimeOffRequest).filter(
                TimeOffRequest.employee_id == emp.id,
                TimeOffRequest.start_date == lsp["start"],
                TimeOffRequest.time_off_type_id == lsp["type"]
            ).first()
            if not exist_req:
                db.add(TimeOffRequest(
                    employee_id=emp.id,
                    time_off_type_id=lsp["type"],
                    start_date=lsp["start"],
                    end_date=lsp["end"],
                    duration=lsp["dur"],
                    status=lsp["status"],
                    reason=lsp["reason"],
                    approver_id=lsp["approver"],
                    approved_at=datetime.utcnow() if lsp["status"] == LeaveRequestStatus.APPROVED.value else None
                ))
        db.flush()

        # =========================================================================
        # 7. CONTRACTS (Legacy Test Fixtures + Module 15)
        # =========================================================================
        # Seed Aarav Mehta's legacy contracts
        if aarav_m_emp:
            cnt_2025 = db.query(Contract).filter(Contract.contract_code == "CNT-2025-001").first()
            if not cnt_2025:
                cnt_2025 = Contract(
                    contract_code="CNT-2025-001",
                    name="Aarav Mehta - Junior Engineer 2025",
                    employee_id=aarav_m_emp.id,
                    department="Engineering",
                    job_position="Software Engineer",
                    start_date=date(2025, 1, 1),
                    end_date=date(2025, 12, 31),
                    wage_per_month=65000.0,
                    status=ContractStatus.EXPIRED.value,
                    working_schedule_id=standard_sched.id,
                    salary_structure_id=std_structure.id
                )
                db.add(cnt_2025)
                db.flush()

            cnt_2026 = db.query(Contract).filter(Contract.contract_code == "CNT-2026-005").first()
            if not cnt_2026:
                cnt_2026 = Contract(
                    contract_code="CNT-2026-005",
                    name="Aarav Mehta - Senior Engineer 2026",
                    employee_id=aarav_m_emp.id,
                    department="Engineering",
                    job_position="Senior Software Engineer",
                    start_date=date(2026, 1, 1),
                    end_date=None,
                    wage_per_month=95000.0,
                    status=ContractStatus.RUNNING.value,
                    working_schedule_id=standard_sched.id,
                    salary_structure_id=std_structure.id
                )
                db.add(cnt_2026)
                db.flush()

                # Seed January 2026 Payrun & Payslip for Aarav Mehta (for test_contract_deletion_protection)
                payrun_jan = db.query(Payrun).filter(Payrun.period_start == date(2026, 1, 1)).first()
                if not payrun_jan:
                    payrun_jan = Payrun(
                        name="January 2026 Regular Payrun",
                        salary_structure_id=std_structure.id,
                        period_start=date(2026, 1, 1),
                        period_end=date(2026, 1, 31),
                        status=PayrunStatus.PAID.value,
                        employee_count=1,
                        total_net_paid=84500.0
                    )
                    db.add(payrun_jan)
                    db.flush()

                    db.add(Payslip(
                        payslip_number="PS-2026-01-005",
                        payrun_id=payrun_jan.id,
                        employee_id=aarav_m_emp.id,
                        contract_id=cnt_2026.id,
                        salary_structure_id=std_structure.id,
                        period_start=date(2026, 1, 1),
                        period_end=date(2026, 1, 31),
                        status=PayslipStatus.PAID.value,
                        worked_days=22.0,
                        unpaid_leave_days=0.0,
                        basic_salary=47500.0,
                        gross_salary=95000.0,
                        total_deductions=10500.0,
                        net_salary=84500.0
                    ))
                    db.flush()

        # Seed other legacy employee contracts
        other_legacy_cnts = [
            {"email": "admin@peoplepay360.com", "code": "CNT-2026-001", "name": "Sarah Connor - Executive Contract", "wage": 150000.0, "dept": "Executive / IT", "pos": "System Administrator & HR Director"},
            {"email": "payroll.manager@peoplepay360.com", "code": "CNT-2026-002", "name": "Vikram Malhotra - Payroll Manager Contract", "wage": 120000.0, "dept": "Finance & Payroll", "pos": "Payroll Manager"},
            {"email": "payroll.user@peoplepay360.com", "code": "CNT-2026-003", "name": "Neha Patel - Payroll Specialist Contract", "wage": 80000.0, "dept": "Finance & Payroll", "pos": "Payroll Specialist"},
            {"email": "hr.manager@peoplepay360.com", "code": "CNT-2026-004", "name": "Marcus Vance - HR Manager Contract", "wage": 115000.0, "dept": "Human Resources", "pos": "HR Operations Manager"}
        ]
        for olc in other_legacy_cnts:
            e = emp_map.get(olc["email"])
            if e and not db.query(Contract).filter(Contract.contract_code == olc["code"]).first():
                db.add(Contract(
                    contract_code=olc["code"],
                    name=olc["name"],
                    employee_id=e.id,
                    department=olc["dept"],
                    job_position=olc["pos"],
                    start_date=date(2026, 1, 1),
                    end_date=None,
                    wage_per_month=olc["wage"],
                    status=ContractStatus.RUNNING.value,
                    working_schedule_id=standard_sched.id,
                    salary_structure_id=std_structure.id
                ))
                db.flush()

        # Seed 24 Module 15 Contracts
        contract_map = {}
        for esp in employees_spec:
            code_num = esp["code"].replace("EMP-", "")
            cnt_code = f"CNT-{code_num}"
            is_inactive = esp["code"] == "EMP-024"
            status = ContractStatus.EXPIRED.value if is_inactive else ContractStatus.RUNNING.value
            start_d = date(2023, 1, 10) if esp["code"] == "EMP-001" else date(2024, 1, 1)
            end_d = date(2024, 7, 31) if is_inactive else None

            emp = emp_map.get(esp["email"])
            if not emp:
                continue

            cnt = db.query(Contract).filter(Contract.contract_code == cnt_code).first()
            if not cnt:
                cnt = Contract(
                    contract_code=cnt_code,
                    name=f"{esp['name']} - {esp['pos']} Contract",
                    employee_id=emp.id,
                    department=esp["dept"],
                    job_position=esp["pos"],
                    start_date=start_d,
                    end_date=end_d,
                    wage_per_month=esp["wage"],
                    status=status,
                    working_schedule_id=esp["sched"],
                    salary_structure_id=esp["struct"],
                    notes="Contract verified and registered with PeoplePay360"
                )
                db.add(cnt)
                db.flush()
            else:
                cnt.wage_per_month = esp["wage"]
                cnt.status = status
                cnt.working_schedule_id = esp["sched"]
                cnt.salary_structure_id = esp["struct"]
                db.flush()

            if status == ContractStatus.RUNNING.value:
                contract_map[emp.id] = cnt

        # 1 Draft Contract for demonstration
        if not db.query(Contract).filter(Contract.contract_code == "CNT-025").first():
            arjun_e = emp_map.get("arjun.desai@peoplepay360.demo")
            if arjun_e:
                db.add(Contract(
                    contract_code="CNT-025",
                    name="Arjun Desai - Senior QA Promotion Draft Contract",
                    employee_id=arjun_e.id,
                    department="Engineering",
                    job_position="Senior QA Engineer",
                    start_date=date(2026, 10, 1),
                    end_date=None,
                    wage_per_month=85000.0,
                    status=ContractStatus.DRAFT.value,
                    working_schedule_id=standard_sched.id,
                    salary_structure_id=std_structure.id
                ))
                db.flush()

        # =========================================================================
        # 8. ATTENDANCE RECORDS (Multi-Month 100+ Records)
        # =========================================================================
        kabir_emp = emp_map.get("kabir.singh@peoplepay360.demo")
        arjun_emp = emp_map.get("arjun.desai@peoplepay360.demo")
        neel_emp = emp_map.get("neel.patel@peoplepay360.demo")
        vivaan_emp = emp_map.get("vivaan.mehta@peoplepay360.demo")
        rohan_emp = emp_map.get("rohan.patel@peoplepay360.demo")

        key_attendees = [e for e in [kabir_emp, arjun_emp, neel_emp, vivaan_emp, rohan_emp, priya_emp] if e]

        months = [
            (2026, 7, 31),
            (2026, 8, 31),
            (2026, 9, 15),
        ]

        for year, month, end_day in months:
            for day in range(1, end_day + 1):
                cur_d = date(year, month, day)
                if cur_d.weekday() >= 5:
                    continue

                for emp in key_attendees:
                    att_exist = db.query(Attendance).filter(
                        Attendance.employee_id == emp.id,
                        Attendance.date == cur_d
                    ).first()
                    if att_exist:
                        continue

                    # Kabir Singh Unpaid Leave on Sept 10 & 11
                    if kabir_emp and emp.id == kabir_emp.id and cur_d in [date(2026, 9, 10), date(2026, 9, 11)]:
                        db.add(Attendance(
                            employee_id=emp.id,
                            date=cur_d,
                            check_in=None,
                            check_out=None,
                            worked_hours=0.0,
                            expected_hours=8.0,
                            status=AttendanceStatus.ON_LEAVE.value,
                            notes="Approved Unpaid Leave"
                        ))
                    # Neel Patel Paid Leave on Sept 1, 2, 3
                    elif neel_emp and emp.id == neel_emp.id and cur_d in [date(2026, 9, 1), date(2026, 9, 2), date(2026, 9, 3)]:
                        db.add(Attendance(
                            employee_id=emp.id,
                            date=cur_d,
                            check_in=None,
                            check_out=None,
                            worked_hours=0.0,
                            expected_hours=8.0,
                            status=AttendanceStatus.ON_LEAVE.value,
                            notes="Approved Annual Paid Leave"
                        ))
                    # Arjun Desai missing check-out on Sept 14 (Controlled validation warning)
                    elif arjun_emp and emp.id == arjun_emp.id and cur_d == date(2026, 9, 14):
                        db.add(Attendance(
                            employee_id=emp.id,
                            date=cur_d,
                            check_in=datetime.combine(cur_d, time(9, 10)),
                            check_out=None,
                            worked_hours=0.0,
                            expected_hours=8.0,
                            late_minutes=10,
                            status=AttendanceStatus.INCOMPLETE.value,
                            notes="Missing punch-out badge scan"
                        ))
                    # Kabir Singh late arrival on Sept 8
                    elif kabir_emp and emp.id == kabir_emp.id and cur_d == date(2026, 9, 8):
                        db.add(Attendance(
                            employee_id=emp.id,
                            date=cur_d,
                            check_in=datetime.combine(cur_d, time(9, 42)),
                            check_out=datetime.combine(cur_d, time(18, 20)),
                            worked_hours=7.63,
                            expected_hours=8.0,
                            late_minutes=42,
                            status=AttendanceStatus.LATE.value,
                            notes="Late check-in traffic delay"
                        ))
                    # Normal workday
                    else:
                        in_minute = 2 if emp.id % 2 == 0 else 5
                        db.add(Attendance(
                            employee_id=emp.id,
                            date=cur_d,
                            check_in=datetime.combine(cur_d, time(9, in_minute)),
                            check_out=datetime.combine(cur_d, time(18, 8)),
                            worked_hours=8.1,
                            expected_hours=8.0,
                            overtime_hours=0.1,
                            late_minutes=in_minute if in_minute > 15 else 0,
                            status=AttendanceStatus.PRESENT.value,
                            notes="Standard workday"
                        ))
        db.flush()

        # =========================================================================
        # 9. HISTORICAL PAYRUNS & PAYSLIPS (July & August 2026)
        # =========================================================================
        admin_user = db.query(User).filter(User.email == "admin@peoplepay360.demo").first()

        # July 2026 Payrun (Finalized)
        july_start = date(2026, 7, 1)
        july_end = date(2026, 7, 31)
        july_payrun = db.query(Payrun).filter(Payrun.period_start == july_start).first()

        if not july_payrun:
            july_payrun = Payrun(
                name="July 2026 Regular Payrun",
                company=COMPANY_NAME,
                salary_structure_id=std_structure.id,
                period_start=july_start,
                period_end=july_end,
                status=PayrunStatus.FINALIZED.value,
                employee_type="All",
                created_by_id=admin_user.id if admin_user else None,
                processed_at=datetime(2026, 7, 31, 18, 30),
                finalized_at=datetime(2026, 7, 31, 19, 0)
            )
            db.add(july_payrun)
            db.flush()

            tot_gross, tot_ded, tot_net = 0.0, 0.0, 0.0
            emp_count = 0
            for esp in employees_spec:
                if esp["code"] == "EMP-024":
                    continue
                emp = emp_map.get(esp["email"])
                if not emp:
                    continue
                cnt = contract_map.get(emp.id)
                if not cnt:
                    continue

                slip_res = SalaryEngineService.calculate_employee_payroll(
                    db=db,
                    employee_id=emp.id,
                    period_start=july_start,
                    period_end=july_end,
                    contract_id=cnt.id
                )

                payslip_num = f"PS-2026-07-{emp.id:03d}"
                payslip = Payslip(
                    payslip_number=payslip_num,
                    payrun_id=july_payrun.id,
                    employee_id=emp.id,
                    contract_id=cnt.id,
                    salary_structure_id=cnt.salary_structure_id,
                    company=COMPANY_NAME,
                    period_start=july_start,
                    period_end=july_end,
                    status=PayslipStatus.FINALIZED.value,
                    worked_days=slip_res["attendance"]["worked_days"],
                    unpaid_leave_days=slip_res["time_off"]["unpaid_leave_days"],
                    basic_salary=slip_res["basic_salary"],
                    total_earnings=slip_res["gross_salary"],
                    gross_salary=slip_res["gross_salary"],
                    total_deductions=slip_res["total_deductions"],
                    net_salary=slip_res["net_salary"],
                    employee_snapshot=slip_res["employee"],
                    contract_snapshot=slip_res["contract"],
                    attendance_snapshot=slip_res["attendance"],
                    time_off_snapshot=slip_res["time_off"],
                    calculation_trace=slip_res["calculation_trace"],
                    computed_at=datetime(2026, 7, 31, 18, 35),
                    finalized_at=datetime(2026, 7, 31, 19, 0),
                    pdf_path=f"/storage/payslips/{payslip_num}.pdf"
                )
                db.add(payslip)
                db.flush()

                for comp in slip_res.get("components", []):
                    db.add(PayslipLine(
                        payslip_id=payslip.id,
                        rule_id=comp.get("rule_id"),
                        rule_name=comp.get("rule_name"),
                        rule_code=comp.get("rule_code"),
                        category=comp.get("category"),
                        sequence=comp.get("sequence", 10),
                        amount=comp.get("amount", 0.0),
                        total=comp.get("amount", 0.0),
                        calculation_type=comp.get("computation_type"),
                        calculation_expression=comp.get("description")
                    ))

                tot_gross += slip_res["gross_salary"]
                tot_ded += slip_res["total_deductions"]
                tot_net += slip_res["net_salary"]
                emp_count += 1

            july_payrun.total_employees = emp_count
            july_payrun.successful_employees = emp_count
            july_payrun.employee_count = emp_count
            july_payrun.total_gross = tot_gross
            july_payrun.total_deductions = tot_ded
            july_payrun.total_net = tot_net
            july_payrun.total_net_paid = tot_net
            db.flush()

        # August 2026 Payrun (Finalized + PDF records + Email logs)
        aug_start = date(2026, 8, 1)
        aug_end = date(2026, 8, 31)
        aug_payrun = db.query(Payrun).filter(Payrun.period_start == aug_start).first()

        if not aug_payrun:
            aug_payrun = Payrun(
                name="August 2026 Regular Payrun",
                company=COMPANY_NAME,
                salary_structure_id=std_structure.id,
                period_start=aug_start,
                period_end=aug_end,
                status=PayrunStatus.FINALIZED.value,
                employee_type="All",
                created_by_id=admin_user.id if admin_user else None,
                processed_at=datetime(2026, 8, 31, 18, 30),
                finalized_at=datetime(2026, 8, 31, 19, 0)
            )
            db.add(aug_payrun)
            db.flush()

            tot_gross, tot_ded, tot_net = 0.0, 0.0, 0.0
            emp_count = 0
            for esp in employees_spec:
                if esp["code"] == "EMP-024":
                    continue
                emp = emp_map.get(esp["email"])
                if not emp:
                    continue
                cnt = contract_map.get(emp.id)
                if not cnt:
                    continue

                slip_res = SalaryEngineService.calculate_employee_payroll(
                    db=db,
                    employee_id=emp.id,
                    period_start=aug_start,
                    period_end=aug_end,
                    contract_id=cnt.id
                )

                payslip_num = f"PS-2026-08-{emp.id:03d}"
                payslip = Payslip(
                    payslip_number=payslip_num,
                    payrun_id=aug_payrun.id,
                    employee_id=emp.id,
                    contract_id=cnt.id,
                    salary_structure_id=cnt.salary_structure_id,
                    company=COMPANY_NAME,
                    period_start=aug_start,
                    period_end=aug_end,
                    status=PayslipStatus.FINALIZED.value,
                    worked_days=slip_res["attendance"]["worked_days"],
                    unpaid_leave_days=slip_res["time_off"]["unpaid_leave_days"],
                    basic_salary=slip_res["basic_salary"],
                    total_earnings=slip_res["gross_salary"],
                    gross_salary=slip_res["gross_salary"],
                    total_deductions=slip_res["total_deductions"],
                    net_salary=slip_res["net_salary"],
                    employee_snapshot=slip_res["employee"],
                    contract_snapshot=slip_res["contract"],
                    attendance_snapshot=slip_res["attendance"],
                    time_off_snapshot=slip_res["time_off"],
                    calculation_trace=slip_res["calculation_trace"],
                    computed_at=datetime(2026, 8, 31, 18, 35),
                    finalized_at=datetime(2026, 8, 31, 19, 0),
                    pdf_path=f"/storage/payslips/{payslip_num}.pdf",
                    email_sent=True,
                    email_sent_at=datetime(2026, 8, 31, 19, 15)
                )
                db.add(payslip)
                db.flush()

                for comp in slip_res.get("components", []):
                    db.add(PayslipLine(
                        payslip_id=payslip.id,
                        rule_id=comp.get("rule_id"),
                        rule_name=comp.get("rule_name"),
                        rule_code=comp.get("rule_code"),
                        category=comp.get("category"),
                        sequence=comp.get("sequence", 10),
                        amount=comp.get("amount", 0.0),
                        total=comp.get("amount", 0.0),
                        calculation_type=comp.get("computation_type"),
                        calculation_expression=comp.get("description")
                    ))

                # Document entry
                db.add(PayslipDocument(
                    payslip_id=payslip.id,
                    document_type="PAYSLIP_PDF",
                    file_name=f"{payslip_num}.pdf",
                    file_path=f"/storage/payslips/{payslip_num}.pdf",
                    mime_type="application/pdf",
                    file_size=42800,
                    generated_at=datetime(2026, 8, 31, 19, 5),
                    generated_by=admin_user.id if admin_user else None
                ))

                # Email log entry
                db.add(PayslipEmailLog(
                    payslip_id=payslip.id,
                    recipient_email=emp.work_email,
                    subject=f"PeoplePay360 — Payslip for August 2026 ({payslip_num})",
                    status="SENT",
                    sent_at=datetime(2026, 8, 31, 19, 15),
                    sent_by=admin_user.id if admin_user else None
                ))

                tot_gross += slip_res["gross_salary"]
                tot_ded += slip_res["total_deductions"]
                tot_net += slip_res["net_salary"]
                emp_count += 1

            aug_payrun.total_employees = emp_count
            aug_payrun.successful_employees = emp_count
            aug_payrun.employee_count = emp_count
            aug_payrun.total_gross = tot_gross
            aug_payrun.total_deductions = tot_ded
            aug_payrun.total_net = tot_net
            aug_payrun.total_net_paid = tot_net
            db.flush()

        # =========================================================================
        # 10. CURRENT DEMO PAYRUN — SEPTEMBER 2026
        # =========================================================================
        sept_start = date(2026, 9, 1)
        sept_end = date(2026, 9, 30)
        sept_payrun = db.query(Payrun).filter(Payrun.period_start == sept_start).first()

        if not sept_payrun:
            sept_payrun = Payrun(
                name="September 2026 Regular Payrun",
                company=COMPANY_NAME,
                salary_structure_id=std_structure.id,
                period_start=sept_start,
                period_end=sept_end,
                status=PayrunStatus.DRAFT.value,
                employee_type="All",
                created_by_id=admin_user.id if admin_user else None,
                warning_count=3,
                total_employees=24
            )
            db.add(sept_payrun)
            db.flush()

            # Seed Controlled Validation Scenario
            for esp in employees_spec:
                emp = emp_map.get(esp["email"])
                if not emp:
                    continue
                cnt = contract_map.get(emp.id)

                # Controlled Exception 1: Riya Patel (Inactive, Expired contract)
                if emp.employee_code == "EMP-024":
                    pe = PayrunEmployee(
                        payrun_id=sept_payrun.id,
                        employee_id=emp.id,
                        contract_id=None,
                        status=PayrunEmployeeStatus.EXCLUDED.value,
                        excluded=True,
                        exclusion_reason="Contract expired on 2024-07-31 / Employee status is inactive"
                    )
                    db.add(pe)
                    db.add(PayrollWarning(
                        payrun_id=sept_payrun.id,
                        employee_id=emp.id,
                        warning_type="EXPIRED_CONTRACT",
                        message=f"Employee {emp.name} ({emp.employee_code}) has no running contract for September 2026."
                    ))
                    continue

                # Controlled Exception 2: Arjun Desai (Incomplete attendance / missing check-out)
                if emp.employee_code == "EMP-007":
                    pe = PayrunEmployee(
                        payrun_id=sept_payrun.id,
                        employee_id=emp.id,
                        contract_id=cnt.id if cnt else None,
                        status=PayrunEmployeeStatus.PENDING.value,
                        warnings=[{"type": "INCOMPLETE_ATTENDANCE", "message": "Missing check-out punch on 2026-09-14"}]
                    )
                    db.add(pe)
                    db.add(PayrollWarning(
                        payrun_id=sept_payrun.id,
                        employee_id=emp.id,
                        warning_type="INCOMPLETE_ATTENDANCE",
                        message=f"Employee {emp.name} has 1 incomplete attendance record (missing check-out) on Sep 14, 2026."
                    ))
                    continue

                # Controlled Exception 3: Dev Shah (Warning flag for review)
                if emp.employee_code == "EMP-021":
                    pe = PayrunEmployee(
                        payrun_id=sept_payrun.id,
                        employee_id=emp.id,
                        contract_id=cnt.id if cnt else None,
                        status=PayrunEmployeeStatus.PENDING.value,
                        warnings=[{"type": "CUSTOM_CHECK", "message": "Fixed-term contract renewal pending within 60 days"}]
                    )
                    db.add(pe)
                    db.add(PayrollWarning(
                        payrun_id=sept_payrun.id,
                        employee_id=emp.id,
                        warning_type="CONTRACT_RENEWAL_ALERT",
                        message=f"Employee {emp.name}'s fixed term contract requires HR renewal review."
                    ))
                    continue

                # Normal eligible employee (including Kabir Singh with 2 days unpaid leave)
                pe = PayrunEmployee(
                    payrun_id=sept_payrun.id,
                    employee_id=emp.id,
                    contract_id=cnt.id if cnt else None,
                    status=PayrunEmployeeStatus.PENDING.value
                )
                db.add(pe)
            db.flush()

        # =========================================================================
        # 11. AUDIT TRAIL LOGS
        # =========================================================================
        now_t = datetime.utcnow()
        recent_audits = [
            {"action": "PAYRUN_FINALIZED", "type": "payrun", "code": "August 2026 Regular Payrun", "actor": "Aarav Sharma", "details": "Finalized August 2026 payroll for 23 employees totaling ₹2,280,000 net payout.", "offset": 120},
            {"action": "PAYSLIP_EMAILED", "type": "payslip", "code": "PS-2026-08-006", "actor": "System Automation", "details": "Dispatched August 2026 payslip PDF to kabir.singh@peoplepay360.demo.", "offset": 110},
            {"action": "LEAVE_REQUEST_APPROVED", "type": "time_off", "code": "REQ-PTO-009", "actor": "Priya Nair", "details": "Approved 3.0 days Paid Time Off request for Neel Patel.", "offset": 90},
            {"action": "LEAVE_REQUEST_APPROVED", "type": "time_off", "code": "REQ-UNP-006", "actor": "Priya Nair", "details": "Approved 2.0 days Unpaid Leave request for Kabir Singh (Sep 10 - Sep 11).", "offset": 75},
            {"action": "CONTRACT_ACTIVATED", "type": "contract", "code": "CNT-012", "actor": "Priya Nair", "details": "Activated probation contract for Dhruv Mehta (Business Analyst).", "offset": 60},
            {"action": "EMPLOYEE_UPDATED", "type": "employee", "code": "EMP-006", "actor": "Aarav Sharma", "details": "Updated job details and direct reporting structure for Kabir Singh.", "offset": 45},
            {"action": "PAYRUN_CREATED", "type": "payrun", "code": "September 2026 Regular Payrun", "actor": "Rajesh Kumar", "details": "Created draft September 2026 payroll payrun for validation and calculation.", "offset": 20},
            {"action": "PAYSLIP_GENERATED", "type": "payslip", "code": "PS-2026-08-002", "actor": "Rajesh Kumar", "details": "Generated official PDF payslip document for Rohan Patel.", "offset": 15},
            {"action": "SCHEDULE_ASSIGNED", "type": "schedule", "code": "Flexible Working Hours", "actor": "Priya Nair", "details": "Assigned Flexible Working Hours schedule to Product and Sales teams.", "offset": 10},
            {"action": "LOGIN_SUCCESS", "type": "auth", "code": "admin@peoplepay360.demo", "actor": "Aarav Sharma", "details": "Super Admin successfully authenticated from local IP.", "offset": 2}
        ]

        for aud in recent_audits:
            existing_audit = db.query(AuditLog).filter(
                AuditLog.action == aud["action"],
                AuditLog.entity_code == aud["code"]
            ).first()
            if not existing_audit:
                db.add(AuditLog(
                    company=COMPANY_NAME,
                    actor_name=aud["actor"],
                    action=aud["action"],
                    entity_type=aud["type"],
                    entity_code=aud["code"],
                    details=aud["details"],
                    ip_address="127.0.0.1",
                    created_at=now_t - timedelta(minutes=aud["offset"])
                ))
        db.flush()

        db.commit()
        print("✅ PeoplePay360 database successfully seeded with all 15 connected modules!")
        print(f"   ✓ Primary Company: {COMPANY_NAME}")
        print(f"   ✓ 4 Working Schedules")
        print(f"   ✓ 4 Salary Structures & Detailed Rules")
        print(f"   ✓ 24 Connected Employees (EMP-001 to EMP-024) + Base Test Employees")
        print(f"   ✓ 25 Contracts (Running, Probation, Fixed-Term, Expired, Draft)")
        print(f"   ✓ Time Off Types & Annual Allocations")
        print(f"   ✓ Leave Requests (Sneha Pending, Neel Approved, Kabir 2-day Unpaid Approved)")
        print(f"   ✓ 100+ Attendance Records (Normal, Late, Incomplete, On Leave)")
        print(f"   ✓ July & August 2026 Finalized Payruns + Payslips + Documents + Emails")
        print(f"   ✓ September 2026 Draft Payrun with 3 Controlled Validation Exceptions")
        print(f"   ✓ Demo User Accounts (admin/hr/payroll/employee@peoplepay360.demo with Demo@123)")
        print(f"   ✓ Recent Activity & Audit Logs")

    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding database: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_db()
