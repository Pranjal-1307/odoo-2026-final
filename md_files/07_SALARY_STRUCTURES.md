# `07_SALARY_STRUCTURES.md`

````markdown
# PeoplePay360 — Salary Structures & Salary Rules Specification

## 1. Purpose

The Salary Structures module defines **how an employee's salary is calculated**.

This module is the foundation of the Payroll system.

It must support:

- Salary Structures
- Salary Rules
- Salary Components
- Earnings
- Allowances
- Deductions
- Employer Contributions
- Basic Salary
- Gross Salary
- Net Salary
- Rule sequencing
- Rule conditions
- Fixed amount calculations
- Percentage-based calculations
- Formula-based calculations
- Employee / Contract salary structure assignment
- Payroll integration
- Payslip integration
- RBAC and security
- Validation
- Auditability

The complete business flow is:

```text
Employee
    ↓
Contract
    ↓
Salary Structure
    ↓
Salary Rules
    ↓
Payroll Computation
    ↓
Earnings + Deductions
    ↓
Gross Salary
    ↓
Net Salary
    ↓
Payslip
````

---

# 2. Core Concept

A **Salary Structure** is a collection of salary rules.

Example:

```text
Standard Monthly Salary Structure
```

It may contain:

```text
Basic Salary
House Rent Allowance
Transport Allowance
Medical Allowance
Other Allowance
Professional Tax
Provident Fund
Income Tax
```

Each component is controlled by a **Salary Rule**.

Example:

```text
Salary Structure
│
├── Basic Salary
├── House Rent Allowance
├── Transport Allowance
├── Medical Allowance
│
├── Gross Salary
│
├── Provident Fund
├── Professional Tax
├── Income Tax
│
└── Net Salary
```

---

# 3. Module Navigation

Recommended navigation:

```text
Payroll
├── Salary Structures
├── Salary Rules
├── Payruns
├── Payslips
└── Reports
```

The Salary Structures section contains:

```text
Salary Structures
Salary Rules
```

---

# 4. Main Business Architecture

The salary engine should follow this hierarchy:

```text
Company
    ↓
Salary Structure
    ↓
Salary Rules
    ↓
Contract
    ↓
Employee
    ↓
Payrun
    ↓
Payslip
```

Explanation:

### Company

The company defines the payroll environment.

### Salary Structure

Defines a reusable salary calculation template.

### Salary Rule

Defines one salary component or calculation.

### Contract

Assigns salary information and a Salary Structure to an employee.

### Employee

Receives salary through their active Contract.

### Payrun

Processes multiple employees for a payroll period.

### Payslip

Stores the final salary calculation for one employee.

---

# 5. Salary Structure

## 5.1 Purpose

A Salary Structure defines a reusable set of salary rules.

Example:

```text
Standard Monthly Salary
```

This structure can be assigned to multiple employees.

Example:

```text
Standard Monthly Salary
        │
        ├── Aarav Mehta
        ├── Sara Khan
        ├── John Dsouza
        └── Priya Shah
```

The structure defines the calculation logic.

The Contract defines the employee-specific salary values.

---

# 6. Salary Structure — Required Fields

Recommended fields:

```text
Name
Code
Company
Pay Frequency
Active
Description
Salary Rules
```

Optional fields:

```text
Country
Currency
Effective From
Effective To
Notes
```

---

# 7. Salary Structure Form

Example:

```text
------------------------------------------------
Salary Structure
------------------------------------------------

Name:
Standard Monthly Salary

Code:
STANDARD_MONTHLY

Company:
PeoplePay360 Demo Company

Pay Frequency:
Monthly

Active:
Yes

Description:
Default salary structure for full-time employees.

------------------------------------------------

Salary Rules

1. Basic Salary
2. House Rent Allowance
3. Transport Allowance
4. Medical Allowance
5. Gross Salary
6. Provident Fund
7. Professional Tax
8. Income Tax
9. Net Salary
------------------------------------------------
```

---

# 8. Salary Structure List View

Recommended columns:

| Column        | Description            |
| ------------- | ---------------------- |
| Name          | Salary Structure name  |
| Code          | Unique structure code  |
| Pay Frequency | Monthly / Weekly etc.  |
| Rules         | Number of salary rules |
| Active        | Active status          |
| Company       | Related company        |

Example:

| Name              | Code             | Frequency | Rules | Active |
| ----------------- | ---------------- | --------- | ----: | ------ |
| Standard Monthly  | STANDARD_MONTHLY | Monthly   |     9 | Yes    |
| Executive Monthly | EXEC_MONTHLY     | Monthly   |    12 | Yes    |

---

# 9. Pay Frequency

Recommended options:

```text
Monthly
Weekly
Bi-Weekly
Semi-Monthly
```

For the hackathon MVP, the primary supported frequency should be:

```text
Monthly
```

The system architecture should not permanently prevent additional frequencies.

---

# 10. Active / Inactive Salary Structures

A Salary Structure can be:

```text
Active
Inactive
```

If inactive:

* It should not normally be assigned to new Contracts.
* Existing historical payroll records must remain unchanged.
* Existing Payslips must remain accessible.

Do not delete a Salary Structure that is already referenced by payroll history.

---

# 11. Salary Rules

## 11.1 Purpose

A Salary Rule defines one component of salary computation.

Examples:

```text
Basic Salary
HRA
Transport Allowance
Provident Fund
Professional Tax
Income Tax
Net Salary
```

Each Salary Rule defines:

* What the component represents
* Its category
* Its sequence
* Its calculation method
* Its amount/formula
* Its conditions

---

# 12. Salary Rule — Required Fields

Recommended fields:

```text
Name
Code
Category
Sequence
Salary Structure
Calculation Type
Fixed Amount
Percentage
Formula
Condition
Active
Description
```

Additional fields:

```text
Percentage Base
Condition Formula
Appears on Payslip
Employer Cost Flag
```

---

# 13. Salary Rule Form

Example:

```text
------------------------------------------------
Salary Rule
------------------------------------------------

Name:
House Rent Allowance

Code:
HRA

Category:
Allowance

Sequence:
200

Calculation Type:
Percentage

Percentage:
40%

Percentage Base:
Basic Salary

Condition:
Always Applicable

Active:
Yes

Appears on Payslip:
Yes
------------------------------------------------
```

---

# 14. Salary Rule Categories

The system should categorize salary rules.

Recommended categories:

```text
Basic
Allowance
Deduction
Employer Contribution
Gross
Net
```

The categories help organize the payslip.

Example:

```text
EARNINGS
├── Basic
├── HRA
├── Transport Allowance
└── Medical Allowance

DEDUCTIONS
├── Provident Fund
├── Professional Tax
└── Income Tax

SUMMARY
├── Gross Salary
└── Net Salary
```

---

# 15. Earnings

Earnings increase employee salary.

Examples:

```text
Basic Salary
HRA
Transport Allowance
Medical Allowance
Bonus
Commission
Overtime
```

Conceptually:

```text
Gross Earnings
=
Basic
+
Allowances
+
Additional Earnings
```

---

# 16. Deductions

Deductions reduce the employee's take-home salary.

Examples:

```text
Provident Fund
Professional Tax
Income Tax
Unpaid Leave Deduction
Loan Deduction
Other Deduction
```

Conceptually:

```text
Total Deductions
=
PF
+
Professional Tax
+
Income Tax
+
Other Deductions
```

---

# 17. Employer Contributions

Employer Contributions are costs paid by the employer.

Examples:

```text
Employer Provident Fund Contribution
Employer Insurance Contribution
```

These may affect:

```text
Total Employer Cost
```

but do not necessarily reduce the employee's Net Salary.

Important distinction:

```text
Employee Deduction
→ reduces employee take-home pay

Employer Contribution
→ increases employer cost
```

Do not mix these two concepts.

---

# 18. Basic Salary

Basic Salary is normally the primary base salary component.

Example:

```text
Basic Salary = ₹50,000
```

Other rules can use Basic Salary as their calculation base.

Example:

```text
HRA = 40% of Basic
```

Therefore:

```text
HRA = ₹20,000
```

The Basic Salary value should generally come from the employee's active Contract or configured salary input.

---

# 19. Allowances

Allowances are additional earnings.

Example:

```text
Basic Salary:        ₹50,000
HRA:                 ₹20,000
Transport Allowance: ₹2,000
Medical Allowance:   ₹1,500
```

Total Earnings:

```text
₹73,500
```

---

# 20. Gross Salary

Gross Salary represents total applicable earnings before employee deductions.

Conceptually:

```text
Gross Salary
=
Basic Salary
+
Allowances
+
Other Earnings
```

Example:

```text
Basic:       ₹50,000
HRA:         ₹20,000
Transport:    ₹2,000
Medical:      ₹1,500
----------------------
Gross:       ₹73,500
```

---

# 21. Net Salary

Net Salary represents the final employee take-home amount.

Conceptually:

```text
Net Salary
=
Gross Salary
-
Employee Deductions
```

Example:

```text
Gross Salary:          ₹73,500

PF:                     ₹6,000
Professional Tax:         ₹200
Income Tax:             ₹5,000
--------------------------------
Net Salary:            ₹62,300
```

The final amount must be calculated by the backend.

---

# 22. Salary Rule Sequence

Each Salary Rule must have a sequence.

Example:

```text
100 → Basic Salary
200 → HRA
300 → Transport Allowance
400 → Medical Allowance
500 → Gross Salary
600 → Provident Fund
700 → Professional Tax
800 → Income Tax
900 → Net Salary
```

Rules must be processed in ascending sequence order.

This is important because later rules may depend on earlier rules.

Example:

```text
Basic Salary
      ↓
HRA calculation
      ↓
Gross Salary calculation
      ↓
Deduction calculation
      ↓
Net Salary calculation
```

---

# 23. Why Sequence Is Important

Incorrect sequence:

```text
Net Salary
Basic Salary
HRA
```

This can produce invalid calculations.

Correct sequence:

```text
Basic Salary
    ↓
Allowances
    ↓
Gross Salary
    ↓
Deductions
    ↓
Net Salary
```

The backend must always process rules deterministically.

---

# 24. Salary Rule Calculation Types

The Salary Engine should support:

```text
Fixed Amount
Percentage
Formula
```

---

# 25. Fixed Amount Calculation

Example:

```text
Transport Allowance

Calculation Type:
Fixed Amount

Amount:
₹2,000
```

Result:

```text
Transport Allowance = ₹2,000
```

---

# 26. Percentage Calculation

Example:

```text
House Rent Allowance

Calculation Type:
Percentage

Rate:
40%

Base:
Basic Salary
```

If:

```text
Basic Salary = ₹50,000
```

Then:

```text
HRA
=
50,000 × 40%
=
₹20,000
```

---

# 27. Percentage Base

A percentage rule must clearly define its base.

Examples:

```text
40% of Basic Salary
12% of Gross Salary
10% of Contract Wage
```

Do not store only:

```text
12%
```

without identifying what the percentage is calculated from.

---

# 28. Formula Calculation

Advanced rules may use a formula.

Example concept:

```text
Unpaid Leave Deduction
=
Daily Wage × Unpaid Leave Days
```

Or:

```text
Bonus
=
Basic Salary × Bonus Percentage
```

The formula engine must be secure.

Do not execute arbitrary unrestricted user code.

For the hackathon, formula support should use a controlled expression engine or predefined variables.

---

# 29. Formula Variables

Recommended payroll context:

```text
basic
gross
contract_wage
worked_days
paid_leave_days
unpaid_leave_days
days_in_period
total_deductions
```

Additional context can include:

```text
employee
contract
payrun
```

Sensitive objects must not expose unrestricted system access.

---

# 30. Salary Rule Conditions

A Salary Rule may not always apply.

Examples:

```text
Only for full-time employees
Only when unpaid leave exists
Only if basic salary exceeds threshold
```

The engine should support:

```text
Always Applicable
Conditional
```

---

# 31. Always Applicable

Example:

```text
Basic Salary
```

Condition:

```text
Always Applicable
```

The rule is processed for every applicable employee.

---

# 32. Conditional Rule

Example:

```text
Unpaid Leave Deduction
```

Condition:

```text
unpaid_leave_days > 0
```

If:

```text
unpaid_leave_days = 0
```

the rule should not generate a deduction.

---

# 33. Salary Structure Assignment

The Salary Structure must be assigned to an employee through their active Contract.

Example:

```text
Employee:
Aarav Mehta

Contract:
Software Engineer Contract

Salary Structure:
Standard Monthly Salary
```

The Payroll Engine should determine the applicable Salary Structure from the active Contract.

---

# 34. Contract Integration

The Contract module must provide salary information required by Payroll.

Example:

```text
Contract
│
├── Employee
├── Start Date
├── End Date
├── Salary Structure
├── Wage
└── Working Schedule
```

The Salary Structure should not duplicate employee-specific contract data unnecessarily.

Recommended separation:

```text
Salary Structure
→ reusable calculation template

Contract
→ employee-specific wage and employment details
```

---

# 35. Employee-Specific Salary Example

```text
Employee:
Aarav Mehta

Contract Wage:
₹50,000

Salary Structure:
Standard Monthly Salary
```

Rules:

```text
Basic = Contract Wage
HRA = 40% of Basic
Transport = ₹2,000
Medical = ₹1,500
```

Result:

```text
Basic       ₹50,000
HRA         ₹20,000
Transport    ₹2,000
Medical      ₹1,500
--------------------
Gross       ₹73,500
```

---

# 36. Recommended Standard Salary Structure

For the hackathon demo:

```text
STANDARD MONTHLY SALARY
```

Rules:

```text
100  BASIC
200  HRA
300  TRANSPORT
400  MEDICAL
500  GROSS
600  PF
700  PROFESSIONAL TAX
800  UNPAID LEAVE
900  INCOME TAX
1000 NET
```

This creates a complete and understandable payroll flow.

---

# 37. Basic Salary Rule

Example configuration:

```text
Name:
Basic Salary

Code:
BASIC

Category:
Basic

Sequence:
100

Calculation:
Contract Wage
```

For the MVP, the rule can directly use:

```text
contract_wage
```

---

# 38. HRA Rule

Example:

```text
Name:
House Rent Allowance

Code:
HRA

Category:
Allowance

Sequence:
200

Calculation:
Percentage

Rate:
40%

Base:
Basic Salary
```

Example:

```text
Basic = ₹50,000

HRA = ₹20,000
```

---

# 39. Transport Allowance Rule

Example:

```text
Name:
Transport Allowance

Code:
TRANSPORT

Category:
Allowance

Sequence:
300

Calculation:
Fixed Amount

Amount:
₹2,000
```

---

# 40. Medical Allowance Rule

Example:

```text
Name:
Medical Allowance

Code:
MEDICAL

Category:
Allowance

Sequence:
400

Calculation:
Fixed Amount

Amount:
₹1,500
```

---

# 41. Gross Salary Rule

Example:

```text
Name:
Gross Salary

Code:
GROSS

Category:
Gross

Sequence:
500
```

Formula concept:

```text
Gross
=
Basic
+
HRA
+
Transport
+
Medical
+
Other Earnings
```

The system should calculate this from applicable earnings.

---

# 42. Provident Fund Rule

Example:

```text
Name:
Provident Fund

Code:
PF

Category:
Deduction

Sequence:
600

Calculation:
Percentage

Rate:
12%

Base:
Basic Salary
```

Example:

```text
Basic = ₹50,000

PF = ₹6,000
```

For hackathon purposes, statutory values should be configurable and not permanently hardcoded as universal rules.

---

# 43. Professional Tax Rule

Example:

```text
Name:
Professional Tax

Code:
PT

Category:
Deduction

Sequence:
700

Calculation:
Fixed Amount

Amount:
₹200
```

This must remain configurable.

---

# 44. Unpaid Leave Deduction

This rule integrates Time Off with Payroll.

Example:

```text
Name:
Unpaid Leave Deduction

Code:
UNPAID_LEAVE

Category:
Deduction

Sequence:
800
```

Condition:

```text
unpaid_leave_days > 0
```

Formula:

```text
Daily Wage × Unpaid Leave Days
```

Conceptually:

```text
Daily Wage
=
Applicable Salary Base / Working Days
```

The exact calculation rule must be consistently defined by the payroll engine.

---

# 45. Income Tax Rule

Example:

```text
Name:
Income Tax

Code:
TAX

Category:
Deduction

Sequence:
900
```

For the hackathon MVP:

* Support a configurable fixed amount or percentage.
* Do not claim to implement complete statutory tax calculation unless it is actually implemented.

A simplified configurable tax rule is sufficient for demonstration.

---

# 46. Net Salary Rule

Example:

```text
Name:
Net Salary

Code:
NET

Category:
Net

Sequence:
1000
```

Formula:

```text
Net Salary
=
Gross Salary
-
Total Employee Deductions
```

---

# 47. Complete Calculation Example

Employee:

```text
Aarav Mehta
```

Contract Wage:

```text
₹50,000
```

Salary calculation:

```text
Basic Salary                  ₹50,000

HRA (40%)                     ₹20,000
Transport Allowance            ₹2,000
Medical Allowance              ₹1,500
-------------------------------------
Gross Salary                  ₹73,500

PF (12% of Basic)              ₹6,000
Professional Tax                 ₹200
Income Tax                     ₹5,000
-------------------------------------
Total Deductions              ₹11,200

-------------------------------------
NET SALARY                    ₹62,300
-------------------------------------
```

---

# 48. Salary Computation Flow

The Payroll Engine must calculate salary in sequence.

```text
1. Get Employee
        ↓
2. Find Active Contract
        ↓
3. Find Salary Structure
        ↓
4. Get Salary Rules
        ↓
5. Sort Rules by Sequence
        ↓
6. Build Payroll Context
        ↓
7. Evaluate Conditions
        ↓
8. Calculate Each Rule
        ↓
9. Store Salary Components
        ↓
10. Calculate Totals
        ↓
11. Generate Payslip
```

---

# 49. Payroll Context

The engine should build a controlled context.

Example:

```text
employee
contract
basic
gross
worked_days
paid_leave_days
unpaid_leave_days
days_in_period
```

Example:

```text
basic = 50000

unpaid_leave_days = 2

worked_days = 20
```

Rules can use these controlled values.

---

# 50. Rule Evaluation Result

Every evaluated rule should produce a result.

Example:

```text
{
  "code": "BASIC",
  "name": "Basic Salary",
  "category": "basic",
  "amount": 50000
}
```

Another:

```text
{
  "code": "HRA",
  "name": "House Rent Allowance",
  "category": "allowance",
  "amount": 20000
}
```

The Payslip should store calculated results rather than recalculating historical salary later from changed rules.

---

# 51. Historical Salary Integrity

Very important rule:

Once a Payslip is finalized, changing a Salary Structure or Salary Rule must not alter the old Payslip.

Example:

```text
September Payslip
HRA = 40%
```

Later HR changes:

```text
HRA = 50%
```

The September Payslip must remain:

```text
HRA = 40%
```

Historical payroll data must be preserved.

---

# 52. Salary Structure Versioning

For the hackathon MVP, full versioning may be optional.

However, the architecture should support:

```text
Effective From
Effective To
```

for future structures/rules.

Example:

```text
Structure A
Valid:
01 Jan 2026 → 30 Jun 2026

Structure B
Valid:
01 Jul 2026 → Current
```

The Payrun should select the correct applicable configuration.

---

# 53. Salary Rule Code

Every Salary Rule should have a unique code.

Examples:

```text
BASIC
HRA
TRANSPORT
MEDICAL
GROSS
PF
PT
UNPAID_LEAVE
TAX
NET
```

Codes are useful for:

* Formula references
* API responses
* Payroll engine
* Reports
* Payslip data

Avoid relying only on display names.

---

# 54. Validation Rules

The backend must validate:

### Salary Structure Name

Required.

### Code

Required and unique where applicable.

### Pay Frequency

Must be supported.

### Salary Rule Sequence

Must be numeric and deterministic.

### Calculation Type

Must be valid:

```text
Fixed
Percentage
Formula
```

### Fixed Amount

Required for fixed rules.

### Percentage

Must be valid for percentage rules.

### Percentage Base

Required for percentage calculations.

### Formula

Required for formula rules.

### Active Structure

Only active structures should normally be assigned to new Contracts.

### Rule References

Formula dependencies must be valid.

---

# 55. Prevent Circular Dependencies

Invalid example:

```text
Rule A depends on Rule B

Rule B depends on Rule A
```

This creates a circular calculation.

The backend should prevent circular dependencies.

Recommended simple MVP approach:

* Use sequence-based references only to earlier calculated values.
* A rule can reference only components already evaluated.

---

# 56. Duplicate Rule Validation

A Salary Structure should not accidentally contain duplicate rules with the same effective meaning/code.

Invalid:

```text
BASIC
BASIC
```

unless the system explicitly supports separate variants.

The backend should validate rule uniqueness within the structure.

---

# 57. Negative Amount Handling

The engine must consistently handle deductions.

Recommended model:

```text
Rule Result Amount = Positive Value
```

Category determines interpretation:

```text
Earning
→ added

Deduction
→ subtracted
```

Example:

```text
PF amount = 6000
Category = Deduction
```

Do not inconsistently store some deductions as positive and others as negative unless a clear accounting model is used.

---

# 58. Database Design

Recommended tables:

```text
salary_structures
salary_rules
salary_structure_rules
```

Depending on implementation, rules may directly belong to a structure or use a mapping table.

Recommended scalable model:

```text
Salary Structure
        ↓
salary_structure_rules
        ↓
Salary Rules
```

---

# 59. Salary Structures Table

Suggested fields:

```text
id
name
code
company_id
pay_frequency
active
description
effective_from
effective_to
created_at
updated_at
created_by
updated_by
```

---

# 60. Salary Rules Table

Suggested fields:

```text
id
name
code
category
sequence
calculation_type
fixed_amount
percentage
percentage_base
formula
condition_type
condition_formula
appears_on_payslip
active
description
created_at
updated_at
created_by
updated_by
```

---

# 61. Salary Structure Rules Mapping

Suggested fields:

```text
id
salary_structure_id
salary_rule_id
sequence
created_at
```

The mapping sequence can override the default rule sequence if required.

For the MVP, either:

```text
Rule sequence is global
```

or:

```text
Rule sequence is structure-specific
```

Choose one model and keep it consistent.

---

# 62. Contract Database Integration

The Contract must reference the Salary Structure.

Recommended field:

```text
salary_structure_id
```

Example:

```text
contracts
│
├── employee_id
├── salary_structure_id
├── wage
├── start_date
├── end_date
└── working_schedule_id
```

---

# 63. API Endpoints — Salary Structures

### List

```http
GET /api/payroll/salary-structures
```

### Get

```http
GET /api/payroll/salary-structures/{structure_id}
```

### Create

```http
POST /api/payroll/salary-structures
```

### Update

```http
PUT /api/payroll/salary-structures/{structure_id}
```

### Activate / Deactivate

```http
PATCH /api/payroll/salary-structures/{structure_id}/status
```

### Delete

Only allow deletion if not referenced by protected historical records.

```http
DELETE /api/payroll/salary-structures/{structure_id}
```

---

# 64. API Endpoints — Salary Rules

### List

```http
GET /api/payroll/salary-rules
```

### Get

```http
GET /api/payroll/salary-rules/{rule_id}
```

### Create

```http
POST /api/payroll/salary-rules
```

### Update

```http
PUT /api/payroll/salary-rules/{rule_id}
```

### Activate / Deactivate

```http
PATCH /api/payroll/salary-rules/{rule_id}/status
```

---

# 65. API Response — Salary Structure

Example:

```json
{
  "id": 1,
  "name": "Standard Monthly Salary",
  "code": "STANDARD_MONTHLY",
  "pay_frequency": "monthly",
  "active": true,
  "rules": [
    {
      "id": 1,
      "name": "Basic Salary",
      "code": "BASIC",
      "sequence": 100
    },
    {
      "id": 2,
      "name": "House Rent Allowance",
      "code": "HRA",
      "sequence": 200
    }
  ]
}
```

---

# 66. API Response — Salary Rule

Example:

```json
{
  "id": 2,
  "name": "House Rent Allowance",
  "code": "HRA",
  "category": "allowance",
  "sequence": 200,
  "calculation_type": "percentage",
  "percentage": 40,
  "percentage_base": "BASIC",
  "active": true
}
```

---

# 67. RBAC — Employee

Employee can:

* View their own finalized Payslips
* View salary information only where permitted

Employee cannot:

* Create Salary Structures
* Modify Salary Rules
* Change payroll formulas
* Run payroll for other employees

---

# 68. RBAC — HR Manager

HR Manager can:

* View Salary Structures
* View Salary Rules
* Assign structures through Contracts where authorized

Depending on the project role design, sensitive payroll configuration editing may be restricted.

---

# 69. RBAC — HR Payroll User

HR Payroll User can:

* View Salary Structures
* View Salary Rules
* Use them for payroll processing
* Generate payroll where permitted

They should not automatically receive unrestricted system administration rights.

---

# 70. RBAC — HR Payroll Manager

HR Payroll Manager can:

* Create Salary Structures
* Edit Salary Structures
* Manage Salary Rules
* Activate/deactivate structures
* Run payroll
* Validate payroll results
* Manage payroll configuration

---

# 71. RBAC — Admin

Admin has full access.

Admin can:

```text
Create
Read
Update
Delete
Configure
Activate
Deactivate
```

subject to historical payroll integrity protections.

---

# 72. RBAC Matrix

| Action                   |       Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
| ------------------------ | -------------: | ---------: | --------------: | -----------------: | ----: |
| View Salary Structures   | No/Own Context |        Yes |             Yes |                Yes |   Yes |
| Create Structure         |             No |   Optional |              No |                Yes |   Yes |
| Edit Structure           |             No |   Optional |              No |                Yes |   Yes |
| View Salary Rules        |             No |        Yes |             Yes |                Yes |   Yes |
| Create Rule              |             No |         No |              No |                Yes |   Yes |
| Edit Rule                |             No |         No |              No |                Yes |   Yes |
| Run Payroll              |             No |         No |             Yes |                Yes |   Yes |
| Delete Protected History |             No |         No |              No |                 No |    No |

All permissions must be enforced by the backend.

---

# 73. Frontend Structure

Recommended React structure:

```text
src/
└── pages/
    └── payroll/
        ├── SalaryStructures.jsx
        ├── SalaryStructureForm.jsx
        ├── SalaryStructureDetails.jsx
        ├── SalaryRules.jsx
        ├── SalaryRuleForm.jsx
        └── SalaryRuleDetails.jsx
```

Recommended reusable components:

```text
components/
├── SalaryRuleTable.jsx
├── SalaryRuleEditor.jsx
├── CalculationTypeSelector.jsx
├── SalaryStructureRules.jsx
└── SalaryPreview.jsx
```

---

# 74. Salary Structures UI

Recommended layout:

```text
---------------------------------------------------------
| Salary Structures                         [+ New]     |
---------------------------------------------------------

Search: [________________________]

---------------------------------------------------------
| Name              | Frequency | Rules | Status | Action |
---------------------------------------------------------
| Standard Monthly  | Monthly   | 10    | Active | View   |
| Executive Monthly | Monthly   | 12    | Active | View   |
---------------------------------------------------------
```

---

# 75. Salary Structure Detail UI

```text
------------------------------------------------
Standard Monthly Salary

Code: STANDARD_MONTHLY
Frequency: Monthly
Status: Active

------------------------------------------------
SALARY RULES

Seq   Rule                         Category
------------------------------------------------
100   Basic Salary                 Basic
200   House Rent Allowance         Allowance
300   Transport Allowance          Allowance
400   Medical Allowance            Allowance
500   Gross Salary                 Gross
600   Provident Fund               Deduction
700   Professional Tax             Deduction
800   Unpaid Leave Deduction       Deduction
900   Income Tax                   Deduction
1000  Net Salary                   Net
------------------------------------------------

[ Edit Structure ]
```

---

# 76. Salary Rules UI

```text
---------------------------------------------------------
| Salary Rules                              [+ New]     |
---------------------------------------------------------

Search: [________________________]

Filters:
[All Categories] [All Calculation Types]

---------------------------------------------------------
| Seq | Name          | Code  | Category  | Calculation |
---------------------------------------------------------
| 100 | Basic Salary  | BASIC | Basic     | Contract    |
| 200 | HRA           | HRA   | Allowance | Percentage |
| 300 | Transport     | TRANS | Allowance | Fixed      |
---------------------------------------------------------
```

---

# 77. Dynamic Calculation Form

The Salary Rule form should dynamically show fields.

### Fixed Amount

Show:

```text
Calculation Type: Fixed Amount

Amount:
[____________]
```

### Percentage

Show:

```text
Calculation Type: Percentage

Percentage:
[____] %

Base:
[Basic Salary ▼]
```

### Formula

Show:

```text
Calculation Type: Formula

Formula:
[____________________________]
```

Do not show irrelevant fields simultaneously.

---

# 78. Salary Preview

A Salary Structure preview is highly recommended for the hackathon demo.

Example:

```text
Salary Preview

Contract Wage: ₹50,000

--------------------------------
Basic Salary        ₹50,000
HRA                 ₹20,000
Transport            ₹2,000
Medical              ₹1,500
--------------------------------
Gross Salary        ₹73,500

PF                  ₹6,000
Professional Tax      ₹200
Income Tax          ₹5,000
--------------------------------
Net Salary          ₹62,300
--------------------------------
```

This can demonstrate the rule engine before running a full Payrun.

---

# 79. Salary Structure Validation

Before saving:

```text
✓ Name required
✓ Code required
✓ Frequency required
✓ At least one applicable rule
✓ Rule sequences valid
✓ Rule codes unique
✓ Calculation configuration valid
✓ Formula references valid
```

---

# 80. Payroll Integration

The Salary Structure module feeds the Payrun.

```text
Payrun
    ↓
Employee
    ↓
Active Contract
    ↓
Salary Structure
    ↓
Salary Rules
    ↓
Compute Components
    ↓
Payslip
```

The Payrun should not manually duplicate salary calculations.

Salary calculation logic should be centralized in the Salary Rule Engine.

---

# 81. Time Off Integration

Time Off affects payroll through approved leave.

Example:

```text
Approved Paid Leave
```

Can contribute:

```text
paid_leave_days
```

Example:

```text
Approved Unpaid Leave
```

Can contribute:

```text
unpaid_leave_days
```

The Salary Rule Engine can use these values.

Example:

```text
Unpaid Leave Deduction
=
Daily Wage × unpaid_leave_days
```

Time Off provides the attendance/leave quantity.

Salary Rules determine the financial impact.

---

# 82. Attendance Integration

Attendance can provide payroll inputs.

Example:

```text
Scheduled Working Days: 22
Present Days: 20
Approved Paid Leave: 1
Approved Unpaid Leave: 1
```

The Payroll Engine may derive:

```text
worked_days
paid_leave_days
unpaid_leave_days
```

The final salary treatment must be determined by Salary Rules.

---

# 83. Working Schedule Integration

Working Schedules determine expected work periods.

This can support:

```text
Working Days
Working Hours
Daily Wage Calculation
Leave Calculation
Attendance Calculation
```

The Salary Structure should not independently guess working days.

Use the applicable Contract/Working Schedule configuration.

---

# 84. Contract Change Handling

If an employee's salary changes:

```text
Old Contract:
₹50,000

New Contract:
₹60,000
```

Payroll must use the applicable Contract for the payroll period.

For the hackathon MVP:

* Clearly define the active contract selection.
* Prevent multiple conflicting active Contracts for the same employee.
* Preserve historical Payslip values.

Advanced mid-period prorating can be added later.

---

# 85. Payroll Calculation Safety

Salary computation must occur on the backend.

Frontend calculations are only previews.

The backend must be authoritative for:

```text
Basic
Allowances
Gross
Deductions
Net
```

Never trust client-submitted final salary values.

---

# 86. Formula Security

Never execute arbitrary formulas using unrestricted:

```text
eval()
```

or unrestricted server-side code execution.

Use:

* Controlled variables
* Whitelisted operations
* Restricted expression parser

For the hackathon MVP, predefined formulas may be safer than a fully open scripting engine.

---

# 87. Calculation Error Handling

If a rule cannot be calculated:

Example:

```text
HRA requires BASIC
```

but:

```text
BASIC is missing
```

The payroll computation must fail clearly.

Example:

```text
Salary calculation failed.

Rule: HRA
Reason: Required base BASIC was not available.
```

Do not silently generate incorrect salary.

---

# 88. Payroll Calculation Transaction

Recommended flow:

```text
BEGIN TRANSACTION

Get Active Contract
        ↓
Get Salary Structure
        ↓
Load Salary Rules
        ↓
Build Context
        ↓
Calculate Rules
        ↓
Validate Results
        ↓
Create Payslip Components
        ↓
Calculate Totals
        ↓
Create Payslip

COMMIT
```

If calculation fails:

```text
ROLLBACK
```

---

# 89. Demo Seed Data

Create:

## Salary Structure

```text
Standard Monthly Salary
```

## Rules

```text
100  Basic Salary
200  House Rent Allowance
300  Transport Allowance
400  Medical Allowance
500  Gross Salary
600  Provident Fund
700  Professional Tax
800  Unpaid Leave Deduction
900  Income Tax
1000 Net Salary
```

---

# 90. Demo Employee

```text
Employee:
Aarav Mehta

Contract:
Software Engineer

Contract Wage:
₹50,000

Salary Structure:
Standard Monthly Salary
```

---

# 91. Demo Calculation

```text
Basic Salary                  ₹50,000
HRA                           ₹20,000
Transport Allowance            ₹2,000
Medical Allowance              ₹1,500
-------------------------------------
Gross Salary                  ₹73,500

Provident Fund                 ₹6,000
Professional Tax                 ₹200
Income Tax                     ₹5,000
-------------------------------------
Total Deductions              ₹11,200

-------------------------------------
NET SALARY                    ₹62,300
-------------------------------------
```

---

# 92. Five-Minute Hackathon Demo

## Step 1 — Open Salary Structures

```text
Payroll
→ Salary Structures
```

Show:

```text
Standard Monthly Salary
```

---

## Step 2 — Open Structure

Show the ordered Salary Rules:

```text
Basic
↓
Allowances
↓
Gross
↓
Deductions
↓
Net
```

Explain:

> "The salary structure is reusable. Employee-specific salary information comes from the Contract."

---

## Step 3 — Open Contract

Show:

```text
Employee:
Aarav Mehta

Wage:
₹50,000

Salary Structure:
Standard Monthly Salary
```

---

## Step 4 — Show Salary Rules

Open:

```text
HRA
```

Show:

```text
40% of Basic Salary
```

Open:

```text
Provident Fund
```

Show:

```text
12% of Basic Salary
```

This demonstrates configurable salary logic.

---

## Step 5 — Preview Calculation

Show:

```text
Basic
+ Allowances
= Gross

Gross
- Deductions
= Net
```

---

## Step 6 — Time Off Integration

Show approved:

```text
Unpaid Leave
```

Explain that:

```text
Time Off
→ provides unpaid_leave_days
→ Salary Rule calculates deduction
```

---

## Step 7 — Run Payroll

The next module will demonstrate:

```text
Salary Structure
        ↓
Payrun
        ↓
Payslip
```

---

# 93. Critical Business Rules

The following rules are mandatory:

1. A Salary Structure is a reusable salary calculation template.
2. Employee-specific wage belongs to the Contract.
3. Salary Rules define individual salary components.
4. Rules must be processed in deterministic sequence order.
5. Later rules may use earlier calculated values.
6. Earnings increase Gross Salary.
7. Employee deductions reduce Net Salary.
8. Employer contributions must not be incorrectly treated as employee deductions.
9. Percentage rules must define a calculation base.
10. Formula rules must use a controlled and secure expression environment.
11. Salary calculations must be performed server-side.
12. Frontend salary previews are not authoritative.
13. Historical Payslips must not change when Salary Rules are later edited.
14. Only authorized payroll roles can modify salary configuration.
15. Salary Structures integrate with active Contracts.
16. Approved Time Off can provide payroll inputs.
17. Attendance can provide payroll inputs.
18. Working Schedules provide expected work-period information.
19. Circular rule dependencies must be prevented.
20. Invalid calculations must fail clearly rather than silently producing incorrect salary.

---

# 94. Testing Requirements

## Test 1 — Create Salary Structure

```text
Create:
Standard Monthly Salary
```

Expected:

```text
Structure created successfully
```

---

## Test 2 — Create Fixed Rule

Create:

```text
Transport Allowance
₹2,000
```

Expected:

```text
Result = ₹2,000
```

---

## Test 3 — Percentage Rule

```text
Basic = ₹50,000
HRA = 40%
```

Expected:

```text
HRA = ₹20,000
```

---

## Test 4 — Gross Calculation

Input:

```text
Basic = 50,000
HRA = 20,000
Transport = 2,000
Medical = 1,500
```

Expected:

```text
Gross = 73,500
```

---

## Test 5 — Deduction Calculation

```text
PF = 12% of Basic
```

Expected:

```text
PF = ₹6,000
```

---

## Test 6 — Net Calculation

```text
Gross = ₹73,500
Deductions = ₹11,200
```

Expected:

```text
Net = ₹62,300
```

---

## Test 7 — Rule Sequence

Verify:

```text
Basic
```

is calculated before:

```text
HRA
```

when HRA depends on Basic.

---

## Test 8 — Conditional Rule

```text
unpaid_leave_days = 0
```

Expected:

```text
Unpaid Leave Deduction not applied
```

---

## Test 9 — Formula Error

Create a rule requiring a missing base.

Expected:

```text
Calculation error
```

with a clear message.

---

## Test 10 — Permission

Employee attempts:

```text
POST /api/payroll/salary-rules
```

Expected:

```text
403 Forbidden
```

---

## Test 11 — Historical Integrity

Generate a Payslip.

Change:

```text
HRA = 40%
```

to:

```text
HRA = 50%
```

Expected:

```text
Old Payslip remains unchanged
```

---

## Test 12 — Contract Integration

Employee with active Contract:

```text
Wage = ₹50,000
Structure = Standard Monthly
```

Expected:

```text
Payroll uses the correct wage and structure.
```

---

# 95. Definition of Done

## Salary Structures

* [ ] Structure list exists
* [ ] Structure form exists
* [ ] Name works
* [ ] Code works
* [ ] Pay Frequency works
* [ ] Active/Inactive works
* [ ] Salary Rules can be attached
* [ ] Structure validation works

## Salary Rules

* [ ] Rule list exists
* [ ] Rule form exists
* [ ] Name works
* [ ] Code works
* [ ] Category works
* [ ] Sequence works
* [ ] Fixed Amount works
* [ ] Percentage works
* [ ] Percentage Base works
* [ ] Formula support works
* [ ] Conditions work
* [ ] Active/Inactive works

## Calculation Engine

* [ ] Rules load correctly
* [ ] Rules sort by sequence
* [ ] Conditions evaluate
* [ ] Fixed rules calculate
* [ ] Percentage rules calculate
* [ ] Formula rules calculate safely
* [ ] Gross calculates correctly
* [ ] Deductions calculate correctly
* [ ] Net calculates correctly
* [ ] Errors are handled

## Integrations

* [ ] Contract integration
* [ ] Employee integration
* [ ] Working Schedule integration
* [ ] Attendance integration
* [ ] Time Off integration
* [ ] Payrun integration
* [ ] Payslip integration

## Security

* [ ] Employee cannot configure Salary Rules
* [ ] HR Payroll roles have correct access
* [ ] Admin access works
* [ ] Backend authorization enforced
* [ ] Formula execution is restricted

## Historical Integrity

* [ ] Payslip stores calculated results
* [ ] Old Payslips do not change after rule edits
* [ ] Inactive structures remain available for history

---

# 96. Implementation Priority

## Priority 1 — Mandatory

```text
Salary Structures
        ↓
Salary Rules
        ↓
Rule Sequence
        ↓
Fixed Amount
        ↓
Percentage
        ↓
Gross Calculation
        ↓
Deduction Calculation
        ↓
Net Salary
```

---

## Priority 2

```text
Contract Integration
        ↓
Time Off Integration
        ↓
Attendance Integration
        ↓
Payroll Context
```

---

## Priority 3

```text
Formula Builder
Advanced Conditions
Salary Preview
Structure Versioning
Employer Cost Reporting
```

---

# 97. Final Architecture

The complete PeoplePay360 salary architecture is:

```text
EMPLOYEE
    │
    ▼
CONTRACT
    │
    ├── Wage
    ├── Working Schedule
    └── Salary Structure
              │
              ▼
         SALARY RULES
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
     BASIC  EARNINGS DEDUCTIONS
       │      │       │
       └──────┼───────┘
              ▼
         GROSS SALARY
              │
              ▼
       EMPLOYEE DEDUCTIONS
              │
              ▼
          NET SALARY
              │
              ▼
           PAYRUN
              │
              ▼
           PAYSLIP
```

---

# 98. Final Principle

The Salary Structures module is **not just a list of salary components**.

It is the configurable calculation engine that connects:

```text
Contract
    ↓
Salary Structure
    ↓
Salary Rules
    ↓
Attendance
    ↓
Time Off
    ↓
Payroll Inputs
    ↓
Gross Salary
    ↓
Deductions
    ↓
Net Salary
    ↓
Payslip
```

The most important hackathon demonstration is:

```text
Employee Contract
Wage = ₹50,000
        ↓
Salary Structure selected
        ↓
Rules executed in sequence
        ↓
Basic + Allowances
        ↓
Gross Salary = ₹73,500
        ↓
PF + Tax + Other Deductions
        ↓
Net Salary = ₹62,300
        ↓
Payslip generated
```

This proves that PeoplePay360 contains a **real configurable payroll calculation workflow**, rather than simple static salary fields.

```

**Next logical file:** `08_PAYROLL_PAYRUNS.md` — where all modules come together: **Employees + Contracts + Attendance + Time Off + Salary Structures → Payrun → Payslips**.
```