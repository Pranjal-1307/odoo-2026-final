from typing import Optional, Tuple, List, Dict, Any
from datetime import datetime, date, time, timedelta
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_, and_

from app.models import (
    Attendance,
    AttendanceStatus,
    Employee,
    EmployeeStatus,
    Contract,
    ContractStatus,
    WorkingSchedule,
    WorkingScheduleDay,
    User
)


class AttendanceService:

    @staticmethod
    def get_applicable_working_schedule(db: Session, employee_id: int, target_date: date) -> Optional[WorkingSchedule]:
        """
        Determines the applicable working schedule for an employee on a given date.
        Order of precedence:
        1. Running contract covering the target date
        2. Any valid contract covering the target date
        3. Employee's assigned default working schedule
        4. Global standard active schedule (fallback)
        """
        # 1. Search for a contract active on target_date
        applicable_contract = db.query(Contract).filter(
            Contract.employee_id == employee_id,
            Contract.start_date <= target_date,
            or_(Contract.end_date.is_(None), Contract.end_date >= target_date),
            Contract.status.in_([ContractStatus.RUNNING.value, ContractStatus.DRAFT.value, ContractStatus.EXPIRED.value])
        ).order_by(
            # Prefer running contracts first
            (Contract.status == ContractStatus.RUNNING.value).desc(),
            Contract.start_date.desc()
        ).first()

        if applicable_contract and applicable_contract.working_schedule_id:
            schedule = db.query(WorkingSchedule).filter(
                WorkingSchedule.id == applicable_contract.working_schedule_id
            ).first()
            if schedule:
                return schedule

        # 2. Check employee's direct working schedule
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if employee and employee.working_schedule_id:
            schedule = db.query(WorkingSchedule).filter(
                WorkingSchedule.id == employee.working_schedule_id
            ).first()
            if schedule:
                return schedule

        # 3. Fallback to standard 40h schedule
        fallback = db.query(WorkingSchedule).filter(
            WorkingSchedule.status == "active"
        ).order_by(
            (WorkingSchedule.name == "40 Hours / Week").desc()
        ).first()

        return fallback

    @staticmethod
    def get_day_schedule_details(schedule: Optional[WorkingSchedule], target_date: date) -> Tuple[float, Optional[time], Optional[time], float]:
        """
        Returns (expected_daily_hours, start_time, end_time, break_hours)
        for a given schedule and day of the week.
        """
        if not schedule or not schedule.days:
            return (8.0, time(9, 0), time(18, 0), 1.0)

        weekday_name = target_date.strftime("%A")  # e.g., "Monday"
        matching_day = None
        for day in schedule.days:
            if day.day_of_week.strip().lower() == weekday_name.lower():
                matching_day = day
                break

        if matching_day:
            return (
                matching_day.daily_hours,
                matching_day.start_time,
                matching_day.end_time,
                matching_day.break_hours
            )

        # Off-day (e.g. Weekend on 5-day schedule)
        return (0.0, None, None, 0.0)

    @staticmethod
    def calculate_late_minutes(check_in_dt: datetime, expected_start: Optional[time]) -> int:
        """
        Calculates late arrival in minutes compared to scheduled start time.
        """
        if not expected_start:
            return 0

        # Build expected check-in datetime on the check-in calendar day
        expected_dt = datetime.combine(check_in_dt.date(), expected_start)
        if check_in_dt > expected_dt:
            diff_seconds = (check_in_dt - expected_dt).total_seconds()
            return int(max(0, diff_seconds // 60))
        return 0

    @staticmethod
    def calculate_worked_and_overtime(
        check_in: datetime,
        check_out: datetime,
        break_hours: float,
        expected_hours: float
    ) -> Tuple[float, float, str]:
        """
        Calculates authoritative worked hours, overtime, and attendance status.
        Ensures overnight shifts across midnight calculate positive hours.
        """
        if check_out < check_in:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Check-out time cannot be earlier than check-in time."
            )

        total_elapsed_seconds = (check_out - check_in).total_seconds()
        total_elapsed_hours = total_elapsed_seconds / 3600.0

        # Subtract break if elapsed time exceeds break duration
        if total_elapsed_hours > break_hours and break_hours > 0:
            worked_hours = round(total_elapsed_hours - break_hours, 2)
        else:
            worked_hours = round(total_elapsed_hours, 2)

        worked_hours = max(0.0, worked_hours)

        # Overtime = MAX(worked_hours - expected_hours, 0)
        overtime_hours = round(max(0.0, worked_hours - expected_hours), 2)

        # Status derivation
        if overtime_hours > 0:
            derived_status = AttendanceStatus.OVERTIME.value
        elif expected_hours > 0 and worked_hours < expected_hours:
            derived_status = AttendanceStatus.PARTIAL.value
        elif worked_hours >= expected_hours and worked_hours > 0:
            derived_status = AttendanceStatus.PRESENT.value
        elif worked_hours > 0:
            derived_status = AttendanceStatus.PRESENT.value
        else:
            derived_status = AttendanceStatus.INCOMPLETE.value

        return (worked_hours, overtime_hours, derived_status)

    @classmethod
    def check_in(
        cls,
        db: Session,
        employee_id: int,
        check_in_time: Optional[datetime] = None,
        notes: Optional[str] = None,
        is_manual: bool = False
    ) -> Attendance:
        """
        Initiates employee check-in. Validates that no open check-in already exists.
        """
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {employee_id} not found."
            )

        if employee.status == EmployeeStatus.TERMINATED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot record attendance for a terminated employee."
            )

        # Prevent duplicate check-in
        existing_open = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.check_in.isnot(None),
            Attendance.check_out.is_(None)
        ).first()

        if existing_open:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Employee is already checked in. Please check out before starting another attendance session."
            )

        check_in_dt = check_in_time or datetime.now()
        target_date = check_in_dt.date()

        # Schedule lookup & late calculation
        schedule = cls.get_applicable_working_schedule(db, employee_id, target_date)
        expected_hours, start_time, end_time, break_hours = cls.get_day_schedule_details(schedule, target_date)
        late_min = cls.calculate_late_minutes(check_in_dt, start_time)

        attendance = Attendance(
            employee_id=employee_id,
            date=target_date,
            check_in=check_in_dt,
            check_out=None,
            worked_hours=0.0,
            expected_hours=expected_hours,
            overtime_hours=0.0,
            late_minutes=late_min,
            status=AttendanceStatus.CHECKED_IN.value,
            is_manual_edit=is_manual,
            notes=notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        return attendance

    @classmethod
    def check_out(
        cls,
        db: Session,
        employee_id: int,
        check_out_time: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> Attendance:
        """
        Completes employee check-out for the active attendance session.
        """
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {employee_id} not found."
            )

        # Find active check-in record
        active_attendance = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.check_in.isnot(None),
            Attendance.check_out.is_(None)
        ).order_by(Attendance.id.desc()).first()

        if not active_attendance:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active attendance found for this employee."
            )

        check_out_dt = check_out_time or datetime.now()

        # Resolve schedule for attendance date
        schedule = cls.get_applicable_working_schedule(db, employee_id, active_attendance.date)
        expected_hours, start_time, end_time, break_hours = cls.get_day_schedule_details(schedule, active_attendance.date)

        worked_hours, overtime_hours, derived_status = cls.calculate_worked_and_overtime(
            active_attendance.check_in,
            check_out_dt,
            break_hours,
            expected_hours
        )

        active_attendance.check_out = check_out_dt
        active_attendance.worked_hours = worked_hours
        active_attendance.expected_hours = expected_hours
        active_attendance.overtime_hours = overtime_hours
        active_attendance.status = derived_status
        if notes:
            active_attendance.notes = f"{active_attendance.notes} | {notes}" if active_attendance.notes else notes
        active_attendance.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(active_attendance)
        return active_attendance

    @classmethod
    def create_manual_attendance(
        cls,
        db: Session,
        employee_id: int,
        att_date: Optional[date] = None,
        check_in: Optional[datetime] = None,
        check_out: Optional[datetime] = None,
        notes: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Attendance:
        """
        Allows HR/Admin to manually create an attendance entry with server recalculation.
        """
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {employee_id} not found."
            )

        if not check_in and not att_date:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Either check-in time or attendance date must be provided."
            )

        target_date = att_date or (check_in.date() if check_in else date.today())
        
        # Schedule & expected hours
        schedule = cls.get_applicable_working_schedule(db, employee_id, target_date)
        expected_hours, start_time, end_time, break_hours = cls.get_day_schedule_details(schedule, target_date)

        late_min = 0
        worked_hours = 0.0
        overtime_hours = 0.0
        derived_status = AttendanceStatus.PRESENT.value

        if check_in and check_out:
            worked_hours, overtime_hours, derived_status = cls.calculate_worked_and_overtime(
                check_in, check_out, break_hours, expected_hours
            )
            late_min = cls.calculate_late_minutes(check_in, start_time)
        elif check_in and not check_out:
            derived_status = AttendanceStatus.CHECKED_IN.value
            late_min = cls.calculate_late_minutes(check_in, start_time)
        elif not check_in and not check_out:
            derived_status = AttendanceStatus.ABSENT.value

        attendance = Attendance(
            employee_id=employee_id,
            date=target_date,
            check_in=check_in,
            check_out=check_out,
            worked_hours=worked_hours,
            expected_hours=expected_hours,
            overtime_hours=overtime_hours,
            late_minutes=late_min,
            status=derived_status,
            is_manual_edit=True,
            notes=notes,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        db.add(attendance)
        db.commit()
        db.refresh(attendance)
        return attendance

    @classmethod
    def update_attendance(
        cls,
        db: Session,
        attendance_id: int,
        att_date: Optional[date] = None,
        check_in: Optional[datetime] = None,
        check_out: Optional[datetime] = None,
        status_val: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Attendance:
        """
        Updates an existing attendance entry with authoritative server recalculation.
        """
        attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
        if not attendance:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Attendance record with ID {attendance_id} not found."
            )

        if att_date is not None:
            attendance.date = att_date

        if check_in is not None:
            attendance.check_in = check_in
        if check_out is not None:
            attendance.check_out = check_out
        if notes is not None:
            attendance.notes = notes

        # Recalculate schedule & hours
        schedule = cls.get_applicable_working_schedule(db, attendance.employee_id, attendance.date)
        expected_hours, start_time, end_time, break_hours = cls.get_day_schedule_details(schedule, attendance.date)
        attendance.expected_hours = expected_hours

        if attendance.check_in and attendance.check_out:
            worked_hours, overtime_hours, derived_status = cls.calculate_worked_and_overtime(
                attendance.check_in, attendance.check_out, break_hours, expected_hours
            )
            attendance.worked_hours = worked_hours
            attendance.overtime_hours = overtime_hours
            attendance.late_minutes = cls.calculate_late_minutes(attendance.check_in, start_time)
            attendance.status = status_val or derived_status
        elif attendance.check_in and not attendance.check_out:
            attendance.worked_hours = 0.0
            attendance.overtime_hours = 0.0
            attendance.late_minutes = cls.calculate_late_minutes(attendance.check_in, start_time)
            attendance.status = status_val or AttendanceStatus.CHECKED_IN.value
        else:
            attendance.status = status_val or AttendanceStatus.ABSENT.value

        attendance.is_manual_edit = True
        attendance.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(attendance)
        return attendance

    @classmethod
    def get_current_status(cls, db: Session, employee_id: int) -> Dict[str, Any]:
        """
        Returns the active check-in status and live elapsed time for an employee.
        """
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            return {
                "is_checked_in": False,
                "attendance_id": None,
                "employee_id": employee_id,
                "employee_name": "Unknown",
                "check_in": None,
                "worked_seconds": 0,
                "expected_hours": 8.0,
                "status": None
            }

        active = db.query(Attendance).filter(
            Attendance.employee_id == employee_id,
            Attendance.check_in.isnot(None),
            Attendance.check_out.is_(None)
        ).order_by(Attendance.id.desc()).first()

        if active:
            now = datetime.now()
            # Calculate elapsed seconds from active.check_in to now
            elapsed = int(max(0, (now - active.check_in).total_seconds()))
            return {
                "is_checked_in": True,
                "attendance_id": active.id,
                "employee_id": employee.id,
                "employee_name": employee.name,
                "check_in": active.check_in,
                "worked_seconds": elapsed,
                "expected_hours": active.expected_hours,
                "status": active.status
            }

        return {
            "is_checked_in": False,
            "attendance_id": None,
            "employee_id": employee.id,
            "employee_name": employee.name,
            "check_in": None,
            "worked_seconds": 0,
            "expected_hours": 8.0,
            "status": None
        }

    @classmethod
    def get_summary(
        cls,
        db: Session,
        date_from: Optional[date] = None,
        date_to: Optional[date] = None,
        department: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates live attendance summary metrics and departmental breakdown.
        """
        today = date.today()
        d_from = date_from or today
        d_to = date_to or today

        query = db.query(Attendance).join(Employee, Attendance.employee_id == Employee.id)

        if department:
            query = query.filter(Employee.department == department)

        if date_from and date_to:
            query = query.filter(Attendance.date >= date_from, Attendance.date <= date_to)
        else:
            query = query.filter(Attendance.date == today)

        records = query.all()

        total_records = len(records)
        present_count = sum(1 for r in records if r.status == AttendanceStatus.PRESENT.value)
        checked_in_count = sum(1 for r in records if r.status == AttendanceStatus.CHECKED_IN.value)
        late_count = sum(1 for r in records if r.late_minutes > 0 or r.status == AttendanceStatus.LATE.value)
        overtime_count = sum(1 for r in records if r.overtime_hours > 0 or r.status == AttendanceStatus.OVERTIME.value)
        partial_count = sum(1 for r in records if r.status == AttendanceStatus.PARTIAL.value)
        total_worked = round(sum(r.worked_hours for r in records), 2)
        total_ot = round(sum(r.overtime_hours for r in records), 2)

        # Department breakdown
        all_departments = db.query(Employee.department).distinct().all()
        dept_names = [d[0] for d in all_departments if d[0]]

        dept_stats = []
        for dept in dept_names:
            dept_emp_count = db.query(Employee).filter(
                Employee.department == dept,
                Employee.status == EmployeeStatus.ACTIVE.value
            ).count()

            dept_recs = [r for r in records if r.employee and r.employee.department == dept]
            d_present = sum(1 for r in dept_recs if r.status == AttendanceStatus.PRESENT.value)
            d_checked_in = sum(1 for r in dept_recs if r.status == AttendanceStatus.CHECKED_IN.value)
            d_late = sum(1 for r in dept_recs if r.late_minutes > 0 or r.status == AttendanceStatus.LATE.value)
            d_ot = sum(1 for r in dept_recs if r.overtime_hours > 0 or r.status == AttendanceStatus.OVERTIME.value)
            d_partial = sum(1 for r in dept_recs if r.status == AttendanceStatus.PARTIAL.value)
            d_absent = max(0, dept_emp_count - (d_present + d_checked_in + d_partial))

            dept_stats.append({
                "department": dept,
                "total_employees": dept_emp_count,
                "present": d_present,
                "checked_in": d_checked_in,
                "late": d_late,
                "overtime": d_ot,
                "absent": d_absent,
                "partial": d_partial
            })

        return {
            "total_records": total_records,
            "present_today": present_count,
            "checked_in_now": checked_in_count,
            "late_today": late_count,
            "overtime_today": overtime_count,
            "partial_today": partial_count,
            "total_worked_hours": total_worked,
            "total_overtime_hours": total_ot,
            "department_breakdown": dept_stats
        }
