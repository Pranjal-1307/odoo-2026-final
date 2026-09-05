from datetime import datetime, date
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import User, Employee, UserRole, EmployeeStatus

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed demo employees if not present
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
                employee_map[emp_data["work_email"]] = existing_emp.id

        # 2. Seed the 5 canonical Demo Users
        users_to_seed = [
            {
                "email": "admin@peoplepay360.com",
                "username": "Admin User",
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
            # Also seed an inactive test user to verify inactive login denial
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
                # Update role and password if needed
                existing.hashed_password = get_password_hash(u["password"])
                existing.role = u["role"]
                existing.is_active = u["is_active"]
                if emp_id:
                    existing.employee_id = emp_id

        db.commit()
        print("Database seeded successfully with 5 application roles and demo users.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
