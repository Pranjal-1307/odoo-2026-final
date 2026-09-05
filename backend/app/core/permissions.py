from typing import Set, Dict, List

# Permission Constants
class Permissions:
    # Employee Permissions
    EMPLOYEE_READ = "employee.read"
    EMPLOYEE_CREATE = "employee.create"
    EMPLOYEE_UPDATE = "employee.update"
    EMPLOYEE_DELETE = "employee.delete"
    EMPLOYEE_SELF_READ = "employee.self.read"
    EMPLOYEE_SELF_UPDATE = "employee.self.update"

    # Contract Permissions
    CONTRACT_READ = "contract.read"
    CONTRACT_CREATE = "contract.create"
    CONTRACT_UPDATE = "contract.update"
    CONTRACT_DELETE = "contract.delete"

    # Working Schedule Permissions
    SCHEDULE_READ = "schedule.read"
    SCHEDULE_CREATE = "schedule.create"
    SCHEDULE_UPDATE = "schedule.update"
    SCHEDULE_DELETE = "schedule.delete"

    # Attendance Permissions
    ATTENDANCE_READ = "attendance.read"
    ATTENDANCE_CREATE = "attendance.create"
    ATTENDANCE_UPDATE = "attendance.update"
    ATTENDANCE_DELETE = "attendance.delete"
    ATTENDANCE_SELF_READ = "attendance.self.read"
    ATTENDANCE_SELF_CREATE = "attendance.self.create"

    # Time Off Permissions
    TIMEOFF_READ = "timeoff.read"
    TIMEOFF_CREATE = "timeoff.create"
    TIMEOFF_UPDATE = "timeoff.update"
    TIMEOFF_APPROVE = "timeoff.approve"
    TIMEOFF_REFUSE = "timeoff.refuse"
    TIMEOFF_DELETE = "timeoff.delete"
    TIMEOFF_SELF_READ = "timeoff.self.read"
    TIMEOFF_SELF_CREATE = "timeoff.self.create"

    # Allocation Permissions
    ALLOCATION_READ = "allocation.read"
    ALLOCATION_CREATE = "allocation.create"
    ALLOCATION_UPDATE = "allocation.update"
    ALLOCATION_APPROVE = "allocation.approve"
    ALLOCATION_REFUSE = "allocation.refuse"

    # Payrun Permissions
    PAYRUN_READ = "payrun.read"
    PAYRUN_CREATE = "payrun.create"
    PAYRUN_COMPUTE = "payrun.compute"
    PAYRUN_VALIDATE = "payrun.validate"
    PAYRUN_MARK_PAID = "payrun.mark_paid"
    PAYRUN_SEND = "payrun.send"
    PAYRUN_DELETE = "payrun.delete"

    # Payslip Permissions
    PAYSLIP_READ = "payslip.read"
    PAYSLIP_CREATE = "payslip.create"
    PAYSLIP_UPDATE = "payslip.update"
    PAYSLIP_PDF = "payslip.pdf"
    PAYSLIP_EMAIL = "payslip.email"
    PAYSLIP_SELF_READ = "payslip.self.read"
    PAYSLIP_SELF_PDF = "payslip.self.pdf"

    # Salary Structure Permissions
    SALARY_STRUCTURE_READ = "salary_structure.read"
    SALARY_STRUCTURE_CREATE = "salary_structure.create"
    SALARY_STRUCTURE_UPDATE = "salary_structure.update"
    SALARY_STRUCTURE_DELETE = "salary_structure.delete"

    # Salary Rule Permissions
    SALARY_RULE_READ = "salary_rule.read"
    SALARY_RULE_CREATE = "salary_rule.create"
    SALARY_RULE_UPDATE = "salary_rule.update"
    SALARY_RULE_DELETE = "salary_rule.delete"

    # User Management Permissions
    USER_READ = "user.read"
    USER_CREATE = "user.create"
    USER_UPDATE = "user.update"
    USER_DELETE = "user.delete"
    USER_ASSIGN_ROLE = "user.assign_role"

    # Dashboard Permissions
    DASHBOARD_EMPLOYEE = "dashboard.employee"
    DASHBOARD_HR = "dashboard.hr"
    DASHBOARD_PAYROLL = "dashboard.payroll"
    DASHBOARD_ADMIN = "dashboard.admin"


# Role to Permissions Mapping
# Canonical roles supported: "Admin", "HR Payroll Manager", "HR Payroll User", "HR Manager", "Employee"
# Also supporting lowercase internal identifiers if used.

ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    # 1. Employee
    "Employee": {
        Permissions.EMPLOYEE_SELF_READ,
        Permissions.ATTENDANCE_SELF_READ,
        Permissions.ATTENDANCE_SELF_CREATE,
        Permissions.TIMEOFF_SELF_READ,
        Permissions.TIMEOFF_SELF_CREATE,
        Permissions.PAYSLIP_SELF_READ,
        Permissions.PAYSLIP_SELF_PDF,
        Permissions.DASHBOARD_EMPLOYEE,
    },
    
    # 2. HR Manager
    "HR Manager": {
        # Self permissions
        Permissions.EMPLOYEE_SELF_READ,
        Permissions.ATTENDANCE_SELF_READ,
        Permissions.ATTENDANCE_SELF_CREATE,
        Permissions.TIMEOFF_SELF_READ,
        Permissions.TIMEOFF_SELF_CREATE,
        Permissions.PAYSLIP_SELF_READ,
        Permissions.PAYSLIP_SELF_PDF,
        # Full HR management
        Permissions.EMPLOYEE_READ,
        Permissions.EMPLOYEE_CREATE,
        Permissions.EMPLOYEE_UPDATE,
        Permissions.EMPLOYEE_DELETE,
        Permissions.CONTRACT_READ,
        Permissions.CONTRACT_CREATE,
        Permissions.CONTRACT_UPDATE,
        Permissions.CONTRACT_DELETE,
        Permissions.SCHEDULE_READ,
        Permissions.SCHEDULE_CREATE,
        Permissions.SCHEDULE_UPDATE,
        Permissions.SCHEDULE_DELETE,
        Permissions.ATTENDANCE_READ,
        Permissions.ATTENDANCE_CREATE,
        Permissions.ATTENDANCE_UPDATE,
        Permissions.ATTENDANCE_DELETE,
        Permissions.TIMEOFF_READ,
        Permissions.TIMEOFF_CREATE,
        Permissions.TIMEOFF_UPDATE,
        Permissions.TIMEOFF_APPROVE,
        Permissions.TIMEOFF_REFUSE,
        Permissions.TIMEOFF_DELETE,
        Permissions.ALLOCATION_READ,
        Permissions.ALLOCATION_CREATE,
        Permissions.ALLOCATION_UPDATE,
        Permissions.ALLOCATION_APPROVE,
        Permissions.ALLOCATION_REFUSE,
        Permissions.DASHBOARD_HR,
    },

    # 3. HR Payroll User (Operational Payroll + HR, Read-only Structures & Rules)
    "HR Payroll User": {
        # All HR Manager permissions
        Permissions.EMPLOYEE_SELF_READ,
        Permissions.ATTENDANCE_SELF_READ,
        Permissions.ATTENDANCE_SELF_CREATE,
        Permissions.TIMEOFF_SELF_READ,
        Permissions.TIMEOFF_SELF_CREATE,
        Permissions.PAYSLIP_SELF_READ,
        Permissions.PAYSLIP_SELF_PDF,
        Permissions.EMPLOYEE_READ,
        Permissions.EMPLOYEE_CREATE,
        Permissions.EMPLOYEE_UPDATE,
        Permissions.EMPLOYEE_DELETE,
        Permissions.CONTRACT_READ,
        Permissions.CONTRACT_CREATE,
        Permissions.CONTRACT_UPDATE,
        Permissions.CONTRACT_DELETE,
        Permissions.SCHEDULE_READ,
        Permissions.SCHEDULE_CREATE,
        Permissions.SCHEDULE_UPDATE,
        Permissions.SCHEDULE_DELETE,
        Permissions.ATTENDANCE_READ,
        Permissions.ATTENDANCE_CREATE,
        Permissions.ATTENDANCE_UPDATE,
        Permissions.ATTENDANCE_DELETE,
        Permissions.TIMEOFF_READ,
        Permissions.TIMEOFF_CREATE,
        Permissions.TIMEOFF_UPDATE,
        Permissions.TIMEOFF_APPROVE,
        Permissions.TIMEOFF_REFUSE,
        Permissions.TIMEOFF_DELETE,
        Permissions.ALLOCATION_READ,
        Permissions.ALLOCATION_CREATE,
        Permissions.ALLOCATION_UPDATE,
        Permissions.ALLOCATION_APPROVE,
        Permissions.ALLOCATION_REFUSE,
        # Operational Payroll
        Permissions.PAYRUN_READ,
        Permissions.PAYRUN_CREATE,
        Permissions.PAYRUN_COMPUTE,
        Permissions.PAYSLIP_READ,
        Permissions.PAYSLIP_CREATE,
        Permissions.PAYSLIP_UPDATE,
        Permissions.PAYSLIP_PDF,
        # Read-only configuration
        Permissions.SALARY_STRUCTURE_READ,
        Permissions.SALARY_RULE_READ,
        Permissions.DASHBOARD_HR,
        Permissions.DASHBOARD_PAYROLL,
    },

    # 4. HR Payroll Manager (Full HR + Full Payroll & Salary Structures/Rules configuration)
    "HR Payroll Manager": {
        # All HR Manager + Payroll User permissions
        Permissions.EMPLOYEE_SELF_READ,
        Permissions.ATTENDANCE_SELF_READ,
        Permissions.ATTENDANCE_SELF_CREATE,
        Permissions.TIMEOFF_SELF_READ,
        Permissions.TIMEOFF_SELF_CREATE,
        Permissions.PAYSLIP_SELF_READ,
        Permissions.PAYSLIP_SELF_PDF,
        Permissions.EMPLOYEE_READ,
        Permissions.EMPLOYEE_CREATE,
        Permissions.EMPLOYEE_UPDATE,
        Permissions.EMPLOYEE_DELETE,
        Permissions.CONTRACT_READ,
        Permissions.CONTRACT_CREATE,
        Permissions.CONTRACT_UPDATE,
        Permissions.CONTRACT_DELETE,
        Permissions.SCHEDULE_READ,
        Permissions.SCHEDULE_CREATE,
        Permissions.SCHEDULE_UPDATE,
        Permissions.SCHEDULE_DELETE,
        Permissions.ATTENDANCE_READ,
        Permissions.ATTENDANCE_CREATE,
        Permissions.ATTENDANCE_UPDATE,
        Permissions.ATTENDANCE_DELETE,
        Permissions.TIMEOFF_READ,
        Permissions.TIMEOFF_CREATE,
        Permissions.TIMEOFF_UPDATE,
        Permissions.TIMEOFF_APPROVE,
        Permissions.TIMEOFF_REFUSE,
        Permissions.TIMEOFF_DELETE,
        Permissions.ALLOCATION_READ,
        Permissions.ALLOCATION_CREATE,
        Permissions.ALLOCATION_UPDATE,
        Permissions.ALLOCATION_APPROVE,
        Permissions.ALLOCATION_REFUSE,
        # Full Payroll Execution
        Permissions.PAYRUN_READ,
        Permissions.PAYRUN_CREATE,
        Permissions.PAYRUN_COMPUTE,
        Permissions.PAYRUN_VALIDATE,
        Permissions.PAYRUN_MARK_PAID,
        Permissions.PAYRUN_SEND,
        Permissions.PAYRUN_DELETE,
        Permissions.PAYSLIP_READ,
        Permissions.PAYSLIP_CREATE,
        Permissions.PAYSLIP_UPDATE,
        Permissions.PAYSLIP_PDF,
        Permissions.PAYSLIP_EMAIL,
        # Full Salary Configuration
        Permissions.SALARY_STRUCTURE_READ,
        Permissions.SALARY_STRUCTURE_CREATE,
        Permissions.SALARY_STRUCTURE_UPDATE,
        Permissions.SALARY_STRUCTURE_DELETE,
        Permissions.SALARY_RULE_READ,
        Permissions.SALARY_RULE_CREATE,
        Permissions.SALARY_RULE_UPDATE,
        Permissions.SALARY_RULE_DELETE,
        Permissions.DASHBOARD_HR,
        Permissions.DASHBOARD_PAYROLL,
    },

    # 5. Admin (Full system access)
    "Admin": {
        "*"  # Superuser wildcard
    }
}

# Alias mapping for lowercase role names
ROLE_ALIASES = {
    "admin": "Admin",
    "hr_payroll_manager": "HR Payroll Manager",
    "hr_payroll_user": "HR Payroll User",
    "hr_manager": "HR Manager",
    "employee": "Employee"
}

def normalize_role(role: str) -> str:
    """Normalizes role strings to standard capitalized forms."""
    if not role:
        return "Employee"
    return ROLE_ALIASES.get(role.lower().replace(" ", "_"), role)

def get_role_permissions(role: str) -> Set[str]:
    """Returns the set of permissions granted to a given role."""
    norm_role = normalize_role(role)
    return ROLE_PERMISSIONS.get(norm_role, set())

def has_permission(role: str, permission: str) -> bool:
    """Checks if a given role has a specific permission."""
    norm_role = normalize_role(role)
    perms = ROLE_PERMISSIONS.get(norm_role, set())
    if "*" in perms:
        return True
    return permission in perms
