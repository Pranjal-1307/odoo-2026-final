import pytest
import time
from datetime import datetime, date, timedelta, time as dt_time
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models import Attendance, Employee, User

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
def cleanup_open_attendances():
    """Ensure test employees don't have dangling open attendances before/after tests."""
    db = SessionLocal()
    try:
        # Clear open attendances for Aarav Mehta (employee_id=5) and others to have clean test state
        db.query(Attendance).filter(
            Attendance.check_out.is_(None)
        ).delete()
        db.commit()
    finally:
        db.close()
    yield
    db = SessionLocal()
    try:
        db.query(Attendance).filter(
            Attendance.check_out.is_(None)
        ).delete()
        db.commit()
    finally:
        db.close()


def test_employee_check_in_success():
    headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    
    # 1. Check in
    response = client.post("/api/v1/attendance/check-in", json={"notes": "Starting daily shift"}, headers=headers)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["status"] == "checked_in"
    assert data["check_in"] is not None
    assert data["check_out"] is None
    assert data["employee_name"] == "Aarav Mehta"
    assert data["expected_hours"] == 8.0

    # 2. Verify my-status reflects checked_in
    status_res = client.get("/api/v1/attendance/my-status", headers=headers)
    assert status_res.status_code == 200
    st_data = status_res.json()
    assert st_data["is_checked_in"] is True
    assert st_data["attendance_id"] == data["id"]


def test_duplicate_check_in_rejected():
    headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    
    # First check in succeeds
    res1 = client.post("/api/v1/attendance/check-in", json={}, headers=headers)
    assert res1.status_code == 201

    # Second duplicate check in must be rejected
    res2 = client.post("/api/v1/attendance/check-in", json={}, headers=headers)
    assert res2.status_code == 400
    assert "already checked in" in res2.json()["detail"].lower()


def test_employee_check_out_and_hours_calculation():
    headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    
    # Explicit check in on Monday 09:00
    check_in_dt = datetime(2026, 9, 7, 9, 0, 0)
    check_out_dt = datetime(2026, 9, 7, 18, 0, 0)

    res_in = client.post(
        "/api/v1/attendance/check-in",
        json={"check_in": check_in_dt.isoformat()},
        headers=headers
    )
    assert res_in.status_code == 201

    # Check out (9h elapsed - 1h break = 8h worked, 8h expected, 0h overtime, status 'present')
    res_out = client.post(
        "/api/v1/attendance/check-out",
        json={"check_out": check_out_dt.isoformat(), "notes": "Completed shift"},
        headers=headers
    )
    assert res_out.status_code == 200
    data = res_out.json()
    assert data["check_out"] is not None
    assert data["worked_hours"] == 8.0
    assert data["overtime_hours"] == 0.0
    assert data["status"] == "present"



def test_invalid_checkout_without_active_checkin():
    headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    
    # Ensure no open attendance, then check out
    response = client.post("/api/v1/attendance/check-out", json={}, headers=headers)
    assert response.status_code == 400
    assert "no active attendance found" in response.json()["detail"].lower()


def test_invalid_checkout_time_earlier_than_checkin():
    headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    
    now = datetime.now()
    res_in = client.post(
        "/api/v1/attendance/check-in",
        json={"check_in": now.isoformat()},
        headers=headers
    )
    assert res_in.status_code == 201

    # Attempt check out 1 hour earlier
    earlier = now - timedelta(hours=1)
    res_out = client.post(
        "/api/v1/attendance/check-out",
        json={"check_out": earlier.isoformat()},
        headers=headers
    )
    assert res_out.status_code == 422
    assert "cannot be earlier than check-in" in res_out.json()["detail"].lower()


def test_overtime_calculation_with_working_schedule():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    # 11 hours elapsed - 1 hour break = 10 hours worked. Expected is 8h -> Overtime = 2.0h
    check_in_dt = datetime(2026, 9, 7, 8, 0, 0)
    check_out_dt = datetime(2026, 9, 7, 19, 0, 0)

    payload = {
        "employee_id": 5,  # Aarav Mehta
        "date": "2026-09-07",
        "check_in": check_in_dt.isoformat(),
        "check_out": check_out_dt.isoformat(),
        "notes": "Overtime deployment project"
    }

    res = client.post("/api/v1/attendance", json=payload, headers=headers)
    assert res.status_code == 201, res.text
    data = res.json()
    assert data["worked_hours"] == 10.0
    assert data["expected_hours"] == 8.0
    assert data["overtime_hours"] == 2.0
    assert data["status"] == "overtime"


def test_partial_work_hours_status():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    # 5.5 hours elapsed - 1.0 hour break = 4.5 hours worked. Expected 8.0h -> Partial
    check_in_dt = datetime(2026, 9, 8, 9, 0, 0)
    check_out_dt = datetime(2026, 9, 8, 14, 30, 0)

    payload = {
        "employee_id": 5,
        "date": "2026-09-08",
        "check_in": check_in_dt.isoformat(),
        "check_out": check_out_dt.isoformat(),
        "notes": "Half day doctor appointment"
    }

    res = client.post("/api/v1/attendance", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["worked_hours"] == 4.5
    assert data["overtime_hours"] == 0.0
    assert data["status"] == "partial"


def test_late_arrival_calculation():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    # Expected start is 09:00, check-in at 09:35 -> 35 minutes late
    check_in_dt = datetime(2026, 9, 9, 9, 35, 0)
    check_out_dt = datetime(2026, 9, 9, 18, 35, 0)

    payload = {
        "employee_id": 5,
        "date": "2026-09-09",
        "check_in": check_in_dt.isoformat(),
        "check_out": check_out_dt.isoformat(),
        "notes": "Traffic delay"
    }

    res = client.post("/api/v1/attendance", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["late_minutes"] == 35
    assert data["worked_hours"] == 8.0


def test_hr_manual_attendance_create_and_update():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    # Create record
    res_create = client.post(
        "/api/v1/attendance",
        json={
            "employee_id": 5,
            "date": "2026-09-10",
            "check_in": "2026-09-10T09:00:00",
            "check_out": "2026-09-10T17:00:00",
            "notes": "Initial log"
        },
        headers=headers
    )
    assert res_create.status_code == 201
    att_id = res_create.json()["id"]

    # HR updates checkout to 18:00 (server automatically recalculates worked_hours to 8.0)
    res_update = client.put(
        f"/api/v1/attendance/{att_id}",
        json={
            "check_out": "2026-09-10T18:00:00",
            "notes": "Corrected end of shift by HR"
        },
        headers=headers
    )
    assert res_update.status_code == 200
    updated_data = res_update.json()
    assert updated_data["worked_hours"] == 8.0
    assert updated_data["is_manual_edit"] is True
    assert updated_data["notes"] == "Corrected end of shift by HR"


def test_attendance_rbac_restrictions():
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    hr_headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")

    # HR creates a record for employee 1 (Sarah Connor)
    res_hr = client.post(
        "/api/v1/attendance",
        json={
            "employee_id": 1,
            "date": "2026-09-11",
            "check_in": "2026-09-11T09:00:00",
            "check_out": "2026-09-11T18:00:00"
        },
        headers=hr_headers
    )
    assert res_hr.status_code == 201
    record_id = res_hr.json()["id"]

    # Regular employee (Aarav Mehta, id=5) tries to access employee 1's attendance -> 403 Forbidden
    res_emp_get = client.get(f"/api/v1/attendance/{record_id}", headers=emp_headers)
    assert res_emp_get.status_code == 403

    # Regular employee tries to delete attendance -> 403 Forbidden
    res_emp_del = client.delete(f"/api/v1/attendance/{record_id}", headers=emp_headers)
    assert res_emp_del.status_code == 403

    # HR Manager can delete
    res_hr_del = client.delete(f"/api/v1/attendance/{record_id}", headers=hr_headers)
    assert res_hr_del.status_code == 204


def test_attendance_summary_and_department_metrics():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    response = client.get("/api/v1/attendance/summary", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "total_records" in data
    assert "present_today" in data
    assert "checked_in_now" in data
    assert "late_today" in data
    assert "overtime_today" in data
    assert "department_breakdown" in data
    assert len(data["department_breakdown"]) >= 1


def test_list_attendances_filters_and_search():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")

    response = client.get("/api/v1/attendance?search=Aarav&limit=10", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert data["total"] >= 1
    for item in data["items"]:
        assert "Aarav" in item["employee_name"] or (item["notes"] and "Aarav" in item["notes"])
