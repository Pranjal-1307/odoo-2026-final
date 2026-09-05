# `02_EMPLOYEE_MASTER.md`

This specification is based on the **PeoplePay360 HR & Payroll** requirements. The source explicitly defines Employees as the central HR hub, requiring **Kanban, List, and Form views**, work details, and direct navigation to related Contracts, Attendance, Time Off, and Allocations. 

Copy everything below into **`02_EMPLOYEE_MASTER.md`**:

````markdown
# 02_EMPLOYEE_MASTER.md

# PeoplePay360 — Employee Master Management

## 1. Module Overview

The Employee Master module is the central HR master-data module of PeoplePay360.

The Employee record is NOT just a CRUD record.

It acts as the central operational hub connecting:

Employee
    |
    +-- Contracts
    |
    +-- Working Schedule
    |
    +-- Attendance
    |
    +-- Time Off
    |
    +-- Allocations
    |
    +-- Payslips
    |
    +-- Payroll

The PeoplePay360 requirements specifically state that the Employee record should act as the central hub for the HR and payroll workflow.

The system must support:

- Employee Kanban view
- Employee List view
- Employee Form view
- Employee creation
- Employee editing
- Employee activation/deactivation
- Employee search
- Employee filtering
- Employee sorting
- Employee profile information
- Employee work information
- Department relationship
- Manager relationship
- Working Schedule relationship
- Company relationship
- Job Position
- Work Location
- Related-record smart buttons
- Contracts navigation
- Attendance navigation
- Time Off navigation
- Allocations navigation
- Role-based access
- Historical data preservation

The Employee module must integrate with all subsequent PeoplePay360 modules.

---

# 2. Source Requirements

The PeoplePay360 specification requires Employee Master Management to:

- Support Kanban, List, and Form views.
- Capture department, manager, schedule, job position, and status.
- Provide quick list-view access.
- Provide direct links from the Employee Form to related Contracts, Attendance, and Time Off records.

The frontend specification additionally defines the Employee Form as a unified operational hub and requires smart-button actions for related Contracts, Attendance, Time Off, and Allocations.

Therefore, the Employee module must be implemented as a connected HR module rather than a standalone employee table.

---

# 3. Employee Module Goals

The module must answer the following questions quickly:

1. Who is this employee?
2. What is their job position?
3. Which department do they belong to?
4. Who is their manager?
5. Which company do they belong to?
6. Which working schedule applies to them?
7. Where do they work?
8. Are they active?
9. What contracts do they have?
10. What attendance records do they have?
11. What time-off records do they have?
12. What allocations do they have?
13. What payroll records are associated with them?

---

# 4. Main Employee Navigation

Employees must be accessible from the main PeoplePay360 navigation.

Main navigation:

Employees
Contracts
Attendance
Time Off
Payroll
Reports

The Employees menu opens the Employee Master list.

---

# 5. Employee Routes

Recommended frontend routes:

```text
/employees
/employees/new
/employees/:id
````

Optional view-specific query parameters:

```text
/employees?view=kanban
/employees?view=list
```

The implementation may use another routing strategy, but the user experience must support:

* Employee list
* Employee Kanban
* Employee form
* New employee

---

# 6. Employee Views

The module must support three primary views:

```text
1. Kanban
2. List
3. Form
```

Flow:

```text
Employees
    |
    +---- Kanban
    |
    +---- List
    |
    +---- Form
```

Kanban and List must both open the same unified Employee Form when a record is selected.

---

# 7. View Toggle

At the top-right or appropriate Odoo-style list toolbar, provide:

```text
[ Kanban ] [ List ]
```

The currently selected view should be visually distinguishable.

Do not create completely different employee experiences between Kanban and List.

Both views represent the same employee records.

---

# 8. Employee List View

The Employee List view is the primary operational overview.

Required columns:

| Column       | Description             |
| ------------ | ----------------------- |
| Employee     | Employee name           |
| Work Email   | Work email              |
| Job Position | Employee's job position |
| Department   | Employee department     |
| Status       | Active/Inactive         |

These columns are based on the Employee List reference.

---

# 9. Employee List Layout

Recommended structure:

```text
---------------------------------------------------------------
Employees                                      [New]
---------------------------------------------------------------

[ Search... ] [ Filters ] [ Group By ]

Employee          Work Email       Job Position   Department   Status
-----------------------------------------------------------------------
Aarav Mehta       aarav@...        Developer      Engineering  Active
Sara Khan         sara@...         HR Manager     HR           Active
John Dsouza       john@...         Analyst        Finance      Active
Neha Patel        neha@...         Designer       Design       Inactive
-----------------------------------------------------------------------

                    [Kanban] [List]
---------------------------------------------------------------
```

The design should follow the Odoo-style ERP reference.

---

# 10. New Employee Button

The Employees page must contain:

```text
[ New ]
```

Clicking New opens:

```text
/employees/new
```

The New button must not create a blank employee record immediately.

The employee record should be created only after valid form submission.

---

# 11. Employee Search

The Employee list must support search.

Search should be able to find employees by relevant information, including:

* Employee name
* Work email
* Job position
* Department

Example:

```text
Search: Aarav
```

Result:

```text
Aarav Mehta
```

Search should be case-insensitive.

---

# 12. Employee Filters

Recommended filters:

```text
Status
Department
Job Position
Company
Working Schedule
```

At minimum, Status and Department filtering should be supported.

Example:

```text
Filters
    |
    +-- Active
    +-- Inactive
    +-- Department
    +-- Job Position
    +-- Company
```

---

# 13. Status Filter

The Employee list must support:

```text
Active
Inactive
All
```

Default behavior should show active employees unless the application design specifies otherwise.

Inactive employees must remain searchable.

They must not be physically removed simply because they are no longer active.

---

# 14. Employee Sorting

Support useful sorting options such as:

```text
Employee Name
Department
Job Position
Status
```

The exact frontend implementation can use table sorting or backend query parameters.

---

# 15. Employee Kanban View

Kanban provides a visual employee overview.

Each employee card should display the most useful employee information.

Recommended card:

```text
┌────────────────────────────────────┐
│          [Avatar / Initials]       │
│                                    │
│          Aarav Mehta               │
│          Software Developer        │
│                                    │
│ Department: Engineering            │
│ Status: Active                     │
└────────────────────────────────────┘
```

The reference design uses:

* Avatar/initials
* Employee name
* Job position
* Department
* Active status

---

# 16. Employee Avatar

Employee records should support an avatar/profile image where available.

If no image exists, display initials.

Example:

```text
Aarav Mehta
```

can display:

```text
AM
```

Do not require profile images for employee creation.

Initials should be generated automatically when no avatar exists.

---

# 17. Employee Form Overview

The Employee Form is the most important page in this module.

It acts as the employee's operational hub.

It must display:

* Identity information
* Work email
* Phone
* Department
* Manager
* Working Schedule
* Company
* Job Position
* Work Location
* Status
* Related record smart buttons

The form must provide direct navigation to related HR records.

---

# 18. Employee Form Structure

Recommended structure:

```text
---------------------------------------------------------------
Employee
---------------------------------------------------------------

[Avatar]

Employee Name       [________________________]

Work Email          [________________________]
Phone               [________________________]

Department          [________________________]
Manager             [________________________]
Job Position        [________________________]
Work Location       [________________________]

Working Schedule    [________________________]
Company             [________________________]

Status              [ Active ▼ ]

---------------------------------------------------------------
Related Records

[ Contracts  2 ]
[ Attendance 45 ]
[ Time Off 3 ]
[ Allocations 2 ]

---------------------------------------------------------------

              [ Save ] [ Cancel ]
---------------------------------------------------------------
```

The exact layout can be adapted while preserving all required information.

---

# 19. Employee Identity

The employee form must have a clear identity section.

Minimum:

```text
Employee Name
Avatar
```

The employee name is required.

Do not allow an employee to be created without a name.

---

# 20. Employee Name

Field:

```text
employee_name
```

Type:

```text
String
```

Required:

```text
Yes
```

Validation:

* Cannot be empty.
* Cannot contain only whitespace.
* Trim leading/trailing whitespace.
* Reasonable maximum length should be enforced.

Example:

```text
Aarav Mehta
```

---

# 21. Work Email

Field:

```text
work_email
```

Type:

```text
Email
```

The Employee List must display Work Email.

Validation:

* Validate email format.
* Normalize email consistently.
* Avoid accidental duplicate employee email records where the application requires uniqueness.
* Do not expose authentication credentials through this field.

Example:

```text
aarav@company.com
```

---

# 22. Phone

Field:

```text
phone
```

Type:

```text
String
```

Phone is part of the employee form.

It may be optional unless business requirements require it.

Do not use the phone field as a login credential unless explicitly implemented as a separate feature.

---

# 23. Department

Field:

```text
department_id
```

Relationship:

```text
Employee -> Department
```

The employee form must display Department.

Department is important for:

* HR reporting
* Payroll dashboard
* Employee filtering
* Salary cost by department
* Department overview

Department should preferably be a selectable relationship rather than free-text data.

Example:

```text
Department:
[ Engineering ▼ ]
```

---

# 24. Manager

Field:

```text
manager_id
```

Relationship:

```text
Employee -> Employee
```

An employee can have another employee as their manager.

Example:

```text
Manager:
[ Sara Khan ▼ ]
```

Manager selection should only allow valid employee records.

An employee should not be allowed to select themselves as their own manager.

---

# 25. Manager Validation

Reject:

```text
Employee A
Manager = Employee A
```

because this creates a self-reference.

At minimum:

```text
manager_id != employee_id
```

must be enforced.

---

# 26. Manager Relationship

The manager relationship should be implemented as a self-referencing employee relationship.

Conceptually:

```text
Employee
    |
    +-- manager_id
           |
           v
        Employee
```

This supports organizational hierarchy.

Do not duplicate manager names as plain text if a relationship can be used.

---

# 27. Job Position

Field:

```text
job_position
```

or:

```text
job_position_id
```

depending on whether Job Position is implemented as a master table.

The Employee List must display Job Position.

The Employee Form must display Job Position.

Example:

```text
Job Position:
[ Software Developer ]
```

---

# 28. Work Location

Field:

```text
work_location
```

The Employee Form must capture the employee's work location.

Examples:

```text
Ahmedabad Office
Remote
Hybrid
Mumbai Office
```

The exact location-master architecture is optional unless required elsewhere.

---

# 29. Working Schedule

Field:

```text
working_schedule_id
```

The Employee Form must display the employee's assigned Working Schedule.

Example:

```text
Working Schedule:
[ 40 Hours / Week ▼ ]
```

Working Schedule determines the expected working pattern for the employee.

Detailed Working Schedule functionality belongs to:

```text
04_WORKING_SCHEDULES.md
```

---

# 30. Company

Field:

```text
company_id
```

The Employee Form must support company association.

Example:

```text
Company:
[ PeoplePay360 Pvt Ltd ▼ ]
```

Company can later be used for:

* Payroll filtering
* Dashboard filtering
* Employee grouping
* Contract context

---

# 31. Employee Status

Field:

```text
status
```

Required values:

```text
Active
Inactive
```

Recommended internal values:

```text
active
inactive
```

The Employee List must display status.

The Kanban card should also display status.

---

# 32. Active Employee

An Active employee:

* Can participate in normal HR operations.
* Can have an active contract.
* Can have attendance records.
* Can create/receive applicable time-off records.
* Can be eligible for payroll according to payroll rules.

Active does not automatically mean the employee has an active contract.

These are separate concepts.

---

# 33. Inactive Employee

An Inactive employee:

* Remains in the database.
* Remains available in historical records.
* Should not normally be selected as a new active payroll employee.
* Should not be deleted merely because employment is inactive.
* Can remain associated with historical contracts, attendance, leave, and payslips.

---

# 34. Employee vs Contract Status

Do NOT confuse:

```text
Employee Status
```

with:

```text
Contract Status
```

Example:

```text
Employee = Active

Contract A = Expired
Contract B = Running
```

The employee can remain active while contract history changes.

The Contract module controls employment-period terms.

---

# 35. Employee Database Model

Recommended table:

```text
employees
---------
id
name
work_email
phone
avatar_url
department_id
manager_id
job_position_id
work_location
working_schedule_id
company_id
status
created_at
updated_at
```

The exact schema may vary, but all required business fields must exist.

---

# 36. Employee Primary Key

Use:

```text
id
```

as the primary key.

It must be:

* Unique.
* Stable.
* Used by relationships.

Do not use employee name as the primary key.

---

# 37. Employee Relationships

The Employee entity should connect to:

```text
Employee
   |
   +-- Department
   |
   +-- Manager
   |
   +-- Job Position
   |
   +-- Working Schedule
   |
   +-- Company
   |
   +-- Contracts
   |
   +-- Attendance
   |
   +-- Time Off Requests
   |
   +-- Allocations
   |
   +-- Payslips
```

This relationship structure is critical to the overall PeoplePay360 workflow.

---

# 38. Employee → Contracts

One employee can have multiple contracts.

Example:

```text
Aarav Mehta
    |
    +-- Contract 1
    |      Jan 2025 - Dec 2025
    |
    +-- Contract 2
           Jan 2026 - Current
```

Do not store only the latest contract directly on the Employee record.

Historical contracts must be preserved.

Detailed contract behavior belongs to:

```text
03_CONTRACT_MANAGEMENT.md
```

---

# 39. Employee → Attendance

One employee can have many attendance records.

Example:

```text
Aarav Mehta
    |
    +-- Attendance 01
    +-- Attendance 02
    +-- Attendance 03
    +-- ...
```

The Employee Form smart button must open attendance records filtered to the current employee.

---

# 40. Employee → Time Off

One employee can have many time-off requests.

Example:

```text
Aarav Mehta
    |
    +-- Casual Leave
    +-- Sick Leave
    +-- Vacation
```

The Employee Form smart button must open Time Off records filtered to the current employee.

---

# 41. Employee → Allocations

One employee can have multiple allocations.

Example:

```text
Aarav Mehta
    |
    +-- Paid Leave Allocation
    +-- Sick Leave Allocation
```

The Employee Form must provide an Allocations smart button.

---

# 42. Employee → Payslips

An employee can have multiple payslips over time.

Example:

```text
Aarav Mehta
    |
    +-- January Payslip
    +-- February Payslip
    +-- March Payslip
    +-- ...
```

Payslip access must follow RBAC and employee ownership rules defined in:

```text
01_LOGIN_RBAC_USER_MANAGEMENT.md
10_PAYSLIP_COMPUTATION.md
```

---

# 43. Smart Buttons

The Employee Form must contain smart-button actions for related records.

Required:

```text
Contracts
Attendance
Time Off
Allocations
```

Each smart button should show a count where practical.

Example:

```text
[ Contracts 2 ]
[ Attendance 25 ]
[ Time Off 3 ]
[ Allocations 2 ]
```

---

# 44. Smart Button Behavior

Clicking:

```text
Contracts
```

must open the Contracts view filtered to:

```text
employee_id = current_employee.id
```

Clicking:

```text
Attendance
```

must open attendance records for the current employee.

Clicking:

```text
Time Off
```

must open time-off records for the current employee.

Clicking:

```text
Allocations
```

must open allocation records for the current employee.

---

# 45. Smart Button Counts

Counts should be derived from actual database records.

Do not hardcode:

```text
Contracts 2
Attendance 25
```

Counts must update when related records change.

Example:

```text
New Contract Created
        |
        v
Contracts Count
2 -> 3
```

---

# 46. Smart Button Navigation

The user experience should be:

```text
Employee Form
     |
     +---- Contracts
     |       |
     |       +-- Filtered Contracts
     |
     +---- Attendance
     |       |
     |       +-- Filtered Attendance
     |
     +---- Time Off
     |       |
     |       +-- Filtered Requests
     |
     +---- Allocations
             |
             +-- Filtered Allocations
```

Do not simply navigate to an unfiltered global list.

---

# 47. Employee Form as Operational Hub

The Employee Form should allow HR users to move through the employee lifecycle.

Example:

```text
Employee
   ↓
View Contract
   ↓
View Working Schedule
   ↓
View Attendance
   ↓
View Time Off
   ↓
View Allocations
   ↓
View Payslips
```

This connected experience is one of the important goals of PeoplePay360.

---

# 48. Create Employee Workflow

Workflow:

```text
Employees
   |
   v
[New]
   |
   v
Employee Form
   |
   v
Enter Required Information
   |
   v
Validate
   |
   v
Save
   |
   v
Employee Created
   |
   v
Employee Form
```

Do not create incomplete records silently.

---

# 49. Required Fields

At minimum:

```text
Employee Name
Status
```

should be required.

Depending on the application's business configuration, additional fields may be required before payroll eligibility.

For example:

```text
Department
Working Schedule
Company
```

can be validated when the employee is used in payroll.

Do not make unrelated fields mandatory if the source requirements do not require them.

---

# 50. Employee Validation

Before saving:

* Validate required fields.
* Validate email format if supplied.
* Validate manager relationship.
* Validate referenced department.
* Validate referenced schedule.
* Validate referenced company.
* Validate status.
* Prevent invalid foreign keys.

---

# 51. Duplicate Employee Prevention

The system should detect likely duplicate employees.

Useful checks:

* Work email.
* Other configured unique employee identifiers if later added.

Do not silently create duplicate employee records when a strong unique identifier already exists.

---

# 52. Employee Update

Authorized users can edit employee information.

Example:

```text
HR Manager
    |
    v
Employee Form
    |
    v
Edit Department
    |
    v
Save
```

Changes must update the employee record without deleting historical related records.

---

# 53. Historical Data Principle

Employee updates must not destroy historical HR/payroll records.

For example:

```text
Employee Department:
Engineering
```

may later become:

```text
Finance
```

but historical payroll records must remain associated with the data/context under which they were processed.

Do not rewrite historical payslip data merely because the current employee profile changes.

---

# 54. Deactivation

When an employee becomes inactive:

```text
status = inactive
```

Do not automatically delete:

* Contracts
* Attendance
* Time Off
* Allocations
* Payslips
* Payroll history

Historical information must remain available.

---

# 55. Deactivation Confirmation

Show confirmation before deactivating an employee.

Example:

```text
Deactivate Employee?

Aarav Mehta will be marked inactive.

Historical contracts, attendance, leave, and payroll records will remain available.

[Cancel] [Deactivate]
```

---

# 56. Reactivation

Authorized users should be able to reactivate an inactive employee.

Example:

```text
Inactive
   |
   v
[Activate]
   |
   v
Active
```

Reactivation must not automatically create:

* New contract
* New schedule
* New allocation
* New payslip

Those are separate business operations.

---

# 57. Delete Employee

Avoid physical employee deletion when historical records exist.

Preferred:

```text
Deactivate
```

instead of:

```text
Delete
```

If deletion is implemented for administrative cleanup, the backend must protect records with existing dependencies.

The safest default is to preserve employee records.

---

# 58. Employee Permissions

Follow RBAC from:

```text
01_LOGIN_RBAC_USER_MANAGEMENT.md
```

### Employee

Can:

* View own employee information.
* View allowed own records.

Cannot:

* Manage other employees.
* Create HR master records.
* Delete employees.
* Change protected employee data.

### HR Manager

Can:

* Create employees.
* Read employees.
* Update employees.
* Manage employee master information.

### HR Payroll User

Has HR Manager employee permissions.

### HR Payroll Manager

Has full HR employee permissions.

### Admin

Has full employee management permissions.

---

# 59. Employee Self-Access

An Employee must only access their own employee record.

Example:

```text
Employee A logged in
```

can access:

```text
Employee A
```

but not:

```text
Employee B
```

by manually changing the URL.

Backend ownership validation is mandatory.

---

# 60. API Endpoints

Recommended API:

```text
GET    /api/employees
POST   /api/employees
GET    /api/employees/{id}
PUT    /api/employees/{id}
PATCH  /api/employees/{id}
DELETE /api/employees/{id}
```

If soft deactivation is used:

```text
PATCH /api/employees/{id}/status
```

can be provided.

---

# 61. Employee List API

Example:

```http
GET /api/employees
```

Support query parameters where useful:

```text
search
status
department_id
job_position_id
company_id
working_schedule_id
page
limit
sort
```

Example:

```http
GET /api/employees?status=active&department_id=2
```

---

# 62. Employee Detail API

Example:

```http
GET /api/employees/{id}
```

Response should contain employee information required by the form.

Example:

```json
{
  "id": 1,
  "name": "Aarav Mehta",
  "work_email": "aarav@example.com",
  "phone": "+91XXXXXXXXXX",
  "department_id": 2,
  "manager_id": 4,
  "job_position_id": 3,
  "work_location": "Ahmedabad Office",
  "working_schedule_id": 1,
  "company_id": 1,
  "status": "active"
}
```

---

# 63. Related Counts API

The Employee Form needs related record counts.

These can be returned as part of the employee detail response:

```json
{
  "contracts_count": 2,
  "attendance_count": 45,
  "time_off_count": 3,
  "allocations_count": 2
}
```

Counts must be calculated from live records.

---

# 64. Employee Creation API

Example:

```http
POST /api/employees
```

Request:

```json
{
  "name": "Aarav Mehta",
  "work_email": "aarav@example.com",
  "phone": "+91XXXXXXXXXX",
  "department_id": 2,
  "manager_id": 4,
  "job_position_id": 3,
  "work_location": "Ahmedabad Office",
  "working_schedule_id": 1,
  "company_id": 1,
  "status": "active"
}
```

Backend must validate every relationship.

---

# 65. Employee Update API

Example:

```http
PUT /api/employees/1
```

The backend must:

1. Authenticate user.
2. Check employee-management permission.
3. Validate input.
4. Validate referenced records.
5. Save changes.
6. Return updated employee.

---

# 66. Employee Status API

Recommended:

```http
PATCH /api/employees/{id}/status
```

Request:

```json
{
  "status": "inactive"
}
```

Only authorized roles may perform this operation.

---

# 67. Department Relationship Validation

When setting:

```text
department_id
```

the backend must verify that the department exists.

Do not allow:

```text
department_id = 999999
```

when that department does not exist.

---

# 68. Working Schedule Relationship Validation

When assigning:

```text
working_schedule_id
```

the backend must verify that the schedule exists and is usable.

Detailed schedule validation belongs to:

```text
04_WORKING_SCHEDULES.md
```

---

# 69. Company Relationship Validation

When assigning:

```text
company_id
```

the backend must verify that the company exists.

Do not allow broken references.

---

# 70. Job Position Relationship Validation

When Job Position is implemented as a relational master record:

```text
job_position_id
```

must reference a valid job position.

If implemented as a simple field for MVP, keep the field consistent throughout the application.

Do not mix free-text and relational implementations inconsistently.

---

# 71. Employee Form Read Mode

The form should clearly distinguish:

```text
View
```

and:

```text
Edit
```

For users without edit permissions:

* Fields should be read-only.
* Save should not be available.
* Sensitive editing controls should be hidden.

---

# 72. Employee Form Edit Mode

Authorized HR users should be able to edit.

Example:

```text
Employee
------------------------------------------------

Name            Aarav Mehta
Work Email      aarav@example.com
Department      Engineering

                    [Edit]
```

After Edit:

```text
[Save] [Cancel]
```

---

# 73. Unsaved Changes

If the user edits the form and attempts to navigate away, warn about unsaved changes.

Example:

```text
You have unsaved changes.

[Stay] [Discard Changes]
```

This prevents accidental loss of HR data.

---

# 74. Loading State

Employee List:

```text
Loading employees...
```

Employee Form:

```text
Loading employee...
```

Do not render broken or undefined fields while data is loading.

---

# 75. Empty Employee List

If no employees exist:

```text
No employees found.
```

Provide:

```text
[Create Employee]
```

when the user has permission.

---

# 76. Empty Search Result

If filters/search return nothing:

```text
No employees match your search.
```

Provide a way to clear filters.

Example:

```text
[Clear Filters]
```

---

# 77. Error Handling

Employee API errors should be displayed clearly.

Examples:

```text
Unable to load employees.
Unable to create employee.
Unable to update employee.
Employee not found.
You do not have permission to perform this action.
Department not found.
Working schedule not found.
```

Do not expose:

* SQL errors
* Stack traces
* Internal server paths
* Database credentials

---

# 78. Employee Not Found

If:

```text
/employees/999999
```

does not exist:

Display:

```text
Employee Not Found

The employee record you are looking for does not exist.
```

Provide:

```text
[Back to Employees]
```

---

# 79. Odoo-Style UX Requirements

The Employee module must visually follow the provided HRMS/Odoo-style reference.

Use:

* ERP-style top navigation.
* Clear page title.
* Search/filter toolbar.
* List/Kanban toggle.
* Clean data tables.
* Form-based editing.
* Smart buttons.
* Status indicators.
* Compact business-oriented spacing.
* Clear action buttons.

Do not turn the module into a generic social-profile application.

---

# 80. Employee Page Header

Recommended:

```text
Employees

[ Search... ] [ Filters ]                 [Kanban] [List]

                                      [New]
```

Employee Form:

```text
Employee

[Back]

[Smart Buttons]

Employee Details
...
```

Keep the page focused on business operations.

---

# 81. Smart Button Visual Design

Smart buttons should look like compact ERP statistics.

Example:

```text
┌───────────────┐
│ Contracts     │
│      2        │
└───────────────┘

┌───────────────┐
│ Attendance    │
│     45        │
└───────────────┘

┌───────────────┐
│ Time Off      │
│      3        │
└───────────────┘

┌───────────────┐
│ Allocations   │
│      2        │
└───────────────┘
```

The exact visual implementation can use Tailwind CSS.

---

# 82. Responsive Behavior

The Employee module must work on:

* Desktop
* Laptop
* Tablet

The main hackathon demo is likely desktop-oriented, so prioritize desktop ERP usability.

On smaller screens:

* List tables may scroll horizontally.
* Form fields may stack vertically.
* Smart buttons may wrap.

Do not sacrifice core functionality for unnecessary mobile-specific complexity.

---

# 83. Accessibility

Use:

* Proper form labels.
* Keyboard-accessible buttons.
* Accessible dropdowns.
* Clear focus states.
* Meaningful error messages.
* Sufficient text contrast.
* Proper table headings.

Do not rely only on color to communicate Active/Inactive status.

---

# 84. Employee Data Validation Rules

Minimum rules:

```text
Name:
    Required

Email:
    Valid email format if provided

Manager:
    Must be valid employee
    Cannot equal self

Department:
    Must exist

Working Schedule:
    Must exist when assigned

Company:
    Must exist when assigned

Status:
    active or inactive
```

---

# 85. Business Logic Rules

Implement these rules:

### Rule 1

Employee name cannot be empty.

### Rule 2

Manager cannot be the employee themselves.

### Rule 3

Referenced department must exist.

### Rule 4

Referenced working schedule must exist.

### Rule 5

Referenced company must exist.

### Rule 6

Employee status must be valid.

### Rule 7

Inactive employees remain available historically.

### Rule 8

Employee deletion must not destroy historical payroll records.

### Rule 9

Employee smart-button counts must use live related records.

### Rule 10

Employee self-access must be enforced by backend authorization.

---

# 86. Payroll Eligibility Principle

Creating an Employee does NOT automatically make them payroll-ready.

Payroll eligibility may depend on:

* Active employee.
* Applicable contract.
* Working schedule.
* Salary structure.
* Required employee information.

The Payroll module is responsible for validating payroll eligibility.

Do not put the entire payroll calculation engine inside Employee Master.

---

# 87. Contract Integration

Employee Master must provide a clear connection to Contracts.

Example:

```text
Employee Form
     |
     +-- Contracts 2
             |
             v
     Contract List
     filtered by employee
```

Contract history must remain intact.

---

# 88. Attendance Integration

Employee Master must provide:

```text
Attendance 45
```

Clicking it opens:

```text
Attendance
Employee = Aarav Mehta
```

Attendance records must remain accessible globally as well.

---

# 89. Time-Off Integration

Employee Master must provide:

```text
Time Off 3
```

Clicking it opens:

```text
Time Off Requests
Employee = Aarav Mehta
```

The employee should not need to manually search their name.

---

# 90. Allocation Integration

Employee Master must provide:

```text
Allocations 2
```

Clicking it opens allocation records for the employee.

This supports transparent leave-balance management.

---

# 91. Payroll Integration

Employee Master should connect to payroll through:

```text
Employee
   |
   +-- Contract
   |
   +-- Salary Structure through Contract/Payroll context
   |
   +-- Payrun
   |
   +-- Payslip
```

Do not duplicate salary computation logic inside Employee Master.

---

# 92. Employee Data and Historical Payslips

Once a payslip is finalized, changing the employee's current:

* Department
* Job Position
* Working Schedule
* Manager

must not corrupt the historical payslip.

Historical payroll must remain auditable.

---

# 93. Employee Data and Attendance

Attendance records should reference the employee by ID.

Do not duplicate all employee information into every attendance record.

Example:

```text
attendance
-----------
id
employee_id
check_in
check_out
worked_hours
...
```

Employee information is resolved through the relationship.

---

# 94. Employee Data and Time Off

Time Off requests should reference:

```text
employee_id
```

rather than copying employee names.

This ensures consistency.

---

# 95. Employee Data and Contracts

Contracts must reference:

```text
employee_id
```

One employee can therefore have many historical contracts.

This is required for payroll period-specific contract selection.

---

# 96. API Authorization

Every Employee API endpoint must enforce permissions.

Examples:

```text
GET /api/employees
```

requires employee read permission.

```text
POST /api/employees
```

requires employee create permission.

```text
PUT /api/employees/{id}
```

requires employee update permission.

```text
DELETE /api/employees/{id}
```

requires appropriate administrative permission.

---

# 97. Self-Access API Rule

If the current user is an Employee:

```text
GET /api/employees/{id}
```

must verify:

```text
id == current_user.employee_id
```

unless the user has broader employee-read permission.

Do not trust the frontend.

---

# 98. Employee List Permission Behavior

### Employee

Do not expose the entire employee directory unless explicitly permitted.

Prefer:

```text
My Employee Record
```

for the Employee role.

### HR Manager

Can access employee list.

### HR Payroll User

Can access employee list.

### HR Payroll Manager

Can access employee list.

### Admin

Can access employee list.

---

# 99. Employee Form Smart Button Permission Behavior

An Employee viewing their own form should only see related records they are authorized to access.

Example:

```text
Employee
    |
    +-- Attendance
    +-- Time Off
    +-- Allocations
    +-- Payslips
```

HR users can access broader records according to RBAC.

Do not expose sensitive payroll information merely because a smart button exists.

---

# 100. Testing — Employee List

Test:

```text
1. Employee list loads.
2. Employees display correct columns.
3. Search works.
4. Status filter works.
5. Department filter works.
6. Kanban toggle works.
7. List toggle works.
8. New button works for authorized users.
9. Unauthorized users cannot create employees.
10. Empty state works.
```

---

# 101. Testing — Kanban

Test:

```text
1. Employee cards render.
2. Avatar/initials render.
3. Name renders.
4. Job position renders.
5. Department renders.
6. Status renders.
7. Clicking a card opens employee form.
8. Inactive employees are visually distinguishable.
```

---

# 102. Testing — Employee Form

Test:

```text
1. Employee form loads.
2. Name displays.
3. Work email displays.
4. Phone displays.
5. Department displays.
6. Manager displays.
7. Job position displays.
8. Work location displays.
9. Working schedule displays.
10. Company displays.
11. Status displays.
12. Smart buttons display.
13. Counts are correct.
```

---

# 103. Testing — Create Employee

Test:

```text
1. Open New.
2. Enter valid data.
3. Save.
4. Employee appears in list.
5. Employee form opens.
6. Smart button counts initialize correctly.
```

---

# 104. Testing — Invalid Employee

Test:

```text
1. Submit without name.
2. Validation appears.
3. Record is not created.
```

Also test:

```text
Manager = self
```

and confirm the request is rejected.

---

# 105. Testing — Edit Employee

Test:

```text
1. Open employee.
2. Edit department.
3. Save.
4. Updated department appears.
5. Related historical records remain intact.
```

---

# 106. Testing — Deactivate Employee

Test:

```text
1. Open active employee.
2. Change status to inactive.
3. Confirm.
4. Employee becomes inactive.
5. Employee remains searchable.
6. Historical records remain.
```

---

# 107. Testing — Smart Buttons

For an employee with:

```text
2 Contracts
10 Attendance
3 Time Off
2 Allocations
```

the form should display:

```text
Contracts 2
Attendance 10
Time Off 3
Allocations 2
```

Click each button and verify the opened records are filtered to the current employee.

---

# 108. Testing — Employee Ownership

Test:

```text
Employee A logged in.
```

Attempt:

```text
GET /api/employees/Employee-B
```

Expected:

```text
403 Forbidden
```

or an equivalent secure response.

---

# 109. Testing — HR Manager

Verify HR Manager can:

```text
Create Employee
Read Employee
Update Employee
Deactivate Employee
```

Verify HR Manager cannot perform unrelated Admin actions.

---

# 110. Testing — Payroll Roles

Verify:

```text
HR Payroll User
```

can access employees according to HR permissions.

Verify:

```text
HR Payroll Manager
```

has full employee management permissions.

---

# 111. Testing — Admin

Verify Admin can:

```text
Create
Read
Update
Deactivate
Manage
```

employee records.

---

# 112. Database Testing

Verify:

```text
Employee ID unique
Department foreign key valid
Manager foreign key valid
Working Schedule foreign key valid
Company foreign key valid
Employee status valid
```

Test invalid foreign-key references.

---

# 113. Performance Requirements

Employee List must not load every related record individually.

Avoid:

```text
100 Employees
+
100 Contract Queries
+
100 Attendance Queries
+
100 Time-Off Queries
```

when a more efficient query strategy is possible.

Smart-button counts should be efficiently aggregated.

Use:

* Pagination
* Indexed foreign keys
* Efficient count queries
* Backend filtering
* Server-side sorting where appropriate

---

# 114. Pagination

If employee count becomes large, use pagination.

Example:

```text
Page 1
1–20 of 150 employees
```

The exact page size can be configured.

Do not load unlimited employee records into the browser.

---

# 115. Search Performance

Employee search should be performed efficiently.

Searchable fields:

```text
name
work_email
job_position
department
```

Use database indexes where appropriate.

---

# 116. Frontend Component Structure

Recommended:

```text
src/
└── modules/
    └── employees/
        ├── pages/
        │   ├── EmployeeListPage.jsx
        │   ├── EmployeeFormPage.jsx
        │   └── EmployeeDetailPage.jsx
        │
        ├── components/
        │   ├── EmployeeKanban.jsx
        │   ├── EmployeeList.jsx
        │   ├── EmployeeForm.jsx
        │   ├── EmployeeSmartButtons.jsx
        │   ├── EmployeeSearch.jsx
        │   └── EmployeeFilters.jsx
        │
        ├── services/
        │   └── employeeService.js
        │
        └── hooks/
            └── useEmployees.js
```

Adapt to the project's existing architecture if necessary.

---

# 117. Backend Component Structure

Recommended:

```text
backend/
└── app/
    └── employees/
        ├── models.py
        ├── schemas.py
        ├── router.py
        ├── service.py
        └── repository.py
```

Keep:

```text
Router
Service
Database
```

responsibilities separated where practical.

---

# 118. Employee Service Responsibilities

The employee service should handle:

* Create employee.
* Update employee.
* Retrieve employee.
* Search employees.
* Filter employees.
* Deactivate employee.
* Reactivate employee.
* Validate manager.
* Calculate related counts where required.

Do not place complex business logic directly in route handlers.

---

# 119. API Response Consistency

Employee APIs should return consistent JSON structures.

Example:

```json
{
  "id": 1,
  "name": "Aarav Mehta",
  "work_email": "aarav@example.com",
  "department": {
    "id": 2,
    "name": "Engineering"
  },
  "job_position": {
    "id": 3,
    "name": "Software Developer"
  },
  "status": "active"
}
```

The exact response structure can be adapted to the project.

---

# 120. Do Not Overload Employee Model

Do not put:

* Payroll calculation formulas
* Salary rule logic
* Attendance calculation engine
* Time-off allocation engine
* Payslip computation logic

inside the Employee model.

Employee is the central relationship hub.

Each business domain should own its own logic.

---

# 121. Separation of Responsibilities

Use:

```text
Employee
    → Who the person is

Contract
    → Employment terms

Working Schedule
    → Expected working pattern

Attendance
    → Actual worked time

Time Off
    → Leave activity

Allocation
    → Leave entitlement

Salary Structure
    → Salary rule collection

Salary Rule
    → Salary calculation

Payrun
    → Payroll batch

Payslip
    → Employee payroll result
```

This separation is essential.

---

# 122. Demo Employee Data

Seed realistic employee records for the hackathon demonstration.

The provided design/reference data includes examples such as:

```text
Aarav Mehta
Sara Khan
John Dsouza
Neha Patel
```

Use the project's approved demo data consistently across modules.

Do not create random employee data separately in each module.

---

# 123. Demo Example — Aarav Mehta

Example:

```text
Employee:
Aarav Mehta

Work Email:
aarav@example.com

Job Position:
Software Developer

Department:
Engineering

Manager:
Sara Khan

Working Schedule:
40 Hours / Week

Company:
PeoplePay360

Work Location:
Ahmedabad Office

Status:
Active
```

The exact values can be adapted to the final seed dataset.

---

# 124. Demo Employee Flow

For the hackathon demo:

```text
Employees
    |
    v
Aarav Mehta
    |
    v
Employee Form
    |
    +-- Contracts 2
    |
    +-- Attendance 25
    |
    +-- Time Off 3
    |
    +-- Allocations 2
```

Click:

```text
Contracts
```

and show only Aarav's contracts.

Then:

```text
Attendance
```

and show only Aarav's attendance.

Then:

```text
Time Off
```

and show only Aarav's requests.

This demonstrates that PeoplePay360 is an integrated HR system rather than disconnected CRUD pages.

---

# 125. Employee Lifecycle

The Employee module should support this lifecycle:

```text
Employee Created
      |
      v
Employee Active
      |
      v
Contract Assigned
      |
      v
Working Schedule Assigned
      |
      v
Attendance Recorded
      |
      v
Time Off Allocated
      |
      v
Time Off Requested
      |
      v
Payroll Processed
      |
      v
Payslip Generated
      |
      v
Historical Employee Data
```

The Employee Master remains the central reference throughout this lifecycle.

---

# 126. Critical Business Principle

Do not design:

```text
Employees
Contracts
Attendance
Time Off
Payroll
```

as independent modules.

Design:

```text
Employee
    |
    +--> Contract
    |
    +--> Schedule
    |
    +--> Attendance
    |
    +--> Time Off
    |
    +--> Allocation
    |
    +--> Payroll
```

The Employee record is the connection point.

---

# 127. Final Employee Module Definition of Done

The Employee Master module is complete only when:

* [ ] Employee List view exists.
* [ ] Employee Kanban view exists.
* [ ] Employee Form exists.
* [ ] List/Kanban toggle works.
* [ ] New Employee works.
* [ ] Employee Name exists.
* [ ] Avatar/initials supported.
* [ ] Work Email exists.
* [ ] Phone exists.
* [ ] Department exists.
* [ ] Manager exists.
* [ ] Job Position exists.
* [ ] Work Location exists.
* [ ] Working Schedule exists.
* [ ] Company exists.
* [ ] Status exists.
* [ ] Search works.
* [ ] Filters work.
* [ ] Sorting works.
* [ ] Employee creation works.
* [ ] Employee editing works.
* [ ] Employee deactivation works.
* [ ] Employee reactivation works.
* [ ] Historical records are preserved.
* [ ] Contracts smart button works.
* [ ] Attendance smart button works.
* [ ] Time Off smart button works.
* [ ] Allocations smart button works.
* [ ] Smart-button counts are live.
* [ ] Smart-button navigation applies employee filters.
* [ ] Employee ownership is enforced.
* [ ] RBAC is enforced.
* [ ] HR Manager can manage employees.
* [ ] HR Payroll User has appropriate HR access.
* [ ] HR Payroll Manager has full HR access.
* [ ] Admin has full access.
* [ ] Employee cannot access another employee's record.
* [ ] Employee cannot manage other employees.
* [ ] Employee data is validated.
* [ ] Manager cannot be self.
* [ ] Foreign-key relationships are validated.
* [ ] API endpoints are protected.
* [ ] Error handling works.
* [ ] Empty states work.
* [ ] Loading states work.
* [ ] Responsive layout works.
* [ ] UI follows the Odoo-style reference.
* [ ] Employee module integrates with Contracts.
* [ ] Employee module integrates with Attendance.
* [ ] Employee module integrates with Time Off.
* [ ] Employee module integrates with Allocations.
* [ ] Employee module integrates with Payroll.
* [ ] Employee module does not contain unrelated payroll logic.
* [ ] Automated tests pass.

---

# 128. AI CODING AGENT INSTRUCTIONS

When implementing this module:

## MUST

* Read `00_MASTER.md` first.
* Read `01_LOGIN_RBAC_USER_MANAGEMENT.md`.
* Treat Employee as the central HR hub.
* Implement Kanban, List, and Form views.
* Implement all required employee fields.
* Implement smart buttons.
* Make smart-button counts live.
* Make smart buttons open filtered related records.
* Implement RBAC.
* Implement backend ownership checks.
* Preserve historical records.
* Use PostgreSQL relationships.
* Use FastAPI APIs.
* Use React + Vite + Tailwind.
* Follow the provided Odoo-style UX.
* Keep Employee logic separate from Contract, Attendance, Time Off, and Payroll engines.
* Write automated tests.

## MUST NOT

* Build only a basic CRUD table.
* Remove Kanban/List/Form support.
* Hardcode smart-button counts.
* Allow an Employee to access another employee.
* Trust frontend permissions.
* Delete historical payroll data.
* Put salary-rule computation inside Employee.
* Put attendance calculations inside Employee.
* Put leave allocation logic inside Employee.
* Duplicate employee data unnecessarily across modules.
* Create a completely unrelated UI design.
* Allow an employee to become their own manager.
* Create broken foreign-key relationships.

---

# 129. FINAL EXPECTED EXPERIENCE

The final PeoplePay360 Employee experience should look conceptually like:

```text
                         PEOPLEPAY360
                              |
                              v
                         EMPLOYEES
                              |
                +-------------+-------------+
                |                           |
                v                           v
             KANBAN                       LIST
                |                           |
                +-------------+-------------+
                              |
                              v
                       EMPLOYEE FORM
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
       Identity          Work Information     Status
          |                   |                   |
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                       SMART BUTTONS
                              |
       +----------+-----------+-----------+-----------+
       |          |                       |           |
       v          v                       v           v
   Contracts  Attendance               Time Off   Allocations
       |          |                       |           |
       v          v                       v           v
   Contract    Worked Time             Requests    Balances
       |                                  |
       +----------------+-----------------+
                        |
                        v
                     PAYROLL
                        |
                        v
                     PAYSLIP
```

The Employee Master is therefore the **central operational hub** of PeoplePay360.

# END OF 02_EMPLOYEE_MASTER.md

```

The source requirements specifically support the central-hub approach, the three employee views, required work fields, and direct related-record navigation. :contentReference[oaicite:1]{index=1}

**Next:** `03_CONTRACT_MANAGEMENT.md` — this is especially important because it will define **contract history, start/end dates, active/running status, wage, salary structure, period-based contract selection, and prevention of concurrent active contracts**, which directly feeds the payroll engine.
```
