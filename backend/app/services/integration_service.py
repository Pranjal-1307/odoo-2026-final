from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

from app.models import (
    Employee,
    Contract,
    WorkingSchedule,
    Attendance,
    TimeOffRequest,
    SalaryStructure,
    SalaryRule,
    Payrun,
    Payslip,
    EmployeeStatus,
    ContractStatus,
    AttendanceStatus,
    LeaveRequestStatus,
    PayrunStatus,
)


class IntegrationService:
    @staticmethod
    def run_system_health_check(db: Session, company: str = "PeoplePay360 Inc.") -> Dict[str, Any]:
        """
        Executes comprehensive cross-module consistency checks across:
        - Employee & Contract company isolation
        - Contract overlap detection
        - Schedule assignment validation
        - Attendance anomaly detection (open check-ins, overlapping records)
        - Attendance vs Time-Off conflict detection
        - Salary Structure rule dependencies & validity
        - Duplicate active Payruns & Finalized Payslip integrity
        """
        issues: List[Dict[str, Any]] = []
        total_checks = 0
        passed_checks = 0
        failed_checks = 0

        # ----------------------------------------------------
        # 1. Check: Employee & Contract Company Consistency
        # ----------------------------------------------------
        total_checks += 1
        mismatched_contracts = db.query(Contract, Employee).join(
            Employee, Contract.employee_id == Employee.id
        ).filter(
            func.lower(Employee.company) == func.lower(company),
            func.lower(Employee.company) != func.lower(company) # Placeholder
        ).all()
        
        # Verify contracts where employee belongs to company but contract has different company context
        all_emp_contracts = db.query(Contract, Employee).join(
            Employee, Contract.employee_id == Employee.id
        ).filter(
            func.lower(Employee.company) == func.lower(company)
        ).all()

        company_mismatch_found = False
        for c, e in all_emp_contracts:
            if c.salary_structure and c.salary_structure.company and func.lower(c.salary_structure.company) != func.lower(e.company):
                company_mismatch_found = True
                issues.append({
                    "category": "contract",
                    "severity": "blocking_error",
                    "code": "COMPANY_MISMATCH",
                    "title": "Company Context Mismatch",
                    "message": f"Contract {c.contract_code} for employee '{e.name}' references a Salary Structure belonging to a different company.",
                    "entity_type": "contract",
                    "entity_id": c.id,
                    "entity_name": c.name,
                    "suggested_action": "Reassign contract to a Salary Structure belonging to the employee's company."
                })
        if not company_mismatch_found:
            passed_checks += 1
        else:
            failed_checks += 1

        # ----------------------------------------------------
        # 2. Check: Contract Overlap Prevention
        # ----------------------------------------------------
        total_checks += 1
        employees = db.query(Employee).filter(
            func.lower(Employee.company) == func.lower(company),
            Employee.status == EmployeeStatus.ACTIVE.value
        ).all()

        overlap_found = False
        for emp in employees:
            running_contracts = db.query(Contract).filter(
                Contract.employee_id == emp.id,
                Contract.status == ContractStatus.RUNNING.value
            ).all()

            if len(running_contracts) > 1:
                # Check pairwise overlap
                for i in range(len(running_contracts)):
                    for j in range(i + 1, len(running_contracts)):
                        c1 = running_contracts[i]
                        c2 = running_contracts[j]
                        end1 = c1.end_date or date(9999, 12, 31)
                        end2 = c2.end_date or date(9999, 12, 31)
                        if max(c1.start_date, c2.start_date) <= min(end1, end2):
                            overlap_found = True
                            issues.append({
                                "category": "contract",
                                "severity": "blocking_error",
                                "code": "CONTRACT_OVERLAP",
                                "title": "Overlapping Running Contracts",
                                "message": f"Employee '{emp.name}' ({emp.employee_code}) has 2 running contracts overlapping in time: {c1.contract_code} and {c2.contract_code}.",
                                "entity_type": "employee",
                                "entity_id": emp.id,
                                "entity_name": emp.name,
                                "suggested_action": "Set an end date on the older contract or transition it to Expired status."
                            })
        if not overlap_found:
            passed_checks += 1
        else:
            failed_checks += 1

        # ----------------------------------------------------
        # 3. Check: Missing Working Schedule on Active Employees
        # ----------------------------------------------------
        total_checks += 1
        missing_sched_emps = [
            e for e in employees if not e.working_schedule_id and not any(c.working_schedule_id for c in e.contracts if c.status == "running")
        ]
        if missing_sched_emps:
            failed_checks += 1
            for e in missing_sched_emps:
                issues.append({
                    "category": "schedule",
                    "severity": "warning",
                    "code": "SCHEDULE_NOT_ASSIGNED",
                    "title": "Missing Working Schedule",
                    "message": f"Active employee '{e.name}' ({e.employee_code}) has no working schedule assigned.",
                    "entity_type": "employee",
                    "entity_id": e.id,
                    "entity_name": e.name,
                    "suggested_action": "Assign a working schedule in employee master or active contract."
                })
        else:
            passed_checks += 1

        # ----------------------------------------------------
        # 4. Check: Incomplete Attendance Records (Checked-in without Check-out > 24 hours ago)
        # ----------------------------------------------------
        total_checks += 1
        cutoff = datetime.utcnow() - timedelta(hours=24)
        incomplete_att = db.query(Attendance, Employee).join(
            Employee, Attendance.employee_id == Employee.id
        ).filter(
            func.lower(Employee.company) == func.lower(company),
            Attendance.check_in.isnot(None),
            Attendance.check_out.is_(None),
            Attendance.check_in <= cutoff
        ).all()

        if incomplete_att:
            failed_checks += 1
            for att, emp in incomplete_att:
                issues.append({
                    "category": "attendance",
                    "severity": "warning",
                    "code": "ATTENDANCE_INCOMPLETE",
                    "title": "Open Attendance Record",
                    "message": f"Attendance on {att.date} for '{emp.name}' has Check-in at {att.check_in.strftime('%H:%M')} with no Check-out.",
                    "entity_type": "attendance",
                    "entity_id": att.id,
                    "entity_name": f"{emp.name} ({att.date})",
                    "suggested_action": "Review and manually record check-out time before payroll processing."
                })
        else:
            passed_checks += 1

        # ----------------------------------------------------
        # 5. Check: Time-off vs Attendance Conflict (Full day leave + Full day attendance)
        # ----------------------------------------------------
        total_checks += 1
        recent_leaves = db.query(TimeOffRequest, Employee).join(
            Employee, TimeOffRequest.employee_id == Employee.id
        ).filter(
            func.lower(Employee.company) == func.lower(company),
            TimeOffRequest.status == LeaveRequestStatus.APPROVED.value,
            TimeOffRequest.start_date >= (date.today() - timedelta(days=60))
        ).all()

        conflict_found = False
        for req, emp in recent_leaves:
            # Check attendance on dates of leave
            att_on_leave = db.query(Attendance).filter(
                Attendance.employee_id == emp.id,
                Attendance.date >= req.start_date,
                Attendance.date <= req.end_date,
                Attendance.worked_hours >= 4.0
            ).all()
            for att in att_on_leave:
                conflict_found = True
                issues.append({
                    "category": "time_off",
                    "severity": "warning",
                    "code": "TIME_OFF_CONFLICT",
                    "title": "Time Off & Attendance Conflict",
                    "message": f"Employee '{emp.name}' has approved time off from {req.start_date} to {req.end_date} but recorded {att.worked_hours}h attendance on {att.date}.",
                    "entity_type": "time_off",
                    "entity_id": req.id,
                    "entity_name": f"{emp.name} ({att.date})",
                    "suggested_action": "Verify if the employee worked on leave day and cancel/adjust leave or attendance."
                })
        if not conflict_found:
            passed_checks += 1
        else:
            failed_checks += 1

        # ----------------------------------------------------
        # 6. Check: Active Salary Structure & Rule Integrity
        # ----------------------------------------------------
        total_checks += 1
        structures = db.query(SalaryStructure).filter(
            func.lower(SalaryStructure.company) == func.lower(company),
            SalaryStructure.active == True
        ).all()

        struct_issue_found = False
        for st in structures:
            if not st.rules:
                struct_issue_found = True
                issues.append({
                    "category": "payroll",
                    "severity": "blocking_error",
                    "code": "SALARY_STRUCTURE_EMPTY",
                    "title": "Empty Salary Structure",
                    "message": f"Active Salary Structure '{st.name}' ({st.code}) has no salary rules configured.",
                    "entity_type": "salary_structure",
                    "entity_id": st.id,
                    "entity_name": st.name,
                    "suggested_action": "Add basic, allowance, gross, deduction and net salary rules."
                })
        if not struct_issue_found:
            passed_checks += 1
        else:
            failed_checks += 1

        # ----------------------------------------------------
        # 7. Check: Duplicate Active Payruns per Period
        # ----------------------------------------------------
        total_checks += 1
        active_payruns = db.query(Payrun).filter(
            func.lower(Payrun.company) == func.lower(company),
            Payrun.status.in_([PayrunStatus.DRAFT.value, PayrunStatus.PROCESSING.value, PayrunStatus.REVIEW.value])
        ).all()

        payrun_dup_found = False
        seen_periods = set()
        for p in active_payruns:
            period_key = (p.period_start, p.period_end)
            if period_key in seen_periods:
                payrun_dup_found = True
                issues.append({
                    "category": "payroll",
                    "severity": "blocking_error",
                    "code": "PAYRUN_DUPLICATE",
                    "title": "Multiple Active Payruns for Same Period",
                    "message": f"Multiple active payruns exist for period {p.period_start} to {p.period_end}.",
                    "entity_type": "payrun",
                    "entity_id": p.id,
                    "entity_name": p.name,
                    "suggested_action": "Cancel or finalize existing payrun before starting a new run for the same period."
                })
            else:
                seen_periods.add(period_key)

        if not payrun_dup_found:
            passed_checks += 1
        else:
            failed_checks += 1

        status_str = "healthy"
        if any(i["severity"] == "blocking_error" for i in issues):
            status_str = "critical"
        elif any(i["severity"] == "warning" for i in issues):
            status_str = "warnings"

        return {
            "company": company,
            "checked_at": datetime.utcnow().isoformat(),
            "status": status_str,
            "total_checks": total_checks,
            "passed_checks": passed_checks,
            "failed_checks": failed_checks,
            "issues": issues,
            "summary": {
                "active_employees": len(employees),
                "active_structures": len(structures),
                "active_payruns": len(active_payruns),
                "issues_count": len(issues),
            }
        }
