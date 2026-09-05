# `08_SALARY_RULES_ENGINE.md`

````markdown
# PeoplePay360 — Salary Rules Engine Specification

## 1. Purpose

The **Salary Rules Engine** is the core calculation engine of PeoplePay360.

The previous module:

```text
07_SALARY_STRUCTURES.md
````

defines:

* Salary Structures
* Salary Rules
* Salary Components
* Categories
* Calculation Types
* Sequences

This module defines:

> **Exactly how the system executes those Salary Rules to calculate an employee's payroll.**

The Salary Rules Engine must take data from multiple PeoplePay360 modules and transform it into calculated payroll components.

---

# 2. Position in Overall System

The Salary Rules Engine sits between the HR data modules and the Payroll/Payrun module.

```text
EMPLOYEE MASTER
       │
       ▼
CONTRACT
       │
       ├── Contract Wage
       ├── Salary Structure
       └── Working Schedule
                │
                ▼
         SALARY RULES ENGINE
                │
        ┌───────┼────────┐
        │       │        │
        ▼       ▼        ▼
   ATTENDANCE TIME OFF OTHER INPUTS
        │       │        │
        └───────┼────────┘
                ▼
         PAYROLL CONTEXT
                │
                ▼
         RULE EVALUATION
                │
                ▼
       SALARY COMPONENTS
                │
                ▼
       GROSS / DEDUCTIONS
                │
                ▼
           NET SALARY
                │
                ▼
             PAYSLIP
```

---

# 3. Main Objective

The engine must answer:

```text
For this employee,
for this payroll period,
using this contract,
using this salary structure,
what is the final salary?
```

The output should contain:

```text
Basic Salary

Allowances

Additional Earnings

Gross Salary

Employee Deductions

Employer Contributions

Total Deductions

Net Salary
```

---

# 4. Core Responsibilities

The Salary Rules Engine is responsible for:

1. Finding the correct employee contract
2. Finding the applicable Salary Structure
3. Loading Salary Rules
4. Sorting rules by sequence
5. Building the payroll calculation context
6. Reading Attendance data
7. Reading Time Off data
8. Evaluating rule conditions
9. Calculating Fixed Amount rules
10. Calculating Percentage rules
11. Calculating Formula rules
12. Handling dependencies between rules
13. Calculating earnings
14. Calculating deductions
15. Calculating employer contributions
16. Calculating Gross Salary
17. Calculating Net Salary
18. Detecting calculation errors
19. Producing explainable calculation results
20. Returning immutable calculated data to the Payslip system

---

# 5. Fundamental Rule

The frontend must never be the authoritative payroll calculator.

Correct architecture:

```text
Frontend
    │
    │ Request payroll preview / run
    ▼
Backend Salary Rules Engine
    │
    │ Calculate salary
    ▼
Validated Result
    │
    ▼
Frontend Display
```

The backend is responsible for:

```text
Calculation
Validation
Authorization
Data integrity
Final results
```

Frontend calculations may exist only for UI previews.

---

# 6. Engine Input

The Salary Rules Engine receives a calculation request.

Example:

```json
{
  "employee_id": 101,
  "contract_id": 55,
  "period_start": "2026-09-01",
  "period_end": "2026-09-30"
}
```

Normally, the engine should determine the Contract automatically.

A more standard request may be:

```json
{
  "employee_id": 101,
  "period_start": "2026-09-01",
  "period_end": "2026-09-30"
}
```

The engine then resolves:

```text
Employee
    ↓
Applicable Contract
    ↓
Salary Structure
    ↓
Working Schedule
    ↓
Payroll Inputs
```

---

# 7. Engine Output

The engine should return a structured result.

Example:

```json
{
  "employee_id": 101,
  "period_start": "2026-09-01",
  "period_end": "2026-09-30",

  "components": [
    {
      "code": "BASIC",
      "name": "Basic Salary",
      "category": "basic",
      "amount": 50000
    },
    {
      "code": "HRA",
      "name": "House Rent Allowance",
      "category": "allowance",
      "amount": 20000
    }
  ],

  "gross_salary": 73500,
  "total_deductions": 11200,
  "net_salary": 62300
}
```

---

# 8. Complete Engine Workflow

The complete calculation process:

```text
STEP 1
Receive Employee + Payroll Period
        ↓
STEP 2
Validate Employee
        ↓
STEP 3
Find Applicable Contract
        ↓
STEP 4
Find Salary Structure
        ↓
STEP 5
Load Salary Rules
        ↓
STEP 6
Sort Rules by Sequence
        ↓
STEP 7
Collect Attendance Data
        ↓
STEP 8
Collect Time Off Data
        ↓
STEP 9
Build Calculation Context
        ↓
STEP 10
Evaluate Each Rule
        ↓
STEP 11
Store Rule Results
        ↓
STEP 12
Calculate Category Totals
        ↓
STEP 13
Validate Final Salary
        ↓
STEP 14
Return Calculation Result
```

---

# 9. Step 1 — Validate Employee

Before payroll calculation:

Verify:

```text
✓ Employee exists
✓ Employee is active
✓ Employee belongs to the company
✓ Employee is eligible for payroll
```

Example error:

```text
Payroll calculation failed.

Employee #101 does not exist.
```

Or:

```text
Payroll calculation failed.

Employee is inactive.
```

---

# 10. Step 2 — Find Applicable Contract

The engine must find the Contract applicable to the payroll period.

Example:

```text
Payroll Period:

01 Sep 2026
to
30 Sep 2026
```

Contract:

```text
Start Date:
01 Jan 2026

End Date:
31 Dec 2026

Status:
Active
```

Result:

```text
Contract is applicable.
```

---

# 11. Contract Selection Rules

The Contract should:

```text
Belong to the Employee
AND

Be active during the payroll period
```

Conceptually:

```text
contract.start_date <= period_end
AND
(contract.end_date IS NULL
OR contract.end_date >= period_start)
```

The engine must not select an unrelated Contract.

---

# 12. Multiple Contract Protection

Invalid scenario:

```text
Employee
│
├── Contract A
│   Active
│
└── Contract B
    Active
```

Both overlap for the same period.

For the MVP:

```text
Prevent overlapping active contracts.
```

If overlapping Contracts are detected:

```text
Payroll calculation error:

Multiple applicable contracts found.
```

Advanced prorated multi-contract payroll can be implemented later.

---

# 13. Step 3 — Find Salary Structure

The Contract provides:

```text
salary_structure_id
```

Example:

```text
Employee
    ↓
Contract
    ↓
Standard Monthly Salary Structure
```

If no Salary Structure exists:

```text
Payroll calculation failed.

No Salary Structure assigned to the Contract.
```

---

# 14. Step 4 — Load Salary Rules

The engine loads all rules attached to the Salary Structure.

Example:

```text
STANDARD MONTHLY SALARY

100 → BASIC
200 → HRA
300 → TRANSPORT
400 → MEDICAL
500 → GROSS
600 → PF
700 → PT
800 → UNPAID_LEAVE
900 → TAX
1000 → NET
```

Only applicable active rules should be evaluated.

---

# 15. Rule Sorting

Rules must be sorted before execution.

Correct order:

```text
100 → BASIC
200 → HRA
300 → TRANSPORT
400 → MEDICAL
500 → GROSS
600 → PF
700 → PT
800 → UNPAID_LEAVE
900 → TAX
1000 → NET
```

The engine must never depend on random database order.

Use deterministic ordering:

```text
ORDER BY sequence ASC
```

If sequences are equal, use a stable secondary ordering.

Recommended:

```text
ORDER BY sequence ASC, id ASC
```

---

# 16. Step 5 — Collect Attendance Inputs

Attendance can provide:

```text
Scheduled Days
Worked Days
Present Days
Absent Days
Late Days
Overtime Hours
```

For payroll context:

```text
worked_days
scheduled_days
absent_days
overtime_hours
```

Example:

```text
Scheduled Days = 22
Worked Days = 20
Absent Days = 2
```

---

# 17. Step 6 — Collect Time Off Inputs

The Time Off module can provide:

```text
Paid Leave Days
Unpaid Leave Days
Leave Type
Approved Leave Records
```

Example:

```text
Paid Leave Days = 2

Unpaid Leave Days = 1
```

The Salary Rules Engine receives summarized values.

It should not duplicate Time Off approval logic.

---

# 18. Source of Truth Principle

Each module owns its own data.

```text
Employee Master
→ Employee data

Contract Management
→ Employment and wage data

Working Schedules
→ Expected working schedule

Attendance
→ Actual attendance

Time Off
→ Approved leave

Salary Structures
→ Salary calculation configuration

Salary Rules Engine
→ Calculation execution
```

The engine consumes data.

It should not become the source of truth for all HR modules.

---

# 19. Step 7 — Build Payroll Context

The Payroll Context is the controlled data environment used for calculations.

Example:

```text
employee
contract

contract_wage

basic
gross

scheduled_days
worked_days
paid_leave_days
unpaid_leave_days

days_in_period

total_earnings
total_deductions
```

Example runtime values:

```text
contract_wage = 50000

scheduled_days = 22
worked_days = 21

paid_leave_days = 0
unpaid_leave_days = 1
```

---

# 20. Recommended Payroll Context Object

Conceptually:

```json
{
  "employee_id": 101,

  "contract": {
    "id": 55,
    "wage": 50000
  },

  "period": {
    "start": "2026-09-01",
    "end": "2026-09-30",
    "days": 30
  },

  "attendance": {
    "scheduled_days": 22,
    "worked_days": 21
  },

  "leave": {
    "paid_leave_days": 0,
    "unpaid_leave_days": 1
  },

  "results": {}
}
```

The actual implementation can differ.

The principle is important:

```text
All calculation inputs must be controlled and explicit.
```

---

# 21. Rule Evaluation Loop

The engine evaluates rules one by one.

Conceptually:

```text
FOR EACH rule
    │
    ├── Check Active
    │
    ├── Evaluate Condition
    │
    ├── Calculate Amount
    │
    ├── Validate Result
    │
    ├── Store Result
    │
    └── Update Context
```

This is the heart of the Salary Rules Engine.

---

# 22. Rule Evaluation Algorithm

Pseudo-code:

```text
rules = get_rules(structure)

sort rules by sequence ASC

context = build_payroll_context()

results = []

FOR rule IN rules:

    IF rule is inactive:
        continue

    IF condition is false:
        mark rule as skipped
        continue

    amount = calculate(rule, context)

    validate(amount)

    store rule result

    update context

END FOR

calculate totals

return result
```

---

# 23. Rule Result Storage

After every rule executes:

```text
Rule:
BASIC

Result:
₹50,000
```

The engine adds:

```text
context.results.BASIC = 50000
```

Then the next rule can use:

```text
BASIC
```

Example:

```text
HRA = BASIC × 40%
```

---

# 24. Example Execution

Initial context:

```text
contract_wage = ₹50,000
```

### Rule 100

```text
BASIC
```

Result:

```text
₹50,000
```

Context becomes:

```text
BASIC = 50000
```

### Rule 200

```text
HRA = BASIC × 40%
```

Result:

```text
₹20,000
```

Context becomes:

```text
BASIC = 50000
HRA = 20000
```

---

# 25. Fixed Amount Calculation

Configuration:

```text
Rule:
TRANSPORT

Calculation Type:
Fixed

Amount:
₹2,000
```

Engine:

```text
amount = 2000
```

Result:

```text
TRANSPORT = ₹2,000
```

---

# 26. Percentage Calculation

Configuration:

```text
Rule:
HRA

Calculation Type:
Percentage

Percentage:
40%

Base:
BASIC
```

Engine:

```text
base_amount = context.results.BASIC

amount =
base_amount × 40 / 100
```

Result:

```text
HRA = ₹20,000
```

---

# 27. Percentage Base Resolution

The engine must resolve the configured base.

Possible bases:

```text
BASIC
GROSS
CONTRACT_WAGE
```

Example:

```text
PF = 12% of BASIC
```

The engine resolves:

```text
context.results.BASIC
```

---

# 28. Invalid Percentage Base

Example:

```text
Rule:
PF

Base:
BASIC
```

But:

```text
BASIC was not calculated.
```

Result:

```text
Calculation Error

Rule: PF

Reason:
Percentage base BASIC is unavailable.
```

The engine must fail clearly.

---

# 29. Formula Calculation

Formula rules support calculations based on controlled payroll variables.

Example:

```text
UNPAID_LEAVE
```

Formula:

```text
(contract_wage / scheduled_days)
*
unpaid_leave_days
```

Example values:

```text
contract_wage = 50000

scheduled_days = 22

unpaid_leave_days = 2
```

Result:

```text
Daily Wage
=
50000 / 22
=
2272.73

Deduction
=
2272.73 × 2
=
4545.46
```

---

# 30. Formula Safety

Never allow unrestricted server-side execution.

Do not implement:

```python
eval(user_formula)
```

without strict protection.

The formula engine must support only:

```text
Approved variables
Approved arithmetic operations
Approved functions
```

---

# 31. Allowed Formula Operations

Recommended MVP:

```text
+
-
*
/
(
)
```

Optional:

```text
min()
max()
round()
```

Do not allow:

```text
File access
Database access
Network access
System commands
Arbitrary imports
Arbitrary code execution
```

---

# 32. Formula Variables

Recommended whitelist:

```text
contract_wage

basic
gross

scheduled_days
worked_days

paid_leave_days
unpaid_leave_days

days_in_period

total_earnings
total_deductions
```

Calculated rule codes can also be exposed safely.

Example:

```text
BASIC
HRA
TRANSPORT
```

---

# 33. Case Consistency

Choose one consistent convention.

Recommended internal convention:

```text
UPPERCASE
```

For salary rule codes:

```text
BASIC
HRA
GROSS
PF
NET
```

For system context variables:

```text
snake_case
```

Example:

```text
contract_wage
worked_days
unpaid_leave_days
```

---

# 34. Rule Conditions

Before calculating a rule:

```text
Evaluate Condition
```

Example:

```text
Rule:
UNPAID_LEAVE

Condition:
unpaid_leave_days > 0
```

If:

```text
unpaid_leave_days = 0
```

Then:

```text
Rule is skipped.
```

---

# 35. Conditional Execution Flow

```text
Rule
  │
  ▼
Is Active?
  │
  ├── No → Skip
  │
  ▼
Condition Exists?
  │
  ├── No → Calculate
  │
  ▼
Evaluate Condition
  │
  ├── False → Skip
  │
  └── True → Calculate
```

---

# 36. Skipped Rule Result

For auditability:

```json
{
  "code": "UNPAID_LEAVE",
  "status": "skipped",
  "reason": "Condition evaluated to false"
}
```

This is better than silently disappearing from the calculation log.

---

# 37. Rule Categories

The engine should understand rule categories.

Recommended categories:

```text
Basic
Allowance
Earning
Deduction
Employer Contribution
Gross
Net
```

Categories determine how results affect totals.

---

# 38. Category Calculation Logic

### Earnings

```text
Basic
Allowance
Earning
```

increase employee earnings.

### Deductions

```text
Deduction
```

reduce employee take-home pay.

### Employer Contributions

```text
Employer Contribution
```

increase employer cost but do not reduce employee net salary.

---

# 39. Gross Salary Calculation

Conceptually:

```text
Gross Salary
=
Basic
+
Allowances
+
Additional Earnings
```

Example:

```text
Basic       ₹50,000

HRA         ₹20,000

Transport    ₹2,000

Medical      ₹1,500
```

Result:

```text
Gross = ₹73,500
```

---

# 40. Gross Calculation Strategies

There are two supported architectural approaches.

## Option A — Explicit GROSS Rule

A rule calculates:

```text
GROSS
=
BASIC
+
HRA
+
TRANSPORT
+
MEDICAL
```

## Option B — Category Aggregation

The engine automatically calculates:

```text
Gross
=
SUM(Basic + Allowances + Earnings)
```

---

# 41. Recommended Approach

For PeoplePay360:

```text
Use category aggregation internally
```

while optionally exposing:

```text
GROSS
```

as a visible summary rule.

This prevents duplicated calculations.

Recommended flow:

```text
Rule Results
    ↓
Category Totals
    ↓
Gross Salary
```

---

# 42. Deduction Calculation

Example:

```text
PF = ₹6,000

Professional Tax = ₹200

Income Tax = ₹5,000
```

Total:

```text
Total Deductions
=
6000
+
200
+
5000

=
₹11,200
```

---

# 43. Net Salary Calculation

Conceptually:

```text
Net Salary
=
Gross Salary
-
Total Employee Deductions
```

Example:

```text
Gross Salary:
₹73,500

Total Deductions:
₹11,200
```

Result:

```text
Net Salary:
₹62,300
```

---

# 44. Employer Contributions

Example:

```text
Employer PF = ₹6,000
```

This must not be subtracted from Net Salary.

Correct:

```text
Employee Gross Salary
₹73,500

Employee Deductions
₹11,200

Net Salary
₹62,300

Employer Contribution
₹6,000
```

Optional:

```text
Total Employer Cost
=
Employee Gross
+
Employer Contributions
```

---

# 45. Recommended Final Totals

The engine should calculate:

```text
Basic Total

Total Allowances

Total Additional Earnings

Gross Salary

Total Employee Deductions

Net Salary

Total Employer Contributions

Total Employer Cost
```

---

# 46. Calculation Result Model

Recommended structure:

```json
{
  "basic_total": 50000,

  "allowance_total": 23500,

  "earning_total": 0,

  "gross_salary": 73500,

  "deduction_total": 11200,

  "net_salary": 62300,

  "employer_contribution_total": 6000,

  "employer_cost": 79500
}
```

---

# 47. Full Calculation Example

Employee:

```text
Aarav Mehta
```

Contract Wage:

```text
₹50,000
```

Salary Structure:

```text
Standard Monthly Salary
```

---

## Rule 100 — BASIC

```text
Calculation:
Contract Wage
```

Result:

```text
₹50,000
```

---

## Rule 200 — HRA

```text
40% of BASIC
```

Calculation:

```text
50000 × 40%
```

Result:

```text
₹20,000
```

---

## Rule 300 — TRANSPORT

```text
Fixed ₹2,000
```

Result:

```text
₹2,000
```

---

## Rule 400 — MEDICAL

```text
Fixed ₹1,500
```

Result:

```text
₹1,500
```

---

## Gross Calculation

```text
50000
+
20000
+
2000
+
1500
```

Result:

```text
₹73,500
```

---

## Rule 600 — PF

```text
12% of BASIC
```

Calculation:

```text
50000 × 12%
```

Result:

```text
₹6,000
```

---

## Rule 700 — Professional Tax

```text
Fixed ₹200
```

Result:

```text
₹200
```

---

## Rule 800 — Unpaid Leave

Example:

```text
unpaid_leave_days = 0
```

Condition:

```text
unpaid_leave_days > 0
```

Result:

```text
Skipped
```

---

## Rule 900 — Income Tax

```text
₹5,000
```

Result:

```text
₹5,000
```

---

## Final Calculation

```text
GROSS SALARY

₹73,500

LESS DEDUCTIONS

PF                 ₹6,000
Professional Tax     ₹200
Income Tax         ₹5,000

TOTAL DEDUCTIONS

₹11,200

NET SALARY

₹62,300
```

---

# 48. Proration Support

The engine architecture should support salary proration.

Example:

Employee joins:

```text
16 September
```

Payroll period:

```text
1 September
to
30 September
```

Possible calculation:

```text
Monthly Salary
×
Eligible Days
/
Total Working Days
```

Example:

```text
₹50,000
×
11
/
22

=
₹25,000
```

For the MVP, implement only if required by the final problem statement.

The architecture should support it.

---

# 49. Unpaid Leave Deduction

Example:

```text
Monthly Wage = ₹50,000

Working Days = 22

Unpaid Leave Days = 2
```

Calculation:

```text
Daily Rate
=
50000 / 22

=
2272.73
```

Deduction:

```text
2272.73 × 2

=
₹4545.46
```

This value becomes a Deduction component.

---

# 50. Rounding Rules

Payroll calculations must use consistent rounding.

Recommended approach:

```text
Internal calculation:
High precision decimal

Final component:
Currency rounding
```

Avoid:

```text
Floating point errors
```

Use decimal/money types.

Example:

```text
2272.727272
```

Final:

```text
₹2,272.73
```

---

# 51. Money Data Type

Never rely on normal binary floating-point calculations for payroll money.

Recommended:

```text
Decimal
```

Database:

```text
DECIMAL
NUMERIC
```

Example:

```text
DECIMAL(15,2)
```

The exact schema can depend on the backend/database.

---

# 52. Negative Salary Protection

The engine should validate unexpected negative values.

Example:

```text
Gross Salary = ₹50,000

Deductions = ₹70,000
```

Possible result:

```text
Net Salary = -₹20,000
```

The system should not silently accept this unless negative payroll balances are explicitly supported.

For MVP:

```text
Raise validation or flag for review.
```

---

# 53. Maximum Deduction Protection

Recommended validation:

```text
Total Deductions
should not unexpectedly exceed
Gross Salary
```

If it does:

```text
Payroll Warning / Error
```

depending on configured business rules.

---

# 54. Dependency Rules

A rule may depend on earlier results.

Example:

```text
BASIC
    ↓
HRA
    ↓
GROSS
    ↓
PF
    ↓
NET
```

The engine must ensure dependencies are available before calculation.

---

# 55. Circular Dependency Protection

Invalid:

```text
A depends on B

B depends on A
```

Example:

```text
HRA = 10% of GROSS

GROSS includes HRA
```

This creates a circular dependency.

For the MVP:

```text
Rules can only reference
previously available results.
```

This simple rule prevents many circular dependency problems.

---

# 56. Dependency Validation

Before payroll execution:

```text
Rule sequence is checked.
```

Example:

```text
HRA sequence = 200

BASIC sequence = 100
```

Valid.

Invalid:

```text
HRA sequence = 100

BASIC sequence = 200
```

if HRA depends on BASIC.

The system should reject or flag invalid configuration.

---

# 57. Calculation Status

Every engine run should have a status.

Recommended:

```text
PENDING
CALCULATING
SUCCESS
FAILED
```

Optional:

```text
WARNING
```

---

# 58. Error Handling

Calculation errors must be explicit.

Examples:

```text
No applicable Contract found.
```

```text
No Salary Structure assigned.
```

```text
Salary Rule BASIC failed.
```

```text
Percentage base BASIC is unavailable.
```

```text
Division by zero.
```

```text
Invalid formula.
```

---

# 59. Error Result

Recommended API format:

```json
{
  "success": false,
  "error": {
    "code": "MISSING_PERCENTAGE_BASE",
    "rule_code": "PF",
    "message": "Percentage base BASIC is unavailable."
  }
}
```

---

# 60. Calculation Audit Trail

For hackathon quality, every payroll calculation should be explainable.

Store:

```text
Employee

Payroll Period

Contract Used

Salary Structure Used

Rule

Rule Sequence

Calculation Type

Input Values

Calculated Result

Execution Status
```

Example:

```text
Rule: HRA

Calculation:
BASIC × 40%

Input:
BASIC = ₹50,000

Result:
₹20,000
```

This makes the system easier to debug and demonstrate.

---

# 61. Calculation Trace Example

```text
PAYROLL CALCULATION TRACE

Employee:
Aarav Mehta

Period:
September 2026

---------------------------------

[100] BASIC

Input:
contract_wage = ₹50,000

Result:
₹50,000

---------------------------------

[200] HRA

Formula:
BASIC × 40%

Input:
BASIC = ₹50,000

Result:
₹20,000

---------------------------------

[300] TRANSPORT

Fixed Amount:
₹2,000

Result:
₹2,000
```

---

# 62. Immutable Payroll Results

Once payroll is finalized:

```text
Salary calculation results
must become historical records.
```

Later changes to:

```text
Salary Rules
Salary Structures
Contract Wage
```

must not modify finalized payroll history.

---

# 63. Snapshot Principle

When a Payslip is created, store a snapshot of:

```text
Salary Structure details

Rules used

Rule configuration

Calculated amounts

Final totals
```

Example:

```text
September Payslip

HRA:
40%
```

Later HR changes HRA:

```text
50%
```

The old Payslip remains:

```text
40%
```

---

# 64. Preview Mode

The Salary Rules Engine should support:

```text
Preview Mode
```

Preview:

```text
Calculate salary

BUT

Do not persist finalized payroll records.
```

Useful for:

```text
HR testing
Salary simulation
Payroll review
Hackathon demo
```

---

# 65. Finalize Mode

Finalize mode:

```text
Calculate salary
        ↓
Validate result
        ↓
Create Payslip
        ↓
Store components
        ↓
Store snapshots
        ↓
Lock historical result
```

---

# 66. Engine Modes

Recommended:

```text
PREVIEW
FINALIZE
```

Optional future:

```text
RECALCULATE_DRAFT
SIMULATION
```

---

# 67. Preview API

```http
POST /api/payroll/calculate-preview
```

Example request:

```json
{
  "employee_id": 101,
  "period_start": "2026-09-01",
  "period_end": "2026-09-30"
}
```

Response:

```json
{
  "mode": "preview",
  "gross_salary": 73500,
  "total_deductions": 11200,
  "net_salary": 62300
}
```

---

# 68. Engine Service Architecture

Recommended backend structure:

```text
backend/
│
├── payroll/
│   ├── salary_engine/
│   │   ├── engine
│   │   ├── context_builder
│   │   ├── rule_evaluator
│   │   ├── condition_evaluator
│   │   ├── formula_evaluator
│   │   └── validators
│   │
│   ├── services/
│   └── models/
```

Conceptually:

```text
Payroll Request
       │
       ▼
Salary Engine
       │
       ├── Context Builder
       │
       ├── Rule Loader
       │
       ├── Condition Evaluator
       │
       ├── Amount Calculator
       │
       └── Result Aggregator
```

---

# 69. Recommended Engine Components

## SalaryEngine

Main orchestrator.

Responsibilities:

```text
Start calculation
Coordinate services
Return result
```

---

## ContextBuilder

Responsibilities:

```text
Employee data
Contract data
Attendance summary
Leave summary
Period data
Previous rule results
```

---

## RuleLoader

Responsibilities:

```text
Load Salary Structure
Load active Rules
Sort Rules
Validate configuration
```

---

## ConditionEvaluator

Responsibilities:

```text
Evaluate Always Applicable
Evaluate controlled conditions
Return True / False
```

---

## AmountCalculator

Responsibilities:

```text
Fixed Amount

Percentage

Formula
```

---

## ResultAggregator

Responsibilities:

```text
Basic totals

Allowance totals

Earning totals

Deduction totals

Gross Salary

Net Salary

Employer Cost
```

---

# 70. Backend Pseudo-Code

```text
function calculatePayroll(employeeId, period):

    employee = getEmployee(employeeId)

    validateEmployee(employee)

    contract = findApplicableContract(
        employee,
        period
    )

    structure = getSalaryStructure(contract)

    rules = loadRules(structure)

    rules = sortBySequence(rules)

    context = buildContext(
        employee,
        contract,
        period
    )

    results = []

    for rule in rules:

        if not rule.active:
            continue

        if not evaluateCondition(rule, context):
            results.addSkipped(rule)
            continue

        amount = calculateAmount(
            rule,
            context
        )

        validateAmount(amount)

        result = createRuleResult(
            rule,
            amount
        )

        results.add(result)

        context.addResult(
            rule.code,
            amount
        )

    totals = aggregateResults(results)

    return {
        results,
        totals
    }
```

---

# 71. Data Flow

```text
DATABASE
│
├── employees
├── contracts
├── working_schedules
├── attendance
├── time_off
├── salary_structures
└── salary_rules

        │
        ▼

SALARY RULES ENGINE

        │
        ▼

CALCULATION RESULT

        │
        ├── Components
        ├── Gross
        ├── Deductions
        ├── Net
        └── Employer Cost

        │
        ▼

PAYSLIP
```

---

# 72. Database Models for Calculation Results

Recommended:

```text
payslips
payslip_lines
```

The Engine itself does not necessarily need permanent records for preview mode.

---

# 73. Payslip Lines

Example fields:

```text
id

payslip_id

salary_rule_id

rule_code

rule_name

category

sequence

amount

calculation_snapshot

created_at
```

---

# 74. Calculation Snapshot

Example:

```json
{
  "rule_code": "HRA",
  "calculation_type": "percentage",
  "percentage": 40,
  "percentage_base": "BASIC",
  "base_amount": 50000,
  "result": 20000
}
```

This preserves the exact calculation history.

---

# 75. API Security

Salary calculation endpoints must require authentication.

Example:

```text
POST /api/payroll/calculate-preview
```

Allowed:

```text
HR Payroll User
HR Payroll Manager
Admin
```

Not allowed:

```text
Normal Employee
Unauthorized User
```

---

# 76. Authorization

The backend must verify:

```text
Who is requesting the calculation?
```

Then:

```text
Can this role run payroll?
```

Never rely only on hidden frontend buttons.

---

# 77. Performance Requirements

For the hackathon:

The engine should efficiently calculate payroll for multiple employees.

Example:

```text
100 Employees
```

Flow:

```text
Employee 1 → Calculate

Employee 2 → Calculate

Employee 3 → Calculate

...
```

Avoid:

```text
Repeated unnecessary database queries
```

Recommended:

```text
Load reusable Salary Structure once

Load Rules once

Batch load attendance summaries

Batch load leave summaries
```

for Payrun processing.

---

# 78. Batch Calculation

Future Payrun integration:

```text
Payrun
    │
    ├── Employee 1 → Engine
    │
    ├── Employee 2 → Engine
    │
    ├── Employee 3 → Engine
    │
    └── Employee N → Engine
```

Each employee gets an independent calculation context.

Never share employee-specific context incorrectly.

---

# 79. Transaction Safety

For finalized payroll:

```text
BEGIN TRANSACTION

Calculate Employee Payroll

Create Payslip

Create Payslip Lines

Store Snapshots

Validate Totals

COMMIT
```

If failure:

```text
ROLLBACK
```

---

# 80. Idempotency

The system should prevent accidental duplicate finalized calculations.

Example:

User clicks:

```text
Generate Payroll
```

twice.

The system must not create:

```text
Payslip #1001

Payslip #1002
```

for the same employee and same period unintentionally.

Recommended uniqueness:

```text
employee_id
+
payroll_period
```

subject to Payslip state rules.

---

# 81. Duplicate Payroll Protection

Before finalization:

Check:

```text
Does a finalized Payslip already exist
for this employee and period?
```

If yes:

```text
Reject duplicate
```

or require explicit authorized handling.

---

# 82. Engine Logging

Log:

```text
Calculation started

Employee ID

Payroll Period

Contract ID

Salary Structure ID

Rules evaluated

Rules skipped

Calculation success/failure
```

Do not expose sensitive payroll details unnecessarily in public logs.

---

# 83. UI — Calculation Preview

Recommended design:

```text
----------------------------------------------------
Salary Calculation Preview
----------------------------------------------------

Employee:
Aarav Mehta

Payroll Period:
01 Sep 2026 - 30 Sep 2026

Contract Wage:
₹50,000

----------------------------------------------------

EARNINGS

Basic Salary                  ₹50,000
House Rent Allowance          ₹20,000
Transport Allowance            ₹2,000
Medical Allowance              ₹1,500

----------------------------------------------------
GROSS SALARY                  ₹73,500
----------------------------------------------------

DEDUCTIONS

Provident Fund                 ₹6,000
Professional Tax                 ₹200
Income Tax                     ₹5,000

----------------------------------------------------
TOTAL DEDUCTIONS              ₹11,200
----------------------------------------------------

NET SALARY                    ₹62,300
----------------------------------------------------
```

---

# 84. UI — Calculation Trace

Optional advanced UI:

```text
[▶] BASIC

Contract Wage
₹50,000

Result
₹50,000


[▶] HRA

Formula:
BASIC × 40%

BASIC:
₹50,000

Result:
₹20,000
```

This is excellent for hackathon demonstration.

---

# 85. Integration with Payrun

The Payrun module calls the Salary Rules Engine.

```text
PAYRUN
   │
   ▼
Get Eligible Employees
   │
   ▼
For Each Employee
   │
   ▼
SALARY RULES ENGINE
   │
   ▼
Calculation Result
   │
   ▼
Create Payslip
```

The Payrun should orchestrate.

The Salary Rules Engine should calculate.

This separation is important.

---

# 86. Integration with Payslip

The Engine returns:

```text
Rule Results
Totals
Calculation Metadata
```

The Payslip module stores:

```text
Payslip Header

Payslip Lines

Totals

Calculation Snapshot
```

---

# 87. Module Boundary

Correct separation:

```text
Salary Structures
→ Defines rules

Salary Rules Engine
→ Executes rules

Payrun
→ Runs payroll for many employees

Payslip
→ Stores and presents final payroll
```

Do not merge all these responsibilities into one giant component.

---

# 88. Testing Requirements

## Test 1 — Fixed Rule

Input:

```text
Transport = ₹2,000
```

Expected:

```text
₹2,000
```

---

## Test 2 — Percentage Rule

Input:

```text
Basic = ₹50,000

HRA = 40%
```

Expected:

```text
₹20,000
```

---

## Test 3 — Rule Dependency

```text
BASIC
```

must execute before:

```text
HRA
```

Expected:

```text
HRA receives BASIC value.
```

---

## Test 4 — Condition False

```text
unpaid_leave_days = 0
```

Expected:

```text
UNPAID_LEAVE skipped
```

---

## Test 5 — Condition True

```text
unpaid_leave_days = 2
```

Expected:

```text
UNPAID_LEAVE calculated
```

---

## Test 6 — Formula

Input:

```text
Wage = ₹50,000

Scheduled Days = 22

Unpaid Days = 2
```

Expected:

```text
₹4,545.46 deduction
```

subject to configured rounding.

---

## Test 7 — Gross Salary

Expected:

```text
Basic
+
Allowances
+
Earnings
=
Gross
```

---

## Test 8 — Net Salary

Expected:

```text
Gross
-
Deductions
=
Net
```

---

## Test 9 — Missing Base

PF requires:

```text
BASIC
```

BASIC missing.

Expected:

```text
Calculation Error
```

---

## Test 10 — Division by Zero

Formula:

```text
contract_wage / scheduled_days
```

Input:

```text
scheduled_days = 0
```

Expected:

```text
Clear Calculation Error
```

---

## Test 11 — Circular Dependency

Rule A depends on B.

Rule B depends on A.

Expected:

```text
Configuration rejected.
```

---

## Test 12 — Historical Integrity

Generate Payslip.

Change Salary Rule.

Expected:

```text
Old Payslip unchanged.
```

---

## Test 13 — Unauthorized User

Employee requests:

```text
POST /api/payroll/calculate-preview
```

Expected:

```text
403 Forbidden
```

---

# 89. Definition of Done

## Engine Setup

* [ ] Salary Engine service exists
* [ ] Context Builder exists
* [ ] Rule Loader exists
* [ ] Condition Evaluator exists
* [ ] Amount Calculator exists
* [ ] Result Aggregator exists

## Inputs

* [ ] Employee loads
* [ ] Contract resolves
* [ ] Salary Structure resolves
* [ ] Attendance loads
* [ ] Time Off loads
* [ ] Payroll context builds

## Rule Processing

* [ ] Rules sort correctly
* [ ] Inactive rules skip
* [ ] Conditions evaluate
* [ ] Fixed calculations work
* [ ] Percentage calculations work
* [ ] Formula calculations work safely
* [ ] Dependencies work

## Totals

* [ ] Basic totals work
* [ ] Allowance totals work
* [ ] Earnings totals work
* [ ] Gross calculates
* [ ] Deductions calculate
* [ ] Net calculates
* [ ] Employer contributions calculate

## Safety

* [ ] Decimal calculations used
* [ ] Division by zero handled
* [ ] Missing dependencies handled
* [ ] Circular dependencies prevented
* [ ] Invalid negative salary flagged
* [ ] Duplicate payroll prevented

## Integration

* [ ] Contract integration
* [ ] Attendance integration
* [ ] Time Off integration
* [ ] Salary Structure integration
* [ ] Payrun integration
* [ ] Payslip integration

## Security

* [ ] Authentication required
* [ ] Authorization enforced
* [ ] Employee cannot run payroll
* [ ] Formula execution restricted

## Historical Integrity

* [ ] Results stored
* [ ] Calculation snapshots stored
* [ ] Finalized results immutable

---

# 90. Recommended Hackathon MVP

For the strongest and most achievable implementation:

## Must Implement

```text
✓ Active Contract Resolution

✓ Salary Structure Resolution

✓ Ordered Salary Rules

✓ Fixed Amount Rules

✓ Percentage Rules

✓ Conditional Rules

✓ Payroll Context

✓ Attendance Inputs

✓ Time Off Inputs

✓ Gross Salary

✓ Deductions

✓ Net Salary

✓ Preview Calculation

✓ Payslip Result Storage
```

## Strong Bonus

```text
✓ Formula Rules

✓ Calculation Trace

✓ Employer Contributions

✓ Salary Proration

✓ Detailed Audit Trail
```

---

# 91. Hackathon Demo Flow

The ideal demonstration:

```text
STEP 1

Open Employee

        ↓

STEP 2

Show Active Contract

Wage:
₹50,000

Salary Structure:
Standard Monthly

        ↓

STEP 3

Show Attendance / Time Off

Unpaid Leave:
2 Days

        ↓

STEP 4

Open Salary Calculation Preview

        ↓

STEP 5

Show Rules Executing

BASIC
↓
HRA
↓
ALLOWANCES
↓
GROSS
↓
PF
↓
UNPAID LEAVE
↓
TAX
↓
NET

        ↓

STEP 6

Show Calculation Result

Gross:
₹73,500

Deductions:
₹15,745.46

Net:
₹57,754.54

        ↓

STEP 7

Generate Payslip
```

This demonstrates the complete PeoplePay360 intelligence layer.

---

# 92. Final Architecture

```text
                    PEOPLEPAY360
                         │
                         ▼
                  PAYROLL REQUEST
                         │
                         ▼
                  SALARY RULES ENGINE
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
     CONTRACT       ATTENDANCE       TIME OFF
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                   PAYROLL CONTEXT
                         │
                         ▼
                   SALARY STRUCTURE
                         │
                         ▼
                     SALARY RULES
                         │
                         ▼
                 ORDERED EXECUTION
                         │
          ┌──────────────┼───────────────┐
          │              │               │
          ▼              ▼               ▼
        FIXED        PERCENTAGE       FORMULA
          │              │               │
          └──────────────┼───────────────┘
                         ▼
                   RULE RESULTS
                         │
          ┌──────────────┼──────────────┐
          │              │              │
          ▼              ▼              ▼
       EARNINGS      DEDUCTIONS    EMPLOYER COST
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                   FINAL TOTALS
                         │
                  ┌──────┴──────┐
                  ▼             ▼
               GROSS          NET
                  │             │
                  └──────┬──────┘
                         ▼
                      PAYSLIP
```

---

# 93. Final Principle

The **Salary Rules Engine** is the intelligence layer of PeoplePay360.

The other modules provide the data:

```text
Employee Master
→ Who the employee is

Contract
→ What the employee earns

Working Schedule
→ When the employee is expected to work

Attendance
→ What the employee actually worked

Time Off
→ Approved paid/unpaid leave

Salary Structures
→ How salary should be configured
```

The Salary Rules Engine answers:

```text
Given all this information,

how much should this employee receive
for this payroll period?
```

The final transformation is:

```text
EMPLOYEE DATA
        +
CONTRACT DATA
        +
ATTENDANCE DATA
        +
TIME OFF DATA
        +
SALARY STRUCTURE
        +
SALARY RULES

        ↓

SALARY RULES ENGINE

        ↓

EARNINGS
        ↓
GROSS SALARY
        ↓
DEDUCTIONS
        ↓
NET SALARY
        ↓
PAYSLIP
```

This module must remain:

```text
Accurate
Secure
Deterministic
Explainable
Auditable
Reusable
Backend-authoritative
```

Because this is the engine that transforms PeoplePay360 from a simple HR management system into a complete **HR + Attendance + Leave + Payroll platform**.

```
```