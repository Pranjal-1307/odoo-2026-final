import React from 'react';
import { 
  Users, 
  FileText, 
  Clock, 
  CreditCard, 
  TrendingUp, 
  CalendarCheck, 
  ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
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
            onClick={() => navigate('/payroll/payruns')} 
            className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow transition-all flex items-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            Launch Payrun
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

        <div className="odoo-card p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payslips Generated</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-odoo-purple flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">148</div>
          <div className="text-xs text-slate-500 mt-1">Across 4 departments</div>
        </div>

        <div className="odoo-card p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Avg Salary / Emp</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">₹68,400</div>
          <div className="text-xs text-slate-500 mt-1">Regular Salary Structure</div>
        </div>

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

        <div className="odoo-card p-4">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attendance Health</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">96.2%</div>
          <div className="text-xs text-teal-600 mt-1">On-time punch rate</div>
        </div>
      </div>

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
            <button onClick={() => navigate('/time-off/requests')} className="text-xs text-amber-600 font-semibold hover:underline flex items-center cursor-pointer">
              Requests <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Track daily work entries, leave balance allocations, and automated unpaid salary deductions.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => navigate('/attendance')} className="odoo-btn-secondary text-xs py-1.5 cursor-pointer">
              Attendance
            </button>
            <button onClick={() => navigate('/time-off/allocations')} className="odoo-btn-secondary text-xs py-1.5 cursor-pointer">
              Allocations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
