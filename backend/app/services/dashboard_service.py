from datetime import datetime, date, timedelta
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc

from app.models import (
    Employee, EmployeeStatus,
    Contract, ContractStatus,
    Payrun, PayrunStatus, PayrunEmployee, PayrunEmployeeStatus,
    Payslip, PayslipStatus,
    TimeOffRequest, LeaveRequestStatus,
    TimeOffAllocation, AllocationStatus,
    Attendance, AttendanceStatus,
    PayrollWarning,
    User
)
from app.core.permissions import has_permission, Permissions, normalize_role
from app.schemas.dashboard import (
    EmployeeKpiSummary,
    ContractKpiSummary,
    PayrunSummary,
    PayrollFinancialSummary,
    PayrollTrendItem,
    DepartmentPayrollItem,
    PendingAlertItem,
    RecentActivityItem,
    RecentPayrunItem,
    DashboardResponse,
    EmployeeDashboardResponse,
    EmployeePayslipItem
)

class DashboardService:
    @staticmethod
    def get_company_dashboard(
        db: Session,
        current_user: User,
        period: Optional[str] = None,
        department: Optional[str] = None
    ) -> DashboardResponse:
        user_role = normalize_role(current_user.role)
        can_view_financials = user_role in {"Admin", "HR Payroll Manager", "HR Payroll User"}
        
        # 1. Resolve company context
        company = "PeoplePay360 Inc."
        if current_user.employee and current_user.employee.company:
            company = current_user.employee.company

        # 2. Available periods from Payruns & Payslips
        payrun_periods = db.query(Payrun.period_start, Payrun.period_end).filter(
            Payrun.company == company
        ).order_by(desc(Payrun.period_start)).all()
        
        available_periods_set = set()
        for p_start, _ in payrun_periods:
            if p_start:
                available_periods_set.add(p_start.strftime("%Y-%m"))
        
        # Also check payslips
        payslip_periods = db.query(Payslip.period_start).filter(
            Payslip.company == company
        ).distinct().all()
        for (p_start,) in payslip_periods:
            if p_start:
                available_periods_set.add(p_start.strftime("%Y-%m"))
                
        # Default to current month if no periods exist
        today = date.today()
        current_period_str = today.strftime("%Y-%m")
        available_periods_set.add(current_period_str)
        
        # Sorted list of periods desc
        available_periods = sorted(list(available_periods_set), reverse=True)
        selected_period = period if period and period in available_periods_set else (available_periods[0] if available_periods else current_period_str)

        # Parse selected period into start and end of month
        try:
            year, month = map(int, selected_period.split("-"))
            period_start_date = date(year, month, 1)
            # Find last day of month
            if month == 12:
                period_end_date = date(year + 1, 1, 1) - timedelta(days=1)
            else:
                period_end_date = date(year, month + 1, 1) - timedelta(days=1)
        except Exception:
            period_start_date = date(today.year, today.month, 1)
            period_end_date = today

        # 3. Employee KPIs
        emp_query = db.query(Employee).filter(Employee.company == company)
        if department:
            emp_query = emp_query.filter(Employee.department == department)
        
        employees_list = emp_query.all()
        total_employees = len(employees_list)
        active_employees = sum(1 for e in employees_list if e.status == EmployeeStatus.ACTIVE.value)
        on_leave_employees = sum(1 for e in employees_list if e.status == EmployeeStatus.ON_LEAVE.value)
        inactive_employees = sum(1 for e in employees_list if e.status in [EmployeeStatus.INACTIVE.value, EmployeeStatus.TERMINATED.value])
        
        first_of_month = date(today.year, today.month, 1)
        new_this_month = sum(1 for e in employees_list if e.created_at and e.created_at.date() >= first_of_month)

        dept_counts: Dict[str, int] = {}
        for e in employees_list:
            d_name = e.department or "General"
            dept_counts[d_name] = dept_counts.get(d_name, 0) + 1

        employee_kpis = EmployeeKpiSummary(
            total=total_employees,
            active=active_employees,
            on_leave=on_leave_employees,
            inactive=inactive_employees,
            new_this_month=new_this_month,
            department_counts=dept_counts
        )

        # 4. Contract KPIs
        contract_query = db.query(Contract).join(Employee, Contract.employee_id == Employee.id).filter(Employee.company == company)
        if department:
            contract_query = contract_query.filter(Employee.department == department)
        
        all_contracts = contract_query.all()
        active_contracts = 0
        draft_contracts = 0
        expired_contracts = 0
        expiring_soon_contracts = 0
        thirty_days_ahead = today + timedelta(days=30)

        for c in all_contracts:
            if c.status == ContractStatus.RUNNING.value:
                active_contracts += 1
                if c.end_date and today <= c.end_date <= thirty_days_ahead:
                    expiring_soon_contracts += 1
            elif c.status == ContractStatus.DRAFT.value:
                draft_contracts += 1
            elif c.status == ContractStatus.EXPIRED.value:
                expired_contracts += 1

        contract_kpis = ContractKpiSummary(
            total=len(all_contracts),
            active=active_contracts,
            expiring_soon=expiring_soon_contracts,
            draft=draft_contracts,
            expired=expired_contracts
        )

        # 5. Current Payrun for Selected Period (or Latest)
        payrun_obj = db.query(Payrun).filter(
            Payrun.company == company,
            or_(
                and_(Payrun.period_start <= period_end_date, Payrun.period_end >= period_start_date),
                Payrun.period_start == period_start_date
            )
        ).order_by(desc(Payrun.created_at)).first()

        # If no payrun in selected period, pick latest payrun overall
        if not payrun_obj:
            payrun_obj = db.query(Payrun).filter(Payrun.company == company).order_by(desc(Payrun.period_start)).first()

        payrun_summary: Optional[PayrunSummary] = None
        if payrun_obj:
            total_emp = payrun_obj.total_employees or 0
            succ_emp = payrun_obj.successful_employees or 0
            failed_emp = payrun_obj.failed_employees or 0
            skipped_emp = payrun_obj.skipped_employees or 0
            excluded_emp = payrun_obj.excluded_employees or 0
            
            # Count status from payrun_employees if total_employees == 0
            if total_emp == 0 and payrun_obj.payrun_employees:
                total_emp = len(payrun_obj.payrun_employees)
                succ_emp = sum(1 for pe in payrun_obj.payrun_employees if pe.status == PayrunEmployeeStatus.SUCCESS.value)
                failed_emp = sum(1 for pe in payrun_obj.payrun_employees if pe.status == PayrunEmployeeStatus.FAILED.value)
                excluded_emp = sum(1 for pe in payrun_obj.payrun_employees if pe.excluded or pe.status == PayrunEmployeeStatus.EXCLUDED.value)
                skipped_emp = sum(1 for pe in payrun_obj.payrun_employees if pe.status == PayrunEmployeeStatus.SKIPPED.value)

            processed = succ_emp + failed_emp + skipped_emp + excluded_emp
            pending = max(0, total_emp - processed)
            prog_pct = round((processed / total_emp * 100), 1) if total_emp > 0 else 0.0

            payrun_summary = PayrunSummary(
                id=payrun_obj.id,
                name=payrun_obj.name,
                period=f"{payrun_obj.period_start.strftime('%B %Y')}",
                status=payrun_obj.status,
                total_employees=total_emp,
                processed=processed,
                successful=succ_emp,
                pending=pending,
                failed=failed_emp,
                skipped=skipped_emp,
                excluded=excluded_emp,
                progress_percentage=prog_pct
            )

        # 6. Financial Summary for Selected Period
        payslip_query = db.query(Payslip).filter(
            Payslip.company == company,
            Payslip.period_start >= period_start_date,
            Payslip.period_start <= period_end_date
        )
        if department:
            payslip_query = payslip_query.join(Employee, Payslip.employee_id == Employee.id).filter(Employee.department == department)
        
        period_payslips = payslip_query.all()
        
        # If no payslips match the exact period, fall back to payrun totals or payslips in latest period
        if not period_payslips and payrun_obj and can_view_financials:
            gross = float(payrun_obj.total_gross or 0.0)
            deductions = float(payrun_obj.total_deductions or 0.0)
            net = float(payrun_obj.total_net or payrun_obj.total_net_paid or 0.0)
            employer_contrib = float(payrun_obj.total_employer_contributions or 0.0)
            total_cost = float(payrun_obj.total_employer_cost or (gross + employer_contrib))
            ps_count = payrun_obj.successful_employees or payrun_obj.employee_count or 0
        elif can_view_financials and period_payslips:
            gross = sum(p.gross_salary for p in period_payslips)
            deductions = sum(p.total_deductions for p in period_payslips)
            net = sum(p.net_salary for p in period_payslips)
            employer_contrib = sum(p.total_employer_contributions for p in period_payslips)
            total_cost = sum(p.total_employer_cost or (p.gross_salary + p.total_employer_contributions) for p in period_payslips)
            ps_count = len(period_payslips)
        else:
            gross = 0.0
            deductions = 0.0
            net = 0.0
            employer_contrib = 0.0
            total_cost = 0.0
            ps_count = len(period_payslips)

        payroll_summary = PayrollFinancialSummary(
            gross_payroll=gross,
            total_deductions=deductions,
            net_payroll=net,
            employer_contributions=employer_contrib,
            total_payroll_cost=total_cost,
            payslips_count=ps_count
        )

        # 7. 6-Month Payroll Historical Trend
        trend_items: List[PayrollTrendItem] = []
        if can_view_financials:
            # Query payslips grouped by month or payruns for the past 6 months
            for i in range(5, -1, -1):
                # Calculate month start and end
                m_date = today - timedelta(days=i * 30)
                m_start = date(m_date.year, m_date.month, 1)
                if m_date.month == 12:
                    m_end = date(m_date.year + 1, 1, 1) - timedelta(days=1)
                else:
                    m_end = date(m_date.year, m_date.month + 1, 1) - timedelta(days=1)
                
                m_period_str = m_start.strftime("%Y-%m")
                m_label = m_start.strftime("%b %Y")

                m_payslips = db.query(Payslip).filter(
                    Payslip.company == company,
                    Payslip.period_start >= m_start,
                    Payslip.period_start <= m_end
                ).all()

                if m_payslips:
                    t_gross = sum(p.gross_salary for p in m_payslips)
                    t_ded = sum(p.total_deductions for p in m_payslips)
                    t_net = sum(p.net_salary for p in m_payslips)
                    t_cost = sum(p.total_employer_cost or (p.gross_salary + p.total_employer_contributions) for p in m_payslips)
                    t_count = len(m_payslips)
                else:
                    # Check payrun for that month
                    pr = db.query(Payrun).filter(
                        Payrun.company == company,
                        Payrun.period_start >= m_start,
                        Payrun.period_start <= m_end
                    ).first()
                    if pr:
                        t_gross = pr.total_gross or 0.0
                        t_ded = pr.total_deductions or 0.0
                        t_net = pr.total_net or pr.total_net_paid or 0.0
                        t_cost = pr.total_employer_cost or (t_gross + (pr.total_employer_contributions or 0.0))
                        t_count = pr.total_employees or 0
                    else:
                        t_gross, t_ded, t_net, t_cost, t_count = 0.0, 0.0, 0.0, 0.0, 0

                trend_items.append(PayrollTrendItem(
                    period=m_period_str,
                    month_label=m_label,
                    gross=t_gross,
                    deductions=t_ded,
                    net=t_net,
                    employer_cost=t_cost,
                    employee_count=t_count
                ))

        # 8. Department Distribution
        dept_dist: List[DepartmentPayrollItem] = []
        dept_group: Dict[str, Dict[str, Any]] = {}
        
        # Aggregate by employee departments
        for e in employees_list:
            d_name = e.department or "General"
            if d_name not in dept_group:
                dept_group[d_name] = {"count": 0, "gross": 0.0, "net": 0.0}
            dept_group[d_name]["count"] += 1

        if can_view_financials and period_payslips:
            for p in period_payslips:
                emp = p.employee
                d_name = emp.department if emp and emp.department else "General"
                if d_name not in dept_group:
                    dept_group[d_name] = {"count": 0, "gross": 0.0, "net": 0.0}
                dept_group[d_name]["gross"] += p.gross_salary
                dept_group[d_name]["net"] += p.net_salary

        total_gross_all = sum(v["gross"] for v in dept_group.values()) or 1.0
        for d_name, val in sorted(dept_group.items(), key=lambda x: x[1]["gross"], reverse=True):
            pct = round((val["gross"] / total_gross_all * 100), 1) if val["gross"] > 0 else 0.0
            dept_dist.append(DepartmentPayrollItem(
                department=d_name,
                employee_count=val["count"],
                gross_amount=val["gross"],
                net_amount=val["net"],
                percentage_of_total=pct
            ))

        # 9. Actionable Pending Alerts
        alerts: List[PendingAlertItem] = []

        # A. Failed Payrun Employees (Critical / High)
        if payrun_obj and payrun_obj.failed_employees and payrun_obj.failed_employees > 0:
            alerts.append(PendingAlertItem(
                id=f"alert-payrun-failed-{payrun_obj.id}",
                type="PAYROLL_FAILED",
                priority="CRITICAL",
                title="Payroll Processing Failures Detected",
                description=f"{payrun_obj.failed_employees} employee(s) failed computation in {payrun_obj.name}.",
                count=payrun_obj.failed_employees,
                action_url=f"/payroll/payruns/{payrun_obj.id}",
                action_label="Review & Fix Payrun"
            ))

        # B. Expiring Contracts (Medium)
        if expiring_soon_contracts > 0:
            alerts.append(PendingAlertItem(
                id="alert-contracts-expiring",
                type="CONTRACT_EXPIRING",
                priority="MEDIUM",
                title="Employee Contracts Expiring Soon",
                description=f"{expiring_soon_contracts} active contract(s) expire within 30 days.",
                count=expiring_soon_contracts,
                action_url="/contracts?status=running",
                action_label="Manage Contracts"
            ))

        # C. Pending Leave Approvals (Medium)
        pending_leaves_count = db.query(TimeOffRequest).join(Employee, TimeOffRequest.employee_id == Employee.id).filter(
            Employee.company == company,
            TimeOffRequest.status == LeaveRequestStatus.TO_APPROVE.value
        ).count()
        if pending_leaves_count > 0:
            alerts.append(PendingAlertItem(
                id="alert-pending-leaves",
                type="LEAVE_PENDING",
                priority="MEDIUM",
                title="Leave Requests Awaiting Approval",
                description=f"{pending_leaves_count} employee time-off request(s) need manager review.",
                count=pending_leaves_count,
                action_url="/time-off/requests?status=to_approve",
                action_label="Approve Leaves"
            ))

        # D. Active Employees Missing Bank or PAN Details (Low)
        missing_bank_count = db.query(Employee).filter(
            Employee.company == company,
            Employee.status == EmployeeStatus.ACTIVE.value,
            or_(Employee.bank_account_no == None, Employee.bank_account_no == "", Employee.pan_no == None, Employee.pan_no == "")
        ).count()
        if missing_bank_count > 0:
            alerts.append(PendingAlertItem(
                id="alert-missing-bank-info",
                type="MISSING_BANK_INFO",
                priority="LOW",
                title="Incomplete Employee Financial Records",
                description=f"{missing_bank_count} active employee(s) are missing bank account or PAN details.",
                count=missing_bank_count,
                action_url="/employees?status=active",
                action_label="Update Profiles"
            ))

        # 10. Recent Payruns (Top 5)
        recent_payruns_db = db.query(Payrun).filter(
            Payrun.company == company
        ).order_by(desc(Payrun.created_at)).limit(5).all()

        recent_payruns: List[RecentPayrunItem] = []
        for rp in recent_payruns_db:
            recent_payruns.append(RecentPayrunItem(
                id=rp.id,
                name=rp.name,
                period=f"{rp.period_start.strftime('%b %Y')} - {rp.period_end.strftime('%b %Y')}",
                status=rp.status,
                total_employees=rp.total_employees or rp.employee_count or 0,
                total_net=float(rp.total_net or rp.total_net_paid or 0.0),
                warning_count=rp.warning_count or 0,
                finalized_at=rp.finalized_at,
                created_at=rp.created_at or datetime.utcnow()
            ))

        # 11. Recent Activity Feed
        recent_activity: List[RecentActivityItem] = []
        
        # Add recent payruns activity
        for rp in recent_payruns_db[:3]:
            act_type = "PAYRUN_FINALIZED" if rp.status == PayrunStatus.FINALIZED.value else "PAYRUN_CREATED"
            title = f"Payrun {rp.status.upper()}: {rp.name}"
            recent_activity.append(RecentActivityItem(
                id=f"act-payrun-{rp.id}",
                event_type=act_type,
                title=title,
                description=f"Processed {rp.total_employees or 0} employees with total net ₹{float(rp.total_net or rp.total_net_paid or 0.0):,.0f}",
                timestamp=rp.finalized_at or rp.created_at or datetime.utcnow(),
                actor_name=rp.created_by_user.username if rp.created_by_user else "Payroll Manager",
                entity_type="Payrun",
                entity_id=rp.id
            ))

        # Add recent employees joined
        recent_emps = db.query(Employee).filter(
            Employee.company == company
        ).order_by(desc(Employee.created_at)).limit(3).all()
        for re in recent_emps:
            recent_activity.append(RecentActivityItem(
                id=f"act-emp-{re.id}",
                event_type="EMPLOYEE_JOINED",
                title=f"New Employee Enrolled: {re.name}",
                description=f"Joined as {re.job_position} in {re.department} department.",
                timestamp=re.created_at or datetime.utcnow(),
                actor_name="HR Team",
                entity_type="Employee",
                entity_id=re.id
            ))

        # Sort combined activities by timestamp desc
        recent_activity.sort(key=lambda x: x.timestamp, reverse=True)
        recent_activity = recent_activity[:8]

        return DashboardResponse(
            period=selected_period,
            company=company,
            user_role=user_role,
            can_view_financials=can_view_financials,
            available_periods=available_periods,
            employees=employee_kpis,
            contracts=contract_kpis,
            payrun=payrun_summary,
            payroll=payroll_summary,
            payroll_trend=trend_items,
            department_distribution=dept_dist,
            alerts=alerts,
            recent_payruns=recent_payruns,
            recent_activity=recent_activity
        )

    @staticmethod
    def get_employee_dashboard(
        db: Session,
        current_user: User
    ) -> EmployeeDashboardResponse:
        if not current_user.employee:
            raise ValueError("Authenticated user does not have a linked Employee profile.")
        
        emp = current_user.employee
        today = date.today()
        first_of_month = date(today.year, today.month, 1)

        # 1. Attendance Metrics this month
        attendances = db.query(Attendance).filter(
            Attendance.employee_id == emp.id,
            Attendance.date >= first_of_month,
            Attendance.date <= today
        ).all()
        
        days_present = sum(1 for a in attendances if a.status in [AttendanceStatus.PRESENT.value, AttendanceStatus.CHECKED_IN.value, AttendanceStatus.OVERTIME.value, AttendanceStatus.LATE.value])
        days_late = sum(1 for a in attendances if a.status == AttendanceStatus.LATE.value)
        total_worked_hours = sum(float(a.worked_hours or 0.0) for a in attendances)
        
        expected_working_days = max(1, len(attendances))
        att_rate = round((days_present / expected_working_days * 100), 1) if expected_working_days > 0 else 100.0

        # 2. Leave Balances
        allocations = db.query(TimeOffAllocation).filter(
            TimeOffAllocation.employee_id == emp.id,
            TimeOffAllocation.status == AllocationStatus.APPROVED.value
        ).all()
        total_allocated = sum(float(a.allocated_amount or 0.0) for a in allocations)

        approved_leaves = db.query(TimeOffRequest).filter(
            TimeOffRequest.employee_id == emp.id,
            TimeOffRequest.status == LeaveRequestStatus.APPROVED.value
        ).all()
        total_used = sum(float(l.duration or 0.0) for l in approved_leaves)
        remaining_leave = max(0.0, sum(float(a.remaining_amount if a.remaining_amount is not None else (a.allocated_amount - a.taken_amount)) for a in allocations))

        pending_requests = db.query(TimeOffRequest).filter(
            TimeOffRequest.employee_id == emp.id,
            TimeOffRequest.status == LeaveRequestStatus.TO_APPROVE.value
        ).count()

        # 3. Active Contract
        active_contract = db.query(Contract).filter(
            Contract.employee_id == emp.id,
            Contract.status == ContractStatus.RUNNING.value
        ).order_by(desc(Contract.start_date)).first()

        # 4. Recent Payslips
        payslips_db = db.query(Payslip).filter(
            Payslip.employee_id == emp.id
        ).order_by(desc(Payslip.period_start)).limit(6).all()

        recent_payslips: List[EmployeePayslipItem] = []
        for p in payslips_db:
            recent_payslips.append(EmployeePayslipItem(
                id=p.id,
                payslip_number=p.payslip_number,
                period_label=f"{p.period_start.strftime('%B %Y')}",
                period_start=p.period_start,
                period_end=p.period_end,
                gross_salary=p.gross_salary,
                total_deductions=p.total_deductions,
                net_salary=p.net_salary,
                status=p.status,
                has_pdf=bool(p.pdf_path),
                created_at=p.created_at or datetime.utcnow()
            ))

        return EmployeeDashboardResponse(
            employee_id=emp.id,
            employee_code=emp.employee_code,
            name=emp.name,
            work_email=emp.work_email,
            department=emp.department or "General",
            job_position=emp.job_position or "Employee",
            company=emp.company or "PeoplePay360 Inc.",
            status=emp.status,
            avatar_url=emp.avatar_url,
            attendance_rate=att_rate,
            days_present=days_present,
            days_late=days_late,
            total_worked_hours=round(total_worked_hours, 1),
            leave_allocations_total=total_allocated,
            leave_used=total_used,
            leave_remaining=remaining_leave,
            pending_leave_requests=pending_requests,
            contract_code=active_contract.contract_code if active_contract else None,
            wage_per_month=active_contract.wage_per_month if active_contract else None,
            contract_start_date=active_contract.start_date if active_contract else None,
            contract_end_date=active_contract.end_date if active_contract else None,
            recent_payslips=recent_payslips
        )
