import pytest
import time
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app.models import (
    User, UserRole,
    Employee, EmployeeStatus,
    Contract, ContractStatus,
    SalaryStructure,
    Payrun, PayrunStatus,
    Payslip, PayslipStatus,
    TimeOffType,
    TimeOffRequest, LeaveRequestStatus,
    TimeOffAllocation, AllocationStatus,
    Attendance, AttendanceStatus,
)

client = TestClient(app)

def get_auth_headers(email: str, password: str = "admin123"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200, f"Login failed for {email}: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="module")
def setup_dashboard_data():
    db = SessionLocal()
    ts = int(time.time())
    
    # 1. Structure
    struct = SalaryStructure(
        name=f"Dashboard Test Structure {ts}",
        code=f"DASH_STRUCT_{ts}",
        company="PeoplePay360 Inc.",
        pay_frequency="monthly",
        active=True
    )
    db.add(struct)
    db.commit()
    db.refresh(struct)

    # 2. Employees
    emp1 = Employee(
        employee_code=f"DASH_EMP1_{ts}",
        name=f"Aarav Dash {ts}",
        work_email=f"aarav.dash.{ts}@peoplepay360.com",
        department="Engineering",
        job_position="Senior Software Engineer",
        company="PeoplePay360 Inc.",
        status=EmployeeStatus.ACTIVE.value,
        bank_account_no="1234567890",
        pan_no="ABCDE1234F"
    )
    emp2 = Employee(
        employee_code=f"DASH_EMP2_{ts}",
        name=f"Riya Dash {ts}",
        work_email=f"riya.dash.{ts}@peoplepay360.com",
        department="Human Resources",
        job_position="HR Executive",
        company="PeoplePay360 Inc.",
        status=EmployeeStatus.ACTIVE.value,
        bank_account_no="",
        pan_no=""
    )
    db.add_all([emp1, emp2])
    db.commit()
    db.refresh(emp1)
    db.refresh(emp2)

    # 3. Dedicated Users
    emp_user = User(
        email=f"emp.dash.{ts}@peoplepay360.com",
        username=f"empdash{ts}",
        hashed_password=get_password_hash("password123"),
        role=UserRole.EMPLOYEE.value,
        employee_id=emp1.id,
        is_active=True,
    )
    db.add(emp_user)
    db.commit()
    db.refresh(emp_user)

    # 4. Contracts
    today = date.today()
    c1 = Contract(
        contract_code=f"DASH_CNT1_{ts}",
        name=f"Aarav Contract {ts}",
        employee_id=emp1.id,
        department="Engineering",
        job_position="Senior Software Engineer",
        start_date=today - timedelta(days=100),
        end_date=today + timedelta(days=15),  # Expiring soon
        wage_per_month=100000.0,
        status=ContractStatus.RUNNING.value,
        salary_structure_id=struct.id
    )
    db.add(c1)
    db.commit()
    db.refresh(c1)

    # 5. Payrun & Payslips
    pr = Payrun(
        name=f"September 2026 Payroll {ts}",
        company="PeoplePay360 Inc.",
        salary_structure_id=struct.id,
        period_start=date(2026, 9, 1),
        period_end=date(2026, 9, 30),
        status=PayrunStatus.PROCESSING.value,
        total_employees=2,
        successful_employees=1,
        failed_employees=1,
        total_gross=150000.0,
        total_deductions=20000.0,
        total_net=130000.0,
        total_employer_cost=165000.0
    )
    db.add(pr)
    db.commit()
    db.refresh(pr)

    ps1 = Payslip(
        payslip_number=f"PS-DASH-{ts}-001",
        payrun_id=pr.id,
        employee_id=emp1.id,
        contract_id=c1.id,
        salary_structure_id=struct.id,
        company="PeoplePay360 Inc.",
        period_start=date(2026, 9, 1),
        period_end=date(2026, 9, 30),
        status=PayslipStatus.FINALIZED.value,
        gross_salary=100000.0,
        total_deductions=15000.0,
        net_salary=85000.0,
        total_employer_contributions=10000.0,
        total_employer_cost=110000.0
    )
    db.add(ps1)
    db.commit()

    # 6. Time Off & Attendance
    tot = TimeOffType(
        name=f"Paid Time Off {ts}",
        unit="days",
        requires_allocation=True,
        is_unpaid=False,
        approval_type="hr",
        payroll_behavior="paid",
        active=True
    )
    db.add(tot)
    db.commit()
    db.refresh(tot)

    alloc = TimeOffAllocation(
        employee_id=emp1.id,
        time_off_type_id=tot.id,
        allocated_amount=20.0,
        taken_amount=0.0,
        remaining_amount=20.0,
        status=AllocationStatus.APPROVED.value
    )
    leave_req = TimeOffRequest(
        employee_id=emp1.id,
        time_off_type_id=tot.id,
        start_date=today + timedelta(days=5),
        end_date=today + timedelta(days=7),
        duration=3.0,
        status=LeaveRequestStatus.TO_APPROVE.value
    )
    att = Attendance(
        employee_id=emp1.id,
        date=today,
        status=AttendanceStatus.PRESENT.value,
        worked_hours=8.0
    )
    db.add_all([alloc, leave_req, att])
    db.commit()
    
    emp_email = str(emp_user.email)
    emp_id = int(emp1.id)
    db.close()

    return {
        "emp_email": emp_email,
        "emp_id": emp_id,
        "ts": ts
    }

def test_admin_dashboard_full_access(setup_dashboard_data):
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    response = client.get("/api/v1/dashboard", headers=headers)
    assert response.status_code == 200
    data = response.json()
    
    assert "period" in data
    assert "employees" in data
    assert "contracts" in data
    assert "payroll" in data
    assert "payroll_trend" in data
    assert "department_distribution" in data
    assert "alerts" in data
    assert "recent_payruns" in data
    assert "recent_activity" in data
    assert data["can_view_financials"] is True
    assert data["employees"]["total"] >= 2
    assert data["contracts"]["active"] >= 1

def test_dashboard_with_period_filter(setup_dashboard_data):
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    response = client.get("/api/v1/dashboard?period=2026-09", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["period"] == "2026-09"
    assert data["payroll"]["gross_payroll"] >= 0

def test_dashboard_with_department_filter(setup_dashboard_data):
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    response = client.get("/api/v1/dashboard?department=Engineering", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["employees"]["total"] >= 1

def test_dashboard_alerts_endpoint(setup_dashboard_data):
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    response = client.get("/api/v1/dashboard/alerts", headers=headers)
    assert response.status_code == 200
    alerts = response.json()
    assert isinstance(alerts, list)
    assert len(alerts) >= 1

def test_dashboard_payroll_trend_endpoint(setup_dashboard_data):
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    response = client.get("/api/v1/dashboard/payroll-trend", headers=headers)
    assert response.status_code == 200
    trend = response.json()
    assert isinstance(trend, list)
    assert len(trend) == 6

def test_dashboard_department_distribution_endpoint(setup_dashboard_data):
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    response = client.get("/api/v1/dashboard/department-distribution", headers=headers)
    assert response.status_code == 200
    dist = response.json()
    assert isinstance(dist, list)
    assert len(dist) >= 1

def test_employee_self_service_dashboard(setup_dashboard_data):
    emp_email = setup_dashboard_data["emp_email"]
    headers = get_auth_headers(emp_email, "password123")
    response = client.get("/api/v1/dashboard/employee", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "employee_code" in data
    assert "Aarav Dash" in data["name"]
    assert data["leave_allocations_total"] >= 20.0
    assert len(data["recent_payslips"]) >= 1

def test_unauthorized_dashboard_access():
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 401
