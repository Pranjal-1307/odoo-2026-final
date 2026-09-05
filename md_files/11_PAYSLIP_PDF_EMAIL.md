# `11_PAYSLIP_PDF_EMAIL.md`

````markdown
# PeoplePay360 — Payslip PDF Generation, Download & Email Delivery Specification

## 1. Purpose

The **Payslip PDF & Email module** is responsible for transforming a finalized payroll result into a professional, employee-facing payslip document and securely delivering it to the employee.

This module comes after Payslip Computation.

The overall payroll flow is:

```text
EMPLOYEE
    +
CONTRACT
    +
WORKING SCHEDULE
    +
ATTENDANCE
    +
TIME OFF
    +
SALARY STRUCTURE
    +
SALARY RULES
        ↓
SALARY RULES ENGINE
        ↓
PAYRUN
        ↓
PAYSLIP COMPUTATION
        ↓
PAYSLIP FINALIZATION
        ↓
PDF GENERATION
        ↓
DOWNLOAD / EMAIL DELIVERY
````

The main purpose is to ensure that a finalized Payslip can be:

```text
✓ Viewed

✓ Converted into PDF

✓ Downloaded securely

✓ Emailed to the employee

✓ Re-downloaded later

✓ Tracked for delivery status
```

---

# 2. Position in the PeoplePay360 System

```text
01_LOGIN_RBAC_USER_MANAGEMENT
                ↓
02_EMPLOYEE_MASTER
                ↓
03_CONTRACT_MANAGEMENT
                ↓
04_WORKING_SCHEDULES
                ↓
05_ATTENDANCE
                ↓
06_TIME_OFF
                ↓
07_SALARY_STRUCTURES
                ↓
08_SALARY_RULES_ENGINE
                ↓
09_PAYRUN_WIZARD_PROCESSING
                ↓
10_PAYSLIP_COMPUTATION
                ↓
11_PAYSLIP_PDF_EMAIL
                ↓
12_PAYROLL_REPORTING_ANALYTICS
```

This module converts the internal payroll record into a professional employee document.

---

# 3. Core Principle

The PDF must represent the finalized Payslip.

The PDF generation module must not independently calculate salary.

Correct architecture:

```text
SALARY RULES ENGINE
        ↓
Calculates salary

PAYSLIP COMPUTATION
        ↓
Stores salary result

PAYSLIP FINALIZATION
        ↓
Locks official result

PDF GENERATION
        ↓
Formats official result

EMAIL DELIVERY
        ↓
Delivers official document
```

The PDF generator should only read the approved Payslip data.

---

# 4. Main Responsibilities

The module must handle:

```text
✓ Payslip PDF generation

✓ Professional document layout

✓ Employee details

✓ Payroll period details

✓ Earnings breakdown

✓ Deductions breakdown

✓ Net salary summary

✓ Employer contribution display when authorized

✓ PDF download

✓ Email delivery

✓ Delivery status tracking

✓ Re-send functionality

✓ Access security

✓ Historical document consistency
```

---

# 5. Module Boundary

This module is responsible for:

```text
FINALIZED PAYSLIP
        ↓
FORMAT DATA
        ↓
GENERATE PDF
        ↓
STORE DOCUMENT REFERENCE
        ↓
DOWNLOAD
        OR
EMAIL
```

It is not responsible for:

```text
✗ Calculating salary rules

✗ Calculating gross salary

✗ Calculating deductions

✗ Determining net salary

✗ Changing finalized payroll values
```

---

# 6. PDF Generation Eligibility

A Payslip should normally be eligible for official PDF generation when:

```text
Status = FINALIZED
```

Recommended rule:

```text
DRAFT
    ✗ No official PDF

COMPUTED
    Optional preview only

FINALIZED
    ✓ Official PDF
```

For the hackathon MVP:

```text
Generate official Payslip PDF only after FINALIZED.
```

This ensures that employees do not receive incomplete or changing payroll information.

---

# 7. Payslip PDF Generation Flow

```text
FINALIZED PAYSLIP
        │
        ▼
VALIDATE ACCESS
        │
        ▼
LOAD PAYSLIP SNAPSHOT
        │
        ▼
LOAD PAYSLIP LINES
        │
        ▼
FORMAT DOCUMENT DATA
        │
        ▼
GENERATE PDF
        │
        ▼
STORE PDF REFERENCE
        │
        ├───────────────┐
        ▼               ▼
DOWNLOAD PDF        EMAIL PDF
```

---

# 8. Professional Payslip PDF Structure

The Payslip PDF should contain the following sections:

```text
1. Company Header

2. Payslip Title

3. Employee Information

4. Payroll Information

5. Earnings

6. Deductions

7. Salary Summary

8. Optional Employer Contributions

9. Footer
```

---

# 9. Complete PDF Layout

Recommended layout:

```text
┌─────────────────────────────────────────────────────────────┐
│ COMPANY LOGO                           PEOPLEPAY360          │
│ Company Name                                                │
│ Company Address                                             │
├─────────────────────────────────────────────────────────────┤
│                         PAYSLIP                              │
│                  September 2026 Payroll                      │
├─────────────────────────────────────────────────────────────┤
│ Employee Information              │ Payroll Information     │
│                                   │                         │
│ Aarav Mehta                       │ Payslip: PS-2026-0001   │
│ EMP-001                           │ Period: Sep 2026        │
│ Engineering                       │ Pay Date: 30 Sep 2026   │
│ Software Engineer                 │ Status: FINALIZED       │
├─────────────────────────────────────────────────────────────┤
│ EARNINGS                              AMOUNT                │
├─────────────────────────────────────────────────────────────┤
│ Basic Salary                         ₹50,000                 │
│ House Rent Allowance                 ₹20,000                 │
│ Special Allowance                    ₹10,000                 │
├─────────────────────────────────────────────────────────────┤
│ GROSS SALARY                         ₹80,000                 │
├─────────────────────────────────────────────────────────────┤
│ DEDUCTIONS                            AMOUNT                │
├─────────────────────────────────────────────────────────────┤
│ Provident Fund                        ₹6,000                 │
│ Professional Tax                      ₹2,500                 │
├─────────────────────────────────────────────────────────────┤
│ TOTAL DEDUCTIONS                      ₹8,500                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ NET SALARY                            ₹71,500                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ This is a system-generated payslip.                         │
│ Generated by PeoplePay360                                   │
└─────────────────────────────────────────────────────────────┘
```

---

# 10. Company Header

The PDF header should contain:

```text
Company Logo

Company Name

Company Address

Company Contact Information
```

Example:

```text
ABC TECHNOLOGIES PVT. LTD.

Gandhinagar, Gujarat, India

hr@abctechnologies.com
```

The exact company fields depend on the Company configuration.

---

# 11. Payslip Title

The document should clearly display:

```text
PAYSLIP
```

Optional subtitle:

```text
Payroll Period

September 2026
```

This must make the document immediately identifiable.

---

# 12. Employee Information Section

Recommended fields:

```text
Employee Name

Employee ID

Department

Job Position
```

Example:

```text
Employee Name:
Aarav Mehta

Employee ID:
EMP-001

Department:
Engineering

Job Position:
Software Engineer
```

Only include information that is available in the employee snapshot.

---

# 13. Payroll Information Section

Recommended fields:

```text
Payslip Number

Payroll Period

Period Start

Period End

Payrun Reference

Pay Date

Payslip Status
```

Example:

```text
Payslip Number:
PS-2026-0001

Period:
01 Sep 2026 – 30 Sep 2026

Pay Date:
30 Sep 2026

Status:
FINALIZED
```

---

# 14. Earnings Section

The PDF must display all applicable earning lines.

Example:

```text
EARNINGS

Basic Salary                     ₹50,000

House Rent Allowance             ₹20,000

Special Allowance                ₹10,000
```

Then:

```text
GROSS SALARY                     ₹80,000
```

---

# 15. Deductions Section

The PDF must display all employee deductions.

Example:

```text
DEDUCTIONS

Provident Fund                   ₹6,000

Professional Tax                 ₹2,500
```

Then:

```text
TOTAL DEDUCTIONS                 ₹8,500
```

---

# 16. Net Salary Highlight

The most important salary value should be visually prominent:

```text
NET SALARY

₹71,500
```

The UI and PDF should emphasize this amount.

Recommended label:

```text
NET PAY
```

or:

```text
NET SALARY
```

---

# 17. Employer Contributions

Employer contributions should be treated separately.

Example:

```text
EMPLOYER CONTRIBUTIONS

Employer PF                      ₹6,000
```

Important:

```text
Employer Contributions
≠
Employee Deductions
```

They must never accidentally reduce employee Net Salary.

---

# 18. Employee Visibility of Employer Contributions

The system should support role-based visibility.

Example:

```text
PAYROLL MANAGER

Can view:
Employer Contributions ✓
```

Employee view:

```text
Depends on company policy
```

For the hackathon MVP, one of the following approaches should be chosen consistently:

```text
OPTION A

Show Employer Contributions
in every Payslip
```

or:

```text
OPTION B

Show Employer Contributions
only to Payroll / Admin users
```

Recommended architecture:

```text
PDF template configuration
+
Role / policy-based visibility
```

---

# 19. Currency Formatting

All salary amounts must use consistent currency formatting.

Example:

```text
₹50,000
```

Not:

```text
50000

50000.0

₹50000.00
```

Recommended formatting:

```text
₹50,000.00
```

or, for a cleaner hackathon UI:

```text
₹50,000
```

The application must use one consistent format everywhere.

---

# 20. Negative Amount Formatting

Deductions should be visually understandable.

Option:

```text
Provident Fund              -₹6,000
```

Or:

```text
Provident Fund               ₹6,000
```

inside the **Deductions** section.

Recommended:

```text
Display positive values in the Deductions section
```

and calculate subtraction internally.

This creates a cleaner Payslip.

---

# 21. PDF Filename Convention

Recommended filename:

```text
Payslip_{EmployeeCode}_{Period}.pdf
```

Example:

```text
Payslip_EMP001_2026_09.pdf
```

Alternative:

```text
PS-2026-0001.pdf
```

Recommended robust format:

```text
Payslip_{PayslipNumber}_{EmployeeCode}_{Period}.pdf
```

Example:

```text
Payslip_PS-2026-0001_EMP001_2026-09.pdf
```

---

# 22. PDF Generation Modes

The system can support:

```text
ON-DEMAND GENERATION

Generate PDF when user clicks Download
```

or:

```text
GENERATE ON FINALIZATION

Automatically generate PDF when Payslip becomes FINALIZED
```

Recommended hackathon approach:

```text
Generate PDF automatically or on-demand
after FINALIZATION.
```

The architecture should support both.

---

# 23. PDF Immutability Principle

A finalized Payslip is historical payroll evidence.

Therefore:

```text
FINALIZED PAYSLIP
        ↓
GENERATE PDF
        ↓
PDF must represent stored snapshot
```

Never:

```text
Historical PDF
        ↓
Read current Salary Rules
        ↓
Generate changed historical salary
```

Always use:

```text
Payslip Snapshot

Payslip Lines

Stored Totals
```

---

# 24. PDF Regeneration

If a PDF must be regenerated:

```text
Use the same finalized Payslip snapshot.
```

The regenerated PDF must contain:

```text
Same Payslip Number

Same Payroll Period

Same Salary Lines

Same Totals

Same Net Salary
```

Only non-business metadata such as generation timestamp may differ.

---

# 25. PDF Storage Model

Recommended:

```text
payslip_documents
```

Fields:

```text
id

payslip_id

document_type

file_name

file_path

mime_type

file_size

generated_at

generated_by

created_at
```

Example:

```text
document_type:

PAYSLIP_PDF
```

---

# 26. Multiple Document Versions

For the hackathon MVP:

```text
One official PDF per finalized Payslip
```

Future enhancement:

```text
Document Versioning

Version 1

Version 2

Correction Version
```

Historical versions must never silently overwrite official documents without audit tracking.

---

# 27. PDF Download Flow

```text
USER
   │
   ▼
CLICK DOWNLOAD PAYSLIP
   │
   ▼
AUTHENTICATE USER
   │
   ▼
AUTHORIZE ACCESS
   │
   ▼
VERIFY PAYSLIP STATUS
   │
   ▼
LOAD PDF / GENERATE PDF
   │
   ▼
RETURN SECURE DOWNLOAD
```

---

# 28. Download Authorization

Before allowing download:

```text
✓ User is authenticated

✓ Payslip exists

✓ User has permission

✓ Employee can only access own Payslip

✓ User belongs to authorized company
```

---

# 29. Employee Download Rule

```text
EMPLOYEE A
        ↓
Can Download
        ↓
EMPLOYEE A PAYSLIP ✓
```

But:

```text
EMPLOYEE A
        ↓
Cannot Download
        ↓
EMPLOYEE B PAYSLIP ✗
```

Authorization must happen on the backend.

---

# 30. Secure PDF Download API

Recommended endpoint:

```http
GET /api/payslips/{payslip_id}/pdf
```

Response:

```text
application/pdf
```

The backend must validate authorization before returning the document.

---

# 31. PDF Generation API

Recommended endpoint:

```http
POST /api/payslips/{payslip_id}/generate-pdf
```

Recommended access:

```text
ADMIN

PAYROLL_MANAGER
```

Optional:

```text
SYSTEM AUTOMATION
```

when Payslip is finalized.

---

# 32. Email Delivery Purpose

The Email Delivery feature allows authorized payroll users or automated payroll workflows to deliver finalized Payslips directly to employees.

Flow:

```text
FINALIZED PAYSLIP
        ↓
GENERATE PDF
        ↓
LOAD EMPLOYEE EMAIL
        ↓
VALIDATE EMAIL
        ↓
CREATE EMAIL
        ↓
ATTACH PDF
        ↓
SEND EMAIL
        ↓
STORE DELIVERY STATUS
```

---

# 33. Email Eligibility

Before sending:

```text
✓ Payslip exists

✓ Payslip is FINALIZED

✓ Employee exists

✓ Employee email exists

✓ Email format is valid

✓ User has permission to send
```

---

# 34. Missing Employee Email

Example:

```text
Employee:
Aarav Mehta

Email:
Not Available
```

Result:

```text
PAYSLIP EMAIL FAILED

Reason:

Employee email address is not configured.
```

The Payslip itself remains valid.

---

# 35. Email Subject

Recommended:

```text
Your Payslip for September 2026
```

Alternative:

```text
PeoplePay360 — Payslip — September 2026
```

The subject should clearly identify the payroll period.

---

# 36. Email Body

Recommended professional body:

```text
Hello Aarav,

Your payslip for September 2026 is ready.

Please find your payslip attached to this email.

Payslip Number:
PS-2026-0001

Net Salary:
₹71,500

Regards,

Payroll Team
ABC Technologies Pvt. Ltd.
```

Important:

```text
The email body should not become the source of truth.

The attached finalized PDF remains the official payroll document.
```

---

# 37. Email Privacy

Salary information is highly sensitive.

Therefore:

```text
✓ Send only to authorized employee email

✓ Never expose other employee data

✓ Validate recipient email

✓ Do not include unnecessary payroll data

✓ Maintain delivery audit logs
```

---

# 38. Email Delivery Options

The system may support:

```text
SEND TO EMPLOYEE
```

and:

```text
RESEND PAYSLIP
```

Recommended future enhancement:

```text
Bulk Send
```

Example:

```text
Send Payslips
to all employees
in a finalized Payrun.
```

---

# 39. Email API

Recommended endpoint:

```http
POST /api/payslips/{payslip_id}/email
```

Optional request:

```json
{
  "send_to": "employee"
}
```

For security, avoid allowing arbitrary recipient email addresses unless the user has explicit authorization.

Recommended MVP:

```text
Always send to the employee's verified work email.
```

---

# 40. Email Delivery Status

Recommended statuses:

```text
NOT_SENT

QUEUED

SENDING

SENT

FAILED
```

Example:

```text
Payslip:
PS-2026-0001

Email Status:
SENT ✓
```

---

# 41. Email Delivery Log

Recommended table:

```text
payslip_email_logs
```

Fields:

```text
id

payslip_id

recipient_email

subject

status

sent_at

failed_at

error_message

sent_by

created_at
```

---

# 42. Email Send Flow

```text
CLICK SEND EMAIL
        │
        ▼
CHECK PERMISSION
        │
        ▼
CHECK PAYSLIP STATUS
        │
        ▼
CHECK EMPLOYEE EMAIL
        │
        ▼
GET / GENERATE PDF
        │
        ▼
CREATE EMAIL LOG
        │
        ▼
SEND EMAIL
        │
        ├───────────────┐
        ▼               ▼
SUCCESS              FAILURE
        │               │
        ▼               ▼
SENT                FAILED
```

---

# 43. Email Failure Handling

Example failure:

```text
SMTP Connection Failed
```

The system should show:

```text
Payslip email could not be sent.

The Payslip PDF is still available for download.
```

Do not mark the Payslip itself as failed.

Important separation:

```text
PAYSLIP STATUS
≠
EMAIL DELIVERY STATUS
```

Example:

```text
Payslip:
FINALIZED

Email:
FAILED
```

This is valid.

---

# 44. Retry Email Delivery

If sending fails:

```text
FAILED
    ↓
RETRY
    ↓
SENDING
    ↓
SENT / FAILED
```

The retry should create an audit event.

Example:

```text
Email delivery retried by Payroll Manager
```

---

# 45. Resend Payslip

The system should allow authorized users to resend.

Example:

```text
PS-2026-0001

Email Status:
SENT

Action:

RESEND PAYSLIP
```

The system must:

```text
✓ Use the same finalized Payslip

✓ Use the official PDF

✓ Record a new delivery log
```

---

# 46. Email Template Architecture

Recommended structure:

```text
Email Template
        +
Employee Information
        +
Payslip Information
        ↓
Rendered Email
```

Variables:

```text
{{ employee_name }}

{{ company_name }}

{{ payslip_number }}

{{ payroll_period }}

{{ net_salary }}
```

Example template:

```text
Hello {{ employee_name }},

Your payslip for {{ payroll_period }} is ready.

Payslip Number: {{ payslip_number }}

Please find the official payslip attached.

Regards,
{{ company_name }}
```

---

# 47. Email Service Architecture

Recommended backend structure:

```text
backend/
│
├── payroll/
│
│   ├── payslip_documents/
│   │
│   │   ├── pdf_service
│   │   ├── document_service
│   │   ├── email_service
│   │   ├── email_template_service
│   │   ├── delivery_log_service
│   │   └── storage_service
│
│   └── payslips/
```

---

# 48. PDF Service Responsibilities

The PDF service should:

```text
Load finalized Payslip

Load Payslip Lines

Load snapshot information

Format document data

Render PDF

Store document

Return document reference
```

---

# 49. Document Service Responsibilities

Responsible for:

```text
Create document metadata

Store document references

Retrieve documents

Validate document ownership

Support secure downloads
```

---

# 50. Email Service Responsibilities

Responsible for:

```text
Validate recipient

Prepare email

Attach PDF

Send email

Update delivery status

Handle failures

Support retry
```

---

# 51. Recommended PDF Data Structure

Conceptually:

```json
{
  "company": {
    "name": "ABC Technologies Pvt. Ltd."
  },
  "payslip": {
    "number": "PS-2026-0001",
    "period_start": "2026-09-01",
    "period_end": "2026-09-30",
    "status": "FINALIZED"
  },
  "employee": {
    "name": "Aarav Mehta",
    "employee_code": "EMP-001",
    "department": "Engineering"
  },
  "earnings": [],
  "deductions": [],
  "contributions": [],
  "totals": {
    "gross": 80000,
    "deductions": 8500,
    "net": 71500
  }
}
```

---

# 52. Frontend Payslip Detail Actions

The Payslip detail screen should provide:

```text
[ Download PDF ]

[ Send Email ]

[ View Email History ]
```

For authorized users.

Employees may see:

```text
[ Download Payslip ]
```

Only for their own finalized Payslips.

---

# 53. Recommended UI Layout

```text
┌───────────────────────────────────────────────────────────┐
│ Payslip PS-2026-0001              ● FINALIZED             │
│                                                           │
│ Aarav Mehta                                               │
│ September 2026                                            │
│                                                           │
│ [ Download PDF ]   [ Send Email ]                         │
├───────────────────────────────────────────────────────────┤
│                                                           │
│ GROSS SALARY                          ₹80,000             │
│ TOTAL DEDUCTIONS                       ₹8,500             │
│                                                           │
│ NET SALARY                             ₹71,500             │
│                                                           │
├───────────────────────────────────────────────────────────┤
│ EMAIL DELIVERY                                              │
│                                                           │
│ ● SENT                                                       │
│ Sent to: aarav@example.com                                 │
│ Sent on: 30 Sep 2026                                       │
│                                                           │
│ [ View History ]   [ Resend ]                              │
└───────────────────────────────────────────────────────────┘
```

---

# 54. Email History UI

Recommended:

```text
EMAIL HISTORY

---------------------------------------------------------

Recipient               Status       Date

aarav@example.com       SENT         30 Sep 2026

aarav@example.com       FAILED       30 Sep 2026

aarav@example.com       SENT         30 Sep 2026

---------------------------------------------------------
```

Each attempt should be independently tracked.

---

# 55. Role-Based Access Control

Recommended permissions:

```text
payslip.download

payslip.download_own

payslip.generate_pdf

payslip.email

payslip.email_history
```

---

# 56. Recommended Role Permissions

## ADMIN

```text
✓ Generate PDF

✓ Download all authorized Payslips

✓ Send Payslip Email

✓ View Email History

✓ Resend Payslip
```

---

## PAYROLL_MANAGER

```text
✓ Generate PDF

✓ Download authorized Payslips

✓ Send Email

✓ View Email History
```

---

## HR_MANAGER

Depending on company configuration:

```text
✓ View

✓ Download

Optional Email Permission
```

---

## EMPLOYEE

```text
✓ View Own Finalized Payslip

✓ Download Own PDF

✗ Send Payslip Email

✗ View Other Employee Payslips
```

---

# 57. Company Isolation

The system must enforce:

```text
Company A
```

users cannot access:

```text
Company B
```

Payslip PDFs.

This applies to:

```text
PDF Generation

PDF Download

Email Delivery

Email Logs
```

Every operation must validate company ownership.

---

# 58. Secure Document Access

Do not expose predictable public URLs such as:

```text
/files/payslip_001.pdf
```

without authorization.

Recommended architecture:

```text
USER
   ↓
Authenticated Request
   ↓
Backend Authorization
   ↓
Secure File Response
```

Alternative future approach:

```text
Temporary Signed URL
```

with expiration.

---

# 59. PDF Storage Security

The storage layer must protect:

```text
Salary Data

Employee Information

Payroll History
```

Recommended principles:

```text
Private Storage

Authorization Before Access

No Public Directory Listing

Audit Access
```

---

# 60. Audit Trail

Track important document actions.

```text
Payslip PDF Generated

Payslip PDF Downloaded

Payslip Email Sent

Payslip Email Failed

Payslip Email Retried

Payslip Email Resent
```

Example:

```text
30 Sep 2026 — 11:30 AM

Payroll Manager

Sent Payslip PS-2026-0001
to Aarav Mehta
```

---

# 61. Audit Log Fields

Recommended:

```text
id

entity_type

entity_id

action

performed_by

timestamp

metadata
```

Example metadata:

```json
{
  "recipient": "employee@company.com",
  "delivery_status": "SENT"
}
```

---

# 62. Error Handling

The system must clearly distinguish between:

```text
PDF_GENERATION_ERROR

DOCUMENT_NOT_FOUND

UNAUTHORIZED_ACCESS

EMAIL_CONFIGURATION_ERROR

EMAIL_DELIVERY_ERROR

INVALID_RECIPIENT_EMAIL
```

---

# 63. PDF Generation Error

Example:

```text
Unable to generate Payslip PDF.

Please try again.
```

Detailed backend log:

```text
PDF_TEMPLATE_RENDER_ERROR
```

Sensitive internal details should not be exposed to normal users.

---

# 64. Unauthorized Download Error

Example:

```text
403 Forbidden

You do not have permission
to access this Payslip.
```

---

# 65. Email Configuration Error

Example:

```text
Email delivery service is not configured.
```

The Payslip remains available for PDF download.

---

# 66. API Summary

## Generate PDF

```http
POST /api/payslips/{payslip_id}/generate-pdf
```

---

## Download PDF

```http
GET /api/payslips/{payslip_id}/pdf
```

---

## Send Email

```http
POST /api/payslips/{payslip_id}/email
```

---

## Get Email History

```http
GET /api/payslips/{payslip_id}/email-history
```

---

## Resend Email

```http
POST /api/payslips/{payslip_id}/resend-email
```

---

# 67. Example Email API Response

```json
{
  "payslip_id": 501,
  "email_status": "SENT",
  "recipient": "aarav@example.com",
  "sent_at": "2026-09-30T11:30:00Z"
}
```

---

# 68. Database Design

## Payslip Documents

```text
payslip_documents
```

```text
id

payslip_id

document_type

file_name

file_path

mime_type

file_size

generated_at

generated_by

created_at
```

---

## Payslip Email Logs

```text
payslip_email_logs
```

```text
id

payslip_id

recipient_email

subject

status

sent_at

failed_at

error_message

sent_by

created_at
```

---

# 69. Transaction Considerations

PDF generation:

```text
LOAD FINALIZED PAYSLIP
        ↓
VALIDATE
        ↓
RENDER PDF
        ↓
STORE DOCUMENT
        ↓
CREATE DOCUMENT RECORD
```

If storage fails:

```text
Do not create a false successful document record.
```

---

# 70. Email Transaction Considerations

The email workflow should:

```text
Create delivery attempt

        ↓

Attempt send

        ↓

Update result
```

Do not assume that:

```text
Request Accepted
=
Email Successfully Delivered
```

For the hackathon MVP:

```text
SENT
```

can represent successful handoff to the configured email provider.

---

# 71. Background Processing

For future scalability:

```text
PAYSLIP FINALIZED
        ↓
QUEUE EMAIL JOB
        ↓
BACKGROUND WORKER
        ↓
SEND EMAIL
```

For the hackathon MVP:

```text
Synchronous sending is acceptable
```

if the architecture keeps email delivery isolated in a service.

---

# 72. Bulk Payslip Email

Future feature:

```text
FINALIZED PAYRUN
        ↓
SELECT ALL EMPLOYEES
        ↓
FOR EACH PAYSLIP
        ↓
SEND EMAIL
```

UI:

```text
[ Send All Payslips ]
```

The system should show:

```text
Total

Sent

Failed

Pending
```

---

# 73. Privacy Considerations for Bulk Email

Never:

```text
Send all employee Payslips
in one shared email.
```

Correct:

```text
One employee
        ↓
One private email
        ↓
One private Payslip attachment
```

---

# 74. Testing Requirements

## Test 1 — Generate PDF

Input:

```text
FINALIZED Payslip
```

Expected:

```text
PDF generated successfully.
```

---

## Test 2 — PDF Content

Expected PDF contains:

```text
Employee Information

Payroll Period

Earnings

Deductions

Gross Salary

Net Salary
```

---

## Test 3 — Draft Payslip

Attempt:

```text
Generate Official PDF
```

Expected:

```text
Rejected
```

or clearly marked preview if preview functionality exists.

---

## Test 4 — Employee Download

Employee downloads own Payslip.

Expected:

```text
Success
```

---

## Test 5 — Unauthorized Download

Employee A attempts Employee B Payslip download.

Expected:

```text
403 Forbidden
```

---

## Test 6 — Email Sending

Valid:

```text
FINALIZED Payslip

Valid Employee Email
```

Expected:

```text
Email Status = SENT
```

---

## Test 7 — Missing Email

Expected:

```text
Email Status = FAILED
```

with a clear reason.

---

## Test 8 — Email Failure

Expected:

```text
Payslip remains FINALIZED

PDF remains downloadable

Email Status = FAILED
```

---

## Test 9 — Resend Email

Expected:

```text
New Email Log Entry
```

without changing the Payslip.

---

## Test 10 — Historical PDF

Change employee contract after Payslip finalization.

Regenerate old PDF.

Expected:

```text
Old finalized salary values remain unchanged.
```

---

# 75. Definition of Done

## PDF

* [ ] Finalized Payslip validation
* [ ] Professional PDF template
* [ ] Company Header
* [ ] Employee Information
* [ ] Payroll Information
* [ ] Earnings Section
* [ ] Deductions Section
* [ ] Gross Salary
* [ ] Net Salary Highlight
* [ ] PDF Storage
* [ ] Secure Download

## Email

* [ ] Employee Email Validation
* [ ] Email Template
* [ ] PDF Attachment
* [ ] Send Email
* [ ] Delivery Status
* [ ] Failure Handling
* [ ] Retry
* [ ] Resend
* [ ] Email History

## Security

* [ ] Authentication
* [ ] RBAC
* [ ] Employee Own Payslip Restriction
* [ ] Company Isolation
* [ ] Backend Authorization
* [ ] Secure File Access

## Reliability

* [ ] Historical Snapshot Preservation
* [ ] PDF Consistency
* [ ] No Duplicate Official Documents
* [ ] Email Audit Logs
* [ ] Clear Error Messages

---

# 76. Recommended Hackathon MVP

The MVP should implement:

```text
✓ Professional Payslip View

✓ PDF Generation

✓ Download PDF

✓ Finalized Payslip Only

✓ Employee Information

✓ Earnings Breakdown

✓ Deductions Breakdown

✓ Gross Salary

✓ Net Salary

✓ Send Payslip by Email

✓ Email Delivery Status

✓ Role-Based Access

✓ Employee Can Download Own Payslip

✓ Historical Payslip Consistency
```

---

# 77. Strong Bonus Features

```text
✓ Company Logo in PDF

✓ Employer Contribution Section

✓ Calculation Trace Attachment

✓ Email History

✓ Retry Failed Emails

✓ Bulk Payslip Email

✓ Signed Secure Download URLs

✓ PDF Versioning

✓ Password-Protected PDF

✓ Employee Self-Service Portal
```

---

# 78. Recommended Hackathon Demo Flow

```text
STEP 1

Complete Payroll Calculation

        ↓

STEP 2

Open Employee Payslip

        ↓

STEP 3

Show:

Earnings

Deductions

Net Salary

        ↓

STEP 4

Click:

FINALIZE PAYSLIP

        ↓

STEP 5

Status changes:

FINALIZED ✓

        ↓

STEP 6

Click:

DOWNLOAD PDF

        ↓

STEP 7

Show Professional Payslip PDF

        ↓

STEP 8

Return to Payslip

        ↓

STEP 9

Click:

SEND EMAIL

        ↓

STEP 10

System validates Employee Email

        ↓

STEP 11

Attach Official Payslip PDF

        ↓

STEP 12

Email Status:

SENT ✓
```

---

# 79. Complete End-to-End Document Flow

```text
PAYRUN
        ↓
EMPLOYEE PAYROLL PROCESSING
        ↓
SALARY RULES ENGINE
        ↓
PAYSLIP COMPUTATION
        ↓
EARNINGS + DEDUCTIONS
        ↓
GROSS + NET SALARY
        ↓
PAYSLIP REVIEW
        ↓
FINALIZATION
        ↓
OFFICIAL PAYROLL SNAPSHOT
        ↓
PDF GENERATION
        ↓
        ┌───────────────┐
        ▼               ▼
DOWNLOAD            EMAIL DELIVERY
        │               │
        ▼               ▼
EMPLOYEE          EMPLOYEE
```

---

# 80. Final Principle

The **Payslip PDF & Email module** is the final employee-facing stage of the PeoplePay360 payroll workflow.

It transforms:

```text
FINALIZED PAYROLL DATA
        ↓
PROFESSIONAL PAYSLIP
        ↓
SECURE PDF
        ↓
PRIVATE EMPLOYEE DELIVERY
```

The final solution must ensure that every Payslip is:

```text
Accurate

Professional

Readable

Secure

Private

Traceable

Consistent with finalized payroll data

Accessible only to authorized users
```

The responsibility boundary is:

```text
PAYSLIP COMPUTATION
→ Creates the official salary result

PAYSLIP FINALIZATION
→ Locks the payroll result

PDF MODULE
→ Creates the professional document

EMAIL MODULE
→ Delivers the document securely

EMPLOYEE PORTAL
→ Allows employees to access their own Payslips
```

This makes the PeoplePay360 payroll platform feel like a complete, real-world HR and Payroll Management System suitable for the Odoo Final Hackathon.

```
```