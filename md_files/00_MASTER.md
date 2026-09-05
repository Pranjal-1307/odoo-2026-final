# PeoplePay360 — MASTER AI BUILD SPECIFICATION

## 1. PROJECT IDENTITY

Project Name:

PeoplePay360 — Integrated HR & Payroll Operations Platform

Project Type:

HR + Payroll Management System

Project Context:

Odoo Hackathon Final

Primary Objective:

Build a fully functional, integrated HR and Payroll platform based on the supplied PeoplePay360 problem statement and the supplied `HRMS OXP - 24 hours.svg` functional screen-flow/design reference.

IMPORTANT:

This is NOT a simple CRUD project.

The system must implement:

- Real business logic
- Real database relationships
- Real workflows
- Real payroll calculations
- Real role-based permissions
- Real attendance calculations
- Real leave allocation/consumption
- Real salary-rule execution
- Real Payrun processing
- Real Payslip generation
- Real PDF generation
- Real email delivery
- Real dashboard aggregation

Do NOT create static/mock screens that only look functional.

Every important button, calculation, workflow and relationship must work.

---

# 2. SOURCE OF TRUTH

The implementation must be based on TWO supplied sources:

1. PeoplePay360 HR & Payroll problem statement PDF.
2. HRMS OXP - 24 hours.svg functional screen-flow/design reference.

The PDF defines the official functional requirements.

The SVG provides the detailed functional screen flow, screen structure, fields, actions, navigation, UI behavior, example data and visual/UX reference.

When implementing the system:

- Preserve the functional requirements of the PDF.
- Preserve the important screen hierarchy and interaction behavior shown in the SVG.
- Do not remove required functionality.
- Do not replace required business logic with hardcoded values.
- Do not treat the SVG as merely a color/style reference.

---

# 3. PRODUCT VISION

PeoplePay360 is an integrated HR and Payroll platform.

The central object is the Employee.

The complete business flow is:

Employee
    ↓
Contract
    ↓
Working Schedule
    ↓
Attendance
    ↓
Time Off / Leave
    ↓
Salary Structure
    ↓
Salary Rules
    ↓
Payrun
    ↓
Payslip
    ↓
PDF / Email
    ↓
Payroll Dashboard

The modules must be connected.

Do NOT build isolated modules.

Example:

An Employee must have related:

- Contracts
- Attendance records
- Time Off requests
- Leave allocations
- Payslips

A Contract must provide payroll-relevant information.

A Payrun must use the Contract applicable to the selected payroll period.

A Payrun must use its selected Salary Structure.

The Salary Structure must contain Salary Rules.

Salary Rules must actually calculate the Payslip.

The Payslip must provide data to the Dashboard.

---

# 4. CORE PRINCIPLE

The project should behave like a real HR department and payroll department.

Think of the system as:

                    PEOPLEPAY360
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
    EMPLOYEES        ATTENDANCE        TIME OFF
        |                |                |
        v                v                v
    CONTRACTS       WORK SCHEDULE       LEAVE
        |                                BALANCE
        |                                   |
        v                                   v
 SALARY STRUCTURE                      LEAVE REQUEST
        |
        v
   SALARY RULES
        |
        v
      PAYRUN
        |
        v
     PAYSLIP
       / \
      /   \
     v     v
   PDF    EMAIL
        |
        v
   DASHBOARD

Every arrow represents a real relationship or business process.

---

# 5. TECHNOLOGY STACK

Recommended implementation stack:

## Frontend

React.js + Vite

Responsibilities:

- Application UI
- Navigation
- Forms
- Lists
- Kanban
- Dashboard
- Charts
- Wizards
- Status indicators
- User interaction

## Styling

Tailwind CSS

Use it to reproduce the clean Odoo-style ERP interface shown in the SVG.

## Backend

Python + FastAPI

Responsibilities:

- REST APIs
- Authentication
- Authorization
- Business logic
- Payroll engine
- Salary-rule execution
- Leave calculations
- Attendance calculations
- Payrun processing
- Dashboard aggregation

## Database

PostgreSQL

Use relational database design.

## Authentication

JWT-based authentication.

Implement role-based access control.

## PDF

WeasyPrint or an equivalent reliable server-side PDF generation solution.

## Email

SMTP-based email delivery.

## Charts

Recharts or equivalent React chart library.

## API

REST API between React and FastAPI.

## Testing

Backend:

- Pytest
- FastAPI TestClient

Frontend:

- Appropriate React testing solution where useful.

## Version Control

Git + GitHub.

---

# 6. ARCHITECTURE PRINCIPLES

Use a clean layered architecture.

Recommended:

Frontend
    ↓
API Layer
    ↓
Service / Business Logic Layer
    ↓
Repository / Data Access Layer
    ↓
PostgreSQL

Do not place complex payroll logic directly inside UI components.

Do not hardcode business rules in React.

Business logic must be implemented in the backend.

---

# 7. MAIN MODULES

The system must contain these major modules:

1. Authentication
2. User Management
3. Role-Based Access Control
4. Employees
5. Contracts
6. Working Schedules
7. Attendance
8. Time Off Requests
9. Time Off Allocations
10. Time Off Types
11. Salary Structures
12. Salary Rules
13. Payruns
14. Payslips
15. PDF Payslips
16. Bulk Payslip Email
17. Payroll Dashboard
18. Reports / Analytics

---

# 8. MAIN NAVIGATION

Follow the navigation hierarchy shown in the SVG.

Top-level navigation:

Employees
Contracts
Attendance
Time Off
Payroll
Reports

Time Off dropdown:

- Requests
- Allocations
- Time Off Types

Payroll section:

- Payruns
- Payslips
- Salary Structures
- Salary Rules

Reports:

- Payroll Dashboard

Maintain a consistent ERP-style navigation system.

---

# 9. USER ROLES

The system must support FIVE major roles.

## ROLE 1 — EMPLOYEE

Employee can:

- View own employee information.
- View own attendance.
- Create allowed attendance entries.
- View own leave balances.
- Create own Time Off Requests.
- View own Time Off Requests.
- View own payslips where applicable.

Employee MUST NOT:

- Manage employees.
- Manage contracts.
- Manage schedules.
- Manage other employees' attendance.
- Approve leave.
- Manage payroll.
- Modify salary structures.
- Modify salary rules.
- Manage users.
- Assign roles.

Employee data must be scoped to the logged-in employee.

---

# 10. ROLE 2 — HR MANAGER

HR Manager can manage:

- Employees
- Attendance
- Contracts
- Working Schedules
- Time Off

HR Manager can:

- Create employees.
- Update employees.
- Archive employees.
- Create/update contracts.
- Manage working schedules.
- Correct attendance.
- Manage Time Off.
- Approve Time Off.
- Refuse Time Off.
- Manage allocations.

HR Manager MUST NOT have payroll administration access.

---

# 11. ROLE 3 — HR PAYROLL USER

HR Payroll User includes HR management permissions and additionally can:

- Create Payruns.
- Read Payruns.
- Update Payruns.
- Create Payslips.
- Read Payslips.
- Update Payslips.

Salary Structures:

- READ ONLY

Salary Rules:

- READ ONLY

HR Payroll User MUST NOT modify Salary Structures or Salary Rules.

---

# 12. ROLE 4 — HR PAYROLL MANAGER

HR Payroll Manager has full HR + Payroll management.

Can CRUD:

- Employees
- Attendance
- Contracts
- Working Schedules
- Time Off
- Allocations
- Payruns
- Payslips
- Salary Structures
- Salary Rules

Can configure the payroll engine.

---

# 13. ROLE 5 — ADMIN

Admin has complete system access.

Admin can:

- Manage all records.
- Manage all modules.
- Create users.
- Edit users.
- Assign roles.
- Change permissions.
- Manage system configuration.
- Access all HR data.
- Access all payroll data.

IMPORTANT:

Users must not be able to elevate their own role.

Role changes must require appropriate authorization.

---

# 14. EMPLOYEE MODULE

Employee is the central HR object.

Required views:

- Kanban
- List
- Form

## Employee Kanban

Each card should display:

- Avatar / initials
- Employee name
- Job position
- Department
- Active status

Actions:

- Search
- New
- Kanban/List toggle

Clicking an employee card opens the Employee Form.

---

# 15. EMPLOYEE LIST

Required columns:

- Employee
- Work Email
- Job Position
- Department
- Status

Support:

- Search
- Sorting
- Filtering
- Open record
- Create
- Edit

---

# 16. EMPLOYEE FORM

Employee form should contain:

## Identity

- Employee name
- Employee ID where applicable
- Avatar/photo if supported

## Contact

- Work Email
- Phone

## Work Information

- Department
- Manager
- Job Position
- Working Schedule
- Company
- Work Location
- Employee Type
- Status

## Smart Buttons

Employee Form must contain related-record smart buttons:

- Contracts
- Attendance
- Time Off
- Allocations
- Payslips where appropriate

Each smart button should:

- Show record count.
- Open related records.
- Apply employee filter automatically.

Example:

Employee:

Aarav Mehta

Contracts: 2
Attendance: 22
Time Off: 3
Allocations: 2

Clicking Contracts opens only Aarav's contracts.

---

# 17. CONTRACT MANAGEMENT

Employees may have multiple contracts over time.

Do NOT overwrite historical contracts.

Example:

Contract 1:

01-Jan-2025 → 31-Dec-2025
Salary = ₹78,000
Status = Expired

Contract 2:

01-Jan-2026 → Open
Salary = ₹85,000
Status = Running

Both records must remain available.

---

# 18. CONTRACT LIST

Columns:

- Contract
- Employee
- Start
- End
- Wage / Month
- Status

Actions:

- Search
- Filter
- Sort
- New
- Open
- Edit

Running contracts must be visually identifiable.

---

# 19. CONTRACT FORM

Fields:

- Employee
- Start Date
- End Date
- Status
- Department
- Job Position
- Wage / Month
- Working Schedule
- Salary Structure
- Notes

---

# 20. CRITICAL CONTRACT BUSINESS RULE

Payroll MUST select the contract applicable to the selected payroll period.

Example:

Employee:

Aarav

Contracts:

2025 Contract:
01-Jan-2025 → 31-Dec-2025
₹78,000

2026 Contract:
01-Jan-2026 → open
₹85,000

Payrun:

February 2026

System MUST use:

2026 Contract
₹85,000

It must NOT simply select the latest contract without checking dates.

---

# 21. CONCURRENT CONTRACT VALIDATION

One employee must not have multiple Running contracts covering the same period.

Validate on:

- Contract creation
- Contract update
- Payrun computation

If overlapping contracts are found:

- Show warning/error.
- Do not silently choose one.

---

# 22. WORKING SCHEDULE

Working Schedule defines expected working time.

Fields:

- Schedule Name
- Company
- Days per Week
- Hours per Week
- Timezone
- Status

Weekly schedule rows:

- Day
- Start Time
- End Time
- Break
- Hours

Actions:

- Add Day
- Remove Day

---

# 23. AUTOMATIC WEEKLY HOUR CALCULATION

Do NOT hardcode:

40 hours/week.

Calculate it.

Formula:

worked_hours =
    end_time
    - start_time
    - break

weekly_hours =
    SUM(all valid daily worked_hours)

days_per_week =
    COUNT(valid schedule days)

Example:

Monday-Friday:

09:00 → 18:00

Break:

1 hour

Daily:

8 hours

Weekly:

40 hours

The displayed Hours/Week must update automatically.

---

# 24. WORKING SCHEDULE VALIDATION

Validate:

- Start time exists.
- End time exists.
- End is after start for standard same-day shifts.
- Break is not negative.
- Break does not exceed shift duration.
- Duplicate days are handled.
- Invalid rows are rejected.
- Weekly hours are recalculated after changes.

Timezone must be respected for attendance timestamps.

---

# 25. ATTENDANCE

Attendance can be accessed:

1. Globally from Attendance.
2. From Employee → Attendance smart button.

---

# 26. ATTENDANCE LIST

Columns:

- Employee
- Check In
- Check Out
- Worked Hours
- Status

---

# 27. ATTENDANCE FORM

Fields:

- Employee
- Check In
- Check Out
- Worked Hours
- Department
- Manager
- Status
- Overtime
- Notes

Worked Hours should be calculated.

Do not ask users to manually enter worked hours unless it is a controlled correction process.

---

# 28. ATTENDANCE STATUS

Support statuses such as:

- Present
- Absent
- Late
- Missing Check-out
- Other valid exception states

Status should be derived from:

- Attendance
- Working Schedule
- Check In
- Check Out

where practical.

---

# 29. QUICK CHECK-IN / CHECK-OUT

The SVG contains a quick Attendance widget.

It should show:

- Attendance icon
- Current time
- Today's elapsed time
- Check In / Check Out action

Behavior:

If employee has no active attendance:

SHOW:

Check In

After Check In:

- Create active attendance session.
- Show green active indicator.
- Start elapsed time.

If already checked in:

SHOW:

Check Out

After Check Out:

- Save check-out.
- Calculate worked hours.
- Close active session.

---

# 30. ATTENDANCE VALIDATION

Prevent:

- Check-out before check-in.
- Multiple active attendance sessions.
- Impossible timestamps.
- Unauthorized manual modifications.

Missing check-outs must be detectable.

Manual edits must be restricted to authorized users.

---

# 31. OVERTIME

Attendance should support overtime.

Example:

Expected:

8 hours

Actual:

8.5 hours

Overtime:

0.5 hours

Do not hardcode overtime.

Calculate it from schedule and attendance according to the configured policy.

---

# 32. TIME OFF MODULE

Top-level Time Off navigation must contain:

- Requests
- Allocations
- Time Off Types

---

# 33. TIME OFF TYPES

Fields:

- Type Name
- Unit
- Requires Allocation
- Active
- Approval
- Payroll / Work Entry behavior
- Display Color
- Configuration Notes

Supported units:

- Days
- Hours

Example types:

Paid Time Off
Sick Leave
Comp Off

---

# 34. TIME OFF ALLOCATION

Allocation represents the amount of leave available to an employee.

Example:

Allocated:

20 days

Taken:

8 days

Remaining:

12 days

Fields:

- Employee
- Time Off Type
- Allocated
- Taken
- Remaining
- Status
- Approver
- Validity

---

# 35. ALLOCATION WORKFLOW

Possible states:

Draft / To Approve
↓
Approved

or:

Draft
↓
Refused

If allocation requires approval:

Do not count it as available leave until approved.

---

# 36. TIME OFF REQUEST

Fields:

- Employee
- Time Off Type
- Start Date
- End Date
- Duration
- Status
- Approver
- Reason
- Allocation Used

Actions:

- Submit
- Approve
- Refuse

---

# 37. LEAVE BALANCE BUSINESS RULE

If Time Off Type requires allocation:

Check:

Available Balance =
Allocated - Taken

Before approval.

If sufficient:

Allow approval.

After approval:

Taken increases.

Remaining decreases.

Example:

20 allocated
8 taken
12 remaining

Employee requests:

3 days

After approval:

20 allocated
11 taken
9 remaining

Do NOT deduct leave when request is merely created.

Do NOT deduct twice if approval is triggered twice.

---

# 38. LEAVE VALIDATION

Validate:

- End date >= Start date.
- Duration > 0.
- Allocation exists where required.
- Allocation is approved.
- Balance is sufficient.
- Refused requests do not consume balance.
- Cancelled requests do not consume balance.
- Repeated approval does not double-consume balance.

---

# 39. SALARY STRUCTURES

Salary Structure is a container for Salary Rules.

Examples:

- Regular Salary
- Intern Salary
- Contractor

Fields:

- Structure Name
- Active
- Salary Rules

List columns:

- Structure Name
- Number of Rules
- Number of Employees
- Active

---

# 40. SALARY STRUCTURE RELATIONSHIPS

One Salary Structure:

→ contains many Salary Rules.

A Contract may reference a Salary Structure.

A Payrun selects a Salary Structure.

The selected Payrun Salary Structure determines which Salary Rules are executed.

---

# 41. SALARY RULES

Salary Rules are the actual payroll calculation logic.

List columns:

- Rule Name
- Code
- Category
- Structure
- Sequence

Form fields:

- Rule Name
- Code
- Category
- Sequence
- Salary Structure
- Computation Method
- Percentage
- Quantity
- Fixed Amount
- Formula / Python-style code where applicable

---

# 42. SALARY RULE CATEGORIES

At minimum support:

- Basic
- Allowance
- Gross
- Deduction
- Net

---

# 43. SALARY RULE CALCULATION METHODS

Support:

## Method 1 — Fixed Amount

Example:

Transport Allowance:

₹5,000

---

## Method 2 — Percentage

Example:

HRA:

20% of Basic

If Basic:

₹50,000

HRA:

₹10,000

---

## Method 3 — Formula / Python-style calculation

Used for advanced calculations such as:

- Attendance-based salary
- Overtime
- Unpaid leave deductions
- Complex allowances
- Rules depending on previous rules

If arbitrary Python execution is unsafe, implement a restricted/sandboxed expression engine that provides equivalent functionality safely.

---

# 44. SALARY RULE SEQUENCE

Rules must execute in ascending sequence.

Example:

1 BASIC
10 HRA
20 STD
30 BONUS
40 LTA
50 FIX
60 GROSS
70 LWF
80 PF
90 ESIC
100 PT
110 NET

This sequence is reference configuration.

Do NOT hardcode this exact sequence into the engine.

The engine must execute whatever active rules are configured in the selected Salary Structure, sorted by sequence.

---

# 45. SALARY RULE DEPENDENCIES

Example:

BASIC:

₹50,000

HRA:

20% of BASIC

STD:

₹10,000

GROSS:

BASIC + HRA + STD

PF:

12% of BASIC

NET:

GROSS - deductions

The engine must make previous rule results available to later rules.

---

# 46. SALARY CALCULATION ENGINE

The payroll engine must:

1. Receive Employee.
2. Receive applicable Contract.
3. Receive Payrun.
4. Receive payroll period.
5. Receive selected Salary Structure.
6. Load active Salary Rules.
7. Sort rules by Sequence.
8. Execute each rule.
9. Store result by rule Code.
10. Make previous values available.
11. Build Payslip lines.
12. Calculate totals.
13. Return final payroll result.
14. Generate warnings/errors where necessary.

---

# 47. NEVER HARDCODE PAYROLL RESULTS

BAD:

if employee == "Aarav":
    net_salary = 75000

GOOD:

Payrun
↓
Contract
↓
Salary Structure
↓
Salary Rules
↓
Rule sequence
↓
Calculation
↓
Payslip
↓
Net Salary

Changing a Salary Rule must affect future payroll calculations.

---

# 48. PAYRUN

A Payrun represents payroll processing for a specific period.

Fields:

- Name
- Salary Structure
- Period Start
- Period End
- Status
- Employee Count
- Warning Count

---

# 49. PAYRUN CREATION MUST BE TWO STEP

This is a CRITICAL requirement.

## STEP 1

User selects:

- Salary Structure
- Period Start
- Period End
- Employee Type / Scope
- Company where applicable

Buttons:

Continue
Discard

IMPORTANT:

Clicking Continue MUST NOT create the Payrun.

---

# 50. PAYRUN WIZARD STEP 2

Show eligible employee records.

Fields/columns:

- Checkbox
- Employee
- Working Hours
- Start Date
- Wage

Allow:

- Search
- Filters
- Select individual employees
- Back
- Create Payrun

Only after:

CREATE PAYRUN

should the Payrun be created.

---

# 51. EMPLOYEE SELECTION RULE

Only explicitly selected employees belong to the Payrun.

Do not automatically include every employee.

Example:

Eligible:

42 employees

Selected:

5 employees

Payrun:

5 employees

---

# 52. PAYRUN PROCESSING

Payrun lifecycle:

Draft
↓
Compute
↓
Validate
↓
Mark Paid

Actions:

- Compute
- Validate
- Mark Paid
- Send Payslips

---

# 53. PAYRUN COMPUTE

For each selected employee:

1. Resolve applicable Contract.
2. Check contract dates.
3. Resolve selected Salary Structure.
4. Load Salary Rules.
5. Resolve attendance context.
6. Resolve Time Off context.
7. Execute Salary Rules.
8. Generate/update Payslip.
9. Generate warnings.
10. Store salary-rule lines.

---

# 54. PAYRUN VALIDATION

Before finalization, check:

- Employee data.
- Contract.
- Contract validity.
- Concurrent contracts.
- Salary Structure.
- Salary Rules.
- Duplicate payslip.
- Missing bank/account information.
- Missing required information.
- Calculation errors.
- Other payroll configuration issues.

Warnings must be visible.

Do not silently finalize problematic payroll.

---

# 55. PAYROLL WARNINGS

At minimum support warnings for:

## Missing Bank/Account Information

Example:

A/C missing

---

## Duplicate Payslip

Example:

Duplicate

---

## Missing Contract

Example:

No applicable contract.

---

## Incomplete Employee Information

Example:

Missing required payroll data.

---

## Contract Attention

Example:

Contract expiring soon.

---

# 56. MARK PAID

Mark Paid should be available only after required validation conditions are satisfied.

After Paid:

- Preserve payroll history.
- Do not delete data.
- Do not silently recalculate historical payroll because future configuration changes.

---

# 57. PAYSLIP

Payslip represents one employee's salary result for one payroll period.

Fields:

- Employee
- Salary Structure
- Payrun
- Period
- Status
- Worked Days

---

# 58. PAYSLIP COMPUTATION TABLE

Display:

- Rule
- Category
- Amount
- Code

Example:

Basic Salary
Basic
₹50,000
BASIC

House Rent Allowance
Allowance
₹20,000
HRA

Standard Allowance
Allowance
₹10,000
STD

Gross Salary
Gross
₹80,000
GROSS

Provident Fund
Deduction
-₹3,000
PF

Professional Tax
Deduction
-₹2,000
PT

Net Salary
Net
₹75,000
NET

These values must come from the configured salary rules.

---

# 59. PAYSLIP TOTALS

Show:

- Basic
- Allowances
- Gross
- Deductions
- Net

The user must be able to understand how Net Salary was calculated.

---

# 60. PAYSLIP AUDITABILITY

Every Payslip should allow a reviewer to determine:

- Which employee.
- Which Payrun.
- Which period.
- Which Contract.
- Which Salary Structure.
- Which Salary Rules.
- Which rule sequence.
- Which rule amount.
- Gross.
- Deductions.
- Net.

---

# 61. PAYSLIP PDF

Each Payslip must have:

PRINT PAYSLIP

action.

Generate a real PDF.

PDF should include:

- Company
- Employee
- Payroll period
- Salary structure where useful
- Worked days
- Earnings
- Allowances
- Gross
- Deductions
- Net
- Professional payslip layout

---

# 62. BULK EMAIL

Parent Payrun must provide:

SEND PAYSLIPS

Behavior:

1. Find Payrun Payslips.
2. Check employee email.
3. Generate/retrieve PDF.
4. Attach PDF.
5. Send email.
6. Record success/failure.
7. Display results.

Example:

Total:

42

Sent:

40

Failed:

2

Failure reasons:

- Missing email
- Email provider error

---

# 63. EMAIL SECURITY

Employees must never receive another employee's payslip.

Each employee's email must receive only their own Payslip.

---

# 64. PAYROLL DASHBOARD

Dashboard must use LIVE DATA.

Never hardcode dashboard numbers.

Required filters:

- Period
- Department
- Employee Type
- Company

---

# 65. DASHBOARD KPI CARDS

Required metrics:

1. Total Net Salary Paid
2. Payslips Generated
3. Average Salary / Employee
4. Approved Time Off Days
5. Attendance Health

Example reference values from SVG:

Total Net Salary Paid:
₹18.4L

Payslips Generated:
148

Avg Salary / Employee:
₹12,432

Approved Time Off:
34 Days

Attendance Health:
94%

IMPORTANT:

These are reference/demo values.

Do not hardcode them.

---

# 66. SALARY COST BY DEPARTMENT

Dashboard chart:

Salary Cost by Department

Example:

HR
Sales
Support
Finance
IT

Data source:

Payslips + Employees + Departments.

Calculate actual salary expenditure.

---

# 67. MONTHLY NET SALARY TREND

Show monthly salary trends.

Source:

Historical Payruns/Payslips.

Group by:

Month

Calculate:

SUM(Net Salary)

---

# 68. PAYROLL ALERTS

Dashboard should show alerts such as:

- Employees missing bank account.
- Duplicate payslips.
- Draft payroll not validated.
- Contracts expiring.
- Missing required employee data.

Alerts must be generated dynamically.

---

# 69. ATTENDANCE OVERVIEW

Show:

- Present
- Late
- Absent
- Overtime
- Missing Check-outs
- Manual Edits
- Attendance Coverage

All data must come from Attendance records.

---

# 70. TIME OFF OVERVIEW

Show:

- Time Off Type
- Approved Days
- Pending
- Remaining Balance

Data comes from:

- Time Off Requests
- Allocations

---

# 71. DEPARTMENT OVERVIEW

Show:

- Department
- Headcount
- Monthly Salary

Use:

Employees
+
Contracts
+
Payslips

---

# 72. DASHBOARD FILTERING

When user changes:

Department

the dashboard must update relevant:

- KPIs
- Charts
- Tables
- Alerts

Same for:

- Period
- Employee Type
- Company

---

# 73. LIVE DATA REQUIREMENT

Example:

Create a new Payslip.

Dashboard:

Payslips Generated increases.

Create/mark a Payslip paid.

Total Net Salary Paid updates.

Approve Time Off.

Approved Time Off updates.

Add Attendance.

Attendance Overview updates.

No manually entered fake numbers.

---

# 74. UI / UX DESIGN

The interface must follow the supplied SVG's functional hierarchy.

Use an Odoo-style ERP design.

Important patterns:

- Top navigation.
- Search.
- Filters.
- List views.
- Kanban views.
- Form views.
- Smart buttons.
- Status badges.
- Primary action buttons.
- Wizard steps.
- Tables.
- Dashboard cards.
- Charts.
- Alerts.

The SVG should be treated as a functional design reference.

---

# 75. GLOBAL NAVIGATION

Recommended:

Employees
Contracts
Attendance
Time Off ▼
Payroll
Reports

Time Off:

Requests
Allocations
Time Off Types

Payroll:

Payruns
Payslips
Salary Structures
Salary Rules

Reports:

Payroll Dashboard

---

# 76. UI PRINCIPLES

Maintain:

- Consistent spacing.
- Consistent typography.
- Clear page titles.
- Clear primary buttons.
- Clear secondary actions.
- Status badges.
- Warning indicators.
- Responsive design.
- Professional enterprise appearance.

Avoid:

- Excessive animations.
- Decorative UI with no purpose.
- Huge empty sections.
- Random colors.
- Unnecessary pages.
- Fake buttons.

---

# 77. SMART BUTTONS

Smart buttons are important.

Employee Form should show counts and navigation for:

- Contracts
- Attendance
- Time Off
- Allocations
- Payslips where applicable

Clicking the smart button must open the correct filtered records.

---

# 78. FORM STATE ACTIONS

Actions must depend on record state.

Example:

Draft Payrun:

Available:

Compute

After Compute:

Validate

After Validation:

Mark Paid

After Paid:

No destructive recalculation.

The UI should not show meaningless actions.

---

# 79. HISTORICAL DATA

Historical records must be preserved.

Examples:

Old contracts.

Old Payruns.

Old Payslips.

Old attendance.

Old Time Off.

Paid payroll must remain available.

Do not destroy historical data because a configuration changed.

---

# 80. DEMO DATA

Use representative data based on the supplied SVG.

Example employees:

Aarav Mehta
Sara Khan
John Dsouza
Neha Patel

Example roles/jobs:

- Payroll Specialist
- HR Officer
- Developer
- Recruiter

---

# 81. DEMO CONTRACT DATA

Aarav:

Current:

CON/2026/0042

Start:

01-Jan-2026

End:

Open

Wage:

₹85,000/month

Status:

Running

Previous:

CON/2025/0018

Start:

01-Jul-2025

End:

31-Dec-2025

Wage:

₹78,000/month

Status:

Expired

This demonstrates contract history.

---

# 82. DEMO WORKING SCHEDULES

Create examples:

- 40 Hours / Week
- Night Shift
- Retail Weekend
- Flexible Hybrid
- Part-time 20h

40 Hours / Week:

Monday-Friday

09:00 → 18:00

Break:

1 hour

Daily:

8 hours

Weekly:

40 hours

---

# 83. DEMO ATTENDANCE

Example:

Aarav:

09:05 → 18:10

Worked:

9.08 hours

Status:

Present

Overtime:

0.50

Sara:

09:15 → 18:02

Worked:

8.78 hours

Present

John:

09:32 → 17:58

Worked:

8.43 hours

Present

Neha:

Missing punches

Worked:

0.00

Status:

Absent

These are demo records.

Do not hardcode attendance calculations.

---

# 84. DEMO TIME OFF

Aarav:

Paid Time Off

12-Sep → 14-Sep

3 days

Status:

Approved

Allocation:

20 allocated
8 taken
12 remaining

Sara:

PTO:

18 allocated
4 taken
14 remaining

Neha:

Comp Off:

2 allocated
1 taken
1 remaining

Status:

To Approve

---

# 85. DEMO PAYRUN

Example:

February 2026 Payrun

Structure:

Regular Salary

Reference payslip values:

Aarav:

Basic:
₹50,000

Gross:
₹80,000

Net:
₹75,000

Sara:

Basic:
₹60,000

Gross:
₹96,000

Net:
₹88,000

Warning:

A/C missing

John:

Basic:
₹45,000

Gross:
₹72,000

Net:
₹66,000

Warning:

Duplicate

Status:

Draft

Neha:

Basic:
₹40,000

Gross:
₹64,000

Net:
₹59,000

Use these as representative demo data.

Actual calculations must still be driven by Salary Rules.

---

# 86. DEMO SALARY RULES

Reference:

BASIC
HRA
STD
BONUS
LTA
FIX
GROSS
LWF
PF
ESIC
PT
NET

Example Aarav:

BASIC:
₹50,000

HRA:
₹20,000

STD:
₹10,000

GROSS:
₹80,000

PF:
-₹3,000

PT:
-₹2,000

NET:
₹75,000

---

# 87. FIVE-MINUTE DEMO

The final demo should be designed around two complete scenarios.

## SCENARIO 1

Employee → Payslip

Suggested flow:

1. Login as HR Payroll Manager.
2. Open Employees.
3. Open Aarav.
4. Show Employee information.
5. Show Contracts smart button.
6. Show current and historical contract.
7. Show Working Schedule.
8. Show Attendance.
9. Open Payroll.
10. Create Payrun.
11. Step 1: select period and Salary Structure.
12. Continue.
13. Step 2: explicitly select employees.
14. Create Payrun.
15. Compute.
16. Open Aarav Payslip.
17. Show Salary Rule calculations.
18. Show Basic.
19. Show Allowances.
20. Show Gross.
21. Show Deductions.
22. Show Net.
23. Show warnings.
24. Validate.
25. Mark Paid.
26. Print Payslip PDF.
27. Send Payslips.
28. Open Dashboard.

---

# 88. FIVE-MINUTE DEMO SCENARIO 2

Leave Allocation → Leave Request

1. Open Time Off.
2. Open Allocations.
3. Show Aarav:
   20 allocated
   8 taken
   12 remaining.
4. Open Requests.
5. Create 3-day request.
6. Submit.
7. Login/act as HR Manager.
8. Approve.
9. Allocation changes:
   Taken increases.
   Remaining decreases.
10. Dashboard updates.

---

# 89. TESTING REQUIREMENT

Before final demo, test:

Authentication.

RBAC.

Employee.

Contracts.

Schedules.

Attendance.

Time Off.

Salary Structures.

Salary Rules.

Payruns.

Payslips.

PDF.

Email.

Dashboard.

---

# 90. CRITICAL TEST CASES

Test missing contract.

Test overlapping contracts.

Test duplicate payslip.

Test missing bank/account.

Test missing email.

Test insufficient leave balance.

Test duplicate leave approval.

Test invalid schedule.

Test invalid salary rule.

Test salary-rule dependency.

Test wrong rule sequence.

Test unauthorized payroll access.

Test employee attempting to access another employee.

Test dashboard filters.

---

# 91. DATABASE PRINCIPLE

Use normalized relational data.

Do not store everything as JSON.

Important relationships must be represented with foreign keys.

Examples:

Employee
    ↓
Contract.employee_id

Attendance
    ↓
Attendance.employee_id

TimeOffRequest
    ↓
TimeOffRequest.employee_id

Allocation
    ↓
Allocation.employee_id

Contract
    ↓
SalaryStructure

Payrun
    ↓
SalaryStructure

Payslip
    ↓
Payrun

Payslip
    ↓
Employee

PayslipLine
    ↓
Payslip

PayslipLine
    ↓
SalaryRule

---

# 92. BUSINESS LOGIC LOCATION

Business logic belongs in backend services/domain logic.

Examples:

Contract selection:

Backend.

Leave balance calculation:

Backend.

Salary calculation:

Backend.

Payrun computation:

Backend.

Dashboard aggregation:

Backend/database queries.

React should consume APIs and display results.

---

# 93. API PRINCIPLE

Use REST APIs.

Examples:

POST /auth/login

GET /employees

POST /employees

GET /employees/{id}

GET /employees/{id}/contracts

GET /employees/{id}/attendance

GET /employees/{id}/time-off

GET /contracts

POST /contracts

GET /attendance

POST /attendance/check-in

POST /attendance/check-out

GET /time-off/types

GET /time-off/allocations

POST /time-off/requests

POST /time-off/requests/{id}/approve

POST /time-off/requests/{id}/refuse

GET /salary-structures

GET /salary-rules

GET /payruns

POST /payruns/wizard/step1

POST /payruns/wizard/step2

POST /payruns/{id}/compute

POST /payruns/{id}/validate

POST /payruns/{id}/mark-paid

POST /payruns/{id}/send-payslips

GET /payslips

GET /payslips/{id}

GET /payslips/{id}/pdf

GET /dashboard/payroll

The exact API design may be improved during implementation, but maintain clean separation.

---

# 94. ERROR HANDLING

Errors must be understandable.

Bad:

"500 Internal Server Error"

Better:

"No applicable contract found for Aarav for payroll period 01-Feb-2026 to 28-Feb-2026."

Bad:

"Validation Error"

Better:

"Leave request requires 3 days but only 1.5 days are available."

Bad:

"Failed"

Better:

"Cannot mark Payrun as Paid because 2 Payslips contain unresolved warnings."

---

# 95. SECURITY

Implement:

- Password hashing.
- JWT/session security.
- Role-based access.
- Record-level restrictions where required.
- Input validation.
- Authorization on backend.
- Secure PDF access.
- Secure email delivery.

Never rely only on frontend hiding buttons.

---

# 96. PERFORMANCE

The system should be designed so dashboard and payroll operations remain responsive.

Avoid:

- N+1 queries.
- Loading all database records unnecessarily.
- Recalculating unrelated employees.
- Recomputing paid historical payroll unnecessarily.

Use appropriate:

- Database indexes.
- Aggregation queries.
- Pagination.
- Filtering.

---

# 97. DO NOT OVERENGINEER

This is a hackathon.

Prioritize:

1. Correct business logic.
2. End-to-end integration.
3. Required screens.
4. Permissions.
5. Payroll engine.
6. Dashboard.
7. PDF.
8. Email.
9. UI polish.

Do not spend most of the hackathon on unnecessary infrastructure.

---

# 98. MVP PRIORITY

## MUST WORK

- Authentication.
- RBAC.
- Employee.
- Contract.
- Working Schedule.
- Attendance.
- Time Off.
- Allocation.
- Salary Structure.
- Salary Rules.
- Payrun.
- Payslip.
- Payroll calculation.
- Dashboard.

## IMPORTANT

- PDF.
- Bulk email.
- Payroll warnings.
- Smart buttons.
- Live filters.

## POLISH

- Animations.
- Extra charts.
- Advanced analytics.
- Additional UI enhancements.

---

# 99. DEFINITION OF DONE

The project is complete only when:

- Login works.
- Roles work.
- Permissions are enforced.
- Employees work.
- Employee Kanban works.
- Employee List works.
- Employee Form works.
- Smart buttons work.
- Contracts work.
- Historical contracts remain.
- Contract-period selection works.
- Concurrent contracts are detected.
- Working Schedules work.
- Weekly hours are calculated.
- Attendance works.
- Check In works.
- Check Out works.
- Worked hours are calculated.
- Missing check-outs are detectable.
- Time Off Types work.
- Allocations work.
- Allocation approval works.
- Leave Requests work.
- Leave approval works.
- Leave balance is consumed automatically.
- Salary Structures work.
- Salary Rules work.
- Rule sequencing works.
- Fixed calculation works.
- Percentage calculation works.
- Formula calculation works.
- Payrun Step 1 works.
- Payrun Step 2 works.
- Continue does not create Payrun.
- Only selected employees are included.
- Compute works.
- Contract resolution works.
- Payslips are generated.
- Salary rule lines are visible.
- Warnings work.
- Validate works.
- Mark Paid works.
- Historical payroll remains.
- PDF works.
- Bulk email works.
- Dashboard uses live data.
- Dashboard filters work.
- Attendance dashboard works.
- Time Off dashboard works.
- Department dashboard works.
- Five-minute demo works reliably.

---

# 100. IMPORTANT DEVELOPMENT RULE

Do not implement the entire system in one huge uncontrolled step.

Implement module-by-module.

Recommended order:

1. Project setup
2. Database
3. Authentication
4. RBAC
5. Employee
6. Contract
7. Working Schedule
8. Attendance
9. Time Off
10. Salary Structure
11. Salary Rules Engine
12. Payrun
13. Payslip
14. PDF
15. Email
16. Dashboard
17. Integration
18. Seed Data
19. Testing
20. Final UI polish

---

# 101. AI CODING AGENT BEHAVIOR

When implementing this project:

1. Read this master specification first.
2. Understand existing code before modifying it.
3. Do not overwrite working features unnecessarily.
4. Maintain existing architecture.
5. Create reusable components/services.
6. Avoid duplicated business logic.
7. Use database relationships correctly.
8. Validate backend inputs.
9. Implement permissions on backend.
10. Do not fake calculations.
11. Do not hardcode dashboard metrics.
12. Do not hardcode salary results.
13. Do not create fake buttons.
14. Do not mark features complete until they work.
15. Test every completed feature.
16. Keep APIs documented.
17. Keep database migrations/versioning clean.
18. Preserve historical records.
19. Use realistic seed/demo data.
20. Keep the UI aligned with the supplied SVG.

---

# 102. WHEN IMPLEMENTING EACH SEPARATE MODULE

The AI will later receive focused Markdown files such as:

01_LOGIN_RBAC_USER_MANAGEMENT.md

02_EMPLOYEE_MASTER.md

03_CONTRACT_MANAGEMENT.md

04_WORKING_SCHEDULES.md

05_ATTENDANCE.md

06_TIME_OFF.md

07_SALARY_STRUCTURES.md

08_SALARY_RULES_ENGINE.md

09_PAYRUN_WIZARD_PROCESSING.md

10_PAYSLIP_COMPUTATION.md

11_PAYSLIP_PDF_EMAIL.md

12_PAYROLL_DASHBOARD.md

13_INTEGRATION_BUSINESS_RULES.md

14_UI_UX_DESIGN_FROM_SVG.md

15_SEED_DATA_DEMO_FLOW.md

16_TESTING_DELIVERABLES_CHECKLIST.md

When receiving a focused file:

- Treat this master file as the global project context.
- Treat the focused file as the detailed requirements for that module.
- Do not break functionality already implemented.
- Integrate the new module with existing modules.
- Follow the data relationships defined in this master specification.
- Test integration before declaring completion.

---

# 103. FINAL PRODUCT GOAL

PeoplePay360 should feel like one complete professional HR + Payroll product.

The final experience should be:

Login
↓
Employee
↓
Contract
↓
Schedule
↓
Attendance
↓
Time Off
↓
Salary Configuration
↓
Payrun
↓
Salary Calculation
↓
Payslip
↓
PDF
↓
Email
↓
Dashboard

The judges should be able to see that:

- HR data is connected.
- Payroll is connected to contracts.
- Salary rules actually calculate payroll.
- Leave affects balances.
- Attendance provides real data.
- Payruns produce real payslips.
- Warnings prevent bad payroll.
- Permissions are real.
- Dashboard reflects real records.
- Historical data is preserved.

The final application must be functional, integrated, demonstrable and reliable.

# END OF MASTER SPECIFICATION