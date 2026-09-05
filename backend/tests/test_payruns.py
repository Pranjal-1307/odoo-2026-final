import pytest
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.session import Base
from app.api.deps import get_db
from app.core.security import get_password_hash, create_access_token
from app.models import (
    User,
    UserRole,
    Employee,
    EmployeeStatus,
    Contract,
    ContractStatus,
    SalaryStructure,
    SalaryRule,
    RuleCategory,
    ComputationType,
    WorkingSchedule,
    Payrun,
    PayrunEmployee,
    PayrunStatus,
    PayrunEmployeeStatus,
    Payslip,
    PayslipStatus,
)

# Test In-Memory Database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


client = TestClient(app)


@pytest.fixture(scope="function", autouse=True)
def setup_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()

    # 1. Create Users
    admin_user = User(
        email="admin@peoplepay360.com",
        username="admin",
        hashed_password=get_password_hash("Admin123!"),
        role=UserRole.ADMIN.value,
        is_active=True,
    )
    payroll_mgr = User(
        email="payrollmgr@peoplepay360.com",
        username="payrollmgr",
        hashed_password=get_password_hash("Payroll123!"),
        role=UserRole.HR_PAYROLL_MANAGER.value,
        is_active=True,
    )
    emp_user = User(
        email="emp@peoplepay360.com",
        username="empuser",
        hashed_password=get_password_hash("Emp123!"),
        role=UserRole.EMPLOYEE.value,
        is_active=True,
    )
    db.add_all([admin_user, payroll_mgr, emp_user])
    db.commit()

    # 2. Create Salary Structure & Rules
    struct = SalaryStructure(
        name="Standard Monthly Structure",
        code="STD_MTH",
        company="PeoplePay360 Inc.",
        pay_frequency="monthly",
        active=True,
    )
    db.add(struct)
    db.commit()
    db.refresh(struct)

    rule_basic = SalaryRule(
        structure_id=struct.id,
        name="Basic Salary",
        code="BASIC",
        category=RuleCategory.BASIC.value,
        sequence=10,
        computation_type=ComputationType.PERCENTAGE.value,
        percentage_base_code="WAGE",
        percentage_rate=50.0,  # 50% of WAGE
        active=True,
    )
    rule_hra = SalaryRule(
        structure_id=struct.id,
        name="House Rent Allowance",
        code="HRA",
        category=RuleCategory.ALLOWANCE.value,
        sequence=20,
        computation_type=ComputationType.PERCENTAGE.value,
        percentage_base_code="BASIC",
        percentage_rate=40.0,  # 40% of BASIC = 20% of WAGE
        active=True,
    )
    rule_pf = SalaryRule(
        structure_id=struct.id,
        name="Provident Fund",
        code="PF",
        category=RuleCategory.DEDUCTION.value,
        sequence=30,
        computation_type=ComputationType.PERCENTAGE.value,
        percentage_base_code="BASIC",
        percentage_rate=12.0,  # 12% of BASIC
        active=True,
    )
    db.add_all([rule_basic, rule_hra, rule_pf])
    db.commit()

    # 3. Create Employees
    emp1 = Employee(
        employee_code="EMP001",
        name="Aarav Mehta",
        work_email="aarav@peoplepay360.com",
        department="Engineering",
        job_position="Software Engineer",
        company="PeoplePay360 Inc.",
        status=EmployeeStatus.ACTIVE.value,
        bank_account_no="1234567890",
        pan_no="ABCDE1234F",
    )
    emp2 = Employee(
        employee_code="EMP002",
        name="Priya Shah",
        work_email="priya@peoplepay360.com",
        department="HR",
        job_position="HR Specialist",
        company="PeoplePay360 Inc.",
        status=EmployeeStatus.ACTIVE.value,
        bank_account_no=None,  # missing bank details warning
        pan_no="PQRS9876T",
    )
    emp_inactive = Employee(
        employee_code="EMP003",
        name="Inactive Person",
        work_email="inactive@peoplepay360.com",
        department="Operations",
        job_position="Assistant",
        company="PeoplePay360 Inc.",
        status=EmployeeStatus.INACTIVE.value,
    )
    db.add_all([emp1, emp2, emp_inactive])
    db.commit()

    # 4. Create Contracts
    c1 = Contract(
        contract_code="CNT-001",
        name="Aarav Contract",
        employee_id=emp1.id,
        start_date=date(2026, 1, 1),
        end_date=None,
        wage_per_month=60000.0,
        status=ContractStatus.RUNNING.value,
        salary_structure_id=struct.id,
    )
    c2 = Contract(
        contract_code="CNT-002",
        name="Priya Contract",
        employee_id=emp2.id,
        start_date=date(2026, 1, 1),
        end_date=None,
        wage_per_month=50000.0,
        status=ContractStatus.RUNNING.value,
        salary_structure_id=struct.id,
    )
    db.add_all([c1, c2])
    db.commit()

    yield

    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.pop(get_db, None)


def get_auth_token(username: str, role: str) -> str:
    db = TestingSessionLocal()
    user = db.query(User).filter(User.username == username).first()
    user_id = str(user.id)
    db.close()
    return create_access_token(subject=user_id, role=role)


# ----------------------------------------------------
# Tests
# ----------------------------------------------------
def test_01_eligibility_query():
    """Verify eligibility query identifies active employees with contracts vs inactive."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get(
        "/api/v1/payroll/payruns/eligible-employees?company=PeoplePay360 Inc.&period_start=2026-09-01&period_end=2026-09-30",
        headers=headers,
    )
    assert res.status_code == 200
    data = res.json()
    assert data["eligible_count"] == 2
    assert data["ineligible_count"] == 1
    eligible_names = [e["employee_name"] for e in data["eligible_employees"]]
    assert "Aarav Mehta" in eligible_names
    assert "Priya Shah" in eligible_names
    assert data["ineligible_employees"][0]["employee_name"] == "Inactive Person"


def test_02_create_payrun_draft():
    """Verify creating a Payrun initializes in DRAFT with populated PayrunEmployees."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "September 2026 Payroll",
        "company": "PeoplePay360 Inc.",
        "period_start": "2026-09-01",
        "period_end": "2026-09-30",
        "employee_type": "All",
    }
    res = client.post("/api/v1/payroll/payruns", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "draft"
    assert data["name"] == "September 2026 Payroll"
    assert data["total_employees"] == 2
    assert len(data["employees"]) == 2
    assert data["employees"][0]["status"] == "pending"


def test_03_invalid_date_validation():
    """Verify start_date > end_date is rejected with 400."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "Invalid Period Payroll",
        "company": "PeoplePay360 Inc.",
        "period_start": "2026-09-30",
        "period_end": "2026-09-01",
    }
    res = client.post("/api/v1/payroll/payruns", json=payload, headers=headers)
    assert res.status_code == 400
    assert "cannot be after end date" in res.json()["detail"]


def test_04_duplicate_active_payrun_rejected():
    """Verify duplicate active payrun for same period and company is rejected."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    payload = {
        "name": "September 2026 Payroll 1",
        "company": "PeoplePay360 Inc.",
        "period_start": "2026-09-01",
        "period_end": "2026-09-30",
    }
    res1 = client.post("/api/v1/payroll/payruns", json=payload, headers=headers)
    assert res1.status_code == 201

    payload2 = {
        "name": "September 2026 Payroll 2",
        "company": "PeoplePay360 Inc.",
        "period_start": "2026-09-01",
        "period_end": "2026-09-30",
    }
    res2 = client.post("/api/v1/payroll/payruns", json=payload2, headers=headers)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]


def test_05_update_employee_selection_and_exclusions():
    """Verify selecting/excluding employees and exclusion reasons."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    # Create payrun
    create_res = client.post(
        "/api/v1/payroll/payruns",
        json={
            "name": "October 2026 Payroll",
            "company": "PeoplePay360 Inc.",
            "period_start": "2026-10-01",
            "period_end": "2026-10-31",
        },
        headers=headers,
    )
    payrun_id = create_res.json()["id"]

    db = TestingSessionLocal()
    aarav_id = db.query(Employee).filter(Employee.name == "Aarav Mehta").first().id
    priya_id = db.query(Employee).filter(Employee.name == "Priya Shah").first().id
    db.close()

    # Exclude Priya
    update_res = client.post(
        f"/api/v1/payroll/payruns/{payrun_id}/employees",
        json={
            "employee_ids": [aarav_id],
            "exclusion_reasons": {priya_id: "Contract under renegotiation"},
        },
        headers=headers,
    )
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["excluded_employees"] == 1

    emp_dict = {e["employee_id"]: e for e in data["employees"]}
    assert emp_dict[aarav_id]["excluded"] is False
    assert emp_dict[priya_id]["excluded"] is True
    assert emp_dict[priya_id]["exclusion_reason"] == "Contract under renegotiation"


def test_06_pre_processing_validation():
    """Verify pre-processing validation generates warnings (missing bank) and detects errors."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/payroll/payruns",
        json={
            "name": "November 2026 Payroll",
            "company": "PeoplePay360 Inc.",
            "period_start": "2026-11-01",
            "period_end": "2026-11-30",
        },
        headers=headers,
    )
    payrun_id = create_res.json()["id"]

    val_res = client.post(f"/api/v1/payroll/payruns/{payrun_id}/validate", headers=headers)
    assert val_res.status_code == 200
    val_data = val_res.json()
    assert val_data["can_process"] is True
    assert val_data["valid_count"] == 2
    assert val_data["warning_count"] >= 1  # Priya missing bank


def test_07_process_payrun_salary_engine_batch():
    """Verify batch processing calls Salary Rules Engine and aggregates totals correctly."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/payroll/payruns",
        json={
            "name": "December 2026 Payroll",
            "company": "PeoplePay360 Inc.",
            "period_start": "2026-12-01",
            "period_end": "2026-12-31",
        },
        headers=headers,
    )
    payrun_id = create_res.json()["id"]

    # Process Payrun
    proc_res = client.post(f"/api/v1/payroll/payruns/{payrun_id}/process", headers=headers)
    assert proc_res.status_code == 200
    data = proc_res.json()
    assert data["status"] == "review"
    assert data["successful_employees"] == 2
    assert data["failed_employees"] == 0

    # Aarav (wage=60000): Basic=30000, HRA=12000, Gross=42000, PF=3600, Net=38400
    # Priya (wage=50000): Basic=25000, HRA=10000, Gross=35000, PF=3000, Net=32000
    # Total Gross = 77000, Total Deductions = 6600, Total Net = 70400
    assert data["total_gross"] == 77000.0
    assert data["total_deductions"] == 6600.0
    assert data["total_net"] == 70400.0

    # Check calculation trace for Aarav
    aarav_item = [e for e in data["employees"] if e["employee_name"] == "Aarav Mehta"][0]
    assert aarav_item["status"] == "success"
    assert aarav_item["gross_salary"] == 42000.0
    assert aarav_item["net_salary"] == 38400.0
    assert len(aarav_item["calculation_trace"]) >= 3


def test_08_recalculate_single_employee():
    """Verify recalculating single employee updates values and payrun aggregates."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/payroll/payruns",
        json={
            "name": "January 2027 Payroll",
            "company": "PeoplePay360 Inc.",
            "period_start": "2027-01-01",
            "period_end": "2027-01-31",
        },
        headers=headers,
    )
    payrun_id = create_res.json()["id"]
    client.post(f"/api/v1/payroll/payruns/{payrun_id}/process", headers=headers)

    db = TestingSessionLocal()
    aarav = db.query(Employee).filter(Employee.name == "Aarav Mehta").first()
    aarav_id = aarav.id
    # Change Aarav's contract wage
    contract = db.query(Contract).filter(Contract.employee_id == aarav_id).first()
    contract.wage_per_month = 80000.0  # New Basic=40000, HRA=16000, Gross=56000, PF=4800, Net=51200
    db.commit()
    db.close()

    # Recalculate Aarav
    recalc_res = client.post(f"/api/v1/payroll/payruns/{payrun_id}/employees/{aarav_id}/recalculate", headers=headers)
    assert recalc_res.status_code == 200
    recalc_data = recalc_res.json()
    assert recalc_data["status"] == "success"
    assert recalc_data["gross_salary"] == 56000.0
    assert recalc_data["net_salary"] == 51200.0

    # Check updated payrun totals
    assert recalc_data["payrun"]["total_net"] == 51200.0 + 32000.0  # 83200.0


def test_09_finalize_payrun_generates_payslips_and_locks():
    """Verify finalizing payrun creates official Payslips and locks against modifications."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/payroll/payruns",
        json={
            "name": "February 2027 Payroll",
            "company": "PeoplePay360 Inc.",
            "period_start": "2027-02-01",
            "period_end": "2027-02-28",
        },
        headers=headers,
    )
    payrun_id = create_res.json()["id"]
    client.post(f"/api/v1/payroll/payruns/{payrun_id}/process", headers=headers)

    # Finalize Payrun
    fin_res = client.post(f"/api/v1/payroll/payruns/{payrun_id}/finalize", headers=headers)
    assert fin_res.status_code == 200
    fin_data = fin_res.json()
    assert fin_data["status"] == "finalized"
    assert fin_data["finalized_at"] is not None

    # Check Payslips were created in DB
    db = TestingSessionLocal()
    payslips = db.query(Payslip).filter(Payslip.payrun_id == payrun_id).all()
    assert len(payslips) == 2
    for p in payslips:
        assert p.status == "validated"
        assert len(p.lines) >= 3
    db.close()

    # Attempt to re-process or modify finalized payrun must fail
    proc_again = client.post(f"/api/v1/payroll/payruns/{payrun_id}/process", headers=headers)
    assert proc_again.status_code == 400

    del_again = client.delete(f"/api/v1/payroll/payruns/{payrun_id}", headers=headers)
    assert del_again.status_code == 400


def test_10_cancel_payrun():
    """Verify cancelling an unfinalized payrun."""
    token = get_auth_token("payrollmgr", UserRole.HR_PAYROLL_MANAGER.value)
    headers = {"Authorization": f"Bearer {token}"}

    create_res = client.post(
        "/api/v1/payroll/payruns",
        json={
            "name": "March 2027 Payroll",
            "company": "PeoplePay360 Inc.",
            "period_start": "2027-03-01",
            "period_end": "2027-03-31",
        },
        headers=headers,
    )
    payrun_id = create_res.json()["id"]

    cancel_res = client.post(f"/api/v1/payroll/payruns/{payrun_id}/cancel", headers=headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"


def test_11_rbac_permissions():
    """Verify normal Employee cannot create or process Payruns (403 Forbidden)."""
    emp_token = get_auth_token("empuser", UserRole.EMPLOYEE.value)
    headers = {"Authorization": f"Bearer {emp_token}"}

    payload = {
        "name": "Unauthorized Payroll",
        "company": "PeoplePay360 Inc.",
        "period_start": "2027-04-01",
        "period_end": "2027-04-30",
    }
    res = client.post("/api/v1/payroll/payruns", json=payload, headers=headers)
    assert res.status_code == 403
