Here is the complete **`README.md`** for your **PeoplePay360** Odoo Final Hackathon project, designed to match all the modules and architecture we have defined.

# PeoplePay360

> **One connected platform for People, Workforce, and Payroll Management.**

PeoplePay360 is a comprehensive **HR, workforce, and payroll management platform** designed to manage the complete employee lifecycle—from employee onboarding and contracts to attendance, time off, salary configuration, payroll processing, and payslip generation.

The core idea behind PeoplePay360 is simple:

```text
EMPLOYEE DATA
      +
WORKFORCE MANAGEMENT
      +
ATTENDANCE
      +
TIME OFF
      +
CONFIGURABLE PAYROLL
      =
PEOPLEPAY360
```

---

# 🚀 Project Overview

Organizations often manage employee information, contracts, attendance, leave, and payroll across disconnected systems or spreadsheets.

This creates problems such as:

* Duplicate employee data
* Manual payroll calculations
* Attendance and leave data not connected to payroll
* Payroll configuration complexity
* Calculation errors
* Lack of transparency
* Difficult employee lifecycle management

**PeoplePay360 solves this problem by connecting all workforce and payroll operations into one integrated platform.**

The system creates a continuous business flow:

```text
USER & ACCESS MANAGEMENT
        ↓
EMPLOYEE MANAGEMENT
        ↓
CONTRACT MANAGEMENT
        ↓
WORKING SCHEDULE
        ↓
ATTENDANCE
        ↓
TIME OFF
        ↓
SALARY STRUCTURES
        ↓
SALARY RULES ENGINE
        ↓
PAYRUN
        ↓
PAYSLIP
        ↓
PDF / EMAIL
```

---

# 🎯 Problem Statement

PeoplePay360 is built to provide an integrated solution for managing:

* Users and role-based access
* Employee records
* Employment contracts
* Working schedules
* Attendance
* Time off and leave
* Salary structures
* Configurable salary rules
* Payroll processing
* Payslips
* Payroll analytics and dashboards

The platform ensures that workforce data flows into payroll instead of requiring manual data entry across multiple systems.

---

# ✨ Key Features

## 🔐 Authentication & Role-Based Access Control

Secure authentication and permission-based access.

Supported roles include:

* Super Admin
* HR Manager
* Payroll Manager
* Employee

Key capabilities:

* Secure login
* Protected routes
* Role-based navigation
* Permission-based access
* User management
* Role assignment
* User activation and deactivation

---

## 👥 Employee Master

A centralized employee management system.

Manage:

* Employee ID
* Personal information
* Contact information
* Department
* Job position
* Employment status
* Joining date
* Employee profile

Key capabilities:

```text
CREATE
READ
UPDATE
SEARCH
FILTER
MANAGE
```

employee records from one location.

---

## 📄 Contract Management

Manage the employment relationship between employees and the organization.

Each contract can define:

* Employee
* Contract type
* Start date
* End date
* Working schedule
* Salary structure
* Salary amount
* Contract status

Contract lifecycle:

```text
DRAFT
  ↓
ACTIVE
  ↓
EXPIRED / TERMINATED
```

Only eligible employees with valid configurations should proceed into payroll processing.

---

## 🗓️ Working Schedules

Configure employee working schedules.

Supported configuration:

* Working days
* Start time
* End time
* Break duration
* Weekly working hours

Example:

```text
Monday – Friday

09:00 AM – 06:00 PM

Break: 1 Hour

Weekly Hours: 40
```

Working schedules provide the foundation for attendance and workforce management.

---

## ⏱️ Attendance Management

Track employee working activity.

Supported features:

* Check-in
* Check-out
* Worked hours calculation
* Attendance status
* Late arrival detection
* Attendance history

Possible statuses:

```text
PRESENT
LATE
ABSENT
ON LEAVE
INCOMPLETE
```

Attendance data integrates with employee schedules and approved leave.

---

## 🌴 Time Off Management

Manage employee leave requests.

Supported features:

* Create leave request
* Select leave type
* Select date range
* Calculate duration
* Submit request
* Approve request
* Reject request
* Cancel request

Leave workflow:

```text
DRAFT
  ↓
PENDING
  ↓
APPROVED
     OR
REJECTED
```

Time off integrates with:

* Attendance
* Employee records
* Payroll

Especially for:

```text
APPROVED UNPAID LEAVE
        ↓
PAYROLL DEDUCTION
```

---

# 💰 Salary Structures

Salary Structures define how an employee's compensation is organized.

A structure contains multiple salary rules.

Example:

```text
CTC / SALARY STRUCTURE

├── BASIC
├── HRA
├── TRANSPORT ALLOWANCE
├── SPECIAL ALLOWANCE
├── BONUS
├── GROSS SALARY
├── DEDUCTIONS
└── NET SALARY
```

Salary structures can be assigned to employee contracts.

---

# ⚙️ Configurable Salary Rules Engine

The Salary Rules Engine is one of the core features of PeoplePay360.

Instead of hardcoding payroll calculations, salary components are configured as rules.

Supported rule types include:

### Fixed Amount

```text
TRANSPORT = ₹3,000
```

### Percentage-Based

```text
HRA = 40% × BASIC
```

### Formula-Based

Rules can calculate values based on other salary components.

Example:

```text
GROSS
=
BASIC
+
HRA
+
TRANSPORT
+
SPECIAL ALLOWANCE
```

---

## Rule Execution Sequence

Rules execute in a defined order.

Example:

```text
010 BASIC

↓

020 HRA

↓

030 TRANSPORT

↓

040 SPECIAL ALLOWANCE

↓

060 BONUS

↓

070 GROSS

↓

080 UNPAID LEAVE DEDUCTION

↓

100 TOTAL DEDUCTIONS

↓

110 NET SALARY
```

This ensures that dependent rules are calculated correctly.

---

# 🧮 Payroll Calculation

The payroll engine calculates:

```text
EARNINGS
      +
ALLOWANCES
      +
BONUSES
      -
DEDUCTIONS
      =
NET SALARY
```

Example:

```text
BASIC SALARY              ₹70,000

HRA                       ₹28,000

TRANSPORT ALLOWANCE        ₹3,000

SPECIAL ALLOWANCE         ₹14,000

--------------------------------

GROSS SALARY             ₹115,000

UNPAID LEAVE DEDUCTION    ₹7,667

--------------------------------

NET SALARY               ₹107,333
```

---

# 🏃 Payrun Management

A Payrun represents payroll processing for a specific period.

Example:

```text
AUGUST 2026 PAYRUN
```

The Payrun process follows a controlled workflow:

```text
STEP 1
CREATE PAYRUN

↓

STEP 2
SELECT PAYROLL PERIOD

↓

STEP 3
VALIDATE EMPLOYEES

↓

STEP 4
IDENTIFY ISSUES

↓

STEP 5
PROCESS PAYROLL

↓

STEP 6
GENERATE PAYSLIPS

↓

STEP 7
REVIEW RESULTS

↓

STEP 8
FINALIZE PAYRUN
```

---

## Employee Eligibility Validation

Before payroll processing, the system validates employees.

An employee should have:

```text
✓ ACTIVE STATUS

✓ ACTIVE CONTRACT

✓ WORKING SCHEDULE

✓ SALARY STRUCTURE
```

Employees with missing configurations are flagged.

Example:

```text
✓ 20 READY

⚠ 3 NEED ATTENTION
```

---

# 📑 Payslip Management

Once payroll is processed, the system generates detailed payslips.

Each payslip contains:

* Employee information
* Payroll period
* Salary components
* Earnings
* Allowances
* Deductions
* Gross salary
* Total deductions
* Net salary

Example:

```text
EMPLOYEE PAYSLIP

Employee: Kabir Singh
Period: August 2026

--------------------------------

EARNINGS

Basic Salary        ₹70,000
HRA                 ₹28,000
Transport            ₹3,000
Special Allowance   ₹14,000

--------------------------------

Gross Salary       ₹115,000

DEDUCTIONS

Unpaid Leave        ₹7,667

--------------------------------

NET SALARY         ₹107,333
```

---

# 📄 Payslip PDF Generation

Payslips can be generated as professional PDF documents.

PDF output includes:

* Company information
* Employee details
* Payroll period
* Earnings
* Deductions
* Gross salary
* Net salary

The PDF is designed to be:

```text
PROFESSIONAL

READABLE

PRINT-READY

EMPLOYEE-FRIENDLY
```

---

# 📧 Payslip Email

PeoplePay360 supports payslip distribution through email.

Workflow:

```text
PAYROLL PROCESSED

↓

PAYSLIP GENERATED

↓

PDF GENERATED

↓

EMAIL PREPARED

↓

PAYSLIP SENT / QUEUED
```

For demo environments, email delivery may be simulated when real email infrastructure is unavailable.

---

# 📊 Payroll Dashboard

The dashboard provides a high-level view of workforce and payroll information.

Dashboard insights include:

* Total employees
* Active contracts
* Pending leave requests
* Payroll summary
* Gross payroll
* Net payroll
* Payroll trends
* Department distribution
* Recent activity

The goal is to provide quick visibility into organizational operations.

---

# 🏗️ System Architecture

PeoplePay360 follows a modular architecture.

```text
┌─────────────────────────────────────────┐
│                 FRONTEND                │
│                                         │
│  Dashboard │ HR │ Workforce │ Payroll   │
└────────────────────┬────────────────────┘
                     │
                     │ API
                     ↓
┌─────────────────────────────────────────┐
│                 BACKEND                 │
│                                         │
│ Authentication                          │
│ RBAC                                    │
│ Employee Management                     │
│ Contract Management                     │
│ Attendance                              │
│ Time Off                                │
│ Payroll Engine                          │
│ Payslip Management                      │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│                DATABASE                 │
│                                         │
│ Users                                   │
│ Employees                               │
│ Contracts                               │
│ Attendance                              │
│ Leave                                   │
│ Salary Structures                       │
│ Salary Rules                            │
│ Payruns                                 │
│ Payslips                                │
└─────────────────────────────────────────┘
```

---

# 🔄 Core Business Workflow

The complete PeoplePay360 workflow is:

```text
1. CREATE USER
        ↓
2. CREATE EMPLOYEE
        ↓
3. CREATE CONTRACT
        ↓
4. ASSIGN WORKING SCHEDULE
        ↓
5. ASSIGN SALARY STRUCTURE
        ↓
6. RECORD ATTENDANCE
        ↓
7. REQUEST / APPROVE TIME OFF
        ↓
8. CREATE PAYRUN
        ↓
9. VALIDATE EMPLOYEES
        ↓
10. PROCESS PAYROLL
        ↓
11. EXECUTE SALARY RULES
        ↓
12. APPLY DEDUCTIONS
        ↓
13. GENERATE PAYSLIP
        ↓
14. GENERATE PDF
        ↓
15. EMAIL / QUEUE PAYSLIP
        ↓
16. FINALIZE PAYRUN
```

---

# 🛠️ Technology Stack

The project is designed using a modern full-stack architecture.

## Frontend

```text
React

TypeScript

Tailwind CSS

Component-based UI Architecture
```

Responsibilities:

* User interface
* Dashboard
* Forms
* Tables
* Payroll workflows
* Role-based navigation

---

## Backend

```text
Node.js

Express.js

TypeScript
```

Responsibilities:

* REST APIs
* Authentication
* Authorization
* Business logic
* Payroll calculations
* Salary rule execution

---

## Database

```text
PostgreSQL
```

Responsibilities:

* Persistent storage
* Employee data
* Contracts
* Attendance
* Leave
* Payroll records
* Payslips

---

## Authentication

```text
JWT

Role-Based Access Control (RBAC)
```

---

## PDF Generation

A backend PDF generation solution is used for:

```text
PAYSLIP GENERATION
```

---

# 📁 Project Structure

```text
PeoplePay360/

├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── types/
│   │   └── utils/
│   │
│   └── package.json
│
├── backend/
│   │
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── employees/
│   │   │   ├── contracts/
│   │   │   ├── schedules/
│   │   │   ├── attendance/
│   │   │   ├── timeoff/
│   │   │   ├── salary-structures/
│   │   │   ├── salary-rules/
│   │   │   ├── payroll/
│   │   │   ├── payslips/
│   │   │   └── dashboard/
│   │   │
│   │   ├── middleware/
│   │   ├── services/
│   │   ├── utils/
│   │   └── config/
│   │
│   └── package.json
│
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema/
│
├── docs/
│   ├── 00_MASTER.md
│   ├── 01_LOGIN_RBAC_USER_MANAGEMENT.md
│   ├── 02_EMPLOYEE_MASTER.md
│   ├── 03_CONTRACT_MANAGEMENT.md
│   ├── 04_WORKING_SCHEDULES.md
│   ├── 05_ATTENDANCE.md
│   ├── 06_TIME_OFF.md
│   ├── 07_SALARY_STRUCTURES.md
│   ├── 08_SALARY_RULES_ENGINE.md
│   ├── 09_PAYRUN_WIZARD_PROCESSING.md
│   ├── 10_PAYSLIP_COMPUTATION.md
│   ├── 11_PAYSLIP_PDF_EMAIL.md
│   ├── 12_PAYROLL_DASHBOARD.md
│   ├── 13_INTEGRATION_BUSINESS_RULES.md
│   ├── 14_UI_UX_DESIGN_FROM_SVG.md
│   ├── 15_SEED_DATA_DEMO_FLOW.md
│   └── 16_TESTING_DELIVERABLES_CHECKLIST.md
│
├── README.md
│
└── .env.example
```

---

# ⚙️ Installation & Setup

## Prerequisites

Make sure you have installed:

```text
Node.js
PostgreSQL
npm or pnpm
Git
```

---

# 1. Clone the Repository

```bash
git clone <repository-url>

cd PeoplePay360
```

---

# 2. Configure Environment Variables

Create environment files based on:

```text
.env.example
```

Example:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/peoplepay360

# Authentication
JWT_SECRET=your_secure_secret

# Application
PORT=5000
APP_URL=http://localhost:3000

# Email
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=
```

> ⚠️ Never commit your real `.env` file or secrets to the repository.

---

# 3. Install Backend Dependencies

```bash
cd backend

npm install
```

---

# 4. Configure the Database

Create the PostgreSQL database:

```text
peoplepay360
```

Configure the correct database connection in your environment file.

---

# 5. Run Database Migrations

```bash
npm run migrate
```

---

# 6. Seed Demo Data

```bash
npm run seed
```

This creates the demo environment required for the application.

Seed data includes:

```text
Users

Departments

Employees

Contracts

Working Schedules

Attendance Records

Time Off Requests

Salary Structures

Salary Rules

Payruns

Payslips
```

---

# 7. Start the Backend

```bash
npm run dev
```

Expected backend:

```text
http://localhost:5000
```

---

# 8. Install Frontend Dependencies

Open a new terminal:

```bash
cd frontend

npm install
```

---

# 9. Start the Frontend

```bash
npm run dev
```

Expected frontend:

```text
http://localhost:3000
```

---

# 🔐 Demo Credentials

Use the seeded demo accounts.

> Replace these credentials with the actual credentials configured in your seed data.

| Role            | Email                                                         | Password      |
| --------------- | ------------------------------------------------------------- | ------------- |
| Super Admin     | [admin@peoplepay360.com](mailto:admin@peoplepay360.com)       | Demo Password |
| HR Manager      | [hr@peoplepay360.com](mailto:hr@peoplepay360.com)             | Demo Password |
| Payroll Manager | [payroll@peoplepay360.com](mailto:payroll@peoplepay360.com)   | Demo Password |
| Employee        | [employee@peoplepay360.com](mailto:employee@peoplepay360.com) | Demo Password |

---

# 👥 Role-Based Access

## Super Admin

Full system access.

```text
Dashboard

Users

Roles

Employees

Contracts

Working Schedules

Attendance

Time Off

Salary Structures

Salary Rules

Payruns

Payslips

Analytics
```

---

## HR Manager

Responsible for workforce operations.

```text
Employees

Contracts

Working Schedules

Attendance

Time Off
```

---

## Payroll Manager

Responsible for payroll operations.

```text
Salary Structures

Salary Rules

Payruns

Payslips
```

---

## Employee

Employee Self-Service access.

```text
Profile

Attendance

Time Off

Payslips
```

---

# 🧮 Payroll Calculation Example

Example employee:

```text
Employee: Kabir Singh

Monthly Basic Salary: ₹70,000
```

Salary configuration:

```text
Basic Salary

₹70,000


HRA

40% of Basic

₹28,000


Transport Allowance

₹3,000


Special Allowance

₹14,000
```

Calculation:

```text
GROSS SALARY

70,000
+
28,000
+
3,000
+
14,000

=

₹115,000
```

Assume unpaid leave deduction:

```text
₹7,667
```

Final payroll:

```text
NET SALARY

₹115,000

-

₹7,667

=

₹107,333
```

---

# 🧪 Testing

PeoplePay360 is tested at three levels:

```text
LEVEL 1

Individual Feature Testing

↓

LEVEL 2

Module Integration Testing

↓

LEVEL 3

End-to-End Business Flow Testing
```

Critical test areas include:

* Authentication
* RBAC
* Employee management
* Contract validation
* Attendance
* Time off
* Salary calculations
* Payroll processing
* Payslip generation
* PDF generation
* Integration workflows

For the complete testing checklist, see:

```text
docs/16_TESTING_DELIVERABLES_CHECKLIST.md
```

---

# 🎬 Demo Flow

The recommended hackathon demonstration follows this flow:

```text
LOGIN

↓

DASHBOARD

↓

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

CREATE PAYRUN

↓

VALIDATE EMPLOYEES

↓

PROCESS PAYROLL

↓

GENERATE PAYSLIP

↓

GENERATE PDF

↓

FINALIZE PAYRUN
```

---

# 🎯 Core Demo Scenario

The primary demonstration scenario should show a connected employee lifecycle.

```text
KABIR SINGH
```

Workflow:

```text
EMPLOYEE CREATED

↓

ACTIVE CONTRACT

↓

WORKING SCHEDULE ASSIGNED

↓

SALARY STRUCTURE ASSIGNED

↓

ATTENDANCE RECORDED

↓

UNPAID LEAVE APPROVED

↓

PAYRUN CREATED

↓

PAYROLL PROCESSED

↓

UNPAID LEAVE DEDUCTION APPLIED

↓

PAYSLIP GENERATED

↓

PDF GENERATED
```

This demonstrates the core value of PeoplePay360:

> **Workforce data directly drives payroll.**

---

# 🔌 Major API Modules

The backend is organized around the following API domains:

```text
/auth

/users

/employees

/contracts

/schedules

/attendance

/time-off

/salary-structures

/salary-rules

/payruns

/payslips

/dashboard
```

Each API module should implement:

```text
Authentication

Authorization

Validation

Business Logic

Error Handling
```

---

# 🔒 Security

PeoplePay360 implements basic application security practices appropriate for the hackathon scope.

Key considerations:

* Password protection
* JWT authentication
* Role-based authorization
* Protected routes
* Backend permission validation
* Secure environment variables
* Restricted payroll access

Sensitive information such as:

```text
JWT Secrets

Database Credentials

Email Passwords

API Keys
```

must never be committed to the repository.

---

# 🎨 UI/UX Design Principles

PeoplePay360 follows a consistent product design system.

Key principles:

```text
CLEAN

MODERN

PROFESSIONAL

CONSISTENT

DATA-DRIVEN
```

The UI should provide:

* Clear navigation
* Consistent sidebar
* Clear page hierarchy
* Reusable cards
* Professional tables
* Structured forms
* Meaningful status badges
* Helpful empty states
* Clear validation messages
* Loading states

The design direction follows the approved SVG reference and the UI/UX specification documented in:

```text
docs/14_UI_UX_DESIGN_FROM_SVG.md
```

---

# 📚 Documentation

Detailed implementation specifications are available in the `/docs` directory.

| Document                               | Description                                            |
| -------------------------------------- | ------------------------------------------------------ |
| `00_MASTER.md`                         | Complete project architecture and master specification |
| `01_LOGIN_RBAC_USER_MANAGEMENT.md`     | Authentication, users, roles, and permissions          |
| `02_EMPLOYEE_MASTER.md`                | Employee management                                    |
| `03_CONTRACT_MANAGEMENT.md`            | Employment contracts                                   |
| `04_WORKING_SCHEDULES.md`              | Working schedules                                      |
| `05_ATTENDANCE.md`                     | Attendance management                                  |
| `06_TIME_OFF.md`                       | Leave and time off                                     |
| `07_SALARY_STRUCTURES.md`              | Salary structure configuration                         |
| `08_SALARY_RULES_ENGINE.md`            | Configurable payroll calculation engine                |
| `09_PAYRUN_WIZARD_PROCESSING.md`       | Payrun workflow and processing                         |
| `10_PAYSLIP_COMPUTATION.md`            | Payslip calculation                                    |
| `11_PAYSLIP_PDF_EMAIL.md`              | PDF generation and payslip distribution                |
| `12_PAYROLL_DASHBOARD.md`              | Dashboard and analytics                                |
| `13_INTEGRATION_BUSINESS_RULES.md`     | Cross-module integrations and business rules           |
| `14_UI_UX_DESIGN_FROM_SVG.md`          | UI/UX design system                                    |
| `15_SEED_DATA_DEMO_FLOW.md`            | Demo data and hackathon demonstration flow             |
| `16_TESTING_DELIVERABLES_CHECKLIST.md` | Testing and submission checklist                       |

---

# 🧠 Design Philosophy

PeoplePay360 is not designed as a collection of independent screens.

It is designed as:

```text
ONE CONNECTED PRODUCT
```

Every major module contributes to the same business flow:

```text
EMPLOYEE

↓

CONTRACT

↓

WORKFORCE DATA

↓

PAYROLL CONFIGURATION

↓

PAYROLL PROCESSING

↓

PAYSLIP
```

This integration is the core strength of the project.

---

# 🏆 Hackathon Goals

The PeoplePay360 project aims to demonstrate:

```text
✓ Complete problem understanding

✓ Strong system architecture

✓ Integrated business workflows

✓ Configurable payroll logic

✓ Clean UI/UX

✓ Accurate calculations

✓ Role-based security

✓ Professional documentation

✓ Realistic demo data

✓ End-to-end functionality
```

---

# 🚧 Future Scope

Possible future enhancements include:

* Employee self-service portal expansion
* Advanced leave policies
* Multiple company support
* Multi-country payroll support
* Tax calculation engines
* Bank payment integration
* Biometric attendance integration
* Mobile application
* Advanced analytics
* AI-powered payroll anomaly detection
* Automated compliance checks
* Notification system
* Approval workflows

---

# 🤝 Team

**PeoplePay360**

Built for the **Odoo Final Hackathon**.

Add team member details here:

```text
Name — Role

Name — Role

Name — Role

Name — Role
```

---

# 📦 Final Deliverables

The final submission includes:

```text
✓ Source Code

✓ README

✓ Setup Instructions

✓ Environment Configuration

✓ Database Schema

✓ Migration Files

✓ Seed Data

✓ API Documentation

✓ Demo Credentials

✓ Testing Checklist

✓ Architecture Documentation

✓ Problem Requirement Mapping

✓ Hackathon Presentation
```

---

# ✅ Definition of Done

PeoplePay360 is complete when:

```text
✓ Users can authenticate

✓ Roles control access

✓ Employees can be managed

✓ Contracts can be configured

✓ Working schedules can be assigned

✓ Attendance can be recorded

✓ Time off can be requested and approved

✓ Salary structures can be configured

✓ Salary rules calculate payroll

✓ Payruns validate employees

✓ Payroll can be processed

✓ Payslips are generated

✓ PDF payslips are generated

✓ Payroll dashboard displays meaningful insights

✓ Demo data supports the complete workflow

✓ The complete end-to-end flow works successfully
```

---

# ⭐ The PeoplePay360 Vision

```text
DON'T BUILD

A COLLECTION OF SCREENS.


BUILD

A CONNECTED PRODUCT.
```

PeoplePay360 brings together:

```text
PEOPLE

+

WORKFORCE

+

PAYROLL

=

PEOPLEPAY360
```

---

**Built with ❤️ for the Odoo Final Hackathon.**