import pytest
import time
from datetime import date
from fastapi.testclient import TestClient
from app.main import app
from app.models import Employee, Contract, SalaryStructure, SalaryRule, Attendance, TimeOffRequest, TimeOffType

client = TestClient(app)


def get_auth_headers(email: str, password: str = "admin123"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200, f"Login failed for {email}: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# =========================================================================
# Test 1: Fixed Rule Calculation (Section 88 — Test 1)
# =========================================================================
def test_01_fixed_rule_calculation():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    rules = [
        {
            "name": "Transport Allowance",
            "code": "TRANSPORT",
            "category": "Allowance",
            "sequence": 300,
            "computation_type": "fixed",
            "fixed_amount": 2000.0,
            "appears_on_payslip": True
        }
    ]
    
    payload = {
        "contract_wage": 50000.0,
        "days_in_period": 30,
        "worked_days": 30.0,
        "paid_leave_days": 0.0,
        "unpaid_leave_days": 0.0,
        "rules": rules
    }
    
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    trans_comp = next((c for c in data["components"] if c["rule_code"] == "TRANSPORT"), None)
    assert trans_comp is not None
    assert trans_comp["amount"] == 2000.0


# =========================================================================
# Test 2: Percentage Rule Calculation (Section 88 — Test 2)
# =========================================================================
def test_02_percentage_rule_calculation():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    rules = [
        {
            "name": "Basic Salary",
            "code": "BASIC",
            "category": "Basic",
            "sequence": 100,
            "computation_type": "percentage",
            "percentage_rate": 100.0,
            "percentage_base_code": "contract_wage",
        },
        {
            "name": "House Rent Allowance",
            "code": "HRA",
            "category": "Allowance",
            "sequence": 200,
            "computation_type": "percentage",
            "percentage_rate": 40.0,
            "percentage_base_code": "BASIC",
        }
    ]
    
    payload = {
        "contract_wage": 50000.0,
        "rules": rules
    }
    
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    hra_comp = next((c for c in data["components"] if c["rule_code"] == "HRA"), None)
    assert hra_comp is not None
    assert hra_comp["amount"] == 20000.0  # 50,000 * 40% = 20,000


# =========================================================================
# Test 3: Rule Dependency (Section 88 — Test 3)
# =========================================================================
def test_03_rule_dependency_chain():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # BASIC -> HRA (40% of BASIC) -> PF (12% of BASIC)
    rules = [
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
        {"name": "House Rent Allowance", "code": "HRA", "category": "Allowance", "sequence": 200, "computation_type": "percentage", "percentage_rate": 40.0, "percentage_base_code": "BASIC"},
        {"name": "Provident Fund", "code": "PF", "category": "Deduction", "sequence": 600, "computation_type": "percentage", "percentage_rate": 12.0, "percentage_base_code": "BASIC"}
    ]
    
    payload = {"contract_wage": 50000.0, "rules": rules}
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    pf_comp = next((c for c in data["components"] if c["rule_code"] == "PF"), None)
    assert pf_comp is not None
    assert pf_comp["amount"] == 6000.0  # 50,000 * 12% = 6,000


# =========================================================================
# Test 4: Condition False -> Skipped (Section 88 — Test 4)
# =========================================================================
def test_04_condition_false_skips_rule():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    rules = [
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
        {
            "name": "Unpaid Leave Deduction",
            "code": "UNPAID_LEAVE",
            "category": "Deduction",
            "sequence": 800,
            "computation_type": "formula",
            "formula_expression": "(contract_wage / scheduled_days) * unpaid_leave_days",
            "condition_type": "conditional",
            "condition_formula": "unpaid_leave_days > 0"
        }
    ]
    
    payload = {
        "contract_wage": 50000.0,
        "unpaid_leave_days": 0.0,  # condition unpaid_leave_days > 0 is FALSE
        "rules": rules
    }
    
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    unpaid_comp = next((c for c in data["components"] if c["rule_code"] == "UNPAID_LEAVE"), None)
    assert unpaid_comp is not None
    assert unpaid_comp["amount"] == 0.0
    assert unpaid_comp["condition_applied"] is False


# =========================================================================
# Test 5: Condition True -> Executed (Section 88 — Test 5)
# =========================================================================
def test_05_condition_true_executes_rule():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    rules = [
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
        {
            "name": "Unpaid Leave Deduction",
            "code": "UNPAID_LEAVE",
            "category": "Deduction",
            "sequence": 800,
            "computation_type": "formula",
            "formula_expression": "round((contract_wage / scheduled_days) * unpaid_leave_days, 2)",
            "condition_type": "conditional",
            "condition_formula": "unpaid_leave_days > 0"
        }
    ]
    
    payload = {
        "contract_wage": 50000.0,
        "unpaid_leave_days": 2.0,  # condition unpaid_leave_days > 0 is TRUE
        "rules": rules
    }
    
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    unpaid_comp = next((c for c in data["components"] if c["rule_code"] == "UNPAID_LEAVE"), None)
    assert unpaid_comp is not None
    assert unpaid_comp["condition_applied"] is True
    # (50,000 / 22) * 2 = 2272.727 * 2 = 4545.45 or 4545.46
    assert unpaid_comp["amount"] > 4000.0


# =========================================================================
# Test 6: Formula Deduction Calculation (Section 88 — Test 6)
# =========================================================================
def test_06_formula_calculation():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    rules = [
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
        {
            "name": "Unpaid Leave Deduction",
            "code": "UNPAID_LEAVE",
            "category": "Deduction",
            "sequence": 800,
            "computation_type": "formula",
            "formula_expression": "(contract_wage / 22) * unpaid_leave_days"
        }
    ]
    
    payload = {
        "contract_wage": 50000.0,
        "unpaid_leave_days": 2.0,
        "rules": rules
    }
    
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    unpaid_comp = next((c for c in data["components"] if c["rule_code"] == "UNPAID_LEAVE"), None)
    assert unpaid_comp is not None
    assert round(unpaid_comp["amount"], 2) == round((50000.0 / 22) * 2, 2)


# =========================================================================
# Test 7: Gross Salary Aggregation (Section 88 — Test 7)
# =========================================================================
def test_07_gross_salary_aggregation():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    rules = [
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
        {"name": "House Rent Allowance", "code": "HRA", "category": "Allowance", "sequence": 200, "computation_type": "percentage", "percentage_rate": 40.0, "percentage_base_code": "BASIC"},
        {"name": "Transport Allowance", "code": "TRANSPORT", "category": "Allowance", "sequence": 300, "computation_type": "fixed", "fixed_amount": 2000.0},
        {"name": "Medical Allowance", "code": "MEDICAL", "category": "Allowance", "sequence": 400, "computation_type": "fixed", "fixed_amount": 1500.0},
    ]
    
    payload = {"contract_wage": 50000.0, "rules": rules}
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    # Basic (50k) + HRA (20k) + Transport (2k) + Medical (1.5k) = 73,500
    assert data["gross_earnings"] == 73500.0


# =========================================================================
# Test 8: Net Salary Calculation (Section 88 — Test 8)
# =========================================================================
def test_08_net_salary_calculation():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    rules = [
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
        {"name": "House Rent Allowance", "code": "HRA", "category": "Allowance", "sequence": 200, "computation_type": "percentage", "percentage_rate": 40.0, "percentage_base_code": "BASIC"},
        {"name": "Transport Allowance", "code": "TRANSPORT", "category": "Allowance", "sequence": 300, "computation_type": "fixed", "fixed_amount": 2000.0},
        {"name": "Medical Allowance", "code": "MEDICAL", "category": "Allowance", "sequence": 400, "computation_type": "fixed", "fixed_amount": 1500.0},
        {"name": "Provident Fund", "code": "PF", "category": "Deduction", "sequence": 600, "computation_type": "percentage", "percentage_rate": 12.0, "percentage_base_code": "BASIC"},
        {"name": "Professional Tax", "code": "PT", "category": "Deduction", "sequence": 700, "computation_type": "fixed", "fixed_amount": 200.0},
        {"name": "Income Tax", "code": "TAX", "category": "Deduction", "sequence": 900, "computation_type": "fixed", "fixed_amount": 5000.0},
    ]
    
    payload = {"contract_wage": 50000.0, "rules": rules}
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    
    # Gross = 73,500
    assert data["gross_earnings"] == 73500.0
    # Deductions: PF (6000) + PT (200) + TAX (5000) = 11,200
    assert data["total_deductions"] == 11200.0
    # Net = 73,500 - 11,200 = 62,300
    assert data["net_salary"] == 62300.0


# =========================================================================
# Test 9: Missing Base Component Error (Section 88 — Test 9)
# =========================================================================
def test_09_missing_base_error():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Rule references NON_EXISTENT_BASE which is missing
    rules = [
        {"name": "Provident Fund", "code": "PF", "category": "Deduction", "sequence": 100, "computation_type": "percentage", "percentage_rate": 12.0, "percentage_base_code": "NON_EXISTENT_BASE"}
    ]
    
    payload = {"contract_wage": 50000.0, "rules": rules}
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 422, response.text
    data = response.json()
    assert "missing" in data["detail"].lower() or "not yet evaluated" in data["detail"].lower()


# =========================================================================
# Test 10: Division by Zero Safe Error (Section 88 — Test 10)
# =========================================================================
def test_10_division_by_zero_error():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    rules = [
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "formula", "formula_expression": "contract_wage / 0"}
    ]
    
    payload = {"contract_wage": 50000.0, "rules": rules}
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 422, response.text
    data = response.json()
    assert "division by zero" in data["detail"].lower()


# =========================================================================
# Test 11: End-to-End Employee Payroll Calculation Preview (Section 67)
# =========================================================================
def test_11_employee_payroll_preview_endpoint():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Create employee, contract, and structure to calculate
    unique_num = int(time.time())
    
    # 1. Structure
    struct_payload = {
        "name": f"Preview Struct {unique_num}",
        "code": f"PREV_{unique_num}",
        "company": "PeoplePay360 Inc.",
        "pay_frequency": "monthly",
        "rules": [
            {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
            {"name": "HRA", "code": "HRA", "category": "Allowance", "sequence": 200, "computation_type": "percentage", "percentage_rate": 40.0, "percentage_base_code": "BASIC"},
            {"name": "PF", "code": "PF", "category": "Deduction", "sequence": 300, "computation_type": "percentage", "percentage_rate": 12.0, "percentage_base_code": "BASIC"},
        ]
    }
    s_res = client.post("/api/v1/payroll/salary-structures", json=struct_payload, headers=headers)
    assert s_res.status_code == 201, s_res.text
    struct_id = s_res.json()["id"]
    
    # 2. Employee
    emp_payload = {
        "name": f"Engine Test Employee {unique_num}",
        "work_email": f"engine_emp_{unique_num}@peoplepay360.com",
        "department": "Engineering",
        "job_position": "Backend Developer",
        "company": "PeoplePay360 Inc."
    }
    e_res = client.post("/api/v1/employees", json=emp_payload, headers=headers)
    assert e_res.status_code == 201, e_res.text
    emp_id = e_res.json()["id"]
    
    # 3. Contract
    contract_payload = {
        "contract_code": f"CNT-PREV-{unique_num}",
        "name": f"Engine Contract {unique_num}",
        "employee_id": emp_id,
        "department": "Engineering",
        "job_position": "Backend Developer",
        "start_date": "2026-09-01",
        "wage_per_month": 50000.0,
        "salary_structure_id": struct_id,
        "status": "running"
    }

    c_res = client.post("/api/v1/contracts", json=contract_payload, headers=headers)
    assert c_res.status_code == 201, c_res.text
    
    # 4. Calculate Payroll Preview
    preview_req = {
        "employee_id": emp_id,
        "period_start": "2026-09-01",
        "period_end": "2026-09-30",
    }
    p_res = client.post("/api/v1/payroll/calculate-preview", json=preview_req, headers=headers)
    assert p_res.status_code == 200, p_res.text
    data = p_res.json()
    
    assert data["mode"] == "preview"
    assert data["employee"]["id"] == emp_id
    assert data["contract"]["wage_per_month"] == 50000.0
    assert data["structure"]["id"] == struct_id
    assert data["gross_salary"] == 70000.0  # 50,000 + (50,000 * 40%)
    assert data["total_deductions"] == 6000.0  # 50,000 * 12%
    assert data["net_salary"] == 64000.0  # 70,000 - 6,000
    assert len(data["calculation_trace"]) == 3
    assert data["calculation_trace"][0]["rule_code"] == "BASIC"


# =========================================================================
# Test 12: Employee RBAC Security (Section 88 — Test 13)
# =========================================================================
def test_12_employee_rbac_forbidden():
    # Login as normal employee (e.g. employee@peoplepay360.com)
    headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    
    preview_req = {
        "employee_id": 1,
        "period_start": "2026-09-01",
        "period_end": "2026-09-30"
    }
    
    response = client.post("/api/v1/payroll/calculate-preview", json=preview_req, headers=headers)
    assert response.status_code == 403, f"Expected 403 Forbidden for Employee, got {response.status_code}"
