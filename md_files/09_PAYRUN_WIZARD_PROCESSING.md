# `09_PAYRUN_WIZARD_PROCESSING.md`

````markdown
# PeoplePay360 — Payrun Wizard & Payroll Processing Specification

## 1. Purpose

The **Payrun Wizard & Processing module** is responsible for running payroll for a group of employees for a specific payroll period.

The previous modules establish the foundation:

```text
01_LOGIN_RBAC_USER_MANAGEMENT
        ↓
02_EMPLOYEE_MASTER
        ↓
03_CONTRACT_MANAGEMENT
        ↓
04_WORKING_SCHEDULES
        ↓
05_ATTENDANCE
        ↓
06_TIME_OFF
        ↓
07_SALARY_STRUCTURES
        ↓
08_SALARY_RULES_ENGINE
````

This module brings all of those pieces together.

The Payrun Wizard answers:

> **Which employees should be paid, for which period, and how should PeoplePay360 process their payroll safely?**

---

# 2. Position in the Overall System

```text
EMPLOYEE MASTER
       │
       ▼
CONTRACT MANAGEMENT
       │
       ▼
WORKING SCHEDULES
       │
       ├──────────────┐
       ▼              ▼
ATTENDANCE        TIME OFF
       │              │
       └──────┬───────┘
              ▼
      SALARY STRUCTURE
              │
              ▼
      SALARY RULES ENGINE
              │
              ▼
     PAYRUN WIZARD & PROCESSING
              │
              ▼
           PAYSLIPS
              │
              ▼
      PAYMENT / PAYROLL REPORTING
```

---

# 3. Main Objective

The Payrun module must allow an authorized payroll user to:

```text
1. Select a payroll period

2. Select the company

3. Identify eligible employees

4. Review payroll inputs

5. Calculate payroll

6. Detect errors

7. Review results

8. Generate Payslips

9. Finalize the Payrun
```

The system must process payroll in a controlled workflow.

It must not simply calculate salaries without tracking:

```text
Who was processed

For which period

Using which contract

Using which salary structure

Whether processing succeeded or failed
```

---

# 4. What is a Payrun?

A **Payrun** is a payroll processing batch.

Example:

```text
PAYRUN

Company:
ABC Technologies Pvt. Ltd.

Payroll Period:
01 September 2026
to
30 September 2026

Employees:
50

Status:
Draft
```

After processing:

```text
50 Employees
        ↓
Salary Rules Engine
        ↓
50 Payroll Calculations
        ↓
50 Payslips
```

A Payrun is therefore the parent container for payroll processing.

---

# 5. Core Principle

The responsibilities must remain separated.

```text
Salary Structure
→ Defines payroll configuration

Salary Rules Engine
→ Calculates one employee's payroll

Payrun
→ Coordinates payroll for multiple employees

Payslip
→ Stores the employee's payroll result
```

The Payrun must orchestrate.

It should not contain all salary calculation logic directly.

---

# 6. Payrun Wizard Concept

The user creates a Payrun through a step-by-step wizard.

Recommended flow:

```text
STEP 1
Select Payroll Period
        ↓
STEP 2
Select Company
        ↓
STEP 3
Find Eligible Employees
        ↓
STEP 4
Review Employees
        ↓
STEP 5
Calculate Payroll
        ↓
STEP 6
Review Results
        ↓
STEP 7
Generate / Confirm Payslips
        ↓
STEP 8
Finalize Payrun
```

---

# 7. Payrun States

Recommended Payrun lifecycle:

```text
DRAFT
   ↓
READY
   ↓
PROCESSING
   ↓
REVIEW
   ↓
FINALIZED
```

Alternative state:

```text
FAILED
```

Possible complete state model:

```text
DRAFT
READY
PROCESSING
REVIEW
FINALIZED
FAILED
CANCELLED
```

---

# 8. State Definitions

## DRAFT

The Payrun is being configured.

The user can:

```text
Select period
Select company
Review employees
Modify employee selection
```

---

## READY

The Payrun has valid configuration.

Example:

```text
✓ Payroll period selected

✓ Company selected

✓ Eligible employees identified
```

The Payrun is ready for processing.

---

## PROCESSING

The system is currently calculating payroll.

```text
Employee 1 → Processing

Employee 2 → Processing

Employee 3 → Processing
```

The user should not accidentally modify critical Payrun configuration while processing.

---

## REVIEW

Payroll calculations have completed.

The payroll administrator reviews:

```text
Successful employees

Failed employees

Warnings

Gross totals

Deduction totals

Net salary totals
```

---

## FINALIZED

The Payrun has been officially completed.

The system should:

```text
Lock the Payrun

Lock finalized Payslips

Preserve historical data
```

---

## FAILED

A major Payrun-level failure occurred.

Example:

```text
Database transaction failure

Invalid Payrun configuration

Critical processing failure
```

Employee-level errors should normally be tracked separately.

---

## CANCELLED

The Payrun was intentionally cancelled before finalization.

Draft or unfinalized calculations may be removed according to the business rules.

---

# 9. Payrun Status Flow

```text
                ┌───────────┐
                │   DRAFT   │
                └─────┬─────┘
                      │
                      ▼
                ┌───────────┐
                │   READY   │
                └─────┬─────┘
                      │
                      ▼
                ┌───────────┐
                │PROCESSING │
                └─────┬─────┘
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
        ┌─────────┐       ┌────────┐
        │ REVIEW  │       │ FAILED │
        └────┬────┘       └────────┘
             │
             ▼
       ┌───────────┐
       │ FINALIZED │
       └───────────┘
```

Cancellation may be allowed before finalization.

---

# 10. Wizard Step 1 — Payroll Period

The first step is selecting the payroll period.

Example:

```text
Payroll Period

Start Date:
01 September 2026

End Date:
30 September 2026
```

Recommended fields:

```text
Company

Period Name

Start Date

End Date
```

Example:

```text
September 2026 Payroll
```

---

# 11. Payroll Period Validation

The system must validate:

```text
Start Date exists

End Date exists

Start Date <= End Date
```

Invalid:

```text
Start:
30 September 2026

End:
01 September 2026
```

Result:

```text
Validation Error

Payroll period start date cannot be after end date.
```

---

# 12. Duplicate Payrun Protection

The system should prevent accidental duplicate Payruns.

Example:

```text
Company:
ABC Technologies

Period:
September 2026
```

If an active Payrun already exists:

```text
September 2026 Payroll
```

The system should warn or reject duplicate creation.

Recommended uniqueness:

```text
company_id
+
period_start
+
period_end
```

subject to Payrun status rules.

---

# 13. Wizard Step 2 — Select Company

The payroll administrator selects the company.

Example:

```text
Company

[ ABC Technologies Pvt. Ltd. ▼ ]
```

The system then uses the company to determine:

```text
Employees

Contracts

Salary Structures

Payroll data
```

---

# 14. Company Data Isolation

The Payrun must process only data belonging to the selected company.

Correct:

```text
Company A Payrun
        │
        ├── Company A Employees
        ├── Company A Contracts
        └── Company A Payroll Data
```

Never:

```text
Company A Payrun
        ↓
Employee from Company B
```

---

# 15. Wizard Step 3 — Find Eligible Employees

The system automatically identifies employees eligible for payroll.

Recommended eligibility requirements:

```text
✓ Employee is active

✓ Employee belongs to selected company

✓ Employee has an applicable contract

✓ Contract is active during payroll period

✓ Contract has a Salary Structure
```

---

# 16. Eligible Employee Query Logic

Conceptually:

```text
Employee is active

AND

Employee belongs to Company

AND

Employee has applicable Contract

AND

Contract overlaps Payroll Period

AND

Contract has Salary Structure
```

---

# 17. Employee Eligibility Example

Employee:

```text
Aarav Mehta
```

Status:

```text
Active
```

Contract:

```text
01 Jan 2026
to
31 Dec 2026
```

Payroll Period:

```text
01 Sep 2026
to
30 Sep 2026
```

Salary Structure:

```text
Standard Monthly
```

Result:

```text
ELIGIBLE ✓
```

---

# 18. Ineligible Employee Examples

## No Contract

```text
Employee:
Aarav

Contract:
None
```

Result:

```text
Not Eligible
Reason:
No applicable contract
```

---

## Inactive Employee

```text
Employee Status:
Inactive
```

Result:

```text
Not Eligible
Reason:
Employee inactive
```

---

## Missing Salary Structure

```text
Contract:
Active

Salary Structure:
None
```

Result:

```text
Not Eligible
Reason:
No Salary Structure assigned
```

---

# 19. Employee Selection Screen

Recommended wizard UI:

```text
--------------------------------------------------
Eligible Employees
--------------------------------------------------

☑ Aarav Mehta
   Engineering
   Standard Monthly

☑ Priya Shah
   HR
   Standard Monthly

☑ Rahul Patel
   Finance
   Executive Monthly

☐ Inactive Employee
   Not Eligible

--------------------------------------------------

Selected Employees: 3

[Back]                       [Continue]
```

The administrator may review and select employees.

---

# 20. Employee Selection Rules

Recommended behavior:

```text
Eligible employees
→ Selected by default
```

The payroll administrator may optionally:

```text
Unselect an employee
```

This supports exceptions.

However:

```text
Ineligible employees
→ Cannot be processed
```

---

# 21. Exclusion Tracking

If an eligible employee is manually excluded, store:

```text
Employee ID

Payrun ID

Status:
Excluded

Reason:
Optional
```

Example:

```text
Employee:
Aarav Mehta

Status:
Excluded

Reason:
Salary under review
```

This improves auditability.

---

# 22. Wizard Step 4 — Pre-Processing Validation

Before payroll starts, validate each selected employee.

Checks:

```text
Employee exists

Employee active

Applicable contract exists

Salary structure exists

Working schedule exists if required

Payroll period valid

No finalized Payslip already exists
```

---

# 23. Pre-Processing Result

Example:

```text
PRE-PROCESSING VALIDATION

✓ Aarav Mehta

✓ Priya Shah

⚠ Rahul Patel

Reason:
Missing Salary Structure
```

The user can:

```text
Fix issue
OR
Remove employee
```

before processing.

---

# 24. Wizard Step 5 — Process Payroll

Once confirmed:

```text
PROCESS PAYROLL
```

The Payrun calls the Salary Rules Engine for every selected employee.

```text
PAYRUN
   │
   ▼
Employee 1
   │
   ▼
Salary Rules Engine
   │
   ▼
Calculation Result

------------------

Employee 2
   │
   ▼
Salary Rules Engine
   │
   ▼
Calculation Result
```

---

# 25. Payroll Processing Flow

```text
START PAYRUN
      │
      ▼
Lock Payrun Configuration
      │
      ▼
Set Status = PROCESSING
      │
      ▼
Load Selected Employees
      │
      ▼
FOR EACH EMPLOYEE
      │
      ├── Validate
      │
      ├── Build Payroll Context
      │
      ├── Run Salary Rules Engine
      │
      ├── Validate Result
      │
      └── Store Processing Result
      │
      ▼
Aggregate Results
      │
      ▼
Set Status = REVIEW
```

---

# 26. Employee Processing Record

Every employee in a Payrun should have a processing record.

Recommended fields:

```text
id

payrun_id

employee_id

contract_id

status

error_message

gross_salary

total_deductions

net_salary

payslip_id
```

---

# 27. Employee Processing Status

Recommended:

```text
PENDING

PROCESSING

SUCCESS

FAILED

SKIPPED

EXCLUDED
```

---

# 28. Processing Status Example

```text
PAYRUN STATUS

Aarav Mehta
SUCCESS ✓

Priya Shah
SUCCESS ✓

Rahul Patel
FAILED ✗

Reason:
Percentage base BASIC unavailable
```

---

# 29. Partial Failure Strategy

One employee failure should not necessarily destroy the entire Payrun.

Recommended behavior:

```text
Employee A
✓ Success

Employee B
✓ Success

Employee C
✗ Failed
```

Result:

```text
Payrun
→ REVIEW WITH ERRORS
```

The administrator can:

```text
Fix Employee C

Recalculate Employee C
```

without recalculating everything unnecessarily.

---

# 30. Critical Payrun Failure

Some errors affect the entire Payrun.

Examples:

```text
Invalid payroll period

Company unavailable

Database failure

System calculation service unavailable
```

Result:

```text
Payrun Status:
FAILED
```

---

# 31. Processing Progress

The UI should show progress.

Example:

```text
Processing Payroll

████████████████░░░░

40 / 50 Employees

Successful:
38

Failed:
2
```

Recommended counters:

```text
Total Employees

Pending

Processing

Successful

Failed

Skipped
```

---

# 32. Synchronous vs Background Processing

For the hackathon MVP:

```text
Small employee count
→ Synchronous processing is acceptable
```

For a stronger architecture:

```text
Payrun Request
      ↓
Background Job
      ↓
Process Employees
      ↓
Update Progress
```

Recommended architecture should support future asynchronous processing.

---

# 33. Idempotent Processing

The system must avoid accidental duplicate Payslips.

Example:

```text
User clicks:

PROCESS PAYROLL
```

twice.

The system must prevent:

```text
Employee:
Aarav

Payslip #1001

Payslip #1002
```

for the same Payrun.

Use:

```text
Payrun Employee Processing Record
```

as a processing guard.

---

# 34. Processing Lock

While processing:

```text
Payrun Status = PROCESSING
```

Do not allow:

```text
Changing payroll period

Changing company

Adding employees

Removing employees
```

unless processing is stopped/reset according to business rules.

---

# 35. Integration with Salary Rules Engine

The Payrun sends:

```text
employee_id

period_start

period_end
```

The Salary Rules Engine resolves:

```text
Contract

Salary Structure

Attendance

Time Off

Rules
```

Then returns:

```text
Rule Results

Gross Salary

Deductions

Net Salary

Employer Contributions

Calculation Trace
```

---

# 36. Recommended Processing Interface

Conceptually:

```text
calculatePayroll(
    employee_id,
    period_start,
    period_end,
    mode="preview"
)
```

Response:

```text
Calculation Result
```

The Payrun should not duplicate calculation logic.

---

# 37. Store Processing Results

After successful calculation:

```text
Payrun Employee
        ↓
Calculation Result
        ↓
Store Totals
        ↓
Store Rule Results
        ↓
Prepare Payslip
```

Example:

```text
Employee:
Aarav

Gross:
₹73,500

Deductions:
₹11,200

Net:
₹62,300
```

---

# 38. Wizard Step 6 — Review Results

After processing:

```text
PAYROLL REVIEW
```

Example:

```text
--------------------------------------------------

September 2026 Payroll

Employees:
50

Successful:
48

Failed:
2

--------------------------------------------------

TOTAL GROSS

₹3,675,000

TOTAL DEDUCTIONS

₹560,000

TOTAL NET PAY

₹3,115,000

--------------------------------------------------

[View Errors]

[Review Payslips]

[Finalize Payroll]
```

---

# 39. Payrun Summary Totals

The Payrun should aggregate:

```text
Total Basic

Total Allowances

Total Earnings

Total Gross Salary

Total Employee Deductions

Total Net Salary

Total Employer Contributions

Total Employer Cost
```

---

# 40. Aggregate Calculation

Conceptually:

```text
Total Net Pay
=
SUM(Employee Net Salary)
```

Example:

```text
Employee A
₹62,300

Employee B
₹58,000

Employee C
₹70,500
```

Result:

```text
Total Net Pay

₹190,800
```

---

# 41. Review Employee List

Recommended UI:

```text
--------------------------------------------------------------
Employee        Gross       Deductions       Net       Status
--------------------------------------------------------------

Aarav Mehta     ₹73,500     ₹11,200       ₹62,300     ✓

Priya Shah      ₹68,000     ₹10,500       ₹57,500     ✓

Rahul Patel       --           --            --        ✗ Failed
--------------------------------------------------------------
```

Actions:

```text
View

Recalculate

View Error
```

---

# 42. Failed Employee Review

Example:

```text
Rahul Patel

Status:
FAILED

Error:

Salary Rule PF failed.

Percentage base BASIC is unavailable.

[View Details]

[Fix Configuration]

[Recalculate]
```

---

# 43. Recalculate Employee

After fixing an issue:

```text
Fix Contract
OR
Fix Salary Structure
OR
Fix Salary Rule
```

The administrator can:

```text
RECALCULATE EMPLOYEE
```

Flow:

```text
Employee
      ↓
Reset Previous Draft Result
      ↓
Run Salary Rules Engine
      ↓
Update Payrun Employee Result
```

---

# 44. Recalculation Rules

Recalculation should only be allowed before finalization.

```text
DRAFT
READY
PROCESSING
REVIEW
→ Recalculation allowed where appropriate

FINALIZED
→ Recalculation locked
```

For finalized payroll corrections, use a future adjustment workflow rather than silently changing history.

---

# 45. Wizard Step 7 — Generate Payslips

After successful review:

```text
GENERATE PAYSLIPS
```

The system creates one Payslip per successful employee.

```text
Payrun
   │
   ├── Aarav
   │     ↓
   │   Payslip
   │
   ├── Priya
   │     ↓
   │   Payslip
   │
   └── Rahul
         ↓
       Payslip
```

Failed employees must not receive a finalized Payslip.

---

# 46. Payslip Creation

For each successful employee:

```text
Create Payslip Header

Create Payslip Lines

Store Salary Rule Snapshot

Store Totals

Link Payslip to Payrun
```

---

# 47. Payslip Data

The Payslip should contain:

```text
Employee

Company

Payroll Period

Contract

Salary Structure

Earnings

Deductions

Employer Contributions

Gross Salary

Total Deductions

Net Salary
```

---

# 48. Payslip Link

Recommended relationship:

```text
PAYRUN

1
│
├──── PAYSLIP A

├──── PAYSLIP B

├──── PAYSLIP C

└──── PAYSLIP N
```

Database:

```text
payslip.payrun_id
```

---

# 49. Finalization Requirements

Before finalization, validate:

```text
Payrun exists

Payrun is in REVIEW state

No critical errors

Successful employee results valid

Payslips generated

Totals calculated
```

Recommended strict MVP rule:

```text
All selected employees
must be successfully processed
before finalization.
```

Alternative future rule:

```text
Allow partial finalization
with explicit administrator confirmation.
```

For hackathon reliability, use the strict rule unless the problem statement requires partial payroll finalization.

---

# 50. Wizard Step 8 — Finalize Payrun

Finalization means:

```text
Payroll calculations are accepted as official.
```

Flow:

```text
REVIEW
   ↓
Validate
   ↓
Generate Payslips
   ↓
Snapshot Data
   ↓
Lock Results
   ↓
FINALIZED
```

---

# 51. Finalization Confirmation

Recommended UI:

```text
--------------------------------------------------

Finalize September 2026 Payroll?

Employees:
50

Total Net Pay:
₹3,115,000

After finalization:

• Payroll results will be locked
• Payslips will become official
• Historical calculations cannot be modified directly

[Cancel]        [Finalize Payroll]
--------------------------------------------------
```

---

# 52. Immutable Finalized Payroll

Once finalized:

```text
Do not modify:

Payroll period

Employee payroll results

Payslip amounts

Salary rule snapshots
```

Historical payroll must remain stable.

---

# 53. Payrun Cancellation

Before finalization:

```text
DRAFT
READY
REVIEW
```

may allow cancellation.

Example:

```text
CANCEL PAYRUN
```

Result:

```text
Status:
CANCELLED
```

Depending on implementation:

```text
Draft Payslips
→ Deleted or voided
```

Never silently delete finalized payroll history.

---

# 54. Reset / Retry Processing

Recommended for failed processing:

```text
FAILED EMPLOYEE
       ↓
Fix Data
       ↓
Reset Employee Status
       ↓
Recalculate
```

For Payrun-level failure:

```text
Fix System Problem
       ↓
Retry Payrun
```

The system must avoid duplicate successful results.

---

# 55. Attendance Integration

Before salary calculation, attendance information must correspond to the Payrun period.

Example:

```text
Payroll Period:

01 Sep
to
30 Sep
```

Attendance summary:

```text
Worked Days:
21

Scheduled Days:
22
```

The Salary Rules Engine receives the summarized data.

---

# 56. Time Off Integration

The Payrun period determines relevant approved leave.

Example:

```text
Payroll Period:

September
```

Approved leave:

```text
10 Sep - 11 Sep
```

The system determines:

```text
Paid Leave

Unpaid Leave
```

and passes appropriate summary data into payroll calculation.

---

# 57. Payroll Data Cutoff Principle

For a reliable Payrun:

```text
Payroll inputs should be stable
when finalizing payroll.
```

Relevant inputs:

```text
Attendance

Approved Time Off

Contract

Salary Configuration
```

For MVP:

```text
Recalculate before finalization
if inputs change.
```

After finalization:

```text
Store snapshots
```

---

# 58. Payroll Input Changes During Processing

Potential issue:

```text
Employee payroll starts calculating

↓

Attendance is edited

↓

Employee payroll finishes
```

Recommended MVP solution:

```text
Use a consistent calculation context
for each employee calculation.
```

Stronger solution:

```text
Freeze / snapshot payroll inputs
when Payrun processing begins.
```

---

# 59. Payrun Database Model

Recommended table:

```text
payruns
```

Fields:

```text
id

company_id

name

period_start

period_end

status

total_employees

successful_employees

failed_employees

total_gross

total_deductions

total_net

total_employer_contributions

total_employer_cost

created_by

created_at

processed_at

finalized_at
```

---

# 60. Payrun Employee Database Model

Recommended:

```text
payrun_employees
```

Fields:

```text
id

payrun_id

employee_id

contract_id

status

excluded

exclusion_reason

gross_salary

total_deductions

net_salary

employer_contribution_total

employer_cost

error_code

error_message

processed_at

payslip_id
```

---

# 61. Recommended Database Relationships

```text
COMPANY
   │
   ▼
PAYRUN
   │
   ├───────────────┐
   │               │
   ▼               ▼
PAYRUN EMPLOYEE   PAYSLIPS
   │               │
   ▼               ▼
EMPLOYEE       PAYSLIP LINES
```

---

# 62. Suggested Constraints

## Payrun

```text
period_start <= period_end
```

## Payrun Employee

```text
UNIQUE(
    payrun_id,
    employee_id
)
```

## Payslip

Recommended protection:

```text
Prevent duplicate finalized Payslips
for the same employee and period.
```

---

# 63. API Design

## Create Payrun

```http
POST /api/payruns
```

Request:

```json
{
  "company_id": 1,
  "name": "September 2026 Payroll",
  "period_start": "2026-09-01",
  "period_end": "2026-09-30"
}
```

---

## Get Eligible Employees

```http
GET /api/payruns/eligible-employees
```

Parameters:

```text
company_id

period_start

period_end
```

---

## Add / Update Selected Employees

```http
POST /api/payruns/{payrun_id}/employees
```

Example:

```json
{
  "employee_ids": [
    101,
    102,
    103
  ]
}
```

---

## Validate Payrun

```http
POST /api/payruns/{payrun_id}/validate
```

---

## Process Payrun

```http
POST /api/payruns/{payrun_id}/process
```

---

## Get Processing Status

```http
GET /api/payruns/{payrun_id}/status
```

Response:

```json
{
  "status": "PROCESSING",
  "total": 50,
  "processed": 40,
  "success": 38,
  "failed": 2
}
```

---

## Get Payrun Results

```http
GET /api/payruns/{payrun_id}
```

---

## Recalculate Employee

```http
POST /api/payruns/{payrun_id}/employees/{employee_id}/recalculate
```

---

## Generate Payslips

```http
POST /api/payruns/{payrun_id}/generate-payslips
```

---

## Finalize Payrun

```http
POST /api/payruns/{payrun_id}/finalize
```

---

## Cancel Payrun

```http
POST /api/payruns/{payrun_id}/cancel
```

---

# 64. API Authorization

Only authorized users can manage payroll.

Recommended roles:

```text
ADMIN

HR_MANAGER

PAYROLL_MANAGER
```

Possible permissions:

```text
payrun.create

payrun.view

payrun.process

payrun.finalize

payrun.cancel
```

---

# 65. Employee Access Rules

Normal employees must not be able to:

```text
Create Payruns

Process company payroll

Finalize payroll

View other employees' payroll
```

Employees should later only access:

```text
Their own Payslips
```

according to RBAC permissions.

---

# 66. Backend Processing Architecture

Recommended structure:

```text
backend/
│
├── payroll/
│
│   ├── payrun/
│   │   ├── payrun_service
│   │   ├── eligibility_service
│   │   ├── processing_service
│   │   ├── validation_service
│   │   └── finalization_service
│   │
│   ├── salary_engine/
│   │
│   ├── payslips/
│   │
│   └── models/
```

---

# 67. Payrun Service Responsibilities

## PayrunService

```text
Create Payrun

Update Draft Payrun

Load Payrun

Cancel Payrun
```

---

## EligibilityService

```text
Find eligible employees

Validate contracts

Validate Salary Structures

Return eligibility reasons
```

---

## ProcessingService

```text
Start processing

Loop through employees

Call Salary Rules Engine

Store results

Track progress
```

---

## FinalizationService

```text
Validate Payrun

Generate Payslips

Lock payroll

Finalize
```

---

# 68. Processing Pseudo-Code

```text
function processPayrun(payrunId):

    payrun = getPayrun(payrunId)

    validatePayrun(payrun)

    setStatus(payrun, PROCESSING)

    employees = getSelectedEmployees(payrun)

    for employee in employees:

        try:

            markProcessing(employee)

            result = salaryEngine.calculate(
                employee.id,
                payrun.period_start,
                payrun.period_end
            )

            storeResult(
                payrun,
                employee,
                result
            )

            markSuccess(employee)

        except PayrollCalculationError as error:

            storeError(
                employee,
                error
            )

            markFailed(employee)

    calculatePayrunTotals(payrun)

    setStatus(payrun, REVIEW)
```

---

# 69. Finalization Pseudo-Code

```text
function finalizePayrun(payrunId):

    payrun = getPayrun(payrunId)

    validateFinalization(payrun)

    beginTransaction()

    for employeeResult in successfulEmployees:

        createPayslip(
            employeeResult
        )

        createPayslipLines(
            employeeResult
        )

        storeCalculationSnapshot(
            employeeResult
        )

    updatePayrunTotals(payrun)

    setStatus(
        payrun,
        FINALIZED
    )

    commitTransaction()
```

If an error occurs:

```text
ROLLBACK
```

The Payrun must not become partially finalized accidentally.

---

# 70. Transaction Strategy

## Processing

Employee-level calculations may be handled independently.

```text
Employee A
→ Success

Employee B
→ Failed

Employee C
→ Success
```

This allows error recovery.

---

## Finalization

Finalization should use stronger transactional protection.

```text
BEGIN

Create all final Payslips

Create all Payslip Lines

Store snapshots

Finalize Payrun

COMMIT
```

Failure:

```text
ROLLBACK
```

---

# 71. Concurrency Protection

Two payroll administrators could attempt:

```text
PROCESS PAYRUN
```

at the same time.

The system must prevent duplicate processing.

Recommended:

```text
Database row lock
OR
Processing status lock
```

Example:

```text
Status already PROCESSING
```

Result:

```text
409 Conflict

Payrun is already being processed.
```

---

# 72. Audit Trail

Important Payrun actions should be recorded.

Track:

```text
Payrun Created

Employees Selected

Employee Excluded

Processing Started

Employee Failed

Employee Recalculated

Payslips Generated

Payrun Finalized

Payrun Cancelled
```

Example:

```text
2026-09-30 10:00

Admin

Created September Payroll
```

---

# 73. Audit Log Fields

Recommended:

```text
id

entity_type

entity_id

action

performed_by

timestamp

old_value

new_value
```

---

# 74. Error Handling

Errors should be understandable.

Bad:

```text
ERROR 500
```

Better:

```text
Payroll calculation failed.

Employee:
Rahul Patel

Rule:
PF

Reason:
Percentage base BASIC is unavailable.
```

---

# 75. Error Categories

Recommended:

```text
VALIDATION_ERROR

CONTRACT_ERROR

SALARY_STRUCTURE_ERROR

RULE_CALCULATION_ERROR

ATTENDANCE_ERROR

TIME_OFF_ERROR

SYSTEM_ERROR
```

---

# 76. Payrun Dashboard

Recommended summary UI:

```text
------------------------------------------------

September 2026 Payroll

Status:
REVIEW

------------------------------------------------

Employees

50

✓ Successful
48

✗ Failed
2

------------------------------------------------

Total Gross

₹3,675,000

Total Deductions

₹560,000

Total Net Pay

₹3,115,000

------------------------------------------------

[Review Employees]

[View Errors]

[Generate Payslips]

[Finalize]
```

---

# 77. Payrun List UI

Recommended:

```text
---------------------------------------------------------------
Period            Company        Employees     Status     Action
---------------------------------------------------------------

Sep 2026          ABC Tech       50            REVIEW     View

Aug 2026          ABC Tech       48            FINALIZED  View

Jul 2026          ABC Tech       47            FINALIZED  View
---------------------------------------------------------------
```

---

# 78. Payrun Wizard UI

Recommended flow:

```text
┌──────────────────────────────────────────────────────────┐
│ Create Payroll Run                                       │
│                                                          │
│ ① Period  →  ② Employees  →  ③ Validate  →  ④ Process  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ Payroll Period                                           │
│                                                          │
│ Start Date   [ 01 Sep 2026 ]                            │
│ End Date     [ 30 Sep 2026 ]                            │
│                                                          │
│ Company      [ ABC Technologies ▼ ]                     │
│                                                          │
│                                      [Next →]            │
└──────────────────────────────────────────────────────────┘
```

---

# 79. Design Principles

The Payrun UI should follow the PeoplePay360 design system:

```text
Clean

Professional

Enterprise HR style

Minimal clutter

Clear status indicators

Strong financial summaries

Easy review flow
```

Important information should be immediately visible:

```text
Period

Status

Employees

Errors

Gross

Deductions

Net
```

---

# 80. Payrun Detail Page

Recommended layout:

```text
HEADER

September 2026 Payroll

Status: REVIEW

Company: ABC Technologies

Period:
01 Sep 2026 - 30 Sep 2026


SUMMARY CARDS

Employees
50

Successful
48

Failed
2

Total Net
₹3,115,000


TABS

Overview

Employees

Errors

Payslips

Activity
```

---

# 81. Payrun Employee Detail

Clicking an employee should show:

```text
Employee Information

Contract

Salary Structure

Attendance Summary

Time Off Summary

Salary Components

Calculation Trace

Gross Salary

Deductions

Net Salary
```

This is valuable for hackathon demonstrations.

---

# 82. Warning System

Not every issue must be a blocking error.

Example warning:

```text
⚠ Attendance has not been finalized.
```

The administrator may need to decide whether to proceed.

Recommended severity:

```text
INFO

WARNING

ERROR
```

---

# 83. Blocking Validation

Examples of blocking errors:

```text
No Contract

No Salary Structure

Invalid Payroll Period

Duplicate Finalized Payslip

Invalid Salary Rule
```

These must stop processing for that employee.

---

# 84. Payroll Processing Summary

The system should provide:

```text
Total Employees

Successfully Processed

Failed

Skipped

Excluded
```

Example:

```text
Total:
50

Success:
46

Failed:
2

Skipped:
1

Excluded:
1
```

The numbers should reconcile:

```text
Success
+
Failed
+
Skipped
+
Excluded
=
Total
```

---

# 85. Data Integrity Rules

## Rule 1

A Payrun belongs to one company.

---

## Rule 2

A Payrun has one payroll period.

---

## Rule 3

One employee appears once per Payrun.

---

## Rule 4

Finalized payroll cannot be silently modified.

---

## Rule 5

Each successful employee result must have traceable calculation data.

---

## Rule 6

Duplicate final Payslips must be prevented.

---

# 86. Testing Requirements

## Test 1 — Create Payrun

Input:

```text
Valid company

Valid period
```

Expected:

```text
Payrun created in DRAFT
```

---

## Test 2 — Invalid Period

Input:

```text
Start > End
```

Expected:

```text
Validation error
```

---

## Test 3 — Eligible Employee

Employee:

```text
Active

Valid Contract

Salary Structure
```

Expected:

```text
Eligible
```

---

## Test 4 — Missing Contract

Expected:

```text
Ineligible
```

---

## Test 5 — Missing Salary Structure

Expected:

```text
Validation failure
```

---

## Test 6 — Process Multiple Employees

Input:

```text
10 Employees
```

Expected:

```text
10 processing records
```

---

## Test 7 — Partial Failure

```text
Employee A → Success

Employee B → Failure
```

Expected:

```text
Payrun enters REVIEW

Employee B error visible
```

---

## Test 8 — Recalculate Employee

Fix Employee B configuration.

Expected:

```text
Employee B → SUCCESS
```

---

## Test 9 — Progress Tracking

Expected:

```text
Processed count increases correctly.
```

---

## Test 10 — Duplicate Processing

Click Process twice.

Expected:

```text
Duplicate processing prevented.
```

---

## Test 11 — Generate Payslips

Successful employees:

```text
10
```

Expected:

```text
10 Payslips generated
```

---

## Test 12 — Finalize

Expected:

```text
Status = FINALIZED
```

---

## Test 13 — Finalized Lock

Attempt:

```text
Recalculate employee
```

Expected:

```text
Rejected
```

---

## Test 14 — Unauthorized Access

Normal employee attempts:

```text
POST /api/payruns
```

Expected:

```text
403 Forbidden
```

---

# 87. Definition of Done

## Payrun Creation

* [ ] Create Payrun
* [ ] Select company
* [ ] Select payroll period
* [ ] Validate dates
* [ ] Prevent duplicate active Payruns

## Employee Eligibility

* [ ] Find active employees
* [ ] Validate contracts
* [ ] Validate Salary Structures
* [ ] Show eligibility reasons
* [ ] Support employee selection
* [ ] Track exclusions

## Processing

* [ ] Start processing
* [ ] Lock configuration
* [ ] Track employee status
* [ ] Call Salary Rules Engine
* [ ] Store calculation results
* [ ] Handle employee-level failures
* [ ] Track progress

## Review

* [ ] Show employee results
* [ ] Show errors
* [ ] Show totals
* [ ] Recalculate failed employees

## Payslips

* [ ] Generate Payslips
* [ ] Create Payslip Lines
* [ ] Store snapshots
* [ ] Link Payslips to Payrun

## Finalization

* [ ] Validate results
* [ ] Prevent duplicate finalization
* [ ] Lock Payrun
* [ ] Preserve history

## Security

* [ ] Authentication required
* [ ] Payroll permissions enforced
* [ ] Employees cannot process payroll
* [ ] Company isolation enforced

## Reliability

* [ ] Duplicate processing prevented
* [ ] Transaction protection
* [ ] Concurrency protection
* [ ] Clear error messages
* [ ] Audit trail

---

# 88. Recommended Hackathon MVP

## Must Implement

```text
✓ Create Payrun

✓ Select Payroll Period

✓ Find Eligible Employees

✓ Employee Selection

✓ Pre-processing Validation

✓ Process Payroll

✓ Salary Rules Engine Integration

✓ Employee Processing Status

✓ Payroll Review

✓ Gross / Deduction / Net Totals

✓ Failed Employee Errors

✓ Recalculate Employee

✓ Generate Payslips

✓ Finalize Payrun

✓ Immutable Finalized Results
```

---

## Strong Bonus Features

```text
✓ Live Processing Progress

✓ Background Processing

✓ Detailed Calculation Trace

✓ Employee Exclusion Reasons

✓ Payroll Input Warnings

✓ Full Audit Timeline

✓ Partial Failure Recovery

✓ Employer Cost Summary
```

---

# 89. Recommended Hackathon Demo Flow

The best demonstration flow:

```text
STEP 1

Open Payruns

        ↓

STEP 2

Click

Create Payrun

        ↓

STEP 3

Select:

September 2026

        ↓

STEP 4

System finds:

50 Eligible Employees

        ↓

STEP 5

Review employee selection

        ↓

STEP 6

Click:

Validate Payroll

        ↓

STEP 7

Show:

✓ 48 Valid

⚠ 2 Issues

        ↓

STEP 8

Fix / exclude invalid employees

        ↓

STEP 9

Click:

Process Payroll

        ↓

STEP 10

Show live progress

Employee 1 ✓

Employee 2 ✓

Employee 3 ✓

        ↓

STEP 11

Show Payroll Summary

Total Gross

Total Deductions

Total Net

        ↓

STEP 12

Open one employee

        ↓

STEP 13

Show Salary Rule Calculation

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

        ↓

STEP 14

Generate Payslips

        ↓

STEP 15

Finalize Payrun
```

---

# 90. Complete System Architecture

```text
                         PEOPLEPAY360
                               │
                               ▼
                         PAYRUN WIZARD
                               │
                ┌──────────────┼──────────────┐
                │              │              │
                ▼              ▼              ▼
             COMPANY         PERIOD       EMPLOYEES
                │              │              │
                └──────────────┼──────────────┘
                               ▼
                     ELIGIBILITY ENGINE
                               │
                               ▼
                    SELECTED EMPLOYEES
                               │
                               ▼
                      PRE-VALIDATION
                               │
                               ▼
                    PAYROLL PROCESSING
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
              EMPLOYEE A            EMPLOYEE B
                    │                     │
                    ▼                     ▼
             SALARY ENGINE         SALARY ENGINE
                    │                     │
                    └──────────┬──────────┘
                               ▼
                     PROCESSING RESULTS
                               │
                               ▼
                        PAYROLL REVIEW
                               │
                  ┌────────────┼────────────┐
                  │            │            │
                  ▼            ▼            ▼
               SUCCESS       FAILED       WARNINGS
                  │
                  ▼
              PAYSLIPS
                  │
                  ▼
              FINALIZATION
                  │
                  ▼
            FINALIZED PAYRUN
```

---

# 91. Final Principle

The **Payrun Wizard & Processing module** is the operational control center of payroll.

It does not independently decide salary formulas.

Instead:

```text
Salary Structures
→ Define payroll configuration

Salary Rules Engine
→ Calculates salary

Payrun
→ Organizes and processes employees

Payslip
→ Stores the final employee payroll document
```

The complete transformation is:

```text
EMPLOYEES
      +
CONTRACTS
      +
ATTENDANCE
      +
TIME OFF
      +
SALARY STRUCTURES
      +
SALARY RULES

            ↓

      PAYRUN WIZARD

            ↓

    EMPLOYEE ELIGIBILITY

            ↓

      PAYROLL PROCESSING

            ↓

     SALARY RULES ENGINE

            ↓

      EMPLOYEE RESULTS

            ↓

      PAYROLL REVIEW

            ↓

        PAYSLIPS

            ↓

    PAYRUN FINALIZATION
```

The module must be:

```text
Controlled

Accurate

Traceable

Secure

Recoverable

Auditable

Scalable

Demo-friendly
```

This is the module that turns all PeoplePay360 HR and payroll configuration into a real-world **monthly payroll operation**.

```
```