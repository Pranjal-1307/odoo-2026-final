# `06_TIME_OFF.md`

````markdown
# PeoplePay360 — Time Off Management Specification

## 1. Purpose

The Time Off module manages employee leave and absence requests.

The module must support:

- Time Off Types
- Time Off Allocations
- Time Off Requests
- Leave balance calculation
- Employee leave requests
- HR approval/refusal
- Approver tracking
- Allocation consumption
- Remaining balance
- Date and duration calculation
- Days or hours based leave
- Validity periods
- Payroll/work-entry behavior
- Department/employee visibility
- Integration with Employees
- Integration with Contracts
- Integration with Attendance
- Integration with Payroll
- Dashboard reporting

The module must follow this business flow:

Employee
→ Time Off Type
→ Allocation
→ Time Off Request
→ Approval
→ Allocation Used
→ Remaining Balance
→ Attendance / Payroll

---

# 2. Module Structure

The Time Off menu must contain:

```text
Time Off
├── Requests
├── Allocations
└── Time Off Types
````

Recommended navigation:

```text
Employees
Contracts
Attendance
Time Off ▼
Payroll
Reports
```

When the user opens:

```text
Time Off
```

the dropdown should provide:

```text
Requests
Allocations
Time Off Types
```

---

# 3. Core Concepts

The module contains three primary entities.

## Time Off Type

Defines what kind of leave is being used.

Examples:

```text
Paid Leave
Sick Leave
Casual Leave
Unpaid Leave
Annual Leave
```

---

## Allocation

Defines how much leave an employee has been granted.

Example:

```text
Employee: Aarav Mehta
Type: Paid Leave
Allocated: 20 Days
Taken: 5 Days
Remaining: 15 Days
```

---

## Request

Represents an employee asking to use leave.

Example:

```text
Employee: Aarav Mehta
Type: Paid Leave
Start: 10 Sep
End: 12 Sep
Duration: 3 Days
Status: Pending
```

After approval:

```text
Status: Approved
Allocation Used: 3 Days
```

Remaining balance becomes:

```text
20 - 3 = 17 Days
```

---

# 4. Time Off Type

## 4.1 Purpose

Time Off Types define the rules and behavior for each leave category.

The Time Off Type form must support the fields specified by the reference design.

Required fields:

```text
Type Name
Unit
Requires Allocation
Active
Approval
Payroll / Work Entry Behavior
Display Color
Notes
```

---

# 5. Time Off Type — List View

Recommended columns:

| Column              | Description            |
| ------------------- | ---------------------- |
| Type Name           | Name of leave type     |
| Unit                | Days / Hours           |
| Requires Allocation | Yes/No                 |
| Approval            | Approval configuration |
| Active              | Active/inactive        |
| Color               | Display color          |

Example:

| Type Name    | Unit | Requires Allocation | Approval    | Active |
| ------------ | ---- | ------------------- | ----------- | ------ |
| Paid Leave   | Days | Yes                 | HR Approval | Yes    |
| Sick Leave   | Days | Yes                 | HR Approval | Yes    |
| Unpaid Leave | Days | No                  | HR Approval | Yes    |

---

# 6. Time Off Type Form

Example:

```text
------------------------------------------------
Time Off Type
------------------------------------------------

Type Name:
Paid Leave

Unit:
Days

Requires Allocation:
Yes

Approval:
HR Manager

Active:
Yes

Payroll / Work Entry Behavior:
Paid

Display Color:
[Color]

Notes:
Annual paid leave
------------------------------------------------
```

---

# 7. Unit

The Time Off Type must support:

```text
Days
Hours
```

This determines how allocations and requests are measured.

Example:

```text
Paid Leave → Days
Permission Leave → Hours
```

Do not mix units within a single allocation/request calculation.

---

# 8. Requires Allocation

The field:

```text
Requires Allocation
```

determines whether an employee must have an approved allocation before requesting leave.

If:

```text
Requires Allocation = Yes
```

the system must verify available balance before approval.

If:

```text
Requires Allocation = No
```

the request can follow the configured approval process without requiring an allocation.

The exact business behavior must remain consistent across frontend and backend.

---

# 9. Approval Configuration

Time Off Type must define approval behavior.

Possible values:

```text
No Approval
Manager Approval
HR Approval
Manager + HR Approval
```

The project can implement the minimum required approval workflow first and expand later.

At minimum, the system must support:

```text
Pending
Approved
Refused
```

---

# 10. Payroll / Work Entry Behavior

Each Time Off Type should define how it behaves with payroll/work entries.

Examples:

```text
Paid
Unpaid
Not Applicable
```

Example:

```text
Paid Leave
→ Paid

Unpaid Leave
→ Unpaid
```

This information can be consumed by Payroll when calculating salary.

Do not hardcode the payroll behavior based only on the leave name.

Use the Time Off Type configuration.

---

# 11. Active / Inactive

Inactive Time Off Types must not be selectable for new requests.

Example:

```text
Paid Leave
Active = Yes
```

can be selected.

```text
Old Leave Type
Active = No
```

must not appear in normal new-request selection.

Historical records using inactive types must remain accessible.

---

# 12. Display Color

Time Off Types may have a display color.

Example:

```text
Paid Leave → color
Sick Leave → color
Unpaid Leave → color
```

The color can be used in:

* Calendar
* Request cards
* Kanban
* Dashboard
* Leave summary

The color is presentation metadata and must not affect business calculations.

---

# 13. Time Off Allocation

## 13.1 Purpose

Allocations define the amount of leave available to an employee.

Example:

```text
Employee: Aarav Mehta
Type: Paid Leave
Allocated: 20
Taken: 5
Remaining: 15
```

---

# 14. Allocation List View

The allocation list should contain:

| Column    | Description       |
| --------- | ----------------- |
| Employee  | Employee          |
| Type      | Time Off Type     |
| Allocated | Granted amount    |
| Taken     | Used amount       |
| Remaining | Available amount  |
| Status    | Allocation status |
| Approver  | Approver          |
| Validity  | Validity period   |

Example:

| Employee    | Type       | Allocated | Taken | Remaining | Status   |
| ----------- | ---------- | --------: | ----: | --------: | -------- |
| Aarav Mehta | Paid Leave |        20 |     5 |        15 | Approved |
| Sara Khan   | Paid Leave |        18 |     3 |        15 | Approved |

---

# 15. Allocation Form

Required fields:

```text
Employee
Type
Allocated
Taken
Remaining
Status
Approver
Validity
```

Recommended additional fields:

```text
Start Date
End Date
Notes
Created By
Approved By
Created At
Updated At
```

---

# 16. Allocation Example

```text
------------------------------------------------
Time Off Allocation
------------------------------------------------

Employee:
Aarav Mehta

Type:
Paid Leave

Allocated:
20 Days

Taken:
5 Days

Remaining:
15 Days

Status:
Approved

Approver:
HR Manager

Validity:
01 Jan 2026 - 31 Dec 2026
------------------------------------------------
```

---

# 17. Allocation Status

Recommended statuses:

```text
Draft
Pending
Approved
Refused
Expired
Cancelled
```

Minimum required workflow:

```text
Draft/Pending
     ↓
Approved
     ↓
Available Balance
```

If refused:

```text
Pending
   ↓
Refused
```

A refused allocation must not contribute to usable leave balance.

---

# 18. Allocation Calculation

Remaining balance must be calculated as:

```text
Remaining =
Allocated - Taken
```

Example:

```text
Allocated = 20
Taken = 5

Remaining = 15
```

Do not allow:

```text
Remaining = 25
```

when allocated is 20 and taken is 5.

The backend must be authoritative.

---

# 19. Allocation Validity

An allocation can have a validity period.

Example:

```text
Start:
01 Jan 2026

End:
31 Dec 2026
```

Requests outside the allocation's validity period must not consume that allocation.

Example:

```text
Allocation:
01 Jan → 31 Dec

Request:
15 Jan → 17 Jan
```

Valid.

If:

```text
Allocation:
01 Jan → 31 Dec

Request:
05 Jan 2027
```

the system must not use the expired allocation.

---

# 20. Multiple Allocations

An employee may have multiple allocations for the same Time Off Type.

Example:

```text
Aarav
Paid Leave
Allocation A: 10 days
Allocation B: 5 days
```

Total available balance may be:

```text
15 days
```

The backend must define a deterministic allocation-consumption strategy.

Recommended:

```text
Use valid approved allocations with earliest expiry first.
```

If the project implements a simpler single-allocation-per-type model initially, this must be enforced by validation.

Do not silently double-count allocations.

---

# 21. Time Off Request

## 21.1 Purpose

A Time Off Request represents an employee's request to take leave.

The reference design requires:

```text
Employee
Type
Start
End
Duration
Status
Approver
Allocation Used
Reason
Approve
Refuse
```

---

# 22. Request List View

Recommended columns:

| Column          | Description         |
| --------------- | ------------------- |
| Employee        | Employee name       |
| Type            | Time Off Type       |
| Start           | Start date/time     |
| End             | End date/time       |
| Duration        | Calculated duration |
| Status          | Current status      |
| Approver        | Assigned approver   |
| Allocation Used | Allocation amount   |

Example:

| Employee    | Type       | Start  | End    | Duration | Status   |
| ----------- | ---------- | ------ | ------ | -------: | -------- |
| Aarav Mehta | Paid Leave | 10 Sep | 12 Sep |   3 Days | Approved |
| Sara Khan   | Sick Leave | 15 Sep | 16 Sep |   2 Days | Pending  |

---

# 23. Request Form

Example:

```text
------------------------------------------------
Time Off Request
------------------------------------------------

Employee:
Aarav Mehta

Type:
Paid Leave

Start:
10 Sep 2026

End:
12 Sep 2026

Duration:
3 Days

Status:
Pending

Approver:
HR Manager

Allocation Used:
3 Days

Reason:
Family event

[ Approve ] [ Refuse ]
------------------------------------------------
```

---

# 24. Request Status

Recommended statuses:

```text
Draft
Pending
Approved
Refused
Cancelled
```

Primary workflow:

```text
Draft
  ↓
Pending
  ↓
Approved
```

Alternative:

```text
Pending
  ↓
Refused
```

Employee cancellation:

```text
Approved
  ↓
Cancelled
```

if the project allows cancellation after approval.

---

# 25. Request Creation Workflow

Employee creates:

```text
Time Off Request
```

Steps:

```text
1. Select Time Off Type
2. Select Start Date
3. Select End Date
4. Calculate Duration
5. Enter Reason
6. Submit
```

After submission:

```text
Status = Pending
```

The system identifies the appropriate approver.

---

# 26. Duration Calculation

Duration must be calculated by the backend.

For day-based leave:

```text
Duration =
Number of applicable leave days
```

Example:

```text
Start = Monday
End   = Wednesday

Duration = 3 Days
```

For hour-based leave:

```text
Duration =
End Time - Start Time
```

The final implementation must account for the employee's working schedule where applicable.

Do not simply count calendar time if the business rule requires working days/hours.

---

# 27. Working Schedule Integration

Time Off must use the employee's applicable Working Schedule to determine working days/hours where required.

Example:

```text
Working Schedule:
Monday-Friday
09:00-18:00
```

Request:

```text
Friday → Monday
```

If Saturday and Sunday are non-working days, the duration should not incorrectly count them as normal working leave days.

The calculation must follow the configured business rule.

---

# 28. Public Holidays / Non-Working Days

If the project implements a calendar/holiday system, non-working days should be excluded from applicable leave duration.

Example:

```text
Monday → Friday
Public Holiday on Wednesday
```

Potential duration:

```text
4 working days
```

If public holiday support is not implemented in the initial version, do not pretend that the system automatically handles it.

The rule should be documented clearly.

---

# 29. Allocation Validation

If a Time Off Type requires allocation, the system must verify:

```text
Available Balance >= Requested Duration
```

Example:

```text
Remaining = 5 Days
Request = 3 Days
```

Allowed.

After approval:

```text
Remaining = 2 Days
```

---

# 30. Insufficient Balance

Example:

```text
Remaining = 2 Days
Request = 5 Days
```

The system should reject the request or prevent approval according to the configured Time Off Type behavior.

Recommended message:

```text
Insufficient leave balance.

Available: 2 Days
Requested: 5 Days
```

Do not allow the balance to become negative unless negative allocations are explicitly supported.

---

# 31. Allocation Used

Once a request is approved, the request must record the allocation amount used.

Example:

```text
Allocation Used:
3 Days
```

This should reference the actual allocation(s) consumed rather than only storing an arbitrary number.

Recommended relationship:

```text
Time Off Request
        |
        v
Allocation Usage
        |
        v
Allocation
```

This makes balance calculation auditable.

---

# 32. Balance Update on Approval

Example:

Before approval:

```text
Allocated = 20
Taken = 5
Remaining = 15
```

Request:

```text
3 Days
```

After approval:

```text
Allocated = 20
Taken = 8
Remaining = 12
```

The update must occur transactionally.

---

# 33. Balance Must Not Be Consumed on Pending

Important rule:

A pending request must not reduce the final taken balance unless the project explicitly defines a reservation model.

Example:

```text
Allocated = 20
Taken = 5
Remaining = 15

Pending request = 3
```

The official taken balance remains:

```text
Taken = 5
Remaining = 15
```

After approval:

```text
Taken = 8
Remaining = 12
```

---

# 34. Balance Restoration on Cancellation

If an approved request is cancelled, the consumed allocation must be restored.

Example:

Before cancellation:

```text
Allocated = 20
Taken = 8
Remaining = 12
```

Cancelled request:

```text
3 Days
```

After cancellation:

```text
Taken = 5
Remaining = 15
```

This must be transactional and auditable.

---

# 35. Balance Restoration on Refusal

A pending request has not consumed official allocation balance.

Therefore:

```text
Pending → Refused
```

must not change the allocation's taken amount.

---

# 36. Overlapping Requests

The system should prevent conflicting approved/pending leave requests for the same employee where appropriate.

Example:

```text
Request A:
10 Sep → 12 Sep

Request B:
11 Sep → 13 Sep
```

The system should detect the overlap.

Recommended warning:

```text
Employee already has a Time Off Request
covering part of this period.
```

Whether overlapping pending requests are hard-blocked or warned can be configured, but approved leave should not be accidentally double-counted.

---

# 37. Request Approval

Authorized approver clicks:

```text
Approve
```

Backend performs:

```text
1. Verify permission
2. Verify request is Pending
3. Recalculate duration
4. Verify allocation
5. Verify no conflicting approval
6. Consume allocation
7. Set status = Approved
8. Store approver
9. Store approval timestamp
10. Commit transaction
```

Do not rely on values calculated when the request was initially submitted.

Revalidate at approval time.

---

# 38. Request Refusal

Authorized approver clicks:

```text
Refuse
```

The system should optionally request a refusal reason.

Example:

```text
Refusal Reason:
Insufficient staffing during requested period.
```

Then:

```text
Status = Refused
```

No allocation should be consumed.

---

# 39. Approver

The request must identify the approver.

Example:

```text
Approver:
Priya Shah
```

The approver can be derived from:

```text
Employee Manager
```

or:

```text
HR Manager
```

depending on the Time Off Type's approval configuration.

The actual approver must be authorized by RBAC.

---

# 40. Approval Permissions

## Employee

Employee can:

* Create own request
* View own requests
* Cancel own eligible request
* View own balance

Employee cannot:

* Approve own request
* Approve another employee's request
* Modify allocation
* Create approval rules

---

# 41. HR Manager

HR Manager can:

* View requests
* Create requests
* Edit requests
* Approve requests
* Refuse requests
* Manage allocations
* Manage Time Off Types
* View employee balances

---

# 42. HR Payroll User

HR Payroll User can:

* Read approved Time Off
* Read relevant balances
* Use Time Off information during payroll processing

Unless explicitly granted HR approval rights, this role should not approve/reject leave.

---

# 43. HR Payroll Manager

HR Payroll Manager can:

* View requests
* Create requests
* Approve/refuse
* Manage allocations
* Manage Time Off Types
* Use Time Off in payroll

---

# 44. Admin

Admin has full access.

Admin can:

* Create
* Read
* Update
* Delete
* Approve
* Refuse
* Configure Time Off Types
* Manage allocations
* Manage permissions

Users must not be able to elevate their own role.

---

# 45. RBAC Matrix

| Action                | Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
| --------------------- | -------: | ---------: | --------------: | -----------------: | ----: |
| View Own Requests     |      Yes |        Yes |             Yes |                Yes |   Yes |
| View All Requests     |       No |        Yes |            Read |                Yes |   Yes |
| Create Own Request    |      Yes |        Yes |        Optional |                Yes |   Yes |
| Approve Request       |       No |        Yes |              No |                Yes |   Yes |
| Refuse Request        |       No |        Yes |              No |                Yes |   Yes |
| View Own Allocation   |      Yes |        Yes |             Yes |                Yes |   Yes |
| Manage Allocations    |       No |        Yes |              No |                Yes |   Yes |
| Manage Time Off Types |       No |        Yes |            Read |                Yes |   Yes |
| View Balances         |      Own |        All |            Read |                All |   All |

Backend permissions are mandatory.

---

# 46. Database Design

Recommended tables:

```text
time_off_types
time_off_allocations
time_off_requests
time_off_allocation_usages
```

---

# 47. Time Off Type Table

Suggested fields:

```text
id
name
unit
requires_allocation
approval_type
payroll_behavior
display_color
active
notes
created_at
updated_at
```

---

# 48. Allocation Table

Suggested fields:

```text
id
employee_id
time_off_type_id
allocated_amount
taken_amount
remaining_amount
status
approver_id
valid_from
valid_to
notes
created_at
updated_at
```

Foreign keys:

```text
employee_id → employees.id
time_off_type_id → time_off_types.id
approver_id → employees.id/users.id
```

---

# 49. Request Table

Suggested fields:

```text
id
employee_id
time_off_type_id
start_date
end_date
start_time
end_time
duration
status
approver_id
reason
approval_reason
refusal_reason
approved_at
refused_at
cancelled_at
created_at
updated_at
```

---

# 50. Allocation Usage Table

Recommended fields:

```text
id
request_id
allocation_id
amount_used
created_at
```

Relationships:

```text
Request
  ↓
Allocation Usage
  ↓
Allocation
```

This allows one request to consume from multiple allocations if the implementation supports it.

---

# 51. API Endpoints

## Time Off Types

### List

```http
GET /api/time-off/types
```

### Get

```http
GET /api/time-off/types/{type_id}
```

### Create

```http
POST /api/time-off/types
```

### Update

```http
PUT /api/time-off/types/{type_id}
```

### Deactivate

```http
PATCH /api/time-off/types/{type_id}/status
```

---

# 52. Allocations APIs

### List

```http
GET /api/time-off/allocations
```

### Get

```http
GET /api/time-off/allocations/{allocation_id}
```

### Create

```http
POST /api/time-off/allocations
```

### Update

```http
PUT /api/time-off/allocations/{allocation_id}
```

### Approve

```http
POST /api/time-off/allocations/{allocation_id}/approve
```

### Refuse

```http
POST /api/time-off/allocations/{allocation_id}/refuse
```

---

# 53. Request APIs

### List Requests

```http
GET /api/time-off/requests
```

Possible query parameters:

```text
employee_id
type_id
status
date_from
date_to
department_id
page
limit
search
```

### Get Request

```http
GET /api/time-off/requests/{request_id}
```

### Create Request

```http
POST /api/time-off/requests
```

### Update Request

```http
PUT /api/time-off/requests/{request_id}
```

### Approve

```http
POST /api/time-off/requests/{request_id}/approve
```

### Refuse

```http
POST /api/time-off/requests/{request_id}/refuse
```

### Cancel

```http
POST /api/time-off/requests/{request_id}/cancel
```

---

# 54. Balance API

Employee balance:

```http
GET /api/time-off/balance
```

Possible query:

```text
employee_id
type_id
date
```

Example response:

```json
{
  "employee_id": 1,
  "type": "Paid Leave",
  "allocated": 20,
  "taken": 8,
  "remaining": 12,
  "unit": "days"
}
```

---

# 55. Backend Service Structure

Recommended:

```text
backend/
└── app/
    ├── models/
    │   ├── time_off_type.py
    │   ├── time_off_allocation.py
    │   └── time_off_request.py
    │
    ├── schemas/
    │   ├── time_off_type.py
    │   ├── time_off_allocation.py
    │   └── time_off_request.py
    │
    ├── routes/
    │   └── time_off.py
    │
    └── services/
        ├── time_off_type_service.py
        ├── allocation_service.py
        └── time_off_request_service.py
```

---

# 56. Request Service

Recommended service methods:

```text
create_request()
calculate_duration()
validate_request()
check_balance()
find_approver()
approve_request()
refuse_request()
cancel_request()
get_employee_balance()
```

---

# 57. Allocation Service

Recommended methods:

```text
create_allocation()
approve_allocation()
refuse_allocation()
calculate_remaining()
consume_allocation()
restore_allocation()
find_available_allocations()
```

---

# 58. Transaction Safety

Approval must be transactional.

Example:

```text
BEGIN TRANSACTION

Validate Request
       ↓
Calculate Duration
       ↓
Find Allocation
       ↓
Verify Balance
       ↓
Create Allocation Usage
       ↓
Update Taken
       ↓
Update Remaining
       ↓
Approve Request

COMMIT
```

If any step fails:

```text
ROLLBACK
```

This prevents situations where:

```text
Request = Approved
```

but:

```text
Allocation = Not Updated
```

---

# 59. Concurrency

Two HR users might attempt to approve requests at the same time.

Example:

```text
Remaining = 3 days

Request A = 2 days
Request B = 2 days
```

Both cannot be approved simultaneously if only 3 days are available.

The backend must protect the balance using appropriate transaction/locking strategy.

Expected final result:

```text
One request approved
One request rejected/waiting
```

rather than:

```text
Taken = 4
Remaining = -1
```

---

# 60. Attendance Integration

Approved Time Off must integrate with Attendance.

Example:

```text
Employee
Monday
Approved Paid Leave
```

The Attendance dashboard should not incorrectly report the employee as an ordinary absent employee without considering approved leave.

Recommended conceptual status:

```text
Approved Leave
```

for attendance/reporting purposes where applicable.

The exact implementation should be centralized so Attendance and Time Off do not produce conflicting statistics.

---

# 61. Payroll Integration

Payroll should read approved Time Off records for the payrun period.

Example:

```text
Payrun:
01 Sep → 30 Sep

Aarav:
Paid Leave = 3 Days
Unpaid Leave = 2 Days
```

Payroll can use:

```text
Paid Leave Days
Unpaid Leave Days
```

as inputs to salary rules.

---

# 62. Paid Leave

Example:

```text
Time Off Type:
Paid Leave

Payroll Behavior:
Paid
```

Approved leave should generally not reduce the employee's normal salary simply because the employee was absent.

Payroll can receive:

```text
paid_leave_days = 3
```

for reporting or salary rule calculations.

---

# 63. Unpaid Leave

Example:

```text
Time Off Type:
Unpaid Leave

Payroll Behavior:
Unpaid
```

Payroll may use:

```text
unpaid_leave_days
```

to calculate salary deduction according to the configured Salary Rule.

Do not hardcode a deduction amount inside Time Off.

Time Off provides the quantity.

Payroll Salary Rules determine the financial calculation.

---

# 64. Salary Rule Integration

Example salary computation context:

```text
worked_days = 20
paid_leave_days = 2
unpaid_leave_days = 1
```

A salary rule could use:

```text
unpaid_leave_days
```

to calculate a deduction.

Conceptually:

```text
Unpaid Leave Deduction
=
Daily Wage × Unpaid Leave Days
```

The actual formula belongs in the Salary Rule Engine.

---

# 65. Payrun Warnings

During payroll processing, warnings may include:

```text
Employee has unpaid leave.
Employee has pending leave request.
Employee has insufficient allocation.
Employee has inconsistent leave data.
```

Pending requests should not be treated as approved payroll leave.

---

# 66. Employee Page Integration

Employee form should contain a Time Off smart button.

Example:

```text
Time Off
8
```

Clicking it should show requests filtered for that employee.

Also provide:

```text
Allocations
```

smart button.

Example:

```text
Employee
 ├── Contracts
 ├── Attendance
 ├── Time Off
 └── Allocations
```

---

# 67. Employee Leave Balance

Employee should be able to see their own balances.

Example:

```text
My Time Off

Paid Leave
Allocated: 20
Taken: 8
Remaining: 12

Sick Leave
Allocated: 10
Taken: 2
Remaining: 8
```

Employees must not see another employee's private balance.

---

# 68. HR Leave Overview

HR users should be able to view:

```text
Pending Requests
Approved Requests
Refused Requests
Upcoming Leave
Employee Balances
```

Example:

```text
Time Off Overview

Pending Requests     4
Approved Today       6
Upcoming Leave      12
Low Balance          3
```

---

# 69. Calendar View

A calendar-style view is recommended.

Example:

```text
September 2026

Mon    Tue    Wed    Thu    Fri
---------------------------------
       1      2      3      4
       Aarav
       Leave

7      8      9      10     11
                    Sara
                    Leave
```

Use Time Off Type display colors.

Calendar view is an enhancement if time is limited; list/form functionality is mandatory.

---

# 70. Search and Filters

Requests should support:

```text
Employee
Department
Time Off Type
Status
Start Date
End Date
Approver
```

Quick filters:

```text
My Requests
Pending
Approved
Refused
Upcoming
This Month
```

---

# 71. Validation Rules

The backend must validate:

### Employee exists

```text
employee_id must be valid
```

### Time Off Type exists

```text
type_id must be valid
```

### Type is active

Inactive types cannot be used for new requests.

### Start <= End

```text
start_date <= end_date
```

### Duration > 0

Zero or negative leave is invalid.

### Allocation

If required:

```text
available balance >= duration
```

### Validity

Allocation must be valid for the requested period.

### Permission

Only authorized users can approve/refuse.

---

# 72. Self-Approval Prevention

An employee must not approve their own request.

Invalid:

```text
Employee:
Aarav

Approver:
Aarav
```

unless the application explicitly supports an administrator override.

Normal employee workflow must require another authorized approver.

---

# 73. Historical Records

Do not delete historical Time Off records simply because a Time Off Type becomes inactive.

Example:

```text
Old Type:
Compensatory Leave
Active = No
```

Existing requests must remain accessible.

This is important for:

* HR history
* Payroll audit
* Reports
* Employee records

---

# 74. Audit Fields

Recommended fields:

```text
created_at
updated_at
created_by
approved_at
approved_by
refused_at
refused_by
cancelled_at
cancelled_by
```

For stronger auditability, optionally store an approval history.

---

# 75. Frontend Structure

Recommended React structure:

```text
src/
└── pages/
    └── time-off/
        ├── TimeOffPage.jsx
        ├── TimeOffRequests.jsx
        ├── TimeOffRequestForm.jsx
        ├── TimeOffAllocations.jsx
        ├── AllocationForm.jsx
        ├── TimeOffTypes.jsx
        ├── TimeOffTypeForm.jsx
        ├── LeaveBalance.jsx
        └── TimeOffCalendar.jsx
```

---

# 76. Request UI

Recommended layout:

```text
----------------------------------------------------
| Time Off Requests                               |
----------------------------------------------------
| Search                         | New Request     |
----------------------------------------------------
| My Requests | Pending | Approved | Refused      |
----------------------------------------------------

| Employee | Type | Start | End | Duration | Status|
----------------------------------------------------
| Aarav    | Paid | 10/9  |12/9 | 3 Days   |Approved|
| Sara     | Sick | 15/9  |16/9 | 2 Days   |Pending |
----------------------------------------------------
```

---

# 77. Approval UI

For authorized users:

```text
------------------------------------------------
Time Off Request
------------------------------------------------

Employee: Aarav Mehta
Type: Paid Leave
Duration: 3 Days
Balance: 15 Days
Reason: Family event

Status: Pending

[ Approve ]     [ Refuse ]
------------------------------------------------
```

Before approval, show balance where useful.

---

# 78. Refuse Confirmation

When clicking:

```text
Refuse
```

show confirmation:

```text
Are you sure you want to refuse this request?

Reason:
[________________________]

[ Confirm Refuse ] [ Cancel ]
```

The refusal reason should be stored if required by the workflow.

---

# 79. Approval Confirmation

When clicking:

```text
Approve
```

show:

```text
Approve Time Off Request?

Employee:
Aarav Mehta

Duration:
3 Days

Available Balance:
15 Days

After Approval:
12 Days

[ Confirm Approval ] [ Cancel ]
```

This provides a clear demo and prevents accidental approval.

---

# 80. User Experience Requirements

The module should make the current state obvious.

Use clear status badges:

```text
Pending
Approved
Refused
Cancelled
```

Use clear balance information:

```text
Remaining: 12 Days
```

Use warnings where appropriate:

```text
⚠ Only 2 days remaining.
```

Avoid showing raw database IDs to normal users.

---

# 81. API Response Example

Request response:

```json
{
  "id": 101,
  "employee_id": 1,
  "employee_name": "Aarav Mehta",
  "type": "Paid Leave",
  "start_date": "2026-09-10",
  "end_date": "2026-09-12",
  "duration": 3,
  "unit": "days",
  "status": "approved",
  "approver": "Priya Shah",
  "allocation_used": 3,
  "reason": "Family event"
}
```

---

# 82. Balance API Response

```json
{
  "employee_id": 1,
  "balances": [
    {
      "type": "Paid Leave",
      "allocated": 20,
      "taken": 8,
      "remaining": 12,
      "unit": "days"
    },
    {
      "type": "Sick Leave",
      "allocated": 10,
      "taken": 2,
      "remaining": 8,
      "unit": "days"
    }
  ]
}
```

---

# 83. Testing Requirements

Minimum automated tests:

## Test 1 — Create Time Off Type

```text
Create Paid Leave
→ Type created
→ Active
```

---

## Test 2 — Create Allocation

```text
Aarav
Paid Leave
20 Days
```

Expected:

```text
Allocated = 20
Remaining = 20
```

---

## Test 3 — Create Request

```text
Request = 3 Days
```

Expected:

```text
Status = Pending
```

---

## Test 4 — Pending Does Not Consume Balance

Before:

```text
Allocated = 20
Taken = 0
Remaining = 20
```

Create pending request for 3 days.

Expected:

```text
Taken = 0
Remaining = 20
```

---

## Test 5 — Approve Request

Approve 3-day request.

Expected:

```text
Taken = 3
Remaining = 17
```

---

## Test 6 — Insufficient Balance

```text
Remaining = 2
Request = 5
```

Expected:

```text
Approval rejected
```

---

## Test 7 — Refuse Request

Pending request:

```text
3 Days
```

Refuse.

Expected:

```text
Status = Refused
Taken unchanged
```

---

## Test 8 — Cancel Approved Request

Approved request:

```text
3 Days
```

Cancel.

Expected:

```text
Taken decreases by 3
Remaining increases by 3
```

---

## Test 9 — Inactive Type

Set:

```text
Paid Leave
Active = False
```

Try creating new request.

Expected:

```text
Request rejected
```

Historical requests remain accessible.

---

## Test 10 — Permission

Employee A attempts to approve a request.

Expected:

```text
403 Forbidden
```

---

## Test 11 — Self Approval

Employee attempts to approve own request.

Expected:

```text
Approval rejected
```

---

## Test 12 — Overlapping Leave

Create:

```text
10 Sep → 12 Sep
```

Then:

```text
11 Sep → 13 Sep
```

Expected:

```text
Conflict warning / rejection
```

according to the configured rule.

---

## Test 13 — Duration

Verify:

```text
Monday → Wednesday
```

produces the correct applicable duration.

---

## Test 14 — Working Schedule

Verify non-working days are treated correctly when calculating leave duration.

---

## Test 15 — Payroll Integration

Approved unpaid leave should be available to Payroll as an input.

---

# 84. Demo Seed Data

Recommended Time Off Types:

```text
Paid Leave
Sick Leave
Unpaid Leave
```

Recommended allocations:

```text
Aarav Mehta
Paid Leave
20 Days
```

```text
Sara Khan
Paid Leave
18 Days
```

Example approved leave:

```text
Aarav Mehta
Paid Leave
10 Sep → 12 Sep
3 Days
Approved
```

Example pending leave:

```text
Sara Khan
Sick Leave
15 Sep → 16 Sep
2 Days
Pending
```

Example unpaid leave:

```text
John Dsouza
Unpaid Leave
20 Sep → 21 Sep
2 Days
Approved
```

---

# 85. Five-Minute Demo Scenario

Use Time Off as the second major HR workflow.

## Step 1 — Employee

Open:

```text
Employees
→ Aarav Mehta
```

Show smart buttons:

```text
Contracts
Attendance
Time Off
Allocations
```

---

## Step 2 — Allocation

Click:

```text
Allocations
```

Show:

```text
Paid Leave
Allocated: 20 Days
Taken: 5 Days
Remaining: 15 Days
```

---

## Step 3 — Create Leave Request

Click:

```text
Time Off
→ New
```

Enter:

```text
Type:
Paid Leave

Start:
10 Sep 2026

End:
12 Sep 2026

Reason:
Family event
```

System calculates:

```text
Duration:
3 Days
```

---

## Step 4 — Submit

Click:

```text
Submit
```

Status becomes:

```text
Pending
```

Balance remains:

```text
15 Days
```

because the request has not been approved.

---

## Step 5 — HR Approval

Login as:

```text
HR Manager
```

Open:

```text
Time Off
→ Requests
```

Open Aarav's request.

Show:

```text
Duration: 3 Days
Available Balance: 15 Days
```

Click:

```text
Approve
```

---

## Step 6 — Balance Update

After approval:

```text
Allocated: 20
Taken: 8
Remaining: 12
```

This demonstrates the important business logic.

---

## Step 7 — Attendance Integration

Show that the approved leave is reflected appropriately in attendance/reporting.

---

## Step 8 — Payroll

Open Payroll.

Show that approved leave information is available for payroll processing.

For example:

```text
Paid Leave Days: 3
Unpaid Leave Days: 0
```

---

# 86. Final Business Flow

The completed Time Off module must implement:

```text
                 EMPLOYEE
                    |
                    v
             TIME OFF TYPE
                    |
                    v
               ALLOCATION
                    |
                    v
             LEAVE BALANCE
                    |
                    v
            TIME OFF REQUEST
                    |
             +------+------+
             |             |
             v             v
          APPROVE        REFUSE
             |
             v
      ALLOCATION USED
             |
             v
       REMAINING BALANCE
             |
       +-----+------+
       |            |
       v            v
   ATTENDANCE     PAYROLL
                    |
                    v
              SALARY RULES
                    |
                    v
                 PAYSLIP
```

---

# 87. Critical Business Rules

The following rules are mandatory:

1. A Time Off Request must reference an Employee.
2. A Request must reference an active Time Off Type.
3. Duration must be calculated server-side.
4. Allocation must be checked when required.
5. Pending requests must not consume official balance.
6. Approved requests consume allocation.
7. Refused requests do not consume allocation.
8. Cancelled approved requests restore consumed allocation.
9. Remaining balance must equal Allocated minus Taken.
10. Employees cannot approve their own requests.
11. Unauthorized users cannot approve/refuse requests.
12. Inactive Time Off Types cannot be used for new requests.
13. Historical records must remain available.
14. Approval must revalidate the current balance.
15. Balance updates must be transactional.
16. Concurrent approvals must not create negative balances accidentally.
17. Time Off must integrate with the employee's Working Schedule where duration depends on working days/hours.
18. Approved leave must integrate consistently with Attendance.
19. Approved leave must be available to Payroll.
20. Payroll amounts must be calculated by Salary Rules, not hardcoded inside Time Off.

---

# 88. Definition of Done

## Time Off Types

* [ ] Time Off Types list exists
* [ ] Time Off Type form exists
* [ ] Days/Hours supported
* [ ] Requires Allocation supported
* [ ] Approval configuration supported
* [ ] Payroll/Work Entry behavior supported
* [ ] Active/Inactive supported
* [ ] Display Color supported
* [ ] Notes supported

## Allocations

* [ ] Allocation list exists
* [ ] Allocation form exists
* [ ] Employee selectable
* [ ] Type selectable
* [ ] Allocated amount works
* [ ] Taken amount works
* [ ] Remaining amount works
* [ ] Status works
* [ ] Approver works
* [ ] Validity works
* [ ] Balance calculation is server-side

## Requests

* [ ] Request list exists
* [ ] Request form exists
* [ ] Employee works
* [ ] Type works
* [ ] Start works
* [ ] End works
* [ ] Duration calculated
* [ ] Status works
* [ ] Approver works
* [ ] Allocation Used works
* [ ] Reason works
* [ ] Approve works
* [ ] Refuse works
* [ ] Cancel works where implemented

## Integrations

* [ ] Employee integration
* [ ] Contract integration
* [ ] Working Schedule integration
* [ ] Attendance integration
* [ ] Payroll integration
* [ ] Dashboard integration

## Security

* [ ] Employee sees own records
* [ ] HR Manager can manage leave
* [ ] Payroll User has appropriate read access
* [ ] Payroll Manager has full HR/payroll access
* [ ] Admin has full access
* [ ] Self-approval prevented
* [ ] Backend RBAC enforced

## Testing

* [ ] Allocation test
* [ ] Request test
* [ ] Approval test
* [ ] Refusal test
* [ ] Cancellation test
* [ ] Balance test
* [ ] Insufficient balance test
* [ ] Duration test
* [ ] Permission test
* [ ] Overlap test
* [ ] Payroll integration test

---

# 89. Implementation Priority

If development time is limited, implement in this order:

### Priority 1 — Mandatory

```text
Time Off Types
        ↓
Allocations
        ↓
Requests
        ↓
Approve / Refuse
        ↓
Balance Calculation
```

### Priority 2

```text
Working Schedule integration
Attendance integration
Payroll integration
```

### Priority 3

```text
Calendar View
Advanced filters
Approval history
Advanced reports
```

Do not spend hackathon time polishing the calendar before the allocation/request/approval workflow is reliable.

---

# 90. Final Principle

Time Off is not just a leave-request CRUD module.

The important PeoplePay360 business logic is:

```text
Allocation
    ↓
Available Balance
    ↓
Employee Request
    ↓
Approval
    ↓
Allocation Consumption
    ↓
Remaining Balance
    ↓
Attendance / Payroll
```

The most important demo moment is:

```text
20 Days Allocated
       ↓
3-Day Leave Request
       ↓
Pending
       ↓
HR Approves
       ↓
Taken: 8 Days
Remaining: 12 Days
       ↓
Payroll receives approved leave information
```

This proves that Time Off is integrated into the HR and Payroll system rather than being an isolated form.

```
```
