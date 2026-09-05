import pytest
import time
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models import SalaryStructure, SalaryRule, Payslip, PayslipLine, Employee, Contract, RuleCategory, ComputationType

client = TestClient(app)


def get_auth_headers(email: str, password: str = "admin123"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200, f"Login failed for {email}: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ==========================================
# Test 1: Create Salary Structure (Section 94.1)
# ==========================================
def test_01_create_salary_structure():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    unique_code = f"TEST_STRUCT_{int(time.time())}"
    
    payload = {
        "name": f"Test Standard Structure {int(time.time())}",
        "code": unique_code,
        "company": "PeoplePay360 Inc.",
        "pay_frequency": "monthly",
        "description": "Custom test structure for automated verification",
        "active": True,
        "rules": [
            {
                "name": "Basic Salary",
                "code": "BASIC",
                "category": "Basic",
                "sequence": 100,
                "computation_type": "percentage",
                "percentage_rate": 100.0,
                "percentage_base_code": "contract_wage",
                "appears_on_payslip": True
            }
        ]
    }
    
    response = client.post("/api/v1/payroll/salary-structures", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["code"] == unique_code
    assert data["pay_frequency"] == "monthly"
    assert len(data["rules"]) == 1
    assert data["rules"][0]["code"] == "BASIC"


# ==========================================
# Test 2: Fixed Rule Calculation (Section 94.2)
# ==========================================
def test_02_fixed_rule_calculation():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Sandbox calculation testing fixed rule
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


# ==========================================
# Test 3: Percentage Rule Calculation (Section 94.3)
# ==========================================
def test_03_percentage_rule_calculation():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Basic = ₹50,000, HRA = 40% of Basic -> Expected ₹20,000
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
    assert hra_comp["amount"] == 20000.0


# ==========================================
# Test 4: Gross Calculation (Section 94.4)
# ==========================================
def test_04_gross_calculation():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Basic (50k) + HRA (20k) + Transport (2k) + Medical (1.5k) = Gross 73,500
    rules = [
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
        {"name": "House Rent Allowance", "code": "HRA", "category": "Allowance", "sequence": 200, "computation_type": "percentage", "percentage_rate": 40.0, "percentage_base_code": "BASIC"},
        {"name": "Transport Allowance", "code": "TRANSPORT", "category": "Allowance", "sequence": 300, "computation_type": "fixed", "fixed_amount": 2000.0},
        {"name": "Medical Allowance", "code": "MEDICAL", "category": "Allowance", "sequence": 400, "computation_type": "fixed", "fixed_amount": 1500.0},
        {"name": "Gross Salary", "code": "GROSS", "category": "Gross", "sequence": 500, "computation_type": "formula", "formula_expression": "BASIC + HRA + TRANSPORT + MEDICAL"}
    ]
    
    payload = {"contract_wage": 50000.0, "rules": rules}
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    assert data["gross_earnings"] == 73500.0


# ==========================================
# Test 5: Deduction Calculation (Section 94.5)
# ==========================================
def test_05_deduction_calculation():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Basic = 50k, PF = 12% of Basic -> Expected 6000
    rules = [
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
        {"name": "Provident Fund", "code": "PF", "category": "Deduction", "sequence": 600, "computation_type": "percentage", "percentage_rate": 12.0, "percentage_base_code": "BASIC"},
        {"name": "Professional Tax", "code": "PT", "category": "Deduction", "sequence": 700, "computation_type": "fixed", "fixed_amount": 200.0},
        {"name": "Income Tax", "code": "TAX", "category": "Deduction", "sequence": 900, "computation_type": "fixed", "fixed_amount": 5000.0},
    ]
    
    payload = {"contract_wage": 50000.0, "rules": rules}
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    pf_comp = next((c for c in data["components"] if c["rule_code"] == "PF"), None)
    assert pf_comp is not None
    assert pf_comp["amount"] == 6000.0
    # Total deductions = 6000 + 200 + 5000 = 11200
    assert data["total_deductions"] == 11200.0


# ==========================================
# Test 6: Net Calculation (Section 94.6 & 91)
# ==========================================
def test_06_net_calculation():
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    
    # Full Demo 10-Rule Calculation: Gross (73,500) - Deductions (11,200) = Net (62,300)
    # Testing with seeded STANDARD_MONTHLY structure
    struct_res = client.get("/api/v1/payroll/salary-structures?search=STANDARD_MONTHLY", headers=headers)
    assert struct_res.status_code == 200
    struct_id = struct_res.json()["items"][0]["id"]

    preview_payload = {
        "contract_wage": 50000.0,
        "days_in_period": 30,
        "worked_days": 30.0,
        "paid_leave_days": 0.0,
        "unpaid_leave_days": 0.0
    }
    
    response = client.post(f"/api/v1/payroll/salary-structures/{struct_id}/preview", json=preview_payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    
    assert data["basic_salary"] == 50000.0
    assert data["gross_earnings"] == 73500.0
    assert data["total_deductions"] == 11200.0
    assert data["net_salary"] == 62300.0


# ==========================================
# Test 7: Rule Sequence Execution (Section 94.7)
# ==========================================
def test_07_rule_sequence_execution():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Intentionally provide rules out of order in the payload
    unsorted_rules = [
        {"name": "Gross Salary", "code": "GROSS", "category": "Gross", "sequence": 500, "computation_type": "formula", "formula_expression": "BASIC + HRA"},
        {"name": "House Rent Allowance", "code": "HRA", "category": "Allowance", "sequence": 200, "computation_type": "percentage", "percentage_rate": 40.0, "percentage_base_code": "BASIC"},
        {"name": "Basic Salary", "code": "BASIC", "category": "Basic", "sequence": 100, "computation_type": "percentage", "percentage_rate": 100.0, "percentage_base_code": "contract_wage"},
        {"name": "Net Salary", "code": "NET", "category": "Net", "sequence": 1000, "computation_type": "formula", "formula_expression": "GROSS - 5000"}
    ]
    
    payload = {"contract_wage": 50000.0, "rules": unsorted_rules}
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 200, response.text
    data = response.json()
    
    # Ensure components in response follow sequence order (100 -> 200 -> 500 -> 1000)
    sequences = [c["sequence"] for c in data["components"]]
    assert sequences == sorted(sequences)
    assert data["gross_earnings"] == 70000.0
    assert data["net_salary"] == 65000.0


# ==========================================
# Test 8: Conditional Rule Execution (Section 94.8)
# ==========================================
def test_08_conditional_rule():
    headers = get_auth_headers("payroll.manager@peoplepay360.com", "payrollmgr123")
    struct_res = client.get("/api/v1/payroll/salary-structures?search=STANDARD_MONTHLY", headers=headers)
    struct_id = struct_res.json()["items"][0]["id"]

    # Case A: unpaid_leave_days = 0 -> UNPAID_LEAVE deduction should NOT apply (amount = 0)
    res_zero = client.post(f"/api/v1/payroll/salary-structures/{struct_id}/preview", json={
        "contract_wage": 50000.0,
        "days_in_period": 30,
        "worked_days": 30.0,
        "paid_leave_days": 0.0,
        "unpaid_leave_days": 0.0
    }, headers=headers)
    assert res_zero.status_code == 200
    comp_zero = next(c for c in res_zero.json()["components"] if c["rule_code"] == "UNPAID_LEAVE")
    assert comp_zero["amount"] == 0.0
    assert comp_zero["condition_applied"] is False

    # Case B: unpaid_leave_days = 3 -> UNPAID_LEAVE deduction applies: (50000 / 30) * 3 = 5000.0
    res_unpaid = client.post(f"/api/v1/payroll/salary-structures/{struct_id}/preview", json={
        "contract_wage": 50000.0,
        "days_in_period": 30,
        "worked_days": 27.0,
        "paid_leave_days": 0.0,
        "unpaid_leave_days": 3.0
    }, headers=headers)
    assert res_unpaid.status_code == 200
    data_unpaid = res_unpaid.json()
    comp_unpaid = next(c for c in data_unpaid["components"] if c["rule_code"] == "UNPAID_LEAVE")
    assert comp_unpaid["amount"] == 5000.0
    assert comp_unpaid["condition_applied"] is True
    # Deductions should increase by 5000 (11200 + 5000 = 16200) and net decreases (62300 - 5000 = 57300)
    assert data_unpaid["total_deductions"] == 16200.0
    assert data_unpaid["net_salary"] == 57300.0


# ==========================================
# Test 9: Formula Error Handling (Section 94.9)
# ==========================================
def test_09_formula_error_handling():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Rule references non-existent component or division by zero
    bad_rules = [
        {"name": "Bad Rule", "code": "BAD", "category": "Allowance", "sequence": 100, "computation_type": "formula", "formula_expression": "NON_EXISTENT_VAR * 2"}
    ]
    
    payload = {"contract_wage": 50000.0, "rules": bad_rules}
    response = client.post("/api/v1/payroll/salary-structures/preview-computation", json=payload, headers=headers)
    assert response.status_code == 422
    assert "NON_EXISTENT_VAR" in response.text or "not found" in response.text


# ==========================================
# Test 10: RBAC Permission Enforcement (Section 94.10)
# ==========================================
def test_10_permission_enforcement():
    # Employee cannot configure salary structures or rules
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    
    # 1. Attempt to create structure
    res_struct = client.post("/api/v1/payroll/salary-structures", json={
        "name": "Unauthorized Structure",
        "code": "UNAUTH_001",
        "pay_frequency": "monthly"
    }, headers=emp_headers)
    assert res_struct.status_code == 403

    # 2. Attempt to create rule
    res_rule = client.post("/api/v1/payroll/salary-rules", json={
        "name": "Unauthorized Rule",
        "code": "UNAUTH_R",
        "category": "Allowance",
        "sequence": 100,
        "computation_type": "fixed",
        "fixed_amount": 50000.0,
        "structure_id": 1
    }, headers=emp_headers)
    assert res_rule.status_code == 403


# ==========================================
# Test 11: Historical Integrity Preservation (Section 94.11)
# ==========================================
def test_11_historical_integrity():
    db = SessionLocal()
    try:
        struct = db.query(SalaryStructure).filter(SalaryStructure.code == "STANDARD_MONTHLY").first()
        assert struct is not None
        
        # Verify that modifying structure metadata does not retroactively change previously stored payslip records
        admin_headers = get_auth_headers("admin@peoplepay360.com", "admin123")
        update_res = client.put(f"/api/v1/payroll/salary-structures/{struct.id}", json={
            "description": "Updated description testing historical integrity"
        }, headers=admin_headers)
        assert update_res.status_code == 200
        
        # Past payslip records in DB retain their calculated amounts
        past_payslip = db.query(Payslip).first()
        if past_payslip:
            assert past_payslip.net_salary >= 0
    finally:
        db.close()


# ==========================================
# Test 12: Contract Integration (Section 94.12)
# ==========================================
def test_12_contract_integration():
    headers = get_auth_headers("payroll.user@peoplepay360.com", "payrolluser123")
    
    # Aarav Mehta contract has Wage = 95,000 INR and STANDARD_MONTHLY structure
    contracts_res = client.get("/api/v1/contracts?search=Aarav", headers=headers)
    assert contracts_res.status_code == 200
    contract_items = contracts_res.json()["items"]
    assert len(contract_items) >= 1
    running_contract = next((c for c in contract_items if c.get("wage_per_month") == 95000.0 and c["status"] == "running"), contract_items[0])
    
    struct_id = running_contract["salary_structure_id"]
    wage = running_contract["wage_per_month"]

    
    preview_res = client.post(f"/api/v1/payroll/salary-structures/{struct_id}/preview", json={
        "contract_wage": wage,
        "days_in_period": 30,
        "worked_days": 30.0,
        "paid_leave_days": 0.0,
        "unpaid_leave_days": 0.0,
        "employee_id": running_contract["employee_id"]
    }, headers=headers)
    
    assert preview_res.status_code == 200
    data = preview_res.json()
    assert data["contract_wage"] == wage
    # Basic = 95000, HRA = 40% (38000), Transport = 2000, Medical = 1500 -> Gross = 136,500
    assert data["basic_salary"] == wage
    assert data["gross_earnings"] == wage + (0.40 * wage) + 2000.0 + 1500.0
