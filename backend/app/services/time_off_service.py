from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, date, time, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

from app.models import (
    TimeOffType,
    TimeOffAllocation,
    TimeOffRequest,
    TimeOffAllocationUsage,
    Employee,
    EmployeeStatus,
    Contract,
    ContractStatus,
    WorkingSchedule,
    WorkingScheduleDay,
    User,
    UserRole,
    LeaveUnit,
    LeaveRequestStatus,
    AllocationStatus
)
from app.services.attendance_service import AttendanceService


class TimeOffService:

    @staticmethod
    def calculate_duration(
        db: Session,
        employee_id: int,
        type_id: int,
        start_date: date,
        end_date: date,
        start_time: Optional[time] = None,
        end_time: Optional[time] = None
    ) -> Dict[str, Any]:
        """
        Calculates leave duration taking into account the employee's active working schedule.
        """
        if start_date > end_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Start date cannot be later than end date."
            )

        leave_type = db.query(TimeOffType).filter(TimeOffType.id == type_id).first()
        if not leave_type:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Time off type not found."
            )

        # Calculate calendar days
        calendar_days = (end_date - start_date).days + 1
        
        # Day names map
        weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        if leave_type.unit == LeaveUnit.HOURS.value:
            # Hourly calculation
            if start_time and end_time:
                # Same day or time diff
                start_dt = datetime.combine(start_date, start_time)
                end_dt = datetime.combine(end_date, end_time)
                if end_dt <= start_dt:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="End time must be after start time."
                    )
                total_hours = round((end_dt - start_dt).total_seconds() / 3600.0, 2)
                return {
                    "duration": total_hours,
                    "unit": "hours",
                    "working_days_counted": 1 if calendar_days == 1 else calendar_days,
                    "calendar_days": calendar_days
                }
            else:
                # Default 8 hours per working day in range
                working_days = 0
                cur_date = start_date
                while cur_date <= end_date:
                    schedule = AttendanceService.get_applicable_working_schedule(db, employee_id, cur_date)
                    day_name = weekday_names[cur_date.weekday()]
                    is_working = False
                    if schedule and schedule.days:
                        for s_day in schedule.days:
                            if s_day.day_of_week.lower() == day_name.lower():
                                is_working = True
                                break
                    else:
                        is_working = cur_date.weekday() < 5
                    
                    if is_working:
                        working_days += 1
                    cur_date += timedelta(days=1)
                
                total_hours = float(working_days * 8.0)
                return {
                    "duration": total_hours,
                    "unit": "hours",
                    "working_days_counted": working_days,
                    "calendar_days": calendar_days
                }

        # Days-based calculation
        working_days_count = 0
        cur_date = start_date
        while cur_date <= end_date:
            schedule = AttendanceService.get_applicable_working_schedule(db, employee_id, cur_date)
            day_name = weekday_names[cur_date.weekday()]
            is_working = False
            
            if schedule and schedule.days:
                for s_day in schedule.days:
                    if s_day.day_of_week.lower() == day_name.lower():
                        is_working = True
                        break
            else:
                # Standard Mon-Fri
                is_working = cur_date.weekday() < 5

            if is_working:
                working_days_count += 1
            cur_date += timedelta(days=1)

        duration = float(working_days_count)

        return {
            "duration": duration,
            "unit": "days",
            "working_days_counted": working_days_count,
            "calendar_days": calendar_days
        }

    @staticmethod
    def check_overlapping_requests(
        db: Session,
        employee_id: int,
        start_date: date,
        end_date: date,
        exclude_request_id: Optional[int] = None
    ) -> Optional[TimeOffRequest]:
        """
        Checks if the employee has any pending or approved request overlapping with the given dates.
        """
        query = db.query(TimeOffRequest).filter(
            TimeOffRequest.employee_id == employee_id,
            TimeOffRequest.status.in_([
                LeaveRequestStatus.APPROVED.value,
                LeaveRequestStatus.TO_APPROVE.value,
                "pending"
            ]),
            TimeOffRequest.start_date <= end_date,
            TimeOffRequest.end_date >= start_date
        )
        if exclude_request_id:
            query = query.filter(TimeOffRequest.id != exclude_request_id)
        
        return query.first()

    @staticmethod
    def get_employee_balances(db: Session, employee_id: int) -> List[Dict[str, Any]]:
        """
        Computes leave balance breakdown for an employee across all active Time Off Types.
        """
        types = db.query(TimeOffType).filter(TimeOffType.active == True).order_by(TimeOffType.name).all()
        results = []

        for t in types:
            if t.requires_allocation:
                # Sum approved allocations
                allocations = db.query(TimeOffAllocation).filter(
                    TimeOffAllocation.employee_id == employee_id,
                    TimeOffAllocation.time_off_type_id == t.id,
                    TimeOffAllocation.status == AllocationStatus.APPROVED.value
                ).all()

                allocated = sum(a.allocated_amount for a in allocations)
                taken = sum(a.taken_amount for a in allocations)
                remaining = max(0.0, allocated - taken)
            else:
                # No allocation required (e.g. Unpaid Leave)
                approved_reqs = db.query(TimeOffRequest).filter(
                    TimeOffRequest.employee_id == employee_id,
                    TimeOffRequest.time_off_type_id == t.id,
                    TimeOffRequest.status == LeaveRequestStatus.APPROVED.value
                ).all()
                taken = sum(r.duration for r in approved_reqs)
                allocated = 0.0
                remaining = 999.0  # Unlimited indicator

            results.append({
                "type_id": t.id,
                "type_name": t.name,
                "unit": t.unit,
                "color": t.color,
                "requires_allocation": t.requires_allocation,
                "is_unpaid": t.is_unpaid,
                "allocated": round(allocated, 2),
                "taken": round(taken, 2),
                "remaining": round(remaining, 2)
            })

        return results

    @staticmethod
    def get_available_allocation_balance(db: Session, employee_id: int, type_id: int, target_date: Optional[date] = None) -> float:
        """
        Calculates total available remaining balance for an employee for a specific type.
        """
        query = db.query(TimeOffAllocation).filter(
            TimeOffAllocation.employee_id == employee_id,
            TimeOffAllocation.time_off_type_id == type_id,
            TimeOffAllocation.status == AllocationStatus.APPROVED.value
        )
        if target_date:
            query = query.filter(
                or_(TimeOffAllocation.validity_start.is_(None), TimeOffAllocation.validity_start <= target_date),
                or_(TimeOffAllocation.validity_end.is_(None), TimeOffAllocation.validity_end >= target_date)
            )

        allocations = query.all()
        total_remaining = sum(max(0.0, a.allocated_amount - a.taken_amount) for a in allocations)
        return round(total_remaining, 2)

    @staticmethod
    def create_request(
        db: Session,
        employee_id: int,
        type_id: int,
        start_date: date,
        end_date: date,
        reason: Optional[str] = None,
        start_time: Optional[time] = None,
        end_time: Optional[time] = None,
        current_user: Optional[User] = None
    ) -> TimeOffRequest:
        """
        Validates and creates a new time off request.
        """
        # Validate employee
        emp = db.query(Employee).filter(Employee.id == employee_id).first()
        if not emp:
            raise HTTPException(status_code=404, detail="Employee not found.")

        # Validate time off type
        leave_type = db.query(TimeOffType).filter(TimeOffType.id == type_id).first()
        if not leave_type:
            raise HTTPException(status_code=404, detail="Time off type not found.")
        if not leave_type.active:
            raise HTTPException(status_code=400, detail="Cannot request leave for an inactive Time Off Type.")

        # Validate dates
        if start_date > end_date:
            raise HTTPException(status_code=400, detail="Start date cannot be later than end date.")

        # Check overlapping requests
        overlap = TimeOffService.check_overlapping_requests(db, employee_id, start_date, end_date)
        if overlap:
            raise HTTPException(
                status_code=400,
                detail=f"Employee already has a Time Off Request ({overlap.status}) covering part of this period ({overlap.start_date} to {overlap.end_date})."
            )

        # Calculate duration
        calc = TimeOffService.calculate_duration(
            db=db,
            employee_id=employee_id,
            type_id=type_id,
            start_date=start_date,
            end_date=end_date,
            start_time=start_time,
            end_time=end_time
        )
        duration = calc["duration"]

        if duration <= 0:
            raise HTTPException(
                status_code=400,
                detail="Calculated leave duration is 0. Please select dates containing working days."
            )

        # Check allocation balance if required
        if leave_type.requires_allocation:
            available_balance = TimeOffService.get_available_allocation_balance(db, employee_id, type_id, start_date)
            if available_balance < duration:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient leave balance. Available: {available_balance} {leave_type.unit}, Requested: {duration} {leave_type.unit}."
                )

        # Auto-approval for types with no_approval
        initial_status = LeaveRequestStatus.TO_APPROVE.value
        if leave_type.approval_type == "no_approval":
            initial_status = LeaveRequestStatus.APPROVED.value

        request = TimeOffRequest(
            employee_id=employee_id,
            time_off_type_id=type_id,
            start_date=start_date,
            end_date=end_date,
            start_time=start_time,
            end_time=end_time,
            duration=duration,
            status=initial_status,
            reason=reason,
            approver_id=emp.manager_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(request)
        db.flush()

        # If auto-approved, consume allocation immediately
        if initial_status == LeaveRequestStatus.APPROVED.value and leave_type.requires_allocation:
            TimeOffService._consume_allocation(db, request, duration)

        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def approve_request(
        db: Session,
        request_id: int,
        approver_user: User,
        approval_reason: Optional[str] = None
    ) -> TimeOffRequest:
        """
        Approves a time off request transactionally and consumes allocation balance.
        """
        request = db.query(TimeOffRequest).filter(TimeOffRequest.id == request_id).with_for_update().first()
        if not request:
            raise HTTPException(status_code=404, detail="Time off request not found.")

        if request.status == LeaveRequestStatus.APPROVED.value:
            raise HTTPException(status_code=400, detail="Request is already approved.")

        # Self-approval prevention
        if approver_user.employee_id and approver_user.employee_id == request.employee_id:
            if approver_user.role != UserRole.ADMIN.value:
                raise HTTPException(
                    status_code=403,
                    detail="Self-approval prevention: Employees cannot approve their own time off requests."
                )

        leave_type = db.query(TimeOffType).filter(TimeOffType.id == request.time_off_type_id).first()
        if not leave_type:
            raise HTTPException(status_code=404, detail="Time off type not found.")

        # Re-verify duration at approval time
        calc = TimeOffService.calculate_duration(
            db=db,
            employee_id=request.employee_id,
            type_id=request.time_off_type_id,
            start_date=request.start_date,
            end_date=request.end_date,
            start_time=request.start_time,
            end_time=request.end_time
        )
        duration = calc["duration"]
        request.duration = duration

        # Allocation consumption
        if leave_type.requires_allocation:
            available = TimeOffService.get_available_allocation_balance(db, request.employee_id, leave_type.id, request.start_date)
            if available < duration:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient leave balance at approval time. Available: {available} {leave_type.unit}, Requested: {duration} {leave_type.unit}."
                )
            TimeOffService._consume_allocation(db, request, duration)

        # Update status
        request.status = LeaveRequestStatus.APPROVED.value
        request.approver_id = approver_user.employee_id if approver_user.employee_id else request.approver_id
        request.approval_reason = approval_reason
        request.approved_at = datetime.utcnow()
        request.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def _consume_allocation(db: Session, request: TimeOffRequest, duration_to_consume: float) -> None:
        """
        Consumes duration from valid approved allocations (earliest expiry first) and records usages.
        """
        # Clear any prior usages
        db.query(TimeOffAllocationUsage).filter(TimeOffAllocationUsage.request_id == request.id).delete()

        allocations = db.query(TimeOffAllocation).filter(
            TimeOffAllocation.employee_id == request.employee_id,
            TimeOffAllocation.time_off_type_id == request.time_off_type_id,
            TimeOffAllocation.status == AllocationStatus.APPROVED.value
        ).order_by(
            TimeOffAllocation.validity_end.asc().nullslast(),
            TimeOffAllocation.created_at.asc()
        ).with_for_update().all()

        remaining_to_consume = duration_to_consume
        primary_allocation_id = None

        for alloc in allocations:
            available_in_alloc = max(0.0, alloc.allocated_amount - alloc.taken_amount)
            if available_in_alloc <= 0:
                continue

            consume_from_this = min(remaining_to_consume, available_in_alloc)
            alloc.taken_amount = round(alloc.taken_amount + consume_from_this, 2)
            alloc.remaining_amount = round(alloc.allocated_amount - alloc.taken_amount, 2)
            alloc.updated_at = datetime.utcnow()

            usage = TimeOffAllocationUsage(
                request_id=request.id,
                allocation_id=alloc.id,
                amount_used=consume_from_this,
                created_at=datetime.utcnow()
            )
            db.add(usage)

            if primary_allocation_id is None:
                primary_allocation_id = alloc.id

            remaining_to_consume = round(remaining_to_consume - consume_from_this, 2)
            if remaining_to_consume <= 0:
                break

        if remaining_to_consume > 0:
            raise HTTPException(
                status_code=400,
                detail=f"Unable to allocate entire duration. Short by {remaining_to_consume} units."
            )

        request.allocation_id = primary_allocation_id

    @staticmethod
    def refuse_request(
        db: Session,
        request_id: int,
        approver_user: User,
        refusal_reason: Optional[str] = None
    ) -> TimeOffRequest:
        """
        Refuses a time off request. Does NOT modify allocation taken amounts.
        """
        request = db.query(TimeOffRequest).filter(TimeOffRequest.id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="Time off request not found.")

        # Self-refusal check
        if approver_user.employee_id and approver_user.employee_id == request.employee_id:
            if approver_user.role != UserRole.ADMIN.value:
                raise HTTPException(
                    status_code=403,
                    detail="Self-action prevention: Employees cannot process their own time off requests."
                )

        # If it was previously approved, restore allocation
        if request.status == LeaveRequestStatus.APPROVED.value:
            TimeOffService._restore_allocation(db, request)

        request.status = LeaveRequestStatus.REFUSED.value
        request.refusal_reason = refusal_reason
        request.refused_at = datetime.utcnow()
        request.approver_id = approver_user.employee_id if approver_user.employee_id else request.approver_id
        request.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def cancel_request(
        db: Session,
        request_id: int,
        current_user: User
    ) -> TimeOffRequest:
        """
        Cancels a request. If approved, restores consumed allocation balance.
        """
        request = db.query(TimeOffRequest).filter(TimeOffRequest.id == request_id).first()
        if not request:
            raise HTTPException(status_code=404, detail="Time off request not found.")

        # Permission check: owner employee or HR / Admin
        is_owner = current_user.employee_id and current_user.employee_id == request.employee_id
        is_manager = current_user.role in [UserRole.ADMIN.value, UserRole.HR_MANAGER.value, UserRole.HR_PAYROLL_MANAGER.value]
        if not (is_owner or is_manager):
            raise HTTPException(status_code=403, detail="Not authorized to cancel this request.")

        if request.status == LeaveRequestStatus.CANCELLED.value:
            raise HTTPException(status_code=400, detail="Request is already cancelled.")

        # Restore allocation if it was approved
        if request.status == LeaveRequestStatus.APPROVED.value:
            TimeOffService._restore_allocation(db, request)

        request.status = LeaveRequestStatus.CANCELLED.value
        request.cancelled_at = datetime.utcnow()
        request.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(request)
        return request

    @staticmethod
    def _restore_allocation(db: Session, request: TimeOffRequest) -> None:
        """
        Restores allocation balance consumed by an approved request.
        """
        usages = db.query(TimeOffAllocationUsage).filter(
            TimeOffAllocationUsage.request_id == request.id
        ).all()

        for usage in usages:
            alloc = db.query(TimeOffAllocation).filter(
                TimeOffAllocation.id == usage.allocation_id
            ).with_for_update().first()
            if alloc:
                alloc.taken_amount = max(0.0, round(alloc.taken_amount - usage.amount_used, 2))
                alloc.remaining_amount = round(alloc.allocated_amount - alloc.taken_amount, 2)
                alloc.updated_at = datetime.utcnow()
            db.delete(usage)

        request.allocation_id = None
