from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, field_validator


class SalaryRuleBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="Salary rule display name e.g. House Rent Allowance")
    code: str = Field(..., min_length=1, max_length=50, description="Unique code e.g. HRA, BASIC, GROSS, PF, NET")
    category: str = Field("Basic", description="Rule category: Basic, Allowance, Gross, Deduction, Employer Contribution, Net")
    sequence: int = Field(10, ge=1, le=10000, description="Execution sequence (ascending)")
    computation_type: str = Field("fixed", description="Calculation type: fixed, percentage, formula")
    
    # Computation config
    fixed_amount: float = Field(0.0, ge=0.0, description="Fixed amount value")
    percentage_base_code: Optional[str] = Field(None, max_length=50, description="Code of base component (e.g. BASIC)")
    percentage_rate: float = Field(0.0, ge=0.0, description="Percentage rate (e.g. 40.0 for 40%)")
    formula_expression: Optional[str] = Field(None, description="Mathematical expression e.g. BASIC + HRA + TRANSPORT")
    
    # Conditions and metadata
    condition_type: str = Field("always", description="Condition type: always, conditional")
    condition_formula: Optional[str] = Field(None, description="Condition expression e.g. unpaid_leave_days > 0")
    appears_on_payslip: bool = Field(True, description="Whether rule appears on employee payslip")
    employer_cost_flag: bool = Field(False, description="Whether this is an employer contribution/cost")
    active: bool = Field(True, description="Active status")
    description: Optional[str] = Field(None, description="Rule description or statutory reference")

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        clean = v.strip().upper()
        if not clean:
            raise ValueError("Rule code cannot be empty.")
        if not clean.replace("_", "").isalnum():
            raise ValueError("Rule code must contain only alphanumeric characters and underscores.")
        return clean

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        valid = {"Basic", "Allowance", "Gross", "Deduction", "Employer Contribution", "Net"}
        # Case-insensitive match normalization
        mapping = {c.lower(): c for c in valid}
        matched = mapping.get(v.strip().lower())
        if not matched:
            raise ValueError(f"Category '{v}' is invalid. Must be one of: {', '.join(valid)}")
        return matched

    @field_validator("computation_type")
    @classmethod
    def validate_computation_type(cls, v: str) -> str:
        valid = {"fixed", "percentage", "formula"}
        cleaned = v.strip().lower()
        if cleaned not in valid:
            raise ValueError(f"Computation type '{v}' is invalid. Must be one of: fixed, percentage, formula")
        return cleaned

    @field_validator("condition_type")
    @classmethod
    def validate_condition_type(cls, v: str) -> str:
        valid = {"always", "conditional"}
        cleaned = v.strip().lower()
        if cleaned not in valid:
            raise ValueError(f"Condition type '{v}' is invalid. Must be one of: always, conditional")
        return cleaned


class SalaryRuleCreate(SalaryRuleBase):
    structure_id: Optional[int] = Field(None, description="Salary structure ID if attaching directly")


class SalaryRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    code: Optional[str] = Field(None, min_length=1, max_length=50)
    category: Optional[str] = None
    sequence: Optional[int] = Field(None, ge=1, le=10000)
    computation_type: Optional[str] = None
    fixed_amount: Optional[float] = Field(None, ge=0.0)
    percentage_base_code: Optional[str] = None
    percentage_rate: Optional[float] = Field(None, ge=0.0)
    formula_expression: Optional[str] = None
    condition_type: Optional[str] = None
    condition_formula: Optional[str] = None
    appears_on_payslip: Optional[bool] = None
    employer_cost_flag: Optional[bool] = None
    active: Optional[bool] = None
    description: Optional[str] = None

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().upper()
            if not clean.replace("_", "").isalnum():
                raise ValueError("Rule code must contain only alphanumeric characters and underscores.")
            return clean
        return v


class SalaryRuleResponse(BaseModel):
    id: int
    structure_id: int
    structure_name: Optional[str] = None
    structure_code: Optional[str] = None
    name: str
    code: str
    category: str
    sequence: int
    computation_type: str
    fixed_amount: float
    percentage_base_code: Optional[str] = None
    percentage_rate: float
    formula_expression: Optional[str] = None
    condition_type: str
    condition_formula: Optional[str] = None
    appears_on_payslip: bool
    employer_cost_flag: bool
    active: bool
    description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SalaryRuleListResponse(BaseModel):
    items: List[SalaryRuleResponse]
    total: int
    page: int
    limit: int


class SalaryRuleReorderItem(BaseModel):
    id: int
    sequence: int = Field(..., ge=1, le=10000)


class SalaryRuleReorderRequest(BaseModel):
    rules: List[SalaryRuleReorderItem]
