from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    users,
    employees,
    contracts,
    working_schedules,
    attendance,
    time_off,
    salary_structures,
    salary_rules,
    salary_engine,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employee Master"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["Contract Management"])
api_router.include_router(working_schedules.router, prefix="/working-schedules", tags=["Working Schedules"])
api_router.include_router(attendance.router, prefix="/attendance", tags=["Attendance Management"])
api_router.include_router(time_off.router, prefix="/time-off", tags=["Time Off Management"])
api_router.include_router(salary_structures.router, prefix="/payroll/salary-structures", tags=["Salary Structures"])
api_router.include_router(salary_rules.router, prefix="/payroll/salary-rules", tags=["Salary Rules"])
api_router.include_router(salary_engine.router, prefix="/payroll", tags=["Salary Rules Engine"])
api_router.include_router(salary_engine.router, prefix="/payroll/salary-engine", tags=["Salary Rules Engine"])



