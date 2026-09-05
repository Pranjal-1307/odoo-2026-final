Absolutely. This file is important because the **seed data and demo flow will determine how impressive PeoplePay360 looks during the final hackathon presentation**.

Below is the complete specification for:

# PeoplePay360 — Seed Data & Hackathon Demo Flow

## 1. Purpose

This document defines the complete **seed data strategy** and **hackathon demonstration flow** for the PeoplePay360 application.

The objective is to ensure that the application does not look like an empty CRUD system.

When the judges open PeoplePay360, they should immediately see:

```text
✓ Realistic employees

✓ Active contracts

✓ Working schedules

✓ Attendance records

✓ Leave requests

✓ Salary structures

✓ Salary rules

✓ Completed payroll runs

✓ Generated payslips

✓ Dashboard analytics
```

The system must feel like:

```text
A REAL COMPANY
USING A REAL HR + PAYROLL PLATFORM
```

rather than:

```text
A FRESHLY CREATED EMPTY DATABASE.
```

---

# 2. Seed Data Philosophy

The demo data must follow one critical rule:

```text
ALL MODULES MUST BE CONNECTED.
```

Bad seed data:

```text
Random Employees

Random Contracts

Random Attendance

Random Payslips
```

Good seed data:

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
SALARY STRUCTURE
    ↓
SALARY RULES
    ↓
PAYRUN
    ↓
PAYSLIP
```

Every important piece of demo data should have a believable relationship with the next module.

---

# 3. Demo Company

Create one primary demo company.

## Company Details

```text
Company Name:
PeoplePay Technologies Pvt. Ltd.

Display Name:
PeoplePay Technologies

Industry:
Software / Technology

Country:
India

Currency:
INR (₹)

Payroll Frequency:
Monthly
```

Company description:

```text
PeoplePay Technologies Pvt. Ltd. is a growing technology company
with employees across Engineering, Product, Human Resources,
Finance, Sales, and Operations.
```

---

# 4. Recommended Seed Data Scale

For a hackathon demo, do not create thousands of records unnecessarily.

Recommended dataset:

```text
Employees:
20–30

Departments:
6–8

Contracts:
20+

Working Schedules:
3–4

Attendance Records:
100+

Leave Requests:
10–15

Salary Structures:
3–5

Salary Rules:
10–20

Payruns:
2–3

Payslips:
20+
```

This gives the application enough data to look realistic while remaining easy to manage.

---

# 5. Departments Seed Data

Create the following departments:

```text
1. Engineering

2. Product

3. Human Resources

4. Finance

5. Sales

6. Operations

7. Marketing

8. Management
```

Recommended department distribution:

```text
Engineering
8 Employees

Product
3 Employees

Human Resources
2 Employees

Finance
2 Employees

Sales
3 Employees

Operations
3 Employees

Marketing
2 Employees

Management
1 Employee
```

---

# 6. Employee Seed Data

Create approximately 24 realistic employees.

## Management

### EMP-001 — Aarav Sharma

```text
Employee ID:
EMP-001

Name:
Aarav Sharma

Department:
Management

Job Position:
Chief Executive Officer

Email:
aarav.sharma@peoplepay360.demo

Status:
Active

Join Date:
2023-01-10
```

---

## Engineering

### EMP-002 — Rohan Patel

```text
Department:
Engineering

Position:
Engineering Manager

Status:
Active
```

### EMP-003 — Priyansh Shah

```text
Department:
Engineering

Position:
Senior Software Engineer

Status:
Active
```

### EMP-004 — Vivaan Mehta

```text
Department:
Engineering

Position:
Software Engineer

Status:
Active
```

### EMP-005 — Aditya Joshi

```text
Department:
Engineering

Position:
Backend Developer

Status:
Active
```

### EMP-006 — Kabir Singh

```text
Department:
Engineering

Position:
Frontend Developer

Status:
Active
```

### EMP-007 — Arjun Desai

```text
Department:
Engineering

Position:
QA Engineer

Status:
Active
```

### EMP-008 — Ishaan Verma

```text
Department:
Engineering

Position:
DevOps Engineer

Status:
Active
```

### EMP-009 — Neel Patel

```text
Department:
Engineering

Position:
Software Engineer

Status:
Active
```

---

# 7. Product Department

### EMP-010 — Ananya Gupta

```text
Department:
Product

Position:
Product Manager

Status:
Active
```

### EMP-011 — Kavya Shah

```text
Department:
Product

Position:
Product Designer

Status:
Active
```

### EMP-012 — Dhruv Mehta

```text
Department:
Product

Position:
Business Analyst

Status:
Active
```

---

# 8. Human Resources Department

### EMP-013 — Priya Nair

```text
Department:
Human Resources

Position:
HR Manager

Status:
Active
```

### EMP-014 — Sneha Patel

```text
Department:
Human Resources

Position:
HR Executive

Status:
Active
```

---

# 9. Finance Department

### EMP-015 — Rajesh Kumar

```text
Department:
Finance

Position:
Finance Manager

Status:
Active
```

### EMP-016 — Nisha Shah

```text
Department:
Finance

Position:
Accountant

Status:
Active
```

---

# 10. Sales Department

### EMP-017 — Rahul Joshi

```text
Department:
Sales

Position:
Sales Manager

Status:
Active
```

### EMP-018 — Meera Desai

```text
Department:
Sales

Position:
Sales Executive

Status:
Active
```

### EMP-019 — Yash Patel

```text
Department:
Sales

Position:
Business Development Executive

Status:
Active
```

---

# 11. Operations Department

### EMP-020 — Harsh Mehta

```text
Department:
Operations

Position:
Operations Manager

Status:
Active
```

### EMP-021 — Dev Shah

```text
Department:
Operations

Position:
Operations Executive

Status:
Active
```

### EMP-022 — Krish Patel

```text
Department:
Operations

Position:
Support Executive

Status:
Active
```

---

# 12. Marketing Department

### EMP-023 — Diya Sharma

```text
Department:
Marketing

Position:
Marketing Manager

Status:
Active
```

### EMP-024 — Riya Patel

```text
Department:
Marketing

Position:
Digital Marketing Executive

Status:
Active
```

---

# 13. Employee Status Variety

Do not make every employee identical.

Recommended status distribution:

```text
Active:
21

On Leave:
1

Inactive:
1

Notice Period:
1
```

This allows the UI to demonstrate different status badges and filters.

Example:

```text
EMP-009
On Leave
```

```text
EMP-022
Notice Period
```

```text
EMP-024
Inactive
```

---

# 14. Working Schedule Seed Data

Create multiple schedules.

## Schedule 1 — Standard 5-Day Week

```text
Name:
Standard 5-Day Week

Working Days:
Monday–Friday

Start:
09:00 AM

End:
06:00 PM

Break:
1 Hour

Weekly Hours:
40
```

---

## Schedule 2 — Flexible Schedule

```text
Name:
Flexible Working Hours

Working Days:
Monday–Friday

Start:
08:00 AM

End:
07:00 PM

Required Daily Hours:
8

Weekly Hours:
40
```

---

## Schedule 3 — Operations Shift

```text
Name:
Operations Shift

Working Days:
Monday–Saturday

Start:
10:00 AM

End:
07:00 PM

Weekly Hours:
48
```

---

## Schedule 4 — Leadership Schedule

```text
Name:
Leadership Flexible Schedule

Working Days:
Monday–Friday

Required Hours:
Flexible

Weekly Target:
40 Hours
```

---

# 15. Schedule Assignment

Assign schedules logically.

```text
Engineering
→ Standard 5-Day Week

Product
→ Flexible Working Hours

Human Resources
→ Standard 5-Day Week

Finance
→ Standard 5-Day Week

Sales
→ Flexible Working Hours

Operations
→ Operations Shift

Management
→ Leadership Flexible Schedule

Marketing
→ Flexible Working Hours
```

---

# 16. Contract Seed Data

Every active employee should have an active contract.

Example contract:

## CNT-001

```text
Employee:
Aarav Sharma

Contract Type:
Permanent

Start Date:
2023-01-10

End Date:
Open Ended

Working Schedule:
Leadership Flexible Schedule

Salary Structure:
Executive Salary Structure

Status:
Active
```

---

# 17. Contract Types

Create variety:

```text
Permanent

Fixed-Term

Internship

Probation
```

Recommended distribution:

```text
Permanent:
18

Fixed-Term:
3

Probation:
2

Internship:
1
```

---

# 18. Contract Status Variety

Create realistic statuses:

```text
Draft

Active

Expired

Terminated
```

Recommended demo examples:

```text
Active
Most Employees

Draft
One New Employee Contract

Expired
One Historical Contract

Terminated
One Historical Contract
```

---

# 19. Salary Structures

Create at least four salary structures.

---

## Structure 1 — Standard Employee Salary

Applicable to:

```text
Software Engineers

HR Executives

Accountants

Marketing Executives
```

Components:

```text
Basic Salary

House Rent Allowance

Transport Allowance

Special Allowance

Unpaid Leave Deduction
```

---

## Structure 2 — Management Salary

Applicable to:

```text
Managers

Department Heads
```

Components:

```text
Basic Salary

House Rent Allowance

Management Allowance

Special Allowance

Performance Bonus

Unpaid Leave Deduction
```

---

## Structure 3 — Executive Salary

Applicable to:

```text
CEO

Senior Leadership
```

Components:

```text
Basic Salary

Executive Allowance

Special Allowance

Performance Bonus
```

---

## Structure 4 — Intern Salary

Applicable to:

```text
Interns
```

Components:

```text
Monthly Stipend

Unpaid Leave Deduction
```

---

# 20. Salary Rule Categories

Create logical categories:

```text
BASIC

ALLOWANCES

BONUSES

DEDUCTIONS

GROSS

NET
```

These categories should be visually grouped in the Salary Structure screen.

---

# 21. Salary Rule Seed Data

Recommended calculation sequence:

```text
010
Basic Salary

020
House Rent Allowance

030
Transport Allowance

040
Special Allowance

050
Management Allowance

060
Performance Bonus

070
Gross Salary

080
Unpaid Leave Deduction

090
Other Deductions

100
Total Deductions

110
Net Salary
```

---

# 22. Example Salary Rules

## Rule 010 — Basic Salary

```text
Code:
BASIC

Category:
BASIC

Sequence:
10

Type:
Fixed Amount / Contract Amount
```

---

## Rule 020 — House Rent Allowance

```text
Code:
HRA

Category:
ALLOWANCES

Sequence:
20

Calculation:
Percentage

Example:
40% of Basic Salary
```

---

## Rule 030 — Transport Allowance

```text
Code:
TRANSPORT

Category:
ALLOWANCES

Sequence:
30

Calculation:
Fixed Amount
```

---

## Rule 040 — Special Allowance

```text
Code:
SPECIAL

Category:
ALLOWANCES

Sequence:
40
```

---

## Rule 060 — Performance Bonus

```text
Code:
BONUS

Category:
BONUSES

Sequence:
60
```

Use a value for selected management/demo employees.

---

## Rule 070 — Gross Salary

```text
Code:
GROSS

Formula:

BASIC
+
HRA
+
TRANSPORT
+
SPECIAL
+
BONUS
```

---

## Rule 080 — Unpaid Leave Deduction

```text
Code:
UNPAID_LEAVE

Category:
DEDUCTIONS

Sequence:
80
```

Formula concept:

```text
Daily Salary
×
Unpaid Leave Days
```

---

## Rule 100 — Total Deductions

```text
Code:
DEDUCTIONS

Formula:

SUM OF ALL DEDUCTION RULES
```

---

## Rule 110 — Net Salary

```text
Code:
NET

Formula:

GROSS
-
TOTAL DEDUCTIONS
```

---

# 23. Salary Data Examples

Use different salary levels.

Example:

| Employee          | Basic Salary | Approx Monthly Gross |
| ----------------- | -----------: | -------------------: |
| Aarav Sharma      |     ₹250,000 |            ₹400,000+ |
| Rohan Patel       |     ₹150,000 |             ₹240,000 |
| Senior Engineer   |     ₹100,000 |             ₹160,000 |
| Software Engineer |      ₹70,000 |             ₹115,000 |
| HR Manager        |      ₹90,000 |             ₹145,000 |
| Sales Manager     |     ₹110,000 |             ₹175,000 |
| Executive         |      ₹55,000 |              ₹90,000 |
| Intern            |      ₹20,000 |              ₹20,000 |

The exact amounts should remain internally consistent with salary rules.

---

# 24. Attendance Seed Data

Attendance must demonstrate realistic behavior.

Do not generate:

```text
Everyone
09:00 AM
→
06:00 PM
Every Day
```

That looks artificial.

Create realistic variations.

---

## Attendance Status Distribution

```text
Present
Most Records

Late
Some Records

On Leave
Linked to Approved Leave

Absent
Selected Cases

Incomplete
Missing Check-Out
```

---

# 25. Attendance Examples

### Normal Day

```text
Employee:
Vivaan Mehta

Check In:
09:03 AM

Check Out:
06:08 PM

Worked Hours:
8h 05m

Status:
Present
```

---

### Late Arrival

```text
Employee:
Kabir Singh

Check In:
09:42 AM

Check Out:
06:20 PM

Status:
Late
```

---

### Missing Check-Out

```text
Employee:
Arjun Desai

Check In:
09:10 AM

Check Out:
—

Status:
Incomplete
```

---

# 26. Time Off Types

Create:

```text
Paid Leave

Sick Leave

Casual Leave

Unpaid Leave

Work From Home
```

---

# 27. Leave Request Seed Data

Create approximately:

```text
Pending:
4

Approved:
6

Rejected:
2

Cancelled:
1
```

---

# 28. Important Demo Leave Requests

## Pending Request

```text
Employee:
Sneha Patel

Leave Type:
Casual Leave

Duration:
2 Days

Status:
Pending
```

This should be used during the demo to demonstrate:

```text
APPROVE LEAVE
```

---

## Approved Leave

```text
Employee:
Neel Patel

Leave Type:
Paid Leave

Duration:
3 Days

Status:
Approved
```

This should affect attendance.

---

## Unpaid Leave

Create at least one important example:

```text
Employee:
Kabir Singh

Leave Type:
Unpaid Leave

Duration:
2 Days

Status:
Approved
```

This should affect:

```text
Attendance
        ↓
Payroll Deduction
```

This relationship is extremely valuable for the hackathon demonstration.

---

# 29. The Connected Business Story

The most important demo story should be:

```text
Kabir Singh
        ↓
Employee
        ↓
Active Contract
        ↓
Standard Working Schedule
        ↓
Attendance
        ↓
2 Days Approved Unpaid Leave
        ↓
Payroll Calculation
        ↓
Unpaid Leave Deduction
        ↓
Reduced Net Salary
        ↓
Payslip
```

This demonstrates that PeoplePay360 is not simply storing data.

It demonstrates:

```text
INTEGRATED BUSINESS LOGIC.
```

---

# 30. Payrun Seed Data

Create historical payroll data.

Recommended:

```text
July 2026
Finalized

August 2026
Finalized

September 2026
Draft / Ready for Processing
```

This creates a strong demonstration timeline.

---

# 31. Historical Payrun — July 2026

```text
Period:
01 July 2026
–
31 July 2026

Status:
Finalized

Employees:
23

Gross Payroll:
Calculated

Deductions:
Calculated

Net Payroll:
Calculated
```

---

# 32. Historical Payrun — August 2026

```text
Period:
01 August 2026
–
31 August 2026

Status:
Finalized

Employees:
23

Gross Payroll:
Calculated

Deductions:
Calculated

Net Payroll:
Calculated
```

This provides data for:

```text
Payroll Dashboard

Trends

Charts

Payslip History
```

---

# 33. Current Demo Payrun

Create:

```text
September 2026 Payrun
```

Status:

```text
DRAFT
```

or:

```text
READY FOR PROCESSING
```

This is the primary interactive demo Payrun.

---

# 34. Demo Payrun Scenario

The demo should show:

```text
CREATE PAYRUN
```

for:

```text
September 2026
```

Then demonstrate:

```text
STEP 1
Select Period
```

↓

```text
STEP 2
Find Eligible Employees
```

↓

```text
STEP 3
Validate Employee Data
```

↓

```text
STEP 4
Process Salary Rules
```

↓

```text
STEP 5
Generate Payslips
```

↓

```text
STEP 6
Review Results
```

↓

```text
STEP 7
Finalize Payrun
```

---

# 35. Validation Exception Data

The Payrun should not show 100% perfect data.

Create controlled exceptions.

Example:

```text
Employee:
Riya Patel

Issue:
No Active Contract
```

Another example:

```text
Employee:
Arjun Desai

Issue:
Incomplete Attendance Record
```

Another:

```text
Employee:
Dev Shah

Issue:
Missing Salary Structure
```

The validation screen should show:

```text
✓ 20 Employees Ready

⚠ 3 Employees Need Attention
```

This makes the system feel realistic and intelligent.

---

# 36. Recommended Demo Validation Behavior

For the live demo, avoid breaking the entire Payrun.

Use:

```text
VALIDATION WARNINGS
```

rather than fatal failures where possible.

Example:

```text
Employee:
Arjun Desai

Warning:
Missing Check-Out

System Action:
Use attendance validation rule / flag for review.
```

The demo should remain smooth.

---

# 37. Payslip Seed Data

Generate payslips for:

```text
July 2026

August 2026
```

for eligible employees.

Each payslip must contain:

```text
Employee Information

Payroll Period

Earnings

Deductions

Gross Salary

Total Deductions

Net Salary
```

---

# 38. Important Demo Payslip

Use **Kabir Singh's payslip** as the primary demonstration.

Example:

```text
PEOPLEPAY360
PAYSLIP

Employee:
Kabir Singh

Employee ID:
EMP-006

Department:
Engineering

Position:
Frontend Developer

Payroll Period:
September 2026
```

---

## Earnings

```text
Basic Salary
₹70,000

HRA
₹28,000

Transport Allowance
₹3,000

Special Allowance
₹14,000
```

---

## Gross Salary

```text
₹115,000
```

---

## Deductions

Example:

```text
Unpaid Leave Deduction
₹7,667
```

---

## Net Salary

```text
₹107,333
```

The exact values must be generated according to the implemented salary calculation engine.

Do not hardcode a payslip value that contradicts the salary rule calculation.

---

# 39. Dashboard Seed Data

The Dashboard should immediately contain meaningful numbers.

Example KPIs:

```text
TOTAL EMPLOYEES

24
```

```text
ACTIVE CONTRACTS

21
```

```text
PENDING LEAVE REQUESTS

4
```

```text
CURRENT PAYROLL

₹XX,XX,XXX
```

Values must be dynamically calculated where possible.

---

# 40. Payroll Dashboard Seed Data

Use historical Payruns to generate charts.

Recommended charts:

```text
Payroll Trend

July
August
September
```

Example data:

```text
July

Gross:
₹2.55M

Net:
₹2.21M
```

```text
August

Gross:
₹2.63M

Net:
₹2.28M
```

```text
September

Projected:
₹2.71M
```

The chart values should match the seeded payroll data.

---

# 41. Dashboard Recent Activity

Seed recent activity events.

Examples:

```text
Priya Nair approved leave request for Sneha Patel.

A new contract was created for Dhruv Mehta.

August 2026 payroll was finalized.

Payslip generated for Kabir Singh.

Rohan Patel's contract was updated.
```

Display timestamps such as:

```text
2 minutes ago

15 minutes ago

1 hour ago

Yesterday
```

For a deterministic demo, relative timestamps may be generated consistently from seed/demo time.

---

# 42. Demo User Accounts

Create multiple demo users.

---

## Super Admin

```text
Email:
admin@peoplepay360.demo

Role:
Super Admin

Permissions:
Full Access
```

---

## HR Manager

```text
Email:
hr@peoplepay360.demo

Role:
HR Manager
```

Can access:

```text
Employees

Contracts

Schedules

Attendance

Time Off
```

Cannot finalize payroll unless explicitly permitted.

---

## Payroll Manager

```text
Email:
payroll@peoplepay360.demo

Role:
Payroll Manager
```

Can access:

```text
Salary Structures

Salary Rules

Payruns

Payslips
```

---

## Employee User

```text
Email:
employee@peoplepay360.demo

Role:
Employee
```

Can access only relevant self-service data if employee self-service is implemented.

---

# 43. Demo Credentials Strategy

For hackathon demonstration purposes, use easy-to-remember credentials.

Example:

```text
admin@peoplepay360.demo
Password: Demo@123
```

```text
hr@peoplepay360.demo
Password: Demo@123
```

```text
payroll@peoplepay360.demo
Password: Demo@123
```

**Important implementation rule:**

```text
Never use these credentials in a real production deployment.
```

They are only for:

```text
Hackathon Demo
Development
Testing
```

---

# 44. RBAC Demo Scenario

Demonstrate role-based access.

Example:

```text
LOGIN AS HR MANAGER
```

Show:

```text
✓ Employees

✓ Contracts

✓ Attendance

✓ Time Off
```

Then:

```text
LOGIN AS PAYROLL MANAGER
```

Show:

```text
✓ Salary Structures

✓ Salary Rules

✓ Payruns

✓ Payslips
```

This visually proves:

```text
ROLE-BASED ACCESS CONTROL.
```

---

# 45. Primary Hackathon Demo Flow

The recommended live presentation flow is:

```text
1. Login

↓

2. Dashboard

↓

3. Employee Management

↓

4. Employee Profile

↓

5. Contract

↓

6. Attendance

↓

7. Time Off

↓

8. Salary Structure

↓

9. Salary Rules

↓

10. Create Payrun

↓

11. Validate

↓

12. Process

↓

13. Review

↓

14. Finalize

↓

15. Payslip

↓

16. Dashboard Analytics
```

---

# 46. Hackathon Demo Script

## STEP 1 — Opening

Say:

> "PeoplePay360 is an integrated HR and payroll platform that connects the complete employee lifecycle with payroll processing."

Open:

```text
LOGIN
```

---

# 47. STEP 2 — Login

Login as:

```text
Super Admin
```

Explain:

> "The system uses role-based access control, ensuring users only access the modules and information relevant to their responsibilities."

---

# 48. STEP 3 — Dashboard

Open:

```text
DASHBOARD
```

Explain:

> "The dashboard gives management an immediate overview of the workforce and payroll situation."

Show:

```text
Total Employees

Active Contracts

Pending Leave Requests

Payroll Summary
```

---

# 49. STEP 4 — Employee Management

Open:

```text
EMPLOYEES
```

Explain:

> "Every payroll process starts with accurate employee information."

Show:

```text
Search

Filters

Status

Departments
```

Open:

```text
Kabir Singh
```

---

# 50. STEP 5 — Employee Profile

Show:

```text
Personal Information

Employment Information

Contract

Attendance

Time Off

Payroll
```

Explain:

> "Instead of keeping employee information isolated across different systems, PeoplePay360 creates a connected employee record."

---

# 51. STEP 6 — Contract

Show Kabir's contract.

Explain:

> "The contract connects the employee with the working schedule and salary structure used for payroll."

Highlight:

```text
Working Schedule

Salary Structure

Contract Status
```

---

# 52. STEP 7 — Attendance

Open:

```text
ATTENDANCE
```

Explain:

> "Attendance data directly supports payroll calculations and workforce visibility."

Show:

```text
Present

Late

On Leave

Incomplete
```

---

# 53. STEP 8 — Time Off

Open:

```text
TIME OFF
```

Show:

```text
Pending Leave Requests
```

Approve:

```text
Sneha Patel's Casual Leave
```

Explain:

> "Leave requests move through a clear approval workflow."

Then highlight:

```text
Kabir Singh's
Approved Unpaid Leave
```

Say:

> "This unpaid leave becomes important during payroll calculation."

This is a major demo connection.

---

# 54. STEP 9 — Salary Structures

Open:

```text
SALARY STRUCTURES
```

Show:

```text
Standard Employee Salary
```

Explain:

> "Salary structures define the components used to calculate employee compensation."

Show:

```text
Basic Salary

HRA

Transport

Special Allowance

Deductions
```

---

# 55. STEP 10 — Salary Rules Engine

Open:

```text
SALARY RULES
```

Explain:

> "The salary rules engine processes payroll components in a defined sequence."

Show:

```text
010 BASIC

020 HRA

030 TRANSPORT

040 SPECIAL

070 GROSS

080 UNPAID LEAVE

100 DEDUCTIONS

110 NET
```

Explain:

> "This makes payroll calculations transparent and configurable."

---

# 56. STEP 11 — Create Payrun

Open:

```text
PAYRUNS
```

Click:

```text
+ CREATE PAYRUN
```

Select:

```text
September 2026
```

Explain:

> "The Payrun wizard guides the payroll administrator through the complete payroll process."

---

# 57. STEP 12 — Employee Validation

Show:

```text
Eligible Employees
```

Then:

```text
Validation Results
```

Example:

```text
✓ 20 Ready

⚠ 3 Need Attention
```

Explain:

> "Before processing, PeoplePay360 validates important payroll dependencies such as contracts, attendance, and salary configuration."

---

# 58. STEP 13 — Process Payroll

Click:

```text
PROCESS PAYROLL
```

Show progress:

```text
Processing Employees

████████████████

23 / 23
```

Explain:

> "The salary rules engine calculates earnings and deductions for each eligible employee."

---

# 59. STEP 14 — Show Business Logic

Open:

```text
Kabir Singh
```

Show:

```text
Basic Salary

+

HRA

+

Allowances

=

Gross Salary

-

Unpaid Leave Deduction

=

Net Salary
```

Say:

> "Because Kabir had approved unpaid leave, the system automatically applies the corresponding payroll deduction."

This is one of the strongest demonstrations of integrated business logic.

---

# 60. STEP 15 — Review Payroll

Show:

```text
Employees Processed

Gross Payroll

Total Deductions

Net Payroll
```

Explain:

> "Before finalization, the payroll administrator can review the complete payroll results."

---

# 61. STEP 16 — Finalize

Click:

```text
FINALIZE PAYROLL
```

Show confirmation.

Explain:

> "Finalization locks the payroll results to preserve historical payroll integrity."

---

# 62. STEP 17 — Payslip

Open:

```text
PAYSLIPS
```

Open:

```text
Kabir Singh
```

Show:

```text
Earnings

Deductions

Gross Salary

Net Salary
```

Then demonstrate:

```text
Download PDF

Send Email
```

---

# 63. STEP 18 — Payroll Dashboard

Return to:

```text
PAYROLL DASHBOARD
```

Show:

```text
Payroll Trends

Gross vs Net

Employee Payroll Summary
```

End with:

> "PeoplePay360 connects employee management, attendance, leave, salary rules, payroll processing, and payslips into one unified workflow."

---

# 64. Recommended Demo Duration

Target:

```text
8–12 MINUTES
```

Recommended timing:

| Section                  |    Time |
| ------------------------ | ------: |
| Introduction             |  30 sec |
| Dashboard                |  45 sec |
| Employees + Contract     | 1.5 min |
| Attendance + Leave       |   1 min |
| Salary Structure + Rules | 1.5 min |
| Payrun Wizard            |   2 min |
| Payroll Processing       |   1 min |
| Payslip                  |   1 min |
| Dashboard Summary        |  30 sec |

---

# 65. Demo Safety Rules

Before presenting:

```text
✓ Database seeded

✓ Demo accounts tested

✓ Dashboard populated

✓ Payrun ready

✓ Validation scenario prepared

✓ Processing tested

✓ Payslip generated

✓ PDF tested

✓ Email flow tested

✓ Browser tabs cleaned

✓ Application restarted
```

---

# 66. Demo Reset Strategy

The demo environment must be easy to reset.

Recommended reset command or script:

```text
RESET DATABASE

↓

RUN MIGRATIONS

↓

SEED MASTER DATA

↓

SEED EMPLOYEES

↓

SEED CONTRACTS

↓

SEED ATTENDANCE

↓

SEED LEAVE

↓

SEED SALARY DATA

↓

SEED PAYROLL HISTORY
```

Conceptually:

```text
npm run db:reset
```

or:

```text
npm run seed:demo
```

depending on the final implementation.

---

# 67. Seed Data Architecture

Recommended seed order:

```text
01_COMPANY

↓

02_ROLES

↓

03_USERS

↓

04_DEPARTMENTS

↓

05_WORKING_SCHEDULES

↓

06_EMPLOYEES

↓

07_CONTRACTS

↓

08_TIME_OFF_TYPES

↓

09_ATTENDANCE

↓

10_TIME_OFF_REQUESTS

↓

11_SALARY_STRUCTURES

↓

12_SALARY_RULES

↓

13_PAYRUNS

↓

14_PAYSLIPS

↓

15_DASHBOARD_ACTIVITY
```

This order is important because later records depend on earlier records.

---

# 68. Recommended Seeder Folder Structure

```text
database/

├── seeders/
│
├── 01-company.seed
│
├── 02-roles.seed
│
├── 03-users.seed
│
├── 04-departments.seed
│
├── 05-working-schedules.seed
│
├── 06-employees.seed
│
├── 07-contracts.seed
│
├── 08-time-off-types.seed
│
├── 09-attendance.seed
│
├── 10-time-off-requests.seed
│
├── 11-salary-structures.seed
│
├── 12-salary-rules.seed
│
├── 13-payruns.seed
│
├── 14-payslips.seed
│
└── 15-dashboard-activity.seed
```

---

# 69. Seed Data Integrity Rules

Every seed script must maintain relationships.

Examples:

```text
Employee
→ Must reference valid Department
```

```text
Contract
→ Must reference valid Employee
```

```text
Attendance
→ Must reference valid Employee
```

```text
Payslip
→ Must reference valid Employee
and valid Payrun
```

```text
Payrun
→ Must reference valid Company
```

Never create orphan records.

---

# 70. Deterministic Demo Data

Avoid random seed data that changes every time.

Bad:

```text
Math.random()
```

for important demo values.

Better:

```text
Fixed deterministic seed data
```

This ensures:

```text
Same Employees

Same Payroll

Same Charts

Same Demo Story
```

every time the application is reset.

---

# 71. Demo Data vs Production Data

The system should clearly separate:

```text
DEVELOPMENT / DEMO SEED DATA
```

from:

```text
PRODUCTION DATA
```

Demo seeders should not automatically run in production.

---

# 72. Key Demo Story — Final Version

The strongest PeoplePay360 story is:

```text
KABIR SINGH
```

---

## The Complete Story

```text
Kabir joins PeoplePay Technologies.

↓

An Employee record is created.

↓

An Active Contract is assigned.

↓

A Working Schedule is assigned.

↓

A Salary Structure is linked.

↓

Attendance is recorded.

↓

Kabir requests / receives Unpaid Leave.

↓

The leave is approved.

↓

Payroll is created.

↓

The Payrun validates Kabir's information.

↓

Salary Rules calculate earnings.

↓

Unpaid Leave creates a deduction.

↓

Net Salary is calculated.

↓

The Payrun is finalized.

↓

Kabir's Payslip is generated.

↓

The Payslip can be downloaded or emailed.
```

This single story demonstrates nearly the entire PeoplePay360 ecosystem.

---

# 73. Hackathon Judge Impact

The demo should communicate these strengths:

```text
✓ Complete HR Lifecycle

✓ Connected Modules

✓ Configurable Payroll Rules

✓ Automated Payroll Calculation

✓ Attendance Integration

✓ Leave Integration

✓ Payslip Generation

✓ Role-Based Access

✓ Professional UI/UX

✓ Realistic Business Data
```

---

# 74. Final Demo Closing Statement

Use this closing statement:

> **"PeoplePay360 is not just an employee database or a payroll calculator. It is a connected workforce and payroll platform where employee contracts, schedules, attendance, leave, salary structures, and payroll rules work together to create an accurate and transparent payroll process."**

---

# 75. Final Implementation Checklist

Before considering the demo complete:

```text
AUTHENTICATION
✓ Demo login works

RBAC
✓ Different roles see different modules

EMPLOYEES
✓ Employee records populated

CONTRACTS
✓ Active contracts linked

SCHEDULES
✓ Working schedules assigned

ATTENDANCE
✓ Realistic attendance populated

TIME OFF
✓ Pending and approved requests exist

SALARY STRUCTURES
✓ Multiple structures exist

SALARY RULES
✓ Rules have valid sequences

PAYRUN
✓ Historical payruns exist

PAYRUN DEMO
✓ Current period ready to process

VALIDATION
✓ Controlled warnings exist

PROCESSING
✓ Payroll calculations work

PAYSLIPS
✓ Historical payslips exist

PDF
✓ Payslip PDF works

EMAIL
✓ Email action works

DASHBOARD
✓ KPIs populated

ANALYTICS
✓ Charts populated

DEMO FLOW
✓ Complete presentation rehearsed
```

---

# FINAL RULE

The seed data is not just test data.

For the PeoplePay360 hackathon project:

```text
THE SEED DATA IS PART OF THE PRODUCT EXPERIENCE.
```

The judges should be able to open the application and immediately understand:

```text
WHO THE EMPLOYEES ARE

HOW THEY WORK

WHAT THEIR CONTRACTS ARE

WHAT SALARY STRUCTURE THEY USE

WHAT ATTENDANCE THEY HAVE

WHAT LEAVE THEY TOOK

HOW THEIR PAYROLL WAS CALCULATED

AND WHAT THEIR FINAL PAYSLIP LOOKS LIKE.
```

The final demo must feel like:

```text
A COMPLETE, CONNECTED,
REAL-WORLD HR + PAYROLL SYSTEM.
```

---

# END OF 15_SEED_DATA_DEMO_FLOW.md

This completes the **Seed Data + Hackathon Demo Flow specification** for PeoplePay360.