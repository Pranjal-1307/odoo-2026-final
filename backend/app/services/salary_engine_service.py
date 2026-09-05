import ast
import operator
import math
from typing import Dict, Any, List, Optional, Tuple
from datetime import date, datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func

from app.models import (
    SalaryStructure,
    SalaryRule,
    Contract,
    Employee,
    TimeOffRequest,
    Attendance,
    TimeOffType,
    WorkingSchedule,
    EmployeeStatus,
    ContractStatus,
    LeaveRequestStatus,
    AttendanceStatus,
)


class SalaryEngineException(Exception):
    """Base exception for Salary Rules Engine errors with error codes."""
    def __init__(self, message: str, code: str = "CALCULATION_ERROR", rule_code: Optional[str] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.rule_code = rule_code


class FormulaEvaluationError(SalaryEngineException):
    """Raised when formula evaluation fails safely with clear context."""
    def __init__(self, message: str, rule_code: Optional[str] = None):
        super().__init__(message, code="FORMULA_EVALUATION_ERROR", rule_code=rule_code)


class MissingPercentageBaseError(SalaryEngineException):
    """Raised when percentage calculation references an uncalculated base."""
    def __init__(self, message: str, rule_code: Optional[str] = None):
        super().__init__(message, code="MISSING_PERCENTAGE_BASE", rule_code=rule_code)


class DivisionByZeroError(SalaryEngineException):
    """Raised when division by zero occurs during computation."""
    def __init__(self, message: str, rule_code: Optional[str] = None):
        super().__init__(message, code="DIVISION_BY_ZERO", rule_code=rule_code)


class SafeFormulaEvaluator:
    """
    Sandboxed AST-based mathematical expression evaluator.
    Strictly forbids unsafe execution while allowing rich arithmetic, comparisons,
    logical operators, ternary conditionals, and standard math helpers.
    """
    
    ALLOWED_OPERATORS = {
        # Arithmetic
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.FloorDiv: operator.floordiv,
        ast.Mod: operator.mod,
        ast.Pow: operator.pow,
        # Unary
        ast.USub: operator.neg,
        ast.UAdd: operator.pos,
        ast.Not: operator.not_,
        # Comparison
        ast.Eq: operator.eq,
        ast.NotEq: operator.ne,
        ast.Lt: operator.lt,
        ast.LtE: operator.le,
        ast.Gt: operator.gt,
        ast.GtE: operator.ge,
    }

    ALLOWED_FUNCTIONS = {
        "min": min,
        "max": max,
        "round": round,
        "abs": abs,
        "int": int,
        "float": float,
        "ceil": math.ceil,
        "floor": math.floor,
    }

    @classmethod
    def evaluate(cls, expression: str, context: Dict[str, Any], rule_code: Optional[str] = None) -> Any:
        if not expression or not expression.strip():
            return 0.0
            
        clean_expr = expression.strip()
        try:
            parsed = ast.parse(clean_expr, mode="eval")
        except SyntaxError as e:
            raise FormulaEvaluationError(
                f"Invalid syntax in formula expression '{expression}': {str(e)}",
                rule_code=rule_code
            )

        # Build normalized lookup dictionary (lowercase, uppercase, exact keys)
        normalized_context = {}
        for k, v in context.items():
            normalized_context[str(k).lower()] = v
            normalized_context[str(k).upper()] = v
            normalized_context[str(k)] = v

        return cls._eval_node(parsed.body, normalized_context, clean_expr, rule_code=rule_code)

    @classmethod
    def _eval_node(cls, node: ast.AST, context: Dict[str, Any], original_expr: str, rule_code: Optional[str] = None) -> Any:
        # Constants / Numbers / Strings / Booleans
        if isinstance(node, ast.Constant):
            return node.value

        # Variable Identifiers
        elif isinstance(node, ast.Name):
            var_name = node.id
            if var_name in context:
                val = context[var_name]
                return float(val) if isinstance(val, (int, float)) else val
            elif var_name.lower() in context:
                val = context[var_name.lower()]
                return float(val) if isinstance(val, (int, float)) else val
            elif var_name.upper() in context:
                val = context[var_name.upper()]
                return float(val) if isinstance(val, (int, float)) else val
            elif var_name.lower() in cls.ALLOWED_FUNCTIONS:
                return cls.ALLOWED_FUNCTIONS[var_name.lower()]
            else:
                raise FormulaEvaluationError(
                    f"Variable '{var_name}' referenced in formula '{original_expr}' was not found in payroll context.",
                    rule_code=rule_code
                )

        # Unary Operations (e.g. -5, not x)
        elif isinstance(node, ast.UnaryOp):
            op_type = type(node.op)
            if op_type not in cls.ALLOWED_OPERATORS:
                raise FormulaEvaluationError(f"Unsupported unary operator '{op_type.__name__}' in expression.", rule_code=rule_code)
            operand = cls._eval_node(node.operand, context, original_expr, rule_code=rule_code)
            return cls.ALLOWED_OPERATORS[op_type](operand)

        # Binary Operations (e.g. A + B, X * Y)
        elif isinstance(node, ast.BinOp):
            op_type = type(node.op)
            if op_type not in cls.ALLOWED_OPERATORS:
                raise FormulaEvaluationError(f"Unsupported binary operator '{op_type.__name__}' in expression.", rule_code=rule_code)
            left = cls._eval_node(node.left, context, original_expr, rule_code=rule_code)
            right = cls._eval_node(node.right, context, original_expr, rule_code=rule_code)
            
            # Zero division protection
            if op_type in (ast.Div, ast.FloorDiv, ast.Mod) and (right == 0 or right == 0.0):
                raise DivisionByZeroError(f"Division by zero encountered in formula '{original_expr}'.", rule_code=rule_code)
                
            return cls.ALLOWED_OPERATORS[op_type](left, right)

        # Comparisons (e.g. unpaid_leave_days > 0, basic >= 25000)
        elif isinstance(node, ast.Compare):
            left = cls._eval_node(node.left, context, original_expr, rule_code=rule_code)
            for op, comparator in zip(node.ops, node.comparators):
                op_type = type(op)
                if op_type not in cls.ALLOWED_OPERATORS:
                    raise FormulaEvaluationError(f"Unsupported comparison operator '{op_type.__name__}' in expression.", rule_code=rule_code)
                right = cls._eval_node(comparator, context, original_expr, rule_code=rule_code)
                if not cls.ALLOWED_OPERATORS[op_type](left, right):
                    return False
                left = right
            return True

        # Boolean Logic (e.g. A and B, X or Y)
        elif isinstance(node, ast.BoolOp):
            if isinstance(node.op, ast.And):
                for val_node in node.values:
                    if not cls._eval_node(val_node, context, original_expr, rule_code=rule_code):
                        return False
                return True
            elif isinstance(node.op, ast.Or):
                for val_node in node.values:
                    if cls._eval_node(val_node, context, original_expr, rule_code=rule_code):
                        return True
                return False

        # Ternary If Expressions (e.g. 5000 if basic > 30000 else 2000)
        elif isinstance(node, ast.IfExp):
            test_val = cls._eval_node(node.test, context, original_expr, rule_code=rule_code)
            if test_val:
                return cls._eval_node(node.body, context, original_expr, rule_code=rule_code)
            else:
                return cls._eval_node(node.orelse, context, original_expr, rule_code=rule_code)

        # Whitelisted Function Calls (e.g. round(X, 2), max(A, B))
        elif isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name):
                raise FormulaEvaluationError("Complex or chained method calls are not permitted in formulas.", rule_code=rule_code)
            func_name = node.func.id.lower()
            if func_name not in cls.ALLOWED_FUNCTIONS:
                raise FormulaEvaluationError(
                    f"Function '{node.func.id}()' is not permitted. Allowed functions: {', '.join(cls.ALLOWED_FUNCTIONS.keys())}",
                    rule_code=rule_code
                )
            args = [cls._eval_node(arg, context, original_expr, rule_code=rule_code) for arg in node.args]
            func = cls.ALLOWED_FUNCTIONS[func_name]
            return func(*args)

        else:
            raise FormulaEvaluationError(f"Disallowed syntax node '{type(node).__name__}' in formula expression.", rule_code=rule_code)


class SalaryEngineService:
    """
    Core calculation engine executing Salary Structures and Salary Rules deterministically.
    Supports fixed amounts, percentage calculations with dynamic base, and safe formula expressions.
    """

    @staticmethod
    def build_initial_context(
        contract_wage: float,
        days_in_period: int = 30,
        scheduled_days: int = 22,
        worked_days: float = 22.0,
        absent_days: float = 0.0,
        paid_leave_days: float = 0.0,
        unpaid_leave_days: float = 0.0,
        overtime_hours: float = 0.0,
        total_worked_hours: float = 0.0,
        employee_dict: Optional[Dict[str, Any]] = None,
        contract_dict: Optional[Dict[str, Any]] = None,
        period_dict: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Creates the initial standardized payroll context variables."""
        effective_days = max(scheduled_days if scheduled_days > 0 else days_in_period, 1)
        daily_wage = round(contract_wage / effective_days, 2)
        
        context: Dict[str, Any] = {
            # Standard wage variables
            "contract_wage": float(contract_wage),
            "wage": float(contract_wage),
            "days_in_period": int(days_in_period),
            "scheduled_days": int(scheduled_days),
            "worked_days": float(worked_days),
            "absent_days": float(absent_days),
            "paid_leave_days": float(paid_leave_days),
            "unpaid_leave_days": float(unpaid_leave_days),
            "overtime_hours": float(overtime_hours),
            "total_worked_hours": float(total_worked_hours),
            "daily_wage": float(daily_wage),
            
            # Initial accumulators
            "basic": float(contract_wage),
            "BASIC": float(contract_wage),
            "gross": 0.0,
            "GROSS": 0.0,
            "total_earnings": 0.0,
            "total_deductions": 0.0,
            "net": 0.0,
            "NET": 0.0,
            "employer_cost": 0.0,
        }

        if employee_dict:
            context["employee"] = employee_dict
        if contract_dict:
            context["contract"] = contract_dict
        if period_dict:
            context["period"] = period_dict

        return context

    @classmethod
    def evaluate_rule(
        cls,
        rule: Any,
        context: Dict[str, Any]
    ) -> Tuple[float, bool, str, Dict[str, Any], Optional[str]]:
        """
        Evaluates a single rule given current payroll context.
        Returns: (amount, condition_applied, status, inputs_used, note_or_reason)
        """
        rule_code = getattr(rule, "code", "").strip().upper()
        rule_name = getattr(rule, "name", rule_code)
        inputs_used: Dict[str, Any] = {}

        # 1. Condition evaluation
        condition_type = getattr(rule, "condition_type", "always") or "always"
        condition_formula = getattr(rule, "condition_formula", None)
        
        if condition_type.lower() == "conditional" and condition_formula and condition_formula.strip():
            try:
                condition_result = SafeFormulaEvaluator.evaluate(condition_formula, context, rule_code=rule_code)
                if not bool(condition_result):
                    return 0.0, False, "skipped", inputs_used, f"Condition '{condition_formula}' evaluated to False"
            except SalaryEngineException:
                raise
            except Exception as e:
                raise FormulaEvaluationError(
                    f"Condition evaluation failed for rule '{rule_name}' ({rule_code}): {str(e)}",
                    rule_code=rule_code
                )

        comp_type = getattr(rule, "computation_type", "fixed").lower()
        amount = 0.0
        formula_or_rate = None

        # 2. Fixed amount calculation
        if comp_type == "fixed":
            fixed_val = getattr(rule, "fixed_amount", 0.0) or 0.0
            amount = float(fixed_val)
            inputs_used["fixed_amount"] = amount
            formula_or_rate = f"₹{amount:,.2f}"

        # 3. Percentage calculation
        elif comp_type == "percentage":
            rate = float(getattr(rule, "percentage_rate", 0.0) or 0.0)
            base_code = getattr(rule, "percentage_base_code", None)
            
            if not base_code or not base_code.strip():
                base_code = "BASIC"
                
            base_key = base_code.strip()
            
            # Look up base value in context
            if base_key in context:
                base_val = float(context[base_key])
            elif base_key.upper() in context:
                base_val = float(context[base_key.upper()])
            elif base_key.lower() in context:
                base_val = float(context[base_key.lower()])
            else:
                raise MissingPercentageBaseError(
                    f"Salary calculation failed for rule '{rule_name}' ({rule_code}): "
                    f"Required base component '{base_key}' is missing or not yet evaluated in sequence.",
                    rule_code=rule_code
                )

            inputs_used[base_key] = base_val
            inputs_used["percentage_rate"] = rate
            formula_or_rate = f"{rate}% of {base_key} (₹{base_val:,.2f})"
            amount = round((base_val * rate) / 100.0, 2)

        # 4. Formula calculation
        elif comp_type == "formula":
            formula_expr = getattr(rule, "formula_expression", None)
            if not formula_expr or not formula_expr.strip():
                amount = 0.0
            else:
                formula_or_rate = formula_expr.strip()
                try:
                    result = SafeFormulaEvaluator.evaluate(formula_expr, context, rule_code=rule_code)
                    amount = round(float(result), 2)
                    inputs_used["formula"] = formula_expr
                except SalaryEngineException:
                    raise
                except Exception as e:
                    raise FormulaEvaluationError(
                        f"Formula calculation error in rule '{rule_name}' ({rule_code}) with expression '{formula_expr}': {str(e)}",
                        rule_code=rule_code
                    )
        else:
            amount = float(getattr(rule, "fixed_amount", 0.0) or 0.0)

        # Standard amount non-negativity constraint
        amount = max(0.0, amount)
        return amount, True, "calculated", inputs_used, formula_or_rate

    @classmethod
    def calculate_salary_structure(
        cls,
        rules: List[Any],
        contract_wage: float,
        days_in_period: int = 30,
        scheduled_days: int = 22,
        worked_days: float = 22.0,
        absent_days: float = 0.0,
        paid_leave_days: float = 0.0,
        unpaid_leave_days: float = 0.0,
        overtime_hours: float = 0.0,
        total_worked_hours: float = 0.0,
        employee_dict: Optional[Dict[str, Any]] = None,
        contract_dict: Optional[Dict[str, Any]] = None,
        period_dict: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes an entire set of rules in deterministic sequence order (sequence ASC, id ASC)
        and computes category breakdowns, gross salary, total deductions, net salary, and execution trace.
        """
        # Deterministic sorting: sequence ASC, then id ASC (or rule code)
        sorted_rules = sorted(
            rules,
            key=lambda r: (getattr(r, "sequence", 10) or 10, getattr(r, "id", 0) or 0)
        )
        
        # Build evaluation context
        context = cls.build_initial_context(
            contract_wage=contract_wage,
            days_in_period=days_in_period,
            scheduled_days=scheduled_days,
            worked_days=worked_days,
            absent_days=absent_days,
            paid_leave_days=paid_leave_days,
            unpaid_leave_days=unpaid_leave_days,
            overtime_hours=overtime_hours,
            total_worked_hours=total_worked_hours,
            employee_dict=employee_dict,
            contract_dict=contract_dict,
            period_dict=period_dict,
        )

        components: List[Dict[str, Any]] = []
        calculation_trace: List[Dict[str, Any]] = []
        warnings: List[str] = []

        basic_total = 0.0
        allowance_total = 0.0
        earning_total = 0.0
        gross_salary = 0.0
        total_deductions = 0.0
        employer_contribution_total = 0.0
        net_salary = 0.0

        for rule in sorted_rules:
            is_active = getattr(rule, "active", True)
            rule_code = getattr(rule, "code", "").strip().upper()
            rule_name = getattr(rule, "name", rule_code)
            category = getattr(rule, "category", "Basic")
            seq = getattr(rule, "sequence", 10)
            comp_type = getattr(rule, "computation_type", "fixed")
            appears_on_payslip = getattr(rule, "appears_on_payslip", True)
            employer_cost_flag = getattr(rule, "employer_cost_flag", False)

            if not is_active:
                calculation_trace.append({
                    "sequence": seq,
                    "rule_id": getattr(rule, "id", None),
                    "rule_code": rule_code,
                    "rule_name": rule_name,
                    "category": category,
                    "computation_type": comp_type,
                    "status": "skipped",
                    "condition_applied": False,
                    "inputs_used": {},
                    "formula_or_rate": None,
                    "amount": 0.0,
                    "appears_on_payslip": appears_on_payslip,
                    "employer_cost_flag": employer_cost_flag,
                    "note": "Rule is inactive",
                })
                continue

            # Evaluate rule
            amount, condition_applied, status, inputs_used, note_or_rate = cls.evaluate_rule(rule, context)

            # Store in context under uppercase and lowercase identifiers
            context[rule_code] = amount
            context[rule_code.lower()] = amount

            # Trace recording
            calculation_trace.append({
                "sequence": seq,
                "rule_id": getattr(rule, "id", None),
                "rule_code": rule_code,
                "rule_name": rule_name,
                "category": category,
                "computation_type": comp_type,
                "status": status,
                "condition_applied": condition_applied,
                "inputs_used": inputs_used,
                "formula_or_rate": note_or_rate,
                "amount": amount,
                "appears_on_payslip": appears_on_payslip,
                "employer_cost_flag": employer_cost_flag,
                "note": None if status == "calculated" else note_or_rate,
            })

            # Accumulate categories
            cat_lower = category.lower()

            if cat_lower == "basic":
                if condition_applied:
                    basic_total += amount
                    context["basic"] = basic_total
                    context["BASIC"] = basic_total

            elif cat_lower == "allowance":
                if condition_applied:
                    allowance_total += amount

            elif cat_lower == "earning":
                if condition_applied:
                    earning_total += amount

            elif cat_lower == "gross":
                # Explicit GROSS rule
                if condition_applied and amount > 0:
                    gross_salary = amount
                    context["gross"] = gross_salary
                    context["GROSS"] = gross_salary

            elif cat_lower == "deduction":
                if condition_applied and amount > 0:
                    total_deductions += amount
                    context["total_deductions"] = total_deductions

            elif cat_lower == "employer contribution" or employer_cost_flag:
                if condition_applied and amount > 0:
                    employer_contribution_total += amount
                    context["employer_contribution_total"] = employer_contribution_total

            elif cat_lower == "net":
                # Explicit NET rule
                if condition_applied and amount > 0:
                    net_salary = amount
                    context["net"] = net_salary
                    context["NET"] = net_salary

            if appears_on_payslip or condition_applied:
                components.append({
                    "sequence": seq,
                    "rule_id": getattr(rule, "id", None),
                    "rule_code": rule_code,
                    "rule_name": rule_name,
                    "category": category,
                    "computation_type": comp_type,
                    "amount": amount,
                    "description": getattr(rule, "description", None),
                    "appears_on_payslip": appears_on_payslip,
                    "employer_cost_flag": employer_cost_flag,
                    "condition_applied": condition_applied,
                })

        # Category Aggregation fallback for Gross Salary
        if gross_salary == 0.0:
            gross_salary = round(basic_total + allowance_total + earning_total, 2)
            context["gross"] = gross_salary
            context["GROSS"] = gross_salary

        # Fallback for Net Salary
        if net_salary == 0.0:
            net_salary = round(gross_salary - total_deductions, 2)
            context["net"] = net_salary
            context["NET"] = net_salary

        # Employer Cost: Employee Gross + Employer Contributions
        employer_cost = round(gross_salary + employer_contribution_total, 2)
        context["employer_cost"] = employer_cost

        # Validation checks
        if net_salary < 0:
            warnings.append(
                f"Negative Net Salary detected: ₹{net_salary:,.2f}. Total Deductions (₹{total_deductions:,.2f}) exceed Gross Salary (₹{gross_salary:,.2f})."
            )

        if total_deductions > gross_salary and gross_salary > 0:
            warnings.append(
                f"High Deductions Warning: Total deductions (₹{total_deductions:,.2f}) exceed Gross Salary (₹{gross_salary:,.2f})."
            )

        return {
            "contract_wage": float(contract_wage),
            "basic_salary": round(basic_total if basic_total > 0 else contract_wage, 2),
            "allowance_total": round(allowance_total, 2),
            "earning_total": round(earning_total, 2),
            "gross_salary": round(gross_salary, 2),
            "gross_earnings": round(gross_salary, 2),  # backward compatibility
            "total_deductions": round(total_deductions, 2),
            "net_salary": round(net_salary, 2),
            "employer_contribution_total": round(employer_contribution_total, 2),
            "employer_cost": round(employer_cost, 2),
            "components": components,
            "calculation_trace": calculation_trace,
            "warnings": warnings,
            "context_used": {k: v for k, v in context.items() if isinstance(v, (int, float, str, bool))},
        }

    @classmethod
    def calculate_employee_payroll(
        cls,
        db: Session,
        employee_id: int,
        period_start: date,
        period_end: date,
        contract_id: Optional[int] = None,
        custom_inputs: Optional[Dict[str, float]] = None,
    ) -> Dict[str, Any]:
        """
        Full end-to-end payroll calculation for an employee during a given period:
        1. Validates Employee is active and eligible.
        2. Resolves active Contract overlapping period (or validates specific contract).
        3. Resolves assigned Salary Structure and loaded active Rules.
        4. Gathers Attendance data within period (worked days, scheduled days, absent days, overtime).
        5. Gathers approved Time Off data within period (paid days, unpaid days).
        6. Builds context and executes deterministic calculation engine.
        7. Returns comprehensive preview result with metadata, breakdowns, and execution trace.
        """
        # 1. Validate employee
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise SalaryEngineException(f"Employee #{employee_id} does not exist.", code="EMPLOYEE_NOT_FOUND")

        if employee.status == EmployeeStatus.INACTIVE.value or employee.status == EmployeeStatus.TERMINATED.value:
            raise SalaryEngineException(f"Employee '{employee.name}' is inactive or terminated.", code="EMPLOYEE_INACTIVE")

        # 2. Find applicable contract
        contract_query = db.query(Contract).filter(
            Contract.employee_id == employee_id,
            Contract.start_date <= period_end,
            or_(Contract.end_date.is_(None), Contract.end_date >= period_start)
        )

        if contract_id is not None:
            contract = contract_query.filter(Contract.id == contract_id).first()
            if not contract:
                raise SalaryEngineException(
                    f"Contract #{contract_id} not found or not applicable for period {period_start} to {period_end}.",
                    code="INVALID_CONTRACT"
                )
        else:
            applicable_contracts = contract_query.filter(
                Contract.status.in_([ContractStatus.RUNNING.value, "active", "Running", "running"])
            ).all()

            if not applicable_contracts:
                # Fallback: check any contract in the period
                applicable_contracts = contract_query.all()

            if not applicable_contracts:
                raise SalaryEngineException(
                    f"No applicable contract found for employee '{employee.name}' in period {period_start} to {period_end}.",
                    code="NO_APPLICABLE_CONTRACT"
                )

            if len(applicable_contracts) > 1:
                # Multi-contract protection: pick the most recent or raise warning
                # For MVP pick the active running one with highest wage/latest start date
                contract = sorted(applicable_contracts, key=lambda c: (c.start_date, c.id), reverse=True)[0]
            else:
                contract = applicable_contracts[0]

        # 3. Find salary structure
        structure = db.query(SalaryStructure).filter(SalaryStructure.id == contract.salary_structure_id).first()
        if not structure:
            raise SalaryEngineException(
                f"Contract '{contract.contract_code}' has no valid Salary Structure assigned (ID: {contract.salary_structure_id}).",
                code="NO_SALARY_STRUCTURE"
            )

        if not structure.rules:
            raise SalaryEngineException(
                f"Salary Structure '{structure.name}' contains no Salary Rules.",
                code="NO_RULES_IN_STRUCTURE"
            )

        # 4. Gather Attendance Inputs
        days_in_period = (period_end - period_start).days + 1
        
        # Calculate scheduled days
        scheduled_days = 22  # default standard business days in monthly period
        if employee.working_schedule and employee.working_schedule.days:
            # Calculate actual schedule days based on working schedule definition
            active_days_of_week = {d.day_of_week.lower() for d in employee.working_schedule.days}
            calc_scheduled = 0
            curr = period_start
            while curr <= period_end:
                day_name = curr.strftime("%A").lower()
                if day_name in active_days_of_week:
                    calc_scheduled += 1
                curr = curr.fromordinal(curr.toordinal() + 1)
            scheduled_days = max(calc_scheduled, 1)

        # Query Attendance records in period
        attendances = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.date >= period_start,
            Attendance.date <= period_end,
        ).all()

        present_statuses = {
            AttendanceStatus.PRESENT.value,
            AttendanceStatus.CHECKED_IN.value,
            AttendanceStatus.PARTIAL.value,
            AttendanceStatus.LATE.value,
            AttendanceStatus.OVERTIME.value,
        }

        worked_days = 0.0
        total_worked_hours = 0.0
        overtime_hours = 0.0
        late_minutes = 0

        for att in attendances:
            if att.status in present_statuses:
                worked_days += 1.0
                total_worked_hours += (att.worked_hours or 0.0)
                overtime_hours += (att.overtime_hours or 0.0)
                late_minutes += (att.late_minutes or 0)

        # Default fallback if no attendance records exist for test/preview
        if len(attendances) == 0:
            worked_days = float(scheduled_days)

        # 5. Gather Time Off Inputs
        time_off_requests = db.query(TimeOffRequest).filter(
            TimeOffRequest.employee_id == employee_id,
            TimeOffRequest.status == LeaveRequestStatus.APPROVED.value,
            TimeOffRequest.start_date <= period_end,
            TimeOffRequest.end_date >= period_start,
        ).all()

        paid_leave_days = 0.0
        unpaid_leave_days = 0.0
        leave_records_count = len(time_off_requests)

        for req in time_off_requests:
            is_unpaid = req.time_off_type.is_unpaid if req.time_off_type else False
            if is_unpaid:
                unpaid_leave_days += (req.duration or 0.0)
            else:
                paid_leave_days += (req.duration or 0.0)

        # 6. Apply custom override simulation inputs if provided
        contract_wage = float(contract.wage_per_month or 0.0)
        if custom_inputs:
            if "contract_wage" in custom_inputs:
                contract_wage = float(custom_inputs["contract_wage"])
            if "worked_days" in custom_inputs:
                worked_days = float(custom_inputs["worked_days"])
            if "unpaid_leave_days" in custom_inputs:
                unpaid_leave_days = float(custom_inputs["unpaid_leave_days"])
            if "paid_leave_days" in custom_inputs:
                paid_leave_days = float(custom_inputs["paid_leave_days"])
            if "scheduled_days" in custom_inputs:
                scheduled_days = int(custom_inputs["scheduled_days"])
            if "overtime_hours" in custom_inputs:
                overtime_hours = float(custom_inputs["overtime_hours"])

        absent_days = max(0.0, float(scheduled_days) - worked_days - paid_leave_days - unpaid_leave_days)

        employee_dict = {
            "id": employee.id,
            "name": employee.name,
            "employee_code": employee.employee_code,
            "work_email": employee.work_email,
            "department": employee.department,
            "job_position": employee.job_position,
            "company": employee.company or "PeoplePay360 Inc.",
        }

        contract_dict = {
            "id": contract.id,
            "contract_code": contract.contract_code,
            "name": contract.name,
            "wage_per_month": contract_wage,
            "start_date": str(contract.start_date),
            "end_date": str(contract.end_date) if contract.end_date else None,
            "status": contract.status,
            "salary_structure_id": structure.id,
        }

        period_dict = {
            "start": str(period_start),
            "end": str(period_end),
            "days_in_period": days_in_period,
        }

        # 7. Execute Calculation Engine
        calc_result = cls.calculate_salary_structure(
            rules=structure.rules,
            contract_wage=contract_wage,
            days_in_period=days_in_period,
            scheduled_days=scheduled_days,
            worked_days=worked_days,
            absent_days=absent_days,
            paid_leave_days=paid_leave_days,
            unpaid_leave_days=unpaid_leave_days,
            overtime_hours=overtime_hours,
            total_worked_hours=total_worked_hours,
            employee_dict=employee_dict,
            contract_dict=contract_dict,
            period_dict=period_dict,
        )

        return {
            "mode": "preview",
            "status": "WARNING" if calc_result["warnings"] else "SUCCESS",
            "employee": employee_dict,
            "contract": contract_dict,
            "structure": {
                "id": structure.id,
                "name": structure.name,
                "code": structure.code,
                "pay_frequency": structure.pay_frequency,
                "active": structure.active,
            },
            "period": {
                "start_date": period_start,
                "end_date": period_end,
                "days_in_period": days_in_period,
            },
            "attendance": {
                "scheduled_days": scheduled_days,
                "worked_days": worked_days,
                "absent_days": absent_days,
                "total_worked_hours": total_worked_hours,
                "overtime_hours": overtime_hours,
                "late_minutes": late_minutes,
            },
            "time_off": {
                "paid_leave_days": paid_leave_days,
                "unpaid_leave_days": unpaid_leave_days,
                "total_leave_days": paid_leave_days + unpaid_leave_days,
                "leave_records_count": leave_records_count,
            },
            "basic_salary": calc_result["basic_salary"],
            "allowance_total": calc_result["allowance_total"],
            "earning_total": calc_result["earning_total"],
            "gross_salary": calc_result["gross_salary"],
            "total_deductions": calc_result["total_deductions"],
            "net_salary": calc_result["net_salary"],
            "employer_contribution_total": calc_result["employer_contribution_total"],
            "employer_cost": calc_result["employer_cost"],
            "components": calc_result["components"],
            "calculation_trace": calc_result["calculation_trace"],
            "warnings": calc_result["warnings"],
            "context_used": calc_result["context_used"],
        }

    @classmethod
    def preview_structure(
        cls,
        db: Session,
        structure_id: int,
        contract_wage: float,
        days_in_period: int = 30,
        worked_days: float = 30.0,
        paid_leave_days: float = 0.0,
        unpaid_leave_days: float = 0.0,
        employee_id: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Loads a SalaryStructure from the database and runs a live simulation."""
        structure = db.query(SalaryStructure).filter(SalaryStructure.id == structure_id).first()
        if not structure:
            raise ValueError(f"Salary Structure #{structure_id} not found.")

        employee_dict = None
        if employee_id:
            emp = db.query(Employee).filter(Employee.id == employee_id).first()
            if emp:
                employee_dict = {
                    "id": emp.id,
                    "name": emp.name,
                    "code": emp.employee_code,
                    "department": emp.department,
                    "job_position": emp.job_position,
                }

        calc_result = cls.calculate_salary_structure(
            rules=structure.rules,
            contract_wage=contract_wage,
            days_in_period=days_in_period,
            worked_days=worked_days,
            paid_leave_days=paid_leave_days,
            unpaid_leave_days=unpaid_leave_days,
            employee_dict=employee_dict,
        )

        calc_result["structure_id"] = structure.id
        calc_result["structure_name"] = structure.name
        calc_result["structure_code"] = structure.code
        return calc_result
