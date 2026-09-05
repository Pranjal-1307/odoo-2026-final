Absolutely. Below is the complete **`01_LOGIN_RBAC_USER_MANAGEMENT.md`** file, designed to be given directly to an AI coding agent.

It follows the PeoplePay360 requirements and keeps the implementation aligned with the Odoo-style UX/design reference.

````markdown
# 01_LOGIN_RBAC_USER_MANAGEMENT.md

# PeoplePay360 — Login, RBAC & User Management

## 1. Module Overview

This module implements authentication, authorization, role-based access control (RBAC), user management, and protected application access for PeoplePay360.

The goal is to ensure that:

- Only authenticated users can access PeoplePay360.
- Every user has a defined role.
- Users can only perform actions allowed by their role.
- Users cannot elevate their own permissions.
- HR users can access HR functionality according to their role.
- Payroll users can access payroll functionality according to their role.
- Admin users have full system access.
- Frontend route protection and backend API authorization are both implemented.
- Backend authorization is the final security boundary.

This module is foundational.

All other modules depend on the authentication and authorization system.

---

# 2. Technology Context

Use the project technology stack defined in `00_MASTER.md`.

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- REST API communication

## Backend

- Python
- FastAPI
- JWT authentication
- RBAC authorization

## Database

- PostgreSQL

## Security

- Password hashing
- JWT access tokens
- Protected API endpoints
- Role-based authorization
- Server-side permission checks

---

# 3. User Roles

PeoplePay360 must support exactly these primary application roles:

1. Employee
2. HR Manager
3. HR Payroll User
4. HR Payroll Manager
5. Admin

These roles must be represented consistently in:

- Database
- Backend
- Authentication
- Authorization
- Frontend navigation
- Frontend route protection
- API permissions
- User management

---

# 4. Role Definitions

## 4.1 Employee

The Employee role is the most restricted business role.

An Employee can:

- Log into the system.
- View their own employee information where permitted.
- View their own attendance.
- Create/check their own attendance.
- View their own time-off information.
- Create time-off requests.
- View their own leave allocations/balance where permitted.
- View their own payslips.
- Download their own payslip PDF.

An Employee must NOT be able to:

- Manage other employees.
- Create employees.
- Delete employees.
- Modify another employee's information.
- Create or modify contracts.
- Manage working schedules.
- Approve/refuse time-off requests.
- Create salary structures.
- Modify salary rules.
- Create payruns.
- Validate payruns.
- Mark payroll as paid.
- Send other employees' payslips.
- Manage users.
- Change their own role.

---

# 5. HR Manager

The HR Manager manages HR-related information but does not manage payroll processing.

The HR Manager can:

- View employees.
- Create employees.
- Edit employees.
- Archive/deactivate employees where supported.
- View contracts.
- Create contracts.
- Edit contracts.
- View working schedules.
- Create working schedules.
- Edit working schedules.
- View attendance records.
- Manage attendance records.
- View time-off types.
- Create/edit time-off types.
- View allocations.
- Create allocations.
- Approve time-off requests.
- Refuse time-off requests.

The HR Manager must NOT be able to:

- Create payroll payruns.
- Compute payruns.
- Validate payruns.
- Mark payruns as paid.
- Send payroll emails.
- Modify salary structures.
- Modify salary rules.
- Manage system users.
- Assign Admin role.

---

# 6. HR Payroll User

The HR Payroll User combines HR access with operational payroll access.

The HR Payroll User can:

- Perform HR Manager functions.
- View payruns.
- Create payruns.
- View payslips.
- Create/process payslips according to payrun workflow.
- Compute payruns.
- View payroll warnings.
- View salary structures.
- View salary rules.

Salary Structures and Salary Rules should be read-only for this role.

The HR Payroll User must NOT be able to:

- Modify salary structures.
- Delete salary structures.
- Modify salary rules.
- Delete salary rules.
- Change salary rule sequences.
- Change salary calculation logic.
- Manage system users.
- Assign roles.

---

# 7. HR Payroll Manager

The HR Payroll Manager has full HR and payroll management access.

The HR Payroll Manager can:

- Manage employees.
- Manage contracts.
- Manage working schedules.
- Manage attendance.
- Manage time-off types.
- Manage allocations.
- Approve/refuse time-off requests.
- Create payruns.
- Compute payruns.
- Validate payruns.
- Mark payruns as paid.
- Send payslips.
- Manage payslips.
- Create salary structures.
- Edit salary structures.
- Delete/deactivate salary structures where supported.
- Create salary rules.
- Edit salary rules.
- Delete/deactivate salary rules where supported.
- Configure salary rule sequence.
- Configure salary calculation methods.

The HR Payroll Manager must NOT automatically become an Admin.

System administration and user-role assignment remain Admin responsibilities.

---

# 8. Admin

Admin has full access to PeoplePay360.

Admin can:

- Access every module.
- Manage employees.
- Manage contracts.
- Manage working schedules.
- Manage attendance.
- Manage time off.
- Manage allocations.
- Manage salary structures.
- Manage salary rules.
- Manage payruns.
- Manage payslips.
- View dashboard.
- Manage users.
- Assign roles.
- Activate/deactivate users.
- Reset passwords where supported.
- View system-level information.

Admin cannot be restricted by normal business-module permissions.

However, all administrative actions must still be authenticated and authorized.

---

# 9. Permission Matrix

Implement the following high-level permission matrix.

| Feature | Employee | HR Manager | HR Payroll User | HR Payroll Manager | Admin |
|---|---:|---:|---:|---:|---:|
| Login | Yes | Yes | Yes | Yes | Yes |
| Own Attendance | Yes | Yes | Yes | Yes | Yes |
| All Attendance | No | Yes | Yes | Yes | Yes |
| Own Time Off | Yes | Yes | Yes | Yes | Yes |
| Approve Time Off | No | Yes | Yes | Yes | Yes |
| Employee Management | No | Yes | Yes | Yes | Yes |
| Contract Management | No | Yes | Yes | Yes | Yes |
| Working Schedules | No | Yes | Yes | Yes | Yes |
| Payrun View | No | No | Yes | Yes | Yes |
| Payrun Create | No | No | Yes | Yes | Yes |
| Payrun Compute | No | No | Yes | Yes | Yes |
| Payrun Validate | No | No | No | Yes | Yes |
| Mark Paid | No | No | No | Yes | Yes |
| Send Payslips | No | No | No | Yes | Yes |
| Salary Structure View | No | No | Read | Full | Full |
| Salary Structure Modify | No | No | No | Yes | Yes |
| Salary Rule View | No | No | Read | Full | Full |
| Salary Rule Modify | No | No | No | Yes | Yes |
| Own Payslip | Yes | Yes | Yes | Yes | Yes |
| All Payslips | No | No | Yes | Yes | Yes |
| Dashboard | Limited | HR | Payroll | Full | Full |
| User Management | No | No | No | No | Yes |
| Role Assignment | No | No | No | No | Yes |

The backend must enforce these permissions.

The frontend must reflect these permissions.

Frontend hiding alone is NOT considered security.

---

# 10. Authentication Architecture

Use JWT-based authentication.

Basic authentication flow:

```text
User
  |
  v
Login Page
  |
  v
POST /auth/login
  |
  v
Validate Email + Password
  |
  +---- Invalid ----> 401 Unauthorized
  |
  v
Generate JWT
  |
  v
Return Access Token + User Information
  |
  v
Frontend Stores Authentication State
  |
  v
Protected Application
````

---

# 11. Login Page

Create a dedicated login page.

Suggested route:

```text
/login
```

The login page must contain:

* PeoplePay360 branding/title.
* Email input.
* Password input.
* Login button.
* Validation messages.
* Authentication error message.
* Loading state.

Optional:

* Show/hide password.
* Remember session behavior if implemented securely.

Do NOT add unnecessary login fields.

---

# 12. Login Form

Fields:

| Field    | Type     | Required |
| -------- | -------- | -------: |
| Email    | Email    |      Yes |
| Password | Password |      Yes |

Validation:

### Email

* Required.
* Must be a valid email format.

### Password

* Required.
* Do not expose password contents in error messages.
* Never log passwords.

---

# 13. Login API

Create:

```http
POST /api/auth/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Successful response should contain:

```json
{
  "access_token": "JWT_TOKEN",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe",
    "role": "employee"
  }
}
```

Do not return:

* Password.
* Password hash.
* Sensitive authentication information.

---

# 14. Authentication Errors

Invalid credentials should return a generic authentication error.

Example:

```text
Invalid email or password.
```

Do not reveal:

```text
Email does not exist.
```

or:

```text
Password is incorrect.
```

This prevents unnecessary user/account enumeration.

---

# 15. Password Storage

Passwords must NEVER be stored as plain text.

Use a secure password hashing algorithm.

Recommended:

```text
bcrypt
```

or another strong password hashing implementation supported by the backend stack.

Database should store:

```text
password_hash
```

NOT:

```text
password
```

---

# 16. User Database Model

Create a `users` table.

Suggested structure:

```text
users
-----
id
employee_id
name
email
password_hash
role
is_active
created_at
updated_at
last_login_at
```

Fields:

### id

Primary key.

### employee_id

Optional relationship to Employee.

For business users, this should normally reference the corresponding employee.

### name

Display name.

### email

Unique login identifier.

### password_hash

Secure password hash.

### role

Application role.

Allowed values:

```text
employee
hr_manager
hr_payroll_user
hr_payroll_manager
admin
```

### is_active

Controls whether the user can authenticate.

### created_at

Creation timestamp.

### updated_at

Last update timestamp.

### last_login_at

Last successful login timestamp.

---

# 17. User ↔ Employee Relationship

A user account and employee record are separate concepts.

Example:

```text
User
 |
 +-- Login credentials
 +-- Role
 +-- Authentication state
 |
 +-- Employee
      |
      +-- HR information
      +-- Department
      +-- Job Position
      +-- Contract
      +-- Attendance
      +-- Time Off
      +-- Payslips
```

This separation is important.

Do not put all HR data directly into the user table.

---

# 18. User Creation

Only Admin can create/manage user accounts.

Suggested route:

```text
/admin/users
```

or:

```text
/settings/users
```

depending on final navigation implementation.

The user management page should support:

* List users.
* Search users.
* Filter users.
* Create user.
* Edit user.
* Activate/deactivate user.
* Assign role.

---

# 19. User List

Recommended columns:

| Column     | Description           |
| ---------- | --------------------- |
| User       | Name                  |
| Email      | Login email           |
| Employee   | Linked employee       |
| Role       | Current role          |
| Status     | Active/Inactive       |
| Last Login | Last successful login |

Actions:

* View
* Edit
* Activate/Deactivate

Admin-only actions must not be visible to normal users.

---

# 20. Create User

Admin should be able to create:

```text
Name
Email
Employee
Role
Temporary/Initial Password
Active
```

Validation:

* Email required.
* Email unique.
* Role required.
* Role must be one of the supported roles.
* Employee relationship should be valid.
* Password must meet configured security requirements.

---

# 21. Role Assignment

Role assignment must only be possible for Admin users.

Example:

```text
Role:
[ Employee ▼ ]
```

Options:

```text
Employee
HR Manager
HR Payroll User
HR Payroll Manager
Admin
```

A non-admin must never be able to change the role through:

* UI
* API
* browser developer tools
* manually crafted requests

Backend authorization must reject unauthorized role changes.

---

# 22. Prevent Self-Elevation

A user must never be able to elevate their own role.

For example:

```text
Employee
   |
   X
   |
   +--> Admin
```

Even if the frontend is manipulated, the backend must reject:

```http
PUT /api/users/me
```

with:

```json
{
  "role": "admin"
}
```

when the requester is not an Admin.

---

# 23. Role Enumeration

Roles should be represented using stable internal identifiers.

Use:

```text
employee
hr_manager
hr_payroll_user
hr_payroll_manager
admin
```

Frontend labels can be:

```text
Employee
HR Manager
HR Payroll User
HR Payroll Manager
Admin
```

Do not use inconsistent role strings across the application.

---

# 24. Authentication Middleware

Implement backend authentication middleware/dependencies.

Every protected API endpoint should be able to determine:

```text
Who is making this request?
```

The authentication layer should:

1. Read JWT.
2. Validate JWT.
3. Extract user ID.
4. Load user.
5. Check user exists.
6. Check user is active.
7. Attach authenticated user to request context.

If authentication fails:

```text
401 Unauthorized
```

---

# 25. Authorization Middleware

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
Are you allowed to do this?
```

Implement reusable authorization dependencies.

Conceptually:

```text
require_authenticated_user()
require_role(...)
require_permission(...)
```

Example:

```python
require_role("admin")
```

or:

```python
require_roles(
    "hr_payroll_manager",
    "admin"
)
```

---

# 26. Permission-Based Design

Do not build the entire system using scattered role checks.

Avoid code such as:

```python
if user.role == "admin":
```

everywhere.

Instead centralize authorization logic.

Example conceptual structure:

```text
auth/
    authentication.py
    authorization.py
    permissions.py
```

---

# 27. Suggested Permission Constants

Define permissions such as:

```text
employee.read
employee.create
employee.update
employee.delete

contract.read
contract.create
contract.update
contract.delete

schedule.read
schedule.create
schedule.update
schedule.delete

attendance.read
attendance.create
attendance.update
attendance.delete

timeoff.read
timeoff.create
timeoff.update
timeoff.approve

allocation.read
allocation.create
allocation.update

payrun.read
payrun.create
payrun.compute
payrun.validate
payrun.mark_paid
payrun.send

payslip.read
payslip.create
payslip.update
payslip.pdf
payslip.email

salary_structure.read
salary_structure.create
salary_structure.update
salary_structure.delete

salary_rule.read
salary_rule.create
salary_rule.update
salary_rule.delete

user.read
user.create
user.update
user.delete
user.assign_role
```

The exact implementation can use a role → permission mapping.

---

# 28. Role → Permission Mapping

Recommended conceptual mapping:

## Employee

```text
attendance.self.read
attendance.self.create

timeoff.self.read
timeoff.self.create

payslip.self.read
payslip.self.pdf
```

## HR Manager

```text
employee.*
contract.*
schedule.*
attendance.*
timeoff.*
allocation.*
```

plus employee self-access.

## HR Payroll User

```text
HR Manager permissions
+
payrun.read
payrun.create
payrun.compute
payslip.read
payslip.create
payslip.pdf
salary_structure.read
salary_rule.read
```

## HR Payroll Manager

```text
HR Manager permissions
+
payrun.*
payslip.*
salary_structure.*
salary_rule.*
```

## Admin

```text
*
```

---

# 29. Self-Access Rules

Employee-level self-access must be enforced at the backend.

For example:

```text
Employee A
```

must not request:

```http
GET /api/employees/Employee-B
```

and receive Employee B's data merely because the endpoint exists.

The backend must verify ownership.

Conceptually:

```python
if user.role == "employee":
    requested_employee_id == user.employee_id
```

Otherwise:

```text
403 Forbidden
```

---

# 30. Employee Payslip Privacy

Employees may view their own payslips.

They must not be able to access another employee's payslip by changing an ID.

For example:

```text
/api/payslips/101
```

must be checked against the authenticated user's employee relationship.

This rule must apply to:

* Payslip details.
* Payslip PDF.
* Payslip download.
* Payslip API.
* Any related salary information.

---

# 31. Employee Attendance Privacy

Employees should only access their own attendance records.

Example:

```text
Employee A
```

can see:

```text
Employee A attendance
```

but not:

```text
Employee B attendance
```

unless their role grants broader HR access.

---

# 32. Employee Time-Off Privacy

Employees can:

* View their own requests.
* Create their own request.
* View their own allocation/balance where allowed.

Employees cannot:

* Approve their own request.
* Approve another employee's request.
* Modify approval status.
* Change allocation balance manually.

Approval status must be controlled by authorized HR roles.

---

# 33. Navigation Based on Role

The frontend navigation should dynamically display modules based on permissions.

Main navigation from the SVG reference:

```text
Employees
Contracts
Attendance
Time Off
Payroll
Reports
```

Role behavior:

### Employee

Show:

```text
Employees / My Profile
Attendance
Time Off
My Payslips
```

Do not show administrative payroll configuration.

### HR Manager

Show:

```text
Employees
Contracts
Attendance
Time Off
Reports
```

### HR Payroll User

Show:

```text
Employees
Contracts
Attendance
Time Off
Payroll
Reports
```

Payroll configuration pages should remain read-only where applicable.

### HR Payroll Manager

Show:

```text
Employees
Contracts
Attendance
Time Off
Payroll
Reports
```

with full payroll configuration access.

### Admin

Show all available modules plus user/system management.

---

# 34. Protected Frontend Routes

React Router routes must be protected.

Conceptual structure:

```text
/login
```

is public.

Everything else requires authentication.

Example:

```text
/protected
    |
    +-- Authenticated?
          |
          +-- No --> /login
          |
          +-- Yes --> Continue
```

---

# 35. Role-Protected Routes

Example:

```text
/payroll/payruns
```

requires payroll permissions.

```text
/payroll/salary-structures
```

requires:

```text
salary_structure.read
```

or higher.

```text
/admin/users
```

requires:

```text
user.read
```

and administrative permission.

---

# 36. Unauthorized Page

Create a dedicated unauthorized page.

Suggested route:

```text
/403
```

Display:

```text
Access Denied

You do not have permission to access this page.
```

Provide:

```text
Back to Dashboard
```

Do not redirect unauthorized users silently to unrelated pages.

---

# 37. Authentication State

Frontend should maintain authenticated user state.

Example:

```javascript
{
  id: 1,
  name: "Aarav Mehta",
  email: "aarav@example.com",
  role: "employee",
  employee_id: 1
}
```

The application should be able to determine:

```text
isAuthenticated
currentUser
currentRole
permissions
```

---

# 38. API Client

Create a centralized API client.

Example conceptual structure:

```text
src/
    api/
        client.js
        auth.js
        employees.js
        contracts.js
        attendance.js
        timeoff.js
        payroll.js
```

The API client should automatically attach the authentication token to protected requests.

---

# 39. Handling Expired JWT

If the JWT expires:

```text
API
 |
 v
401 Unauthorized
 |
 v
Frontend
 |
 v
Clear authentication state
 |
 v
Redirect to /login
```

Do not leave the user in a broken authenticated UI state.

---

# 40. Logout

Provide logout functionality.

Logout should:

1. Clear authentication state.
2. Remove/expire the authentication token according to the chosen storage strategy.
3. Clear cached protected data.
4. Redirect to `/login`.

Example UI:

```text
User Menu
   |
   +-- Profile
   +-- Logout
```

---

# 41. Token Storage

Choose a secure token storage strategy.

If using browser storage, understand the security implications.

Prefer a secure architecture where possible.

Do not:

* Put passwords in localStorage.
* Store password hashes in frontend.
* Expose secrets in frontend code.
* Put backend private keys in Vite environment variables intended for client exposure.

If access tokens are stored client-side, minimize exposure and centralize token handling.

---

# 42. Environment Variables

Backend secrets must be stored through environment variables.

Example:

```text
DATABASE_URL
JWT_SECRET
JWT_ALGORITHM
JWT_EXPIRATION_MINUTES
```

Frontend should only receive variables intended for frontend use.

Never commit:

```text
JWT_SECRET
DATABASE_PASSWORD
SMTP_PASSWORD
```

to GitHub.

---

# 43. JWT Payload

Keep JWT payload minimal.

Example:

```json
{
  "sub": "1",
  "role": "employee",
  "exp": 1780000000
}
```

Do not store sensitive employee information inside the token.

The backend should retrieve current user information from the database when required.

---

# 44. JWT Expiration

Access tokens should have a finite expiration time.

Example:

```text
30–60 minutes
```

The exact value should be configurable.

Do not create permanent JWT tokens.

---

# 45. Inactive Users

If:

```text
is_active = false
```

the user must not be able to log in.

If an existing token belongs to a deactivated user, backend authorization should also reject future protected requests when the user is checked against the database.

Expected behavior:

```text
User Active
   |
   v
Access Allowed

User Deactivated
   |
   v
Access Denied
```

---

# 46. Email Uniqueness

User email must be unique.

Database must enforce uniqueness.

Do not rely only on frontend validation.

Correct:

```text
Database UNIQUE constraint
+
Backend validation
+
Frontend validation
```

---

# 47. Case Handling for Email

Normalize emails consistently.

Example:

```text
John@Example.com
john@example.com
```

should not unintentionally create two separate accounts.

Use a consistent normalization strategy before authentication and storage.

---

# 48. Login Rate Protection

Basic protection should exist against repeated login attempts.

At minimum:

* Avoid detailed authentication error messages.
* Avoid password logging.
* Consider rate limiting.
* Do not expose account existence.

For hackathon MVP, implementation may remain simple, but architecture should allow rate limiting to be added.

---

# 49. Audit Information

Authentication events should be trackable.

At minimum capture:

```text
last_login_at
```

Optional audit events:

```text
LOGIN_SUCCESS
LOGIN_FAILURE
LOGOUT
ROLE_CHANGED
USER_CREATED
USER_DEACTIVATED
```

Do not log passwords or JWT secrets.

---

# 50. User Management UI

Admin user-management UI should follow the same Odoo-style visual language as the rest of PeoplePay360.

Use:

* Top navigation.
* Page title.
* Search.
* Filters.
* List view.
* Form view.
* Action buttons.
* Status indicators.
* Clean ERP-style layout.

Do not introduce an unrelated visual design.

---

# 51. User Form

Suggested form:

```text
--------------------------------------------------
User
--------------------------------------------------

Name                 [________________]

Email                [________________]

Employee             [ Select Employee ]

Role                 [ Employee       ▼ ]

Status               [ Active ]

--------------------------------------------------
Authentication
--------------------------------------------------

Password             [________________]

Confirm Password     [________________]

--------------------------------------------------

                 [ Save ] [ Cancel ]
--------------------------------------------------
```

For editing an existing user, do not display the stored password hash.

---

# 52. Role Badge

Display role clearly.

Examples:

```text
Employee
HR Manager
HR Payroll User
HR Payroll Manager
Admin
```

Use consistent status/badge styling across the application.

---

# 53. Active/Inactive Status

Users must have:

```text
Active
Inactive
```

A deactivated user:

* Cannot log in.
* Cannot access protected APIs.
* Remains in historical records.
* Is not deleted automatically.

Prefer deactivation over deletion when historical references exist.

---

# 54. User Deletion

Do not physically delete users if they have historical business relationships unless there is a strong reason.

For example, a user may be associated with:

* Employee.
* Attendance.
* Time Off approval.
* Payroll activity.
* Payslips.
* Audit records.

Use:

```text
is_active = false
```

instead.

---

# 55. Role Change Safety

Changing a user's role can immediately change what they can access.

Only Admin can perform this action.

Example:

```text
Employee
   |
   v
HR Manager
```

After role change, the next authorization check must use the updated role.

Do not rely indefinitely on stale frontend role state.

---

# 56. Backend API Permission Enforcement

Every sensitive API must check permissions.

Example:

```text
POST /api/payruns
```

requires:

```text
payrun.create
```

Example:

```text
POST /api/payruns/{id}/validate
```

requires:

```text
payrun.validate
```

Example:

```text
POST /api/payruns/{id}/mark-paid
```

requires:

```text
payrun.mark_paid
```

Example:

```text
PUT /api/salary-rules/{id}
```

requires:

```text
salary_rule.update
```

Example:

```text
PUT /api/users/{id}/role
```

requires:

```text
user.assign_role
```

---

# 57. HTTP Authorization Responses

Use appropriate status codes.

## 401 Unauthorized

Use when:

* No token.
* Invalid token.
* Expired token.
* User no longer active.

Example:

```json
{
  "detail": "Authentication required."
}
```

## 403 Forbidden

Use when:

* User is authenticated.
* User does not have required permission.

Example:

```json
{
  "detail": "You do not have permission to perform this action."
}
```

Do not use 401 for a valid user who simply lacks permission.

---

# 58. Frontend Permission Helpers

Create reusable permission utilities.

Conceptual examples:

```javascript
hasPermission("payrun.create")
```

```javascript
hasRole("admin")
```

```javascript
can("salary_rule.update")
```

Use these utilities for:

* Navigation.
* Buttons.
* Routes.
* Actions.
* UI visibility.

But remember:

```text
Frontend permission checks = UX
Backend permission checks = Security
```

---

# 59. Hide Unauthorized Actions

If a user cannot perform an action, the corresponding button should generally not be displayed.

Example:

HR Manager viewing a Payrun:

```text
[ View ]
```

but not:

```text
[ Mark Paid ]
```

HR Payroll Manager:

```text
[ Compute ]
[ Validate ]
[ Mark Paid ]
[ Send Payslips ]
```

However, hidden buttons are not sufficient security.

---

# 60. Permission-Aware UI Example

For salary rules:

### HR Payroll User

Display:

```text
Salary Rules

Rule Name | Code | Category | Sequence
```

No:

```text
New
Edit
Delete
```

buttons if the role is read-only.

### HR Payroll Manager

Display:

```text
[ New Rule ]

Rule Name | Code | Category | Sequence
                         [Edit]
                         [Delete]
```

---

# 61. Dashboard Access

Dashboard access should follow role permissions.

Employee:

```text
Personal information
Personal attendance
Personal leave
Personal payslip information
```

HR Manager:

```text
HR overview
Attendance
Time Off
Employees
Department overview
```

HR Payroll User:

```text
HR overview
Payroll overview
Payrun information
Payslip information
```

HR Payroll Manager:

```text
Full HR + Payroll dashboard
```

Admin:

```text
Full dashboard
```

The dashboard implementation itself is covered in:

```text
12_PAYROLL_DASHBOARD.md
```

---

# 62. Security Rule: Never Trust Frontend Role

Never implement security like:

```javascript
if (user.role === "admin") {
    allowAction();
}
```

alone.

A malicious user can modify frontend JavaScript or manually call APIs.

Correct architecture:

```text
Frontend
   |
   | UX permission check
   v
Backend
   |
   | Real authorization check
   v
Database
```

---

# 63. Security Rule: Never Accept Role from Client

Do not trust requests such as:

```json
{
  "employee_id": 1,
  "role": "admin"
}
```

for normal user operations.

Role assignment must be a privileged administrative operation.

---

# 64. Authentication Dependencies

Suggested FastAPI structure:

```text
backend/
│
├── app/
│   ├── main.py
│   │
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── security.py
│   │   ├── dependencies.py
│   │   └── permissions.py
│   │
│   ├── users/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── router.py
│   │   └── service.py
│   │
│   └── ...
```

The exact folder architecture can be adapted to the project.

Do not duplicate authentication logic across modules.

---

# 65. Frontend Authentication Structure

Suggested structure:

```text
frontend/
│
└── src/
    ├── auth/
    │   ├── AuthContext.jsx
    │   ├── ProtectedRoute.jsx
    │   ├── PermissionGuard.jsx
    │   └── authService.js
    │
    ├── pages/
    │   ├── Login.jsx
    │   └── Unauthorized.jsx
    │
    └── ...
```

Again, adapt if the project already has an established architecture.

---

# 66. Authentication Context

Create a centralized authentication state.

Conceptual API:

```javascript
const {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    hasRole,
    hasPermission
} = useAuth();
```

This avoids duplicating authentication logic across pages.

---

# 67. ProtectedRoute Behavior

Conceptual behavior:

```text
ProtectedRoute
      |
      v
Loading?
   |
   +-- Yes --> Loading UI
   |
   +-- No
        |
        v
Authenticated?
   |
   +-- No --> /login
   |
   +-- Yes --> Render page
```

---

# 68. PermissionGuard Behavior

Conceptual:

```text
PermissionGuard
      |
      v
Has Permission?
   |
   +-- Yes --> Render content
   |
   +-- No --> 403 / hide action
```

Use route-level protection for pages and permission checks for actions.

---

# 69. Initial Admin Account

For development/demo purposes, create a controlled initial Admin account.

Example:

```text
Email:
admin@peoplepay360.com
```

Do not hardcode an insecure production password in the source code.

Use environment variables or a development seed mechanism.

Example:

```text
INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD
```

The initial account must be disabled or replaced appropriately for production deployment.

---

# 70. Seed Users

For development/demo data, create users corresponding to the main roles.

Example:

```text
admin@peoplepay360.com
hr.manager@peoplepay360.com
payroll.user@peoplepay360.com
payroll.manager@peoplepay360.com
employee@peoplepay360.com
```

Use development-only passwords.

Document them separately in development documentation if necessary.

Never expose real credentials in production.

---

# 71. Demo Role Testing

The project must allow easy testing of all five roles.

Test login using:

```text
Employee
HR Manager
HR Payroll User
HR Payroll Manager
Admin
```

Verify that the navigation and available actions change accordingly.

---

# 72. Critical RBAC Test Cases

## Test 1 — Employee Login

Given:

```text
Employee account
```

When:

```text
Correct email + password
```

Then:

```text
Login succeeds.
```

---

## Test 2 — Wrong Password

Given:

```text
Existing user
```

When:

```text
Wrong password
```

Then:

```text
Login fails.
```

---

## Test 3 — Inactive User

Given:

```text
is_active = false
```

When:

```text
User attempts login.
```

Then:

```text
Login denied.
```

---

## Test 4 — Employee Cannot Access Payroll Configuration

Given:

```text
Employee logged in.
```

When:

```text
Employee requests salary rule page.
```

Then:

```text
Access denied.
```

---

## Test 5 — HR Manager Cannot Mark Payroll Paid

Given:

```text
HR Manager logged in.
```

When:

```text
POST /api/payruns/{id}/mark-paid
```

Then:

```text
403 Forbidden
```

---

## Test 6 — Payroll User Cannot Modify Salary Rules

Given:

```text
HR Payroll User logged in.
```

When:

```text
PUT /api/salary-rules/{id}
```

Then:

```text
403 Forbidden
```

---

## Test 7 — Payroll Manager Can Modify Salary Rules

Given:

```text
HR Payroll Manager logged in.
```

When:

```text
PUT /api/salary-rules/{id}
```

Then:

```text
Request succeeds if data is valid.
```

---

## Test 8 — Employee Cannot View Another Employee's Payslip

Given:

```text
Employee A logged in.
```

When:

```text
Employee A requests Employee B's payslip.
```

Then:

```text
403 Forbidden
```

or equivalent secure not-found behavior.

---

## Test 9 — Employee Cannot Change Own Role

Given:

```text
Employee logged in.
```

When:

```text
Employee attempts to set role=admin.
```

Then:

```text
403 Forbidden
```

---

## Test 10 — Admin Can Assign Role

Given:

```text
Admin logged in.
```

When:

```text
Admin changes Employee role to HR Manager.
```

Then:

```text
Role successfully updated.
```

---

# 73. API Testing

Test authentication endpoints with FastAPI TestClient/Pytest.

Minimum tests:

```text
test_login_success
test_login_invalid_password
test_login_invalid_email
test_inactive_user_login
test_protected_endpoint_without_token
test_expired_token
test_employee_permission_denied
test_hr_manager_permission
test_payroll_user_permission
test_payroll_manager_permission
test_admin_permission
test_self_role_escalation_blocked
```

---

# 74. Database Constraints

The database should enforce:

```text
users.email UNIQUE
users.id PRIMARY KEY
users.employee_id -> employees.id
```

Where appropriate:

```text
role CHECK constraint
```

or application-level enum backed by a validated database type.

---

# 75. Data Integrity

Do not allow:

* User referencing nonexistent employee.
* Duplicate login emails.
* Invalid roles.
* Invalid status.
* Deleted employee with broken user relationship.

Historical records must remain valid.

---

# 76. Error Handling

Use consistent backend errors.

Examples:

```text
Invalid credentials.
Authentication required.
Access denied.
User account is inactive.
User not found.
Email already exists.
Invalid role.
Employee already has a user account.
```

Do not expose:

* Stack traces.
* SQL queries.
* Password hashes.
* JWT secrets.
* Internal implementation details.

---

# 77. Loading States

Login UI must show a loading state during authentication.

Example:

```text
[ Logging in... ]
```

Disable duplicate submission while the request is processing.

---

# 78. Form Validation

Frontend should validate before API submission.

Backend must validate again.

Never assume frontend validation is sufficient.

Example:

```text
Frontend validation
       +
Backend validation
       +
Database constraints
```

---

# 79. Session Initialization

When the application starts:

```text
App
 |
 v
Check authentication state
 |
 +-- Not authenticated --> Login
 |
 +-- Authenticated ------> Load current user
                              |
                              v
                         Load permissions
                              |
                              v
                         Render dashboard
```

Avoid flashing protected pages before authentication is resolved.

---

# 80. Current User Endpoint

Create:

```http
GET /api/auth/me
```

Response:

```json
{
  "id": 1,
  "name": "Aarav Mehta",
  "email": "aarav@example.com",
  "role": "employee",
  "employee_id": 1,
  "is_active": true
}
```

This endpoint allows the frontend to initialize the current user.

---

# 81. User Profile

A user should be able to access appropriate profile information.

For employees, profile information should be connected to their employee record.

Do not allow users to edit protected HR/payroll fields merely through profile settings.

Employee data modification rules are defined in:

```text
02_EMPLOYEE_MASTER.md
```

---

# 82. Admin User Management Security

Admin user management is highly sensitive.

Only Admin should access:

```text
/admin/users
```

Admin actions include:

```text
Create User
Edit User
Activate User
Deactivate User
Assign Role
```

All actions require backend authorization.

---

# 83. Role Change Confirmation

For sensitive role changes, show confirmation.

Example:

```text
Change Role?

You are changing:

John Doe

Employee
→
HR Payroll Manager

This will change the user's access to PeoplePay360.

[Cancel] [Confirm]
```

This reduces accidental privilege changes.

---

# 84. Deactivation Confirmation

When deactivating a user:

```text
Deactivate User?

This user will no longer be able to log in.

Historical employee, attendance, leave, and payroll records will remain.

[Cancel] [Deactivate]
```

---

# 85. Admin Cannot Accidentally Delete Historical Data

User deactivation should not cascade-delete:

* Employee.
* Contracts.
* Attendance.
* Time Off.
* Allocations.
* Payslips.
* Payruns.

Authentication status and business history are separate concerns.

---

# 86. RBAC Implementation Principle

The system must follow:

```text
Authentication
      ↓
Identity
      ↓
Role
      ↓
Permission
      ↓
Resource Ownership
      ↓
Action
```

Example:

```text
Employee
   ↓
Authenticated
   ↓
employee role
   ↓
payslip.self.read
   ↓
Payslip belongs to current employee
   ↓
Allow
```

---

# 87. Security Layers

PeoplePay360 must use multiple security layers:

```text
Layer 1
Frontend route protection

Layer 2
Frontend permission-based UI

Layer 3
JWT authentication

Layer 4
Backend role/permission authorization

Layer 5
Resource ownership validation

Layer 6
Database constraints
```

No single layer should be considered sufficient.

---

# 88. Do Not Implement Security by Hiding UI

Incorrect:

```text
Hide button
=
Security
```

Correct:

```text
Hide button
+
Protect route
+
Protect API
+
Validate ownership
```

---

# 89. Module Integration

This authentication module must integrate with every other module.

## Employee

Uses:

```text
current_user.employee_id
```

for self-access.

## Attendance

Uses authenticated employee for employee check-in/out.

## Time Off

Uses authenticated employee when creating personal requests.

## Payroll

Uses role permissions for payroll operations.

## Payslips

Uses employee ownership checks for self-access.

## Dashboard

Uses role and permissions to determine visible information.

---

# 90. Employee Check-In Security

If an Employee uses the quick attendance widget:

```text
Check In
```

the backend should determine the employee from the authenticated user.

Do not allow the frontend to arbitrarily submit:

```json
{
  "employee_id": 999
}
```

and create attendance for another employee.

For HR/admin users, broader attendance operations may be allowed according to permissions.

---

# 91. Employee Time-Off Request Security

When an Employee creates a request:

```text
POST /api/time-off/requests
```

the backend should associate the request with:

```text
current_user.employee_id
```

rather than trusting an arbitrary employee ID supplied by the client.

---

# 92. Employee Payslip Access

When an Employee requests:

```text
GET /api/payslips/{id}
```

the backend must verify:

```text
payslip.employee_id == current_user.employee_id
```

unless the user has broader payslip permissions.

---

# 93. Audit Trail Compatibility

Design authentication/user-management operations so future audit logging can record:

```text
actor_user_id
action
resource_type
resource_id
timestamp
metadata
```

Example:

```text
Admin changed user John Doe
Employee → HR Payroll Manager
```

This is especially important for:

* Role changes.
* User creation.
* User deactivation.
* Payroll-related permissions.

---

# 94. Performance

Authentication should be lightweight.

Do not load:

* Full employee record.
* Full payroll history.
* Full attendance history.

during every login or token validation.

Load only required user/permission information.

---

# 95. Database Query Principle

Avoid unnecessary queries.

For a protected request:

```text
JWT
 ↓
User lookup
 ↓
Authorization
 ↓
Requested resource
```

Use efficient indexes.

Recommended:

```text
users.email
users.employee_id
users.role
users.is_active
```

---

# 96. Development Sequence

Implement this module in the following order:

```text
1. User database model
2. Password hashing
3. JWT configuration
4. Login API
5. Current-user API
6. Authentication dependency
7. Role definitions
8. Permission definitions
9. Authorization dependency
10. User management APIs
11. Frontend AuthContext
12. Login page
13. Protected routes
14. Permission guards
15. Role-based navigation
16. Admin user-management UI
17. Integration with Employee module
18. Integration with Attendance
19. Integration with Time Off
20. Integration with Payroll
21. Tests
```

---

# 97. Definition of Done

This module is complete only when:

* [ ] Login page exists.
* [ ] Login API works.
* [ ] Passwords are hashed.
* [ ] JWT authentication works.
* [ ] `/api/auth/me` works.
* [ ] Logout works.
* [ ] Expired/invalid tokens are handled.
* [ ] Inactive users cannot log in.
* [ ] Five roles exist.
* [ ] Permissions are centrally defined.
* [ ] Backend authorization is implemented.
* [ ] Frontend protected routes exist.
* [ ] Unauthorized page exists.
* [ ] Role-based navigation works.
* [ ] Admin user management works.
* [ ] Admin can assign roles.
* [ ] Non-admin cannot assign roles.
* [ ] Users cannot elevate their own role.
* [ ] Employee self-access restrictions work.
* [ ] Employee cannot access another employee's payslip.
* [ ] Employee cannot access another employee's attendance.
* [ ] Employee cannot approve leave.
* [ ] HR Manager cannot perform restricted payroll actions.
* [ ] HR Payroll User has read-only salary configuration.
* [ ] HR Payroll Manager has full payroll configuration.
* [ ] Admin has full access.
* [ ] API returns correct 401/403 responses.
* [ ] Authentication tests pass.
* [ ] RBAC tests pass.
* [ ] No passwords/secrets are exposed.
* [ ] No sensitive secrets are committed to Git.

---

# 98. AI CODING AGENT INSTRUCTIONS

When implementing this module:

## MUST

* Follow `00_MASTER.md`.
* Use FastAPI for backend APIs.
* Use PostgreSQL for persistence.
* Use JWT authentication.
* Use secure password hashing.
* Implement centralized RBAC.
* Protect backend APIs.
* Protect frontend routes.
* Validate resource ownership.
* Keep user and employee concepts separate.
* Preserve historical employee/payroll data.
* Use the five defined roles.
* Keep role names consistent.
* Follow the PeoplePay360 Odoo-style visual language.
* Make the implementation modular.
* Write tests for authentication and authorization.

## MUST NOT

* Hardcode passwords.
* Store plain-text passwords.
* Trust frontend role checks.
* Allow client-controlled privilege escalation.
* Allow employees to access other employees' payroll data.
* Put all HR data inside users table.
* Duplicate authorization logic across every API.
* Create unnecessary authentication complexity.
* Introduce unrelated UI styling.
* Remove historical business records when deactivating users.
* Give HR roles Admin permissions automatically.

---

# 99. Expected End-to-End Flow

The final system should support:

```text
                    PEOPLEPAY360
                         |
                         v
                      LOGIN
                         |
                         v
                  Authenticate User
                         |
                         v
                    Identify Role
                         |
        +----------------+----------------+
        |                |                |
        v                v                v
     Employee         HR User           Admin
        |                |                |
        v                v                v
 Personal Data       HR Modules       All Modules
 Attendance          Attendance       User Management
 Time Off            Time Off         Role Assignment
 Payslips            Contracts         Payroll
                     Payroll           Configuration
                         |
                         v
                    Permissions
                         |
                         v
                    Authorized UI
                         |
                         v
                    Authorized API
                         |
                         v
                      Database
```

---

# 100. Final Acceptance Criteria

A reviewer should be able to demonstrate:

### Employee

```text
Login
 ↓
See personal information
 ↓
Check attendance
 ↓
Create time-off request
 ↓
View own payslip
 ↓
Cannot access payroll administration
```

### HR Manager

```text
Login
 ↓
Manage employees
 ↓
Manage contracts
 ↓
Manage attendance
 ↓
Approve time off
 ↓
Cannot mark payroll as paid
```

### HR Payroll User

```text
Login
 ↓
Access HR
 ↓
Create/compute payrun
 ↓
View payslips
 ↓
View salary structures/rules
 ↓
Cannot modify salary rules
 ↓
Cannot mark payroll as paid
```

### HR Payroll Manager

```text
Login
 ↓
Full HR
 ↓
Full Payroll
 ↓
Manage Salary Structures
 ↓
Manage Salary Rules
 ↓
Compute
 ↓
Validate
 ↓
Mark Paid
 ↓
Send Payslips
```

### Admin

```text
Login
 ↓
Full system access
 ↓
Manage users
 ↓
Assign roles
 ↓
Manage all modules
```

If all five flows work correctly and unauthorized API requests are rejected by the backend, the Login/RBAC/User Management module is considered complete.

---

# END OF 01_LOGIN_RBAC_USER_MANAGEMENT.md

```

**Next file in the sequence:** `02_EMPLOYEE_MASTER.md` — this will define the complete Employee module, including **Kanban/List/Form views, fields, smart buttons, employee relationships, validation, search/filter behavior, permissions, and SVG/Odoo-style UI behavior**.
```
