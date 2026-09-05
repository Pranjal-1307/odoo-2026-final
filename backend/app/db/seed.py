from datetime import datetime, date, time, timedelta
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
    Payrun, Payslip, PayslipLine, PayslipStatus, PayrunStatus, LeaveRequestStatus, AllocationStatus
)

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Working Schedules
        schedules_data = [
            {
                "name": "40 Hours / Week",
                "company": "PeoplePay360 Inc.",
                "timezone": "Asia/Kolkata",
                "days_per_week": 5,
                "hours_per_week": 40.0,
                "status": "active",
                "days": [
                    {"day": "Monday", "start": time(9, 0), "end": time(18, 0), "break": 1.0, "hours": 8.0},
                    {"day": "Tuesday", "start": time(9, 0), "end": time(18, 0), "break": 1.0, "hours": 8.0},
                    {"day": "Wednesday", "start": time(9, 0), "end": time(18, 0), "break": 1.0, "hours": 8.0},
                    {"day": "Thursday", "start": time(9, 0), "end": time(18, 0), "break": 1.0, "hours": 8.0},
                    {"day": "Friday", "start": time(9, 0), "end": time(18, 0), "break": 1.0, "hours": 8.0},
                ]
            },
            {
                "name": "Night Shift",
                "company": "PeoplePay360 Inc.",
                "timezone": "Asia/Kolkata",
                "days_per_week": 5,
                "hours_per_week": 40.0,
                "status": "active",
                "days": [
                    {"day": "Monday", "start": time(22, 0), "end": time(6, 0), "break": 0.0, "hours": 8.0},
                    {"day": "Tuesday", "start": time(22, 0), "end": time(6, 0), "break": 0.0, "hours": 8.0},
                    {"day": "Wednesday", "start": time(22, 0), "end": time(6, 0), "break": 0.0, "hours": 8.0},
                    {"day": "Thursday", "start": time(22, 0), "end": time(6, 0), "break": 0.0, "hours": 8.0},
                    {"day": "Friday", "start": time(22, 0), "end": time(6, 0), "break": 0.0, "hours": 8.0},
                ]
            },
            {
                "name": "Retail Weekend",
                "company": "PeoplePay360 Inc.",
                "timezone": "Asia/Kolkata",
                "days_per_week": 6,
                "hours_per_week": 48.0,
                "status": "active",
                "days": [
                    {"day": "Monday", "start": time(10, 0), "end": time(19, 0), "break": 1.0, "hours": 8.0},
                    {"day": "Tuesday", "start": time(10, 0), "end": time(19, 0), "break": 1.0, "hours": 8.0},
                    {"day": "Wednesday", "start": time(10, 0), "end": time(19, 0), "break": 1.0, "hours": 8.0},
                    {"day": "Thursday", "start": time(10, 0), "end": time(19, 0), "break": 1.0, "hours": 8.0},
                    {"day": "Friday", "start": time(10, 0), "end": time(19, 0), "break": 1.0, "hours": 8.0},
                    {"day": "Saturday", "start": time(10, 0), "end": time(19, 0), "break": 1.0, "hours": 8.0},
                ]
            },
            {
                "name": "Flexible Hybrid",
                "company": "PeoplePay360 Inc.",
                "timezone": "Asia/Kolkata",
                "days_per_week": 5,
                "hours_per_week": 40.0,
                "status": "active",
                "days": [
                    {"day": "Monday", "start": time(9, 30), "end": time(18, 30), "break": 1.0, "hours": 8.0},
                    {"day": "Tuesday", "start": time(9, 30), "end": time(18, 30), "break": 1.0, "hours": 8.0},
                    {"day": "Wednesday", "start": time(9, 30), "end": time(18, 30), "break": 1.0, "hours": 8.0},
                    {"day": "Thursday", "start": time(9, 30), "end": time(18, 30), "break": 1.0, "hours": 8.0},
                    {"day": "Friday", "start": time(9, 30), "end": time(18, 30), "break": 1.0, "hours": 8.0},
                ]
            },
            {
                "name": "Part-time 20h",
                "company": "PeoplePay360 Inc.",
                "timezone": "Asia/Kolkata",
                "days_per_week": 5,
                "hours_per_week": 20.0,
                "status": "active",
                "days": [
                    {"day": "Monday", "start": time(9, 0), "end": time(13, 0), "break": 0.0, "hours": 4.0},
                    {"day": "Tuesday", "start": time(9, 0), "end": time(13, 0), "break": 0.0, "hours": 4.0},
                    {"day": "Wednesday", "start": time(9, 0), "end": time(13, 0), "break": 0.0, "hours": 4.0},
                    {"day": "Thursday", "start": time(9, 0), "end": time(13, 0), "break": 0.0, "hours": 4.0},
                    {"day": "Friday", "start": time(9, 0), "end": time(13, 0), "break": 0.0, "hours": 4.0},
                ]
            }
        ]

        standard_schedule = None
        for s_info in schedules_data:
            existing = db.query(WorkingSchedule).filter(WorkingSchedule.name == s_info["name"]).first()
            if not existing:
                new_sched = WorkingSchedule(
                    name=s_info["name"],
                    company=s_info["company"],
                    timezone=s_info["timezone"],
                    days_per_week=s_info["days_per_week"],
                    hours_per_week=s_info["hours_per_week"],
                    status=s_info["status"]
                )
                db.add(new_sched)
                db.flush()
                for d in s_info["days"]:
                    db.add(WorkingScheduleDay(
                        schedule_id=new_sched.id,
                        day_of_week=d["day"],
                        start_time=d["start"],
                        end_time=d["end"],
                        break_hours=d["break"],
                        daily_hours=d["hours"]
                    ))
                db.flush()
                if s_info["name"] == "40 Hours / Week":
                    standard_schedule = new_sched
            else:
                if s_info["name"] == "40 Hours / Week":
                    standard_schedule = existing
        
        if not standard_schedule:
            standard_schedule = db.query(WorkingSchedule).first()

        # 2. Seed demo employees if not present
        demo_employees = [
            {
                "employee_code": "EMP001",
                "name": "Sarah Connor",
                "work_email": "admin@peoplepay360.com",
                "phone": "+1 (555) 019-2831",
                "department": "Executive / IT",
                "job_position": "System Administrator & HR Director",
                "company": "PeoplePay360 Inc.",
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_schedule.id,
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
                "company": "PeoplePay360 Inc.",
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_schedule.id,
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
                "company": "PeoplePay360 Inc.",
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_schedule.id,
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
                "company": "PeoplePay360 Inc.",
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_schedule.id,
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
                "company": "PeoplePay360 Inc.",
                "work_location": "Headquarters",
                "employee_type": "Full-Time",
                "status": EmployeeStatus.ACTIVE.value,
                "working_schedule_id": standard_schedule.id,
                "bank_name": "Chase Bank",
                "bank_account_no": "58765432105",
                "ifsc_code": "CHAS0007890",
                "pan_no": "EFGHI5678J"
            }
        ]

        employee_map = {}
        for emp_data in demo_employees:
            existing_emp = db.query(Employee).filter(Employee.work_email == emp_data["work_email"]).first()
            if not existing_emp:
                new_emp = Employee(**emp_data)
                db.add(new_emp)
                db.flush()
                employee_map[emp_data["work_email"]] = new_emp.id
            else:
                existing_emp.working_schedule_id = standard_schedule.id
                employee_map[emp_data["work_email"]] = existing_emp.id

        # Update manager relationships
        sarah_id = employee_map.get("admin@peoplepay360.com")
        vikram_id = employee_map.get("payroll.manager@peoplepay360.com")
        marcus_id = employee_map.get("hr.manager@peoplepay360.com")
        
        # Vikram & Marcus report to Sarah
        if vikram_id and sarah_id:
            emp = db.query(Employee).filter(Employee.id == vikram_id).first()
            if emp: emp.manager_id = sarah_id
        if marcus_id and sarah_id:
            emp = db.query(Employee).filter(Employee.id == marcus_id).first()
            if emp: emp.manager_id = sarah_id
            
        # Neha reports to Vikram
        neha_id = employee_map.get("payroll.user@peoplepay360.com")
        if neha_id and vikram_id:
            emp = db.query(Employee).filter(Employee.id == neha_id).first()
            if emp: emp.manager_id = vikram_id

        # Aarav reports to Marcus
        aarav_id = employee_map.get("employee@peoplepay360.com")
        if aarav_id and marcus_id:
            emp = db.query(Employee).filter(Employee.id == aarav_id).first()
            if emp: emp.manager_id = marcus_id

        # 3. Seed Users
        users_to_seed = [
            {
                "email": "admin@peoplepay360.com",
                "username": "Sarah Connor",
                "password": "admin123",
                "role": "Admin",
                "is_active": True,
                "employee_email": "admin@peoplepay360.com"
            },
            {
                "email": "payroll.manager@peoplepay360.com",
                "username": "Vikram Malhotra",
                "password": "payrollmgr123",
                "role": "HR Payroll Manager",
                "is_active": True,
                "employee_email": "payroll.manager@peoplepay360.com"
            },
            {
                "email": "payroll.user@peoplepay360.com",
                "username": "Neha Patel",
                "password": "payrolluser123",
                "role": "HR Payroll User",
                "is_active": True,
                "employee_email": "payroll.user@peoplepay360.com"
            },
            {
                "email": "hr.manager@peoplepay360.com",
                "username": "Marcus Vance",
                "password": "hrmanager123",
                "role": "HR Manager",
                "is_active": True,
                "employee_email": "hr.manager@peoplepay360.com"
            },
            {
                "email": "employee@peoplepay360.com",
                "username": "Aarav Mehta",
                "password": "employee123",
                "role": "Employee",
                "is_active": True,
                "employee_email": "employee@peoplepay360.com"
            },
            {
                "email": "inactive@peoplepay360.com",
                "username": "Inactive User",
                "password": "inactive123",
                "role": "Employee",
                "is_active": False,
                "employee_email": None
            }
        ]

        for u in users_to_seed:
            existing = db.query(User).filter(User.email == u["email"]).first()
            emp_id = employee_map.get(u.get("employee_email")) if u.get("employee_email") else None
            
            if not existing:
                user_obj = User(
                    email=u["email"],
                    username=u["username"],
                    hashed_password=get_password_hash(u["password"]),
                    role=u["role"],
                    is_active=u["is_active"],
                    employee_id=emp_id
                )
                db.add(user_obj)
            else:
                existing.hashed_password = get_password_hash(u["password"])
                existing.role = u["role"]
                existing.is_active = u["is_active"]
                if emp_id:
                    existing.employee_id = emp_id

        # 4. Seed Salary Structure for Contracts & Payslips
        salary_structure = db.query(SalaryStructure).filter(SalaryStructure.code == "REG_SAL").first()
        if not salary_structure:
            salary_structure = SalaryStructure(
                name="Regular Standard Salary Structure",
                code="REG_SAL",
                active=True
            )
            db.add(salary_structure)
            db.flush()

            # Add Standard Salary Rules
            rules = [
                SalaryRule(structure_id=salary_structure.id, name="Basic Salary", code="BASIC", category=RuleCategory.BASIC.value, sequence=10, computation_type=ComputationType.PERCENTAGE.value, percentage_rate=50.0),
                SalaryRule(structure_id=salary_structure.id, name="House Rent Allowance", code="HRA", category=RuleCategory.ALLOWANCE.value, sequence=20, computation_type=ComputationType.PERCENTAGE.value, percentage_rate=25.0, percentage_base_code="BASIC"),
                SalaryRule(structure_id=salary_structure.id, name="Special Allowance", code="SPL_ALLOW", category=RuleCategory.ALLOWANCE.value, sequence=30, computation_type=ComputationType.FIXED.value, fixed_amount=5000.0),
                SalaryRule(structure_id=salary_structure.id, name="Gross Earnings", code="GROSS", category=RuleCategory.GROSS.value, sequence=40, computation_type=ComputationType.FORMULA.value, formula_expression="BASIC + HRA + SPL_ALLOW"),
                SalaryRule(structure_id=salary_structure.id, name="Provident Fund", code="PF", category=RuleCategory.DEDUCTION.value, sequence=50, computation_type=ComputationType.PERCENTAGE.value, percentage_rate=12.0, percentage_base_code="BASIC"),
                SalaryRule(structure_id=salary_structure.id, name="Professional Tax", code="PT", category=RuleCategory.DEDUCTION.value, sequence=60, computation_type=ComputationType.FIXED.value, fixed_amount=200.0),
                SalaryRule(structure_id=salary_structure.id, name="Net Salary", code="NET", category=RuleCategory.NET.value, sequence=70, computation_type=ComputationType.FORMULA.value, formula_expression="GROSS - PF - PT")
            ]
            for r in rules:
                db.add(r)
            db.flush()

        # 5. Seed Leave Types & Allocations for Aarav Mehta (Live smart button count: 2 Allocations, 3 Time Off requests)
        paid_leave = db.query(TimeOffType).filter(TimeOffType.name == "Paid Time Off").first()
        if not paid_leave:
            paid_leave = TimeOffType(name="Paid Time Off", unit="days", requires_allocation=True, is_unpaid=False, color="#017E84")
            db.add(paid_leave)
        sick_leave = db.query(TimeOffType).filter(TimeOffType.name == "Sick Leave").first()
        if not sick_leave:
            sick_leave = TimeOffType(name="Sick Leave", unit="days", requires_allocation=True, is_unpaid=False, color="#E2A03F")
            db.add(sick_leave)
        db.flush()

        if aarav_id:
            # Seed 2 Allocations
            if db.query(TimeOffAllocation).filter(TimeOffAllocation.employee_id == aarav_id).count() == 0:
                db.add(TimeOffAllocation(
                    employee_id=aarav_id,
                    time_off_type_id=paid_leave.id,
                    allocated_amount=24.0,
                    taken_amount=3.0,
                    remaining_amount=21.0,
                    status=AllocationStatus.APPROVED.value,
                    approver_id=marcus_id
                ))
                db.add(TimeOffAllocation(
                    employee_id=aarav_id,
                    time_off_type_id=sick_leave.id,
                    allocated_amount=12.0,
                    taken_amount=1.0,
                    remaining_amount=11.0,
                    status=AllocationStatus.APPROVED.value,
                    approver_id=marcus_id
                ))
                db.flush()

            # Seed 3 Time Off Requests
            if db.query(TimeOffRequest).filter(TimeOffRequest.employee_id == aarav_id).count() == 0:
                db.add(TimeOffRequest(
                    employee_id=aarav_id,
                    time_off_type_id=paid_leave.id,
                    start_date=date(2026, 1, 15),
                    end_date=date(2026, 1, 16),
                    duration=2.0,
                    status=LeaveRequestStatus.APPROVED.value,
                    reason="Family trip",
                    approver_id=marcus_id
                ))
                db.add(TimeOffRequest(
                    employee_id=aarav_id,
                    time_off_type_id=sick_leave.id,
                    start_date=date(2026, 2, 5),
                    end_date=date(2026, 2, 5),
                    duration=1.0,
                    status=LeaveRequestStatus.APPROVED.value,
                    reason="Dental appointment",
                    approver_id=marcus_id
                ))
                db.add(TimeOffRequest(
                    employee_id=aarav_id,
                    time_off_type_id=paid_leave.id,
                    start_date=date(2026, 3, 20),
                    end_date=date(2026, 3, 20),
                    duration=1.0,
                    status=LeaveRequestStatus.TO_APPROVE.value,
                    reason="Personal work",
                    approver_id=marcus_id
                ))
                db.flush()

            # Seed 2 Contracts for Aarav Mehta (1 previous expired, 1 current running)
            if db.query(Contract).filter(Contract.employee_id == aarav_id).count() == 0:
                db.add(Contract(
                    contract_code="CNT-2025-001",
                    name="Aarav Mehta - Junior Engineer 2025",
                    employee_id=aarav_id,
                    department="Engineering",
                    job_position="Software Engineer",
                    start_date=date(2025, 1, 1),
                    end_date=date(2025, 12, 31),
                    wage_per_month=65000.0,
                    status=ContractStatus.EXPIRED.value,
                    working_schedule_id=standard_schedule.id,
                    salary_structure_id=salary_structure.id
                ))
                running_contract = Contract(
                    contract_code="CNT-2026-005",
                    name="Aarav Mehta - Senior Engineer 2026",
                    employee_id=aarav_id,
                    department="Engineering",
                    job_position="Senior Software Engineer",
                    start_date=date(2026, 1, 1),
                    end_date=None,
                    wage_per_month=95000.0,
                    status=ContractStatus.RUNNING.value,
                    working_schedule_id=standard_schedule.id,
                    salary_structure_id=salary_structure.id
                )
                db.add(running_contract)
                db.flush()

                # Seed Sample Payrun & Payslip for Aarav Mehta
                payrun = Payrun(
                    name="January 2026 Regular Payrun",
                    salary_structure_id=salary_structure.id,
                    period_start=date(2026, 1, 1),
                    period_end=date(2026, 1, 31),
                    status=PayrunStatus.PAID.value,
                    employee_count=1,
                    total_net_paid=84500.0
                )
                db.add(payrun)
                db.flush()

                payslip = Payslip(
                    payslip_number="PS-2026-01-005",
                    payrun_id=payrun.id,
                    employee_id=aarav_id,
                    contract_id=running_contract.id,
                    salary_structure_id=salary_structure.id,
                    period_start=date(2026, 1, 1),
                    period_end=date(2026, 1, 31),
                    status=PayslipStatus.PAID.value,
                    worked_days=22.0,
                    unpaid_leave_days=0.0,
                    basic_salary=47500.0,
                    gross_salary=95000.0,
                    total_deductions=10500.0,
                    net_salary=84500.0
                )
                db.add(payslip)
                db.flush()

            # Seed 25 Attendance records for Aarav Mehta
            if db.query(Attendance).filter(Attendance.employee_id == aarav_id).count() == 0:
                base_day = date(2026, 1, 1)
                count = 0
                for day_offset in range(35):
                    cur_date = base_day + timedelta(days=day_offset)
                    if cur_date.weekday() < 5:  # Weekdays only
                        db.add(Attendance(
                            employee_id=aarav_id,
                            date=cur_date,
                            check_in=datetime.combine(cur_date, time(9, 2)),
                            check_out=datetime.combine(cur_date, time(18, 5)),
                            worked_hours=8.0,
                            overtime_hours=0.0,
                            status=AttendanceStatus.PRESENT.value
                        ))
                        count += 1
                        if count >= 25:
                            break
                db.flush()

            # Seed Contracts for other demo employees if not present
            other_contracts_seed = [
                {
                    "email": "admin@peoplepay360.com",
                    "code": "CNT-2026-001",
                    "name": "Sarah Connor - Executive IT Contract 2026",
                    "wage": 150000.0,
                    "dept": "Executive / IT",
                    "pos": "System Administrator & HR Director"
                },
                {
                    "email": "payroll.manager@peoplepay360.com",
                    "code": "CNT-2026-002",
                    "name": "Vikram Malhotra - Payroll Manager Contract 2026",
                    "wage": 120000.0,
                    "dept": "Finance & Payroll",
                    "pos": "Payroll Manager"
                },
                {
                    "email": "payroll.user@peoplepay360.com",
                    "code": "CNT-2026-003",
                    "name": "Neha Patel - Payroll Specialist Contract 2026",
                    "wage": 80000.0,
                    "dept": "Finance & Payroll",
                    "pos": "Payroll Specialist"
                },
                {
                    "email": "hr.manager@peoplepay360.com",
                    "code": "CNT-2026-004",
                    "name": "Marcus Vance - HR Manager Contract 2026",
                    "wage": 115000.0,
                    "dept": "Human Resources",
                    "pos": "HR Operations Manager"
                }
            ]

            for seed_item in other_contracts_seed:
                e_id = employee_map.get(seed_item["email"])
                if e_id and db.query(Contract).filter(Contract.employee_id == e_id).count() == 0:
                    db.add(Contract(
                        contract_code=seed_item["code"],
                        name=seed_item["name"],
                        employee_id=e_id,
                        department=seed_item["dept"],
                        job_position=seed_item["pos"],
                        start_date=date(2026, 1, 1),
                        end_date=None,
                        wage_per_month=seed_item["wage"],
                        status=ContractStatus.RUNNING.value,
                        working_schedule_id=standard_schedule.id,
                        salary_structure_id=salary_structure.id
                    ))
            db.flush()

        db.commit()
        print("Database successfully seeded with standard schedules, roles, employees, and smart-button demo relationships.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
