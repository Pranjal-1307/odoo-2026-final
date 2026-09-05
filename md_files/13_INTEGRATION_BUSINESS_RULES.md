Here is the next detailed specification file. This document defines how all PeoplePay360 modules integrate with each other and the business rules that must be enforced across the system.

# PeoplePay360 — Integration & Business Rules Specification

## 1. Purpose

PeoplePay360 is not a collection of isolated modules.

It is one connected:

```text
HR
+
WORKFORCE
+
CONTRACT
+
ATTENDANCE
+
LEAVE
+
PAYROLL
```

system.

Every module affects other modules.

For example:

```text
EMPLOYEE
    ↓
CONTRACT
    ↓
WORKING SCHEDULE
    ↓
ATTENDANCE
    ↓
TIME OFF
    ↓
PAYROLL INPUT
    ↓
PAYRUN
    ↓
PAYSLIP
    ↓
PDF / EMAIL
    ↓
DASHBOARD
```

The purpose of this document is to define:

```text
✓ Module integrations

✓ Cross-module dependencies

✓ Data flow

✓ Validation rules

✓ Payroll eligibility rules

✓ Status transition rules

✓ Data consistency rules

✓ Historical data protection

✓ Security rules

✓ Error handling rules
```

This document should be treated as the central rulebook for how PeoplePay360 behaves when data moves between modules.

---

# 2. Core Integration Principle

Every module must have:

```text
INPUT
    ↓
VALIDATION
    ↓
PROCESSING
    ↓
OUTPUT
    ↓
DOWNSTREAM IMPACT
```

No important business action should exist without validation.

Example:

```text
Create Employee
       ↓
Validate Required Data
       ↓
Employee Created
       ↓
Available for Contract Assignment
```

Another example:

```text
Approve Time Off
       ↓
Validate Leave Balance
       ↓
Create Approved Leave Record
       ↓
Update Payroll Attendance Inputs
```

---

# 3. Complete System Integration Map

```text
                        ┌─────────────────────┐
                        │ USER MANAGEMENT     │
                        │ LOGIN + RBAC        │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ EMPLOYEE MASTER     │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ CONTRACT MANAGEMENT │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ WORKING SCHEDULES   │
                        └──────────┬──────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                             ▼
         ┌─────────────────────┐        ┌─────────────────────┐
         │ ATTENDANCE          │        │ TIME OFF            │
         └──────────┬──────────┘        └──────────┬──────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                        ┌─────────────────────┐
                        │ PAYROLL INPUT DATA  │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ SALARY STRUCTURES   │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ SALARY RULE ENGINE  │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ PAYRUN              │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ PAYSLIP COMPUTATION │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ PAYSLIP PDF / EMAIL │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ PAYROLL DASHBOARD   │
                        └─────────────────────┘
```

---

# 4. Primary Data Ownership

Each module must own its primary data.

| Module              | Primary Data Owner                   |
| ------------------- | ------------------------------------ |
| Login & RBAC        | User / Role / Permission             |
| Employee Master     | Employee                             |
| Contract Management | Employment Contract                  |
| Working Schedules   | Working Schedule                     |
| Attendance          | Attendance Record                    |
| Time Off            | Leave Request / Leave Balance        |
| Salary Structures   | Salary Structure                     |
| Salary Rules Engine | Salary Rule                          |
| Payrun              | Payrun / Payrun Item                 |
| Payslip             | Payslip                              |
| PDF / Email         | Generated Document / Delivery Status |
| Dashboard           | Aggregated Read-Only Metrics         |

Important principle:

```text
SOURCE DATA MUST NOT BE DUPLICATED
WITHOUT A CLEAR BUSINESS REASON.
```

The dashboard should aggregate.

The payroll engine should calculate.

The employee module should own employee master data.

---

# 5. Module Dependency Rules

The dependency chain is:

```text
USER
  ↓
EMPLOYEE
  ↓
CONTRACT
  ↓
SCHEDULE
  ↓
ATTENDANCE + TIME OFF
  ↓
PAYROLL ELIGIBILITY
  ↓
SALARY STRUCTURE
  ↓
SALARY RULES
  ↓
PAYRUN
  ↓
PAYSLIP
```

This means payroll cannot logically process an employee without the required upstream data.

---

# 6. Authentication Integration Rules

Every protected PeoplePay360 action must begin with:

```text
AUTHENTICATION
       ↓
USER IDENTITY
       ↓
ROLE
       ↓
PERMISSION CHECK
       ↓
COMPANY SCOPE CHECK
       ↓
ACTION
```

Example:

```text
User clicks:
Create Payrun

        ↓

Is user authenticated?

        ↓ YES

Does user have payrun.create?

        ↓ YES

Does user belong to authorized company?

        ↓ YES

Create Payrun
```

If any validation fails:

```text
ACTION DENIED
```

---

# 7. RBAC Integration Rule

Permissions must be enforced in the backend.

Never depend only on:

```text
Hidden Button
```

or:

```text
Disabled UI
```

because a user may directly call an API.

Correct architecture:

```text
Frontend
    ↓
API Request
    ↓
Authentication Middleware
    ↓
Authorization Middleware
    ↓
Company Scope Validation
    ↓
Business Service
```

---

# 8. Company Isolation Rule

Every major business entity should belong to a company.

Example:

```text
Employee
company_id

Contract
company_id

Working Schedule
company_id

Payrun
company_id

Payslip
company_id
```

Every request must operate inside:

```text
AUTHORIZED COMPANY SCOPE
```

The following must never happen:

```text
Company A Employee

→

Company B Contract
```

or:

```text
Company A Payroll Manager

→

Company B Payslip
```

unless explicitly supported by an authorized multi-company architecture.

---

# 9. Employee → Contract Integration

An employee is the foundation of employment and payroll processing.

Flow:

```text
Create Employee
       ↓
Employee Status Active
       ↓
Create Contract
       ↓
Assign Salary Structure
       ↓
Assign Working Schedule
       ↓
Employee Becomes Payroll Eligible
```

---

# 10. Employee Contract Rules

A Contract must reference a valid employee.

```text
contract.employee_id
```

must point to:

```text
existing employee
```

The employee must belong to the same company.

Rule:

```text
employee.company_id
=
contract.company_id
```

Otherwise:

```text
CONTRACT CREATION MUST FAIL
```

---

# 11. Employee Status Rule

An employee's status affects downstream workflows.

Example statuses:

```text
ACTIVE

INACTIVE

TERMINATED
```

General rule:

```text
ACTIVE
→ Can participate in payroll eligibility
```

```text
INACTIVE
→ Cannot normally be included in a new Payrun
```

```text
TERMINATED
→ Cannot normally be included after termination date
```

Historical payslips must remain accessible according to permissions.

---

# 12. Employee Data Change Rules

Changes to employee master data should affect future operations.

Example:

```text
Employee Name Changed
```

This may update:

```text
Future UI Display
```

but finalized payroll history should not be recalculated automatically.

Important principle:

```text
FINALIZED PAYROLL
=
HISTORICAL RECORD
```

---

# 13. Contract → Payroll Integration

The Contract is the primary employment and compensation context.

The payroll engine should retrieve relevant contract information for the payroll period.

Required conceptual inputs:

```text
Employee

Company

Contract Status

Contract Start Date

Contract End Date

Salary Structure

Working Schedule
```

---

# 14. Contract Validity Rule

A Contract is payroll-valid only if it is active for the relevant payroll period.

Conceptually:

```text
Contract Start Date
≤
Payroll Period End
```

and:

```text
Contract End Date
≥
Payroll Period Start
```

when an end date exists.

The contract must also have an allowed status.

Example:

```text
ACTIVE
```

---

# 15. Contract Overlap Rule

For the hackathon MVP, the recommended business rule is:

```text
ONE PRIMARY ACTIVE CONTRACT
PER EMPLOYEE
PER DATE RANGE
```

The system should prevent accidental overlapping active contracts.

Invalid example:

```text
Contract A

1 Sep 2026
to
31 Dec 2026
```

and:

```text
Contract B

1 Nov 2026
to
31 Mar 2027
```

for the same employee when both are active as primary contracts.

Validation should reject or require explicit resolution.

---

# 16. Contract Change Historical Rule

If a contract changes:

```text
Old Salary
↓
New Salary
```

the system must not silently recalculate finalized Payslips.

Example:

```text
August Payroll Finalized

₹50,000 Basic
```

Contract changed in September:

```text
₹60,000 Basic
```

Result:

```text
August Payslip remains unchanged.

September and future payroll may use ₹60,000.
```

---

# 17. Working Schedule → Attendance Integration

Working Schedules define the expected work pattern.

They influence:

```text
Expected Working Days

Expected Working Hours

Attendance Validation

Late Detection

Overtime Logic

Payroll Worked Days
```

Flow:

```text
Employee
    ↓
Assigned Working Schedule
    ↓
Expected Work Calendar
    ↓
Attendance Compared
    ↓
Worked Time Calculated
```

---

# 18. Schedule Assignment Rule

An employee must have a valid working schedule before attendance-based payroll calculations are performed.

If no schedule exists:

```text
ATTENDANCE-DEPENDENT PAYROLL
CANNOT BE RELIABLY CALCULATED
```

Recommended result:

```text
PAYROLL VALIDATION ERROR
```

or:

```text
USE COMPANY DEFAULT SCHEDULE
```

if such a rule is explicitly configured.

For MVP simplicity:

```text
Require valid schedule.
```

---

# 19. Attendance → Payroll Integration

Attendance data contributes payroll inputs.

Conceptual values:

```text
Worked Days

Worked Hours

Absent Days

Late Days

Overtime Hours
```

Flow:

```text
Attendance Records
        ↓
Payroll Period Filter
        ↓
Employee Attendance Summary
        ↓
Salary Rule Inputs
        ↓
Payslip Calculation
```

---

# 20. Attendance Period Rule

Only attendance records inside the relevant payroll period should affect that Payrun.

Example:

```text
Payroll Period

1 Sep 2026
to
30 Sep 2026
```

Only relevant attendance within that period should be included.

Attendance outside the period:

```text
Must not affect the current Payrun.
```

---

# 21. Duplicate Attendance Rule

The system should prevent conflicting duplicate attendance records for the same employee.

Example invalid situation:

```text
Employee A

Check In
09:00

Check Out
18:00
```

and another overlapping record:

```text
Check In
10:00

Check Out
17:00
```

Business rule:

```text
OVERLAPPING ATTENDANCE
MUST NOT BE COUNTED TWICE
```

---

# 22. Open Attendance Rule

If an employee has:

```text
CHECK IN

but no

CHECK OUT
```

the attendance record is incomplete.

Before payroll processing, the system should identify this as an exception.

Recommended behavior:

```text
FLAG FOR REVIEW
```

The Payroll Manager should not silently assume arbitrary working hours.

---

# 23. Attendance Lock Rule

Once a Payrun is finalized, relevant attendance should not silently change historical payroll.

Recommended architecture:

```text
Attendance Data
       ↓
Payrun Processing
       ↓
Payroll Input Snapshot
       ↓
Payslip Calculation
       ↓
Finalization
```

After finalization:

```text
Later attendance edits
≠
automatic historical payslip changes
```

---

# 24. Time Off → Attendance Integration

Approved Time Off affects the expected attendance status.

Example:

```text
Employee absent on Monday
```

but:

```text
Approved Paid Leave exists
```

Result:

```text
Not treated as unpaid absence.
```

Flow:

```text
Time Off Request
       ↓
Approval
       ↓
Approved Leave Period
       ↓
Attendance Interpretation
       ↓
Payroll Input
```

---

# 25. Time Off Approval Rule

Only:

```text
APPROVED
```

Time Off should affect payroll.

The following should not automatically affect payroll:

```text
DRAFT

PENDING

REJECTED

CANCELLED
```

---

# 26. Paid vs Unpaid Time Off Rule

The Time Off type determines payroll impact.

```text
PAID LEAVE
```

may contribute as payable time.

```text
UNPAID LEAVE
```

may reduce payable salary according to salary rules.

Conceptually:

```text
Approved Unpaid Leave
        ↓
Unpaid Leave Days
        ↓
Salary Rule Input
        ↓
Deduction Calculation
```

---

# 27. Time Off and Attendance Conflict Rule

The same period should not be treated simultaneously as:

```text
FULL WORKED TIME
```

and:

```text
FULL APPROVED LEAVE
```

without a valid partial-day rule.

Example conflict:

```text
Attendance:
09:00 → 18:00

Time Off:
Full Day Approved
```

The system should flag the inconsistency for review.

---

# 28. Half-Day Leave Integration

If supported:

```text
Half-Day Leave
```

must define which portion of the workday is affected.

Examples:

```text
First Half
```

or:

```text
Second Half
```

The attendance engine should evaluate the leave against the working schedule.

---

# 29. Payroll Input Consolidation

Before salary computation, PeoplePay360 should conceptually consolidate:

```text
EMPLOYEE DATA
+
ACTIVE CONTRACT
+
WORKING SCHEDULE
+
ATTENDANCE
+
TIME OFF
+
SALARY STRUCTURE
+
SALARY RULES
```

into:

```text
PAYROLL INPUT CONTEXT
```

Example:

```text
Payroll Context

Employee:
EMP-001

Period:
Sep 2026

Worked Days:
22

Paid Leave:
2

Unpaid Leave:
1

Overtime Hours:
5

Basic Salary:
₹50,000
```

---

# 30. Salary Structure → Payroll Integration

Every payroll-eligible contract should reference the appropriate Salary Structure.

Flow:

```text
Contract
    ↓
Salary Structure
    ↓
Salary Rules
    ↓
Payroll Computation
```

The Salary Structure defines which rules participate.

---

# 31. Salary Structure Validity Rule

Before payroll computation:

```text
Salary Structure
```

must be:

```text
ACTIVE
```

and applicable to the employee's contract.

If no valid structure exists:

```text
PAYSLIP COMPUTATION MUST FAIL
```

with a meaningful validation error.

---

# 32. Salary Rule Execution Integration

Salary Rules should consume the payroll context.

Possible inputs:

```text
Basic Salary

Worked Days

Unpaid Leave Days

Overtime Hours

Attendance Data

Contract Data

Previous Rule Results
```

Example:

```text
BASIC
    ↓
HRA
    ↓
ALLOWANCES
    ↓
GROSS
    ↓
DEDUCTIONS
    ↓
NET
```

Rules must execute according to the sequence defined in:

```text
08_SALARY_RULES_ENGINE.md
```

---

# 33. Salary Rule Dependency Rule

A rule that depends on another rule must execute after the required dependency.

Example:

```text
BASIC
```

must execute before:

```text
HRA = 40% OF BASIC
```

Therefore:

```text
SEQUENCE
```

is a business-critical field.

Invalid configuration may produce:

```text
INCORRECT PAYROLL
```

and should be prevented where possible.

---

# 34. Salary Rule Circular Dependency Rule

The system should not allow circular calculation dependencies.

Invalid example:

```text
RULE A
depends on
RULE B
```

and:

```text
RULE B
depends on
RULE A
```

Result:

```text
VALIDATION ERROR
```

---

# 35. Payroll Eligibility Rules

Before adding an employee to a Payrun, the system should validate:

```text
✓ Employee exists

✓ Employee belongs to Payrun company

✓ Employee is active

✓ Valid Contract exists

✓ Contract overlaps payroll period

✓ Contract is active

✓ Salary Structure exists

✓ Required Salary Rules exist

✓ Required payroll inputs are available
```

Depending on payroll configuration:

```text
✓ Working Schedule exists

✓ Attendance data is valid

✓ Time Off conflicts are resolved
```

---

# 36. Payroll Eligibility Flow

```text
Employee
    ↓
Active?

NO → Skip / Error

YES
    ↓
Valid Contract?

NO → Error

YES
    ↓
Valid Salary Structure?

NO → Error

YES
    ↓
Required Payroll Inputs Valid?

NO → Exception

YES
    ↓
Eligible for Payrun
```

---

# 37. Payrun Creation Integration

Creating a Payrun should not automatically finalize payroll.

Flow:

```text
CREATE PAYRUN
      ↓
DRAFT
      ↓
VALIDATE PERIOD
      ↓
LOAD ELIGIBLE EMPLOYEES
      ↓
VALIDATE INPUTS
      ↓
PROCESS PAYROLL
      ↓
REVIEW
      ↓
FINALIZE
```

---

# 38. Duplicate Payrun Rule

For the hackathon MVP:

```text
ONE ACTIVE PAYRUN
PER COMPANY
PER PAYROLL PERIOD
```

Example invalid situation:

```text
Company A

September 2026 Payrun

DRAFT
```

and:

```text
Company A

September 2026 Payrun

PROCESSING
```

Both should not exist simultaneously unless explicitly supporting separate payroll runs.

---

# 39. Payrun Period Validation

A Payrun must have:

```text
Period Start Date

Period End Date
```

Validation:

```text
Start Date
≤
End Date
```

The period must be valid according to configured payroll frequency.

Example:

```text
Monthly Payroll

1 Sep 2026
to
30 Sep 2026
```

---

# 40. Payrun Status Transitions

Recommended flow:

```text
DRAFT
  ↓
PROCESSING
  ↓
COMPLETED
  ↓
FINALIZED
```

Failure path:

```text
PROCESSING
     ↓
FAILED
```

Cancellation path:

```text
DRAFT
     ↓
CANCELLED
```

Do not allow arbitrary transitions.

---

# 41. Payrun Processing Rule

When processing begins:

```text
PAYRUN
    ↓
Employee List
    ↓
Eligibility Validation
    ↓
Payroll Input Snapshot
    ↓
Salary Rule Evaluation
    ↓
Payslip Generation
```

Each employee should have an individual processing result.

Example:

```text
Employee A
SUCCESS
```

```text
Employee B
FAILED
```

One employee failure should not necessarily destroy all valid processing results.

---

# 42. Payrun Partial Failure Rule

Example:

```text
124 Employees

120 Successful

4 Failed
```

The Payrun should clearly show:

```text
Successful:
120

Failed:
4
```

Failed employees should include an actionable reason.

Example:

```text
Missing Active Contract
```

or:

```text
No Salary Structure Assigned
```

---

# 43. Payslip Computation Integration

A Payslip must be based on:

```text
PAYRUN
+
EMPLOYEE
+
VALID CONTRACT
+
PAYROLL INPUT SNAPSHOT
+
SALARY STRUCTURE
+
SALARY RULE RESULTS
```

The Payslip should preserve the result used during calculation.

---

# 44. Payslip Snapshot Rule

The Payslip should store calculated historical values.

Conceptually:

```text
Payslip

Employee Snapshot

Contract Snapshot

Salary Input Snapshot

Salary Rule Results

Gross

Deductions

Net
```

This protects historical payroll from later configuration changes.

---

# 45. Payslip Immutability Rule

Once finalized:

```text
PAYSLIP
```

must not be silently recalculated.

Changes to:

```text
Employee

Contract

Attendance

Time Off

Salary Structure

Salary Rules
```

must affect future payroll unless an explicit correction workflow exists.

---

# 46. Payslip Finalization Rule

A Payslip should only be finalized when:

```text
✓ Computation completed

✓ Required validation passed

✓ No unresolved critical error

✓ Payrun finalization conditions satisfied
```

Once finalized:

```text
Historical values are protected.
```

---

# 47. PDF Generation Integration

Payslip PDF generation must use the stored Payslip data.

Correct flow:

```text
Finalized Payslip
       ↓
Read Stored Snapshot
       ↓
Generate PDF
```

Avoid:

```text
Current Employee Data
+
Current Salary Rules
```

for historical PDF regeneration.

This prevents the PDF from changing after payroll has been finalized.

---

# 48. Payslip Email Integration

Email flow:

```text
Finalized Payslip
       ↓
Generate / Retrieve PDF
       ↓
Employee Email
       ↓
Permission / Delivery Validation
       ↓
Send Email
       ↓
Store Delivery Status
```

Possible delivery states:

```text
PENDING

SENT

FAILED
```

---

# 49. Email Failure Rule

Email failure must not automatically invalidate payroll.

Example:

```text
Payslip:
FINALIZED

Email:
FAILED
```

Payroll remains valid.

The delivery operation should be retried separately.

---

# 50. Dashboard Integration Rule

The Dashboard is a read and monitoring layer.

It consumes:

```text
Employees

Contracts

Attendance Exceptions

Time Off Alerts

Payruns

Payslips

Payroll Totals
```

The dashboard should not independently become the source of truth.

Correct:

```text
PAYSLIP
    ↓
Dashboard reads Net Salary
```

Incorrect:

```text
Dashboard Total
    ↓
Writes Payslip Net Salary
```

---

# 51. Dashboard Historical Rule

Payroll dashboard totals should be derived from stored payroll results.

Example:

```text
September 2026

Gross:
₹9,840,000

Net:
₹8,600,000
```

Later salary-rule changes must not automatically alter historical dashboard totals for finalized payroll.

---

# 52. Cross-Module Status Rules

The following status relationships must be respected.

## Employee

```text
ACTIVE
    ↓
May be payroll eligible
```

## Contract

```text
ACTIVE
    ↓
May be used in payroll
```

## Time Off

```text
APPROVED
    ↓
May affect payroll
```

## Payrun

```text
PROCESSING
    ↓
May create payslips
```

## Payslip

```text
FINALIZED
    ↓
Historical record
```

---

# 53. Cross-Module Deletion Rules

Important business records should not be freely deleted once referenced by downstream records.

Example:

```text
Employee
    ↓
Contract exists
```

Recommended:

```text
Do not hard delete employee.
Use inactive / archived status.
```

Another example:

```text
Salary Structure
    ↓
Used by finalized Payslip
```

Recommended:

```text
Do not delete historical configuration.
Archive it.
```

---

# 54. Archive Instead of Delete

Recommended rule:

```text
REFERENCED DATA
=
ARCHIVE
```

rather than:

```text
DELETE
```

Examples:

```text
Employee

Contract

Salary Structure

Salary Rule
```

This protects:

```text
Historical Payroll

Auditability

Data Integrity
```

---

# 55. Referential Integrity Rules

Relationships must be valid.

Examples:

```text
Contract.employee_id
→
Existing Employee
```

```text
Employee.company_id
=
Contract.company_id
```

```text
Payslip.payrun_id
→
Existing Payrun
```

```text
Payslip.employee_id
→
Existing Employee
```

```text
Payslip.company_id
=
Payrun.company_id
```

---

# 56. Data Consistency Rule

For payroll data:

```text
Company Context
```

must remain consistent.

Example:

```text
Payrun.company_id
=
Employee.company_id
=
Contract.company_id
=
Payslip.company_id
```

unless explicitly supporting a special legal multi-company arrangement.

---

# 57. Transaction Rule

Critical payroll operations should use database transactions.

Example:

```text
Start Payslip Calculation

        ↓

Create Payslip

        ↓

Calculate Salary Rules

        ↓

Store Results

        ↓

Update Payrun Item
```

If a critical step fails:

```text
ROLLBACK
```

or mark the individual employee processing item as failed according to the Payrun design.

The system should avoid partially saved corrupted Payslips.

---

# 58. Idempotency Rule

Payroll processing should avoid accidental duplicate calculations.

Example:

```text
User clicks:

PROCESS PAYROLL
```

twice.

The system must not create:

```text
2 Payslips
```

for the same:

```text
Employee

Payrun
```

Recommended uniqueness:

```text
UNIQUE

payrun_id
+
employee_id
```

---

# 59. Concurrency Rule

Two Payroll Managers must not simultaneously create conflicting payroll results.

Example:

```text
Manager A
PROCESS PAYRUN
```

while:

```text
Manager B
PROCESS SAME PAYRUN
```

Recommended behavior:

```text
LOCK PAYRUN
```

or reject the second processing request.

---

# 60. Payroll Input Snapshot Rule

Before payroll computation, relevant values should be captured.

Example:

```text
Employee:
Aarav Mehta

Basic Salary:
₹50,000

Worked Days:
22

Paid Leave:
2

Unpaid Leave:
1

Overtime:
5 Hours
```

These values become the calculation context for that Payslip.

Future changes should not silently mutate the completed calculation.

---

# 61. Payroll Correction Principle

If historical payroll needs correction:

Do not silently modify finalized history.

Recommended conceptual workflow:

```text
Original Finalized Payslip
        ↓
Correction Required
        ↓
Authorized Adjustment / Reversal
        ↓
New Correction Record
```

For the hackathon MVP:

```text
Finalized Payslips are locked.
```

A correction workflow may be presented as a future enhancement.

---

# 62. Attendance Change After Payroll Processing

Scenario:

```text
Payroll calculated

then

Attendance corrected
```

Recommended rule:

```text
DRAFT / UNFINALIZED PAYROLL
→ May be recalculated
```

```text
FINALIZED PAYROLL
→ Historical result remains unchanged
```

---

# 63. Time Off Change After Payroll Processing

Scenario:

```text
Leave approved after payroll processing.
```

Recommended behavior:

```text
If Payrun is not finalized
→ Recalculate affected employee if permitted.
```

```text
If Payrun is finalized
→ Do not silently modify history.
```

---

# 64. Contract Change During Payroll Period

If a contract changes during a payroll period, the system must have a clear policy.

For hackathon MVP:

```text
Use the active contract applicable
during the Payrun processing context.
```

Recommended future enhancement:

```text
Prorated Contract Segments
```

Example:

```text
1 Sep → 15 Sep
Old Salary

16 Sep → 30 Sep
New Salary
```

For MVP, avoid silently producing incorrect results.

If mid-period changes are unsupported:

```text
Show validation warning.
```

---

# 65. Salary Structure Change Rule

Changing a Salary Structure affects:

```text
Future Payroll
```

but should not mutate:

```text
Finalized Payslips
```

Recommended:

```text
Archive old version

Create / activate new version
```

if versioning is implemented.

---

# 66. Salary Rule Change Rule

Changing:

```text
Percentage

Fixed Amount

Condition

Sequence

Formula
```

should affect future calculations.

Finalized payroll must remain based on stored calculation results.

---

# 67. Validation Severity Levels

Recommended severity categories:

```text
BLOCKING ERROR

WARNING

INFORMATION
```

---

## Blocking Error

Payroll cannot continue.

Examples:

```text
No Active Contract

No Salary Structure

Invalid Payroll Period

Duplicate Payslip
```

---

## Warning

Payroll may continue with authorized review.

Examples:

```text
Missing Optional Attendance Data

Contract Expiring Soon

Employee Information Incomplete
```

---

## Information

Displayed for awareness.

Example:

```text
Employee has 2 Approved Leave Days.
```

---

# 68. Business Rule Error Format

Recommended API error structure:

```json
{
  "success": false,
  "code": "MISSING_ACTIVE_CONTRACT",
  "message": "Employee does not have an active contract for the selected payroll period.",
  "entity_type": "employee",
  "entity_id": 123
}
```

The frontend should display:

```text
Clear Human Message
```

rather than:

```text
Database Exception
```

---

# 69. Business Rule Codes

Recommended examples:

```text
EMPLOYEE_NOT_FOUND

EMPLOYEE_INACTIVE

COMPANY_MISMATCH

CONTRACT_NOT_FOUND

CONTRACT_NOT_ACTIVE

CONTRACT_OVERLAP

SCHEDULE_NOT_ASSIGNED

ATTENDANCE_CONFLICT

ATTENDANCE_INCOMPLETE

TIME_OFF_CONFLICT

SALARY_STRUCTURE_MISSING

SALARY_RULE_ERROR

PAYRUN_DUPLICATE

PAYRUN_INVALID_STATUS

PAYSLIP_DUPLICATE

PAYSLIP_FINALIZED

UNAUTHORIZED
```

---

# 70. Audit Trail Rules

Critical business actions should be logged.

Examples:

```text
Employee Created

Employee Updated

Contract Created

Contract Updated

Attendance Modified

Leave Approved

Salary Structure Changed

Salary Rule Changed

Payrun Created

Payroll Processed

Payslip Finalized

Payslip Emailed
```

Recommended event structure:

```text
actor_id

company_id

action

entity_type

entity_id

old_value

new_value

timestamp
```

---

# 71. Payroll Security Rule

Sensitive salary data must be restricted.

Sensitive data includes:

```text
Basic Salary

Gross Salary

Allowances

Deductions

Net Salary

Payroll Cost
```

A user may be authorized to:

```text
VIEW EMPLOYEE
```

without being authorized to:

```text
VIEW SALARY
```

Therefore employee permissions and payroll permissions must remain separate.

---

# 72. Backend Enforcement Rule

Every sensitive operation should validate:

```text
Authenticated User
        ↓
Role
        ↓
Permission
        ↓
Company Scope
        ↓
Entity Scope
        ↓
Business State
```

Example:

```text
Payroll Manager
        ↓
Can access Payrun
        ↓
Only authorized Company
        ↓
Only allowed status transition
        ↓
Action performed
```

---

# 73. API Integration Pattern

Recommended architecture:

```text
ROUTE / CONTROLLER
        ↓
AUTHENTICATION
        ↓
AUTHORIZATION
        ↓
VALIDATION
        ↓
BUSINESS SERVICE
        ↓
DATABASE
        ↓
AUDIT LOG
        ↓
API RESPONSE
```

Business rules should not primarily live inside frontend components.

---

# 74. Frontend Integration Principle

The frontend is responsible for:

```text
Display

Forms

User Interaction

Basic Validation

Navigation

Status Presentation
```

The backend is responsible for:

```text
Security

Authorization

Business Rules

Payroll Calculation

Data Integrity
```

Never trust frontend calculations as the authoritative payroll result.

---

# 75. Event-Based Integration Model

For cleaner architecture, important business events can be conceptualized as:

```text
EMPLOYEE_CREATED

CONTRACT_ACTIVATED

ATTENDANCE_UPDATED

TIME_OFF_APPROVED

PAYRUN_CREATED

PAYRUN_STARTED

PAYSLIP_COMPUTED

PAYSLIP_FINALIZED

PAYSLIP_SENT
```

Future modules can react to these events.

Example:

```text
TIME_OFF_APPROVED
        ↓
Update Payroll Input Availability
```

---

# 76. Integration Service Architecture

Recommended backend services:

```text
EmployeeService

ContractService

ScheduleService

AttendanceService

TimeOffService

SalaryStructureService

SalaryRuleService

PayrollService

PayslipService

DashboardService
```

The payroll engine may orchestrate other services but should not duplicate their ownership.

---

# 77. End-to-End Payroll Integration Flow

```text
STEP 1
Create Employee

        ↓

STEP 2
Activate Employee

        ↓

STEP 3
Create Contract

        ↓

STEP 4
Assign Working Schedule

        ↓

STEP 5
Assign Salary Structure

        ↓

STEP 6
Record Attendance

        ↓

STEP 7
Approve Time Off

        ↓

STEP 8
Create Payrun

        ↓

STEP 9
Validate Employee Eligibility

        ↓

STEP 10
Create Payroll Input Snapshot

        ↓

STEP 11
Execute Salary Rules

        ↓

STEP 12
Generate Payslip

        ↓

STEP 13
Review Results

        ↓

STEP 14
Finalize Payrun

        ↓

STEP 15
Generate Payslip PDF

        ↓

STEP 16
Send Payslip Email

        ↓

STEP 17
Dashboard Updates
```

---

# 78. End-to-End Data Flow

```text
USER
 │
 ▼
EMPLOYEE MASTER
 │
 ▼
EMPLOYMENT CONTRACT
 │
 ├───────────────┐
 ▼               ▼
WORK SCHEDULE    SALARY STRUCTURE
 │               │
 ▼               ▼
ATTENDANCE       SALARY RULES
 │               │
 ├───────┐       │
 ▼       ▼       │
TIME OFF PAYROLL INPUTS
        │
        ▼
    PAYRUN
        │
        ▼
 PAYSLIP ENGINE
        │
        ▼
 FINALIZED PAYSLIP
        │
   ┌────┴────┐
   ▼         ▼
 PDF       EMAIL
   │         │
   └────┬────┘
        ▼
    DASHBOARD
```

---

# 79. Integration Test Scenario — Complete Employee Lifecycle

Test:

```text
Create Employee
```

Expected:

```text
Employee available for contract creation.
```

Then:

```text
Create Contract
```

Expected:

```text
Contract available for payroll eligibility.
```

Then:

```text
Assign Salary Structure
```

Expected:

```text
Employee can proceed toward payroll calculation.
```

---

# 80. Integration Test Scenario — Paid Leave

```text
Employee has:

22 Working Days
```

Employee takes:

```text
2 Approved Paid Leave Days
```

Expected:

```text
Leave should not be treated as unpaid absence.
```

Payroll result follows configured salary rules.

---

# 81. Integration Test Scenario — Unpaid Leave

```text
Employee takes:

2 Approved Unpaid Leave Days
```

Expected:

```text
Unpaid Leave Days
```

must be available as input to the salary rule engine.

Example conceptual rule:

```text
Unpaid Leave Deduction

=
Daily Salary
×
Unpaid Leave Days
```

---

# 82. Integration Test Scenario — Missing Contract

Employee:

```text
ACTIVE
```

but:

```text
No Active Contract
```

Expected:

```text
Employee marked as payroll processing failure.

Reason:
MISSING_ACTIVE_CONTRACT
```

---

# 83. Integration Test Scenario — Contract Company Mismatch

Attempt:

```text
Employee:
Company A

Contract:
Company B
```

Expected:

```text
VALIDATION FAILURE
```

No record should be created.

---

# 84. Integration Test Scenario — Duplicate Payrun

Create:

```text
Company A

September 2026 Payrun
```

Then attempt another active Payrun for the same period.

Expected:

```text
PAYRUN_DUPLICATE
```

unless an explicitly supported multi-run configuration exists.

---

# 85. Integration Test Scenario — Duplicate Payslip

Process the same employee twice in the same Payrun.

Expected:

```text
One Payslip only.
```

Recommended database constraint:

```text
UNIQUE(payrun_id, employee_id)
```

---

# 86. Integration Test Scenario — Attendance After Finalization

```text
September Payslip

FINALIZED
```

Then:

```text
September Attendance Changed
```

Expected:

```text
Finalized Payslip remains unchanged.
```

---

# 87. Integration Test Scenario — Salary Rule Change

```text
August Payslip
FINALIZED
```

Then:

```text
HRA Rule Changed
```

Expected:

```text
August Payslip unchanged.

Future Payslips use new rule.
```

---

# 88. Integration Test Scenario — Email Failure

```text
Payslip finalized
```

Email delivery fails.

Expected:

```text
Payslip remains FINALIZED.

Email status becomes FAILED.

Retry is allowed.
```

---

# 89. Recommended MVP Business Rules

For the Odoo Final Hackathon MVP, the following rules are essential:

```text
✓ Authentication required

✓ RBAC enforced

✓ Company isolation

✓ Employee must exist

✓ Employee must be active

✓ Valid active contract required

✓ Contract must overlap payroll period

✓ Salary structure required

✓ Salary rules must execute in sequence

✓ Approved Time Off affects payroll

✓ Unpaid Leave can affect deductions

✓ Attendance conflicts are detected

✓ One active Payrun per company per period

✓ One Payslip per employee per Payrun

✓ Payrun status transitions controlled

✓ Finalized Payslips immutable

✓ Historical payroll protected

✓ PDF uses stored Payslip data

✓ Email failure does not invalidate payroll

✓ Dashboard reads source modules

✓ Sensitive payroll data protected
```

---

# 90. Strong Bonus Business Rules

Future enhancements may include:

```text
✓ Multi-contract proration

✓ Mid-month salary revision proration

✓ Retroactive payroll adjustments

✓ Payroll reversals

✓ Salary Structure versioning

✓ Salary Rule versioning

✓ Event-driven architecture

✓ Advanced audit history

✓ Approval workflows

✓ Real-time payroll status

✓ Automated anomaly detection
```

---

# 91. Final Integration Checklist

## Identity & Security

* [ ] Authentication implemented
* [ ] RBAC implemented
* [ ] Backend authorization implemented
* [ ] Company isolation implemented

## Employee & Contract

* [ ] Employee required for Contract
* [ ] Company consistency validated
* [ ] Active contract validation
* [ ] Contract period validation
* [ ] Contract overlap validation

## Workforce

* [ ] Working Schedule integration
* [ ] Attendance integration
* [ ] Attendance conflict detection
* [ ] Time Off integration
* [ ] Approved Leave validation

## Payroll

* [ ] Payroll eligibility validation
* [ ] Salary Structure validation
* [ ] Salary Rule sequence validation
* [ ] Payroll input snapshot
* [ ] Duplicate Payrun prevention
* [ ] Duplicate Payslip prevention
* [ ] Controlled Payrun status transitions

## Historical Integrity

* [ ] Finalized Payslip immutable
* [ ] Attendance changes do not silently alter finalized payroll
* [ ] Contract changes do not silently alter finalized payroll
* [ ] Salary rule changes do not silently alter finalized payroll

## Output

* [ ] PDF generated from stored Payslip data
* [ ] Email delivery tracked independently
* [ ] Email failure does not invalidate Payslip

## Dashboard

* [ ] Metrics sourced from authoritative modules
* [ ] Historical payroll uses finalized data
* [ ] Role-based visibility implemented

---

# 92. Final Principle

PeoplePay360 should operate as a connected business system.

The fundamental principle is:

```text
UPSTREAM DATA
        ↓
VALIDATION
        ↓
AUTHORIZED BUSINESS RULES
        ↓
PAYROLL PROCESSING
        ↓
IMMUTABLE HISTORICAL RESULTS
        ↓
DOCUMENT DELIVERY
        ↓
MANAGEMENT VISIBILITY
```

The most important system rule is:

```text
NO PAYROLL RESULT SHOULD BE CREATED
WITHOUT VALID EMPLOYEE,
CONTRACT,
AUTHORIZATION,
AND PAYROLL INPUT CONTEXT.
```

And once payroll becomes finalized:

```text
HISTORICAL DATA MUST REMAIN TRUSTWORTHY.
```

This integration architecture ensures that PeoplePay360 behaves as one unified platform rather than separate HR and payroll screens connected only by navigation.

```text
PEOPLE
   +
CONTRACTS
   +
TIME
   +
ATTENDANCE
   +
LEAVE
   +
SALARY RULES
   +
PAYROLL
   +
PAYSLIPS
   +
ANALYTICS
   =
PEOPLEPAY360
```