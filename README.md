# PeoplePay360

> **An integrated HR, Workforce, and Payroll Management platform built to connect employee lifecycle data with accurate, transparent payroll processing.**

[![Python Tests](https://img.shields.io/badge/Backend%20Tests-145%20Passing-brightgreen.svg)](docs/testing.md)
[![TypeScript Build](https://img.shields.io/badge/Frontend%20Build-Passing-brightgreen.svg)](frontend)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.12-blue.svg)](backend)
[![React](https://img.shields.io/badge/Frontend-React%2019%20%7C%20Vite%208-61dafb.svg)](frontend)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38b2ac.svg)](frontend)

---

## 1. Problem Statement & Solution

Traditional enterprise operations suffer from a massive disconnect between **HR management** (attendance, working schedules, leave requests) and **payroll processing**. Payroll managers routinely spend days cross-referencing messy spreadsheets and manual calculations to compute deductions, resulting in delayed pay disbursements, calculation errors, and employee dissatisfaction.

**PeoplePay360** eliminates this divide with a unified, cross-connected architecture:
- **Real-Time Integration**: Employee attendance anomalies and approved unpaid leaves automatically flow into the salary calculation engine.
- **Topological Salary Rules Engine**: Highly customizable salary rules (Fixed, Percentage, Custom Expressions) evaluated deterministically by sequence.
- **Payrun Wizard**: 4-step guided payroll workflow with automated pre-computation eligibility checks and validation warnings.
- **Enterprise Payslips**: One-click branded PDF generation and simulated employee email delivery.

---

## 2. Key Features

```text
├── 🔐 Role-Based Access Control (Admin, HR Manager, Payroll Manager, Employee)
├── 👥 Employee Master Directory & Organizational Hierarchy
├── 📄 Contract Management with Wage Structuring & State Machines
├── ⏰ Working Schedules & Shift Template Configurator
├── 📍 Attendance Tracking & Check-In/Check-Out with Anomaly Detection
├── 🏖️ Time Off & Leave Management with Balance Consumption & Approvals
├── ⚙️ Modular Salary Structures & Topological Calculation Engine
├── 🧙 Payrun Wizard with Batch Validation, Computation & Finalization
├── 📑 Branded PDF Payslip Generation & Automated Email Dispatch
├── 📊 Executive Payroll Analytics & Recharts Data Visualizations
└── 🛡️ Comprehensive Audit Logging for Compliance & Governance
```

---

## 3. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide React, Recharts, React Router v7 |
| **Backend** | Python 3.12+, FastAPI, SQLAlchemy ORM, Pydantic v2, ReportLab, PyJWT |
| **Database** | SQLite (zero-configuration demo) / PostgreSQL compatible |
| **Testing** | Pytest (145 automated test cases across 13 test suites), Oxlint, TypeScript strict mode |

---

## 4. Quick Start & Setup Instructions

### Prerequisites
- **Python 3.12+** installed
- **Node.js 20+** and `npm` installed

### Step 1: Clone Repository
```bash
git clone https://github.com/Pranjal-1307/odoo-2026-final.git
cd odoo-2026-final
```

### Step 2: Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
```

### Step 3: Database & Seed Data
Initialize the database and populate it with rich demonstration data:
```bash
python -m app.db.seed
```

### Step 4: Start Backend Server
```bash
uvicorn app.main:app --reload --port 8000
```
Backend API will be live at: `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).

### Step 5: Frontend Setup & Start
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend application will be live at: `http://localhost:5173`.

---

## 5. Demo User Credentials

| Role | Email | Password | Access Highlights |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@peoplepay360.com` | `Password123!` | Complete access to all modules, users, and settings |
| **HR Manager** | `hr@peoplepay360.com` | `Password123!` | Employees, contracts, working schedules, attendance, leaves |
| **Payroll Manager** | `payroll@peoplepay360.com` | `Password123!` | Salary structures, rules engine, payruns, payslips, PDFs |
| **Employee** | `kabir.singh@peoplepay360.com` | `Password123!` | Self-service profile, attendance check-in, leave requests, payslips |

---

## 6. Running Automated Tests

Run the complete test suite (145 tests):
```bash
cd backend
pytest
```

Run frontend build verification:
```bash
cd frontend
npm run build
npm run lint
```

---

## 7. Documentation & Deliverables Index

Detailed project documentation is available in the [`docs/`](docs) directory:
- [System Architecture & ER Diagram](docs/architecture.md)
- [REST API Reference](docs/api.md)
- [Problem Statement Requirement Mapping](docs/problem_mapping.md)
- [QA Testing & Verification Report](docs/testing.md)
- [Hackathon Demo Guide & Persona Script](docs/demo_guide.md)

---

## 8. License & Acknowledgements

Built for the **Odoo Hackathon 2026**.
Developed with pride by Team PeoplePay360.
