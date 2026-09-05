import pytest
from datetime import timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.core.security import create_access_token
from app.core.permissions import has_permission, Permissions

client = TestClient(app)

def test_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_success_all_roles():
    """Verify login succeeds for all 5 canonical demo roles."""
    roles_credentials = [
        ("admin@peoplepay360.com", "admin123", "Admin"),
        ("payroll.manager@peoplepay360.com", "payrollmgr123", "HR Payroll Manager"),
        ("payroll.user@peoplepay360.com", "payrolluser123", "HR Payroll User"),
        ("hr.manager@peoplepay360.com", "hrmanager123", "HR Manager"),
        ("employee@peoplepay360.com", "employee123", "Employee")
    ]
    
    for email, password, expected_role in roles_credentials:
        response = client.post(
            "/api/v1/auth/login",
            json={"email": email, "password": password}
        )
        assert response.status_code == 200, f"Login failed for {email}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["role"] == expected_role
        assert len(data["permissions"]) > 0

def test_login_invalid_password():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@peoplepay360.com", "password": "wrongpassword123"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_login_invalid_email():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@peoplepay360.com", "password": "anypassword"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]

def test_inactive_user_login():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "inactive@peoplepay360.com", "password": "inactive123"}
    )
    assert response.status_code == 401
    assert "inactive" in response.json()["detail"].lower()

def test_protected_endpoint_without_token():
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401

def test_expired_token():
    # Create expired token
    expired_token = create_access_token(
        subject="1",
        role="Admin",
        expires_delta=timedelta(minutes=-10)
    )
    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"}
    )
    assert response.status_code == 401

def test_auth_me_profile():
    # Login as Employee
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "employee@peoplepay360.com", "password": "employee123"}
    )
    token = login_resp.json()["access_token"]
    
    me_resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert me_resp.status_code == 200
    user_data = me_resp.json()
    assert user_data["email"] == "employee@peoplepay360.com"
    assert user_data["role"] == "Employee"
    assert Permissions.ATTENDANCE_SELF_READ in user_data["permissions"]

def test_admin_can_manage_users():
    # Login as Admin
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@peoplepay360.com", "password": "admin123"}
    )
    admin_token = login_resp.json()["access_token"]
    
    # 1. List users
    list_resp = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert list_resp.status_code == 200
    assert list_resp.json()["total"] >= 5
    
    # 2. Create user
    new_email = "test.newuser@peoplepay360.com"
    create_resp = client.post(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "email": new_email,
            "username": "Test New User",
            "password": "testpassword123",
            "role": "Employee",
            "is_active": True
        }
    )
    # Could be 201 or 400 if already exists
    if create_resp.status_code == 201:
        new_user = create_resp.json()
        new_user_id = new_user["id"]
        
        # 3. Update Role to HR Manager
        role_resp = client.patch(
            f"/api/v1/users/{new_user_id}/role",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"role": "HR Manager"}
        )
        assert role_resp.status_code == 200
        assert role_resp.json()["role"] == "HR Manager"
        
        # 4. Deactivate user
        status_resp = client.patch(
            f"/api/v1/users/{new_user_id}/status",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"is_active": False}
        )
        assert status_resp.status_code == 200
        assert status_resp.json()["is_active"] is False

def test_non_admin_cannot_access_user_management():
    # Login as Employee
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "employee@peoplepay360.com", "password": "employee123"}
    )
    emp_token = login_resp.json()["access_token"]
    
    # Attempt to list users
    list_resp = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {emp_token}"}
    )
    assert list_resp.status_code == 403

    # Login as HR Manager
    hr_login = client.post(
        "/api/v1/auth/login",
        json={"email": "hr.manager@peoplepay360.com", "password": "hrmanager123"}
    )
    hr_token = hr_login.json()["access_token"]
    
    # Attempt to list users
    hr_list_resp = client.get(
        "/api/v1/users",
        headers={"Authorization": f"Bearer {hr_token}"}
    )
    assert hr_list_resp.status_code == 403

def test_role_permission_checks():
    # Employee cannot manage employees
    assert has_permission("Employee", Permissions.EMPLOYEE_CREATE) is False
    assert has_permission("Employee", Permissions.PAYRUN_CREATE) is False
    assert has_permission("Employee", Permissions.SALARY_RULE_CREATE) is False
    assert has_permission("Employee", Permissions.PAYSLIP_SELF_READ) is True

    # HR Manager can manage employees but cannot compute payruns or modify salary rules
    assert has_permission("HR Manager", Permissions.EMPLOYEE_CREATE) is True
    assert has_permission("HR Manager", Permissions.PAYRUN_VALIDATE) is False
    assert has_permission("HR Manager", Permissions.PAYRUN_MARK_PAID) is False
    assert has_permission("HR Manager", Permissions.SALARY_RULE_CREATE) is False

    # HR Payroll User can compute payruns and read salary rules, but cannot modify salary rules or mark paid
    assert has_permission("HR Payroll User", Permissions.PAYRUN_COMPUTE) is True
    assert has_permission("HR Payroll User", Permissions.SALARY_RULE_READ) is True
    assert has_permission("HR Payroll User", Permissions.SALARY_RULE_CREATE) is False
    assert has_permission("HR Payroll User", Permissions.PAYRUN_MARK_PAID) is False

    # HR Payroll Manager has full payroll & salary configuration permissions
    assert has_permission("HR Payroll Manager", Permissions.PAYRUN_VALIDATE) is True
    assert has_permission("HR Payroll Manager", Permissions.PAYRUN_MARK_PAID) is True
    assert has_permission("HR Payroll Manager", Permissions.SALARY_RULE_CREATE) is True
    assert has_permission("HR Payroll Manager", Permissions.SALARY_STRUCTURE_CREATE) is True

    # Admin has wildcard access to all permissions
    assert has_permission("Admin", Permissions.USER_CREATE) is True
    assert has_permission("Admin", Permissions.PAYRUN_MARK_PAID) is True
    assert has_permission("Admin", Permissions.SALARY_RULE_CREATE) is True
