# `03_CONTRACT_MANAGEMENT.md`

```markdown
# 03_CONTRACT_MANAGEMENT.md

# PeoplePay360 — Contract Management

## 1. Module Overview

The Contract Management module manages employee employment contracts and preserves contract history.

A contract connects:

Employee
    |
    +-- Contract
          |
          +-- Start Date
          +-- End Date
          +-- Status
          +-- Department
          +-- Job Position
          +-- Wage / Month
          +-- Working Schedule
          +-- Salary Structure
          +-- Notes
```

Contracts are a critical part of PeoplePay360 because payroll must determine **which contract applies to the selected payroll period**.

The system must NOT simply use the employee's latest contract.

The applicable contract must be determined using the payroll period and contract dates.

---

# 2. Contract Module Goals

The Contract module must allow authorized HR/payroll users to:

* View contracts.
* Create contracts.
* Edit contracts.
* View contract history.
* Search contracts.
* Filter contracts.
* Sort contracts.
* View contract status.
* Associate contracts with employees.
* Define contract start/end dates.
* Define monthly wage.
* Assign working schedule.
* Assign salary structure.
* Associate department.
* Associate job position.
* Preserve historical contracts.
* Detect overlapping contracts.
* Prevent invalid concurrent contracts.
* Identify the contract applicable to a payroll period.

---

# 3. Why Contracts Are Separate From Employees

Do NOT store only one salary/wage value directly on the Employee record.

Example:

```text
Employee: Aarav Mehta

Contract 1
Jan 2025 - Dec 2025
Wage: ₹50,000

Contract 2
Jan 2026 - Current
Wage: ₹60,000
```

The employee's current wage may be ₹60,000, but historical payroll for 2025 must continue to use the applicable 2025 contract.

Therefore:

```text
Employee
    |
    +-- Contract History
          |
          +-- Historical Contract
          +-- Current Contract
          +-- Future Contract
```

---

# 4. Contract Navigation

Main navigation:

```text
Employees
Contracts
Attendance
Time Off
Payroll
Reports
```

Clicking:

```text
Contracts
```

opens the Contract List view.

Recommended routes:

```text
/contracts
/contracts/new
/contracts/:id
```

---

# 5. Contract List View

The Contract List view must follow the Odoo-style ERP design from the reference.

Required columns:

| Column       | Description              |
| ------------ | ------------------------ |
| Contract     | Contract name/identifier |
| Employee     | Linked employee          |
| Start        | Contract start date      |
| End          | Contract end date        |
| Wage / Month | Monthly wage             |
| Status       | Contract status          |

Example:

```text
-----------------------------------------------------------------------
Contract        Employee        Start       End         Wage       Status
-----------------------------------------------------------------------
Aarav-2025      Aarav Mehta     01/01/25    31/12/25    ₹50,000    Expired
Aarav-2026      Aarav Mehta     01/01/26    —           ₹60,000    Running
Sara-2026       Sara Khan       01/01/26    —           ₹80,000    Running
-----------------------------------------------------------------------
```

---

# 6. Contract List Toolbar

Provide:

```text
Contracts

[ Search... ] [ Filters ] [ Sort ]

                                      [ New ]
```

The implementation may include:

```text
[ Search ]
[ Filters ]
[ Group By ]
```

if useful.

Keep the toolbar visually consistent with the Employee module.

---

# 7. Contract Search

Search should support useful contract information:

* Contract name/identifier.
* Employee name.
* Department.
* Job position.
* Status.

Example:

```text
Search:
Aarav
```

should return Aarav's contracts.

Search must be case-insensitive.

---

# 8. Contract Filters

Recommended filters:

```text
Status
Employee
Department
Job Position
Salary Structure
Working Schedule
Start Date
End Date
```

At minimum:

```text
Status
Employee
```

must be available.

---

# 9. Contract Status

The system should support contract lifecycle status.

Recommended internal values:

```text
draft
running
expired
cancelled
```

The exact status set can be adapted to the final implementation, but the system must at minimum distinguish:

```text
Running
Expired
```

The reference design explicitly uses contract status.

---

# 10. Contract Status Meaning

## Draft

Contract is created but not yet active.

## Running

Contract is currently applicable/active for its defined period.

## Expired

Contract end date has passed.

## Cancelled

Contract has been terminated/cancelled before its normal end date where applicable.

---

# 11. Status Should Be Derived Carefully

Do not blindly trust manually entered status when it conflicts with dates.

For example:

```text
Start Date: 01/01/2025
End Date: 31/12/2025
Current Date: 2026
```

The contract should not appear as Running merely because a stale status value says `running`.

Contract status should be validated/derived consistently from:

* Start date.
* End date.
* Cancellation state.
* Business workflow.

---

# 12. Contract Form

The Contract Form must contain:

```text
Employee
Start Date
End Date
Status
Department
Job Position
Wage / Month
Working Schedule
Salary Structure
Notes
```

Recommended layout:

```text
--------------------------------------------------
Contract
--------------------------------------------------

Employee            [ Aarav Mehta ]

Start Date          [ 01/01/2026 ]
End Date            [ 31/12/2026 ]

Status              [ Running ]

Department          [ Engineering ]
Job Position        [ Software Developer ]

Wage / Month        [ ₹60,000 ]

Working Schedule    [ 40 Hours / Week ]

Salary Structure    [ Monthly Standard ]

Notes
--------------------------------------------------
[                                  ]
[                                  ]
--------------------------------------------------

                    [ Save ] [ Cancel ]
--------------------------------------------------
```

---

# 13. Contract Name / Identifier

Each contract should have a readable identifier.

Example:

```text
Aarav Mehta - 2026
```

or:

```text
CNT-00001
```

The exact naming convention can be chosen during implementation.

Recommended:

```text
CNT-00001
CNT-00002
CNT-00003
```

with employee and dates shown separately.

The identifier must be unique.

---

# 14. Contract Database Model

Recommended table:

```text
contracts
---------
id
contract_number
employee_id
start_date
end_date
status
department_id
job_position_id
monthly_wage
working_schedule_id
salary_structure_id
notes
created_at
updated_at
```

Additional audit fields may be added if required.

---

# 15. Employee Relationship

Every contract must belong to an employee.

```text
Contract
    |
    +-- employee_id
            |
            v
        Employee
```

Employee is required.

Do not create an orphan contract.

---

# 16. Employee Selection

Contract Form:

```text
Employee:
[ Select Employee ▼ ]
```

Only valid employee records may be selected.

Inactive employees should normally not be selected for new active contracts unless the business workflow explicitly permits it.

Historical contracts belonging to inactive employees must remain accessible.

---

# 17. Start Date

Field:

```text
start_date
```

Required:

```text
Yes
```

Start date defines the beginning of the contract applicability period.

Example:

```text
01/01/2026
```

---

# 18. End Date

Field:

```text
end_date
```

Optional for open-ended contracts if the implementation supports them.

If provided:

```text
end_date >= start_date
```

must be true.

Invalid:

```text
Start Date: 01/06/2026
End Date: 01/05/2026
```

must be rejected.

---

# 19. Open-Ended Contract

If open-ended contracts are supported:

```text
End Date = NULL
```

means the contract has no predefined end date.

Example:

```text
Start: 01/01/2026
End: —
```

Such a contract can remain Running until replaced, expired by business action, or cancelled.

---

# 20. Contract Date Interval

Treat contract dates as an applicability interval.

Conceptually:

```text
[start_date, end_date]
```

If there is no end date:

```text
[start_date, infinity]
```

This interval is critical to payroll period matching.

---

# 21. Contract Applicability

A contract is applicable to a payroll period when the contract overlaps the payroll period according to the payroll business rule.

For a payroll period:

```text
Period Start = P_START
Period End   = P_END
```

A contract:

```text
Contract Start = C_START
Contract End   = C_END
```

is relevant when the periods overlap.

Conceptually:

```text
C_START <= P_END
AND
(C_END IS NULL OR C_END >= P_START)
```

The exact payroll calculation behavior for partial periods is handled by the Payroll module.

---

# 22. Important Payroll Rule

NEVER select a contract using:

```text
ORDER BY created_at DESC
LIMIT 1
```

alone.

This is incorrect.

Example:

```text
Contract A
2025
₹50,000

Contract B
2026
₹60,000
```

If payroll is being processed for 2025, Contract A must be selected even though Contract B was created later.

---

# 23. Contract Selection by Payroll Period

For every payslip/payrun:

```text
Employee
+
Payroll Period
        |
        v
Find applicable contracts
        |
        v
Validate result
        |
        +-- 0 contracts --> Warning/Error
        |
        +-- 1 contract --> Use contract
        |
        +-- Multiple --> Conflict warning/error
```

This rule is critical.

---

# 24. Concurrent Contract Rule

An employee must not have two overlapping Running contracts for the same period unless the business explicitly supports such a configuration.

Default PeoplePay360 behavior:

```text
ONE employee
+
ONE payroll period
+
ONE applicable running contract
```

If multiple contracts overlap:

```text
Payroll Warning:
Multiple applicable contracts found.
```

The payroll engine must not silently choose one.

---

# 25. Contract Overlap Detection

When creating or activating a contract, check existing contracts for the same employee.

Conceptual overlap:

```text
New Start <= Existing End
AND
New End >= Existing Start
```

For open-ended contracts:

```text
NULL end date
```

must be treated as extending indefinitely.

---

# 26. Example — Invalid Overlap

Existing:

```text
Aarav Contract A
01/01/2026 → 31/12/2026
```

New:

```text
Aarav Contract B
01/07/2026 → 30/06/2027
```

These overlap.

The system must warn/reject activation.

Example:

```text
Cannot activate contract.

This employee already has another running contract
that overlaps the selected contract period.
```

---

# 27. Example — Valid Sequential Contracts

Contract A:

```text
01/01/2025 → 31/12/2025
```

Contract B:

```text
01/01/2026 → 31/12/2026
```

These are sequential and do not overlap.

This configuration is valid.

---

# 28. Example — Future Contract

Current:

```text
01/01/2026 → 31/12/2026
```

Future:

```text
01/01/2027 → 31/12/2027
```

Future contracts may be created if supported.

They should not be treated as currently Running before their start date.

---

# 29. Contract History

Employee history must show all relevant contracts.

Example:

```text
Aarav Mehta

Contracts

2024
₹45,000
Expired

2025
₹50,000
Expired

2026
₹60,000
Running
```

Never replace old contracts with new ones.

---

# 30. Contract History From Employee Form

The Employee Form must provide:

```text
[ Contracts 3 ]
```

Clicking it should open:

```text
Contracts
Employee = Aarav Mehta
```

with all historical/current contracts visible.

---

# 31. Department

Field:

```text
department_id
```

Contract should retain the department applicable to that contract.

This is important because an employee can move between departments.

Example:

```text
2025 Contract
Department = Engineering

2026 Contract
Department = Product
```

Historical contract information must remain unchanged.

---

# 32. Job Position

Field:

```text
job_position_id
```

or a consistent Job Position field if the project does not use a separate master.

The contract should preserve the job position associated with that employment period.

---

# 33. Wage / Month

Field:

```text
monthly_wage
```

Type:

```text
Decimal / Numeric
```

Required for payroll-enabled contracts.

Example:

```text
₹60,000
```

---

# 34. Wage Validation

Monthly wage must:

* Be numeric.
* Not be negative.
* Use appropriate monetary precision.

Invalid:

```text
-50000
```

must be rejected.

Zero wage should only be allowed if explicitly supported by business rules.

---

# 35. Wage and Employee

Do NOT store the contract wage only on Employee.

Correct:

```text
Employee
    |
    +-- Contract 2025
    |       Wage = 50,000
    |
    +-- Contract 2026
            Wage = 60,000
```

This preserves salary history.

---

# 36. Working Schedule

Field:

```text
working_schedule_id
```

The contract can specify the working schedule applicable during the contract period.

Example:

```text
Working Schedule:
40 Hours / Week
```

This connects Contract to:

```text
04_WORKING_SCHEDULES.md
```

---

# 37. Salary Structure

Field:

```text
salary_structure_id
```

The contract should identify the salary structure applicable to payroll.

Example:

```text
Salary Structure:
Monthly Standard
```

This connects Contract to:

```text
07_SALARY_STRUCTURES.md
08_SALARY_RULES_ENGINE.md
```

---

# 38. Notes

Field:

```text
notes
```

Use for contract-specific information.

Examples:

```text
Promotion effective January 2026.
Annual salary revision.
New employment agreement.
```

Do not store critical structured business data only inside notes.

---

# 39. Contract Form Smart Information

The Contract Form should clearly show:

```text
Employee
Contract Period
Status
Wage
Department
Job Position
Working Schedule
Salary Structure
```

The user should understand the contract without navigating elsewhere.

---

# 40. Contract → Employee Navigation

The contract should allow the user to navigate back to the Employee.

Example:

```text
Contract
    |
    +-- Employee: Aarav Mehta
                         |
                         v
                  Employee Form
```

---

# 41. Contract List Filters

Recommended quick filters:

```text
Running
Expired
Draft
Cancelled
```

Additional filters:

```text
Employee
Department
Salary Structure
Working Schedule
Start Date
End Date
```

---

# 42. Running Contracts Filter

A Running filter should return contracts currently applicable according to the application's date/status logic.

Do not simply filter a text value if status is derived.

---

# 43. Expired Contracts Filter

Expired contracts should remain visible.

Example:

```text
Filters
    |
    +-- Expired
```

This is essential for HR history.

---

# 44. Contract Sorting

Support sorting by:

```text
Contract
Employee
Start Date
End Date
Wage / Month
Status
```

Useful default:

```text
Start Date descending
```

or another UX-friendly ordering.

---

# 45. Contract Search Example

Search:

```text
Aarav
```

returns:

```text
Aarav-2025
Aarav-2026
```

Search:

```text
Engineering
```

returns contracts associated with Engineering where supported.

---

# 46. Create Contract Workflow

```text
Contracts
    |
    v
[New]
    |
    v
Contract Form
    |
    v
Select Employee
    |
    v
Enter Contract Dates
    |
    v
Enter Wage
    |
    v
Select Schedule
    |
    v
Select Salary Structure
    |
    v
Validate
    |
    v
Save
```

---

# 47. Contract Validation Before Save

Validate:

```text
Employee exists
Start date exists
End date valid
Wage valid
Department valid
Job Position valid
Working Schedule valid
Salary Structure valid
```

Also check contract overlap.

---

# 48. Contract Activation

If status workflow includes Draft → Running:

```text
Draft
  |
  v
Validation
  |
  +-- Conflict --> Reject
  |
  +-- Valid ----> Running
```

Activation must trigger overlap checks.

---

# 49. Contract Cancellation

If cancellation is supported:

```text
Running
   |
   v
Cancel
   |
   v
Cancelled
```

Cancellation must not delete the contract.

Historical information must remain.

---

# 50. Contract Expiration

A contract can become Expired when its end date passes.

Example:

```text
End Date:
31/12/2025

Current Date:
01/01/2026

Status:
Expired
```

The expired contract remains available for historical payroll.

---

# 51. Historical Contract Protection

Once a contract has been used by a finalized payroll/payslip:

Do not casually modify critical values such as:

* Wage
* Salary Structure
* Dates
* Department
* Job Position

without an appropriate business/audit strategy.

At minimum, finalized payroll results must remain historically accurate.

---

# 52. Payroll Snapshot Principle

When a payslip is finalized, the resulting payroll information must remain stable even if the current contract later changes.

Example:

```text
January Payslip
Wage = ₹50,000
```

Later:

```text
Contract Wage changed to ₹60,000
```

January's finalized payslip must NOT automatically become ₹60,000.

The finalized payslip is a historical payroll result.

---

# 53. Contract and Salary Structure

A contract references a Salary Structure.

Example:

```text
Contract
    |
    +-- Salary Structure: Monthly Standard
                    |
                    +-- BASIC
                    +-- HRA
                    +-- BONUS
                    +-- PF
                    +-- PT
                    +-- NET
```

The actual salary-rule computation belongs to the Salary Rule Engine.

---

# 54. Contract and Working Schedule

A contract references a Working Schedule.

Example:

```text
Contract
    |
    +-- Working Schedule
             |
             +-- Monday
             +-- Tuesday
             +-- Wednesday
             +-- Thursday
             +-- Friday
```

The Working Schedule determines expected working hours.

Detailed functionality belongs to:

```text
04_WORKING_SCHEDULES.md
```

---

# 55. Contract and Attendance

Attendance is not stored inside Contract.

Instead:

```text
Employee
    |
    +-- Contract
    |
    +-- Attendance
```

Payroll can use:

```text
Contract
+
Working Schedule
+
Attendance
```

to determine payroll-related worked information.

---

# 56. Contract and Time Off

Time Off belongs to the Employee.

Contract information may be used as payroll/work context, but do not duplicate Time Off logic inside Contract.

---

# 57. Contract and Payrun

During Payrun processing:

```text
Payrun Period
      |
      v
Employee
      |
      v
Find Applicable Contract
      |
      v
Validate Contract
      |
      v
Use Wage + Salary Structure
      |
      v
Compute Payslip
```

This is one of the most important integrations in PeoplePay360.

---

# 58. Missing Contract Warning

If an eligible employee has no applicable contract for the payroll period:

```text
Payroll Warning

No applicable contract found for this employee
for the selected payroll period.
```

The payrun must not silently calculate payroll using arbitrary employee information.

---

# 59. Multiple Contract Warning

If multiple contracts overlap the payroll period:

```text
Payroll Warning

Multiple applicable contracts found for this employee.
Resolve the contract overlap before final payroll validation.
```

The system should not silently select one.

---

# 60. Contract Attention

The payroll system should be able to flag employees/contracts requiring attention.

Examples:

```text
Contract expires soon
No applicable contract
Overlapping contracts
Missing salary structure
Missing working schedule
```

This connects to payroll warning functionality.

---

# 61. Contract Expiring Soon

Optional warning:

```text
Contract expires in 15 days.
```

This can be useful on HR dashboards.

Do not build complex notification infrastructure unless needed for MVP.

---

# 62. Contract List Warning Indicator

If useful, display an indicator:

```text
⚠ Attention
```

for contracts requiring HR action.

Examples:

```text
Missing salary structure
Overlapping contract
Invalid date range
```

---

# 63. API Endpoints

Recommended:

```text
GET    /api/contracts
POST   /api/contracts
GET    /api/contracts/{id}
PUT    /api/contracts/{id}
PATCH  /api/contracts/{id}
DELETE /api/contracts/{id}
```

Optional workflow endpoints:

```text
POST /api/contracts/{id}/activate
POST /api/contracts/{id}/cancel
```

---

# 64. Contract List API

Example:

```http
GET /api/contracts
```

Supported parameters:

```text
search
employee_id
department_id
job_position_id
salary_structure_id
working_schedule_id
status
start_date
end_date
page
limit
sort
```

---

# 65. Contract Detail API

Example:

```http
GET /api/contracts/{id}
```

Example response:

```json
{
  "id": 1,
  "contract_number": "CNT-00001",
  "employee_id": 1,
  "employee_name": "Aarav Mehta",
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "status": "running",
  "department_id": 2,
  "job_position_id": 3,
  "monthly_wage": 60000,
  "working_schedule_id": 1,
  "salary_structure_id": 1,
  "notes": "Annual salary revision."
}
```

---

# 66. Create Contract API

Example:

```http
POST /api/contracts
```

Request:

```json
{
  "employee_id": 1,
  "start_date": "2026-01-01",
  "end_date": "2026-12-31",
  "department_id": 2,
  "job_position_id": 3,
  "monthly_wage": 60000,
  "working_schedule_id": 1,
  "salary_structure_id": 1,
  "notes": "Annual salary revision."
}
```

Backend must perform all validation.

---

# 67. Contract Overlap API Validation

The backend must check existing contracts before activation.

Do not rely on:

```text
Frontend warning
```

alone.

The backend must reject or flag invalid overlap.

---

# 68. Contract Permissions

Follow:

```text
01_LOGIN_RBAC_USER_MANAGEMENT.md
```

### Employee

Cannot create/edit contracts.

May view their own contract information where permitted.

### HR Manager

Can:

* Read contracts.
* Create contracts.
* Update contracts.
* Manage contract lifecycle.

### HR Payroll User

Can access contracts according to HR permissions.

### HR Payroll Manager

Full contract management.

### Admin

Full access.

---

# 69. Employee Contract Privacy

Employees may view their own contract information.

They must not be able to access another employee's contract through:

```text
/contracts/{id}
```

by manually changing the ID.

Backend ownership checks are required.

---

# 70. Contract API Security

Every endpoint must check:

1. Authentication.
2. Role/permission.
3. Resource ownership when required.
4. Employee relationship.
5. Business validation.

---

# 71. Contract Form Permissions

### Employee

Read-only own contract information where permitted.

### HR Manager

Create/Edit.

### HR Payroll User

Read/Edit according to HR permissions.

### HR Payroll Manager

Full management.

### Admin

Full management.

---

# 72. Contract UI State

Recommended actions:

```text
Draft:
[Edit] [Activate]

Running:
[Edit] [Cancel]

Expired:
[View]

Cancelled:
[View]
```

Do not show irrelevant actions.

---

# 73. Contract Confirmation

For important actions:

```text
Activate Contract?
```

and:

```text
Cancel Contract?
```

Use confirmation where accidental changes could affect payroll.

---

# 74. Contract Validation Messages

Use clear messages.

Examples:

```text
Employee is required.

Start date is required.

End date cannot be before start date.

Monthly wage cannot be negative.

Employee does not exist.

Department does not exist.

Working schedule does not exist.

Salary structure does not exist.

This employee already has an overlapping contract.

An active contract requires a salary structure.

An active contract requires a working schedule.
```

---

# 75. Contract Database Constraints

Recommended:

```text
contracts.id PRIMARY KEY

contracts.employee_id
    -> employees.id

contracts.department_id
    -> departments.id

contracts.working_schedule_id
    -> working_schedules.id

contracts.salary_structure_id
    -> salary_structures.id
```

Also:

```text
monthly_wage >= 0
```

and:

```text
end_date IS NULL OR end_date >= start_date
```

where supported by the database design.

---

# 76. Contract Number Uniqueness

If contract numbers are used:

```text
contract_number UNIQUE
```

Example:

```text
CNT-00001
CNT-00002
```

Never duplicate contract identifiers.

---

# 77. Contract Historical Integrity

Do not cascade-delete historical contracts when an employee is deactivated.

Example:

```text
Employee inactive
       |
       v
Contracts remain
       |
       v
Historical Payroll remains
```

---

# 78. Contract Deletion

Physical deletion should be restricted.

If the contract has been:

* Used by a payslip.
* Used by a payrun.
* Used historically.

prefer:

```text
Cancel
```

or:

```text
Deactivate/Archive
```

instead of deletion.

---

# 79. Contract Archive

Optional archive behavior:

```text
is_active
```

or status-based lifecycle.

Do not use archive to hide historical payroll information from authorized users.

---

# 80. Contract List Empty State

If there are no contracts:

```text
No contracts found.
```

If the user can create:

```text
[Create Contract]
```

---

# 81. Contract Search Empty State

If a search/filter produces no records:

```text
No contracts match your search.
```

Provide:

```text
[Clear Filters]
```

---

# 82. Contract Loading State

Display:

```text
Loading contracts...
```

while fetching data.

For form:

```text
Loading contract...
```

Avoid rendering incomplete data during loading.

---

# 83. Contract Error Handling

Examples:

```text
Unable to load contracts.

Unable to create contract.

Unable to update contract.

Contract not found.

You do not have permission to perform this action.

Unable to activate contract.

Contract overlaps with another active contract.
```

Do not expose internal database errors.

---

# 84. Contract UI Design

Follow the provided Odoo-style reference.

Use:

* ERP top navigation.
* Page title.
* Search bar.
* Filters.
* Table/list.
* New button.
* Form view.
* Dropdowns.
* Status badges.
* Compact business layout.
* Consistent spacing.
* Clear action buttons.

Do not introduce unrelated card-heavy consumer UI.

---

# 85. Contract List Visual Design

Recommended:

```text
--------------------------------------------------------------
Contracts                                      [New]
--------------------------------------------------------------

[ Search contracts... ] [ Filters ]

Contract      Employee       Start       End       Wage     Status
------------------------------------------------------------------
CNT-00001    Aarav Mehta    01/01/25    31/12/25  ₹50,000  Expired
CNT-00002    Aarav Mehta    01/01/26    —         ₹60,000  Running
CNT-00003    Sara Khan      01/01/26    —         ₹80,000  Running
------------------------------------------------------------------
```

---

# 86. Contract Form Visual Design

Keep fields logically grouped.

```text
--------------------------------------------------
Contract
--------------------------------------------------

Employee Information

Employee            [Aarav Mehta]

Contract Period

Start Date          [01/01/2026]
End Date            [31/12/2026]
Status              [Running]

Employment Details

Department          [Engineering]
Job Position        [Software Developer]

Payroll Details

Wage / Month        [₹60,000]
Salary Structure    [Monthly Standard]

Working Schedule

Working Schedule    [40 Hours / Week]

Notes

[................................................]

                         [Save] [Cancel]
--------------------------------------------------
```

---

# 87. Responsive Design

Desktop-first because PeoplePay360 is an ERP-style application.

On smaller screens:

* Fields stack.
* Tables may horizontally scroll.
* Actions wrap.
* Smart navigation remains accessible.

Do not remove critical contract information.

---

# 88. Contract Service Layer

Recommended backend structure:

```text
backend/
└── app/
    └── contracts/
        ├── models.py
        ├── schemas.py
        ├── router.py
        ├── service.py
        └── repository.py
```

Business logic should live primarily in the service layer.

---

# 89. Contract Service Responsibilities

The Contract Service should handle:

* Create contract.
* Update contract.
* Retrieve contract.
* Search contracts.
* Filter contracts.
* Determine status.
* Detect overlaps.
* Validate contract dates.
* Validate related records.
* Find applicable contract.
* Protect historical contracts.

---

# 90. Find Applicable Contract Service

Create a reusable service function conceptually:

```python
find_applicable_contract(
    employee_id,
    period_start,
    period_end
)
```

It should:

1. Find contracts belonging to employee.
2. Filter by period overlap.
3. Exclude cancelled contracts.
4. Determine applicable contracts.
5. Return one valid contract.
6. Raise/return a warning when none exist.
7. Raise/return a conflict when multiple exist.

This function will later be used by Payroll.

---

# 91. Example Applicable Contract

Employee:

```text
Aarav Mehta
```

Contracts:

```text
Contract A
01/01/2025 → 31/12/2025
₹50,000

Contract B
01/01/2026 → 31/12/2026
₹60,000
```

Payroll period:

```text
01/02/2026 → 28/02/2026
```

Result:

```text
Contract B
₹60,000
```

---

# 92. Example No Applicable Contract

Employee:

```text
John Dsouza
```

Contract:

```text
01/01/2025 → 31/12/2025
```

Payroll period:

```text
01/02/2026 → 28/02/2026
```

Result:

```text
No applicable contract.
```

Payroll must flag this employee.

---

# 93. Example Multiple Applicable Contracts

Employee:

```text
Sara Khan
```

Contracts:

```text
Contract A
01/01/2026 → 31/12/2026

Contract B
01/07/2026 → 30/06/2027
```

Payroll period:

```text
August 2026
```

Both overlap.

Result:

```text
Multiple applicable contracts.
```

Do not automatically select one.

---

# 94. Contract and Payroll Warning

Payroll should expose contract-related warnings such as:

```text
No applicable contract
Multiple applicable contracts
Contract missing salary structure
Contract missing working schedule
Contract expired
```

Warnings should be visible before final payroll validation.

---

# 95. Contract and Payrun Eligibility

A contract does not automatically make an employee eligible for every payroll period.

Eligibility should be evaluated using:

```text
Employee
+
Contract dates
+
Contract status
+
Salary Structure
+
Working Schedule
+
Payroll Period
```

---

# 96. Contract and Employee Status

Do not automatically change Employee status just because a Contract expires unless that behavior is explicitly implemented.

Example:

```text
Employee = Active
Contract = Expired
```

This is possible.

HR can then create a new contract or deactivate the employee separately.

---

# 97. Contract and Working Schedule History

If an employee changes schedule:

```text
2025 Contract
Schedule = 40 Hours / Week

2026 Contract
Schedule = Part-time 20h
```

historical contract records must preserve their original schedule relationship/context.

---

# 98. Contract and Department History

If department changes:

```text
2025 Contract
Engineering

2026 Contract
Product
```

do not rewrite the old contract to Product.

Historical contract data must remain accurate.

---

# 99. Contract and Job Position History

Same principle:

```text
2025
Software Developer

2026
Senior Software Developer
```

The contract history should retain the correct job position for each period.

---

# 100. Contract and Wage History

Example:

```text
2024 → ₹45,000
2025 → ₹50,000
2026 → ₹60,000
```

All values must remain available through contract history.

Do not overwrite the historical wage.

---

# 101. Payroll Auditability

A reviewer must be able to answer:

```text
Why was this employee paid this amount?
```

The answer should trace through:

```text
Payslip
   |
   +-- Payrun
   |
   +-- Contract
   |
   +-- Salary Structure
   |
   +-- Salary Rules
   |
   +-- Worked Days / Attendance / Time Off
```

Contract Management is therefore part of payroll auditability.

---

# 102. Testing — Contract Creation

Test:

```text
1. Open Contracts.
2. Click New.
3. Select employee.
4. Enter start date.
5. Enter end date.
6. Enter wage.
7. Select schedule.
8. Select salary structure.
9. Save.
10. Contract appears in list.
```

---

# 103. Testing — Invalid Dates

Test:

```text
Start = 01/06/2026
End   = 01/05/2026
```

Expected:

```text
Validation error.
Contract is not created.
```

---

# 104. Testing — Negative Wage

Test:

```text
Wage = -50000
```

Expected:

```text
Validation error.
Contract is not created.
```

---

# 105. Testing — Missing Employee

Attempt:

```text
Create Contract
without employee
```

Expected:

```text
Employee is required.
```

---

# 106. Testing — Contract Overlap

Existing:

```text
01/01/2026 → 31/12/2026
```

New:

```text
01/07/2026 → 31/12/2027
```

Expected:

```text
Overlap detected.
```

The new contract must not become Running silently.

---

# 107. Testing — Sequential Contracts

Existing:

```text
01/01/2025 → 31/12/2025
```

New:

```text
01/01/2026 → 31/12/2026
```

Expected:

```text
Allowed.
```

---

# 108. Testing — Payroll Contract Selection

Contracts:

```text
2025 = ₹50,000
2026 = ₹60,000
```

Payroll period:

```text
2025
```

Expected:

```text
₹50,000 contract selected.
```

Payroll period:

```text
2026
```

Expected:

```text
₹60,000 contract selected.
```

---

# 109. Testing — No Applicable Contract

Create payroll period where the employee has no matching contract.

Expected:

```text
Payroll warning:
No applicable contract.
```

---

# 110. Testing — Multiple Applicable Contracts

Create overlapping contracts.

Run payroll.

Expected:

```text
Payroll warning:
Multiple applicable contracts.
```

Do not silently choose one.

---

# 111. Testing — Employee Contract Smart Button

Employee:

```text
Aarav Mehta
```

Contracts:

```text
3
```

Expected:

```text
[ Contracts 3 ]
```

Clicking opens only Aarav's contracts.

---

# 112. Testing — Historical Contract

Create:

```text
Contract 2025
```

Create:

```text
Contract 2026
```

Verify both remain visible.

---

# 113. Testing — Contract Deactivation

Cancel a contract.

Verify:

* Contract remains in history.
* Status changes.
* Historical payroll remains intact.
* Contract is not deleted.

---

# 114. Testing — Employee Deactivation

Deactivate employee.

Verify:

* Existing contracts remain.
* Historical contracts remain accessible.
* Historical payroll remains.
* New active contract creation is controlled by business validation.

---

# 115. Testing — RBAC

Employee:

```text
Cannot create contract.
```

HR Manager:

```text
Can create contract.
```

HR Payroll User:

```text
Can manage contracts according to HR permissions.
```

HR Payroll Manager:

```text
Full access.
```

Admin:

```text
Full access.
```

---

# 116. Testing — Contract Privacy

Employee A must not access:

```text
Employee B Contract
```

through direct API or URL manipulation.

Expected:

```text
403 Forbidden
```

or secure equivalent.

---

# 117. Testing — API Security

Test every sensitive endpoint for:

```text
No token
Invalid token
Expired token
Insufficient permission
Invalid employee ownership
```

---

# 118. Testing — Database Integrity

Verify:

```text
Contract employee exists.
Department exists.
Working schedule exists.
Salary structure exists.
Job position exists where relational.
```

Invalid foreign-key values must be rejected.

---

# 119. Performance

Contract lists must support pagination.

Do not load unlimited contracts.

Recommended indexes:

```text
contracts.employee_id
contracts.status
contracts.start_date
contracts.end_date
contracts.department_id
contracts.salary_structure_id
contracts.working_schedule_id
```

These are especially useful for payroll contract lookup.

---

# 120. Efficient Contract Lookup

Payroll contract lookup should query efficiently by:

```text
employee_id
start_date
end_date
status
```

Avoid loading every contract for every employee into Python if the database can perform the filtering efficiently.

---

# 121. Contract Lookup Must Be Reusable

Do not duplicate contract-period matching logic inside:

```text
Payrun
Payslip
Dashboard
Reports
```

Centralize it in the Contract/Payroll service layer.

---

# 122. Suggested Frontend Structure

```text
src/
└── modules/
    └── contracts/
        ├── pages/
        │   ├── ContractListPage.jsx
        │   └── ContractFormPage.jsx
        │
        ├── components/
        │   ├── ContractList.jsx
        │   ├── ContractForm.jsx
        │   ├── ContractFilters.jsx
        │   └── ContractStatusBadge.jsx
        │
        ├── services/
        │   └── contractService.js
        │
        └── hooks/
            └── useContracts.js
```

Adapt to the existing project structure if required.

---

# 123. Suggested Backend Structure

```text
backend/
└── app/
    └── contracts/
        ├── models.py
        ├── schemas.py
        ├── router.py
        ├── service.py
        └── repository.py
```

---

# 124. Separation of Responsibilities

Contract module owns:

```text
Contract records
Contract dates
Contract status
Contract wage
Contract relationships
Contract history
Contract overlap validation
Contract applicability lookup
```

It does NOT own:

```text
Salary rule calculation
Payslip calculation
Attendance calculation
Leave allocation calculation
PDF generation
Email sending
```

Those belong to their respective modules.

---

# 125. Contract ↔ Salary Structure Boundary

Contract:

```text
Which salary structure applies?
```

Salary Structure:

```text
Which salary rules exist?
```

Salary Rule:

```text
How is each amount calculated?
```

Keep these responsibilities separate.

---

# 126. Contract ↔ Working Schedule Boundary

Contract:

```text
Which schedule applies to this employment period?
```

Working Schedule:

```text
What are the expected working days/hours?
```

Keep these responsibilities separate.

---

# 127. Contract ↔ Attendance Boundary

Contract:

```text
Employment context.
```

Attendance:

```text
Actual employee attendance.
```

Do not store attendance rows inside contracts.

---

# 128. Contract ↔ Payroll Boundary

Contract supplies payroll context:

```text
Employee
Wage
Salary Structure
Working Schedule
Contract Dates
```

Payroll performs:

```text
Worked Days
Salary Rules
Deductions
Net Salary
Payslip
```

---

# 129. Demo Data

Use the same demo employees from the overall PeoplePay360 dataset.

Example:

```text
Aarav Mehta
Sara Khan
John Dsouza
Neha Patel
```

Create realistic contract history.

Example:

```text
Aarav Mehta

CNT-00001
01/01/2025 → 31/12/2025
₹50,000
Expired

CNT-00005
01/01/2026 → 31/12/2026
₹60,000
Running
```

The exact values should remain consistent with the final seed dataset.

---

# 130. Demo Contract Scenario

During the hackathon demo:

```text
Employees
   |
   v
Aarav Mehta
   |
   v
[ Contracts 2 ]
   |
   v
Contract List
   |
   +-- 2025 Contract
   |
   +-- 2026 Contract
```

Open the 2026 contract:

```text
Wage / Month:
₹60,000

Working Schedule:
40 Hours / Week

Salary Structure:
Monthly Standard

Status:
Running
```

This demonstrates why the Employee → Contract relationship matters.

---

# 131. Five-Minute Demo Connection

The Contract module should support the following demo:

```text
Employee
   ↓
Contract
   ↓
Working Schedule
   ↓
Attendance
   ↓
Time Off
   ↓
Payrun
   ↓
Payslip
```

The user should be able to move from an employee to their contract without manually searching.

---

# 132. Critical Business Rules Summary

The implementation must enforce:

```text
RULE 1
Every contract belongs to an employee.

RULE 2
Start date is required.

RULE 3
End date cannot be before start date.

RULE 4
Monthly wage cannot be negative.

RULE 5
Historical contracts must be preserved.

RULE 6
Employee status and contract status are separate.

RULE 7
Contract wage is stored on Contract, not only Employee.

RULE 8
Contract can reference Working Schedule.

RULE 9
Contract can reference Salary Structure.

RULE 10
Overlapping active contracts must be detected.

RULE 11
Payroll must select contract by payroll period.

RULE 12
Payroll must not blindly select latest contract.

RULE 13
No applicable contract must produce a payroll warning.

RULE 14
Multiple applicable contracts must produce a conflict.

RULE 15
Finalized payslips must not change when current contracts change.

RULE 16
Inactive employees do not cause historical contracts to disappear.

RULE 17
Contract deletion must not destroy historical payroll.

RULE 18
Backend must enforce contract permissions.

RULE 19
Employees can only access their own contracts.

RULE 20
Contract logic must remain separate from salary-rule computation.
```

---

# 133. Definition of Done

The Contract Management module is complete only when:

* [ ] Contract List view exists.
* [ ] Contract Form exists.
* [ ] New Contract works.
* [ ] Contract search works.
* [ ] Contract filters work.
* [ ] Contract sorting works.
* [ ] Contract identifier exists.
* [ ] Employee relationship exists.
* [ ] Start Date exists.
* [ ] End Date exists.
* [ ] Contract status exists.
* [ ] Department exists.
* [ ] Job Position exists.
* [ ] Wage / Month exists.
* [ ] Working Schedule exists.
* [ ] Salary Structure exists.
* [ ] Notes exists.
* [ ] Contract creation works.
* [ ] Contract editing works.
* [ ] Contract lifecycle works.
* [ ] Running contracts are identifiable.
* [ ] Expired contracts are identifiable.
* [ ] Historical contracts remain available.
* [ ] Contract overlap detection works.
* [ ] Concurrent running contract conflicts are detected.
* [ ] Payroll-period contract lookup works.
* [ ] Missing contract warning works.
* [ ] Multiple-contract warning works.
* [ ] Contract smart button works from Employee.
* [ ] Smart-button count is live.
* [ ] Employee contract filtering works.
* [ ] Employee privacy is enforced.
* [ ] RBAC is enforced.
* [ ] HR Manager can manage contracts.
* [ ] HR Payroll User has appropriate access.
* [ ] HR Payroll Manager has full access.
* [ ] Admin has full access.
* [ ] Historical payroll is protected.
* [ ] Foreign-key validation works.
* [ ] Date validation works.
* [ ] Wage validation works.
* [ ] Empty states work.
* [ ] Loading states work.
* [ ] Error handling works.
* [ ] Pagination works where required.
* [ ] Database indexes are appropriate.
* [ ] Contract lookup is reusable by Payroll.
* [ ] UI follows the Odoo-style reference.
* [ ] Automated tests pass.

---

# 134. AI CODING AGENT INSTRUCTIONS

Before implementing this module:

1. Read `00_MASTER.md`.
2. Read `01_LOGIN_RBAC_USER_MANAGEMENT.md`.
3. Read `02_EMPLOYEE_MASTER.md`.

Then implement Contracts.

## MUST

* Treat contracts as historical employment records.
* Keep contracts separate from Employee.
* Preserve contract history.
* Store wage on the contract.
* Store applicable working schedule.
* Store applicable salary structure.
* Validate contract dates.
* Detect overlapping contracts.
* Build reusable applicable-contract lookup.
* Integrate Employee smart buttons.
* Enforce RBAC.
* Enforce employee ownership.
* Use backend validation.
* Protect finalized payroll history.
* Follow the Odoo-style ERP design.
* Use PostgreSQL relationships.
* Write automated tests.

## MUST NOT

* Store only one contract per employee.
* Overwrite old contracts when creating new ones.
* Select payroll contract simply by latest creation date.
* Silently choose between overlapping contracts.
* Delete historical contracts used by payroll.
* Put salary-rule calculations inside Contract.
* Put attendance calculations inside Contract.
* Put leave calculations inside Contract.
* Trust frontend validation.
* Trust frontend permissions.
* Allow employees to view another employee's contract.
* Hardcode contract data into the frontend.

---

# 135. Final Expected Architecture

The final relationship should be:

```text
                         EMPLOYEE
                            |
             +--------------+--------------+
             |              |              |
             v              v              v
        CONTRACTS       ATTENDANCE      TIME OFF
             |
             +--------------------+
             |                    |
             v                    v
    WORKING SCHEDULE       SALARY STRUCTURE
                                  |
                                  v
                            SALARY RULES
                                  |
                                  v
                               PAYRUN
                                  |
                                  v
                               PAYSLIP
```

For payroll:

```text
PAYROLL PERIOD
      |
      v
EMPLOYEE
      |
      v
APPLICABLE CONTRACT
      |
      +-- Wage
      +-- Working Schedule
      +-- Salary Structure
      +-- Contract Dates
      |
      v
ATTENDANCE / TIME OFF
      |
      v
SALARY RULE ENGINE
      |
      v
PAYSLIP
```

The Contract Management module is therefore the **bridge between Employee Master and Payroll**.

# END OF 03_CONTRACT_MANAGEMENT.md

```
```
