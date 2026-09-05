from datetime import datetime, date
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.models import (
    Payrun,
    PayrunEmployee,
    PayrunStatus,
    PayrunEmployeeStatus,
    Payslip,
    PayslipLine,
    PayslipStatus,
    PayrollWarning,
    Employee,
    Contract,
    SalaryStructure,
    SalaryRule,
    WorkingSchedule,
    Attendance,
    EmployeeStatus,
    ContractStatus,
    User,
)
from app.services.salary_engine_service import SalaryEngineService, SalaryEngineException


class EligibilityService:
    @staticmethod
    def find_eligible_employees(
        db: Session,
        company: str,
        period_start: date,
        period_end: date,
        employee_type: Optional[str] = None,
        salary_structure_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """
        Determines payroll eligibility for all employees in a company for a given period:
        ✓ Employee is active
        ✓ Employee belongs to selected company
        ✓ Employee has an active running contract overlapping the period
        ✓ Contract has an active Salary Structure assigned
        """
        query = db.query(Employee).filter(
            func.lower(Employee.company) == func.lower(company)
        )

        if employee_type and employee_type.lower() != "all":
            query = query.filter(func.lower(Employee.employee_type) == func.lower(employee_type))

        all_employees = query.all()

        eligible_list: List[Dict[str, Any]] = []
        ineligible_list: List[Dict[str, Any]] = []

        for emp in all_employees:
            # 1. Check active status
            if emp.status != EmployeeStatus.ACTIVE.value and emp.status != "Active":
                ineligible_list.append({
                    "employee_id": emp.id,
                    "employee_code": emp.employee_code,
                    "employee_name": emp.name,
                    "department": emp.department,
                    "job_position": emp.job_position,
                    "employee_type": emp.employee_type,
                    "status": emp.status,
                    "is_eligible": False,
                    "reason": f"Employee is not active (Status: {emp.status}).",
                    "contract": None,
                    "salary_structure": None,
                })
                continue

            # 2. Check running contracts overlapping period
            contract_query = db.query(Contract).filter(
                Contract.employee_id == emp.id,
                Contract.start_date <= period_end,
                or_(Contract.end_date.is_(None), Contract.end_date >= period_start),
            )

            # Prioritize running / active contracts
            running_contracts = contract_query.filter(
                Contract.status.in_([ContractStatus.RUNNING.value, "active", "Running", "running"])
            ).all()

            if not running_contracts:
                all_period_contracts = contract_query.all()
                if not all_period_contracts:
                    ineligible_list.append({
                        "employee_id": emp.id,
                        "employee_code": emp.employee_code,
                        "employee_name": emp.name,
                        "department": emp.department,
                        "job_position": emp.job_position,
                        "employee_type": emp.employee_type,
                        "status": emp.status,
                        "is_eligible": False,
                        "reason": "No active contract overlapping the payroll period.",
                        "contract": None,
                        "salary_structure": None,
                    })
                    continue
                else:
                    active_contract = all_period_contracts[0]
            else:
                active_contract = sorted(
                    running_contracts, key=lambda c: (c.start_date, c.id), reverse=True
                )[0]

            # 3. Check Salary Structure
            if not active_contract.salary_structure_id:
                ineligible_list.append({
                    "employee_id": emp.id,
                    "employee_code": emp.employee_code,
                    "employee_name": emp.name,
                    "department": emp.department,
                    "job_position": emp.job_position,
                    "employee_type": emp.employee_type,
                    "status": emp.status,
                    "is_eligible": False,
                    "reason": f"Contract '{active_contract.contract_code}' has no Salary Structure assigned.",
                    "contract": {
                        "id": active_contract.id,
                        "code": active_contract.contract_code,
                        "name": active_contract.name,
                        "wage_per_month": active_contract.wage_per_month,
                    },
                    "salary_structure": None,
                })
                continue

            structure = db.query(SalaryStructure).filter(
                SalaryStructure.id == active_contract.salary_structure_id
            ).first()

            if not structure or not structure.active:
                ineligible_list.append({
                    "employee_id": emp.id,
                    "employee_code": emp.employee_code,
                    "employee_name": emp.name,
                    "department": emp.department,
                    "job_position": emp.job_position,
                    "employee_type": emp.employee_type,
                    "status": emp.status,
                    "is_eligible": False,
                    "reason": "Assigned Salary Structure is inactive or missing.",
                    "contract": {
                        "id": active_contract.id,
                        "code": active_contract.contract_code,
                        "name": active_contract.name,
                        "wage_per_month": active_contract.wage_per_month,
                    },
                    "salary_structure": None,
                })
                continue

            # Optional filter by salary structure
            if salary_structure_id and structure.id != salary_structure_id:
                ineligible_list.append({
                    "employee_id": emp.id,
                    "employee_code": emp.employee_code,
                    "employee_name": emp.name,
                    "department": emp.department,
                    "job_position": emp.job_position,
                    "employee_type": emp.employee_type,
                    "status": emp.status,
                    "is_eligible": False,
                    "reason": f"Contract structure '{structure.name}' does not match target structure filter.",
                    "contract": {
                        "id": active_contract.id,
                        "code": active_contract.contract_code,
                        "name": active_contract.name,
                        "wage_per_month": active_contract.wage_per_month,
                    },
                    "salary_structure": {
                        "id": structure.id,
                        "name": structure.name,
                        "code": structure.code,
                    },
                })
                continue

            # Eligible!
            schedule_name = None
            if active_contract.working_schedule_id:
                ws = db.query(WorkingSchedule).filter(WorkingSchedule.id == active_contract.working_schedule_id).first()
                if ws:
                    schedule_name = ws.name
            elif emp.working_schedule_id:
                ws = db.query(WorkingSchedule).filter(WorkingSchedule.id == emp.working_schedule_id).first()
                if ws:
                    schedule_name = ws.name

            eligible_list.append({
                "employee_id": emp.id,
                "employee_code": emp.employee_code,
                "employee_name": emp.name,
                "work_email": emp.work_email,
                "department": emp.department,
                "job_position": emp.job_position,
                "employee_type": emp.employee_type,
                "working_schedule_name": schedule_name or "Standard Schedule",
                "bank_account_no": emp.bank_account_no,
                "pan_no": emp.pan_no,
                "is_eligible": True,
                "contract": {
                    "id": active_contract.id,
                    "code": active_contract.contract_code,
                    "name": active_contract.name,
                    "wage_per_month": active_contract.wage_per_month,
                    "start_date": active_contract.start_date.isoformat() if active_contract.start_date else None,
                    "end_date": active_contract.end_date.isoformat() if active_contract.end_date else None,
                },
                "salary_structure": {
                    "id": structure.id,
                    "name": structure.name,
                    "code": structure.code,
                },
            })

        return {
            "company": company,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "total_employees": len(all_employees),
            "eligible_count": len(eligible_list),
            "ineligible_count": len(ineligible_list),
            "eligible_employees": eligible_list,
            "ineligible_employees": ineligible_list,
        }


class PayrunService:
    @staticmethod
    def list_payruns(
        db: Session,
        company: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Payrun], int]:
        query = db.query(Payrun)

        if company:
            query = query.filter(func.lower(Payrun.company) == func.lower(company))

        if status and status.lower() != "all":
            query = query.filter(func.lower(Payrun.status) == func.lower(status))

        if search and search.strip():
            term = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Payrun.name.ilike(term),
                    Payrun.company.ilike(term),
                )
            )

        total = query.count()
        payruns = query.order_by(Payrun.period_start.desc(), Payrun.id.desc()).offset(skip).limit(limit).all()
        return payruns, total

    @staticmethod
    def get_payrun(db: Session, payrun_id: int) -> Optional[Payrun]:
        return db.query(Payrun).filter(Payrun.id == payrun_id).first()

    @staticmethod
    def create_payrun(
        db: Session,
        user: Optional[User],
        name: str,
        company: str,
        period_start: date,
        period_end: date,
        employee_type: str = "All",
        salary_structure_id: Optional[int] = None,
        selected_employee_ids: Optional[List[int]] = None,
    ) -> Payrun:
        # 1. Validate dates
        if period_start > period_end:
            raise ValueError("Payroll period start date cannot be after end date.")

        # 2. Check for duplicate active payrun
        duplicate = db.query(Payrun).filter(
            func.lower(Payrun.company) == func.lower(company),
            Payrun.period_start == period_start,
            Payrun.period_end == period_end,
            Payrun.status != PayrunStatus.CANCELLED.value,
        ).first()

        if duplicate:
            raise ValueError(
                f"An active Payrun for '{company}' for period {period_start} to {period_end} "
                f"already exists (#{duplicate.id}: '{duplicate.name}', Status: {duplicate.status.upper()})."
            )

        # 3. Create Payrun
        payrun = Payrun(
            name=name,
            company=company,
            period_start=period_start,
            period_end=period_end,
            employee_type=employee_type,
            salary_structure_id=salary_structure_id,
            status=PayrunStatus.DRAFT.value,
            created_by_id=user.id if user else None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(payrun)
        db.flush()

        # 4. Find eligible employees and populate PayrunEmployee
        eligibility = EligibilityService.find_eligible_employees(
            db=db,
            company=company,
            period_start=period_start,
            period_end=period_end,
            employee_type=employee_type,
            salary_structure_id=salary_structure_id,
        )

        eligible_employees = eligibility["eligible_employees"]
        selected_set = set(selected_employee_ids) if selected_employee_ids is not None else None

        for item in eligible_employees:
            emp_id = item["employee_id"]
            contract_id = item["contract"]["id"] if item["contract"] else None
            
            # Default inclusion logic
            is_selected = True
            if selected_set is not None:
                is_selected = emp_id in selected_set

            payrun_emp = PayrunEmployee(
                payrun_id=payrun.id,
                employee_id=emp_id,
                contract_id=contract_id,
                status=PayrunEmployeeStatus.PENDING.value if is_selected else PayrunEmployeeStatus.EXCLUDED.value,
                excluded=not is_selected,
                exclusion_reason=None if is_selected else "Not selected during creation",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(payrun_emp)

        db.flush()

        # Update initial counters
        payrun.total_employees = len(eligible_employees)
        payrun.employee_count = payrun.total_employees
        payrun.excluded_employees = sum(1 for item in eligible_employees if selected_set is not None and item["employee_id"] not in selected_set)
        
        db.commit()
        db.refresh(payrun)
        return payrun

    @staticmethod
    def update_draft_payrun(
        db: Session,
        payrun_id: int,
        name: Optional[str] = None,
        period_start: Optional[date] = None,
        period_end: Optional[date] = None,
        employee_type: Optional[str] = None,
    ) -> Payrun:
        payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
        if not payrun:
            raise ValueError(f"Payrun #{payrun_id} not found.")

        if payrun.status in [PayrunStatus.PROCESSING.value, PayrunStatus.FINALIZED.value]:
            raise ValueError(f"Cannot edit Payrun in '{payrun.status.upper()}' status.")

        if name:
            payrun.name = name
        if period_start:
            payrun.period_start = period_start
        if period_end:
            payrun.period_end = period_end
        if employee_type:
            payrun.employee_type = employee_type

        if payrun.period_start > payrun.period_end:
            raise ValueError("Payroll period start date cannot be after end date.")

        payrun.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(payrun)
        return payrun

    @staticmethod
    def update_employee_selection(
        db: Session,
        payrun_id: int,
        employee_ids: List[int],
        exclusion_reasons: Optional[Dict[int, str]] = None,
    ) -> Payrun:
        payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
        if not payrun:
            raise ValueError(f"Payrun #{payrun_id} not found.")

        if payrun.status in [PayrunStatus.PROCESSING.value, PayrunStatus.FINALIZED.value]:
            raise ValueError(f"Cannot modify employee selection when Payrun is {payrun.status.upper()}.")

        selected_set = set(employee_ids)
        reasons = exclusion_reasons or {}

        payrun_employees = db.query(PayrunEmployee).filter(PayrunEmployee.payrun_id == payrun_id).all()
        for pe in payrun_employees:
            if pe.employee_id in selected_set:
                pe.excluded = False
                pe.exclusion_reason = None
                if pe.status == PayrunEmployeeStatus.EXCLUDED.value:
                    pe.status = PayrunEmployeeStatus.PENDING.value
            else:
                pe.excluded = True
                pe.exclusion_reason = reasons.get(pe.employee_id, "Manually excluded by payroll admin")
                pe.status = PayrunEmployeeStatus.EXCLUDED.value
            pe.updated_at = datetime.utcnow()

        payrun.excluded_employees = sum(1 for pe in payrun_employees if pe.excluded)
        payrun.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(payrun)
        return payrun

    @staticmethod
    def validate_payrun(db: Session, payrun_id: int) -> Dict[str, Any]:
        payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
        if not payrun:
            raise ValueError(f"Payrun #{payrun_id} not found.")

        active_emps = db.query(PayrunEmployee).filter(
            PayrunEmployee.payrun_id == payrun_id,
            PayrunEmployee.excluded.is_(False),
        ).all()

        valid_count = 0
        warning_count = 0
        error_count = 0
        items = []

        # Clear old warnings for this payrun
        db.query(PayrollWarning).filter(PayrollWarning.payrun_id == payrun_id).delete()

        for pe in active_emps:
            emp = db.query(Employee).filter(Employee.id == pe.employee_id).first()
            if not emp:
                continue

            emp_issues = []
            emp_warnings = []

            # 1. Contract & Structure Check
            contract = db.query(Contract).filter(Contract.id == pe.contract_id).first()
            if not contract:
                emp_issues.append("Missing or invalid contract reference.")
            elif contract.status not in [ContractStatus.RUNNING.value, "active", "Running", "running"]:
                emp_warnings.append(f"Contract '{contract.contract_code}' status is '{contract.status}'.")

            if contract:
                struct = db.query(SalaryStructure).filter(SalaryStructure.id == contract.salary_structure_id).first()
                if not struct:
                    emp_issues.append("No Salary Structure assigned.")
                elif not struct.active:
                    emp_issues.append(f"Salary Structure '{struct.name}' is inactive.")

            # 2. Bank Details Warning
            if not emp.bank_account_no:
                emp_warnings.append("Missing bank account details.")
                db.add(PayrollWarning(
                    payrun_id=payrun.id,
                    employee_id=emp.id,
                    warning_type="MISSING_BANK",
                    message=f"Employee '{emp.name}' has no bank account number on file.",
                    created_at=datetime.utcnow(),
                ))

            # 3. Duplicate Finalized Payslip Check
            dup_payslip = db.query(Payslip).filter(
                Payslip.employee_id == emp.id,
                Payslip.period_start == payrun.period_start,
                Payslip.period_end == payrun.period_end,
                Payslip.status.in_([PayslipStatus.VALIDATED.value, PayslipStatus.PAID.value, "finalized"]),
                Payslip.payrun_id != payrun.id,
            ).first()

            if dup_payslip:
                emp_issues.append(f"Finalized payslip #{dup_payslip.payslip_number} already exists for this period.")
                db.add(PayrollWarning(
                    payrun_id=payrun.id,
                    employee_id=emp.id,
                    warning_type="DUPLICATE_PAYSLIP",
                    message=f"Finalized payslip #{dup_payslip.payslip_number} already exists for period.",
                    created_at=datetime.utcnow(),
                ))

            has_errors = len(emp_issues) > 0
            has_warnings = len(emp_warnings) > 0

            if has_errors:
                error_count += 1
            else:
                valid_count += 1

            if has_warnings:
                warning_count += len(emp_warnings)

            items.append({
                "employee_id": emp.id,
                "employee_code": emp.employee_code,
                "employee_name": emp.name,
                "department": emp.department,
                "is_valid": not has_errors,
                "errors": emp_issues,
                "warnings": emp_warnings,
            })

        payrun.warning_count = warning_count
        if error_count == 0 and payrun.status == PayrunStatus.DRAFT.value:
            payrun.status = PayrunStatus.READY.value

        db.commit()

        return {
            "payrun_id": payrun.id,
            "status": payrun.status,
            "total_selected": len(active_emps),
            "valid_count": valid_count,
            "warning_count": warning_count,
            "error_count": error_count,
            "can_process": error_count == 0,
            "items": items,
        }

    @staticmethod
    def process_payrun(db: Session, payrun_id: int) -> Payrun:
        payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
        if not payrun:
            raise ValueError(f"Payrun #{payrun_id} not found.")

        if payrun.status == PayrunStatus.FINALIZED.value:
            raise ValueError("Cannot re-process a finalized Payrun.")

        if payrun.status == PayrunStatus.PROCESSING.value:
            raise ValueError("Payrun is already actively processing.")

        # Set status to PROCESSING
        payrun.status = PayrunStatus.PROCESSING.value
        payrun.processed_at = datetime.utcnow()
        db.commit()

        # Load non-excluded employees
        payrun_employees = db.query(PayrunEmployee).filter(
            PayrunEmployee.payrun_id == payrun_id,
            PayrunEmployee.excluded.is_(False),
        ).all()

        successful_count = 0
        failed_count = 0

        total_gross = 0.0
        total_deductions = 0.0
        total_net = 0.0
        total_employer_contributions = 0.0
        total_employer_cost = 0.0

        for pe in payrun_employees:
            pe.status = PayrunEmployeeStatus.PROCESSING.value
            db.flush()

            try:
                calc_result = SalaryEngineService.calculate_employee_payroll(
                    db=db,
                    employee_id=pe.employee_id,
                    period_start=payrun.period_start,
                    period_end=payrun.period_end,
                    contract_id=pe.contract_id,
                )

                # Store result
                pe.gross_salary = calc_result["gross_salary"]
                pe.total_deductions = calc_result["total_deductions"]
                pe.net_salary = calc_result["net_salary"]
                pe.employer_contribution_total = calc_result["employer_contribution_total"]
                pe.employer_cost = calc_result["employer_cost"]

                pe.worked_days = calc_result.get("attendance_summary", {}).get("worked_days", 0.0)
                pe.unpaid_leave_days = calc_result.get("time_off_summary", {}).get("unpaid_days", 0.0)

                pe.calculation_trace = calc_result["calculation_trace"]
                pe.components = calc_result["components"]
                pe.warnings = calc_result["warnings"]

                pe.status = PayrunEmployeeStatus.SUCCESS.value
                pe.error_code = None
                pe.error_message = None
                pe.processed_at = datetime.utcnow()

                successful_count += 1
                total_gross += pe.gross_salary
                total_deductions += pe.total_deductions
                total_net += pe.net_salary
                total_employer_contributions += pe.employer_contribution_total
                total_employer_cost += pe.employer_cost

            except SalaryEngineException as see:
                pe.status = PayrunEmployeeStatus.FAILED.value
                pe.error_code = see.code
                pe.error_message = see.message
                pe.gross_salary = 0.0
                pe.total_deductions = 0.0
                pe.net_salary = 0.0
                pe.employer_contribution_total = 0.0
                pe.employer_cost = 0.0
                pe.processed_at = datetime.utcnow()
                failed_count += 1

            except Exception as ex:
                pe.status = PayrunEmployeeStatus.FAILED.value
                pe.error_code = "SYSTEM_ERROR"
                pe.error_message = f"Calculation failed: {str(ex)}"
                pe.gross_salary = 0.0
                pe.total_deductions = 0.0
                pe.net_salary = 0.0
                pe.employer_contribution_total = 0.0
                pe.employer_cost = 0.0
                pe.processed_at = datetime.utcnow()
                failed_count += 1

        # Aggregate Payrun Totals
        payrun.successful_employees = successful_count
        payrun.failed_employees = failed_count
        payrun.total_gross = round(total_gross, 2)
        payrun.total_deductions = round(total_deductions, 2)
        payrun.total_net = round(total_net, 2)
        payrun.total_net_paid = payrun.total_net
        payrun.total_employer_contributions = round(total_employer_contributions, 2)
        payrun.total_employer_cost = round(total_employer_cost, 2)

        # Transition to REVIEW
        payrun.status = PayrunStatus.REVIEW.value
        payrun.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(payrun)
        return payrun

    @staticmethod
    def recalculate_single_employee(db: Session, payrun_id: int, employee_id: int) -> Dict[str, Any]:
        payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
        if not payrun:
            raise ValueError(f"Payrun #{payrun_id} not found.")

        if payrun.status == PayrunStatus.FINALIZED.value:
            raise ValueError("Cannot recalculate employees in a finalized Payrun.")

        pe = db.query(PayrunEmployee).filter(
            PayrunEmployee.payrun_id == payrun_id,
            PayrunEmployee.employee_id == employee_id,
        ).first()

        if not pe:
            raise ValueError(f"Employee #{employee_id} is not part of Payrun #{payrun_id}.")

        pe.status = PayrunEmployeeStatus.PROCESSING.value
        pe.excluded = False
        pe.exclusion_reason = None
        db.flush()

        try:
            calc_result = SalaryEngineService.calculate_employee_payroll(
                db=db,
                employee_id=employee_id,
                period_start=payrun.period_start,
                period_end=payrun.period_end,
                contract_id=pe.contract_id,
            )

            pe.gross_salary = calc_result["gross_salary"]
            pe.total_deductions = calc_result["total_deductions"]
            pe.net_salary = calc_result["net_salary"]
            pe.employer_contribution_total = calc_result["employer_contribution_total"]
            pe.employer_cost = calc_result["employer_cost"]

            pe.worked_days = calc_result.get("attendance_summary", {}).get("worked_days", 0.0)
            pe.unpaid_leave_days = calc_result.get("time_off_summary", {}).get("unpaid_days", 0.0)

            pe.calculation_trace = calc_result["calculation_trace"]
            pe.components = calc_result["components"]
            pe.warnings = calc_result["warnings"]

            pe.status = PayrunEmployeeStatus.SUCCESS.value
            pe.error_code = None
            pe.error_message = None
            pe.processed_at = datetime.utcnow()

        except SalaryEngineException as see:
            pe.status = PayrunEmployeeStatus.FAILED.value
            pe.error_code = see.code
            pe.error_message = see.message
            pe.gross_salary = 0.0
            pe.total_deductions = 0.0
            pe.net_salary = 0.0
            pe.processed_at = datetime.utcnow()

        except Exception as ex:
            pe.status = PayrunEmployeeStatus.FAILED.value
            pe.error_code = "SYSTEM_ERROR"
            pe.error_message = f"Recalculation error: {str(ex)}"
            pe.gross_salary = 0.0
            pe.total_deductions = 0.0
            pe.net_salary = 0.0
            pe.processed_at = datetime.utcnow()

        # Re-aggregate payrun
        active_pes = db.query(PayrunEmployee).filter(
            PayrunEmployee.payrun_id == payrun_id,
            PayrunEmployee.excluded.is_(False),
        ).all()

        payrun.successful_employees = sum(1 for p in active_pes if p.status == PayrunEmployeeStatus.SUCCESS.value)
        payrun.failed_employees = sum(1 for p in active_pes if p.status == PayrunEmployeeStatus.FAILED.value)
        payrun.total_gross = round(sum(p.gross_salary for p in active_pes if p.status == PayrunEmployeeStatus.SUCCESS.value), 2)
        payrun.total_deductions = round(sum(p.total_deductions for p in active_pes if p.status == PayrunEmployeeStatus.SUCCESS.value), 2)
        payrun.total_net = round(sum(p.net_salary for p in active_pes if p.status == PayrunEmployeeStatus.SUCCESS.value), 2)
        payrun.total_net_paid = payrun.total_net
        payrun.total_employer_contributions = round(sum(p.employer_contribution_total for p in active_pes if p.status == PayrunEmployeeStatus.SUCCESS.value), 2)
        payrun.total_employer_cost = round(sum(p.employer_cost for p in active_pes if p.status == PayrunEmployeeStatus.SUCCESS.value), 2)

        payrun.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(pe)
        db.refresh(payrun)

        return {
            "employee_id": pe.employee_id,
            "status": pe.status,
            "gross_salary": pe.gross_salary,
            "total_deductions": pe.total_deductions,
            "net_salary": pe.net_salary,
            "error_code": pe.error_code,
            "error_message": pe.error_message,
            "components": pe.components,
            "calculation_trace": pe.calculation_trace,
            "payrun": {
                "id": payrun.id,
                "status": payrun.status,
                "successful_employees": payrun.successful_employees,
                "failed_employees": payrun.failed_employees,
                "total_gross": payrun.total_gross,
                "total_deductions": payrun.total_deductions,
                "total_net": payrun.total_net,
            }
        }

    @staticmethod
    def finalize_payrun(db: Session, payrun_id: int, user: Optional[User] = None) -> Payrun:
        payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
        if not payrun:
            raise ValueError(f"Payrun #{payrun_id} not found.")

        if payrun.status == PayrunStatus.FINALIZED.value:
            raise ValueError("Payrun is already finalized.")

        if payrun.status != PayrunStatus.REVIEW.value:
            raise ValueError(f"Payrun must be in 'review' status before finalization (current status: {payrun.status.upper()}).")

        # Check for failed non-excluded employees
        failed_emps = db.query(PayrunEmployee).filter(
            PayrunEmployee.payrun_id == payrun_id,
            PayrunEmployee.excluded.is_(False),
            PayrunEmployee.status == PayrunEmployeeStatus.FAILED.value,
        ).all()

        if failed_emps:
            names = [db.query(Employee).filter(Employee.id == f.employee_id).first().name for f in failed_emps]
            raise ValueError(
                f"Cannot finalize Payrun: {len(failed_emps)} employee(s) failed calculation ({', '.join(names)}). "
                f"Please fix/recalculate or exclude them before finalization."
            )

        successful_emps = db.query(PayrunEmployee).filter(
            PayrunEmployee.payrun_id == payrun_id,
            PayrunEmployee.excluded.is_(False),
            PayrunEmployee.status == PayrunEmployeeStatus.SUCCESS.value,
        ).all()

        if not successful_emps:
            raise ValueError("Cannot finalize Payrun: No successfully calculated employees found.")

        # Atomic creation of official Payslips and PayslipLines
        for pe in successful_emps:
            # Check contract
            contract = db.query(Contract).filter(Contract.id == pe.contract_id).first()
            if not contract:
                continue

            # Check if payslip already linked or exists
            payslip = None
            if pe.payslip_id:
                payslip = db.query(Payslip).filter(Payslip.id == pe.payslip_id).first()

            if not payslip:
                # Generate unique payslip number
                slip_num = f"SLIP/{payrun.period_start.strftime('%Y%m')}/{pe.employee_id:04d}"
                
                # Verify uniqueness in DB
                existing_slip = db.query(Payslip).filter(Payslip.payslip_number == slip_num).first()
                if existing_slip:
                    slip_num = f"SLIP/{payrun.period_start.strftime('%Y%m')}/{pe.employee_id:04d}-{payrun.id}"

                payslip = Payslip(
                    payslip_number=slip_num,
                    payrun_id=payrun.id,
                    employee_id=pe.employee_id,
                    contract_id=contract.id,
                    salary_structure_id=contract.salary_structure_id,
                    period_start=payrun.period_start,
                    period_end=payrun.period_end,
                    status=PayslipStatus.VALIDATED.value,
                    worked_days=pe.worked_days,
                    unpaid_leave_days=pe.unpaid_leave_days,
                    basic_salary=contract.wage_per_month,
                    gross_salary=pe.gross_salary,
                    total_deductions=pe.total_deductions,
                    net_salary=pe.net_salary,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(payslip)
                db.flush()
                pe.payslip_id = payslip.id

            else:
                payslip.status = PayslipStatus.VALIDATED.value
                payslip.worked_days = pe.worked_days
                payslip.unpaid_leave_days = pe.unpaid_leave_days
                payslip.gross_salary = pe.gross_salary
                payslip.total_deductions = pe.total_deductions
                payslip.net_salary = pe.net_salary
                payslip.updated_at = datetime.utcnow()

            # Create / refresh PayslipLine items
            db.query(PayslipLine).filter(PayslipLine.payslip_id == payslip.id).delete()

            if pe.components:
                for comp in pe.components:
                    db.add(PayslipLine(
                        payslip_id=payslip.id,
                        rule_id=comp.get("rule_id"),
                        rule_name=comp.get("rule_name", "Salary Component"),
                        rule_code=comp.get("rule_code", "RULE"),
                        category=comp.get("category", "Allowance"),
                        sequence=comp.get("sequence", 10),
                        amount=float(comp.get("amount", 0.0)),
                    ))

        # Lock Payrun
        payrun.status = PayrunStatus.FINALIZED.value
        payrun.finalized_at = datetime.utcnow()
        payrun.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(payrun)
        return payrun

    @staticmethod
    def cancel_payrun(db: Session, payrun_id: int) -> Payrun:
        payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
        if not payrun:
            raise ValueError(f"Payrun #{payrun_id} not found.")

        if payrun.status == PayrunStatus.FINALIZED.value:
            raise ValueError("Finalized Payruns cannot be cancelled directly to maintain audit compliance.")

        payrun.status = PayrunStatus.CANCELLED.value
        payrun.updated_at = datetime.utcnow()

        # Delete any unfinalized draft payslips linked to this payrun
        db.query(Payslip).filter(Payslip.payrun_id == payrun_id).delete()

        db.commit()
        db.refresh(payrun)
        return payrun

    @staticmethod
    def delete_payrun(db: Session, payrun_id: int) -> bool:
        payrun = db.query(Payrun).filter(Payrun.id == payrun_id).first()
        if not payrun:
            raise ValueError(f"Payrun #{payrun_id} not found.")

        if payrun.status == PayrunStatus.FINALIZED.value:
            raise ValueError("Finalized Payruns cannot be deleted.")

        db.delete(payrun)
        db.commit()
        return True
