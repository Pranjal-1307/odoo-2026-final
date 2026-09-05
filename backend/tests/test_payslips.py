import pytest
import time
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.db.session import SessionLocal
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
    Payslip,
    PayslipLine,
    PayslipStatus,
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
def setup_test_data():
    db = SessionLocal()
    try:
        # Create a dedicated salary structure for module 10 tests
        ts = int(time.time())
        struct = SalaryStructure(
            name=f"Payslip Test Structure {ts}",
            code=f"PS_TEST_{ts}",
            company="PeoplePay360 Inc.",
            pay_frequency="monthly",
            active=True,
        )
        db.add(struct)
        db.commit()
        db.refresh(struct)

        # Basic: 50,000 fixed
        rule_basic = SalaryRule(
            structure_id=struct.id,
            name="Basic Salary",
            code="BASIC",
            category=RuleCategory.BASIC.value,
            sequence=10,
            computation_type=ComputationType.FIXED.value,
            fixed_amount=50000.0,
            active=True,
        )
        # HRA: 40% of BASIC = 20,000
        rule_hra = SalaryRule(
            structure_id=struct.id,
            name="House Rent Allowance",
            code="HRA",
            category=RuleCategory.ALLOWANCE.value,
            sequence=20,
            computation_type=ComputationType.PERCENTAGE.value,
            percentage_base_code="BASIC",
            percentage_rate=40.0,
            active=True,
        )
        # Special Allowance: Fixed 10,000
        rule_special = SalaryRule(
            structure_id=struct.id,
            name="Special Allowance",
            code="SPECIAL",
            category=RuleCategory.ALLOWANCE.value,
            sequence=25,
            computation_type=ComputationType.FIXED.value,
            fixed_amount=10000.0,
            active=True,
        )
        # PF: 12% of BASIC = 6,000 (Deduction)
        rule_pf = SalaryRule(
            structure_id=struct.id,
            name="Provident Fund",
            code="PF",
            category=RuleCategory.DEDUCTION.value,
            sequence=30,
            computation_type=ComputationType.PERCENTAGE.value,
            percentage_base_code="BASIC",
            percentage_rate=12.0,
            active=True,
        )
        # Prof Tax: Fixed 2,500 (Deduction)
        rule_pt = SalaryRule(
            structure_id=struct.id,
            name="Professional Tax",
            code="PT",
            category=RuleCategory.DEDUCTION.value,
            sequence=35,
            computation_type=ComputationType.FIXED.value,
            fixed_amount=2500.0,
            active=True,
        )
        # Employer PF: 12% of BASIC = 6,000 (Employer Contribution)
        rule_emp_pf = SalaryRule(
            structure_id=struct.id,
            name="Employer Provident Fund",
            code="EMP_PF",
            category=RuleCategory.EMPLOYER_CONTRIBUTION.value,
            sequence=40,
            computation_type=ComputationType.PERCENTAGE.value,
            percentage_base_code="BASIC",
            percentage_rate=12.0,
            employer_cost_flag=True,
            active=True,
        )
        db.add_all([rule_basic, rule_hra, rule_special, rule_pf, rule_pt, rule_emp_pf])
        db.commit()

        # Create 2 test employees
        emp1 = Employee(
            employee_code=f"EMP_PS1_{ts}",
            name="Aarav Mehta Test",
            work_email=f"aarav.test.{ts}@peoplepay360.com",
            department="Engineering",
            job_position="Software Engineer",
            company="PeoplePay360 Inc.",
            bank_name="HDFC Bank",
            bank_account_no="1234567890",
            ifsc_code="HDFC0001234",
            pan_no="ABCDE1234F",
            status=EmployeeStatus.ACTIVE.value,
        )
        emp2 = Employee(
            employee_code=f"EMP_PS2_{ts}",
            name="Priya Shah Test",
            work_email=f"priya.test.{ts}@peoplepay360.com",
            department="Design",
            job_position="UI/UX Designer",
            company="PeoplePay360 Inc.",
            status=EmployeeStatus.ACTIVE.value,
        )
        db.add_all([emp1, emp2])
        db.commit()
        db.refresh(emp1)
        db.refresh(emp2)

        # Create contracts
        c1 = Contract(
            contract_code=f"CT_PS1_{ts}",
            name="Aarav Contract",
            employee_id=emp1.id,
            salary_structure_id=struct.id,
            wage_per_month=80000.0,
            start_date=date(2026, 1, 1),
            status=ContractStatus.RUNNING.value,
        )
        c2 = Contract(
            contract_code=f"CT_PS2_{ts}",
            name="Priya Contract",
            employee_id=emp2.id,
            salary_structure_id=struct.id,
            wage_per_month=70000.0,
            start_date=date(2026, 1, 1),
            status=ContractStatus.RUNNING.value,
        )
        db.add_all([c1, c2])
        db.commit()
        db.refresh(c1)
        db.refresh(c2)

        return {
            "struct_id": struct.id,
            "emp1_id": emp1.id,
            "emp2_id": emp2.id,
            "c1_id": c1.id,
            "c2_id": c2.id,
        }
    finally:
        db.close()


def test_01_create_and_compute_valid_payslip(setup_test_data):
    """Test 1: Create and compute a valid payslip with full breakdown."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    payload = {
        "employee_id": emp1_id,
        "period_start": "2026-09-01",
        "period_end": "2026-09-30",
        "auto_compute": True,
    }
    resp = client.post("/api/v1/payroll/payslips", json=payload, headers=headers)
    assert resp.status_code == 201, resp.text
    data = resp.json()

    assert data["payslip_number"].startswith("PS-2026-")
    assert data["status"] == "computed"
    assert data["employee_name"] == "Aarav Mehta Test"
    assert data["gross_salary"] == 80000.0  # 50,000 Basic + 20,000 HRA + 10,000 Special
    assert data["total_deductions"] == 8500.0  # 6,000 PF + 2,500 PT
    assert data["net_salary"] == 71500.0  # 80,000 - 8,500
    assert data["total_employer_contributions"] == 6000.0  # Employer PF
    assert data["total_employer_cost"] == 86000.0  # 80,000 + 6,000
    assert len(data["lines"]) == 6


def test_02_earnings_sum_calculation(setup_test_data):
    """Test 2: Gross Salary equals sum of all earnings components."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    payload = {
        "employee_id": emp1_id,
        "period_start": "2026-05-01",
        "period_end": "2026-05-31",
    }
    resp = client.post("/api/v1/payroll/payslips", json=payload, headers=headers)
    assert resp.status_code == 201
    data = resp.json()

    earnings_sum = sum(line["amount"] for line in data["lines"] if line["category"] in ["Basic", "Allowance", "Earning"])
    assert earnings_sum == data["gross_salary"]
    assert data["gross_salary"] == 80000.0


def test_03_deductions_sum_calculation(setup_test_data):
    """Test 3: Total Deductions equals sum of all deduction lines."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    resp = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp1_id, "period_start": "2026-06-01", "period_end": "2026-06-30"},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()

    deductions_sum = sum(line["amount"] for line in data["lines"] if line["category"] == "Deduction")
    assert deductions_sum == data["total_deductions"]
    assert data["total_deductions"] == 8500.0


def test_04_net_salary_calculation(setup_test_data):
    """Test 4: Net Salary equals Gross Salary minus Total Deductions."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    resp = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp1_id, "period_start": "2026-07-01", "period_end": "2026-07-31"},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()

    assert data["net_salary"] == data["gross_salary"] - data["total_deductions"]
    assert data["net_salary"] == 71500.0


def test_05_employer_cost_calculation(setup_test_data):
    """Test 5: Total Employer Cost equals Gross Salary plus Employer Contributions."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    resp = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp1_id, "period_start": "2026-08-01", "period_end": "2026-08-31"},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()

    assert data["total_employer_cost"] == data["gross_salary"] + data["total_employer_contributions"]
    assert data["total_employer_cost"] == 86000.0


def test_06_missing_contract_error(setup_test_data):
    """Test 6: Payslip creation fails cleanly when no applicable contract exists for period."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    # Period prior to contract start (2024)
    payload = {
        "employee_id": emp1_id,
        "period_start": "2024-01-01",
        "period_end": "2024-01-31",
    }
    resp = client.post("/api/v1/payroll/payslips", json=payload, headers=headers)
    assert resp.status_code == 400
    assert "No applicable contract" in resp.json()["detail"]


def test_07_missing_salary_structure_error():
    """Test 7: Payslip creation fails when contract has missing salary structure."""
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")

    db = SessionLocal()
    try:
        ts = int(time.time())
        emp = Employee(
            employee_code=f"EMP_NOSTR_{ts}",
            name="No Struct Employee",
            work_email=f"nostruct.{ts}@peoplepay360.com",
            department="Operations",
            job_position="Agent",
            company="PeoplePay360 Inc.",
            status=EmployeeStatus.ACTIVE.value,
        )
        db.add(emp)
        db.commit()
        db.refresh(emp)

        c = Contract(
            contract_code=f"CT_NOSTR_{ts}",
            name="Contract No Struct",
            employee_id=emp.id,
            salary_structure_id=999999,  # non-existent
            wage_per_month=30000.0,
            start_date=date(2026, 1, 1),
            status=ContractStatus.RUNNING.value,
        )
        db.add(c)
        db.commit()

        resp = client.post(
            "/api/v1/payroll/payslips",
            json={"employee_id": emp.id, "period_start": "2026-09-01", "period_end": "2026-09-30"},
            headers=headers,
        )
        assert resp.status_code == 400
        assert "Salary Structure" in resp.json()["detail"]
    finally:
        db.close()


def test_08_duplicate_finalized_payslip_prevention(setup_test_data):
    """Test 8: System prevents creating duplicate payslip when a finalized one exists."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    # 1. Create and finalize
    resp1 = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp1_id, "period_start": "2026-03-01", "period_end": "2026-03-31"},
        headers=headers,
    )
    assert resp1.status_code == 201
    slip_id = resp1.json()["id"]

    resp_fin = client.post(f"/api/v1/payroll/payslips/{slip_id}/finalize", headers=headers)
    assert resp_fin.status_code == 200
    assert resp_fin.json()["status"] == "finalized"

    # 2. Attempt to create another payslip for same employee and period
    resp2 = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp1_id, "period_start": "2026-03-01", "period_end": "2026-03-31"},
        headers=headers,
    )
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]


def test_09_recompute_safety(setup_test_data):
    """Test 9: Recomputation cleanly replaces draft lines without duplicating rows."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    # Create payslip
    resp = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp1_id, "period_start": "2026-10-01", "period_end": "2026-10-31"},
        headers=headers,
    )
    assert resp.status_code == 201
    slip_id = resp.json()["id"]
    lines_count_initial = len(resp.json()["lines"])

    # Recompute
    resp_recompute = client.post(f"/api/v1/payroll/payslips/{slip_id}/recompute", headers=headers)
    assert resp_recompute.status_code == 200
    data = resp_recompute.json()

    assert len(data["lines"]) == lines_count_initial
    assert data["net_salary"] == 71500.0


def test_10_finalization_immutability(setup_test_data):
    """Test 10: Finalized payslip rejects recompute or cancellation requests."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp2_id = setup_test_data["emp2_id"]

    resp = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp2_id, "period_start": "2026-04-01", "period_end": "2026-04-30"},
        headers=headers,
    )
    assert resp.status_code == 201
    slip_id = resp.json()["id"]

    # Finalize
    client.post(f"/api/v1/payroll/payslips/{slip_id}/finalize", headers=headers)

    # Attempt recompute on finalized payslip
    resp_recomp = client.post(f"/api/v1/payroll/payslips/{slip_id}/recompute", headers=headers)
    assert resp_recomp.status_code == 400
    assert "immutable" in resp_recomp.json()["detail"].lower() or "locked" in resp_recomp.json()["detail"].lower()

    # Attempt cancel on finalized payslip
    resp_cancel = client.post(f"/api/v1/payroll/payslips/{slip_id}/cancel", headers=headers)
    assert resp_cancel.status_code == 400


def test_11_employee_self_service_isolation(setup_test_data):
    """Test 11: Employee can view their own payslip but receives 403 on another employee's payslip."""
    headers_mgr = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]
    emp2_id = setup_test_data["emp2_id"]

    # Create payslip for Emp 1 and Emp 2
    resp1 = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp1_id, "period_start": "2026-11-01", "period_end": "2026-11-30"},
        headers=headers_mgr,
    )
    slip1_id = resp1.json()["id"]

    resp2 = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp2_id, "period_start": "2026-11-01", "period_end": "2026-11-30"},
        headers=headers_mgr,
    )
    slip2_id = resp2.json()["id"]

    # Log in as demo employee (linked to employee Aarav / id in seeded DB)
    headers_emp = get_auth_headers("employee@peoplepay360.com", "employee123")

    # Accessing slip2 (which belongs to emp2) will be 403 for employee role user
    resp_other = client.get(f"/api/v1/payroll/payslips/{slip2_id}", headers=headers_emp)
    assert resp_other.status_code == 403

    # Employee self-service list endpoint works
    resp_my = client.get("/api/v1/payroll/payslips/my-payslips", headers=headers_emp)
    assert resp_my.status_code == 200


def test_12_attendance_and_time_off_snapshots(setup_test_data):
    """Test 12: Verify attendance and time off snapshots are stored in DB."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    resp = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp1_id, "period_start": "2026-12-01", "period_end": "2026-12-31"},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()

    assert data["attendance_snapshot"] is not None
    assert "worked_days" in data["attendance_snapshot"]
    assert data["time_off_snapshot"] is not None
    assert "unpaid_leave_days" in data["time_off_snapshot"]
    assert data["employee_snapshot"]["bank_name"] == "HDFC Bank"
    assert data["contract_snapshot"]["wage_per_month"] == 80000.0


def test_13_calculation_trace_generation(setup_test_data):
    """Test 13: Verify calculation trace JSON array contains step-by-step formula execution."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    emp1_id = setup_test_data["emp1_id"]

    resp = client.post(
        "/api/v1/payroll/payslips",
        json={"employee_id": emp1_id, "period_start": "2026-02-01", "period_end": "2026-02-28"},
        headers=headers,
    )
    assert resp.status_code == 201
    data = resp.json()

    trace = data["calculation_trace"]
    assert isinstance(trace, list)
    assert len(trace) >= 6

    # Verify rule codes in trace
    trace_codes = [t["rule_code"] for t in trace]
    assert "BASIC" in trace_codes
    assert "HRA" in trace_codes
    assert "PF" in trace_codes


def test_14_summary_metrics_endpoint(setup_test_data):
    """Test 14: Verify /payroll/payslips/summary aggregates totals correctly."""
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")

    resp = client.get("/api/v1/payroll/payslips/summary", headers=headers)
    assert resp.status_code == 200
    metrics = resp.json()

    assert "total_payslips" in metrics
    assert "total_gross" in metrics
    assert "total_deductions" in metrics
    assert "total_net" in metrics
    assert metrics["total_payslips"] >= 1
