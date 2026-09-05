from datetime import datetime, date
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc

from app.models import (
    Payslip,
    PayslipLine,
    PayslipStatus,
    Payrun,
    Employee,
    Contract,
    SalaryStructure,
    SalaryRule,
    PayrollWarning,
    User,
    UserRole,
)
from app.services.salary_engine_service import (
    SalaryEngineService,
    SalaryEngineException,
)


class PayslipServiceException(Exception):
    """Exception class for Payslip Service operations."""
    def __init__(self, message: str, code: str = "PAYSLIP_ERROR", status_code: int = 400):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code


class PayslipService:
    @staticmethod
    def generate_payslip_number(db: Session, period_start: date, employee_id: int) -> str:
        """
        Generates a unique reference for the payslip (PS-YYYY-XXXX).
        """
        year_str = period_start.strftime("%Y")
        prefix = f"PS-{year_str}-"
        
        # Query all existing payslip numbers with this prefix
        existing_slips = db.query(Payslip.payslip_number).filter(
            Payslip.payslip_number.like(f"{prefix}%")
        ).all()
        
        max_seq = 0
        for (num,) in existing_slips:
            try:
                # parse PS-2026-0005 or PS-2026-0005-1
                suffix_part = num[len(prefix):]
                main_seq = int(suffix_part.split("-")[0])
                if main_seq > max_seq:
                    max_seq = main_seq
            except (ValueError, IndexError):
                pass
                
        next_seq = max_seq + 1
        slip_num = f"{prefix}{next_seq:04d}"
        
        # Double check uniqueness against any concurrency or manual formats
        suffix = 1
        final_num = slip_num
        while db.query(Payslip.id).filter(Payslip.payslip_number == final_num).first():
            final_num = f"{slip_num}-{suffix}"
            suffix += 1
            
        return final_num

    @classmethod
    def create_payslip(
        cls,
        db: Session,
        employee_id: int,
        period_start: date,
        period_end: date,
        payrun_id: Optional[int] = None,
        contract_id: Optional[int] = None,
        auto_compute: bool = True,
        user_id: Optional[int] = None,
    ) -> Payslip:
        """
        Creates a new payslip record, resolves contract & structure, and optionally computes lines.
        """
        # 1. Validate employee
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise PayslipServiceException(f"Employee #{employee_id} not found.", code="EMPLOYEE_NOT_FOUND", status_code=404)

        # 2. Check for duplicate finalized payslip for same employee, company & period
        dup = db.query(Payslip).filter(
            Payslip.employee_id == employee_id,
            Payslip.period_start == period_start,
            Payslip.period_end == period_end,
            Payslip.status.in_([PayslipStatus.FINALIZED.value, PayslipStatus.VALIDATED.value, PayslipStatus.PAID.value]),
        ).first()
        if dup:
            raise PayslipServiceException(
                f"A finalized payslip #{dup.payslip_number} already exists for employee '{employee.name}' for period {period_start} to {period_end}.",
                code="DUPLICATE_PAYSLIP",
                status_code=400
            )

        # 3. Resolve applicable contract
        contract_query = db.query(Contract).filter(
            Contract.employee_id == employee_id,
            Contract.start_date <= period_end,
            or_(Contract.end_date.is_(None), Contract.end_date >= period_start)
        )
        if contract_id:
            contract = contract_query.filter(Contract.id == contract_id).first()
            if not contract:
                raise PayslipServiceException(
                    f"Contract #{contract_id} is not valid for employee '{employee.name}' in period {period_start} to {period_end}.",
                    code="INVALID_CONTRACT",
                    status_code=400
                )
        else:
            applicable = contract_query.filter(Contract.status == "running").all() or contract_query.all()
            if not applicable:
                raise PayslipServiceException(
                    f"No applicable contract found for employee '{employee.name}' for period {period_start} to {period_end}.",
                    code="NO_APPLICABLE_CONTRACT",
                    status_code=400
                )
            contract = sorted(applicable, key=lambda c: (c.start_date, c.id), reverse=True)[0]

        # 4. Check salary structure
        structure = db.query(SalaryStructure).filter(SalaryStructure.id == contract.salary_structure_id).first()
        if not structure:
            raise PayslipServiceException(
                f"Contract '{contract.contract_code}' has no valid Salary Structure assigned.",
                code="NO_SALARY_STRUCTURE",
                status_code=400
            )

        slip_number = cls.generate_payslip_number(db, period_start, employee_id)

        payslip = Payslip(
            payslip_number=slip_number,
            payrun_id=payrun_id,
            employee_id=employee_id,
            contract_id=contract.id,
            salary_structure_id=structure.id,
            company=employee.company or "PeoplePay360 Inc.",
            period_start=period_start,
            period_end=period_end,
            status=PayslipStatus.DRAFT.value,
            basic_salary=float(contract.wage_per_month or 0.0),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(payslip)
        db.commit()
        db.refresh(payslip)

        if auto_compute:
            payslip = cls.compute_payslip(db, payslip.id, user_id=user_id)

        return payslip

    @classmethod
    def compute_payslip(cls, db: Session, payslip_id: int, user_id: Optional[int] = None) -> Payslip:
        """
        Executes payroll calculation for a payslip, generates lines, totals, snapshots and trace.
        """
        payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
        if not payslip:
            raise PayslipServiceException(f"Payslip #{payslip_id} not found.", code="PAYSLIP_NOT_FOUND", status_code=404)

        if payslip.status in [PayslipStatus.FINALIZED.value, PayslipStatus.PAID.value]:
            raise PayslipServiceException(
                f"Cannot recompute finalized/paid payslip #{payslip.payslip_number}. Finalized payroll records are immutable.",
                code="PAYSLIP_LOCKED",
                status_code=400
            )

        # Validate employee & contract
        employee = db.query(Employee).filter(Employee.id == payslip.employee_id).first()
        if not employee:
            raise PayslipServiceException("Employee record missing.", code="EMPLOYEE_NOT_FOUND", status_code=400)

        try:
            calc_result = SalaryEngineService.calculate_employee_payroll(
                db=db,
                employee_id=payslip.employee_id,
                period_start=payslip.period_start,
                period_end=payslip.period_end,
                contract_id=payslip.contract_id,
            )
        except SalaryEngineException as e:
            payslip.error_code = e.code
            payslip.error_message = e.message
            payslip.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(payslip)
            raise PayslipServiceException(
                f"Calculation failed for employee '{employee.name}': {e.message}",
                code=e.code,
                status_code=400
            )
        except Exception as e:
            payslip.error_code = "CALCULATION_FAILED"
            payslip.error_message = str(e)
            payslip.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(payslip)
            raise PayslipServiceException(
                f"Calculation error for employee '{employee.name}': {str(e)}",
                code="CALCULATION_FAILED",
                status_code=500
            )

        # Clear existing lines transactionally
        db.query(PayslipLine).filter(PayslipLine.payslip_id == payslip.id).delete()

        # Create fresh lines from components
        components = calc_result.get("components", [])
        total_earnings = 0.0
        total_deductions = 0.0
        total_employer_contributions = 0.0

        for comp in components:
            cat = comp.get("category", "Allowance")
            amt = float(comp.get("amount", 0.0))
            is_emp_contrib = comp.get("is_employer_contribution", False) or (cat == "Employer Contribution")
            
            if is_emp_contrib:
                total_employer_contributions += amt
            elif cat in ["Basic", "Allowance", "Gross", "Earning", "EARNING"]:
                total_earnings += amt
            elif cat in ["Deduction", "DEDUCTION", "Tax"]:
                total_deductions += amt

            line = PayslipLine(
                payslip_id=payslip.id,
                rule_id=comp.get("rule_id"),
                rule_name=comp.get("rule_name", "Salary Component"),
                rule_code=comp.get("rule_code", "RULE"),
                category=cat,
                sequence=comp.get("sequence", 10),
                amount=amt,
                quantity=float(comp.get("quantity", 1.0)),
                rate=float(comp.get("rate", 100.0)),
                base_amount=float(comp.get("base_amount", 0.0)),
                total=amt,
                calculation_type=comp.get("calculation_type", "fixed"),
                calculation_expression=comp.get("calculation_expression"),
                is_employer_contribution=is_emp_contrib,
                created_at=datetime.utcnow(),
            )
            db.add(line)

        # Update totals & metrics
        gross_sal = float(calc_result.get("gross_salary", total_earnings))
        tot_deduct = float(calc_result.get("total_deductions", total_deductions))
        net_sal = float(calc_result.get("net_salary", gross_sal - tot_deduct))
        emp_contrib = float(calc_result.get("employer_contribution_total", total_employer_contributions))
        emp_cost = float(calc_result.get("employer_cost", gross_sal + emp_contrib))

        payslip.basic_salary = float(calc_result.get("basic_salary", payslip.basic_salary))
        payslip.total_earnings = gross_sal
        payslip.gross_salary = gross_sal
        payslip.total_deductions = tot_deduct
        payslip.net_salary = net_sal
        payslip.total_employer_contributions = emp_contrib
        payslip.total_employer_cost = emp_cost

        # Snapshots
        contract = db.query(Contract).filter(Contract.id == payslip.contract_id).first()
        structure = db.query(SalaryStructure).filter(SalaryStructure.id == payslip.salary_structure_id).first()
        
        payslip.employee_snapshot = {
            "id": employee.id,
            "employee_code": employee.employee_code,
            "name": employee.name,
            "work_email": employee.work_email,
            "phone": employee.phone,
            "department": employee.department,
            "job_position": employee.job_position,
            "company": employee.company,
            "work_location": employee.work_location,
            "employee_type": employee.employee_type,
            "bank_name": employee.bank_name,
            "bank_account_no": employee.bank_account_no,
            "ifsc_code": employee.ifsc_code,
            "pan_no": employee.pan_no,
        }

        if contract:
            payslip.contract_snapshot = {
                "id": contract.id,
                "contract_code": contract.contract_code,
                "name": contract.name,
                "wage_per_month": contract.wage_per_month,
                "wage_type": getattr(contract, "wage_type", "monthly"),
                "start_date": str(contract.start_date),
                "end_date": str(contract.end_date) if contract.end_date else None,
                "structure_name": structure.name if structure else None,
            }

        context_used = calc_result.get("context_used", {})
        payslip.attendance_snapshot = {
            "scheduled_days": context_used.get("scheduled_days", 0),
            "worked_days": context_used.get("worked_days", 0.0),
            "absent_days": context_used.get("absent_days", 0.0),
            "overtime_hours": context_used.get("overtime_hours", 0.0),
            "total_worked_hours": context_used.get("total_worked_hours", 0.0),
        }

        payslip.time_off_snapshot = {
            "paid_leave_days": context_used.get("paid_leave_days", 0.0),
            "unpaid_leave_days": context_used.get("unpaid_leave_days", 0.0),
        }

        payslip.worked_days = float(context_used.get("worked_days", 0.0))
        payslip.unpaid_leave_days = float(context_used.get("unpaid_leave_days", 0.0))
        payslip.calculation_trace = calc_result.get("calculation_trace", [])

        payslip.error_code = None
        payslip.error_message = None
        payslip.status = PayslipStatus.COMPUTED.value
        payslip.computed_at = datetime.utcnow()
        payslip.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(payslip)
        return payslip

    @classmethod
    def finalize_payslip(cls, db: Session, payslip_id: int, user_id: Optional[int] = None) -> Payslip:
        """
        Finalizes and locks a payslip into an official immutable payroll record.
        """
        payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
        if not payslip:
            raise PayslipServiceException(f"Payslip #{payslip_id} not found.", code="PAYSLIP_NOT_FOUND", status_code=404)

        if payslip.status in [PayslipStatus.FINALIZED.value, PayslipStatus.PAID.value]:
            return payslip

        if payslip.status == PayslipStatus.DRAFT.value:
            # Auto-compute if in draft
            cls.compute_payslip(db, payslip.id, user_id=user_id)

        # Enforce duplicate check against other finalized payslips
        dup = db.query(Payslip).filter(
            Payslip.employee_id == payslip.employee_id,
            Payslip.period_start == payslip.period_start,
            Payslip.period_end == payslip.period_end,
            Payslip.status.in_([PayslipStatus.FINALIZED.value, PayslipStatus.VALIDATED.value, PayslipStatus.PAID.value]),
            Payslip.id != payslip.id,
        ).first()
        if dup:
            raise PayslipServiceException(
                f"Cannot finalize: A finalized payslip #{dup.payslip_number} already exists for this period.",
                code="DUPLICATE_PAYSLIP",
                status_code=400
            )

        payslip.status = PayslipStatus.FINALIZED.value
        payslip.finalized_at = datetime.utcnow()
        payslip.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(payslip)
        return payslip

    @classmethod
    def cancel_payslip(cls, db: Session, payslip_id: int, user_id: Optional[int] = None) -> Payslip:
        """
        Cancels a draft/computed payslip.
        """
        payslip = db.query(Payslip).filter(Payslip.id == payslip_id).first()
        if not payslip:
            raise PayslipServiceException(f"Payslip #{payslip_id} not found.", code="PAYSLIP_NOT_FOUND", status_code=404)

        if payslip.status in [PayslipStatus.FINALIZED.value, PayslipStatus.PAID.value]:
            raise PayslipServiceException(
                "Finalized payslips cannot be cancelled directly to maintain audit trail.",
                code="PAYSLIP_LOCKED",
                status_code=400
            )

        payslip.status = PayslipStatus.CANCELLED.value
        payslip.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(payslip)
        return payslip

    @classmethod
    def get_payslips_list(
        cls,
        db: Session,
        current_user: User,
        employee_id: Optional[int] = None,
        period_start: Optional[date] = None,
        period_end: Optional[date] = None,
        status: Optional[str] = None,
        payrun_id: Optional[int] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Payslip], int]:
        """
        Lists payslips with strict RBAC filtering and company isolation.
        """
        query = db.query(Payslip).join(Employee, Payslip.employee_id == Employee.id)

        # RBAC: Employee can ONLY see their own payslips
        if current_user.role == UserRole.EMPLOYEE.value:
            if not current_user.employee_id:
                return [], 0
            query = query.filter(Payslip.employee_id == current_user.employee_id)
        elif employee_id:
            query = query.filter(Payslip.employee_id == employee_id)

        if payrun_id:
            query = query.filter(Payslip.payrun_id == payrun_id)

        if status:
            # Handle aliases
            if status.lower() == "finalized":
                query = query.filter(Payslip.status.in_([PayslipStatus.FINALIZED.value, PayslipStatus.VALIDATED.value, PayslipStatus.PAID.value]))
            else:
                query = query.filter(Payslip.status == status)

        if period_start:
            query = query.filter(Payslip.period_start >= period_start)
        if period_end:
            query = query.filter(Payslip.period_end <= period_end)

        if search and search.strip():
            kw = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    Payslip.payslip_number.ilike(kw),
                    Employee.name.ilike(kw),
                    Employee.employee_code.ilike(kw),
                    Employee.department.ilike(kw),
                )
            )

        total_count = query.count()
        payslips = query.order_by(desc(Payslip.period_start), desc(Payslip.id)).offset(skip).limit(limit).all()
        return payslips, total_count

    @classmethod
    def get_summary_metrics(cls, db: Session, current_user: User) -> Dict[str, Any]:
        """
        Computes dashboard aggregates for payslips.
        """
        query = db.query(Payslip)
        if current_user.role == UserRole.EMPLOYEE.value and current_user.employee_id:
            query = query.filter(Payslip.employee_id == current_user.employee_id)

        all_slips = query.all()
        total_gross = sum(p.gross_salary or 0.0 for p in all_slips)
        total_deductions = sum(p.total_deductions or 0.0 for p in all_slips)
        total_net = sum(p.net_salary or 0.0 for p in all_slips)
        total_emp_cost = sum(p.total_employer_cost or 0.0 for p in all_slips)

        return {
            "total_payslips": len(all_slips),
            "draft_payslips": sum(1 for p in all_slips if p.status == PayslipStatus.DRAFT.value),
            "computed_payslips": sum(1 for p in all_slips if p.status == PayslipStatus.COMPUTED.value),
            "validated_payslips": sum(1 for p in all_slips if p.status == PayslipStatus.VALIDATED.value),
            "finalized_payslips": sum(1 for p in all_slips if p.status in [PayslipStatus.FINALIZED.value, PayslipStatus.VALIDATED.value, PayslipStatus.PAID.value]),
            "cancelled_payslips": sum(1 for p in all_slips if p.status == PayslipStatus.CANCELLED.value),
            "total_gross": round(total_gross, 2),
            "total_deductions": round(total_deductions, 2),
            "total_net": round(total_net, 2),
            "total_employer_cost": round(emp_cost if (emp_cost := total_emp_cost) > 0 else (total_gross), 2),
        }
