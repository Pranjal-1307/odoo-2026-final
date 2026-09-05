import React from 'react';
import { Building2, Users } from 'lucide-react';
import type { DepartmentPayrollItem } from '../../types';

interface DepartmentBreakdownWidgetProps {
  departments: DepartmentPayrollItem[];
  canViewFinancials: boolean;
}

export const DepartmentBreakdownWidget: React.FC<DepartmentBreakdownWidgetProps> = ({
  departments,
  canViewFinancials,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const colors = ['bg-[#714B67]', 'bg-emerald-500', 'bg-blue-500', 'bg-amber-500', 'bg-purple-400', 'bg-indigo-400'];

  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#714B67]" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Department Distribution</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            {departments.length} Units
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Headcount and payroll weight by organizational unit</p>

        {/* Stacked Breakdown Bar */}
        {departments.length > 0 && (
          <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100 mb-4 shadow-inner">
            {departments.map((dept, idx) => (
              <div
                key={dept.department}
                style={{ width: `${Math.max(dept.percentage_of_total, 4)}%` }}
                className={`${colors[idx % colors.length]} transition-all hover:opacity-90`}
                title={`${dept.department}: ${dept.percentage_of_total}%`}
              />
            ))}
          </div>
        )}

        {/* Department List */}
        <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
          {departments.map((dept, idx) => (
            <div key={dept.department} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]} shrink-0`} />
                <span className="font-semibold text-slate-800 truncate">{dept.department}</span>
                <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-0.5">
                  <Users className="w-2.5 h-2.5" />
                  {dept.employee_count} emps
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canViewFinancials && (
                  <span className="font-bold text-slate-700">{formatCurrency(dept.gross_amount)}</span>
                )}
                <span className="text-[10px] font-bold text-[#714B67] bg-purple-50 px-1.5 py-0.5 rounded">
                  {dept.percentage_of_total}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
