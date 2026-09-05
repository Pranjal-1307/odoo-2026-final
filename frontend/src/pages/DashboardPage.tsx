import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  CalendarCheck, 
  ArrowUpRight,
  UserCheck,
  Building2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { attendanceService } from '../services/attendanceService';
import type { AttendanceSummary } from '../types';


export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const sum = await attendanceService.getSummary();
        setAttendanceSummary(sum);
      } catch (err) {
        console.error('Failed to load attendance summary on dashboard:', err);
      }
    };
    loadSummary();
  }, []);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-odoo-purple to-purple-800 rounded-xl p-6 text-white shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">PeoplePay360 Operations Hub</h1>
          <p className="text-purple-200 text-sm mt-1">
            Integrated Workforce, Contract, Attendance, Time Off & Payroll Intelligence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/attendance')} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <Clock className="w-4 h-4" />
            Attendance Hub
          </button>
          <button 
            onClick={() => navigate('/employees')} 
            className="bg-white/15 hover:bg-white/25 text-white text-sm font-semibold px-4 py-2 rounded-lg backdrop-blur-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Users className="w-4 h-4" />
            Manage Employees
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Present Today */}
        <div className="odoo-card p-4 cursor-pointer hover:border-emerald-300 transition-all" onClick={() => navigate('/attendance?preset=today')}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Present Today</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">
            {attendanceSummary ? attendanceSummary.present_today : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
            <span>{attendanceSummary ? `${attendanceSummary.checked_in_now} active right now` : 'Live attendance'}</span>
          </div>
        </div>

        {/* Overtime & Worked Hours */}
        <div className="odoo-card p-4 cursor-pointer hover:border-purple-300 transition-all" onClick={() => navigate('/attendance?status=overtime')}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overtime Today</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-odoo-purple flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-purple-700 mt-2">
            {attendanceSummary ? `${attendanceSummary.overtime_today} Emps` : '—'}
          </div>
          <div className="text-xs text-purple-600 mt-1 font-medium">
            {attendanceSummary ? `+${attendanceSummary.total_overtime_hours}h total OT` : 'Computed from schedule'}
          </div>
        </div>

        {/* Total Net Paid */}
        <div className="odoo-card p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Net Paid</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">₹18.4L</div>
          <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> +12.5% vs last month
          </div>
        </div>

        {/* Approved Time Off */}
        <div className="odoo-card p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Approved Time Off</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">34 Days</div>
          <div className="text-xs text-amber-600 mt-1">3 pending approvals</div>
        </div>

        {/* Attendance Health */}
        <div className="odoo-card p-4 cursor-pointer hover:border-teal-300 transition-all" onClick={() => navigate('/attendance')}>
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Rate</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">96.8%</div>
          <div className="text-xs text-teal-600 mt-1">
            {attendanceSummary ? `${attendanceSummary.late_today} late arrivals today` : 'On-time punch rate'}
          </div>
        </div>
      </div>

      {/* Live Department Attendance Overview */}
      {attendanceSummary && attendanceSummary.department_breakdown.length > 0 && (
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#714B67]" />
                Live Department Attendance Distribution
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time presence and overtime across organizational units</p>
            </div>
            <button
              onClick={() => navigate('/attendance')}
              className="text-xs text-[#714B67] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              View Full Logs <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
            {attendanceSummary.department_breakdown.map((dept) => (
              <div key={dept.department} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">{dept.department}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded">
                    {dept.total_employees} Active
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mt-3 text-center">
                  <div className="bg-white p-1.5 rounded border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Present</div>
                    <div className="text-xs font-bold text-emerald-600">{dept.present + dept.checked_in}</div>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Late</div>
                    <div className="text-xs font-bold text-orange-600">{dept.late}</div>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Overtime</div>
                    <div className="text-xs font-bold text-purple-600">{dept.overtime}</div>
                  </div>
                  <div className="bg-white p-1.5 rounded border border-slate-200/70">
                    <div className="text-[10px] text-slate-400 font-medium">Absent</div>
                    <div className="text-xs font-bold text-slate-500">{dept.absent}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="odoo-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-odoo-purple" />
              Employee Operations
            </h3>
            <button onClick={() => navigate('/employees')} className="text-xs text-odoo-purple font-semibold hover:underline flex items-center cursor-pointer">
              View All <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Manage profiles, historical contracts, working schedules, and linked attendance records.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/employees')} className="odoo-btn-secondary text-xs py-1.5 cursor-pointer">
              Employee Kanban
            </button>
            <button onClick={() => navigate('/contracts')} className="odoo-btn-secondary text-xs py-1.5 cursor-pointer">
              Contracts
            </button>
          </div>
        </div>

        <div className="odoo-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payroll Processing
            </h3>
            <button onClick={() => navigate('/payroll/payruns')} className="text-xs text-emerald-600 font-semibold hover:underline flex items-center cursor-pointer">
              View Runs <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Two-step Payrun creation, dynamic rule engine computation, warnings validation, and PDF dispatch.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/payroll/payruns')} className="odoo-btn-teal text-xs py-1.5 cursor-pointer">
              Payruns
            </button>
            <button onClick={() => navigate('/payroll/salary-rules')} className="odoo-btn-secondary text-xs py-1.5 cursor-pointer">
              Rules Engine
            </button>
          </div>
        </div>

        <div className="odoo-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-amber-600" />
              Time Off & Attendance
            </h3>
            <button onClick={() => navigate('/attendance')} className="text-xs text-amber-600 font-semibold hover:underline flex items-center cursor-pointer">
              Attendance <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Track daily work entries, check in/out, overtime calculations, and leave balances.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/attendance')} className="odoo-btn-secondary text-xs py-1.5 cursor-pointer">
              Attendance Hub
            </button>
            <button onClick={() => navigate('/working-schedules')} className="odoo-btn-secondary text-xs py-1.5 cursor-pointer">
              Schedules
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
