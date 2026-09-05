import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Clock, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  ChevronDown, 
  LogOut, 
  Settings,
  ShieldCheck,
  Building2,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { QuickAttendanceWidget } from './QuickAttendanceWidget';

export const Navbar: React.FC = () => {
  const { 
    user, 
    logout, 
    isAdmin, 
    isPayrollUser, 
    isEmployee,
    canManageHR, 
    canManagePayroll,
    canConfigurePayroll 
  } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const [timeOffOpen, setTimeOffOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const timeOffRef = useRef<HTMLDivElement>(null);
  const payrollRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timeOffRef.current && !timeOffRef.current.contains(event.target as Node)) {
        setTimeOffOpen(false);
      }
      if (payrollRef.current && !payrollRef.current.contains(event.target as Node)) {
        setPayrollOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdowns on route change
  useEffect(() => {
    setTimeOffOpen(false);
    setPayrollOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
      isActive
        ? 'bg-white/20 text-white shadow-sm'
        : 'text-purple-100 hover:bg-white/10 hover:text-white'
    }`;

  const dropdownItemClass = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 text-sm transition-colors ${
      isActive
        ? 'bg-purple-50 text-odoo-purple font-semibold'
        : 'text-slate-700 hover:bg-slate-100'
    }`;

  const isTimeOffActive = location.pathname.startsWith('/time-off');
  const isPayrollActive = location.pathname.startsWith('/payroll') || location.pathname.startsWith('/payruns') || location.pathname.startsWith('/payslips') || location.pathname.startsWith('/salary-');

  return (
    <header className="bg-odoo-purple border-b border-purple-900/30 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-inner group-hover:bg-white/25 transition-all">
                <Building2 className="w-5 h-5 text-emerald-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-white font-bold text-base tracking-tight leading-none">
                  People<span className="text-emerald-300">Pay</span>360
                </span>
                <span className="text-[10px] text-purple-200 tracking-wider uppercase font-semibold">HR & Payroll</span>
              </div>
            </div>

            {/* Role-based Dynamic Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              
              {/* Employees (Visible to All) */}
              <NavLink to="/employees" className={navLinkClass}>
                <Users className="w-4 h-4" />
                <span>{isEmployee ? 'My Profile' : 'Employees'}</span>
              </NavLink>

              {/* Contracts (HR & Admin only) */}
              {canManageHR && (
                <NavLink to="/contracts" className={navLinkClass}>
                  <FileText className="w-4 h-4" />
                  <span>Contracts</span>
                </NavLink>
              )}

              {/* Attendance (All Roles) */}
              <NavLink to="/attendance" className={navLinkClass}>
                <Clock className="w-4 h-4" />
                <span>Attendance</span>
              </NavLink>

              {/* Time Off Dropdown (All Roles) */}
              <div className="relative" ref={timeOffRef}>
                <button
                  onClick={() => setTimeOffOpen(!timeOffOpen)}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    isTimeOffActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-purple-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Time Off</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${timeOffOpen ? 'rotate-180' : ''}`} />
                </button>

                {timeOffOpen && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-scaleIn">
                    <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Leave Management</div>
                    <NavLink to="/time-off/requests" className={dropdownItemClass}>
                      Time Off Requests
                    </NavLink>
                    <NavLink to="/time-off/allocations" className={dropdownItemClass}>
                      Allocations
                    </NavLink>
                    {canManageHR && (
                      <NavLink to="/time-off/types" className={dropdownItemClass}>
                        Time Off Types
                      </NavLink>
                    )}
                  </div>
                )}
              </div>

              {/* Payroll Section */}
              {isEmployee ? (
                <NavLink to="/payroll/payslips" className={navLinkClass}>
                  <Receipt className="w-4 h-4" />
                  <span>My Payslips</span>
                </NavLink>
              ) : canManagePayroll ? (
                <div className="relative" ref={payrollRef}>
                  <button
                    onClick={() => setPayrollOpen(!payrollOpen)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                      isPayrollActive
                        ? 'bg-white/20 text-white shadow-sm'
                        : 'text-purple-100 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Payroll</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${payrollOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {payrollOpen && (
                    <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1.5 z-50 animate-scaleIn">
                      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Payroll Processing</div>
                      <NavLink to="/payroll/payruns" className={dropdownItemClass}>
                        Payruns
                      </NavLink>
                      <NavLink to="/payroll/payslips" className={dropdownItemClass}>
                        Payslips
                      </NavLink>
                      <div className="my-1 border-t border-slate-100" />
                      <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Configuration</div>
                      <NavLink to="/payroll/salary-structures" className={dropdownItemClass}>
                        Salary Structures {isPayrollUser && !canConfigurePayroll && '(Read-Only)'}
                      </NavLink>
                      <NavLink to="/payroll/salary-rules" className={dropdownItemClass}>
                        Salary Rules {isPayrollUser && !canConfigurePayroll && '(Read-Only)'}
                      </NavLink>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Reports / Dashboard */}
              <NavLink to="/dashboard" className={navLinkClass}>
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>

              {/* Admin User Management */}
              {isAdmin && (
                <NavLink to="/users" className={navLinkClass}>
                  <Settings className="w-4 h-4" />
                  <span>Users & Roles</span>
                </NavLink>
              )}
            </nav>
          </div>

          {/* Right Area: Attendance Widget + User Menu */}
          <div className="flex items-center gap-3 sm:gap-4">
            <QuickAttendanceWidget />

            {/* User Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 text-sm bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg text-white transition-colors border border-white/15"
              >
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-xs shadow-inner">
                  {user?.username ? user.username.substring(0, 2).toUpperCase() : 'AD'}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold leading-tight">{user?.username || 'User'}</span>
                  <span className="text-[10px] text-purple-200 leading-tight">{user?.role || 'Role'}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-purple-200" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-lg shadow-xl border border-slate-200 py-2 z-50 animate-scaleIn">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800">{user?.username || 'User'}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 bg-purple-50 text-odoo-purple px-2 py-0.5 rounded text-[11px] font-bold border border-purple-100">
                      <ShieldCheck className="w-3 h-3" />
                      {user?.role || 'Employee'}
                    </div>
                  </div>

                  {isAdmin && (
                    <NavLink to="/users" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-400" />
                      User & Role Management
                    </NavLink>
                  )}

                  {canManageHR && (
                    <NavLink to="/schedules" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      Working Schedules
                    </NavLink>
                  )}

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
};
