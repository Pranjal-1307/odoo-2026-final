import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Building2, 
  LayoutDashboard, 
  Users, 
  FileText, 
  Clock, 
  Calendar, 
  CreditCard, 
  Receipt, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  Settings, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileClose
}) => {
  const { 
    isAdmin, 
    isEmployee, 
    canManageHR, 
    canManagePayroll 
  } = useAuth();

  const location = useLocation();

  const [timeOffExpanded, setTimeOffExpanded] = useState(
    location.pathname.startsWith('/time-off')
  );
  const [payrollConfigExpanded, setPayrollConfigExpanded] = useState(
    location.pathname.startsWith('/payroll/salary-')
  );

  const navItemClass = (isActive: boolean) =>
    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group select-none ${
      isActive
        ? 'bg-odoo-purple text-white font-semibold shadow-xs'
        : 'text-slate-300 hover:text-white hover:bg-white/10'
    }`;

  const subNavItemClass = (isActive: boolean) =>
    `flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors group select-none ${
      isActive
        ? 'text-white font-semibold bg-white/15'
        : 'text-slate-400 hover:text-white hover:bg-white/5'
    }`;

  const isTimeOffActive = location.pathname.startsWith('/time-off');
  const isPayrollActive = location.pathname.startsWith('/payroll/salary-');

  const content = (
    <div className="flex flex-col h-full bg-[#1A1E29] text-slate-300 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
        <NavLink to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-odoo-purple to-purple-800 flex items-center justify-center text-white shadow-md border border-purple-400/20 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5 text-emerald-300" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-white font-bold text-base tracking-tight leading-none">
                People<span className="text-emerald-400">Pay</span>360
              </span>
              <span className="text-[10px] text-purple-300 tracking-wider uppercase font-semibold mt-0.5">
                HR & Payroll Platform
              </span>
            </div>
          )}
        </NavLink>

        {/* Mobile Close Button */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={onMobileClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Links Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        
        {/* SECTION: MAIN */}
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Main
            </div>
          )}
          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              title={isCollapsed ? 'Dashboard' : undefined}
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => onMobileClose()}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              {!isCollapsed && <span>Dashboard</span>}
            </NavLink>
          </nav>
        </div>

        {/* SECTION: WORKFORCE */}
        <div>
          {!isCollapsed && (
            <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Workforce
            </div>
          )}
          <nav className="space-y-1">
            <NavLink
              to="/employees"
              title={isCollapsed ? (isEmployee ? 'My Profile' : 'Employees') : undefined}
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => onMobileClose()}
            >
              <Users className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              {!isCollapsed && <span>{isEmployee ? 'My Profile' : 'Employees'}</span>}
            </NavLink>

            {(canManageHR || isEmployee) && (
              <NavLink
                to="/contracts"
                title={isCollapsed ? (isEmployee ? 'My Contracts' : 'Contracts') : undefined}
                className={({ isActive }) => navItemClass(isActive)}
                onClick={() => onMobileClose()}
              >
                <FileText className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                {!isCollapsed && <span>{isEmployee ? 'My Contracts' : 'Contracts'}</span>}
              </NavLink>
            )}

            {canManageHR && (
              <NavLink
                to="/working-schedules"
                title={isCollapsed ? 'Working Schedules' : undefined}
                className={({ isActive }) => navItemClass(isActive)}
                onClick={() => onMobileClose()}
              >
                <Clock className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                {!isCollapsed && <span>Working Schedules</span>}
              </NavLink>
            )}

            <NavLink
              to="/attendance"
              title={isCollapsed ? 'Attendance' : undefined}
              className={({ isActive }) => navItemClass(isActive)}
              onClick={() => onMobileClose()}
            >
              <Clock className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              {!isCollapsed && <span>Attendance</span>}
            </NavLink>

            {/* Time Off Multi-Level Section */}
            {!isCollapsed ? (
              <div>
                <button
                  type="button"
                  onClick={() => setTimeOffExpanded(!timeOffExpanded)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 select-none cursor-pointer ${
                    isTimeOffActive
                      ? 'text-white bg-white/10 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 shrink-0 text-slate-400" />
                    <span>Time Off</span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-150 ${
                      timeOffExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {timeOffExpanded && (
                  <div className="pl-7 pr-2 py-1 space-y-1 mt-1 border-l border-slate-700/50 ml-5">
                    <NavLink
                      to="/time-off/requests"
                      className={({ isActive }) => subNavItemClass(isActive)}
                      onClick={() => onMobileClose()}
                    >
                      <span>Leave Requests</span>
                    </NavLink>
                    <NavLink
                      to="/time-off/allocations"
                      className={({ isActive }) => subNavItemClass(isActive)}
                      onClick={() => onMobileClose()}
                    >
                      <span>Allocations</span>
                    </NavLink>
                    {canManageHR && (
                      <NavLink
                        to="/time-off/types"
                        className={({ isActive }) => subNavItemClass(isActive)}
                        onClick={() => onMobileClose()}
                      >
                        <span>Leave Types</span>
                      </NavLink>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                to="/time-off/requests"
                title="Time Off"
                className={({ isActive }) => navItemClass(isActive)}
                onClick={() => onMobileClose()}
              >
                <Calendar className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
              </NavLink>
            )}
          </nav>
        </div>

        {/* SECTION: PAYROLL */}
        {(canManagePayroll || isEmployee) && (
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Payroll
              </div>
            )}
            <nav className="space-y-1">
              {canManagePayroll && (
                <NavLink
                  to="/payroll/payruns"
                  title={isCollapsed ? 'Payruns' : undefined}
                  className={({ isActive }) => navItemClass(isActive)}
                  onClick={() => onMobileClose()}
                >
                  <CreditCard className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                  {!isCollapsed && <span>Payruns</span>}
                </NavLink>
              )}

              <NavLink
                to="/payroll/payslips"
                title={isCollapsed ? (isEmployee ? 'My Payslips' : 'Payslips') : undefined}
                className={({ isActive }) => navItemClass(isActive)}
                onClick={() => onMobileClose()}
              >
                <Receipt className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                {!isCollapsed && <span>{isEmployee ? 'My Payslips' : 'Payslips'}</span>}
              </NavLink>

              {/* Salary Configuration Submenu */}
              {canManagePayroll && (
                !isCollapsed ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setPayrollConfigExpanded(!payrollConfigExpanded)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 select-none cursor-pointer ${
                        isPayrollActive
                          ? 'text-white bg-white/10 font-semibold'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="w-4 h-4 shrink-0 text-slate-400" />
                        <span>Salary Rules & Config</span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-150 ${
                          payrollConfigExpanded ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {payrollConfigExpanded && (
                      <div className="pl-7 pr-2 py-1 space-y-1 mt-1 border-l border-slate-700/50 ml-5">
                        <NavLink
                          to="/payroll/salary-structures"
                          className={({ isActive }) => subNavItemClass(isActive)}
                          onClick={() => onMobileClose()}
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 opacity-60" />
                            <span>Structures</span>
                          </div>
                        </NavLink>
                        <NavLink
                          to="/payroll/salary-rules"
                          className={({ isActive }) => subNavItemClass(isActive)}
                          onClick={() => onMobileClose()}
                        >
                          <div className="flex items-center gap-2">
                            <Sliders className="w-3.5 h-3.5 opacity-60" />
                            <span>Rules Engine</span>
                          </div>
                        </NavLink>
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    to="/payroll/salary-structures"
                    title="Salary Configuration"
                    className={({ isActive }) => navItemClass(isActive)}
                    onClick={() => onMobileClose()}
                  >
                    <Layers className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                  </NavLink>
                )
              )}
            </nav>
          </div>
        )}

        {/* SECTION: ADMINISTRATION */}
        {(isAdmin || canManageHR || canManagePayroll) && (
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Administration
              </div>
            )}
            <nav className="space-y-1">
              <NavLink
                to="/audit-logs"
                title={isCollapsed ? 'Audit & Health' : undefined}
                className={({ isActive }) => navItemClass(isActive)}
                onClick={() => onMobileClose()}
              >
                <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                {!isCollapsed && <span>Audit & Health</span>}
              </NavLink>

              {isAdmin && (
                <NavLink
                  to="/users"
                  title={isCollapsed ? 'Users & Roles' : undefined}
                  className={({ isActive }) => navItemClass(isActive)}
                  onClick={() => onMobileClose()}
                >
                  <Settings className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                  {!isCollapsed && <span>Users & Roles</span>}
                </NavLink>
              )}
            </nav>
          </div>
        )}

      </div>

      {/* Sidebar Collapse Toggle (Desktop only) */}
      <div className="hidden md:flex p-3 border-t border-slate-800/80 items-center justify-between">
        {!isCollapsed && (
          <span className="text-[11px] text-slate-500 font-medium pl-1">
            v2026.1 Enterprise
          </span>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-auto cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-300 z-30 sticky top-0 h-screen ${
          isCollapsed ? 'w-18' : 'w-64'
        }`}
      >
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-fadeIn"
            onClick={onMobileClose}
          />
          <div className="relative w-64 h-full z-10 animate-scaleIn">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
