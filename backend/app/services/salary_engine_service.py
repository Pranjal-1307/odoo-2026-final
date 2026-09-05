import ast
import operator
import math
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session

from app.models import SalaryStructure, SalaryRule, Contract, Employee, TimeOffRequest, Attendance


class FormulaEvaluationError(Exception):
    """Raised when formula evaluation fails safely with clear context."""
    pass


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
    def evaluate(cls, expression: str, context: Dict[str, Any]) -> Any:
        if not expression or not expression.strip():
            return 0.0
            
        clean_expr = expression.strip()
        try:
            parsed = ast.parse(clean_expr, mode="eval")
        except SyntaxError as e:
            raise FormulaEvaluationError(f"Invalid syntax in formula expression '{expression}': {str(e)}")

        # Build normalized lookup dictionary (lowercase keys for case-insensitive lookup)
        normalized_context = {}
        for k, v in context.items():
            normalized_context[str(k).lower()] = v
            normalized_context[str(k).upper()] = v
            normalized_context[str(k)] = v

        return cls._eval_node(parsed.body, normalized_context, clean_expr)

    @classmethod
    def _eval_node(cls, node: ast.AST, context: Dict[str, Any], original_expr: str) -> Any:
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
                    f"Variable '{var_name}' referenced in formula '{original_expr}' was not found in payroll context."
                )

        # Unary Operations (e.g. -5, not x)
        elif isinstance(node, ast.UnaryOp):
            op_type = type(node.op)
            if op_type not in cls.ALLOWED_OPERATORS:
                raise FormulaEvaluationError(f"Unsupported unary operator '{op_type.__name__}' in expression.")
            operand = cls._eval_node(node.operand, context, original_expr)
            return cls.ALLOWED_OPERATORS[op_type](operand)

        # Binary Operations (e.g. A + B, X * Y)
        elif isinstance(node, ast.BinOp):
            op_type = type(node.op)
            if op_type not in cls.ALLOWED_OPERATORS:
                raise FormulaEvaluationError(f"Unsupported binary operator '{op_type.__name__}' in expression.")
            left = cls._eval_node(node.left, context, original_expr)
            right = cls._eval_node(node.right, context, original_expr)
            
            # Zero division protection
            if op_type in (ast.Div, ast.FloorDiv, ast.Mod) and right == 0:
                raise FormulaEvaluationError(f"Division by zero encountered in formula '{original_expr}'.")
                
            return cls.ALLOWED_OPERATORS[op_type](left, right)

        # Comparisons (e.g. unpaid_leave_days > 0, basic >= 25000)
        elif isinstance(node, ast.Compare):
            left = cls._eval_node(node.left, context, original_expr)
            for op, comparator in zip(node.ops, node.comparators):
                op_type = type(op)
                if op_type not in cls.ALLOWED_OPERATORS:
                    raise FormulaEvaluationError(f"Unsupported comparison operator '{op_type.__name__}' in expression.")
                right = cls._eval_node(comparator, context, original_expr)
                if not cls.ALLOWED_OPERATORS[op_type](left, right):
                    return False
                left = right
            return True

        # Boolean Logic (e.g. A and B, X or Y)
        elif isinstance(node, ast.BoolOp):
            if isinstance(node.op, ast.And):
                for val_node in node.values:
                    if not cls._eval_node(val_node, context, original_expr):
                        return False
                return True
            elif isinstance(node.op, ast.Or):
                for val_node in node.values:
                    if cls._eval_node(val_node, context, original_expr):
                        return True
                return False

        # Ternary If Expressions (e.g. 5000 if basic > 30000 else 2000)
        elif isinstance(node, ast.IfExp):
            test_val = cls._eval_node(node.test, context, original_expr)
            if test_val:
                return cls._eval_node(node.body, context, original_expr)
            else:
                return cls._eval_node(node.orelse, context, original_expr)

        # Whitelisted Function Calls (e.g. round(X, 2), max(A, B))
        elif isinstance(node, ast.Call):
            if not isinstance(node.func, ast.Name):
                raise FormulaEvaluationError("Complex or chained method calls are not permitted in formulas.")
            func_name = node.func.id.lower()
            if func_name not in cls.ALLOWED_FUNCTIONS:
                raise FormulaEvaluationError(
                    f"Function '{node.func.id}()' is not permitted. Allowed functions: {', '.join(cls.ALLOWED_FUNCTIONS.keys())}"
                )
            args = [cls._eval_node(arg, context, original_expr) for arg in node.args]
            func = cls.ALLOWED_FUNCTIONS[func_name]
            return func(*args)

        else:
            raise FormulaEvaluationError(f"Disallowed syntax node '{type(node).__name__}' in formula expression.")


class SalaryEngineService:
    """
    Core calculation engine executing Salary Structures and Salary Rules deterministically.
    Supports fixed amounts, percentage calculations with dynamic base, and safe formula expressions.
    """

    @staticmethod
    def build_initial_context(
        contract_wage: float,
        days_in_period: int = 30,
        worked_days: float = 30.0,
        paid_leave_days: float = 0.0,
        unpaid_leave_days: float = 0.0,
        employee_dict: Optional[Dict[str, Any]] = None,
        contract_dict: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Creates the initial standardized payroll context variables."""
        daily_wage = round(contract_wage / max(days_in_period, 1), 2)
        
        context: Dict[str, Any] = {
            "contract_wage": float(contract_wage),
            "wage": float(contract_wage),
            "days_in_period": int(days_in_period),
            "worked_days": float(worked_days),
            "paid_leave_days": float(paid_leave_days),
            "unpaid_leave_days": float(unpaid_leave_days),
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

        return context

    @classmethod
    def evaluate_rule(
        cls,
        rule: Any,
        context: Dict[str, Any]
    ) -> Tuple[float, bool, Optional[str]]:
        """
        Evaluates a single rule given current payroll context.
        Returns: (calculated_amount, condition_applied, warning_or_error_note)
        """
        # 1. Condition evaluation
        condition_type = getattr(rule, "condition_type", "always") or "always"
        condition_formula = getattr(rule, "condition_formula", None)
        
        if condition_type.lower() == "conditional" and condition_formula and condition_formula.strip():
            try:
                condition_result = SafeFormulaEvaluator.evaluate(condition_formula, context)
                if not bool(condition_result):
                    return 0.0, False, None
            except Exception as e:
                raise FormulaEvaluationError(
                    f"Condition evaluation failed for rule '{getattr(rule, 'name', 'Rule')}' ({getattr(rule, 'code', '')}): {str(e)}"
                )

        comp_type = getattr(rule, "computation_type", "fixed").lower()
        amount = 0.0

        # 2. Fixed amount calculation
        if comp_type == "fixed":
            fixed_val = getattr(rule, "fixed_amount", 0.0) or 0.0
            amount = float(fixed_val)

        # 3. Percentage calculation
        elif comp_type == "percentage":
            rate = float(getattr(rule, "percentage_rate", 0.0) or 0.0)
            base_code = getattr(rule, "percentage_base_code", None)
            
            if not base_code or not base_code.strip():
                # Default fallback base is basic or contract_wage
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
                raise FormulaEvaluationError(
                    f"Salary calculation failed for rule '{getattr(rule, 'name', 'Rule')}' ({getattr(rule, 'code', '')}): "
                    f"Required base component '{base_key}' is missing or not yet evaluated in sequence."
                )

            amount = round((base_val * rate) / 100.0, 2)

        # 4. Formula calculation
        elif comp_type == "formula":
            formula_expr = getattr(rule, "formula_expression", None)
            if not formula_expr or not formula_expr.strip():
                amount = 0.0
            else:
                try:
                    result = SafeFormulaEvaluator.evaluate(formula_expr, context)
                    amount = round(float(result), 2)
                except Exception as e:
                    raise FormulaEvaluationError(
                        f"Formula calculation error in rule '{getattr(rule, 'name', 'Rule')}' ({getattr(rule, 'code', '')}) "
                        f"with formula '{formula_expr}': {str(e)}"
                    )
        else:
            amount = float(getattr(rule, "fixed_amount", 0.0) or 0.0)

        # Amount must always be non-negative in standard payroll rules
        amount = max(0.0, amount)
        return amount, True, None

    @classmethod
    def calculate_salary_structure(
        cls,
        rules: List[Any],
        contract_wage: float,
        days_in_period: int = 30,
        worked_days: float = 30.0,
        paid_leave_days: float = 0.0,
        unpaid_leave_days: float = 0.0,
        employee_dict: Optional[Dict[str, Any]] = None,
        contract_dict: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes an entire set of rules in sequence order and computes final
        Basic, Earnings, Gross, Deductions, Net salary, and Employer Cost.
        """
        # Sort rules strictly by sequence ascending
        sorted_rules = sorted(rules, key=lambda r: getattr(r, "sequence", 10))
        
        # Build evaluation context
        context = cls.build_initial_context(
            contract_wage=contract_wage,
            days_in_period=days_in_period,
            worked_days=worked_days,
            paid_leave_days=paid_leave_days,
            unpaid_leave_days=unpaid_leave_days,
            employee_dict=employee_dict,
            contract_dict=contract_dict,
        )

        components: List[Dict[str, Any]] = []
        warnings: List[str] = []

        total_earnings = 0.0
        total_deductions = 0.0
        basic_salary = float(contract_wage)
        gross_salary = 0.0
        net_salary = 0.0
        employer_cost = 0.0

        for rule in sorted_rules:
            is_active = getattr(rule, "active", True)
            if not is_active:
                continue

            rule_code = getattr(rule, "code", "").strip().upper()
            rule_name = getattr(rule, "name", rule_code)
            category = getattr(rule, "category", "Basic")
            seq = getattr(rule, "sequence", 10)
            comp_type = getattr(rule, "computation_type", "fixed")
            appears_on_payslip = getattr(rule, "appears_on_payslip", True)
            employer_cost_flag = getattr(rule, "employer_cost_flag", False)

            # Evaluate rule
            amount, condition_applied, warn = cls.evaluate_rule(rule, context)
            if warn:
                warnings.append(warn)

            # Store in context under uppercase and lowercase identifiers
            context[rule_code] = amount
            context[rule_code.lower()] = amount

            # Accumulate categories
            cat_lower = category.lower()

            if cat_lower == "basic":
                basic_salary = amount
                total_earnings += amount
                context["basic"] = basic_salary
                context["BASIC"] = basic_salary
                context["total_earnings"] = total_earnings

            elif cat_lower in ("allowance", "earning"):
                total_earnings += amount
                context["total_earnings"] = total_earnings

            elif cat_lower == "gross":
                # If Gross rule has its own calculated amount, use it; otherwise use total_earnings accumulator
                gross_salary = amount if amount > 0 else total_earnings
                context["gross"] = gross_salary
                context["GROSS"] = gross_salary

            elif cat_lower == "deduction":
                if condition_applied and amount > 0:
                    total_deductions += amount
                    context["total_deductions"] = total_deductions

            elif cat_lower == "employer contribution" or employer_cost_flag:
                if condition_applied and amount > 0:
                    employer_cost += amount
                    context["employer_cost"] = employer_cost

            elif cat_lower == "net":
                # If Net rule has its own calculated formula amount, use it; otherwise gross - total_deductions
                if amount > 0:
                    net_salary = amount
                else:
                    gross_calc = context.get("GROSS") or gross_salary or total_earnings
                    net_salary = max(0.0, round(gross_calc - total_deductions, 2))
                context["net"] = net_salary
                context["NET"] = net_salary

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

        # Final totals pass if not explicitly set by custom Net/Gross rules
        if gross_salary == 0.0 and total_earnings > 0.0:
            gross_salary = total_earnings
            context["gross"] = gross_salary
            context["GROSS"] = gross_salary

        if net_salary == 0.0:
            net_salary = max(0.0, round(gross_salary - total_deductions, 2))
            context["net"] = net_salary
            context["NET"] = net_salary

        return {
            "contract_wage": float(contract_wage),
            "basic_salary": round(basic_salary, 2),
            "gross_earnings": round(gross_salary, 2),
            "total_deductions": round(total_deductions, 2),
            "net_salary": round(net_salary, 2),
            "employer_cost": round(employer_cost, 2),
            "components": components,
            "warnings": warnings,
            "context_used": {k: v for k, v in context.items() if isinstance(v, (int, float, str, bool))},
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

        # Pull employee context if provided
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
