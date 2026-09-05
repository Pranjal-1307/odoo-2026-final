import pytest
import time
from datetime import date
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def get_auth_headers(email: str, password: str = "admin123"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_contracts_admin():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    response = client.get("/api/v1/contracts", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 2
    assert data["running_count"] >= 1
    assert data["expired_count"] >= 1


def test_contract_options():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    response = client.get("/api/v1/contracts/options", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "employees" in data
    assert "salary_structures" in data
    assert "working_schedules" in data
    assert len(data["employees"]) >= 5
    assert len(data["salary_structures"]) >= 1
    assert len(data["working_schedules"]) >= 1


def test_create_contract_validation_errors():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")

    # 1. Negative wage
    res_neg_wage = client.post("/api/v1/contracts", json={
        "name": "Negative Wage Contract",
        "employee_id": 5,
        "start_date": "2026-06-01",
        "end_date": "2026-12-31",
        "wage_per_month": -50000,
        "salary_structure_id": 1,
        "status": "draft"
    }, headers=headers)
    assert res_neg_wage.status_code in (400, 422)

    # 2. End date before Start date
    res_inv_dates = client.post("/api/v1/contracts", json={
        "name": "Invalid Date Contract",
        "employee_id": 5,
        "start_date": "2026-06-01",
        "end_date": "2026-05-01",
        "wage_per_month": 50000,
        "salary_structure_id": 1,
        "status": "draft"
    }, headers=headers)
    assert res_inv_dates.status_code in (400, 422)

    # 3. Non-existent Employee
    res_no_emp = client.post("/api/v1/contracts", json={
        "name": "Non existent employee contract",
        "employee_id": 99999,
        "start_date": "2026-06-01",
        "end_date": "2026-12-31",
        "wage_per_month": 50000,
        "salary_structure_id": 1,
        "status": "draft"
    }, headers=headers)
    assert res_no_emp.status_code == 400


def test_contract_overlap_prevention():
    """
    Employee 5 (Aarav Mehta) already has a running contract starting 2026-01-01 (open-ended).
    Attempting to create another running contract for 2026-07-01 must be rejected.
    """
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    # Attempting to create overlapping RUNNING contract
    response = client.post("/api/v1/contracts", json={
        "name": "Aarav Mehta Overlapping Contract",
        "employee_id": 5,
        "start_date": "2026-07-01",
        "end_date": "2027-06-30",
        "wage_per_month": 120000,
        "salary_structure_id": 1,
        "status": "running"
    }, headers=headers)
    assert response.status_code == 400
    assert "overlap" in response.json()["detail"].lower()


def test_contract_draft_creation_and_activation_workflow():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    unique_suffix = int(time.time() * 1000)
    
    # Create unique employee
    emp_res = client.post("/api/v1/employees", json={
        "name": f"Workflow Employee {unique_suffix}",
        "work_email": f"workflow.{unique_suffix}@peoplepay360.com",
        "department": "Human Resources",
        "job_position": "HR Coordinator",
        "status": "active"
    }, headers=headers)
    assert emp_res.status_code == 201
    test_emp_id = emp_res.json()["id"]

    # Create Draft Contract
    res_create = client.post("/api/v1/contracts", json={
        "name": f"Workflow Contract {unique_suffix}",
        "employee_id": test_emp_id,
        "start_date": "2026-01-01",
        "end_date": "2026-12-31",
        "wage_per_month": 110000,
        "salary_structure_id": 1,
        "status": "draft"
    }, headers=headers)
    assert res_create.status_code == 201
    contract = res_create.json()
    assert contract["status"] == "draft"
    contract_id = contract["id"]

    # Activate the contract
    res_act = client.post(f"/api/v1/contracts/{contract_id}/activate", headers=headers)
    assert res_act.status_code == 200
    assert res_act.json()["status"] == "running"

    # Cancel the contract
    res_cancel = client.post(f"/api/v1/contracts/{contract_id}/cancel", headers=headers)
    assert res_cancel.status_code == 200
    assert res_cancel.json()["status"] == "terminated"


def test_contract_sequential_creation():
    """Sequential non-overlapping contracts are permitted."""
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    unique_suffix = int(time.time() * 1000)
    
    # Create unique employee
    emp_res = client.post("/api/v1/employees", json={
        "name": f"Sequential Employee {unique_suffix}",
        "work_email": f"sequential.{unique_suffix}@peoplepay360.com",
        "department": "Finance & Payroll",
        "job_position": "Payroll Analyst",
        "status": "active"
    }, headers=headers)
    assert emp_res.status_code == 201
    test_emp_id = emp_res.json()["id"]

    # 1. 2025 contract (expired)
    res1 = client.post("/api/v1/contracts", json={
        "name": f"Sequential 2025 Contract {unique_suffix}",
        "employee_id": test_emp_id,
        "start_date": "2025-01-01",
        "end_date": "2025-12-31",
        "wage_per_month": 70000,
        "salary_structure_id": 1,
        "status": "expired"
    }, headers=headers)
    assert res1.status_code == 201

    # 2. 2026 contract (running)
    res2 = client.post("/api/v1/contracts", json={
        "name": f"Sequential 2026 Contract {unique_suffix}",
        "employee_id": test_emp_id,
        "start_date": "2026-01-01",
        "end_date": "2026-12-31",
        "wage_per_month": 85000,
        "salary_structure_id": 1,
        "status": "running"
    }, headers=headers)
    assert res2.status_code == 201


def test_contract_employee_privacy():
    """Regular employee can only list their own contracts and cannot access others."""
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    
    # List contracts - should only return Aarav's contracts
    res_list = client.get("/api/v1/contracts", headers=emp_headers)
    assert res_list.status_code == 200
    data = res_list.json()
    assert all(c["employee_id"] == 5 for c in data["items"])

    # Detail access to own contract (id 2 is Aarav's running contract)
    res_own = client.get(f"/api/v1/contracts/{data['items'][0]['id']}", headers=emp_headers)
    assert res_own.status_code == 200

    # Detail access to another employee's contract (Marcus Vance created above)
    # Find a contract that is not employee_id 5
    admin_headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    all_contracts = client.get("/api/v1/contracts", headers=admin_headers).json()["items"]
    other_contract = next((c for c in all_contracts if c["employee_id"] != 5), None)
    
    if other_contract:
        res_forbidden = client.get(f"/api/v1/contracts/{other_contract['id']}", headers=emp_headers)
        assert res_forbidden.status_code == 403


def test_applicable_contract_lookup():
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    
    # 1. Aarav Mehta for Jan 2026 (applicable running contract exists)
    res_app = client.get(
        "/api/v1/contracts/applicable?employee_id=5&period_start=2026-01-01&period_end=2026-01-31",
        headers=headers
    )
    assert res_app.status_code == 200
    data = res_app.json()
    assert data["has_applicable_contract"] is True
    assert data["contract"]["wage_per_month"] == 95000.0

    # 2. Aarav Mehta for 2024 (no contract exists)
    res_no = client.get(
        "/api/v1/contracts/applicable?employee_id=5&period_start=2024-01-01&period_end=2024-01-31",
        headers=headers
    )
    assert res_no.status_code == 200
    data_no = res_no.json()
    assert data_no["has_applicable_contract"] is False
    assert data_no["warning_type"] == "NO_CONTRACT"


def test_contract_deletion_protection():
    """Cannot delete a contract referenced in a payslip."""
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Contract 2 is tied to PS-2026-01-005 payslip in demo seed
    res_del = client.delete("/api/v1/contracts/2", headers=headers)
    assert res_del.status_code == 400
    assert "referenced by" in res_del.json()["detail"].lower()
