# PeoplePay360 — Hackathon Demo Guide & Rehearsal Script

## 1. Demo User Accounts

| Role | Email | Password | Primary Purpose |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@peoplepay360.com` | `Password123!` | Master system administration, user roles, full dashboard. |
| **HR Manager** | `hr@peoplepay360.com` | `Password123!` | Employee directory, contracts, schedules, attendance, leaves. |
| **Payroll Manager**| `payroll@peoplepay360.com` | `Password123!` | Salary structures, rules engine, payrun wizard, payslips, PDFs. |
| **Employee** | `kabir.singh@peoplepay360.com`| `Password123!` | Self-service portal: profile, check-in, leave requests, payslips. |

---

## 2. Golden Demo Walkthrough (End-to-End Persona: Kabir Singh)

Follow this 5-minute presentation path to demonstrate cross-module integration.

```mermaid
graph LR
    A[1. Executive Dashboard] --> B[2. Employee & Contract]
    B --> C[3. Unpaid Leave Request]
    C --> D[4. HR Approval]
    D --> E[5. Payrun Wizard]
    E --> F[6. Live Salary Deduction]
    F --> G[7. Payslip PDF & Email]
```

---

### Step 1: High-Level Overview on Executive Dashboard (1 min)
1. Log in as `admin@peoplepay360.com`.
2. Highlight the **KPI Metrics**: Active Employees, Monthly Payroll Expenditure, Average Net Salary.
3. Show dynamic **Gross vs Net** charts and **Department Cost Allocation** chart.
4. Explain the core mission: Eliminating disconnected spreadsheets between HR and Payroll.

---

### Step 2: Employee Profile & Contract (1 min)
1. Navigate to **Employees** → Open **Kabir Singh** (Senior Software Engineer).
2. Show linked **Running Contract** (Base Wage: ₹70,000 / month).
3. Point out assigned **Working Schedule** (Standard 40h/week: Mon-Fri 09:00 - 18:00) and **Salary Structure** (Standard Salary Structure).

---

### Step 3: Time Off & Leave Integration (1 min)
1. Navigate to **Time Off** → **Requests**.
2. Point to an approved **Unpaid Leave Request** for Kabir Singh (e.g. 2 days unpaid leave in August).
3. Explain to the judges: *"In traditional HR systems, HR and Payroll are siloed. In PeoplePay360, this approved unpaid leave automatically triggers mathematical salary deductions during payrun computation."*

---

### Step 4: The 4-Step Payrun Wizard (1.5 min)
1. Navigate to **Payroll** → **Payruns** → Click **Create Payrun**.
2. **Step 1: Period Selection**: Select August 2026 (`2026-08-01` to `2026-08-31`). Name auto-populates as *August 2026 Payroll*.
3. **Step 2: Employee Validation**: The wizard scans all active employees and contracts, returning green validation badges.
4. **Step 3: Processing & Computation**: Click **Compute Payroll**. The salary engine evaluates rules topologically for all employees in batch.
5. Highlight Kabir Singh's calculation:
   - **Basic Wage**: ₹70,000
   - **HRA (40%)**: ₹28,000
   - **Transport Allowance**: ₹3,000
   - **Gross Salary**: ₹101,000
   - **Unpaid Leave Deduction**: `₹70,000 / 31 days * 2 days = ₹4,516.13`
   - **Net Salary**: `₹101,000 - ₹4,516.13 = ₹96,483.87`
6. **Step 4: Finalization**: Click **Finalize Payrun**. The payrun is permanently locked and historical records are preserved.

---

### Step 5: PDF Payslip Generation & Email Dispatch (30 sec)
1. Open Kabir Singh's generated Payslip.
2. Click **Download PDF** / **View PDF** to present the official corporate payslip with breakdown, tax info, and signature seal.
3. Click **Send Email** to trigger automated delivery simulation to the employee.

---

## 3. Hackathon Demo Rehearsal Checklist

- [ ] Backend server running on `http://localhost:8000` (`uvicorn app.main:app --reload`).
- [ ] Frontend running on `http://localhost:5173` (`npm run dev`).
- [ ] Database seeded with rich demo dataset (`python -m app.db.seed`).
- [ ] Browser tabs prepared (Clean tab, zoom 100%, dark/light mode as desired).
- [ ] Demo accounts tested and credentials documented.
