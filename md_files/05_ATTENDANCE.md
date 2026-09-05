# `05_ATTENDANCE.md`

````markdown
# PeoplePay360 — Attendance Management Specification

## 1. Purpose

The Attendance module manages employee attendance records and provides the actual worked-hours data required by HR and Payroll.

The module must support:

- Employee check-in
- Employee check-out
- Attendance history
- Worked-hours calculation
- Attendance status
- Overtime tracking
- Notes
- Department and manager visibility
- Quick Check In / Check Out widget
- Integration with Employees
- Integration with Contracts
- Integration with Working Schedules
- Integration with Payroll / Payslips
- HR-based attendance management
- Payroll-based attendance information
- Validation against incorrect or duplicate attendance records

The Attendance module is not only a CRUD table.

It must participate in the PeoplePay360 business flow:

Employee
→ Contract
→ Working Schedule
→ Attendance
→ Worked Hours / Overtime
→ Payroll
→ Payslip

---

# 2. Attendance Architecture

Recommended architecture:

React + Vite
        |
        v
Attendance UI
        |
        v
FastAPI REST API
        |
        +--------------------+
        |                    |
        v                    v
PostgreSQL              Attendance Service
                             |
                             +--> Employee
                             +--> Contract
                             +--> Working Schedule
                             +--> Payroll

Attendance must use the same authentication and RBAC system as the rest of PeoplePay360.

---

# 3. Attendance Navigation

The top navigation must follow the Odoo-style ERP structure from the reference design.

Recommended navigation:

Employees
Contracts
Attendance
Time Off ▼
Payroll
Reports

When the user clicks:

**Attendance**

show the Attendance management page.

---

# 4. Attendance List View

## 4.1 Required Columns

The attendance list must contain:

| Column | Description |
|---|---|
| Employee | Employee name |
| Check In | Attendance start time |
| Check Out | Attendance end time |
| Worked Hours | Calculated worked duration |
| Status | Attendance status |

Example:

| Employee | Check In | Check Out | Worked Hours | Status |
|---|---|---|---:|---|
| Aarav Mehta | 09:02 | 18:04 | 8h 02m | Present |
| Sara Khan | 09:10 | 18:00 | 7h 50m | Present |
| John Dsouza | 09:00 | — | — | Checked In |
| Neha Patel | 10:15 | 15:20 | 5h 05m | Partial |

---

# 5. Attendance List Features

The list page should provide:

- Search
- Filter
- Sort
- Pagination
- New Attendance
- Employee filter
- Department filter
- Status filter
- Date filter
- Check-in date range
- Manager filter where applicable

Recommended search fields:

- Employee name
- Employee ID
- Department

Recommended filters:

- Today
- This Week
- This Month
- Present
- Checked In
- Partial
- Absent
- Overtime

---

# 6. Attendance Status

Recommended attendance statuses:

```text
Present
Checked In
Partial
Absent
Late
Overtime
````

However, do not treat all statuses as independent manually entered values.

Some statuses should be derived from attendance data.

For example:

### Checked In

Employee has:

```text
check_in != NULL
check_out == NULL
```

### Present

Employee has a valid completed attendance record for the working day.

### Partial

Worked hours are lower than the expected working hours for the applicable schedule.

### Overtime

Worked hours exceed expected working hours.

### Late

Check-in time is later than the configured expected start time.

The exact status model must be implemented consistently across frontend and backend.

---

# 7. Attendance Form

Clicking:

**New**

must open the Attendance form.

Required fields:

```text
Employee
Check In
Check Out
Worked Hours
Department
Manager
Status
Overtime
Notes
```

---

# 8. Employee Field

The Employee field is required.

Example:

```text
Employee: Aarav Mehta
```

The employee must come from the Employee Master.

Do not allow creating an unrelated employee directly from Attendance.

Attendance must reference:

```text
employee_id
```

---

# 9. Check In

The Check In field stores the attendance start time.

Example:

```text
Check In:
2026-09-05 09:03
```

When an employee checks in:

1. Current server time is captured.
2. An attendance record is created.
3. Employee becomes checked in.
4. The current attendance record becomes active.
5. Worked time begins accumulating.
6. The quick attendance widget updates.

---

# 10. Check Out

The Check Out field stores the attendance end time.

Example:

```text
Check Out:
2026-09-05 18:05
```

When an employee checks out:

1. Current server time is captured.
2. Check-out time is stored.
3. Worked hours are calculated.
4. Overtime is calculated.
5. Attendance status is updated.
6. Active check-in state is cleared.

---

# 11. Worked Hours

Worked Hours must be calculated by the backend.

Do not trust a manually entered value from the frontend.

Basic calculation:

```text
Worked Hours = Check Out - Check In
```

If the system supports breaks:

```text
Worked Hours =
(Check Out - Check In) - Break Duration
```

Example:

```text
Check In  = 09:00
Check Out = 18:00
Break     = 01:00

Worked Hours = 8 hours
```

The backend must calculate the authoritative value.

Frontend may display the result but should not be the source of truth.

---

# 12. Attendance Duration

Store the attendance timestamps accurately.

Recommended database approach:

```text
check_in  → timestamp
check_out → timestamp
```

Do not store only formatted strings such as:

```text
"09:00 AM"
```

Use proper timestamp/date-time fields in PostgreSQL.

The frontend can format them for display.

---

# 13. Quick Check-In / Check-Out Widget

The Attendance page must contain a quick attendance widget based on the reference design.

Example:

```text
------------------------------------
        Attendance
------------------------------------

Current Time
09:42 AM

Today
00:42:15

● Checked In

[ Check Out ]
------------------------------------
```

Before check-in:

```text
------------------------------------
        Attendance
------------------------------------

Current Time
08:57 AM

Today
00:00:00

○ Not Checked In

[ Check In ]
------------------------------------
```

After Check In:

```text
● Checked In

[ Check Out ]
```

The widget must update the current time dynamically.

---

# 14. Check-In Workflow

When the employee clicks:

**Check In**

perform:

```text
Frontend
   ↓
POST /attendance/check-in
   ↓
Authenticate user
   ↓
Identify employee
   ↓
Validate employee
   ↓
Check for existing open attendance
   ↓
Create attendance
   ↓
Return attendance
   ↓
Update widget
```

---

# 15. Check-Out Workflow

When the employee clicks:

**Check Out**

perform:

```text
Frontend
   ↓
POST /attendance/check-out
   ↓
Find active attendance
   ↓
Validate check-in exists
   ↓
Capture check-out
   ↓
Calculate worked hours
   ↓
Calculate overtime
   ↓
Update status
   ↓
Return attendance
```

---

# 16. Duplicate Check-In Prevention

An employee must not be able to create multiple open attendance records at the same time.

Invalid example:

```text
Aarav
09:00 Check In
10:00 Check In
```

If an employee already has an open attendance:

```text
check_in != NULL
check_out == NULL
```

the system must reject another Check In.

Recommended error:

```text
Employee is already checked in.
Please check out before starting another attendance session.
```

This validation must happen on the backend.

---

# 17. Invalid Check-Out Prevention

An employee cannot check out if there is no active check-in.

Invalid:

```text
Check Out
without
Check In
```

Return:

```text
No active attendance found for this employee.
```

---

# 18. Check-Out Before Check-In

The backend must reject:

```text
check_out < check_in
```

Example:

```text
Check In  = 10:00
Check Out = 09:00
```

Invalid.

Error:

```text
Check-out time cannot be earlier than check-in time.
```

---

# 19. Attendance Across Midnight

The system must not blindly assume that check-in and check-out occur on the same calendar date.

Example:

```text
Check In:
2026-09-05 22:00

Check Out:
2026-09-06 06:00
```

This can represent an overnight shift.

The Working Schedule specification states that overnight shifts must either:

1. Be explicitly supported, or
2. Be explicitly rejected.

Never produce negative worked hours.

If overnight attendance is supported:

```text
Worked Hours = 8 hours
```

If it is not supported in the first version, reject such records clearly rather than silently calculating an incorrect value.

---

# 20. Working Schedule Integration

Attendance must integrate with Working Schedules.

Each employee can have a working schedule through their applicable contract.

Example:

```text
Employee
   ↓
Contract
   ↓
Working Schedule
```

Example schedule:

```text
40 Hours / Week

Monday-Friday
09:00 - 18:00
Break: 1 hour
```

Expected daily hours:

```text
8 hours
```

Attendance can then compare:

```text
Expected Hours
vs
Worked Hours
```

---

# 21. Expected Hours Calculation

The expected working hours should come from the applicable Working Schedule.

Example:

```text
Expected = 8 hours
Worked   = 8 hours
```

Result:

```text
Normal Day
```

Example:

```text
Expected = 8 hours
Worked   = 7 hours
```

Result:

```text
Partial / Short Hours
```

Example:

```text
Expected = 8 hours
Worked   = 10 hours
```

Result:

```text
Overtime = 2 hours
```

---

# 22. Overtime

Attendance must support overtime.

Recommended calculation:

```text
Overtime =
MAX(Worked Hours - Expected Hours, 0)
```

Example:

```text
Expected Hours = 8
Worked Hours   = 10

Overtime = 2
```

If:

```text
Expected = 8
Worked = 7
```

then:

```text
Overtime = 0
```

Do not store negative overtime.

---

# 23. Overtime Display

The Attendance form should display:

```text
Worked Hours: 10h 00m
Expected Hours: 8h 00m
Overtime: 2h 00m
```

The list may show only:

```text
Worked Hours
```

while detailed overtime information remains visible in the form.

---

# 24. Late Attendance

Where the Working Schedule provides an expected start time, the system can determine whether an employee arrived late.

Example:

```text
Expected Start = 09:00
Check In       = 09:20
```

Potential result:

```text
Late = 20 minutes
```

If implemented, store:

```text
late_minutes
```

and display it in the detailed attendance view.

This should not be treated as a separate manual attendance entry.

---

# 25. Department

Department should be derived from the Employee Master where possible.

Example:

```text
Employee: Aarav Mehta
Department: Engineering
```

Attendance displays:

```text
Department: Engineering
```

Do not allow inconsistent department information to be entered manually if it can be derived from the employee.

If employee department changes later, historical attendance should retain the appropriate historical context if required by the system design.

---

# 26. Manager

Manager should be derived from the employee's HR information.

Example:

```text
Employee: Aarav Mehta
Manager: Priya Shah
```

The Attendance form displays:

```text
Manager: Priya Shah
```

Managers may use this information for attendance visibility.

---

# 27. Notes

Attendance should support optional notes.

Examples:

```text
Worked from client office.
```

```text
Late due to approved external meeting.
```

```text
Overtime for production deployment.
```

Notes are informational and must not silently change worked hours or payroll values.

---

# 28. Attendance Creation Rules

Manual attendance creation may be allowed for HR users.

Example:

```text
HR Manager
   ↓
Attendance
   ↓
New
   ↓
Select Employee
   ↓
Enter Check In / Check Out
   ↓
Backend Calculates Hours
```

The backend must still perform all validations.

---

# 29. Employee Attendance Permissions

Employees should be able to:

* View their own attendance
* Check in
* Check out
* View their attendance history

Employees must not be able to:

* Modify another employee's attendance
* Delete another employee's attendance
* Modify payroll
* Modify working schedules
* Modify contracts

---

# 30. HR Manager Permissions

HR Manager can:

* View attendance
* Create attendance
* Edit attendance
* Correct attendance records
* View department attendance
* View employee attendance
* Manage attendance-related information

HR Manager should not automatically receive payroll administration permissions.

---

# 31. HR Payroll User Permissions

HR Payroll User can:

* Read attendance
* Use attendance information for payroll
* View worked hours
* View overtime
* View attendance warnings

Attendance ownership remains with HR-related permissions.

---

# 32. HR Payroll Manager Permissions

HR Payroll Manager can:

* View attendance
* Create attendance
* Update attendance
* Correct attendance
* Delete attendance where allowed
* Use attendance in payroll processing

---

# 33. Admin Permissions

Admin has full attendance permissions.

Admin can:

* Create
* Read
* Update
* Delete
* Configure
* View all employees

---

# 34. RBAC Matrix

| Action                   |    Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
| ------------------------ | ----------: | ---------: | --------------: | -----------------: | ----: |
| View Own Attendance      |         Yes |        Yes |             Yes |                Yes |   Yes |
| View All Attendance      |          No |        Yes |             Yes |                Yes |   Yes |
| Check In                 |         Yes |        Yes |             Yes |                Yes |   Yes |
| Check Out                |         Yes |        Yes |             Yes |                Yes |   Yes |
| Create Manual Attendance |          No |        Yes |        Optional |                Yes |   Yes |
| Edit Attendance          | Own/limited |        Yes |         Limited |                Yes |   Yes |
| Delete Attendance        |          No |        Yes |              No |                Yes |   Yes |
| View Overtime            |         Own |        Yes |             Yes |                Yes |   Yes |

Backend authorization is mandatory.

Do not rely only on hiding buttons in React.

---

# 35. Database Design

Recommended table:

```text
attendance
```

Suggested fields:

```text
id
employee_id
check_in
check_out
worked_hours
expected_hours
overtime_hours
late_minutes
status
department_id
manager_id
notes
created_at
updated_at
created_by
```

Foreign keys:

```text
employee_id → employees.id
department_id → departments.id
manager_id → employees.id
```

---

# 36. Attendance Data Model

Example:

```json
{
  "id": 101,
  "employee_id": 1,
  "check_in": "2026-09-05T09:02:00",
  "check_out": "2026-09-05T18:05:00",
  "worked_hours": 8.05,
  "expected_hours": 8.0,
  "overtime_hours": 0.05,
  "late_minutes": 2,
  "status": "present",
  "notes": "Regular working day"
}
```

The actual database precision and API representation should be standardized across the project.

---

# 37. Recommended API Endpoints

## List Attendance

```http
GET /api/attendance
```

Supports:

```text
employee_id
department_id
status
date_from
date_to
page
limit
search
```

---

## Get Attendance

```http
GET /api/attendance/{attendance_id}
```

---

## Create Attendance

```http
POST /api/attendance
```

---

## Update Attendance

```http
PUT /api/attendance/{attendance_id}
```

---

## Delete Attendance

```http
DELETE /api/attendance/{attendance_id}
```

---

## Check In

```http
POST /api/attendance/check-in
```

The backend identifies the authenticated employee where applicable.

---

## Check Out

```http
POST /api/attendance/check-out
```

---

## Current Attendance Status

```http
GET /api/attendance/current
```

Response example:

```json
{
  "checked_in": true,
  "attendance_id": 101,
  "check_in": "2026-09-05T09:02:00",
  "worked_hours": 2.5
}
```

---

## Attendance Summary

```http
GET /api/attendance/summary
```

Example response:

```json
{
  "present": 18,
  "absent": 2,
  "late": 3,
  "overtime": 5
}
```

---

# 38. Backend Service Structure

Recommended FastAPI structure:

```text
backend/
│
├── app/
│   ├── models/
│   │   └── attendance.py
│   │
│   ├── schemas/
│   │   └── attendance.py
│   │
│   ├── routes/
│   │   └── attendance.py
│   │
│   ├── services/
│   │   └── attendance_service.py
│   │
│   └── utils/
│       └── time_calculation.py
```

Business logic should live in services rather than directly inside route handlers.

---

# 39. Attendance Calculation Service

Create a dedicated service:

```text
AttendanceService
```

Responsibilities:

```text
create_attendance()
check_in()
check_out()
calculate_worked_hours()
calculate_expected_hours()
calculate_overtime()
calculate_late_minutes()
validate_attendance()
get_current_attendance()
```

---

# 40. Server-Side Calculation

The backend must be authoritative for:

```text
Worked Hours
Expected Hours
Overtime
Late Minutes
Status
```

Frontend must never be trusted to send these values as final calculations.

For example, the frontend should not be allowed to send:

```json
{
  "worked_hours": 999
}
```

and have the backend accept it blindly.

---

# 41. Attendance and Contract Integration

Attendance should use the employee's applicable contract to identify:

* Working Schedule
* Department/job context where applicable
* Expected working pattern

Important:

Do not simply use the employee's newest contract.

Determine the contract applicable to the attendance date.

Example:

```text
Contract A
01 Jan → 30 Jun
Schedule: 40 Hours

Contract B
01 Jul → 31 Dec
Schedule: Part-time 20h
```

Attendance on:

```text
15 May
```

must use Contract A.

Attendance on:

```text
15 August
```

must use Contract B.

---

# 42. Attendance and Working Schedule Integration

Relationship:

```text
Employee
   ↓
Applicable Contract
   ↓
Working Schedule
   ↓
Expected Hours
   ↓
Attendance
   ↓
Worked Hours
   ↓
Overtime
```

This relationship must be implemented consistently.

---

# 43. Attendance and Time Off Integration

Approved Time Off can affect attendance interpretation.

Example:

```text
Employee has approved leave
Monday
```

The system should not incorrectly flag Monday as an ordinary absent day if the dashboard or attendance logic considers approved leave.

The exact treatment of attendance versus Time Off should be implemented centrally so the dashboard does not produce contradictory information.

---

# 44. Attendance and Payroll Integration

Attendance provides payroll with:

```text
Worked Hours
Overtime Hours
Attendance status
```

Payroll can use these values depending on the configured Salary Rules.

Example:

```text
Attendance
10 hours worked
8 expected
2 overtime
       ↓
Payroll
       ↓
Overtime Salary Rule
       ↓
Payslip
```

The Attendance module must not hardcode payroll amounts.

Salary Rules should determine how overtime affects salary.

---

# 45. Payroll Period Interaction

When generating a Payrun:

```text
Payrun Period
01 Sep → 30 Sep
```

the payroll system retrieves relevant attendance records within that period.

Example:

```text
Attendance:
Sep 01
Sep 02
Sep 03
...
Sep 30
```

Payroll can aggregate:

```text
Total Worked Hours
Total Overtime Hours
```

for each employee.

---

# 46. Attendance Aggregation

Recommended payroll aggregation:

```text
total_worked_hours
total_overtime_hours
attendance_days
late_days
```

Example:

```text
Employee: Aarav Mehta

Attendance Days: 22
Worked Hours: 176
Overtime: 8
Late Days: 2
```

These values may be exposed to the salary computation engine.

---

# 47. Attendance Warnings

The system should identify attendance issues.

Examples:

```text
Open Attendance
Missing Check Out
Unusually Long Shift
Invalid Attendance
Missing Working Schedule
No Applicable Contract
```

Example warning:

```text
⚠ Aarav Mehta has an open attendance record.
```

Another:

```text
⚠ Working schedule is missing for this employee.
```

Warnings should be visible to authorized HR/payroll users.

---

# 48. Missing Check-Out

An attendance record such as:

```text
Check In  = 09:00
Check Out = NULL
```

must not be treated as a completed worked-hours record.

Display:

```text
Checked In
```

and show a warning where appropriate.

Do not automatically assume:

```text
Check Out = 18:00
```

unless an explicitly configured business rule exists.

---

# 49. Attendance Correction

HR may need to correct attendance.

Example:

Employee forgot to check out.

Original:

```text
09:00 → NULL
```

HR corrects:

```text
09:00 → 18:00
```

Backend recalculates:

```text
Worked Hours
Overtime
Status
```

Do not allow manually changing derived values without recalculation.

---

# 50. Attendance Audit

Recommended fields:

```text
created_at
updated_at
created_by
updated_by
```

For stronger auditability, optionally maintain:

```text
attendance_audit_log
```

recording:

```text
Attendance ID
Changed By
Old Value
New Value
Changed At
Reason
```

This is especially useful for HR corrections.

---

# 51. Frontend Page Structure

Recommended React structure:

```text
src/
└── pages/
    └── attendance/
        ├── AttendancePage.jsx
        ├── AttendanceList.jsx
        ├── AttendanceForm.jsx
        ├── AttendanceWidget.jsx
        ├── AttendanceFilters.jsx
        └── AttendanceDetails.jsx
```

---

# 52. Attendance UI Layout

Recommended layout:

```text
----------------------------------------------------
| Attendance                                       |
----------------------------------------------------
| Search                  | New                    |
----------------------------------------------------
| Today | This Week | This Month | Filters        |
----------------------------------------------------

| Employee | Check In | Check Out | Worked | Status |
----------------------------------------------------
| Aarav    | 09:02    | 18:05     | 8.05h  | Present|
| Sara     | 09:10    | 18:00     | 7.83h  | Partial|
----------------------------------------------------
```

The UI should follow the overall PeoplePay360 Odoo-inspired ERP visual language.

---

# 53. Quick Widget Placement

The quick widget should be easy to access.

Recommended:

```text
Top-right of Attendance page
```

or:

```text
Attendance dashboard/header card
```

Example:

```text
┌───────────────────────────────┐
│ Attendance                    │
│                               │
│ Current Time   09:42 AM       │
│ Today         00:42:15        │
│                               │
│ ● Checked In                  │
│                               │
│ [ Check Out ]                 │
└───────────────────────────────┘
```

---

# 54. Loading States

When checking in:

```text
Checking In...
```

Button should be temporarily disabled.

When checking out:

```text
Checking Out...
```

This prevents accidental duplicate requests.

---

# 55. Success Messages

After successful check-in:

```text
Successfully checked in at 09:02 AM.
```

After successful check-out:

```text
Successfully checked out at 06:05 PM.
Worked Hours: 8h 03m
```

If overtime exists:

```text
Successfully checked out.
Worked Hours: 10h 02m
Overtime: 2h 02m
```

---

# 56. Error Handling

Example errors:

### Already Checked In

```text
You are already checked in.
```

### No Active Attendance

```text
No active attendance found.
```

### Invalid Times

```text
Check-out cannot be earlier than check-in.
```

### Missing Employee

```text
Employee is required.
```

### Missing Schedule

```text
No applicable working schedule found.
```

Errors should be returned consistently by the API.

---

# 57. Date and Time Handling

The system should define a consistent timezone strategy.

Working Schedule contains:

```text
Timezone
```

Attendance timestamps must be handled consistently between:

```text
Browser
API
Database
Working Schedule
Payroll
```

Do not silently mix local time and UTC.

Display timestamps in the user's/company's configured timezone while retaining a consistent backend representation.

---

# 58. Attendance Search and Filters

Recommended filter panel:

```text
Employee
Department
Status
Date From
Date To
```

Example:

```text
Employee: Aarav Mehta
Department: Engineering
Status: Overtime
Date: 01 Sep - 30 Sep
```

Results should update without requiring a full page reload.

---

# 59. Attendance Dashboard Data

Attendance data should feed the main PeoplePay360 dashboard.

Possible metrics:

```text
Present Today
Checked In
Late Employees
Overtime Employees
Total Worked Hours
```

Example:

```text
Attendance Overview

Present       42
Checked In     8
Late           4
Overtime       6
```

---

# 60. Department Attendance

Dashboard may show attendance grouped by department.

Example:

| Department  | Present | Late | Overtime |
| ----------- | ------: | ---: | -------: |
| Engineering |      18 |    2 |        4 |
| HR          |       8 |    1 |        1 |
| Sales       |      12 |    3 |        2 |

This should use live database data.

Do not hardcode dashboard numbers.

---

# 61. Employee Attendance History

Employee detail page should allow access to attendance.

Example smart button:

```text
Attendance
22
```

Clicking it opens:

```text
Employee Attendance History
```

Example:

```text
Date       Check In   Check Out   Worked
01 Sep     09:01      18:02       8.02h
02 Sep     09:05      18:00       7.92h
03 Sep     09:00      19:00       9.00h
```

---

# 62. Employee Smart Button

Employee form should include:

```text
Attendance
```

along with:

```text
Contracts
Time Off
Allocations
```

The Attendance smart button opens attendance records filtered to that employee.

---

# 63. Performance Requirements

Attendance operations should be fast.

For normal list pages:

* Use pagination
* Avoid loading every attendance record
* Use server-side filtering
* Use indexed fields

Recommended indexes:

```text
employee_id
check_in
check_out
status
department_id
```

---

# 64. Data Integrity

The following must be enforced:

### Employee must exist

```text
employee_id is valid
```

### Check-out requires check-in

```text
check_out != NULL
→
check_in != NULL
```

### Check-out must not precede check-in

```text
check_out >= check_in
```

### Only one active attendance

For an employee:

```text
at most one
check_in != NULL
check_out == NULL
```

### Derived hours must be recalculated

```text
worked_hours
overtime_hours
late_minutes
status
```

must be calculated consistently.

---

# 65. Transaction Safety

Check-in and check-out operations must be transaction-safe.

For Check In:

```text
BEGIN
  verify no active attendance
  create attendance
COMMIT
```

The system must prevent two simultaneous requests from creating duplicate open records.

Database constraints/locking should be used where appropriate.

---

# 66. Security

Attendance endpoints must require authentication.

Example:

```http
Authorization: Bearer <JWT>
```

Backend must verify:

```text
User
→ Role
→ Employee
→ Permission
```

An employee must not access another employee's private attendance merely by changing:

```text
employee_id=123
```

in the request.

---

# 67. API Validation

Use Pydantic schemas.

Example:

```text
AttendanceCreate
AttendanceUpdate
AttendanceResponse
CheckInResponse
CheckOutResponse
AttendanceSummary
```

Validation must happen before business logic.

---

# 68. Testing Requirements

Attendance must have unit and API tests.

Minimum tests:

### Test 1 — Check In

```text
Employee not checked in
→ Check In
→ Attendance created
```

Expected:

```text
checked_in = true
```

---

### Test 2 — Duplicate Check In

```text
Employee already checked in
→ Check In
```

Expected:

```text
400/409 error
```

---

### Test 3 — Check Out

```text
09:00 Check In
18:00 Check Out
```

Expected:

```text
Worked Hours = 8h
```

assuming a 1-hour break where applicable.

---

### Test 4 — Invalid Check Out

```text
09:00 Check In
08:00 Check Out
```

Expected:

```text
Validation Error
```

---

### Test 5 — Overtime

```text
Expected = 8h
Worked = 10h
```

Expected:

```text
Overtime = 2h
```

---

### Test 6 — No Overtime

```text
Expected = 8h
Worked = 7h
```

Expected:

```text
Overtime = 0
```

---

### Test 7 — Open Attendance

```text
Check In
without Check Out
```

Expected:

```text
Status = Checked In
```

---

### Test 8 — Employee Access

Employee A requests Employee B's attendance.

Expected:

```text
403 Forbidden
```

---

### Test 9 — Working Schedule

Verify expected hours are derived from the applicable Working Schedule.

---

### Test 10 — Contract Selection

Employee has historical contracts.

Attendance must use the contract applicable to the attendance date.

---

# 69. Demo Seed Data

Use realistic seed data based on the reference UI.

Example employees:

```text
Aarav Mehta
Sara Khan
John Dsouza
Neha Patel
```

Example attendance:

```text
Aarav Mehta
Check In: 09:02
Check Out: 18:04
Worked: 8h 02m
Status: Present
```

```text
Sara Khan
Check In: 09:10
Check Out: 18:00
Worked: 7h 50m
Status: Partial
```

```text
John Dsouza
Check In: 09:00
Check Out: —
Status: Checked In
```

```text
Neha Patel
Check In: 10:15
Check Out: 15:20
Worked: 5h 05m
Status: Partial
```

The final seed values should remain consistent with the project's demo dataset.

---

# 70. Five-Minute Demo Scenario

Use Attendance as part of the integrated HR/payroll story.

## Scenario

### Step 1 — Employee

Open:

```text
Employees
```

Select:

```text
Aarav Mehta
```

Show:

```text
Contracts
Attendance
Time Off
Allocations
```

---

### Step 2 — Attendance

Click:

```text
Attendance
```

Show historical attendance.

---

### Step 3 — Quick Check In

Click:

```text
Check In
```

Show:

```text
● Checked In
```

and live elapsed time.

---

### Step 4 — Check Out

Click:

```text
Check Out
```

Show:

```text
Worked Hours
Overtime
Status
```

---

### Step 5 — Payroll

Navigate to:

```text
Payroll
→ Payruns
```

Compute a payrun.

Attendance information can be used by payroll salary rules.

---

### Step 6 — Payslip

Open the employee's payslip.

Show:

```text
Worked Days
Basic
Allowances
Gross
Deductions
Net
```

This demonstrates that Attendance is integrated with Payroll rather than being an isolated module.

---

# 71. Definition of Done

Attendance is complete only when all of the following work:

## UI

* [ ] Attendance navigation exists
* [ ] Attendance list exists
* [ ] Attendance form exists
* [ ] Search works
* [ ] Filters work
* [ ] New Attendance works
* [ ] Check In widget exists
* [ ] Check Out widget exists
* [ ] Worked Hours displayed
* [ ] Overtime displayed
* [ ] Status displayed
* [ ] Employee smart button works

## Backend

* [ ] Attendance model exists
* [ ] CRUD APIs exist
* [ ] Check-in API exists
* [ ] Check-out API exists
* [ ] Current attendance API exists
* [ ] Summary API exists
* [ ] Authentication enforced
* [ ] RBAC enforced
* [ ] Duplicate check-in prevented
* [ ] Invalid check-out prevented
* [ ] Worked hours calculated server-side
* [ ] Overtime calculated server-side
* [ ] Working Schedule integration works
* [ ] Contract integration works

## Payroll

* [ ] Attendance can be read by Payroll
* [ ] Worked hours available
* [ ] Overtime available
* [ ] Payrun period filtering works
* [ ] Attendance data can feed salary rules

## Dashboard

* [ ] Present count works
* [ ] Checked-in count works
* [ ] Late count works
* [ ] Overtime count works
* [ ] Department attendance works
* [ ] Data is live, not hardcoded

## Testing

* [ ] Check-in test
* [ ] Duplicate check-in test
* [ ] Check-out test
* [ ] Invalid time test
* [ ] Overtime test
* [ ] Permission test
* [ ] Working schedule test
* [ ] Contract applicability test

---

# 72. Final Business Flow

The completed Attendance module must fit into this complete PeoplePay360 workflow:

```text
                    EMPLOYEE
                       |
                       v
                    CONTRACT
                       |
                       v
                WORKING SCHEDULE
                       |
                       v
                   ATTENDANCE
                 /     |      \
                /      |       \
        Check In   Worked Hours  Overtime
                \      |       /
                 \     |      /
                       v
                    PAYROLL
                       |
                       v
                 SALARY RULES
                       |
                       v
                    PAYSLIP
                       |
                       v
                  PDF / EMAIL
```

The important principle is:

> Attendance is the operational source of employee time information, while Payroll consumes that information to calculate compensation.

Do not build Attendance as an isolated CRUD module.

It must be connected to Employee, Contract, Working Schedule, Time Off, Payroll, Payslips, and Dashboard.

```

### File
If you want to save this as the project specification, use the filename:

`05_ATTENDANCE.md`

Next in the sequence is **`06_TIME_OFF.md`**, which will cover **Time Off Types → Allocations → Leave Requests → Approve/Refuse → balance calculation → payroll integration**.
```
