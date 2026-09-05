import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, Calendar, PieChart, Receipt } from 'lucide-react';
import type { Employee } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface EmployeeSmartButtonsProps {
  employee: Employee;
}

export const EmployeeSmartButtons: React.FC<EmployeeSmartButtonsProps> = ({ employee }) => {
  const navigate = useNavigate();
  const { canManageHR, canManagePayroll, isEmployee } = useAuth();

  const buttons = [
    {
      id: 'contracts',
      label: 'Contracts',
      count: employee.contract_count ?? (employee as any).contracts_count ?? 0,
      icon: FileText,
      color: 'text-indigo-600 group-hover:text-indigo-700',
      bgColor: 'bg-indigo-50/70 border-indigo-100 group-hover:border-indigo-300 group-hover:bg-indigo-100/60',
      visible: canManageHR,
      onClick: () => navigate(`/contracts?employee_id=${employee.id}`)
    },
    {
      id: 'attendance',
      label: 'Attendance',
      count: employee.attendance_count ?? (employee as any).attendance_count ?? 0,
      icon: Clock,
      color: 'text-emerald-600 group-hover:text-emerald-700',
      bgColor: 'bg-emerald-50/70 border-emerald-100 group-hover:border-emerald-300 group-hover:bg-emerald-100/60',
      visible: true,
      onClick: () => navigate(`/attendance?employee_id=${employee.id}`)
    },
    {
      id: 'time-off',
      label: 'Time Off',
      count: employee.time_off_count ?? (employee as any).time_off_count ?? 0,
      icon: Calendar,
      color: 'text-amber-600 group-hover:text-amber-700',
      bgColor: 'bg-amber-50/70 border-amber-100 group-hover:border-amber-300 group-hover:bg-amber-100/60',
      visible: true,
      onClick: () => navigate(`/time-off/requests?employee_id=${employee.id}`)
    },
    {
      id: 'allocations',
      label: 'Allocations',
      count: employee.allocation_count ?? (employee as any).allocations_count ?? 0,
      icon: PieChart,
      color: 'text-cyan-600 group-hover:text-cyan-700',
      bgColor: 'bg-cyan-50/70 border-cyan-100 group-hover:border-cyan-300 group-hover:bg-cyan-100/60',
      visible: true,
      onClick: () => navigate(`/time-off/allocations?employee_id=${employee.id}`)
    },
    {
      id: 'payslips',
      label: 'Payslips',
      count: employee.payslip_count ?? (employee as any).payslips_count ?? 0,
      icon: Receipt,
      color: 'text-purple-600 group-hover:text-purple-700',
      bgColor: 'bg-purple-50/70 border-purple-100 group-hover:border-purple-300 group-hover:bg-purple-100/60',
      visible: canManagePayroll || isEmployee,
      onClick: () => navigate(`/payroll/payslips?employee_id=${employee.id}`)
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {buttons.filter(b => b.visible).map((btn) => {
        const Icon = btn.icon;
        return (
          <button
            key={btn.id}
            type="button"
            onClick={btn.onClick}
            className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left transition-all duration-150 shadow-sm hover:shadow hover:-translate-y-0.5 ${btn.bgColor}`}
            title={`View ${btn.label} for ${employee.name}`}
          >
            <div className={`p-1.5 rounded-md bg-white shadow-xs ${btn.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-800 leading-none">
                {btn.count}
              </span>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider leading-tight mt-0.5">
                {btn.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
