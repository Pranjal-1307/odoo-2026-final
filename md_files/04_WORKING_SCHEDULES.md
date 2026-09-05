# `04_WORKING_SCHEDULES.md`

````markdown
# 04_WORKING_SCHEDULES.md

# PeoplePay360 — Working Schedules

## 1. Module Overview

The Working Schedules module defines the expected working pattern for employees.

A Working Schedule determines:

- Which days an employee is expected to work.
- Start time for each working day.
- End time for each working day.
- Break duration.
- Daily working hours.
- Total weekly working hours.
- Timezone.
- Company.
- Active/inactive status.

Working Schedules are used by:

Employee
    |
    v
Contract
    |
    v
Working Schedule
    |
    +-- Working Days
    +-- Start Time
    +-- End Time
    +-- Break
    +-- Daily Hours
    +-- Weekly Hours
    |
    v
Attendance / Payroll

The Working Schedule module must therefore be implemented as a reusable master-data module, not as a simple text field.

---

# 2. Source Requirements

The provided PeoplePay360 reference requires Working Schedules to support:

- Schedule Name.
- Company.
- Days per Week.
- Hours per Week.
- Timezone.
- Weekly schedule rows.
- Day.
- Start time.
- End time.
- Break.
- Calculated daily hours.
- Total weekly hours.
- Add Day.
- Remove row.
- Schedule status.

The reference also shows example schedules such as:

- 40 Hours / Week.
- Night Shift.
- Retail Weekend.
- Flexible Hybrid.
- Part-time 20h.

A sample 40-hour schedule is:

```text
Monday-Friday
09:00-18:00
1 hour break
8 hours/day
40 hours/week
````

---

# 3. Module Goals

The module must allow authorized users to:

* View working schedules.
* Create working schedules.
* Edit working schedules.
* Activate/deactivate schedules.
* Define weekly working days.
* Define daily start/end times.
* Define break duration.
* Automatically calculate daily working hours.
* Automatically calculate total weekly hours.
* Validate schedule rows.
* Assign schedules to contracts.
* Search schedules.
* Filter schedules.
* Sort schedules.
* Preserve schedules used historically.
* Prevent invalid schedule configurations.

---

# 4. Main Navigation

Working Schedules should be accessible from the appropriate HR configuration area.

Recommended navigation:

```text
Employees
Contracts
Attendance
Time Off
Payroll
Reports
```

Working Schedules may be accessed from:

```text
HR / Configuration
```

or through:

```text
Contracts → Working Schedules
```

The exact placement can follow the final application navigation, but the feature must be easily accessible to authorized HR users.

---

# 5. Routes

Recommended frontend routes:

```text
/working-schedules
/working-schedules/new
/working-schedules/:id
```

Optional:

```text
/working-schedules/:id/edit
```

---

# 6. Working Schedule List View

The List view must follow the Odoo-style ERP design.

Required columns:

| Column        | Description                 |
| ------------- | --------------------------- |
| Schedule Name | Name of schedule            |
| Days / Week   | Number of working days      |
| Hours / Week  | Total expected weekly hours |
| Company       | Associated company          |
| Status        | Active/Inactive             |

Example:

```text
----------------------------------------------------------------
Schedule Name       Days / Week    Hours / Week    Company   Status
----------------------------------------------------------------
40 Hours / Week     5              40              PeoplePay  Active
Night Shift         5              40              PeoplePay  Active
Retail Weekend      6              48              PeoplePay  Active
Flexible Hybrid     5              40              PeoplePay  Active
Part-time 20h       5              20              PeoplePay  Active
----------------------------------------------------------------
```

---

# 7. Working Schedule Toolbar

Recommended:

```text
--------------------------------------------------------------
Working Schedules                              [New]
--------------------------------------------------------------

[ Search... ] [ Filters ] [ Sort ]
```

Keep the toolbar visually consistent with Employees and Contracts.

---

# 8. Search

Working Schedule search should support:

* Schedule Name.
* Company.
* Status.

Example:

```text
Search:
Night
```

Result:

```text
Night Shift
```

Search must be case-insensitive.

---

# 9. Filters

Recommended filters:

```text
Status
Company
Days / Week
Hours / Week
```

At minimum:

```text
Active
Inactive
Company
```

must be available.

---

# 10. Sorting

Recommended sorting:

```text
Schedule Name
Days / Week
Hours / Week
Company
Status
```

The exact default sorting may be chosen based on UX.

---

# 11. Working Schedule Form

The Working Schedule Form must contain:

```text
Schedule Name
Company
Days per Week
Hours per Week
Timezone
Weekly Schedule
Total Weekly Hours
Status
```

Recommended layout:

```text
--------------------------------------------------
Working Schedule
--------------------------------------------------

Schedule Name       [ 40 Hours / Week ]

Company             [ PeoplePay360 ▼ ]

Status              [ Active ▼ ]

Timezone            [ Asia/Kolkata ▼ ]

Days per Week       [ 5 ]

Hours per Week      [ 40 ]

--------------------------------------------------
Weekly Schedule
--------------------------------------------------

Day          Start       End         Break      Hours
--------------------------------------------------
Monday       09:00       18:00       01:00      8
Tuesday      09:00       18:00       01:00      8
Wednesday    09:00       18:00       01:00      8
Thursday     09:00       18:00       01:00      8
Friday       09:00       18:00       01:00      8
--------------------------------------------------

                 Total Weekly Hours: 40

[ + Add Day ]

                 [Save] [Cancel]
--------------------------------------------------
```

---

# 12. Schedule Name

Field:

```text
schedule_name
```

Type:

```text
String
```

Required:

```text
Yes
```

Examples:

```text
40 Hours / Week
Night Shift
Retail Weekend
Flexible Hybrid
Part-time 20h
```

Schedule names should be descriptive.

---

# 13. Company

Field:

```text
company_id
```

Relationship:

```text
Working Schedule → Company
```

Company is used for:

* Employee assignment.
* Contract assignment.
* Payroll context.
* Dashboard filtering.

A schedule should reference a valid company.

---

# 14. Status

Recommended internal values:

```text
active
inactive
```

UI labels:

```text
Active
Inactive
```

An inactive schedule should not normally be selectable for new contracts.

However, it must remain available for historical contracts that used it.

---

# 15. Timezone

Field:

```text
timezone
```

Example:

```text
Asia/Kolkata
```

The timezone is important when interpreting:

* Attendance timestamps.
* Schedule start times.
* Schedule end times.
* Payroll working-day calculations.

The exact timezone list can be based on supported application configuration.

---

# 16. Days Per Week

Field:

```text
days_per_week
```

This represents the number of configured working days.

Example:

```text
Monday
Tuesday
Wednesday
Thursday
Friday

Days per Week = 5
```

The value should preferably be calculated from weekly schedule rows.

Do not allow the manually entered value to silently disagree with the configured rows.

---

# 17. Hours Per Week

Field:

```text
hours_per_week
```

This represents expected weekly working hours.

It should be calculated from the weekly schedule rows.

Example:

```text
Monday = 8
Tuesday = 8
Wednesday = 8
Thursday = 8
Friday = 8

Total = 40
```

Therefore:

```text
Hours / Week = 40
```

---

# 18. Calculated vs Manual Values

For consistency:

```text
Days / Week
Hours / Week
```

should preferably be calculated from the weekly schedule rows.

The user should define:

```text
Day
Start
End
Break
```

and the system calculates:

```text
Daily Hours
Days / Week
Total Weekly Hours
```

This avoids inconsistent data.

---

# 19. Weekly Schedule

The weekly schedule is the core of this module.

Each row represents one working day.

Required row fields:

```text
Day
Start
End
Break
Hours
```

Example:

```text
Day        Start    End      Break    Hours
Monday     09:00    18:00    01:00    8
```

---

# 20. Schedule Day

Supported days:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

A day should not be duplicated in the same schedule.

Invalid:

```text
Monday
Monday
Tuesday
```

must be rejected.

---

# 21. Working Day Selection

Users should be able to add/remove working days.

Example:

```text
Weekly Schedule

Monday
Tuesday
Wednesday
Thursday
Friday

[+ Add Day]
```

For an employee working Monday-Friday, Saturday and Sunday are simply absent from the schedule.

---

# 22. Add Day

The Form must support:

```text
[ + Add Day ]
```

Clicking it adds a new schedule row.

Example:

```text
Monday
Tuesday
Wednesday
Thursday
Friday

[ + Add Day ]

New row:
[ Select Day ] [ Start ] [ End ] [ Break ]
```

---

# 23. Remove Day

Each configured row should support removal where appropriate.

Example:

```text
Monday     09:00    18:00    01:00    8     [Remove]
```

Removing a row must immediately recalculate:

```text
Days / Week
Hours / Week
```

---

# 24. Start Time

Field:

```text
start_time
```

Format:

```text
HH:MM
```

Example:

```text
09:00
```

Start time is required for a working day.

---

# 25. End Time

Field:

```text
end_time
```

Format:

```text
HH:MM
```

Example:

```text
18:00
```

End time is required for a working day.

---

# 26. Break Duration

Field:

```text
break_duration
```

Format may be:

```text
HH:MM
```

or numeric minutes.

Recommended internal representation:

```text
break_minutes
```

Example:

```text
60
```

represents:

```text
1 hour
```

---

# 27. Daily Working Hours

Daily working hours must be calculated automatically.

Formula:

```text
Daily Hours =
(End Time - Start Time) - Break Duration
```

Example:

```text
Start = 09:00
End = 18:00
Break = 01:00

Elapsed = 9 hours
Break = 1 hour

Daily Hours = 8 hours
```

---

# 28. Daily Hours Display

The user should see calculated hours.

Example:

```text
Day        Start    End      Break    Hours
Monday     09:00    18:00    01:00    8.0
```

The Hours field should not normally be manually editable.

---

# 29. Total Weekly Hours

Formula:

```text
Total Weekly Hours =
SUM(all configured daily working hours)
```

Example:

```text
Monday      8
Tuesday     8
Wednesday   8
Thursday    8
Friday      8

Total = 40
```

Display:

```text
Total Weekly Hours: 40
```

---

# 30. Days Per Week Calculation

Formula:

```text
Days Per Week =
COUNT(configured working-day rows)
```

Example:

```text
Monday
Tuesday
Wednesday
Thursday
Friday

Days Per Week = 5
```

---

# 31. Hours Per Week Example

Example schedule:

```text
Monday-Friday
09:00-18:00
Break = 1 hour
```

Calculation:

```text
9 hours elapsed
- 1 hour break
= 8 hours/day

8 × 5
= 40 hours/week
```

Display:

```text
Days / Week: 5
Hours / Week: 40
```

---

# 32. Schedule Row Validation

Every row must validate:

```text
Day is selected
Start time exists
End time exists
Break duration is valid
Daily hours > 0
```

---

# 33. Invalid Start/End Time

Invalid:

```text
Start: 18:00
End: 09:00
```

should be rejected for a normal same-day schedule.

Display:

```text
End time must be after start time.
```

---

# 34. Overnight Shifts

The reference includes a schedule named:

```text
Night Shift
```

If overnight schedules are supported, they must be explicitly handled.

Example:

```text
Start: 22:00
End: 06:00
```

This crosses midnight.

Do not accidentally calculate:

```text
06:00 - 22:00 = negative hours
```

If overnight support is implemented, calculate:

```text
22:00 → 24:00 = 2 hours
00:00 → 06:00 = 6 hours
Total = 8 hours
```

If overnight shifts are NOT implemented in MVP, the system must clearly reject such configurations rather than silently calculating incorrect hours.

Recommended MVP behavior:

```text
Normal same-day schedules are fully supported.
Overnight schedules require explicit overnight support.
```

---

# 35. Break Validation

Break duration must not be negative.

Invalid:

```text
Break = -30 minutes
```

must be rejected.

Break must also be less than the elapsed shift duration.

Example:

```text
09:00 → 18:00
Break = 10 hours
```

must be rejected.

---

# 36. Daily Hours Validation

After calculating:

```text
Daily Hours
```

the result must be greater than zero.

Example:

```text
Start = 09:00
End = 10:00
Break = 2 hours
```

would produce:

```text
-1 hour
```

This is invalid.

---

# 37. Duplicate Days

A schedule cannot contain the same day more than once.

Invalid:

```text
Monday 09:00-17:00
Monday 18:00-22:00
```

unless multi-shift-per-day support is explicitly designed.

For MVP:

```text
One row per day.
```

---

# 38. Empty Schedule

A schedule should not be activated with zero working days.

Example:

```text
Schedule Name: Test Schedule
Days: 0
```

Status should remain Draft/Inactive or saving should be rejected depending on workflow.

Recommended:

```text
An active schedule must contain at least one working day.
```

---

# 39. Weekly Hours Consistency

Do not allow:

```text
Days / Week = 5
Hours / Week = 40
```

while rows actually calculate:

```text
Days = 4
Hours = 32
```

The row calculation is the source of truth.

The system should automatically update summary values.

---

# 40. Manual Hours Override

Do not provide manual override of:

```text
Daily Hours
Total Weekly Hours
```

unless there is a specific business requirement.

The reference emphasizes automatic calculation.

Recommended:

```text
User enters:
Day + Start + End + Break

System calculates:
Hours
Days / Week
Hours / Week
```

---

# 41. Schedule Form Interaction

Example:

```text
User enters:

Monday
09:00
18:00
01:00

        |
        v

System calculates:

8 hours
```

Then adding Friday:

```text
Monday      8
Tuesday     8
Wednesday   8
Thursday    8
Friday      8

        |
        v

Total = 40
```

All calculations should update immediately in the UI.

---

# 42. Real-Time Calculation

When the user changes:

```text
Start
End
Break
```

recalculate daily hours immediately.

When a row is:

```text
Added
Removed
Edited
```

recalculate:

```text
Days / Week
Hours / Week
```

without requiring page refresh.

---

# 43. Backend Recalculation

Frontend calculations are for UX only.

The backend must recalculate the values before saving.

Do not trust:

```text
hours = 8
```

sent from the browser.

Backend should derive:

```text
hours = end - start - break
```

itself.

---

# 44. Schedule Database Model

Recommended structure:

```text
working_schedules
-----------------
id
name
company_id
timezone
status
created_at
updated_at
```

And:

```text
working_schedule_lines
----------------------
id
working_schedule_id
day_of_week
start_time
end_time
break_minutes
daily_hours
sequence
```

---

# 45. Schedule Relationship

One Working Schedule has many schedule lines:

```text
Working Schedule
       |
       +-- Monday
       +-- Tuesday
       +-- Wednesday
       +-- Thursday
       +-- Friday
```

Each schedule line belongs to exactly one Working Schedule.

---

# 46. Why Use Schedule Lines

Do not store the entire weekly schedule as a single JSON/string field if relational querying and validation are needed.

Prefer:

```text
working_schedules
        |
        +-- working_schedule_lines
```

This makes it easier to:

* Validate days.
* Calculate hours.
* Query schedules.
* Display schedules.
* Reuse schedules.
* Maintain database integrity.

---

# 47. Schedule Line Fields

Recommended:

```text
id
working_schedule_id
day_of_week
start_time
end_time
break_minutes
daily_hours
sequence
```

`daily_hours` may be calculated dynamically instead of persisted, depending on implementation.

---

# 48. Sequence

Sequence determines display order.

Recommended:

```text
Monday    1
Tuesday   2
Wednesday 3
Thursday  4
Friday    5
Saturday  6
Sunday    7
```

The UI should normally display rows in weekday order.

---

# 49. Schedule Status

Recommended:

```text
active
inactive
```

If the application uses a Draft state:

```text
draft
active
inactive
```

can be supported.

Do not make the workflow more complicated than required.

---

# 50. Activating a Schedule

Before activation, validate:

```text
Name exists
Company exists
Timezone valid
At least one working day
No duplicate day
Start/end valid
Break valid
Daily hours valid
Total weekly hours valid
```

Only then allow:

```text
Active
```

---

# 51. Deactivating a Schedule

When a schedule is no longer used for new assignments:

```text
status = inactive
```

Do NOT delete it automatically.

Existing historical contracts may reference it.

---

# 52. Historical Schedule Principle

Suppose:

```text
2025 Contract
Working Schedule = 40 Hours / Week
```

and later the company changes the schedule.

Do not rewrite historical contract context automatically.

Historical payroll/attendance must remain auditable.

---

# 53. Schedule Used By Contracts

A schedule may be referenced by many contracts:

```text
40 Hours / Week
    |
    +-- Aarav Contract
    +-- Sara Contract
    +-- John Contract
```

Do not duplicate the schedule definition into every contract.

Contracts reference the schedule.

---

# 54. Schedule Deletion

If a schedule is referenced by contracts:

Do not physically delete it.

Prefer:

```text
Inactive
```

This prevents broken foreign-key references and protects historical data.

---

# 55. Employee Assignment

An Employee may have a schedule through:

```text
Employee
    |
    v
Contract
    |
    v
Working Schedule
```

The Employee Form may also display the currently applicable schedule for convenience.

The Contract is the employment-period context.

---

# 56. Contract Schedule History

Example:

```text
Aarav Mehta

Contract 2025
Schedule = 40 Hours / Week

Contract 2026
Schedule = Part-time 20h
```

Both historical relationships must remain available.

---

# 57. Attendance Integration

Working Schedule provides expected hours.

Attendance provides actual hours.

Conceptually:

```text
Working Schedule
Expected:
09:00 → 18:00
8 hours

Attendance
Actual:
09:10 → 18:30
8h 20m

Difference:
+20 minutes
```

This can later contribute to overtime calculations.

Attendance implementation belongs to:

```text
05_ATTENDANCE.md
```

---

# 58. Payroll Integration

Payroll may use Working Schedule for:

* Expected working days.
* Expected working hours.
* Worked-day calculations.
* Payroll period context.
* Attendance comparison.
* Overtime calculations where applicable.

Do not implement salary-rule calculations inside Working Schedules.

---

# 59. Payroll Period Example

Employee:

```text
Aarav Mehta
```

Contract:

```text
40 Hours / Week
```

Schedule:

```text
Monday-Friday
8 hours/day
```

Payroll period:

```text
January 2026
```

The payroll engine can determine expected working time using the applicable schedule.

---

# 60. Timezone Principle

Schedule times must be interpreted in the configured schedule timezone.

Example:

```text
Timezone:
Asia/Kolkata

Start:
09:00
```

means 09:00 in the schedule timezone.

Do not accidentally interpret all schedule times as UTC.

---

# 61. Attendance Timestamp Principle

Attendance timestamps may be stored consistently in UTC at the database/application level while displayed using the appropriate employee/schedule timezone.

The exact UTC strategy should be standardized across the application.

Do not implement different timezone handling in different modules.

---

# 62. Timezone Validation

Timezone must be a valid supported timezone.

Example:

```text
Asia/Kolkata
```

Valid.

Invalid:

```text
ABC/XYZ
```

must be rejected.

---

# 63. Schedule Examples

Seed/demo schedules should include:

```text
40 Hours / Week
Night Shift
Retail Weekend
Flexible Hybrid
Part-time 20h
```

These examples are based on the provided reference design.

---

# 64. Example — 40 Hours / Week

```text
Schedule Name:
40 Hours / Week

Days:
Monday-Friday

Start:
09:00

End:
18:00

Break:
01:00

Daily Hours:
8

Days / Week:
5

Hours / Week:
40
```

---

# 65. Example — Part-time 20h

Example:

```text
Schedule Name:
Part-time 20h

Days:
Monday-Friday

Daily Hours:
4

Hours / Week:
20
```

The exact start/end times may be configured according to the demo dataset.

---

# 66. Example — Retail Weekend

A retail schedule may include:

```text
Saturday
Sunday
```

and potentially other days.

The system must calculate totals from the configured rows.

Do not assume Monday-Friday is the only valid pattern.

---

# 67. Example — Flexible Hybrid

A Flexible Hybrid schedule can still define expected working hours.

Example:

```text
Monday-Friday
8 hours/day
40 hours/week
```

The schedule does not itself need to encode whether the employee is physically in an office each day unless the project explicitly adds such functionality.

---

# 68. Example — Night Shift

If overnight support is implemented:

```text
Start:
22:00

End:
06:00
```

The system must correctly calculate the overnight duration.

If overnight support is not implemented:

```text
Show:
Overnight shifts are not supported in the current configuration.
```

Do not calculate negative hours.

---

# 69. Working Schedule API

Recommended:

```text
GET    /api/working-schedules
POST   /api/working-schedules
GET    /api/working-schedules/{id}
PUT    /api/working-schedules/{id}
PATCH  /api/working-schedules/{id}
DELETE /api/working-schedules/{id}
```

Optional:

```text
PATCH /api/working-schedules/{id}/status
```

---

# 70. Schedule List API

Example:

```http
GET /api/working-schedules
```

Supported filters:

```text
search
status
company_id
days_per_week
hours_per_week
page
limit
sort
```

---

# 71. Schedule Detail API

Example:

```http
GET /api/working-schedules/{id}
```

Example response:

```json
{
  "id": 1,
  "name": "40 Hours / Week",
  "company_id": 1,
  "timezone": "Asia/Kolkata",
  "status": "active",
  "days_per_week": 5,
  "hours_per_week": 40,
  "lines": [
    {
      "day_of_week": "monday",
      "start_time": "09:00",
      "end_time": "18:00",
      "break_minutes": 60,
      "daily_hours": 8
    }
  ]
}
```

The exact API schema can be adapted.

---

# 72. Create Schedule API

Example:

```http
POST /api/working-schedules
```

Request:

```json
{
  "name": "40 Hours / Week",
  "company_id": 1,
  "timezone": "Asia/Kolkata",
  "lines": [
    {
      "day_of_week": "monday",
      "start_time": "09:00",
      "end_time": "18:00",
      "break_minutes": 60
    },
    {
      "day_of_week": "tuesday",
      "start_time": "09:00",
      "end_time": "18:00",
      "break_minutes": 60
    }
  ]
}
```

The backend calculates:

```text
daily_hours
days_per_week
hours_per_week
```

---

# 73. Backend Calculation

Do not trust:

```json
{
  "daily_hours": 8,
  "hours_per_week": 40
}
```

from the frontend.

The backend must calculate these values from:

```text
start_time
end_time
break_minutes
```

and schedule lines.

---

# 74. Schedule Service

Recommended backend:

```text
backend/
└── app/
    └── working_schedules/
        ├── models.py
        ├── schemas.py
        ├── router.py
        ├── service.py
        └── repository.py
```

---

# 75. Schedule Service Responsibilities

The service should handle:

* Create schedule.
* Update schedule.
* Retrieve schedule.
* Search schedule.
* Filter schedule.
* Calculate daily hours.
* Calculate weekly hours.
* Calculate days/week.
* Validate rows.
* Validate duplicate days.
* Validate timezone.
* Activate/deactivate schedule.
* Prevent deletion of referenced schedules.

---

# 76. Daily Hours Utility

Create reusable calculation logic.

Conceptually:

```python
calculate_daily_hours(
    start_time,
    end_time,
    break_minutes
)
```

Return:

```text
daily_hours
```

The same logic should be reused wherever schedule hours are required.

---

# 77. Weekly Hours Utility

Create reusable calculation logic:

```python
calculate_weekly_hours(schedule_lines)
```

Return:

```text
total_hours
```

Do not duplicate weekly calculation logic in:

* Frontend.
* Contract.
* Attendance.
* Payroll.

The backend schedule service should be the authoritative implementation.

---

# 78. Days/Week Utility

Conceptually:

```python
calculate_days_per_week(schedule_lines)
```

Return:

```text
number of unique configured days
```

---

# 79. Schedule API Security

Every endpoint must enforce:

1. Authentication.
2. Role/permission.
3. Business validation.

Employees should not be allowed to modify working schedules.

---

# 80. Permissions

Follow:

```text
01_LOGIN_RBAC_USER_MANAGEMENT.md
```

### Employee

* May view their applicable schedule where allowed.
* Cannot create/edit schedules.

### HR Manager

* Can view schedules.
* Can create schedules.
* Can edit schedules.
* Can activate/deactivate schedules.

### HR Payroll User

* Can access schedules according to HR permissions.

### HR Payroll Manager

* Full schedule management.

### Admin

* Full access.

---

# 81. Employee Schedule Visibility

Employees may need to see:

```text
Working Schedule:
40 Hours / Week

Monday-Friday
09:00-18:00
1 hour break
```

This is useful for understanding expected working time.

However, employee access must remain read-only.

---

# 82. Schedule Assignment Security

Employees must not be able to change their own working schedule unless the business explicitly allows it.

Example malicious request:

```http
PUT /api/employees/1
```

with:

```json
{
  "working_schedule_id": 999
}
```

must be rejected for an Employee role.

---

# 83. Contract Assignment Security

Similarly, Employees cannot assign schedules to their own contracts.

HR permissions are required.

---

# 84. Active Schedule Selection

When creating a new Contract:

```text
Working Schedule:
[ 40 Hours / Week ▼ ]
```

only valid selectable schedules should appear.

Normally:

```text
status = active
```

schedules should be selectable.

Inactive schedules should generally not be selectable for new active contracts.

---

# 85. Historical Inactive Schedule

If a historical contract references an inactive schedule:

```text
Contract 2025
Schedule = Old Schedule
Status = Inactive
```

the contract must continue to display the relationship.

Do not break historical data.

---

# 86. Schedule Deletion Protection

If a schedule is referenced by:

```text
Contract
Employee
Attendance context
Payroll history
```

do not physically delete it without a safe dependency strategy.

Prefer:

```text
Inactive
```

---

# 87. UI Validation

Show validation errors next to relevant fields.

Example:

```text
Monday

Start:
[18:00]

End:
[09:00]
       ^
End time must be after start time.
```

Do not show only a generic:

```text
Something went wrong.
```

---

# 88. Schedule Summary

The form should clearly display:

```text
Days / Week:
5

Hours / Week:
40

Total Weekly Hours:
40
```

If these are calculated fields, visually distinguish them as calculated/read-only.

---

# 89. Schedule Preview

Optional but recommended:

Display a compact weekly preview:

```text
Monday      09:00 - 18:00
Tuesday     09:00 - 18:00
Wednesday   09:00 - 18:00
Thursday    09:00 - 18:00
Friday      09:00 - 18:00
Saturday    Off
Sunday      Off
```

This makes the schedule easy to understand during the hackathon demo.

---

# 90. Schedule Form UX

When a user adds a row:

```text
[ + Add Day ]
```

provide:

```text
Day
Start
End
Break
```

Then calculate:

```text
Hours
```

immediately.

Example:

```text
Friday
09:00
18:00
01:00
8.0
```

---

# 91. Row Editing

Users with permission can modify:

```text
Day
Start
End
Break
```

The system automatically updates:

```text
Hours
Days / Week
Hours / Week
```

---

# 92. Row Removal

When removing Friday:

Before:

```text
5 days
40 hours
```

After:

```text
4 days
32 hours
```

assuming all days are 8 hours.

The summary must update immediately.

---

# 93. Schedule Status Change

Example:

```text
Active
  |
  v
[Deactivate]
  |
  v
Inactive
```

Existing contract relationships remain intact.

---

# 94. Schedule Reactivation

Example:

```text
Inactive
   |
   v
[Activate]
   |
   v
Validation
   |
   v
Active
```

If the schedule configuration is invalid, activation must fail.

---

# 95. Schedule Naming

Schedule names should be unique within the appropriate company context where practical.

Example:

```text
PeoplePay360
    |
    +-- 40 Hours / Week
```

Avoid duplicate schedules with identical definitions unless there is a business reason.

---

# 96. Duplicate Schedule Warning

If a user creates:

```text
40 Hours / Week
```

when an identical active schedule already exists, optionally warn:

```text
A similar working schedule already exists.
```

Do not block legitimate schedules solely because their hours happen to match.

---

# 97. Database Constraints

Recommended:

```text
working_schedules.id PRIMARY KEY

working_schedule_lines.id PRIMARY KEY

working_schedule_lines.working_schedule_id
    -> working_schedules.id
```

Additional validation:

```text
break_minutes >= 0
daily_hours > 0
```

and valid day values.

---

# 98. Unique Day Constraint

A schedule should have only one row per weekday.

Conceptually:

```text
UNIQUE(
    working_schedule_id,
    day_of_week
)
```

This should be enforced where practical.

---

# 99. Schedule Line Ordering

Use:

```text
sequence
```

or a deterministic weekday order.

Recommended order:

```text
Monday
Tuesday
Wednesday
Thursday
Friday
Saturday
Sunday
```

---

# 100. Performance

Working Schedules are master data and should remain lightweight.

Use efficient queries.

Recommended indexes:

```text
working_schedules.company_id
working_schedules.status
working_schedule_lines.working_schedule_id
working_schedule_lines.day_of_week
```

---

# 101. Testing — List View

Test:

```text
1. Schedule list loads.
2. Required columns appear.
3. Search works.
4. Status filter works.
5. Company filter works.
6. Sorting works.
7. New button works for authorized users.
```

---

# 102. Testing — Create Schedule

Create:

```text
40 Hours / Week
```

with:

```text
Monday-Friday
09:00-18:00
1 hour break
```

Expected:

```text
Days / Week = 5
Hours / Week = 40
```

---

# 103. Testing — Daily Calculation

Input:

```text
09:00
18:00
60-minute break
```

Expected:

```text
8 hours
```

---

# 104. Testing — Weekly Calculation

Rows:

```text
Monday      8
Tuesday     8
Wednesday   8
Thursday    8
Friday      8
```

Expected:

```text
40 hours
```

---

# 105. Testing — Remove Day

Remove Friday.

Expected:

```text
Days / Week = 4
Hours / Week = 32
```

assuming all days are 8 hours.

---

# 106. Testing — Duplicate Day

Add:

```text
Monday
Monday
```

Expected:

```text
Validation error:
A working day cannot be configured more than once.
```

---

# 107. Testing — Invalid Time

Input:

```text
Start = 18:00
End = 09:00
```

Expected:

```text
Validation error.
```

unless overnight support is explicitly enabled.

---

# 108. Testing — Invalid Break

Input:

```text
Start = 09:00
End = 18:00
Break = 10 hours
```

Expected:

```text
Validation error.
```

---

# 109. Testing — Negative Break

Input:

```text
Break = -30 minutes
```

Expected:

```text
Validation error.
```

---

# 110. Testing — Empty Schedule

Create schedule with no rows.

Expected:

```text
Schedule cannot be activated without a working day.
```

---

# 111. Testing — Timezone

Input:

```text
Timezone = Asia/Kolkata
```

Expected:

```text
Schedule saves successfully.
```

Invalid timezone:

```text
ABC/XYZ
```

Expected:

```text
Validation error.
```

---

# 112. Testing — Overnight Shift

If overnight support exists:

```text
22:00 → 06:00
```

Expected:

```text
8 hours
```

If overnight support does not exist:

```text
Validation error:
Overnight schedules are not supported.
```

Do not accept and calculate incorrectly.

---

# 113. Testing — Contract Integration

Create:

```text
40 Hours / Week
```

Assign to a contract.

Verify:

```text
Contract → Working Schedule
```

is correctly stored.

---

# 114. Testing — Historical Schedule

Create:

```text
Contract 2025
Schedule = 40 Hours / Week
```

Deactivate schedule.

Verify:

```text
Contract 2025
still displays
40 Hours / Week
```

Historical relationship must remain valid.

---

# 115. Testing — Employee Access

Employee should be able to view their applicable schedule if allowed.

Employee must NOT be able to:

```text
Create Schedule
Edit Schedule
Delete Schedule
Activate Schedule
Deactivate Schedule
```

---

# 116. Testing — HR Manager

HR Manager should be able to:

```text
Read
Create
Update
Activate
Deactivate
```

working schedules.

---

# 117. Testing — Payroll User

HR Payroll User should receive the permissions defined by RBAC.

Do not accidentally grant salary-configuration privileges merely because this module is related to payroll.

---

# 118. Testing — Payroll Manager

HR Payroll Manager should have full working-schedule management.

---

# 119. Testing — Admin

Admin should have full access.

---

# 120. Testing — API Security

Test:

```text
No token
Invalid token
Employee role
HR Manager role
HR Payroll User role
HR Payroll Manager role
Admin role
```

against protected schedule endpoints.

---

# 121. Testing — Backend Calculation

Send manipulated frontend values:

```json
{
  "daily_hours": 100,
  "hours_per_week": 500
}
```

with legitimate schedule lines.

Backend must ignore/recalculate these summary values.

Expected result must be based on actual:

```text
Start
End
Break
```

values.

---

# 122. Testing — Historical Integrity

Deactivate a schedule used by a contract.

Verify:

```text
Contract remains valid.
Historical relationship remains available.
Payroll history remains available.
```

---

# 123. Testing — Schedule Deletion

Attempt to delete a schedule referenced by a contract.

Expected behavior:

```text
Deletion blocked
```

or:

```text
Schedule archived/deactivated
```

Do not create broken foreign-key relationships.

---

# 124. Suggested Frontend Structure

```text
src/
└── modules/
    └── workingSchedules/
        ├── pages/
        │   ├── WorkingScheduleListPage.jsx
        │   └── WorkingScheduleFormPage.jsx
        │
        ├── components/
        │   ├── WorkingScheduleList.jsx
        │   ├── WorkingScheduleForm.jsx
        │   ├── ScheduleLineEditor.jsx
        │   ├── ScheduleSummary.jsx
        │   └── ScheduleStatusBadge.jsx
        │
        ├── services/
        │   └── workingScheduleService.js
        │
        └── hooks/
            └── useWorkingSchedules.js
```

Adapt to the existing project architecture if necessary.

---

# 125. Suggested Backend Structure

```text
backend/
└── app/
    └── working_schedules/
        ├── models.py
        ├── schemas.py
        ├── router.py
        ├── service.py
        └── repository.py
```

---

# 126. Separation of Responsibilities

Working Schedule owns:

```text
Schedule definition
Working days
Start/end times
Breaks
Daily hours
Weekly hours
Timezone
Schedule status
```

It does NOT own:

```text
Employee identity
Contract wage
Salary rules
Attendance records
Time-off requests
Payslip calculations
```

---

# 127. Working Schedule ↔ Employee Boundary

Employee:

```text
Who is the employee?
```

Working Schedule:

```text
What is the employee expected to work?
```

Keep these responsibilities separate.

---

# 128. Working Schedule ↔ Contract Boundary

Contract:

```text
Which schedule applies to this employment period?
```

Working Schedule:

```text
What does that schedule mean?
```

This distinction is important for historical contract data.

---

# 129. Working Schedule ↔ Attendance Boundary

Working Schedule:

```text
Expected time
```

Attendance:

```text
Actual time
```

Example:

```text
Expected:
8 hours

Actual:
7.5 hours
```

The Attendance module determines actual worked hours.

---

# 130. Working Schedule ↔ Payroll Boundary

Payroll can use:

```text
Expected working days
Expected working hours
```

to calculate payroll context.

Salary calculation remains in:

```text
Salary Rules
```

and:

```text
Payroll Engine
```

---

# 131. Working Schedule ↔ Time Off Boundary

Time Off may affect payroll/worked-day calculations.

Working Schedule defines what would normally be a working day.

Time Off defines approved absence.

Do not implement leave approval inside Working Schedule.

---

# 132. Seed Data

Create these reference schedules:

```text
40 Hours / Week
Night Shift
Retail Weekend
Flexible Hybrid
Part-time 20h
```

Use consistent demo data across:

* Employees
* Contracts
* Attendance
* Payroll

---

# 133. Seed Data — 40 Hours / Week

```text
Name:
40 Hours / Week

Company:
PeoplePay360

Timezone:
Asia/Kolkata

Monday:
09:00-18:00
Break: 60 minutes
Hours: 8

Tuesday:
09:00-18:00
Break: 60 minutes
Hours: 8

Wednesday:
09:00-18:00
Break: 60 minutes
Hours: 8

Thursday:
09:00-18:00
Break: 60 minutes
Hours: 8

Friday:
09:00-18:00
Break: 60 minutes
Hours: 8

Days:
5

Hours:
40
```

---

# 134. Demo Flow

During the hackathon:

```text
Employees
    |
    v
Aarav Mehta
    |
    v
Employee Form
    |
    v
Working Schedule
    |
    v
40 Hours / Week
```

Show:

```text
Monday-Friday
09:00-18:00
1 hour break
8 hours/day
40 hours/week
```

This visually demonstrates how the employee's expected working time is defined.

---

# 135. Payroll Demo Connection

Use:

```text
Aarav Mehta
    |
    v
Contract
    |
    v
40 Hours / Week
    |
    v
Attendance
    |
    v
Worked Hours
    |
    v
Payrun
    |
    v
Payslip
```

This demonstrates the integration between master data and payroll.

---

# 136. Critical Business Rules Summary

```text
RULE 1
A Working Schedule has one or more working-day rows.

RULE 2
A working day contains Day, Start, End, and Break.

RULE 3
Daily Hours are calculated automatically.

RULE 4
Days / Week is calculated from unique working-day rows.

RULE 5
Hours / Week is calculated from daily hours.

RULE 6
Duplicate working days are not allowed.

RULE 7
Break duration cannot be negative.

RULE 8
Break duration cannot exceed the shift duration.

RULE 9
Normal same-day schedules require End > Start.

RULE 10
Overnight schedules require explicit overnight support.

RULE 11
Frontend calculations are not trusted by backend.

RULE 12
Backend recalculates daily and weekly hours.

RULE 13
An active schedule must have valid working days.

RULE 14
Inactive schedules remain available for historical references.

RULE 15
Referenced schedules must not be casually deleted.

RULE 16
Contract references the schedule applicable to its employment period.

RULE 17
Historical contract/schedule relationships must remain intact.

RULE 18
Working Schedule does not own salary-rule calculations.

RULE 19
Working Schedule does not own attendance records.

RULE 20
Working Schedule does not own time-off approval.

RULE 21
Employee cannot modify schedules.

RULE 22
HR roles can manage schedules according to RBAC.

RULE 23
Timezone must be valid.

RULE 24
Schedule calculations must be consistent across frontend and backend.

RULE 25
Schedule data must be reusable by Attendance and Payroll.
```

---

# 137. Definition of Done

The Working Schedules module is complete only when:

* [ ] Working Schedule List exists.
* [ ] Working Schedule Form exists.
* [ ] New Schedule works.
* [ ] Schedule search works.
* [ ] Schedule filters work.
* [ ] Schedule sorting works.
* [ ] Schedule Name exists.
* [ ] Company exists.
* [ ] Timezone exists.
* [ ] Status exists.
* [ ] Days / Week exists.
* [ ] Hours / Week exists.
* [ ] Weekly Schedule rows exist.
* [ ] Day field works.
* [ ] Start time works.
* [ ] End time works.
* [ ] Break duration works.
* [ ] Daily Hours calculate automatically.
* [ ] Total Weekly Hours calculate automatically.
* [ ] Days / Week calculates automatically.
* [ ] Add Day works.
* [ ] Remove Day works.
* [ ] Duplicate day validation works.
* [ ] Invalid time validation works.
* [ ] Break validation works.
* [ ] Empty schedule validation works.
* [ ] Timezone validation works.
* [ ] Overnight behavior is explicitly handled.
* [ ] Schedule activation works.
* [ ] Schedule deactivation works.
* [ ] Historical schedules remain available.
* [ ] Referenced schedules cannot be casually deleted.
* [ ] Contract integration works.
* [ ] Employee schedule visibility works where permitted.
* [ ] Attendance integration is possible.
* [ ] Payroll integration is possible.
* [ ] RBAC is enforced.
* [ ] Backend recalculates schedule hours.
* [ ] Frontend does not control authoritative calculated values.
* [ ] API endpoints are protected.
* [ ] Database relationships are valid.
* [ ] Appropriate indexes exist.
* [ ] Loading states work.
* [ ] Empty states work.
* [ ] Error handling works.
* [ ] Odoo-style UI is followed.
* [ ] Automated tests pass.

---

# 138. AI CODING AGENT INSTRUCTIONS

Before implementing this module:

1. Read `00_MASTER.md`.
2. Read `01_LOGIN_RBAC_USER_MANAGEMENT.md`.
3. Read `02_EMPLOYEE_MASTER.md`.
4. Read `03_CONTRACT_MANAGEMENT.md`.

Then implement Working Schedules.

## MUST

* Treat Working Schedule as reusable master data.
* Implement schedule lines.
* Implement Day/Start/End/Break.
* Calculate Daily Hours automatically.
* Calculate Days / Week automatically.
* Calculate Hours / Week automatically.
* Recalculate on row changes.
* Recalculate on backend before saving.
* Validate duplicate days.
* Validate start/end times.
* Validate break duration.
* Handle timezone consistently.
* Explicitly handle overnight shifts.
* Integrate schedules with Contracts.
* Preserve historical schedule references.
* Protect APIs with RBAC.
* Follow the Odoo-style UX.
* Use PostgreSQL relationships.
* Write automated tests.

## MUST NOT

* Store the entire weekly schedule as an unstructured text field.
* Trust frontend-calculated hours.
* Allow duplicate weekdays.
* Allow negative breaks.
* Allow invalid shift durations.
* Silently calculate overnight shifts incorrectly.
* Delete schedules used by historical contracts.
* Put attendance records inside Working Schedule.
* Put salary calculations inside Working Schedule.
* Put leave approval logic inside Working Schedule.
* Allow Employees to edit schedules.
* Hardcode weekly hours.
* Hardcode Monday-Friday assumptions into the calculation engine.
* Create unrelated UI patterns.

---

# 139. Final Expected Architecture

The final architecture should be:

```
                     WORKING SCHEDULE
                            |
             +--------------+--------------+
             |              |              |
             v              v              v
          COMPANY       SCHEDULE LINES   TIMEZONE
                            |
          +-----------------+-----------------+
          |        |        |        |        |
          v        v        v        v        v
        DAY      START      END     BREAK    HOURS
                                              |
                                              v
                                     WEEKLY TOTAL
                                              |
                                              v
                                          CONTRACT
                                              |
                                              v
                                         EMPLOYEE
                                              |
                        +---------------------+------------------+
                        |                                        |
                        v                                        v
                   ATTENDANCE                                  PAYROLL
                        |                                        |
                        v                                        v
                  Actual Hours                              Payslip Context
```

The Working Schedule is therefore the **expected-working-time definition** that connects employee employment terms with attendance and payroll processing.

# END OF 04_WORKING_SCHEDULES.md

```
```
