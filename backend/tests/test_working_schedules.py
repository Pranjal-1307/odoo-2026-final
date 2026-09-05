import pytest
import time
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


def test_list_working_schedules():
    headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    response = client.get("/api/v1/working-schedules", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert data["total"] >= 5
    
    # Check that standard schedules are in the list
    names = [s["name"] for s in data["items"]]
    assert "40 Hours / Week" in names
    assert "Night Shift" in names
    assert "Retail Weekend" in names
    assert "Flexible Hybrid" in names
    assert "Part-time 20h" in names


def test_get_single_working_schedule_detail():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    # Get the 40 Hours / Week schedule
    list_res = client.get("/api/v1/working-schedules?search=40%20Hours", headers=headers)
    assert list_res.status_code == 200
    items = list_res.json()["items"]
    assert len(items) >= 1
    schedule_id = items[0]["id"]

    detail_res = client.get(f"/api/v1/working-schedules/{schedule_id}", headers=headers)
    assert detail_res.status_code == 200
    data = detail_res.json()
    assert data["name"] == "40 Hours / Week"
    assert data["days_per_week"] == 5
    assert data["hours_per_week"] == 40.0
    assert len(data["days"]) == 5
    for day in data["days"]:
        assert day["daily_hours"] == 8.0
        assert day["break_hours"] == 1.0


def test_create_working_schedule_and_calculations():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    sched_name = f"Custom Schedule {int(time.time())}"
    
    payload = {
        "name": sched_name,
        "company": "PeoplePay360 Inc.",
        "timezone": "Asia/Kolkata",
        "status": "active",
        "days": [
            {"day_of_week": "Monday", "start_time": "09:00", "end_time": "17:30", "break_hours": 0.5},   # 8.0h
            {"day_of_week": "Tuesday", "start_time": "09:00", "end_time": "17:30", "break_hours": 0.5},  # 8.0h
            {"day_of_week": "Wednesday", "start_time": "09:00", "end_time": "17:30", "break_hours": 0.5},# 8.0h
            {"day_of_week": "Thursday", "start_time": "09:00", "end_time": "17:30", "break_hours": 0.5}, # 8.0h
        ]
    }
    
    response = client.post("/api/v1/working-schedules", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["name"] == sched_name
    assert data["days_per_week"] == 4
    assert data["hours_per_week"] == 32.0
    assert len(data["days"]) == 4


def test_overnight_shift_calculation():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    sched_name = f"Test Overnight {int(time.time())}"
    
    payload = {
        "name": sched_name,
        "company": "PeoplePay360 Inc.",
        "timezone": "Asia/Kolkata",
        "status": "active",
        "days": [
            {"day_of_week": "Monday", "start_time": "22:00", "end_time": "06:00", "break_hours": 0.0},  # 8.0h
            {"day_of_week": "Tuesday", "start_time": "22:00", "end_time": "06:00", "break_hours": 1.0}, # 7.0h
        ]
    }
    
    response = client.post("/api/v1/working-schedules", json=payload, headers=headers)
    assert response.status_code == 201
    data = response.json()
    assert data["days_per_week"] == 2
    assert data["hours_per_week"] == 15.0


def test_validation_duplicate_day():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    payload = {
        "name": f"Duplicate Day Sched {int(time.time())}",
        "company": "PeoplePay360 Inc.",
        "timezone": "Asia/Kolkata",
        "status": "active",
        "days": [
            {"day_of_week": "Monday", "start_time": "09:00", "end_time": "17:00", "break_hours": 1.0},
            {"day_of_week": "Monday", "start_time": "18:00", "end_time": "22:00", "break_hours": 0.0},
        ]
    }
    response = client.post("/api/v1/working-schedules", json=payload, headers=headers)
    assert response.status_code == 422
    assert "Duplicate working day" in response.json()["detail"]


def test_validation_negative_break_and_excessive_break():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    
    # Negative break
    payload_neg = {
        "name": f"Neg Break {int(time.time())}",
        "days": [{"day_of_week": "Monday", "start_time": "09:00", "end_time": "18:00", "break_hours": -1.0}]
    }
    res_neg = client.post("/api/v1/working-schedules", json=payload_neg, headers=headers)
    assert res_neg.status_code == 422

    # Break greater than shift duration
    payload_exc = {
        "name": f"Excess Break {int(time.time())}",
        "days": [{"day_of_week": "Monday", "start_time": "09:00", "end_time": "18:00", "break_hours": 10.0}]
    }
    res_exc = client.post("/api/v1/working-schedules", json=payload_exc, headers=headers)
    assert res_exc.status_code == 422
    assert "must be less than total elapsed shift time" in res_exc.json()["detail"]


def test_update_working_schedule():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    sched_name = f"Updatable Sched {int(time.time())}"
    
    create_res = client.post("/api/v1/working-schedules", json={
        "name": sched_name,
        "days": [
            {"day_of_week": "Monday", "start_time": "09:00", "end_time": "17:00", "break_hours": 1.0}
        ]
    }, headers=headers)
    assert create_res.status_code == 201
    created_id = create_res.json()["id"]

    # Update: add Tuesday & Wednesday
    update_res = client.put(f"/api/v1/working-schedules/{created_id}", json={
        "name": f"{sched_name} Updated",
        "days": [
            {"day_of_week": "Monday", "start_time": "09:00", "end_time": "18:00", "break_hours": 1.0},
            {"day_of_week": "Tuesday", "start_time": "09:00", "end_time": "18:00", "break_hours": 1.0},
            {"day_of_week": "Wednesday", "start_time": "09:00", "end_time": "18:00", "break_hours": 1.0},
        ]
    }, headers=headers)
    assert update_res.status_code == 200
    updated_data = update_res.json()
    assert updated_data["name"] == f"{sched_name} Updated"
    assert updated_data["days_per_week"] == 3
    assert updated_data["hours_per_week"] == 24.0


def test_toggle_working_schedule_status():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    sched_name = f"Status Test {int(time.time())}"
    create_res = client.post("/api/v1/working-schedules", json={
        "name": sched_name,
        "status": "active",
        "days": [{"day_of_week": "Monday", "start_time": "09:00", "end_time": "17:00", "break_hours": 1.0}]
    }, headers=headers)
    sched_id = create_res.json()["id"]

    # Deactivate
    toggle_1 = client.patch(f"/api/v1/working-schedules/{sched_id}/status", headers=headers)
    assert toggle_1.status_code == 200
    assert toggle_1.json()["status"] == "inactive"

    # Reactivate
    toggle_2 = client.patch(f"/api/v1/working-schedules/{sched_id}/status", headers=headers)
    assert toggle_2.status_code == 200
    assert toggle_2.json()["status"] == "active"


def test_delete_protection_on_referenced_schedule():
    admin_headers = get_auth_headers("admin@peoplepay360.com", "admin123")
    
    # 40 Hours / Week is referenced by active demo employees & contracts
    list_res = client.get("/api/v1/working-schedules?search=40%20Hours", headers=admin_headers)
    sched_id = list_res.json()["items"][0]["id"]

    del_res = client.delete(f"/api/v1/working-schedules/{sched_id}", headers=admin_headers)
    assert del_res.status_code == 400
    assert "Cannot delete schedule" in del_res.json()["detail"]


def test_employee_rbac_restriction():
    # Employee role cannot create or modify working schedules
    emp_headers = get_auth_headers("employee@peoplepay360.com", "employee123")
    
    # 1. Employee can view schedules (read-only)
    list_res = client.get("/api/v1/working-schedules", headers=emp_headers)
    assert list_res.status_code == 200

    # 2. Employee cannot create schedule
    post_res = client.post("/api/v1/working-schedules", json={
        "name": "Unauthorized Schedule",
        "days": [{"day_of_week": "Monday", "start_time": "09:00", "end_time": "17:00", "break_hours": 1.0}]
    }, headers=emp_headers)
    assert post_res.status_code == 403

    # 3. Employee cannot delete schedule
    del_res = client.delete("/api/v1/working-schedules/1", headers=emp_headers)
    assert del_res.status_code == 403


def test_live_calculation_helper():
    headers = get_auth_headers("hr.manager@peoplepay360.com", "hrmanager123")
    payload = {
        "days": [
            {"day_of_week": "Monday", "start_time": "09:00", "end_time": "18:00", "break_hours": 1.0},
            {"day_of_week": "Tuesday", "start_time": "09:00", "end_time": "18:00", "break_hours": 1.0},
            {"day_of_week": "Wednesday", "start_time": "09:00", "end_time": "18:00", "break_hours": 1.0},
            {"day_of_week": "Thursday", "start_time": "09:00", "end_time": "18:00", "break_hours": 1.0},
            {"day_of_week": "Friday", "start_time": "09:00", "end_time": "18:00", "break_hours": 1.0},
        ]
    }
    response = client.post("/api/v1/working-schedules/calculate", json=payload, headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert data["days_per_week"] == 5
    assert data["hours_per_week"] == 40.0
    assert len(data["calculated_days"]) == 5
    for day in data["calculated_days"]:
        assert day["daily_hours"] == 8.0
