# PeoplePay360 — REST API Reference

Base URL: `http://localhost:8000/api/v1`

All protected endpoints require an `Authorization` header with the Bearer token:
```http
Authorization: Bearer <jwt_access_token>
```

---

## 1. Authentication & Users

### `POST /auth/login`
- **Description**: Authenticate user with email and password to receive JWT token.
- **Request Body**:
  ```json
  {
    "email": "admin@peoplepay360.com",
    "password": "Password123!"
  }
  ```
- **Response**: `200 OK`
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "token_type": "bearer",
    "user": {
      "id": 1,
      "email": "admin@peoplepay360.com",
      "full_name": "System Admin",
      "role": "ADMIN"
    }
  }
  ```

### `GET /auth/me`
- **Description**: Get details of currently authenticated user.
- **Response**: `200 OK`

### `GET /users`
- **Description**: List all system users with role filtering and search.
- **Access**: `ADMIN`

### `POST /users`
- **Description**: Create new system user and assign role.
- **Access**: `ADMIN`

---

## 2. Employee Master Directory

### `GET /employees`
- **Parameters**: `department_id`, `status`, `search`, `page`, `page_size`
- **Response**: `200 OK` (Array of employee objects with department and position)

### `POST /employees`
- **Description**: Register a new employee in the company.
- **Access**: `ADMIN`, `HR_MANAGER`
- **Request Body**:
  ```json
  {
    "first_name": "Kabir",
    "last_name": "Singh",
    "email": "kabir.singh@peoplepay360.com",
    "phone": "+91 98765 43210",
    "department_id": 2,
    "job_position_id": 3,
    "date_of_joining": "2024-01-15",
    "status": "ACTIVE"
  }
  ```

### `GET /employees/{id}`
- **Description**: Get single employee details with active contract, allocations, and attendances.

### `PUT /employees/{id}`
- **Description**: Update employee details.

---

## 3. Contract Management

### `GET /contracts`
- **Parameters**: `employee_id`, `status`
- **Response**: `200 OK`

### `POST /contracts`
- **Description**: Create contract linking employee to working schedule and salary structure.
- **Request Body**:
  ```json
  {
    "employee_id": 1,
    "name": "Kabir Singh - Senior Software Engineer Contract",
    "wage": 70000.0,
    "start_date": "2024-01-15",
    "working_schedule_id": 1,
    "salary_structure_id": 1,
    "status": "RUNNING"
  }
  ```

---

## 4. Working Schedules

### `GET /working-schedules`
- **Description**: Retrieve standard 40h/week, 35h/week, or customized shift templates.

### `POST /working-schedules`
- **Description**: Create custom working schedule with shift hours and working days.

---

## 5. Attendance & Time Tracking

### `POST /attendance/check-in`
- **Description**: Record check-in timestamp for an employee.

### `POST /attendance/check-out`
- **Description**: Record check-out timestamp; auto-calculates worked hours and overtime.

### `GET /attendance`
- **Parameters**: `employee_id`, `start_date`, `end_date`, `status`

---

## 6. Time Off & Leave Management

### `GET /time-off/types`
- **Description**: List leave types (Paid Leave, Sick Leave, Unpaid Leave).

### `GET /time-off/allocations`
- **Description**: List leave balances allocated to employees.

### `POST /time-off/requests`
- **Description**: Submit a new time off / leave request.
- **Request Body**:
  ```json
  {
    "employee_id": 1,
    "time_off_type_id": 3,
    "start_date": "2026-08-10",
    "end_date": "2026-08-12",
    "reason": "Personal unpaid leave"
  }
  ```

### `POST /time-off/requests/{id}/approve`
- **Description**: Approve pending leave request. Updates employee status and payroll deductions.
- **Access**: `ADMIN`, `HR_MANAGER`

### `POST /time-off/requests/{id}/refuse`
- **Description**: Reject leave request.

---

## 7. Salary Structures & Rules Engine

### `GET /salary-structures`
- **Description**: List all salary structures with child salary rules.

### `POST /salary-structures`
- **Description**: Create salary structure (e.g. "Standard Regular Salary Structure").

### `POST /salary-rules`
- **Description**: Define computational rule.
- **Request Body**:
  ```json
  {
    "name": "House Rent Allowance",
    "code": "HRA",
    "category": "ALLOWANCE",
    "sequence": 20,
    "condition_type": "ALWAYS_TRUE",
    "amount_type": "PERCENTAGE",
    "percentage": 40.0,
    "percentage_base_code": "BASIC",
    "salary_structure_id": 1
  }
  ```

---

## 8. Payrun Wizard & Processing

### `POST /payruns`
- **Description**: Create new monthly payrun.
- **Request Body**:
  ```json
  {
    "name": "August 2026 Payroll",
    "start_date": "2026-08-01",
    "end_date": "2026-08-31"
  }
  ```

### `POST /payruns/{id}/validate`
- **Description**: Validate all active employees, contracts, schedules, and salary structures for payrun period.

### `POST /payruns/{id}/compute`
- **Description**: Execute salary rules engine in batch across all eligible employees and generate draft payslips.

### `POST /payruns/{id}/finalize`
- **Description**: Lock payrun and mark all payslips as `DONE`.

---

## 9. Payslips, PDF & Email

### `GET /payslips`
- **Parameters**: `payrun_id`, `employee_id`, `status`

### `GET /payslips/{id}`
- **Description**: Retrieve detailed breakdown of gross, net, deductions, and line items.

### `GET /payslips/{id}/pdf`
- **Description**: Stream generated PDF payslip for preview or download.

### `POST /payslips/{id}/send-email`
- **Description**: Send or simulate email dispatch with PDF attachment to the employee.

---

## 10. Dashboard & Analytics

### `GET /dashboard/kpis`
- **Description**: High-level corporate overview metrics:
  - Total active employees
  - Total active contracts
  - Total monthly payroll expenditure
  - Average net salary
  - Pending leave requests

### `GET /dashboard/charts`
- **Description**: Chart data for Gross vs Net trends, Department-wise salary distribution, and recent activity audit logs.
