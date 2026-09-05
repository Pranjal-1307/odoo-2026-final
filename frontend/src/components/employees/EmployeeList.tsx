import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpDown, ChevronRight, UserCheck } from 'lucide-react';
import type { Employee } from '../../types';

interface EmployeeListProps {
  employees: Employee[];
  loading?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: string) => void;
}

const getInitials = (name: string) => {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarBgColor = (name: string) => {
  const colors = [
    'from-purple-500 to-indigo-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export const EmployeeList: React.FC<EmployeeListProps> = ({
  employees,
  loading,
  sortBy,
  sortOrder,
  onSort
}) => {
  const navigate = useNavigate();

  const renderSortIcon = (field: string) => {
    return (
      <ArrowUpDown
        className={`w-3.5 h-3.5 inline ml-1 transition-colors ${
          sortBy === field ? 'text-odoo-purple' : 'text-slate-400 hover:text-slate-600'
        }`}
      />
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-pulse">
        <div className="h-12 bg-slate-100 border-b border-slate-200" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 border-b border-slate-100 flex items-center px-6 gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200" />
            <div className="w-1/4 h-4 bg-slate-200 rounded" />
            <div className="w-1/4 h-4 bg-slate-100 rounded" />
            <div className="w-1/6 h-4 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-purple-50 text-odoo-purple flex items-center justify-center mx-auto mb-3">
          <UserCheck className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-slate-800">No employees found</h3>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          No employee records match your search criteria or active filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500 select-none">
              <th
                onClick={() => onSort?.('name')}
                className="py-3.5 px-4 sm:px-6 cursor-pointer hover:bg-slate-100/70 transition-colors"
              >
                Employee {renderSortIcon('name')}
              </th>
              <th
                onClick={() => onSort?.('job_position')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
              >
                Job Position {renderSortIcon('job_position')}
              </th>
              <th
                onClick={() => onSort?.('department')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
              >
                Department {renderSortIcon('department')}
              </th>
              <th className="py-3.5 px-4">Manager</th>
              <th
                onClick={() => onSort?.('status')}
                className="py-3.5 px-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
              >
                Status {renderSortIcon('status')}
              </th>
              <th className="py-3.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {employees.map((emp) => {
              const isInactive = emp.status === 'inactive' || emp.status === 'terminated';
              const bgGradient = getAvatarBgColor(emp.name);
              const initials = getInitials(emp.name);

              return (
                <tr
                  key={emp.id}
                  onClick={() => navigate(`/employees/${emp.id}`)}
                  className={`group cursor-pointer transition-colors ${
                    isInactive
                      ? 'bg-slate-50/50 hover:bg-slate-100/60 opacity-80 hover:opacity-100'
                      : 'hover:bg-purple-50/40'
                  }`}
                >
                  {/* Employee: Avatar + Name + Code + Email */}
                  <td className="py-3.5 px-4 sm:px-6">
                    <div className="flex items-center gap-3">
                      {emp.avatar_url ? (
                        <img
                          src={emp.avatar_url}
                          alt={emp.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${bgGradient} text-white font-bold flex items-center justify-center text-xs shadow-xs border border-white`}
                        >
                          {initials}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 group-hover:text-odoo-purple transition-colors">
                            {emp.name}
                          </span>
                          <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {emp.employee_code}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">{emp.work_email}</span>
                      </div>
                    </div>
                  </td>

                  {/* Job Position */}
                  <td className="py-3.5 px-4">
                    <span className="font-medium text-slate-800">{emp.job_position}</span>
                    <div className="text-xs text-slate-400">{emp.employee_type || 'Full-Time'}</div>
                  </td>

                  {/* Department */}
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                      {emp.department}
                    </span>
                  </td>

                  {/* Manager */}
                  <td className="py-3.5 px-4 text-slate-600">
                    {emp.manager_name ? (
                      <span className="font-medium text-slate-800">{emp.manager_name}</span>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        emp.status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : emp.status === 'on_leave'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>

                  {/* Action Arrow */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex p-1 rounded-lg text-slate-400 group-hover:text-odoo-purple group-hover:bg-purple-100/50 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
