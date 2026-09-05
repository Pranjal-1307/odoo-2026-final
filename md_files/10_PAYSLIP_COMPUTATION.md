# `10_PAYSLIP_COMPUTATION.md`

````markdown
# PeoplePay360 — Payslip Computation & Employee Salary Breakdown Specification

## 1. Purpose

The **Payslip Computation module** is responsible for converting the payroll calculation result into a complete, structured, employee-specific salary document.

This module sits after the Payrun and Salary Rules Engine.

The overall flow is:

```text
EMPLOYEE
    +
CONTRACT
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
        ↓
SALARY RULES ENGINE
        ↓
PAYRUN PROCESSING
        ↓
PAYSLIP COMPUTATION
        ↓
FINAL PAYSLIP
````

The Payslip Computation module answers:

> **Exactly how was this employee's salary calculated for this payroll period?**

It must provide a complete and traceable breakdown of:

```text
Earnings

Allowances

Deductions

Employer Contributions

Gross Salary

Net Salary
```

---

# 2. Position in the PeoplePay360 System

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
                ↓
09_PAYRUN_WIZARD_PROCESSING
                ↓
10_PAYSLIP_COMPUTATION
                ↓
11_PAYSLIP_VIEW_EXPORT
                ↓
12_PAYROLL_REPORTING
```

This module transforms a payroll calculation into an official employee payroll record.

---

# 3. What Is a Payslip?

A **Payslip** is the employee-level payroll document generated for one employee for one payroll period.

Example:

```text
Employee:
Aarav Mehta

Payroll Period:
01 September 2026 – 30 September 2026

Basic Salary:
₹50,000

House Rent Allowance:
₹20,000

Special Allowance:
₹10,000

Gross Salary:
₹80,000

Professional Tax:
₹2,500

PF:
₹6,000

Total Deductions:
₹8,500

NET SALARY:
₹71,500
```

The Payslip must clearly explain:

```text
What the employee earned

What was deducted

How totals were calculated

What the employee will receive
```

---

# 4. Core Responsibility

The Payslip module must:

```text
✓ Create employee payroll records

✓ Store payroll period information

✓ Store employee details

✓ Store contract information

✓ Store earnings

✓ Store deductions

✓ Store employer contributions

✓ Calculate and store totals

✓ Preserve calculation history

✓ Link the Payslip to the Payrun

✓ Prevent duplicate Payslips

✓ Lock finalized Payslips
```

---

# 5. Important Architectural Principle

The Payslip should **not independently recreate payroll logic**.

The responsibilities must remain separated.

```text
SALARY STRUCTURE
        ↓
Defines payroll configuration

SALARY RULES ENGINE
        ↓
Calculates salary components

PAYRUN
        ↓
Coordinates payroll processing

PAYSLIP COMPUTATION
        ↓
Stores and organizes employee result

PAYSLIP VIEW / EXPORT
        ↓
Displays and generates employee document
```

This separation is extremely important.

Do not put all salary calculation logic inside the Payslip model.

---

# 6. Payslip Computation Flow

```text
PAYRUN
   │
   ▼
SELECT EMPLOYEE
   │
   ▼
LOAD CONTRACT
   │
   ▼
LOAD PAYROLL CONTEXT
   │
   ├── Attendance
   ├── Time Off
   ├── Working Schedule
   └── Salary Structure
   │
   ▼
RUN SALARY RULES ENGINE
   │
   ▼
GET RULE RESULTS
   │
   ├── Earnings
   ├── Deductions
   ├── Contributions
   └── Totals
   │
   ▼
CREATE PAYSLIP
   │
   ▼
CREATE PAYSLIP LINES
   │
   ▼
CALCULATE TOTALS
   │
   ▼
STORE SNAPSHOT
   │
   ▼
READY FOR REVIEW / FINALIZATION
```

---

# 7. One Employee, One Payslip, One Period

The core business concept is:

```text
ONE EMPLOYEE
        +
ONE PAYROLL PERIOD
        +
ONE PAYRUN
        ↓
ONE PAYSLIP
```

Example:

```text
Employee:
Aarav Mehta

Period:
September 2026

Payrun:
September 2026 Payroll

Payslip:
PS-2026-0001
```

---

# 8. Payslip Lifecycle

Recommended Payslip states:

```text
DRAFT
   ↓
COMPUTED
   ↓
REVIEW
   ↓
CONFIRMED
   ↓
FINALIZED
```

Possible additional state:

```text
CANCELLED
```

Recommended MVP lifecycle:

```text
DRAFT
   ↓
COMPUTED
   ↓
FINALIZED
```

---

# 9. Payslip Status Definitions

## DRAFT

The Payslip exists but calculation may not be complete.

```text
Status:
DRAFT
```

---

## COMPUTED

All payroll rules have been calculated.

```text
Status:
COMPUTED
```

The user can review:

```text
Earnings

Deductions

Net Salary

Calculation Lines
```

---

## REVIEW

The payroll administrator is reviewing the Payslip.

Recommended for a stronger workflow.

---

## CONFIRMED

The Payslip is accepted as correct.

Optional intermediate state.

---

## FINALIZED

The Payslip is official and locked.

```text
Status:
FINALIZED
```

After finalization:

```text
Salary lines cannot be silently changed.

Totals cannot be silently changed.

Historical payroll data must remain preserved.
```

---

## CANCELLED

The Payslip was cancelled before becoming an official payroll record.

---

# 10. Payslip Header

Every Payslip should contain a header.

Recommended fields:

```text
Payslip Number

Employee

Employee ID

Company

Department

Job Position

Payroll Period

Period Start

Period End

Payrun Reference

Contract Reference

Salary Structure

Status
```

Example:

```text
Payslip No:
PS-2026-0001

Employee:
Aarav Mehta

Employee ID:
EMP-001

Company:
ABC Technologies Pvt. Ltd.

Department:
Engineering

Payroll Period:
September 2026

01 Sep 2026 – 30 Sep 2026

Salary Structure:
Standard Monthly

Status:
FINALIZED
```

---

# 11. Payslip Number Generation

Every Payslip should have a unique reference.

Example:

```text
PS-2026-0001

PS-2026-0002

PS-2026-0003
```

Recommended format:

```text
PS-{YEAR}-{SEQUENCE}
```

Example:

```text
PS-2026-0047
```

Alternative:

```text
PAY/2026/09/0047
```

The exact format can follow the PeoplePay360 design.

---

# 12. Payslip Sections

The Payslip should be divided into clear sections.

```text
1. Employee Information

2. Payroll Period

3. Earnings

4. Deductions

5. Employer Contributions

6. Salary Summary

7. Calculation Information
```

---

# 13. Complete Payslip Structure

```text
┌───────────────────────────────────────────────┐
│               PEOPLEPAY360                    │
│                  PAYSLIP                      │
├───────────────────────────────────────────────┤
│ Employee: Aarav Mehta                         │
│ Employee ID: EMP-001                          │
│ Period: 01 Sep – 30 Sep 2026                 │
│ Payslip No: PS-2026-0001                      │
├───────────────────────────────────────────────┤
│ EARNINGS                                      │
│                                               │
│ Basic Salary                     ₹50,000      │
│ HRA                              ₹20,000      │
│ Special Allowance                ₹10,000      │
│                                               │
│ GROSS SALARY                     ₹80,000      │
├───────────────────────────────────────────────┤
│ DEDUCTIONS                                    │
│                                               │
│ Provident Fund                    ₹6,000      │
│ Professional Tax                  ₹2,500      │
│                                               │
│ TOTAL DEDUCTIONS                  ₹8,500      │
├───────────────────────────────────────────────┤
│ NET SALARY                       ₹71,500      │
├───────────────────────────────────────────────┤
│ Employer Contributions                        │
│ Provident Fund                    ₹6,000      │
└───────────────────────────────────────────────┘
```

---

# 14. Payslip Lines

A Payslip should contain multiple **Payslip Lines**.

Each line represents a salary component.

Example:

```text
Basic Salary

House Rent Allowance

Special Allowance

Provident Fund

Professional Tax
```

Each line should be linked to the salary rule that produced it.

---

# 15. Payslip Line Data Model

Recommended fields:

```text
id

payslip_id

salary_rule_id

code

name

category

sequence

amount

quantity

rate

total

is_employer_contribution
```

Optional calculation metadata:

```text
base_amount

calculation_type

calculation_expression
```

---

# 16. Payslip Line Example

```text
Payslip:
PS-2026-0001

Rule:
BASIC

Name:
Basic Salary

Category:
EARNING

Amount:
₹50,000

Quantity:
1

Rate:
100%

Total:
₹50,000
```

---

# 17. Salary Component Categories

Recommended categories:

```text
EARNING

DEDUCTION

EMPLOYER_CONTRIBUTION
```

Optional grouping:

```text
BASIC

ALLOWANCE

BONUS

OVERTIME

TAX

STATUTORY_DEDUCTION

OTHER_DEDUCTION
```

The UI can use both:

```text
Category
+
Subcategory
```

---

# 18. Earnings Section

Earnings are positive salary components.

Examples:

```text
Basic Salary

House Rent Allowance

Transport Allowance

Medical Allowance

Special Allowance

Bonus

Overtime
```

Example:

```text
EARNINGS

Basic Salary                  ₹50,000

HRA                           ₹20,000

Special Allowance             ₹10,000

-----------------------------------

TOTAL EARNINGS                ₹80,000
```

---

# 19. Deductions Section

Deductions reduce employee take-home salary.

Examples:

```text
Provident Fund

Professional Tax

Income Tax

Loan Deduction

Unpaid Leave Deduction
```

Example:

```text
DEDUCTIONS

Provident Fund                 ₹6,000

Professional Tax               ₹2,500

-----------------------------------

TOTAL DEDUCTIONS               ₹8,500
```

---

# 20. Employer Contributions

Employer contributions are costs paid by the employer.

They generally do not directly reduce employee take-home pay.

Examples:

```text
Employer PF

Employer Insurance

Employer Pension Contribution
```

Example:

```text
EMPLOYER CONTRIBUTIONS

Employer PF                    ₹6,000
```

---

# 21. Gross Salary Computation

Gross Salary is calculated from applicable earnings.

Conceptually:

```text
GROSS SALARY
=
SUM(EARNINGS)
```

Example:

```text
Basic Salary:
₹50,000

HRA:
₹20,000

Special Allowance:
₹10,000
```

Therefore:

```text
GROSS SALARY

=
₹80,000
```

---

# 22. Total Deductions Computation

Conceptually:

```text
TOTAL DEDUCTIONS
=
SUM(DEDUCTION LINES)
```

Example:

```text
Provident Fund:
₹6,000

Professional Tax:
₹2,500
```

Result:

```text
TOTAL DEDUCTIONS

=
₹8,500
```

---

# 23. Net Salary Computation

The core calculation is:

```text
NET SALARY
=
GROSS SALARY
-
TOTAL DEDUCTIONS
```

Example:

```text
Gross Salary:
₹80,000

Total Deductions:
₹8,500
```

Therefore:

```text
NET SALARY:

₹71,500
```

---

# 24. Employer Cost Computation

Employer Cost can be calculated separately.

Conceptually:

```text
EMPLOYER COST
=
GROSS SALARY
+
EMPLOYER CONTRIBUTIONS
```

Example:

```text
Gross Salary:
₹80,000

Employer PF:
₹6,000
```

Result:

```text
TOTAL EMPLOYER COST:

₹86,000
```

This should be visible to authorized payroll users.

It does not necessarily need to be visible to every employee.

---

# 25. Payroll Calculation Snapshot

A critical requirement is preserving payroll history.

Suppose:

```text
September 2026 Payslip
```

was calculated using:

```text
Basic Salary:
₹50,000
```

Later, the employee receives a new contract:

```text
Basic Salary:
₹60,000
```

The old September Payslip must remain:

```text
₹50,000
```

Therefore, the Payslip must store a snapshot of the payroll result.

---

# 26. Snapshot Principle

Do not depend exclusively on live configuration after finalization.

Bad design:

```text
Old Payslip
        ↓
Reads current Salary Rule
        ↓
Current rule changed
        ↓
Old Payslip changes
```

Correct design:

```text
Payroll Calculation
        ↓
Create Snapshot
        ↓
Store Payslip Lines
        ↓
Finalize
        ↓
Historical Payslip remains unchanged
```

---

# 27. What Must Be Snapshotted?

Recommended snapshot information:

```text
Employee Information

Contract Reference

Salary Structure

Salary Rule Code

Salary Rule Name

Calculated Amount

Rule Sequence

Category

Payroll Period

Attendance Summary

Time Off Summary

Calculation Timestamp
```

For advanced traceability:

```text
Rule Calculation Context

Rule Inputs

Formula Used

Intermediate Values
```

---

# 28. Contract Snapshot

The Payslip should preserve the relevant contract context.

Example:

```text
Contract:
CT-2026-001

Contract Start:
01 January 2026

Contract End:
31 December 2026

Basic Wage:
₹50,000
```

If the contract later changes, historical Payslip data must remain stable.

---

# 29. Employee Snapshot

For payroll history, store relevant employee information.

Recommended:

```text
Employee Name

Employee Code

Department

Job Position
```

This allows historical Payslips to remain meaningful even if the employee later changes departments.

---

# 30. Attendance Snapshot

If payroll depends on attendance, store the summarized values used.

Example:

```text
Scheduled Days:
22

Worked Days:
21

Absent Days:
1

Overtime Hours:
5
```

The exact stored fields depend on the implemented attendance rules.

---

# 31. Time Off Snapshot

Store relevant time-off data used in payroll.

Example:

```text
Paid Leave Days:
2

Unpaid Leave Days:
1
```

If unpaid leave affects salary:

```text
Unpaid Leave Deduction:
₹2,000
```

must be traceable.

---

# 32. Salary Rule Calculation Result

The Salary Rules Engine should return structured results.

Conceptually:

```text
{
    "lines": [
        {
            "code": "BASIC",
            "name": "Basic Salary",
            "category": "EARNING",
            "amount": 50000
        },
        {
            "code": "HRA",
            "name": "House Rent Allowance",
            "category": "EARNING",
            "amount": 20000
        },
        {
            "code": "PF",
            "name": "Provident Fund",
            "category": "DEDUCTION",
            "amount": 6000
        }
    ]
}
```

The Payslip module converts these results into persistent Payslip Lines.

---

# 33. Rule-to-Payslip Conversion

```text
SALARY RULE ENGINE RESULT
        │
        ▼
RULE RESULT

Code: BASIC
Amount: ₹50,000
        │
        ▼
PAYSLIP LINE

Basic Salary
₹50,000
```

This happens for every applicable salary rule.

---

# 34. Payslip Computation Algorithm

Conceptually:

```text
function computePayslip(employee, period):

    validateEmployee()

    contract = getApplicableContract()

    validateContract()

    salaryStructure = getSalaryStructure()

    validateSalaryStructure()

    attendanceData = getAttendanceSummary()

    timeOffData = getTimeOffSummary()

    payrollContext = buildPayrollContext()

    ruleResults = salaryEngine.calculate(
        employee,
        contract,
        period,
        payrollContext
    )

    payslip = createPayslipHeader()

    for ruleResult in ruleResults:

        createPayslipLine(ruleResult)

    calculateTotals()

    storeSnapshots()

    markPayslipComputed()

    return payslip
```

---

# 35. Validation Before Computation

Before computing a Payslip, validate:

```text
✓ Employee exists

✓ Employee is active

✓ Payroll period is valid

✓ Applicable contract exists

✓ Salary Structure exists

✓ Salary Rules are valid

✓ No duplicate finalized Payslip exists
```

---

# 36. Applicable Contract Validation

The contract must overlap the payroll period.

Example:

```text
Contract:

01 January 2026
to
31 December 2026
```

Payroll Period:

```text
01 September 2026
to
30 September 2026
```

Result:

```text
VALID ✓
```

---

# 37. Missing Contract Error

Example:

```text
Employee:
Aarav Mehta

Payroll Period:
September 2026

Applicable Contract:
None
```

Result:

```text
PAYSLIP COMPUTATION FAILED

Reason:

No applicable contract exists for this payroll period.
```

---

# 38. Missing Salary Structure Error

Example:

```text
Contract:
Active

Salary Structure:
None
```

Result:

```text
PAYSLIP COMPUTATION FAILED

Reason:

No Salary Structure is assigned to the applicable contract.
```

---

# 39. Duplicate Payslip Protection

The system must prevent accidental duplicate Payslips.

Bad:

```text
Aarav

September 2026

Payslip #1

Payslip #2
```

Recommended protection:

```text
UNIQUE:

employee_id
+
period_start
+
period_end
+
company_id
```

The exact constraint may also depend on the Payrun design.

---

# 40. Payslip and Payrun Relationship

```text
PAYRUN
   │
   ├── PAYSLIP 1
   │
   ├── PAYSLIP 2
   │
   ├── PAYSLIP 3
   │
   └── PAYSLIP N
```

Database relationship:

```text
payslip.payrun_id
```

Each successful Payrun employee should produce one Payslip.

---

# 41. Payslip and Employee Relationship

```text
EMPLOYEE
    │
    ├── January Payslip
    │
    ├── February Payslip
    │
    ├── March Payslip
    │
    └── September Payslip
```

Database relationship:

```text
payslip.employee_id
```

---

# 42. Payslip Database Model

Recommended table:

```text
payslips
```

Fields:

```text
id

number

payrun_id

employee_id

company_id

contract_id

salary_structure_id

period_start

period_end

status

gross_salary

total_earnings

total_deductions

net_salary

total_employer_contributions

total_employer_cost

computed_at

finalized_at

created_at

updated_at
```

---

# 43. Payslip Line Database Model

Recommended table:

```text
payslip_lines
```

Fields:

```text
id

payslip_id

salary_rule_id

code

name

category

sequence

amount

quantity

rate

total

base_amount

is_employer_contribution

created_at
```

---

# 44. Recommended Relationships

```text
EMPLOYEE
    │
    ▼
PAYSLIP
    │
    ├───────────► CONTRACT
    │
    ├───────────► SALARY STRUCTURE
    │
    ├───────────► PAYRUN
    │
    ▼
PAYSLIP LINES
    │
    ▼
SALARY RULE SNAPSHOTS
```

---

# 45. Total Calculation Process

After all Payslip Lines are created:

```text
PAYSLIP LINES
      │
      ├── Earnings
      │
      ├── Deductions
      │
      └── Employer Contributions
                │
                ▼
           CALCULATE TOTALS
                │
                ▼
          STORE SUMMARY
```

---

# 46. Payslip Summary Fields

The summary must include:

```text
Total Earnings

Gross Salary

Total Deductions

Net Salary

Employer Contributions

Employer Cost
```

---

# 47. Calculation Validation

Before marking the Payslip as computed:

```text
NET SALARY
=
GROSS SALARY
-
TOTAL DEDUCTIONS
```

must be validated.

Example:

```text
Gross:
₹80,000

Deductions:
₹8,500

Expected Net:
₹71,500
```

If stored Net differs:

```text
Validation Error
```

---

# 48. Negative Salary Handling

The system should define how to handle:

```text
Gross Salary:
₹10,000

Deductions:
₹15,000
```

Result:

```text
Net Salary:
-₹5,000
```

Recommended hackathon behavior:

```text
Show warning / validation error

Net salary cannot become negative
without an explicit adjustment policy.
```

---

# 49. Zero Salary Payslip

Possible scenario:

```text
Employee had no payable earnings.
```

Example:

```text
Gross:
₹0

Deductions:
₹0

Net:
₹0
```

The system should decide whether:

```text
Create Zero Payslip
```

or:

```text
Skip Employee
```

For MVP, the behavior should be explicit and consistent.

---

# 50. Payslip Computation Status

Individual computation statuses can include:

```text
PENDING

COMPUTING

COMPUTED

FAILED

FINALIZED
```

Example:

```text
Aarav Mehta

Status:
COMPUTED ✓
```

---

# 51. Computation Error Handling

Example:

```text
PAYSLIP COMPUTATION FAILED

Employee:
Rahul Patel

Rule:
PF

Error:
Percentage base BASIC could not be resolved.
```

The system should store:

```text
Error Code

Error Message

Rule Code

Timestamp
```

---

# 52. Calculation Trace

A strong PeoplePay360 feature is a detailed calculation trace.

Example:

```text
BASIC

Fixed Amount

₹50,000
        ↓

HRA

40% of BASIC

₹20,000
        ↓

SPECIAL

Fixed Amount

₹10,000
        ↓

GROSS

₹80,000
        ↓

PF

12% of BASIC

₹6,000
        ↓

PROFESSIONAL TAX

₹2,500
        ↓

NET

₹71,500
```

This makes payroll explainable.

---

# 53. Calculation Trace Data

Recommended fields:

```text
Rule Code

Rule Name

Calculation Type

Input Values

Formula

Calculated Result

Execution Order
```

This can be stored as:

```text
payslip_calculation_trace
```

or JSON snapshot data.

---

# 54. Calculation Trace Example

```text
Rule:
HRA

Code:
HRA

Type:
PERCENTAGE

Base:
BASIC

Base Amount:
₹50,000

Rate:
40%

Result:
₹20,000
```

---

# 55. Payslip Detail Screen

Recommended UI:

```text
┌─────────────────────────────────────────────────────┐
│ Payslip #PS-2026-0001             FINALIZED        │
├─────────────────────────────────────────────────────┤
│ Aarav Mehta                                        │
│ Engineering                                         │
│ 01 Sep 2026 – 30 Sep 2026                          │
├─────────────────────────────────────────────────────┤
│ SUMMARY                                             │
│                                                     │
│ Gross Salary         ₹80,000                        │
│ Deductions          -₹8,500                         │
│ NET SALARY           ₹71,500                        │
├─────────────────────────────────────────────────────┤
│ EARNINGS                                            │
│                                                     │
│ Basic Salary        ₹50,000                         │
│ HRA                 ₹20,000                         │
│ Special Allowance   ₹10,000                         │
├─────────────────────────────────────────────────────┤
│ DEDUCTIONS                                          │
│                                                     │
│ Provident Fund      ₹6,000                          │
│ Professional Tax    ₹2,500                          │
├─────────────────────────────────────────────────────┤
│ EMPLOYER CONTRIBUTIONS                              │
│                                                     │
│ Employer PF         ₹6,000                          │
└─────────────────────────────────────────────────────┘
```

---

# 56. Payslip List UI

Recommended:

```text
------------------------------------------------------------------

Payslip No        Employee        Period       Net         Status

PS-2026-0001      Aarav Mehta     Sep 2026     ₹71,500     FINALIZED

PS-2026-0002      Priya Shah      Sep 2026     ₹64,200     FINALIZED

PS-2026-0003      Rahul Patel     Sep 2026     ₹58,000     COMPUTED

------------------------------------------------------------------
```

Filters:

```text
Employee

Company

Payroll Period

Status
```

---

# 57. Payslip Search

The payroll administrator should be able to search using:

```text
Employee Name

Employee ID

Payslip Number

Payroll Period
```

---

# 58. Payslip Employee Access

Employees should only access:

```text
THEIR OWN PAYSLIPS
```

Example:

```text
Aarav Mehta
```

can access:

```text
Aarav's Payslips ✓
```

but not:

```text
Priya's Payslips ✗
```

This must be enforced by backend authorization, not only frontend filtering.

---

# 59. Payroll Administrator Access

Authorized roles may access:

```text
All company Payslips

Payrun-related Payslips

Calculation details

Employer contribution data
```

Recommended roles:

```text
ADMIN

HR_MANAGER

PAYROLL_MANAGER
```

---

# 60. RBAC Permissions

Recommended permissions:

```text
payslip.view

payslip.view_own

payslip.compute

payslip.recompute

payslip.finalize

payslip.cancel

payslip.export
```

---

# 61. Finalized Payslip Immutability

After:

```text
Status = FINALIZED
```

Do not allow direct modification of:

```text
Employee

Payroll Period

Contract

Payslip Lines

Gross Salary

Deductions

Net Salary
```

---

# 62. Correcting Finalized Payroll

Do not silently edit historical Payslips.

Recommended correction approach:

```text
Original Payslip
        ↓
Remains unchanged

Adjustment / Correction
        ↓
Created separately
```

For the hackathon MVP, show:

```text
FINALIZED PAYSLIP IS LOCKED
```

Future enhancement:

```text
Adjustment Payslip
```

---

# 63. Recompute Payslip

Recomputation is allowed only before finalization.

Flow:

```text
DRAFT / COMPUTED
        ↓
Recompute
        ↓
Delete or replace draft lines
        ↓
Run Salary Engine again
        ↓
Create new calculation result
```

After finalization:

```text
Recompute = NOT ALLOWED
```

---

# 64. Recompute Safety

When recomputing:

```text
Do not create duplicate Payslip Lines.
```

Recommended:

```text
Clear old draft lines
        ↓
Run calculation
        ↓
Create fresh lines
        ↓
Recalculate totals
```

Use transactional protection.

---

# 65. Attendance and Payslip

Attendance information may affect Payslip components.

Example:

```text
Scheduled Days:
22

Worked Days:
20

Absent Days:
2
```

Depending on salary rules:

```text
Unpaid Absence Deduction
```

may be generated.

The Payslip should show the resulting salary line.

---

# 66. Time Off and Payslip

Time off may affect payroll.

Example:

```text
Paid Leave:
3 Days
```

Result:

```text
No salary deduction
```

Example:

```text
Unpaid Leave:
2 Days
```

Possible result:

```text
Unpaid Leave Deduction
₹4,000
```

The exact calculation comes from the Salary Rules Engine.

---

# 67. Working Schedule and Payslip

Working schedules can provide payroll context.

Example:

```text
Scheduled Working Days:
22
```

This may influence:

```text
Daily Wage

Attendance Proration

Unpaid Leave Calculation
```

---

# 68. Contract Changes During Payroll

Example:

```text
Contract A

01 Sep – 15 Sep
```

Then:

```text
Contract B

16 Sep – 30 Sep
```

A future advanced implementation may support:

```text
Multi-contract Payslip Proration
```

For the hackathon MVP, define and validate the selected contract behavior clearly.

Recommended MVP approach:

```text
Use the contract applicable to the payroll period.

If multiple overlapping contracts exist,
raise a validation issue unless explicitly supported.
```

---

# 69. Mid-Period Joining

Example:

```text
Employee joins:

15 September 2026
```

Payroll Period:

```text
01 September – 30 September
```

Future enhancement:

```text
Prorated salary
```

For the MVP:

```text
Proration must only occur if implemented by Salary Rules.
```

The Payslip module itself should not invent proration logic.

---

# 70. Mid-Period Exit

Example:

```text
Employee leaves:

20 September 2026
```

The Salary Rules Engine may calculate:

```text
Prorated salary

Final deductions

Leave adjustments
```

The Payslip stores the final calculated result.

---

# 71. Computation Transaction

Payslip computation should be atomic.

Recommended flow:

```text
BEGIN TRANSACTION

Create Payslip

Create Payslip Lines

Calculate Totals

Validate Totals

Store Snapshot

Update Status = COMPUTED

COMMIT
```

If something fails:

```text
ROLLBACK
```

This prevents:

```text
Payslip Header Exists

BUT

Payslip Lines Missing
```

---

# 72. Finalization Transaction

Finalization should also be protected.

```text
BEGIN TRANSACTION

Validate Payslip

Lock Calculation Data

Store Final Timestamp

Set Status = FINALIZED

COMMIT
```

---

# 73. API Design

## Create Payslip

```http
POST /api/payslips
```

Request:

```json
{
  "employee_id": 101,
  "payrun_id": 15,
  "period_start": "2026-09-01",
  "period_end": "2026-09-30"
}
```

---

## Compute Payslip

```http
POST /api/payslips/{payslip_id}/compute
```

---

## Get Payslip

```http
GET /api/payslips/{payslip_id}
```

---

## List Payslips

```http
GET /api/payslips
```

Filters:

```text
employee_id

company_id

period_start

period_end

status
```

---

## Recompute Payslip

```http
POST /api/payslips/{payslip_id}/recompute
```

---

## Finalize Payslip

```http
POST /api/payslips/{payslip_id}/finalize
```

---

## Cancel Payslip

```http
POST /api/payslips/{payslip_id}/cancel
```

---

# 74. Example API Response

```json
{
  "id": 501,
  "number": "PS-2026-0001",
  "employee": {
    "id": 101,
    "name": "Aarav Mehta"
  },
  "period": {
    "start": "2026-09-01",
    "end": "2026-09-30"
  },
  "status": "COMPUTED",
  "totals": {
    "gross": 80000,
    "deductions": 8500,
    "net": 71500
  }
}
```

---

# 75. Backend Architecture

Recommended module structure:

```text
backend/
│
├── payroll/
│
│   ├── payslips/
│   │
│   │   ├── payslip_service
│   │   ├── computation_service
│   │   ├── totals_service
│   │   ├── snapshot_service
│   │   ├── finalization_service
│   │   └── payslip_repository
│   │
│   ├── salary_engine/
│   │
│   ├── payrun/
│   │
│   └── models/
```

---

# 76. Service Responsibilities

## PayslipService

Responsible for:

```text
Create Payslip

Retrieve Payslip

List Payslips

Cancel Payslip
```

---

## ComputationService

Responsible for:

```text
Build Payroll Context

Call Salary Rules Engine

Create Payslip Lines

Update Computation Status
```

---

## TotalsService

Responsible for:

```text
Calculate Earnings

Calculate Deductions

Calculate Net Salary

Calculate Employer Cost

Validate Totals
```

---

## SnapshotService

Responsible for:

```text
Employee Snapshot

Contract Snapshot

Rule Snapshot

Attendance Snapshot

Time Off Snapshot
```

---

## FinalizationService

Responsible for:

```text
Validate Payslip

Lock Data

Finalize Payslip
```

---

# 77. Error Categories

Recommended categories:

```text
VALIDATION_ERROR

EMPLOYEE_ERROR

CONTRACT_ERROR

SALARY_STRUCTURE_ERROR

SALARY_RULE_ERROR

ATTENDANCE_ERROR

TIME_OFF_ERROR

CALCULATION_ERROR

SYSTEM_ERROR
```

---

# 78. User-Friendly Errors

Bad:

```text
Internal Server Error
```

Better:

```text
Payslip computation failed.

Employee:
Rahul Patel

Reason:
No active Salary Structure was found
for the selected payroll period.
```

---

# 79. Audit Trail

Track important actions.

```text
Payslip Created

Payslip Computed

Payslip Recomputed

Payslip Reviewed

Payslip Finalized

Payslip Cancelled
```

Example:

```text
30 Sep 2026 — 10:30 AM

Payroll Manager

Computed Payslip
PS-2026-0001
```

---

# 80. Audit Log Fields

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

# 81. Payslip Dashboard Metrics

Payroll administrators may see:

```text
Total Payslips

Draft Payslips

Computed Payslips

Failed Payslips

Finalized Payslips

Total Gross

Total Deductions

Total Net Payroll
```

---

# 82. Payslip Summary Cards

Recommended UI:

```text
┌──────────────┐
│ Total Gross  │
│ ₹3,675,000   │
└──────────────┘

┌──────────────┐
│ Deductions   │
│ ₹560,000     │
└──────────────┘

┌──────────────┐
│ Net Payroll  │
│ ₹3,115,000   │
└──────────────┘
```

---

# 83. Security Requirements

The Payslip module contains highly sensitive payroll data.

The system must enforce:

```text
Authentication

Role-Based Access Control

Company Isolation

Employee Self-Service Restrictions

Backend Authorization
```

---

# 84. Data Access Rules

## ADMIN

Can access:

```text
All authorized company Payslips
```

---

## PAYROLL_MANAGER

Can:

```text
Compute Payslips

Review Payslips

Finalize Payslips

View Payroll Data
```

---

## HR_MANAGER

Can access payroll according to configured permissions.

---

## EMPLOYEE

Can access:

```text
Only their own finalized Payslips.
```

---

# 85. Company Isolation

A Payslip belongs to a company.

```text
Company A Payslip
        ↓
Visible to Company A authorized users
```

Never:

```text
Company A User
        ↓
Views Company B Payslip
```

All backend queries must filter by company authorization.

---

# 86. Performance Considerations

For a hackathon MVP:

```text
Individual Payslip computation
```

is sufficient.

For future scale:

```text
PAYRUN
   ↓
Background Processing Queue
   ↓
Compute Payslips
   ↓
Update Progress
```

The architecture should support batch processing.

---

# 87. Idempotency

Repeated compute requests should not create duplicate records.

Example:

```text
COMPUTE PAYSLIP
```

clicked twice.

Bad:

```text
Basic Salary
Basic Salary
Basic Salary
```

Correct:

```text
Existing Draft Calculation
        ↓
Replace / Recompute Safely
```

---

# 88. Concurrency Protection

Two administrators may attempt:

```text
COMPUTE PAYSLIP
```

simultaneously.

Recommended:

```text
Status Lock

OR

Database Row Lock
```

If already computing:

```text
409 Conflict

Payslip computation is already in progress.
```

---

# 89. Testing Requirements

## Test 1 — Valid Payslip

Input:

```text
Employee

Valid Contract

Salary Structure

Salary Rules
```

Expected:

```text
Payslip computed successfully.
```

---

## Test 2 — Earnings Calculation

Expected:

```text
Gross Salary
=
Sum of Earnings
```

---

## Test 3 — Deductions Calculation

Expected:

```text
Total Deductions
=
Sum of Deductions
```

---

## Test 4 — Net Salary

Expected:

```text
Net Salary
=
Gross
-
Deductions
```

---

## Test 5 — Employer Cost

Expected:

```text
Employer Cost
=
Gross
+
Employer Contributions
```

---

## Test 6 — Missing Contract

Expected:

```text
Computation failure
```

---

## Test 7 — Missing Salary Structure

Expected:

```text
Computation failure
```

---

## Test 8 — Invalid Salary Rule

Expected:

```text
Rule calculation error
```

---

## Test 9 — Duplicate Payslip

Expected:

```text
Duplicate finalized Payslip prevented
```

---

## Test 10 — Recompute

Expected:

```text
Old draft lines replaced safely.
```

---

## Test 11 — Finalization

Expected:

```text
Status = FINALIZED
```

---

## Test 12 — Finalized Lock

Attempt:

```text
Modify Payslip Line
```

Expected:

```text
Rejected
```

---

## Test 13 — Employee Security

Employee attempts to access another employee's Payslip.

Expected:

```text
403 Forbidden
```

---

## Test 14 — Company Isolation

Company A user attempts to access Company B Payslip.

Expected:

```text
403 Forbidden
```

---

# 90. Definition of Done

## Payslip Creation

* [ ] Create Payslip Header
* [ ] Generate unique Payslip Number
* [ ] Link Employee
* [ ] Link Payrun
* [ ] Link Contract
* [ ] Store Payroll Period

## Computation

* [ ] Validate Employee
* [ ] Validate Contract
* [ ] Validate Salary Structure
* [ ] Build Payroll Context
* [ ] Call Salary Rules Engine
* [ ] Receive Rule Results
* [ ] Create Payslip Lines

## Totals

* [ ] Calculate Earnings
* [ ] Calculate Gross Salary
* [ ] Calculate Deductions
* [ ] Calculate Net Salary
* [ ] Calculate Employer Contributions
* [ ] Calculate Employer Cost

## Snapshots

* [ ] Employee Snapshot
* [ ] Contract Snapshot
* [ ] Salary Rule Snapshot
* [ ] Attendance Summary
* [ ] Time Off Summary

## Lifecycle

* [ ] Draft
* [ ] Computed
* [ ] Finalized
* [ ] Cancelled

## Security

* [ ] Authentication
* [ ] RBAC
* [ ] Employee Self-Service Restriction
* [ ] Company Isolation

## Reliability

* [ ] Duplicate Prevention
* [ ] Transaction Protection
* [ ] Idempotent Computation
* [ ] Concurrency Protection
* [ ] Clear Errors

---

# 91. Recommended Hackathon MVP

The MVP must implement:

```text
✓ Payslip Creation

✓ Employee Information

✓ Payroll Period

✓ Salary Rule Integration

✓ Earnings Lines

✓ Deduction Lines

✓ Employer Contribution Lines

✓ Gross Salary

✓ Total Deductions

✓ Net Salary

✓ Payslip Detail Screen

✓ Calculation Trace

✓ Payrun Integration

✓ Finalization

✓ Immutable Historical Result
```

---

# 92. Strong Bonus Features

```text
✓ Detailed Formula Trace

✓ Attendance Snapshot

✓ Time Off Snapshot

✓ Employer Cost Breakdown

✓ Adjustment Payslips

✓ Mid-Period Contract Proration

✓ Batch Payslip Processing

✓ PDF Export

✓ Employee Self-Service Portal
```

---

# 93. Recommended Hackathon Demo Flow

The demonstration should clearly show the full calculation journey.

```text
STEP 1

Open September 2026 Payrun

        ↓

STEP 2

Select Employee

Aarav Mehta

        ↓

STEP 3

Click:

View Payslip

        ↓

STEP 4

Show Employee Details

        ↓

STEP 5

Show Payroll Period

        ↓

STEP 6

Show Earnings

Basic Salary

HRA

Special Allowance

        ↓

STEP 7

Show Gross Salary

        ↓

STEP 8

Show Deductions

PF

Professional Tax

        ↓

STEP 9

Show Net Salary

        ↓

STEP 10

Open:

Calculation Trace

        ↓

STEP 11

Show:

BASIC
↓
HRA
↓
ALLOWANCE
↓
GROSS
↓
PF
↓
DEDUCTIONS
↓
NET

        ↓

STEP 12

Finalize Payslip
```

---

# 94. Complete Data Flow

```text
EMPLOYEE MASTER
        │
        ▼
CONTRACT MANAGEMENT
        │
        ▼
WORKING SCHEDULE
        │
        ├───────────────┐
        ▼               ▼
ATTENDANCE          TIME OFF
        │               │
        └───────┬───────┘
                ▼
        SALARY STRUCTURE
                │
                ▼
        SALARY RULES
                │
                ▼
        SALARY RULES ENGINE
                │
                ▼
            PAYRUN
                │
                ▼
       PAYSLIP COMPUTATION
                │
                ├── Payslip Header
                │
                ├── Earnings Lines
                │
                ├── Deduction Lines
                │
                ├── Contribution Lines
                │
                ├── Totals
                │
                └── Calculation Snapshot
                        │
                        ▼
                 FINALIZED PAYSLIP
```

---

# 95. Final Principle

The **Payslip Computation module** is the employee-level record of payroll truth.

The system must clearly transform:

```text
PAYROLL INPUTS
        ↓
SALARY RULE CALCULATIONS
        ↓
SALARY COMPONENTS
        ↓
PAYSLIP LINES
        ↓
EARNINGS TOTAL
        ↓
DEDUCTIONS TOTAL
        ↓
NET SALARY
        ↓
FINALIZED PAYSLIP
```

The final Payslip must be:

```text
Accurate

Transparent

Traceable

Secure

Immutable after finalization

Easy to understand

Professional

Audit-friendly
```

---

# 96. Module Boundary Summary

This module is responsible for:

```text
Salary Engine Result
        ↓
Structured Payslip
        ↓
Payslip Lines
        ↓
Totals
        ↓
Snapshots
        ↓
Finalized Employee Payroll Record
```

The responsibility boundary is:

```text
SALARY RULES ENGINE
→ Determines the calculation

PAYRUN
→ Determines who and when to process

PAYSLIP COMPUTATION
→ Stores and structures the employee result

PAYSLIP VIEW / EXPORT
→ Presents the final document to users
```

This separation keeps **PeoplePay360** clean, scalable, reliable, and easy to demonstrate during the Odoo Final Hackathon.

```
```