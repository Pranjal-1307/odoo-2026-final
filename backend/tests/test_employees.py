import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.models import EmployeeStatus

client = TestClient(app)

def get_auth_headers(email: str, password: str = "admin123"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_list_employees_admin():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    response = client.get("/api/v1/employees", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total" in data
    assert "items" in data
    assert data["total"] >= 5
    assert data["active_count"] >= 5

def test_list_employees_search_and_filters():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    # 1. Search for Aarav
    res_search = client.get("/api/v1/employees?search=Aarav", headers=headers)
    assert res_search.status_code == 200
    data = res_search.json()
    assert any(emp["name"] == "Aarav Mehta" for emp in data["items"])
    
    # 2. Filter by Engineering department
    res_dept = client.get("/api/v1/employees?department=Engineering", headers=headers)
    assert res_dept.status_code == 200
    for emp in res_dept.json()["items"]:
        assert emp["department"] == "Engineering"

    # 3. Filter by Status
    res_status = client.get("/api/v1/employees?status=active", headers=headers)
    assert res_status.status_code == 200
    assert all(emp["status"] == "active" for emp in res_status.json()["items"])

def test_employee_role_self_isolation_list():
    """Employee role user only gets their own linked profile in list endpoint."""
    headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    response = client.get("/api/v1/employees", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["work_email"] == "employee@peoplepay360.com"

def test_employee_role_cannot_access_other_employee_detail():
    """Employee A cannot access Employee B's detail record (403 Forbidden)."""
    headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    # Employee Aarav Mehta (id: 5) tries to access Sarah Connor (id: 1)
    response = client.get("/api/v1/employees/1", headers=headers)
    assert response.status_code == 403
    assert "permission" in response.json()["detail"].lower()

def test_employee_detail_smart_button_counts():
    """Verify live counts are calculated for Aarav Mehta (2 contracts, 25 attendance, 3 time off, 2 allocations, 1 payslip)."""
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Get Aarav's ID
    list_res = client.get("/api/v1/employees?search=Aarav%20Mehta", headers=headers)
    aarav = next(e for e in list_res.json()["items"] if e["name"] == "Aarav Mehta")
    aarav_id = aarav["id"]


    res_detail = client.get(f"/api/v1/employees/{aarav_id}", headers=headers)
    assert res_detail.status_code == 200
    detail = res_detail.json()
    assert detail["contracts_count"] >= 1
    assert detail["attendance_count"] >= 25
    assert detail["time_off_count"] >= 3
    assert detail["allocations_count"] >= 2
    assert detail["payslips_count"] >= 1

    assert detail["manager_name"] is not None
    assert detail["working_schedule_name"] is not None

def test_create_employee_success():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    import time
    unique_suffix = int(time.time() * 1000)
    payload = {
        "name": f"Rohan Gupta {unique_suffix}",
        "work_email": f"rohan.gupta.{unique_suffix}@peoplepay360.com",
        "phone": "+1 (555) 019-9999",
        "department": "Design",
        "job_position": "UI/UX Designer",
        "company": "PeoplePay360 Inc.",
        "work_location": "Headquarters",
        "status": "active"
    }
    response = client.post("/api/v1/employees", json=payload, headers=headers)
    assert response.status_code == 201
    created = response.json()
    assert "Rohan Gupta" in created["name"]
    assert created["employee_code"].startswith("EMP")
    assert created["department"] == "Design"
    assert created["contracts_count"] == 0

def test_create_employee_validation_errors():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    # 1. Blank name
    res_blank = client.post("/api/v1/employees", json={"name": "  ", "work_email": "test@test.com", "department": "IT", "job_position": "Dev"}, headers=headers)
    assert res_blank.status_code == 422

    # 2. Duplicate email
    res_dup = client.post("/api/v1/employees", json={"name": "Duplicate User", "work_email": "admin@peoplepay360.com", "department": "IT", "job_position": "Dev"}, headers=headers)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]

    # 3. Invalid manager ID
    res_bad_mgr = client.post("/api/v1/employees", json={"name": "Bad Mgr", "work_email": "badmgr@test.com", "department": "IT", "job_position": "Dev", "manager_id": 99999}, headers=headers)
    assert res_bad_mgr.status_code == 400
    assert "manager" in res_bad_mgr.json()["detail"].lower()

def test_update_employee():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    # Find Rohan Gupta
    res = client.get("/api/v1/employees?search=Rohan", headers=headers)
    rohan = res.json()["items"][0]
    rohan_id = rohan["id"]

    # Update job position
    update_res = client.put(
        f"/api/v1/employees/{rohan_id}",
        json={"job_position": "Lead Product Designer", "phone": "+1 (555) 019-8888"},
        headers=headers
    )
    assert update_res.status_code == 200
    assert update_res.json()["job_position"] == "Lead Product Designer"

    # Cannot set self as manager
    self_mgr_res = client.put(
        f"/api/v1/employees/{rohan_id}",
        json={"manager_id": rohan_id},
        headers=headers
    )
    assert self_mgr_res.status_code == 400
    assert "own manager" in self_mgr_res.json()["detail"].lower()

def test_deactivate_and_reactivate_employee():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Find Rohan Gupta
    res = client.get("/api/v1/employees?search=Rohan", headers=headers)
    rohan_id = res.json()["items"][0]["id"]

    # Deactivate
    deact_res = client.patch(
        f"/api/v1/employees/{rohan_id}/status",
        json={"status": "inactive"},
        headers=headers
    )
    assert deact_res.status_code == 200
    assert deact_res.json()["status"] == "inactive"

    # Verify inactive employee is still retrievable
    detail_res = client.get(f"/api/v1/employees/{rohan_id}", headers=headers)
    assert detail_res.status_code == 200
    assert detail_res.json()["status"] == "inactive"

    # Reactivate
    react_res = client.patch(
        f"/api/v1/employees/{rohan_id}/status",
        json={"status": "active"},
        headers=headers
    )
    assert react_res.status_code == 200
    assert react_res.json()["status"] == "active"

def test_delete_employee_protection():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # Try deleting Aarav Mehta who has contracts, attendances, and payslips
    res = client.get("/api/v1/employees?search=Aarav", headers=headers)
    aarav_id = res.json()["items"][0]["id"]

    del_res = client.delete(f"/api/v1/employees/{aarav_id}", headers=headers)
    assert del_res.status_code == 400
    assert "dependencies exist" in del_res.json()["detail"].lower()

def test_employee_options_endpoint():
    headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    res = client.get("/api/v1/employees/options", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert "managers" in data
    assert "departments" in data
    assert "job_positions" in data
    assert "working_schedules" in data
    assert len(data["departments"]) > 0
