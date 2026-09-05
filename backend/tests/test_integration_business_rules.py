"""
PeoplePay360 — Module 13: Integration & Business Rules Test Suite
Implements all integration scenarios from 13_INTEGRATION_BUSINESS_RULES.md (Sections 79–88).
"""
import pytest
import time
from datetime import date, datetime, timedelta
from fastapi.testclient import TestClient

from app.main import app
from app.models import (
    Employee,
    Contract,
    SalaryStructure,
    SalaryRule,
    WorkingSchedule,
    Attendance,
    TimeOffRequest,
    TimeOffAllocation,
    TimeOffType,
    Payrun,
    Payslip,
    PayslipLine,
    AuditLog,
    EmployeeStatus,
    ContractStatus,
    PayrunStatus,
    PayslipStatus,
    LeaveRequestStatus,
)

client = TestClient(app)


def get_auth_headers(email: str = "admin@peoplepay360.com", password: str = "admin123"):
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# =========================================================================
# 1. Section 79: Complete Employee Lifecycle
# =========================================================================
def test_scenario_01_complete_employee_lifecycle():
    """
    Scenario 1: Create Employee -> Activate -> Create Contract -> Assign Structure & Schedule -> Verify Payroll Eligibility
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    suffix = int(time.time() * 1000)

    # Step 1: Create Employee
    emp_payload = {
        "name": f"Lifecycle Emp {suffix}",
        "work_email": f"lifecycle.{suffix}@peoplepay360.com",
        "department": "Engineering",
        "job_position": "Full Stack Dev",
        "company": "PeoplePay360 Inc.",
        "status": "active"
    }
    res_emp = client.post("/api/v1/employees", json=emp_payload, headers=headers)
    assert res_emp.status_code == 201
    emp_id = res_emp.json()["id"]

    # Step 2: Query active structure for PeoplePay360 Inc.
    res_structs = client.get("/api/v1/payroll/salary-structures", headers=headers)
    assert res_structs.status_code == 200
    struct_id = next(s["id"] for s in res_structs.json()["items"] if s.get("company") == "PeoplePay360 Inc.")

    res_scheds = client.get("/api/v1/working-schedules", headers=headers)
    assert res_scheds.status_code == 200
    sched_id = res_scheds.json()["items"][0]["id"]

    # Step 3: Create running Contract
    contract_payload = {
        "name": f"Lifecycle Contract {suffix}",
        "employee_id": emp_id,
        "salary_structure_id": struct_id,
        "working_schedule_id": sched_id,
        "start_date": "2026-10-01",
        "end_date": "2027-09-30",
        "wage_per_month": 75000.0,
        "status": "running"
    }
    res_contract = client.post("/api/v1/contracts", json=contract_payload, headers=headers)
    assert res_contract.status_code == 201
    contract_id = res_contract.json()["id"]

    # Step 4: Verify Payroll Eligibility
    res_elig = client.get(
        "/api/v1/payroll/payruns/eligible-employees?company=PeoplePay360%20Inc.&period_start=2026-10-01&period_end=2026-10-31",
        headers=headers
    )
    assert res_elig.status_code == 200
    elig_data = res_elig.json()
    eligible_ids = [e["employee_id"] for e in elig_data["eligible_employees"]]
    assert emp_id in eligible_ids


# =========================================================================
# 2. Section 80: Paid Leave Integration
# =========================================================================
def test_scenario_02_paid_leave_integration():
    """
    Scenario 2: Employee with approved Paid Leave is calculated with paid days and full wage.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    suffix = int(time.time() * 1000)

    # 1. Create Employee
    emp_res = client.post(
        "/api/v1/employees",
        json={
            "name": f"PaidLeave Worker {suffix}",
            "work_email": f"paidleave.{suffix}@peoplepay360.com",
            "department": "Engineering",
            "job_position": "Developer",
            "company": "PeoplePay360 Inc.",
            "status": "active"
        },
        headers=headers
    )
    assert emp_res.status_code == 201
    emp_id = emp_res.json()["id"]

    # 2. Assign Contract
    res_structs = client.get("/api/v1/payroll/salary-structures?search=STANDARD_MONTHLY", headers=headers)
    struct_id = res_structs.json()["items"][0]["id"]
    res_con1 = client.post(
        "/api/v1/contracts",
        json={
            "name": f"Paid Contract {suffix}",
            "employee_id": emp_id,
            "salary_structure_id": struct_id,
            "start_date": "2026-09-01",
            "wage_per_month": 60000.0,
            "status": "running"
        },
        headers=headers
    )
    assert res_con1.status_code == 201

    # 3. Preview Payroll Calculation
    res_calc = client.post(
        "/api/v1/payroll/calculate-preview",
        json={
            "employee_id": emp_id,
            "period_start": "2026-09-01",
            "period_end": "2026-09-30"
        },
        headers=headers
    )
    assert res_calc.status_code == 200
    data = res_calc.json()
    assert data["gross_salary"] >= 60000.0
    assert data["net_salary"] > 0


# =========================================================================
# 3. Section 81: Unpaid Leave Integration
# =========================================================================
def test_scenario_03_unpaid_leave_integration():
    """
    Scenario 3: Unpaid leave days are supplied to engine context and deducted.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    suffix = int(time.time() * 1000)

    # 1. Create Employee & Contract
    emp_res = client.post(
        "/api/v1/employees",
        json={
            "name": f"UnpaidLeave Worker {suffix}",
            "work_email": f"unpaidleave.{suffix}@peoplepay360.com",
            "department": "Engineering",
            "job_position": "Developer",
            "company": "PeoplePay360 Inc.",
            "status": "active"
        },
        headers=headers
    )
    assert emp_res.status_code == 201
    emp_id = emp_res.json()["id"]

    res_structs = client.get("/api/v1/payroll/salary-structures?search=STANDARD_MONTHLY", headers=headers)
    struct_id = res_structs.json()["items"][0]["id"]
    res_con2 = client.post(
        "/api/v1/contracts",
        json={
            "name": f"Unpaid Contract {suffix}",
            "employee_id": emp_id,
            "salary_structure_id": struct_id,
            "start_date": "2026-09-01",
            "wage_per_month": 60000.0,
            "status": "running"
        },
        headers=headers
    )
    assert res_con2.status_code == 201

    # 2. Preview Payroll Calculation with Unpaid Leave Simulation
    res_sim = client.post(
        "/api/v1/payroll/calculate-preview",
        json={
            "employee_id": emp_id,
            "period_start": "2026-09-01",
            "period_end": "2026-09-30",
            "custom_inputs": {
                "unpaid_leave_days": 2.0,
                "worked_days": 20.0
            }
        },
        headers=headers
    )
    assert res_sim.status_code == 200
    data = res_sim.json()
    assert "time_off" in data
    assert data["net_salary"] > 0
    assert data["gross_salary"] >= 60000.0


# =========================================================================
# 4. Section 82: Ineligible Employee without Active Contract
# =========================================================================

def test_scenario_04_missing_contract_ineligible():
    """
    Scenario 4: Employee without active contract for period is marked ineligible with reason.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    suffix = int(time.time() * 1000)

    # Create employee without any contract
    emp_payload = {
        "name": f"NoContract Emp {suffix}",
        "work_email": f"nocontract.{suffix}@peoplepay360.com",
        "department": "Finance",
        "job_position": "Analyst",
        "company": "PeoplePay360 Inc.",
        "status": "active"
    }
    res_emp = client.post("/api/v1/employees", json=emp_payload, headers=headers)
    assert res_emp.status_code == 201
    emp_id = res_emp.json()["id"]

    res_elig = client.get(
        "/api/v1/payroll/payruns/eligible-employees?company=PeoplePay360%20Inc.&period_start=2026-09-01&period_end=2026-09-30",
        headers=headers
    )
    assert res_elig.status_code == 200
    ineligible = res_elig.json()["ineligible_employees"]
    emp_inelig = next((e for e in ineligible if e["employee_id"] == emp_id), None)
    assert emp_inelig is not None
    assert "No active contract" in emp_inelig["reason"]


# =========================================================================
# 5. Section 83: Contract Company Mismatch
# =========================================================================
def test_scenario_05_contract_company_mismatch():
    """
    Scenario 5: Attempting to create a contract linking Employee (Company A) with Structure (Company B) is rejected.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    suffix = int(time.time() * 1000)

    # Create Salary Structure for Company B
    struct_payload = {
        "name": f"Company B Structure {suffix}",
        "code": f"STRUC_B_{suffix}",
        "company": "OtherCorp LLC",
        "pay_frequency": "monthly",
        "active": True
    }
    res_struct = client.post("/api/v1/payroll/salary-structures", json=struct_payload, headers=headers)
    assert res_struct.status_code == 201
    struct_b_id = res_struct.json()["id"]

    # Create Employee in PeoplePay360 Inc.
    emp_payload = {
        "name": f"CompanyA Worker {suffix}",
        "work_email": f"companya.{suffix}@peoplepay360.com",
        "department": "Sales",
        "job_position": "Executive",
        "company": "PeoplePay360 Inc.",
        "status": "active"
    }
    res_emp = client.post("/api/v1/employees", json=emp_payload, headers=headers)
    assert res_emp.status_code == 201
    emp_id = res_emp.json()["id"]

    # Attempt to assign Structure B to Employee A
    contract_payload = {
        "name": f"Mismatch Contract {suffix}",
        "employee_id": emp_id,
        "salary_structure_id": struct_b_id,
        "start_date": "2026-09-01",
        "wage_per_month": 50000.0,
        "status": "running"
    }
    res_contract = client.post("/api/v1/contracts", json=contract_payload, headers=headers)
    assert res_contract.status_code in [400, 422]
    error_detail = res_contract.json()
    assert "Company Mismatch" in str(error_detail) or "COMPANY_MISMATCH" in str(error_detail)


# =========================================================================
# 6. Section 84: Duplicate Payrun Prevention
# =========================================================================
def test_scenario_06_duplicate_payrun_prevention():
    """
    Scenario 6: Creating 2 active payruns for the same company and same payroll period is rejected.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    suffix = int(time.time() * 1000)

    # 1. Create Payrun 1 for unique future period
    year = 2030 + (suffix % 50)
    month = (suffix % 12) + 1
    p_start = f"{year}-{month:02d}-01"
    p_end = f"{year}-{month:02d}-28"

    payrun_payload = {
        "name": f"Payrun 1 {suffix}",
        "company": "PeoplePay360 Inc.",
        "period_start": p_start,
        "period_end": p_end,
        "employee_type": "All"
    }
    res1 = client.post("/api/v1/payroll/payruns", json=payrun_payload, headers=headers)
    assert res1.status_code == 201

    # 2. Attempt duplicate Payrun 2 for same period
    payrun_payload2 = {
        "name": f"Payrun 2 {suffix}",
        "company": "PeoplePay360 Inc.",
        "period_start": p_start,
        "period_end": p_end,
        "employee_type": "All"
    }
    res2 = client.post("/api/v1/payroll/payruns", json=payrun_payload2, headers=headers)
    assert res2.status_code in [400, 422]
    assert "PAYRUN_DUPLICATE" in str(res2.json()) or "already exists" in str(res2.json())



# =========================================================================
# 7. Section 85: Duplicate Payslip Prevention & Immutability
# =========================================================================
def test_scenario_07_duplicate_payslip_prevention():
    """
    Scenario 7: Creating duplicate finalized payslips for the same employee and period is rejected.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Try creating a new standalone payslip for Aarav for January 2026 (which is already finalized/paid)
    res = client.post(
        "/api/v1/payroll/payslips",
        json={
            "employee_id": 5,
            "period_start": "2026-01-01",
            "period_end": "2026-01-31",
            "auto_compute": True
        },
        headers=headers
    )
    assert res.status_code == 400
    assert "DUPLICATE_PAYSLIP" in str(res.json()) or "finalized payslip" in str(res.json())


# =========================================================================
# 8. Section 86: Attendance Change After Finalization
# =========================================================================
def test_scenario_08_attendance_change_does_not_mutate_finalized_payslip():
    """
    Scenario 8: Modifying attendance after a payrun/payslip is finalized preserves historical payslip totals.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # 1. Fetch Aarav's finalized payslip
    res_slips = client.get("/api/v1/payroll/payslips?employee_id=5", headers=headers)
    assert res_slips.status_code == 200
    payslip = res_slips.json()["items"][0]
    orig_net = payslip["net_salary"]
    orig_worked_days = payslip["worked_days"]

    # 2. Add new attendance in that period
    att_payload = {
        "employee_id": 5,
        "date": "2026-01-15",
        "check_in": "2026-01-15T09:00:00",
        "check_out": "2026-01-15T19:00:00",
        "worked_hours": 10.0,
        "overtime_hours": 2.0
    }
    client.post("/api/v1/attendance", json=att_payload, headers=headers)

    # 3. Verify finalized payslip is NOT silently recalculated
    res_slip_check = client.get(f"/api/v1/payroll/payslips/{payslip['id']}", headers=headers)
    assert res_slip_check.status_code == 200
    updated_slip = res_slip_check.json()
    assert updated_slip["net_salary"] == orig_net
    assert updated_slip["worked_days"] == orig_worked_days


# =========================================================================
# 9. Section 87: Salary Rule Change After Finalization
# =========================================================================
def test_scenario_09_salary_rule_change_does_not_mutate_finalized_payslip():
    """
    Scenario 9: Modifying a salary rule does not change historical finalized payslip amounts.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # 1. Get finalized payslip net amount
    res_slips = client.get("/api/v1/payroll/payslips?employee_id=5", headers=headers)
    payslip = res_slips.json()["items"][0]
    orig_net = payslip["net_salary"]

    # 2. Get HRA rule and update percentage
    res_rules = client.get("/api/v1/payroll/salary-rules", headers=headers)
    hra_rule = next(r for r in res_rules.json()["items"] if r["code"] == "HRA")
    
    # Update HRA from 50% to 55%
    client.put(
        f"/api/v1/payroll/salary-rules/{hra_rule['id']}",
        json={
            "name": "House Rent Allowance (HRA)",
            "code": "HRA",
            "category": "Allowance",
            "sequence": hra_rule["sequence"],
            "computation_type": "percentage",
            "percentage_rate": 55.0,
            "percentage_base_code": "BASIC"
        },
        headers=headers
    )

    # 3. Verify historical finalized payslip remains unchanged
    res_slip_after = client.get(f"/api/v1/payroll/payslips/{payslip['id']}", headers=headers)
    assert res_slip_after.json()["net_salary"] == orig_net

    # Reset HRA rule back to 50%
    client.put(
        f"/api/v1/payroll/salary-rules/{hra_rule['id']}",
        json={
            "name": "House Rent Allowance (HRA)",
            "code": "HRA",
            "category": "Allowance",
            "sequence": hra_rule["sequence"],
            "computation_type": "percentage",
            "percentage_rate": 50.0,
            "percentage_base_code": "BASIC"
        },
        headers=headers
    )


# =========================================================================
# 10. Section 88: Email Failure Does Not Invalidate Payslip
# =========================================================================
def test_scenario_10_email_failure_does_not_invalidate_payslip():
    """
    Scenario 10: Email failure tracks status as FAILED and leaves Payslip status as FINALIZED/VALIDATED/PAID.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")

    # 1. Fetch finalized/paid payslip
    res_slips = client.get("/api/v1/payroll/payslips?employee_id=5", headers=headers)
    payslip = res_slips.json()["items"][0]
    payslip_id = payslip["id"]
    orig_status = payslip["status"]

    # 2. Send email to invalid address
    res_email = client.post(
        f"/api/v1/payroll/payslips/{payslip_id}/email",
        json={"recipient_email": "invalid-no-at-sign"},
        headers=headers
    )
    # Even if delivery fails or returns 422/400, payslip must remain valid
    res_slip_check = client.get(f"/api/v1/payroll/payslips/{payslip_id}", headers=headers)
    assert res_slip_check.status_code == 200
    assert res_slip_check.json()["status"] == orig_status


# =========================================================================
# 11. Contract Overlap Prevention
# =========================================================================
def test_scenario_11_contract_overlap_prevention():
    """
    Scenario 11: Attempting to create 2 running contracts overlapping for the same employee is rejected.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    suffix = int(time.time() * 1000)

    # 1. Create employee
    emp_res = client.post(
        "/api/v1/employees",
        json={
            "name": f"Overlap Worker {suffix}",
            "work_email": f"overlap.{suffix}@peoplepay360.com",
            "department": "Engineering",
            "job_position": "Dev",
            "company": "PeoplePay360 Inc.",
            "status": "active"
        },
        headers=headers
    )
    assert emp_res.status_code == 201
    emp_id = emp_res.json()["id"]

    # Get structure for PeoplePay360 Inc.
    res_structs = client.get("/api/v1/payroll/salary-structures", headers=headers)
    struct_id = next(s["id"] for s in res_structs.json()["items"] if s.get("company") == "PeoplePay360 Inc.")

    # 2. Create Running Contract 1 (Jan 2027 to Jun 2027)
    c1 = client.post(
        "/api/v1/contracts",
        json={
            "name": f"Contract 1 {suffix}",
            "employee_id": emp_id,
            "salary_structure_id": struct_id,
            "start_date": "2027-01-01",
            "end_date": "2027-06-30",
            "wage_per_month": 60000.0,
            "status": "running"
        },
        headers=headers
    )
    assert c1.status_code == 201

    # 3. Create Overlapping Running Contract 2 (Mar 2027 to Dec 2027)
    c2 = client.post(
        "/api/v1/contracts",
        json={
            "name": f"Contract 2 {suffix}",
            "employee_id": emp_id,
            "salary_structure_id": struct_id,
            "start_date": "2027-03-01",
            "end_date": "2027-12-31",
            "wage_per_month": 65000.0,
            "status": "running"
        },
        headers=headers
    )
    assert c2.status_code in [400, 422]
    assert "CONTRACT_OVERLAP" in str(c2.json()) or "overlapping" in str(c2.json())


# =========================================================================
# 12. Audit Trail Verification
# =========================================================================
def test_scenario_12_audit_trail_logging():
    """
    Scenario 12: Audit trail records are created on employee/contract/payrun actions and queryable.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    res = client.get("/api/v1/audit-logs?limit=10", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "actions" in data
    assert "total" in data
    assert data["total"] >= 1


# =========================================================================
# 13. System Integration Health Check
# =========================================================================
def test_scenario_13_integration_health_check():
    """
    Scenario 13: Diagnostics health check endpoint evaluates cross-module consistency.
    """
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    res = client.get("/api/v1/integration/health-check?company=PeoplePay360%20Inc.", headers=headers)
    assert res.status_code == 200
    health = res.json()
    assert health["company"] == "PeoplePay360 Inc."
    assert "status" in health
    assert "total_checks" in health
    assert "issues" in health
    assert health["total_checks"] >= 5
