Below is the complete **`14_UI_UX_DESIGN_FROM_SVG.md`** specification. It should be used by your AI/development team as the **single source of truth for implementing the PeoplePay360 frontend UI/UX**, following the visual direction of the attached SVG design.

# PeoplePay360 — UI/UX Design System & SVG-Based Implementation Specification

## 1. Purpose

This document defines the complete UI/UX implementation requirements for the **PeoplePay360** application.

The application must not look like a collection of random admin pages.

It must look like:

```text
ONE MODERN
PREMIUM
ENTERPRISE
HR + PAYROLL PLATFORM
```

The UI design must follow the visual language, structure, spacing, layout patterns, colors, cards, navigation, tables, forms, and interaction principles established by the provided SVG design reference.

The goal is to create a system that feels:

```text
✓ Modern

✓ Professional

✓ Clean

✓ Premium

✓ Enterprise-grade

✓ Easy to understand

✓ Fast to navigate

✓ Consistent across every module
```

---

# 2. Core Design Philosophy

PeoplePay360 combines two worlds:

```text
HR MANAGEMENT
+
PAYROLL MANAGEMENT
```

Therefore the UI must balance:

```text
BUSINESS COMPLEXITY
+
VISUAL SIMPLICITY
```

The user should never feel overwhelmed.

Even when a page contains:

```text
Employees

Contracts

Attendance

Leave

Salary Structures

Salary Rules

Payruns

Payslips
```

the interface should remain visually organized.

The primary design principle is:

```text
COMPLEX BUSINESS LOGIC
SHOULD FEEL SIMPLE TO USE.
```

---

# 3. Overall Application Layout

The application should use a modern enterprise dashboard structure.

```text
┌──────────────────────────────────────────────────────────────┐
│ TOP HEADER                                                   │
│ Logo | Search | Notifications | Profile                      │
├───────────────┬──────────────────────────────────────────────┤
│               │                                              │
│               │                                              │
│   SIDEBAR     │              MAIN CONTENT                    │
│   NAVIGATION  │                                              │
│               │   Page Header                                │
│               │   Breadcrumb / Description                   │
│               │                                              │
│               │   ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│               │   │ CARD    │ │ CARD    │ │ CARD    │       │
│               │   └─────────┘ └─────────┘ └─────────┘       │
│               │                                              │
│               │   Tables / Forms / Charts                    │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

The application must maintain this shell consistently across authenticated pages.

---

# 4. Application Shell

The main application shell consists of:

```text
1. Sidebar

2. Top Header

3. Main Content Area

4. Page Header

5. Responsive Layout
```

The shell must not be duplicated independently inside every page.

Recommended architecture:

```text
App
│
├── PublicLayout
│   ├── Login
│   └── Forgot Password
│
└── DashboardLayout
    │
    ├── Sidebar
    ├── Header
    └── Page Content
```

---

# 5. Sidebar Design

The sidebar is the primary navigation mechanism.

It should feel:

```text
STRUCTURED

COMPACT

EASY TO SCAN

NOT VISUALLY HEAVY
```

---

## 5.1 Sidebar Content Structure

Recommended navigation:

```text
PEOPLEPAY360
────────────────────

MAIN

Dashboard

WORKFORCE

Employees
Contracts
Working Schedules
Attendance
Time Off

PAYROLL

Salary Structures
Salary Rules
Payruns
Payslips

ADMINISTRATION

Users & Roles
Company Settings
```

The actual visible items must respect RBAC permissions.

Example:

```text
HR Manager
```

may see:

```text
Employees
Contracts
Schedules
Attendance
Time Off
```

while:

```text
Payroll Manager
```

may see:

```text
Salary Structures
Salary Rules
Payruns
Payslips
```

---

## 5.2 Sidebar Behavior

The active menu item must be visually distinct.

Example:

```text
Inactive Item

Icon
Dashboard
```

Active:

```text
[Icon] Dashboard
```

with:

```text
✓ Highlighted background

✓ Accent color

✓ Stronger text

✓ Active state indicator
```

The user must immediately know:

```text
WHERE AM I?
```

---

## 5.3 Sidebar Collapse

On desktop, optionally support:

```text
EXPANDED
```

and:

```text
COLLAPSED
```

states.

Expanded:

```text
┌──────────────────┐
│ Logo             │
│                  │
│ ◉ Dashboard      │
│ ◉ Employees      │
│ ◉ Contracts      │
│ ◉ Attendance     │
└──────────────────┘
```

Collapsed:

```text
┌──────┐
│ Logo │
│      │
│  ◉   │
│  ◉   │
│  ◉   │
│  ◉   │
└──────┘
```

Tooltips should appear when hovering over collapsed navigation icons.

---

# 6. Top Header

The top header provides global controls.

Recommended structure:

```text
┌─────────────────────────────────────────────────────┐
│ Search                 🔔 Notifications   👤 Profile │
└─────────────────────────────────────────────────────┘
```

Possible components:

```text
Global Search

Notification Icon

Notification Badge

User Avatar

User Name

Role

Profile Dropdown
```

---

# 7. Page Header Pattern

Every major page should use a consistent header.

Structure:

```text
PAGE TITLE                         PRIMARY ACTION

Supporting Description             [Button]
```

Example:

```text
Employees

Manage your organization's workforce and employee records.

                                  + Add Employee
```

---

## 7.1 Standard Page Header

```text
┌──────────────────────────────────────────────────────┐
│ Employees                         [+ Add Employee]    │
│ Manage employee records and workforce information.   │
└──────────────────────────────────────────────────────┘
```

Rules:

```text
Page Title
→ Large and prominent

Description
→ Smaller muted text

Primary Action
→ Right aligned
```

---

# 8. Design Tokens

The complete application must use reusable design tokens.

Do not hardcode random values throughout components.

---

## 8.1 Color System

Use a professional enterprise palette.

### Primary Color

Used for:

```text
Primary Buttons

Active Navigation

Important Actions

Selected States

Primary Highlights
```

### Background Colors

Use separate levels:

```text
App Background

Surface Background

Card Background

Input Background
```

Recommended hierarchy:

```text
APP BACKGROUND
↓
LIGHT NEUTRAL
```

```text
CARD
↓
WHITE / SURFACE
```

---

## 8.2 Semantic Colors

The system must define:

```text
SUCCESS

WARNING

ERROR

INFO
```

Example usage:

```text
SUCCESS
→ Approved
→ Active
→ Completed

WARNING
→ Pending
→ Expiring Soon

ERROR
→ Failed
→ Rejected

INFO
→ Draft
→ Processing
```

Never use semantic colors inconsistently.

---

# 9. Typography System

Typography should establish hierarchy.

Recommended hierarchy:

```text
H1
Page Title

H2
Section Title

H3
Card Title

BODY
Normal content

SMALL
Supporting information

CAPTION
Metadata
```

Example:

```text
Employees
```

should visually dominate:

```text
Manage your organization's employee records.
```

Do not make every text element equally bold.

---

# 10. Spacing System

Use a consistent spacing scale.

Recommended conceptual scale:

```text
XS
4px

SM
8px

MD
12px

LG
16px

XL
24px

2XL
32px
```

Use spacing consistently for:

```text
Card Padding

Form Fields

Sections

Table Controls

Buttons

Modal Content
```

---

# 11. Border Radius

Use consistent rounded corners.

Recommended pattern:

```text
Small
Inputs

Medium
Cards

Large
Modals / Major Containers
```

Do not mix random radius values.

---

# 12. Shadow System

Shadows should be subtle.

Use shadows for:

```text
Floating Dropdowns

Modals

Popovers

Elevated Cards
```

Avoid excessive shadows.

The UI should feel:

```text
CLEAN
```

not:

```text
HEAVY OR FLOATING EVERYWHERE
```

---

# 13. Card Design

Cards are used extensively across PeoplePay360.

Standard card:

```text
┌─────────────────────────────────┐
│ Card Title                      │
│                                 │
│ Primary Value                   │
│                                 │
│ Supporting Information          │
└─────────────────────────────────┘
```

Cards should include:

```text
✓ Consistent Padding

✓ Consistent Border Radius

✓ Clear Visual Hierarchy

✓ Optional Icon

✓ Optional Trend / Status
```

---

# 14. Dashboard KPI Cards

Dashboard cards should visually summarize important data.

Examples:

```text
TOTAL EMPLOYEES

248
↑ 12 this month
```

```text
ACTIVE CONTRACTS

231
```

```text
PENDING LEAVE REQUESTS

18
```

```text
CURRENT PAYROLL

₹12.4L
```

Layout:

```text
┌──────────────┐
│ Total        │
│ Employees    │
│              │
│ 248          │
│              │
│ ↑ 12%        │
└──────────────┘
```

---

# 15. Data Table Design

Tables are essential for:

```text
Employees

Contracts

Attendance

Time Off

Salary Structures

Salary Rules

Payruns

Payslips
```

The table design must remain consistent everywhere.

---

## 15.1 Standard Table Structure

```text
┌────────────────────────────────────────────────────────────┐
│ Search                     Filter        Export            │
├────────────────────────────────────────────────────────────┤
│ Name        Department      Status        Action           │
├────────────────────────────────────────────────────────────┤
│ Aarav       Engineering     Active        ⋮                │
├────────────────────────────────────────────────────────────┤
│ Priya       HR              Active        ⋮                │
├────────────────────────────────────────────────────────────┤
│ Rohan       Finance         Inactive      ⋮                │
└────────────────────────────────────────────────────────────┘
```

---

## 15.2 Table Requirements

Every major data table should support where relevant:

```text
✓ Search

✓ Filtering

✓ Sorting

✓ Pagination

✓ Loading State

✓ Empty State

✓ Row Actions
```

Do not overload tables.

Actions should be placed inside:

```text
⋮
Action Menu
```

when there are multiple actions.

---

# 16. Table Row Actions

Example:

```text
⋮

View

Edit

Archive

Delete
```

Sensitive actions must require confirmation.

Example:

```text
Delete Salary Rule?
```

Use:

```text
Cancel

Delete
```

---

# 17. Status Badge Design

Statuses should use consistent badges.

Example:

```text
● Active

● Draft

● Pending

● Approved

● Completed

● Failed
```

Recommended visual pattern:

```text
Rounded Pill

Semantic Background

Semantic Text

Optional Status Dot
```

---

# 18. Form Design

Forms must be easy to scan.

Use:

```text
LABEL

INPUT

HELP TEXT

ERROR MESSAGE
```

Example:

```text
Employee Name *

[ Aarav Mehta                    ]

Enter the employee's legal full name.
```

Error:

```text
Employee Name *

[                            ]

⚠ Employee name is required.
```

---

# 19. Required Field Rules

Required fields should be clearly marked:

```text
Field Name *
```

Do not rely only on:

```text
Red Border
```

to indicate required fields.

---

# 20. Form Sectioning

Large forms must be divided into sections.

Example:

```text
CREATE EMPLOYEE

────────────────────

PERSONAL INFORMATION

First Name
Last Name
Email
Phone

────────────────────

EMPLOYMENT INFORMATION

Department
Job Title
Manager

────────────────────

SYSTEM INFORMATION

Employee ID
Status
Company
```

This prevents long unstructured forms.

---

# 21. Multi-Step Forms

Complex workflows should use a stepper.

Example:

```text
① Employee Details
        ↓
② Employment
        ↓
③ Contract
        ↓
④ Review
```

The user should know:

```text
Current Step

Completed Steps

Remaining Steps
```

---

# 22. Button System

Define consistent button variants.

```text
PRIMARY

SECONDARY

OUTLINE

GHOST

DANGER
```

---

## Primary Button

Used for the main action.

Examples:

```text
+ Add Employee

Create Payrun

Save Changes

Process Payroll
```

A page should normally have one visually dominant primary action.

---

## Secondary Button

Used for secondary actions.

Example:

```text
Cancel

Back

Preview
```

---

## Danger Button

Used only for destructive actions.

Example:

```text
Delete

Terminate Contract

Cancel Payrun
```

---

# 23. Modal Design

Use modals for focused actions.

Structure:

```text
┌────────────────────────────────────┐
│ Modal Title                     ×  │
├────────────────────────────────────┤
│                                    │
│ Content                            │
│                                    │
├────────────────────────────────────┤
│              Cancel    Confirm     │
└────────────────────────────────────┘
```

Modals should not contain unnecessarily complex full-page workflows.

For large forms, use dedicated pages or drawers.

---

# 24. Confirmation Dialogs

Critical actions require confirmation.

Examples:

```text
Archive Employee?

This employee will no longer be available for future operations.
```

```text
Cancel     Archive
```

---

# 25. Toast Notifications

Use toast notifications for action feedback.

Examples:

```text
✓ Employee created successfully.
```

```text
✓ Contract updated successfully.
```

```text
⚠ Unable to process payroll.
```

Toast messages should be:

```text
Short

Actionable

Human-readable
```

Avoid:

```text
Error Code 500
```

as the primary user-facing message.

---

# 26. Loading States

Every asynchronous operation must have a loading state.

Examples:

```text
Loading Employees...
```

Use:

```text
Skeleton Screens
```

for page content where appropriate.

Use:

```text
Button Spinner
```

for action submission.

Example:

```text
[ Processing... ⏳ ]
```

Prevent duplicate submissions while processing.

---

# 27. Empty States

Every table or collection must have an empty state.

Example:

```text
        👥

No employees found.

Add your first employee to start managing your workforce.

[ + Add Employee ]
```

Empty states should guide the user toward the next action.

---

# 28. Error States

Errors must explain:

```text
WHAT HAPPENED

WHY IT MATTERS

WHAT THE USER CAN DO
```

Bad:

```text
Error.
```

Better:

```text
Unable to create Payrun.

A Payrun already exists for this company and payroll period.
```

---

# 29. Search UX

Search fields should support:

```text
Placeholder Text

Clear Button

Debouncing

Loading Indicator
```

Example:

```text
🔍 Search employees...
```

Search should be contextual.

Employee search:

```text
Search by name, email, employee ID...
```

---

# 30. Filter UX

Filters should not clutter the page.

Recommended structure:

```text
[ Search ]

[ Filter ▾ ]

[ Sort ▾ ]

[ Export ]
```

Clicking Filter can open:

```text
Status

Department

Company

Date Range
```

depending on the module.

---

# 31. Responsive Design

The application must support:

```text
Desktop

Tablet

Mobile
```

The primary target for the hackathon demo is desktop, but responsive behavior must be considered.

---

# 32. Desktop Layout

Recommended:

```text
SIDEBAR
+
MAIN CONTENT
```

Tables can use full width.

Dashboard cards can use:

```text
4 columns
```

depending on screen width.

---

# 33. Tablet Layout

Recommended:

```text
Collapsed Sidebar

2-column KPI Grid

Scrollable Tables
```

---

# 34. Mobile Layout

Recommended:

```text
Hidden Sidebar
→ Mobile Navigation

Single Column Layout

Stacked Cards

Responsive Forms

Horizontal Table Scroll
```

Do not simply shrink the desktop UI.

---

# 35. Login Page Design

The login page is a public-facing entry point.

Structure:

```text
┌──────────────────────────────────────────────────────┐
│                                                      │
│            PEOPLEPAY360 BRANDING                     │
│                                                      │
│         Welcome Back                                 │
│         Sign in to continue                          │
│                                                      │
│         Email                                        │
│         [________________________]                   │
│                                                      │
│         Password                                     │
│         [________________________]                   │
│                                                      │
│         [        Sign In         ]                   │
│                                                      │
└──────────────────────────────────────────────────────┘
```

It should feel:

```text
Minimal

Professional

Trustworthy
```

---

# 36. Dashboard UI

The Dashboard should provide immediate business visibility.

Recommended structure:

```text
Dashboard
Welcome back, Admin

┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Employees│ │ Contracts│ │ Pending  │ │ Payroll  │
│   248    │ │   231    │ │   18     │ │ ₹12.4L   │
└──────────┘ └──────────┘ └──────────┘ └──────────┘

┌───────────────────────────┐ ┌───────────────────────┐
│ Payroll Overview Chart    │ │ Workforce Summary     │
│                           │ │                       │
└───────────────────────────┘ └───────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Recent Activity                                     │
└─────────────────────────────────────────────────────┘
```

---

# 37. Employee Module UI

The Employee List should contain:

```text
Employee Name

Employee ID

Department

Job Position

Status

Actions
```

Page:

```text
Employees                                  + Add Employee

Manage employee records.

[ Search Employees... ]  [ Filter ]

┌────────────────────────────────────────────────────────┐
│ Employee       Department       Position      Status   │
├────────────────────────────────────────────────────────┤
│ Aarav Mehta     Engineering      Developer     Active  │
│ Priya Shah      HR               HR Manager    Active  │
└────────────────────────────────────────────────────────┘
```

---

# 38. Employee Profile UI

Employee details should use:

```text
PROFILE HEADER
+
TABS
```

Example:

```text
Aarav Mehta
EMP-001
Software Engineer
● Active

[ Edit Employee ]

────────────────────────────────────

Overview | Contracts | Attendance | Time Off | Payroll
```

This creates a connected employee experience.

---

# 39. Contract Management UI

Contract list:

```text
Contracts                                  + New Contract

[ Search ] [ Status ] [ Department ]

Employee

Contract Type

Start Date

End Date

Salary Structure

Status
```

Contract details should clearly display:

```text
Employee

Employment Terms

Start / End Dates

Salary Structure

Working Schedule

Status
```

---

# 40. Working Schedule UI

Working schedules should visually communicate weekly working patterns.

Example:

```text
Standard 5-Day Week

Monday       09:00 — 18:00
Tuesday      09:00 — 18:00
Wednesday    09:00 — 18:00
Thursday     09:00 — 18:00
Friday       09:00 — 18:00

Saturday     OFF
Sunday       OFF
```

Use a clean weekly grid or schedule card.

---

# 41. Attendance UI

Attendance requires strong visual clarity.

Recommended summary cards:

```text
PRESENT TODAY

LATE TODAY

ON LEAVE

MISSING CHECK-OUT
```

Main table:

```text
Employee

Date

Check In

Check Out

Worked Hours

Status
```

---

# 42. Attendance Status Visualization

Example:

```text
● Present

● Late

● Absent

● On Leave

● Incomplete
```

Use consistent semantic status badges.

---

# 43. Time Off UI

The Time Off page should clearly separate:

```text
Leave Requests

Leave Balances

Approval Status
```

Recommended tabs:

```text
Requests

Balances

Leave Types
```

Request table:

```text
Employee

Leave Type

Start Date

End Date

Duration

Status

Actions
```

---

# 44. Leave Approval UI

Pending requests should make the decision clear.

```text
Leave Request

Employee:
Aarav Mehta

Leave Type:
Paid Leave

Duration:
3 Days

Reason:
Personal work

[ Reject ]

[ Approve ]
```

The primary decision buttons should be visually distinct.

---

# 45. Salary Structure UI

Salary Structures should visually explain payroll composition.

Example:

```text
Standard Salary Structure

──────────────────────

EARNINGS

Basic Salary

House Rent Allowance

Transport Allowance

──────────────────────

DEDUCTIONS

Unpaid Leave

Professional Tax
```

Use grouped cards or sections.

---

# 46. Salary Rule Builder UI

Salary Rules are technically complex.

The UI must simplify them.

Recommended fields:

```text
Rule Name

Rule Code

Category

Sequence

Rule Type

Amount / Percentage / Formula

Condition

Active Status
```

The page should provide:

```text
Human-readable labels

Help text

Validation

Rule preview
```

---

# 47. Salary Rule Sequence Visualization

Rules should clearly show calculation order.

Example:

```text
010  BASIC SALARY

020  HRA

030  TRANSPORT ALLOWANCE

040  GROSS

050  UNPAID LEAVE DEDUCTION

060  TOTAL DEDUCTIONS

070  NET SALARY
```

The sequence should be visible rather than hidden.

---

# 48. Payrun Wizard UI

The Payrun is one of the most important workflows.

Use a multi-step wizard.

```text
① PAYROLL PERIOD
        ↓
② EMPLOYEE SELECTION
        ↓
③ VALIDATION
        ↓
④ PROCESSING
        ↓
⑤ REVIEW
        ↓
⑥ FINALIZE
```

---

# 49. Payrun Step 1 — Payroll Period

Form:

```text
Create Payrun

Payroll Period

Start Date
[ Select Date ]

End Date
[ Select Date ]

Payroll Frequency
[ Monthly ▾ ]

                    Cancel   Continue →
```

---

# 50. Payrun Step 2 — Employee Selection

Show eligible employees.

```text
Eligible Employees

☑ Aarav Mehta
☑ Priya Shah
☑ Rohan Patel
```

Show exceptions separately:

```text
NOT ELIGIBLE

⚠ Employee X

Missing Active Contract
```

---

# 51. Payrun Step 3 — Validation

Show validation results.

```text
VALIDATION COMPLETE

✓ 120 Employees Ready

⚠ 4 Employees Require Attention
```

Exception table:

```text
Employee

Issue

Action
```

---

# 52. Payrun Step 4 — Processing

Processing UI should provide progress.

```text
Processing Payroll

██████████████░░░░

92 / 124 Employees

✓ Successful: 90

⚠ Failed: 2
```

The UI must communicate that payroll is actively processing.

---

# 53. Payrun Step 5 — Review

Show summary:

```text
PAYROLL SUMMARY

Employees Processed

124

Gross Payroll

₹9,840,000

Total Deductions

₹1,240,000

Net Payroll

₹8,600,000
```

Include employee-level results.

---

# 54. Payrun Step 6 — Finalize

Finalization should include a warning.

```text
Finalize Payroll?

Once finalized, payroll results will be locked and historical values cannot be silently changed.

[ Cancel ]

[ Finalize Payroll ]
```

---

# 55. Payrun Status UI

Use a clear lifecycle visualization:

```text
DRAFT
   ↓
PROCESSING
   ↓
COMPLETED
   ↓
FINALIZED
```

Show the current state prominently.

---

# 56. Payslip UI

Payslip details should resemble a professional salary statement.

Structure:

```text
PEOPLEPAY360

PAYSLIP

Employee Information

Employee Name
Employee ID
Department
Position

────────────────────────────

EARNINGS

Basic Salary
HRA
Allowances

────────────────────────────

DEDUCTIONS

Unpaid Leave
Tax

────────────────────────────

Gross Salary

Total Deductions

NET PAY
```

---

# 57. Payslip Financial Hierarchy

The visual hierarchy must emphasize:

```text
NET PAY
```

Example:

```text
NET PAY

₹68,450
```

This should be the strongest financial value on the Payslip page.

---

# 58. Payslip Actions

Possible actions:

```text
View

Download PDF

Send Email

Print
```

Finalized status should be visible.

---

# 59. Payroll Dashboard UI

The payroll dashboard should answer:

```text
How much are we paying?

How many employees were processed?

Are there failures?

What changed?
```

Recommended cards:

```text
TOTAL PAYROLL

TOTAL EMPLOYEES PAID

TOTAL DEDUCTIONS

AVERAGE NET SALARY
```

---

# 60. Charts

Use charts only where they add value.

Recommended:

```text
Payroll Trend

Gross vs Net

Department Payroll Distribution

Employee Growth
```

Avoid decorative charts.

Every chart should answer a business question.

---

# 61. Chart Interaction

Charts should support:

```text
Hover Tooltip

Clear Labels

Date Filters

Readable Values
```

Do not rely only on colors to explain data.

---

# 62. User Management UI

User Management should clearly distinguish:

```text
USER
```

from:

```text
EMPLOYEE
```

A user represents:

```text
LOGIN ACCESS
```

An employee represents:

```text
WORKFORCE DATA
```

User table:

```text
Name

Email

Role

Company

Status

Actions
```

---

# 63. Role Management UI

Roles should display permissions clearly.

Example:

```text
ROLE

HR Manager

────────────────────

EMPLOYEES

☑ View
☑ Create
☑ Edit
☑ Archive

PAYROLL

☑ View
☐ Create
☐ Finalize
```

Avoid showing a confusing raw permission code list to normal administrators.

---

# 64. Permission Matrix UX

Use grouped permission sections.

```text
EMPLOYEE MANAGEMENT

View      ☑
Create    ☑
Edit      ☑
Delete    ☐

PAYROLL

View      ☑
Create    ☐
Process   ☐
Finalize  ☐
```

---

# 65. Breadcrumb Navigation

Use breadcrumbs for deeper pages.

Example:

```text
Employees
/
Aarav Mehta
/
Edit
```

Breadcrumbs should not replace the page title.

---

# 66. Global UX Rules

Every page must answer:

```text
WHERE AM I?

WHAT AM I LOOKING AT?

WHAT CAN I DO NEXT?
```

The UI should make these answers obvious.

---

# 67. Accessibility Requirements

The application should support:

```text
Keyboard Navigation

Visible Focus States

Readable Contrast

Form Labels

Error Messages

Screen Reader-Friendly Semantics
```

Do not communicate important information only through color.

---

# 68. Keyboard Interaction

Important interactions should support keyboard access.

Examples:

```text
TAB
Move Focus

ENTER
Activate

ESC
Close Modal
```

---

# 69. Form Validation UX

Validation should occur at appropriate times.

Recommended:

```text
Basic Validation
→ On field interaction

Final Validation
→ On submit
```

Do not show every error before the user interacts with the form.

---

# 70. Unsaved Changes UX

For important forms:

```text
User edits data
        ↓
Attempts navigation
        ↓
Unsaved changes warning
```

Example:

```text
You have unsaved changes.

Leave without saving?

Cancel

Leave
```

---

# 71. Destructive Action UX

Destructive actions must be visually separated from normal actions.

Example:

```text
Edit Employee

Archive Employee

Delete Employee
```

Do not place:

```text
DELETE
```

next to:

```text
SAVE
```

without visual distinction.

---

# 72. Payroll-Specific UX Rules

Payroll is sensitive.

The UI must make risky actions deliberate.

Examples:

```text
Process Payroll
```

should show progress.

```text
Finalize Payroll
```

should show a confirmation.

```text
Delete Payroll
```

should normally be restricted.

---

# 73. Sensitive Data Masking

Where appropriate, sensitive information can be masked.

Example:

```text
Bank Account

•••• •••• 4821
```

Salary visibility must follow RBAC.

Unauthorized users should not see hidden salary values even if they manipulate frontend UI.

---

# 74. UI Component Architecture

Recommended reusable components:

```text
AppLayout

Sidebar

Header

PageHeader

StatCard

DataTable

SearchInput

FilterBar

StatusBadge

Button

Modal

ConfirmDialog

FormField

Select

DatePicker

Tabs

Stepper

EmptyState

ErrorState

LoadingSkeleton

Toast
```

Every module should reuse these components.

---

# 75. Component Reuse Principle

Bad:

```text
EmployeeTable

ContractTable

AttendanceTable
```

all implemented independently with different designs.

Better:

```text
Reusable DataTable
```

configured with different:

```text
Columns

Filters

Actions

Data
```

This ensures visual consistency.

---

# 76. Frontend Folder Architecture

Recommended:

```text
src/

├── components/
│   ├── layout/
│   ├── ui/
│   ├── forms/
│   └── tables/
│
├── features/
│   ├── auth/
│   ├── employees/
│   ├── contracts/
│   ├── schedules/
│   ├── attendance/
│   ├── time-off/
│   ├── salary-structures/
│   ├── salary-rules/
│   ├── payruns/
│   ├── payslips/
│   └── dashboard/
│
├── layouts/
│
├── hooks/
│
├── services/
│
├── store/
│
├── routes/
│
├── types/
│
└── utils/
```

---

# 77. Route UX Structure

Recommended routes:

```text
/login

/dashboard

/employees
/employees/new
/employees/:id
/employees/:id/edit

/contracts
/contracts/new
/contracts/:id

/schedules

/attendance

/time-off

/salary-structures
/salary-structures/:id

/salary-rules

/payruns
/payruns/new
/payruns/:id

/payslips
/payslips/:id

/users
/roles
```

Routes must be protected according to RBAC.

---

# 78. UI State Model

Every data-driven screen should handle:

```text
LOADING

SUCCESS

EMPTY

ERROR
```

Example:

```text
Employees Page

LOADING
↓
Fetch Employees
↓
SUCCESS → Show Table

OR

EMPTY → Show Empty State

OR

ERROR → Show Error State
```

---

# 79. Design Consistency Checklist

Every page should use:

```text
✓ Same Sidebar

✓ Same Header

✓ Same Page Header

✓ Same Typography

✓ Same Button Styles

✓ Same Status Badges

✓ Same Table Design

✓ Same Form Pattern

✓ Same Spacing System

✓ Same Modal Pattern
```

---

# 80. Avoid These UI Problems

Do not create:

```text
❌ Random colors per page

❌ Different button styles per module

❌ Different table styles

❌ Inconsistent spacing

❌ Excessive gradients

❌ Too many shadows

❌ Too many colors

❌ Dense unreadable forms

❌ Long unstructured pages

❌ Hidden critical actions

❌ Ambiguous status labels
```

---

# 81. Demo-Ready Screens

For the Odoo Final Hackathon, the following screens must look especially polished:

```text
1. Login

2. Dashboard

3. Employee List

4. Employee Profile

5. Contract Management

6. Attendance

7. Time Off

8. Salary Structure

9. Salary Rule Builder

10. Payrun Wizard

11. Payrun Processing

12. Payslip

13. Payroll Dashboard
```

These screens create the strongest visual impression during judging.

---

# 82. Recommended Demo Flow

The UI should support a smooth presentation flow:

```text
LOGIN
   ↓
DASHBOARD
   ↓
EMPLOYEE MANAGEMENT
   ↓
CREATE CONTRACT
   ↓
VIEW ATTENDANCE
   ↓
APPROVE TIME OFF
   ↓
CONFIGURE SALARY STRUCTURE
   ↓
VIEW SALARY RULES
   ↓
CREATE PAYRUN
   ↓
VALIDATE EMPLOYEES
   ↓
PROCESS PAYROLL
   ↓
REVIEW RESULTS
   ↓
FINALIZE
   ↓
VIEW PAYSLIP
   ↓
DOWNLOAD / EMAIL PDF
   ↓
PAYROLL DASHBOARD
```

---

# 83. Final UI/UX Implementation Rule

The frontend AI/developer must treat the application as:

```text
ONE DESIGN SYSTEM
```

not:

```text
14 DIFFERENT SCREENS
```

Every new screen must ask:

```text
Does this use the existing components?

Does this follow the existing spacing?

Does this follow the same table pattern?

Does this follow the same form pattern?

Does this follow RBAC visibility?

Does it work on desktop and smaller screens?
```

---

# 84. Final Visual Principle

PeoplePay360 must communicate:

```text
TRUST
```

because it handles:

```text
Employees

Contracts

Attendance

Leave

Salary

Payroll

Payslips
```

Therefore the visual language should be:

```text
CALM

CLEAR

PROFESSIONAL

PRECISE

CONSISTENT
```

The final product should feel like:

```text
A MODERN ENTERPRISE HR + PAYROLL PLATFORM
```

rather than:

```text
A COLLECTION OF CRUD SCREENS.
```

---

# 85. Final Master Rule

The most important UI/UX principle for PeoplePay360 is:

```text
SIMPLE FOR THE USER

POWERFUL UNDER THE HOOD
```

The user should be able to move through the complete workflow:

```text
EMPLOYEE
   ↓
CONTRACT
   ↓
SCHEDULE
   ↓
ATTENDANCE
   ↓
TIME OFF
   ↓
SALARY STRUCTURE
   ↓
PAYRUN
   ↓
PAYSLIP
```

without confusion.

The final UI must therefore combine:

```text
CONSISTENT DESIGN
+
CLEAR NAVIGATION
+
REUSABLE COMPONENTS
+
STRONG VISUAL HIERARCHY
+
BUSINESS-AWARE UX
+
RESPONSIVE DESIGN
+
ROLE-BASED EXPERIENCE
```

into one unified PeoplePay360 experience.

```text
╔══════════════════════════════════════╗
║                                      ║
║            PEOPLEPAY360              ║
║                                      ║
║      PEOPLE. PAYROLL. SIMPLIFIED.    ║
║                                      ║
╚══════════════════════════════════════╝
```

---

# END OF 14_UI_UX_DESIGN_FROM_SVG.md