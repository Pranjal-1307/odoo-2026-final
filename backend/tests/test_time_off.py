import pytest
from datetime import datetime, date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models import (
    TimeOffType,
    TimeOffAllocation,
    TimeOffRequest,
    TimeOffAllocationUsage,
    Employee,
    User,
    LeaveRequestStatus,
    AllocationStatus
)

client = TestClient(app)


def get_auth_headers(email: str, password: str = "admin123"):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password}
    )
    assert response.status_code == 200, f"Login failed: {response.text}"
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def cleanup_time_off_test_records():
    """Ensure a clean test state for Time Off records before and after each test."""
    db = SessionLocal()
    try:
        # Clean up test-created types, requests, and allocations
        db.query(TimeOffAllocationUsage).delete()
        db.query(TimeOffRequest).filter(TimeOffRequest.reason.like("Test %")).delete()
        db.query(TimeOffAllocation).filter(TimeOffAllocation.notes.like("Test %")).delete()
        db.query(TimeOffType).filter(TimeOffType.name.like("Test %")).delete()
        db.commit()
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        db.query(TimeOffAllocationUsage).delete()
        db.query(TimeOffRequest).filter(TimeOffRequest.reason.like("Test %")).delete()
        db.query(TimeOffAllocation).filter(TimeOffAllocation.notes.like("Test %")).delete()
        db.query(TimeOffType).filter(TimeOffType.name.like("Test %")).delete()
        db.commit()
    finally:
        db.close()


def test_01_create_time_off_type():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    payload = {
        "name": "Test Annual Holiday Leave",
        "unit": "days",
        "requires_allocation": True,
        "is_unpaid": False,
        "approval_type": "hr",
        "payroll_behavior": "paid",
        "active": True,
        "color": "#10B981",
        "notes": "Test annual holiday leave description"
    }
    response = client.post("/api/v1/time-off/types", json=payload, headers=hr_headers)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == "Test Annual Holiday Leave"
    assert data["active"] is True
    assert data["unit"] == "days"
    assert data["requires_allocation"] is True


def test_02_create_allocation():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")

    # 1. Create a type
    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Vacation 2026",
        "unit": "days",
        "requires_allocation": True
    }, headers=hr_headers)
    assert type_res.status_code == 201
    type_id = type_res.json()["id"]

    # 2. Grant allocation of 20 days to Aarav Mehta (employee_id=5)
    alloc_res = client.post("/api/v1/time-off/allocations", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "allocated_amount": 20.0,
        "notes": "Test 20 days grant"
    }, headers=hr_headers)
    assert alloc_res.status_code == 201
    alloc_data = alloc_res.json()
    assert alloc_data["allocated_amount"] == 20.0
    assert alloc_data["taken_amount"] == 0.0
    assert alloc_data["remaining_amount"] == 20.0
    assert alloc_data["status"] == "approved"


def test_03_and_04_create_request_pending_does_not_consume_balance():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")

    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Casual Leave 2026",
        "unit": "days",
        "requires_allocation": True
    }, headers=hr_headers)
    type_id = type_res.json()["id"]

    # Grant 20 days
    client.post("/api/v1/time-off/allocations", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "allocated_amount": 20.0,
        "notes": "Test initial 20"
    }, headers=hr_headers)

    # Aarav submits request for 3 working days (e.g. Wednesday to Friday)
    start_date = date(2026, 9, 9)  # Wednesday
    end_date = date(2026, 9, 11)   # Friday
    req_res = client.post("/api/v1/time-off/requests", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "reason": "Test Family event"
    }, headers=emp_headers)

    assert req_res.status_code == 201, req_res.text
    req_data = req_res.json()
    assert req_data["status"] in ["to_approve", "pending"]
    assert req_data["duration"] == 3.0

    # Test 4: Pending does NOT consume official balance
    balance_res = client.get("/api/v1/time-off/balances?employee_id=5", headers=emp_headers)
    assert balance_res.status_code == 200
    b_items = balance_res.json()["balances"]
    target_b = next(b for b in b_items if b["type_id"] == type_id)
    assert target_b["allocated"] == 20.0
    assert target_b["taken"] == 0.0
    assert target_b["remaining"] == 20.0


def test_05_approve_request_consumes_balance():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")

    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Paid Leave Consumption",
        "unit": "days",
        "requires_allocation": True
    }, headers=hr_headers)
    type_id = type_res.json()["id"]

    client.post("/api/v1/time-off/allocations", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "allocated_amount": 20.0,
        "notes": "Test allocation"
    }, headers=hr_headers)

    start_date = date(2026, 9, 16)  # Wednesday
    end_date = date(2026, 9, 18)   # Friday
    req_res = client.post("/api/v1/time-off/requests", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "reason": "Test approval flow"
    }, headers=emp_headers)
    req_id = req_res.json()["id"]

    # HR Approves
    approve_res = client.post(f"/api/v1/time-off/requests/{req_id}/approve", json={"approval_reason": "Approved by HR"}, headers=hr_headers)
    assert approve_res.status_code == 200, approve_res.text
    assert approve_res.json()["status"] == "approved"

    # Check balance updated: Taken = 3, Remaining = 17
    balance_res = client.get("/api/v1/time-off/balances?employee_id=5", headers=emp_headers)
    b_items = balance_res.json()["balances"]
    target_b = next(b for b in b_items if b["type_id"] == type_id)
    assert target_b["allocated"] == 20.0
    assert target_b["taken"] == 3.0
    assert target_b["remaining"] == 17.0


def test_06_insufficient_balance_rejected():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")

    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Low Balance Type",
        "unit": "days",
        "requires_allocation": True
    }, headers=hr_headers)
    type_id = type_res.json()["id"]

    # Grant only 2 days
    client.post("/api/v1/time-off/allocations", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "allocated_amount": 2.0,
        "notes": "Test small grant"
    }, headers=hr_headers)

    # Request 5 days (Monday to Friday)
    start_date = date(2026, 9, 21)  # Monday
    end_date = date(2026, 9, 25)   # Friday
    req_res = client.post("/api/v1/time-off/requests", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "reason": "Test 5 days request"
    }, headers=emp_headers)

    assert req_res.status_code == 400
    assert "Insufficient leave balance" in req_res.json()["detail"]


def test_07_refuse_request():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")

    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Refuse Leave Type",
        "unit": "days",
        "requires_allocation": True
    }, headers=hr_headers)
    type_id = type_res.json()["id"]

    client.post("/api/v1/time-off/allocations", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "allocated_amount": 10.0,
        "notes": "Test allocation"
    }, headers=hr_headers)

    start_date = date(2026, 10, 5)  # Monday
    end_date = date(2026, 10, 7)   # Wednesday (3 days)
    req_res = client.post("/api/v1/time-off/requests", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "reason": "Test refusal flow"
    }, headers=emp_headers)
    req_id = req_res.json()["id"]

    # Refuse request
    refuse_res = client.post(f"/api/v1/time-off/requests/{req_id}/refuse", json={"refusal_reason": "Insufficient staffing"}, headers=hr_headers)
    assert refuse_res.status_code == 200
    assert refuse_res.json()["status"] == "refused"
    assert refuse_res.json()["refusal_reason"] == "Insufficient staffing"

    # Balance unchanged: taken = 0, remaining = 10
    balance_res = client.get("/api/v1/time-off/balances?employee_id=5", headers=emp_headers)
    b_items = balance_res.json()["balances"]
    target_b = next(b for b in b_items if b["type_id"] == type_id)
    assert target_b["taken"] == 0.0
    assert target_b["remaining"] == 10.0


def test_08_cancel_approved_request_restores_balance():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")

    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Cancellation Restore Type",
        "unit": "days",
        "requires_allocation": True
    }, headers=hr_headers)
    type_id = type_res.json()["id"]

    client.post("/api/v1/time-off/allocations", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "allocated_amount": 20.0,
        "notes": "Test allocation"
    }, headers=hr_headers)

    start_date = date(2026, 10, 12)  # Monday
    end_date = date(2026, 10, 14)   # Wednesday (3 days)
    req_res = client.post("/api/v1/time-off/requests", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "reason": "Test cancel restore"
    }, headers=emp_headers)
    req_id = req_res.json()["id"]

    # Approve -> Taken = 3, Remaining = 17
    client.post(f"/api/v1/time-off/requests/{req_id}/approve", headers=hr_headers)
    balance_mid = client.get("/api/v1/time-off/balances?employee_id=5", headers=emp_headers).json()["balances"]
    assert next(b for b in balance_mid if b["type_id"] == type_id)["remaining"] == 17.0

    # Cancel -> Restores 3 days -> Taken = 0, Remaining = 20
    cancel_res = client.post(f"/api/v1/time-off/requests/{req_id}/cancel", headers=emp_headers)
    assert cancel_res.status_code == 200
    assert cancel_res.json()["status"] == "cancelled"

    balance_post = client.get("/api/v1/time-off/balances?employee_id=5", headers=emp_headers).json()["balances"]
    target_b = next(b for b in balance_post if b["type_id"] == type_id)
    assert target_b["taken"] == 0.0
    assert target_b["remaining"] == 20.0


def test_09_inactive_type_cannot_create_requests():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")

    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Inactive Leave Type",
        "unit": "days",
        "requires_allocation": False,
        "active": False
    }, headers=hr_headers)
    type_id = type_res.json()["id"]

    req_res = client.post("/api/v1/time-off/requests", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "start_date": "2026-11-02",
        "end_date": "2026-11-03",
        "reason": "Test inactive request"
    }, headers=emp_headers)
    assert req_res.status_code == 400
    assert "inactive" in req_res.json()["detail"].lower()


def test_10_permission_rbac():
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")

    # Employee tries to create allocation -> 403
    res = client.post("/api/v1/time-off/allocations", json={
        "employee_id": 5,
        "time_off_type_id": 1,
        "allocated_amount": 10.0
    }, headers=emp_headers)
    assert res.status_code == 403

    # Employee tries to approve -> 403
    res_app = client.post("/api/v1/time-off/requests/1/approve", headers=emp_headers)
    assert res_app.status_code == 403


def test_11_self_approval_prevention():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")

    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Self Approval Type",
        "unit": "days",
        "requires_allocation": True
    }, headers=hr_headers)
    type_id = type_res.json()["id"]

    # Grant allocation to HR Manager (Marcus Vance, employee_id=4)
    client.post("/api/v1/time-off/allocations", json={
        "employee_id": 4,
        "time_off_type_id": type_id,
        "allocated_amount": 10.0,
        "notes": "Test HR allocation"
    }, headers=hr_headers)

    # Marcus Vance requests leave for himself
    req_res = client.post("/api/v1/time-off/requests", json={
        "employee_id": 4,
        "time_off_type_id": type_id,
        "start_date": "2026-11-09",
        "end_date": "2026-11-10",
        "reason": "Test HR personal request"
    }, headers=hr_headers)
    req_id = req_res.json()["id"]

    # Marcus Vance tries to approve his OWN request -> 403 forbidden
    self_approve_res = client.post(f"/api/v1/time-off/requests/{req_id}/approve", headers=hr_headers)
    assert self_approve_res.status_code == 403
    assert "Self-approval prevention" in self_approve_res.json()["detail"]


def test_12_overlapping_requests():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")

    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Overlap Type",
        "unit": "days",
        "requires_allocation": False
    }, headers=hr_headers)
    type_id = type_res.json()["id"]

    # Request 1: 10 Nov to 12 Nov
    r1 = client.post("/api/v1/time-off/requests", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "start_date": "2026-11-10",
        "end_date": "2026-11-12",
        "reason": "Test Request A"
    }, headers=emp_headers)
    assert r1.status_code == 201

    # Request 2: 11 Nov to 13 Nov (overlapping) -> 400
    r2 = client.post("/api/v1/time-off/requests", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "start_date": "2026-11-11",
        "end_date": "2026-11-13",
        "reason": "Test Request B"
    }, headers=emp_headers)
    assert r2.status_code == 400
    assert "already has a Time Off Request" in r2.json()["detail"]


def test_13_and_14_working_schedule_duration_calculation():
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")

    # Friday 2026-11-20 to Tuesday 2026-11-24:
    # Fri (1), Sat (0), Sun (0), Mon (1), Tue (1) -> 3 working days (calendar days = 5)
    calc_res = client.post("/api/v1/time-off/requests/calculate-duration", json={
        "employee_id": 5,
        "time_off_type_id": 1,
        "start_date": "2026-11-20",
        "end_date": "2026-11-24"
    }, headers=emp_headers)

    assert calc_res.status_code == 200
    calc_data = calc_res.json()
    assert calc_data["duration"] == 3.0
    assert calc_data["working_days_counted"] == 3
    assert calc_data["calendar_days"] == 5


def test_15_unpaid_leave_without_allocation():
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")

    type_res = client.post("/api/v1/time-off/types", json={
        "name": "Test Unpaid Leave 2026",
        "unit": "days",
        "requires_allocation": False,
        "is_unpaid": True,
        "payroll_behavior": "unpaid"
    }, headers=hr_headers)
    type_id = type_res.json()["id"]

    # Request unpaid leave without any pre-existing allocation -> succeeds
    req_res = client.post("/api/v1/time-off/requests", json={
        "employee_id": 5,
        "time_off_type_id": type_id,
        "start_date": "2026-11-25",
        "end_date": "2026-11-26",
        "reason": "Test Unpaid Leave Request"
    }, headers=emp_headers)
    assert req_res.status_code == 201
    req_id = req_res.json()["id"]

    # Approve request
    app_res = client.post(f"/api/v1/time-off/requests/{req_id}/approve", headers=hr_headers)
    assert app_res.status_code == 200
    assert app_res.json()["status"] == "approved"
