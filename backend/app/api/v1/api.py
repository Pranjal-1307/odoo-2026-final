from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, employees, contracts, working_schedules

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["User Management"])
api_router.include_router(employees.router, prefix="/employees", tags=["Employee Master"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["Contract Management"])
api_router.include_router(working_schedules.router, prefix="/working-schedules", tags=["Working Schedules"])
