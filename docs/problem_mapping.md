# PeoplePay360 — Problem Statement Requirement Mapping

This document provides a direct mapping between the Odoo Hackathon 2026 Problem Statement requirements and the **PeoplePay360** implementation.

---

## 1. Requirements & Implementation Matrix

| # | Hackathon Requirement | PeoplePay360 Solution Component | Implementation Details |
| :- | :--- | :--- | :--- |
| **01** | **User Management & RBAC** | `auth_service.py`, `models/user.py`, `UsersPage.tsx` | Full JWT authentication with 4 roles (`ADMIN`, `HR_MANAGER`, `PAYROLL_MANAGER`, `EMPLOYEE`), protected frontend routes, and backend role-authorization decorators. |
| **02** | **Employee Master Directory** | `models/employee.py`, `api/v1/endpoints/employees.py`, `EmployeesPage.tsx` | Complete employee lifecycle tracking: department, job position, personal info, date of joining, status, and linked contracts. |
| **03** | **Contract Management** | `models/contract.py`, `ContractsPage.tsx`, `ContractFormPage.tsx` | Wage management, start/end dates, state machine (`DRAFT`, `RUNNING`, `EXPIRED`, `CANCELLED`), links to working schedules and salary structures. |
| **04** | **Working Schedules** | `models/working_schedule.py`, `WorkingSchedulesPage.tsx` | Weekly working days, daily shift start/end hours, break durations, and automated total weekly hours computation. |
| **05** | **Attendance Tracking** | `models/attendance.py`, `AttendancePage.tsx` | Check-in/check-out recording, worked hours calculation, late arrival detection, and half-day/absence flagging. |
| **06** | **Time Off & Leave Management** | `time_off_service.py`, `TimeOffRequestsPage.tsx`, `TimeOffAllocationsPage.tsx` | Multi-type leave (Paid, Sick, Unpaid), allocation tracking, approval/refusal workflow, and automated balance consumption. |
| **07** | **Salary Structure Configuration** | `models/salary_structure.py`, `SalaryStructuresPage.tsx` | Modular salary structure definitions with ordered execution sequence and structure cloning. |
| **08** | **Salary Rules Engine** | `salary_engine.py`, `SalaryRulesPage.tsx` | Flexible calculation engine supporting Fixed, Percentage (e.g. `HRA = 40% * BASIC`), and Python mathematical expressions. |
| **09** | **Unpaid Leave Deduction Engine** | `salary_engine.py` (Integration flow) | Automated daily wage deduction based on approved unpaid leave days during the payrun period (`Wage / Total Days * Unpaid Days`). |
| **10** | **Payrun Wizard & Batch Processing** | `payrun_service.py`, `PayrunWizardPage.tsx` | Step-by-step wizard: Period selection → Employee eligibility validation → Rule computation → Discrepancy resolution → Finalization. |
| **11** | **Payslip Computation & Review** | `models/payslip.py`, `PayslipDetailPage.tsx` | Detailed computation breakdown showing Basic, Allowances, Gross, Deductions, and Net salary. |
| **12** | **PDF Payslip Generation** | `pdf_service.py`, `ReportLab` | High-quality branded PDF generation formatted with employee details, company logo, itemized breakdown, and authorized signature. |
| **13** | **Email / Notification Dispatch** | `email_service.py`, `PayslipDetailPage.tsx` | Automated email delivery simulation with attached PDF payslips to employee mailboxes. |
| **14** | **Executive Payroll Dashboard** | `DashboardPage.tsx`, Recharts | Live KPI cards (Active Employees, Monthly Payroll, Average Net Salary), Gross vs Net salary charts, and Department cost distributions. |
| **15** | **Audit Trail & Logging** | `models/audit_log.py`, `AuditLogsPage.tsx` | Immutable audit logging for payroll finalization, leave approvals, salary updates, and user modifications. |

---

## 2. Key Competitive Differentiators

1. **True Cross-Module Integration**: Changes in time off or attendance immediately reflect in salary computations without manual data re-entry.
2. **Deterministic & Safe Rules Engine**: Custom Python formulas are evaluated in a secure sandbox preventing infinite loops or unsafe execution.
3. **State Machine Integrity**: State transitions for contracts, leaves, payruns, and payslips are strictly validated to prevent illegal operations (e.g. editing a finalized payroll).
4. **Modern Design System**: Polished UI built with responsive layout, glassmorphic accents, and accessible charts.
